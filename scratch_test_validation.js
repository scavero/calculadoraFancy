function validateRPNStructure(rpnQueue) {
    let stackSize = 0;
    for (const token of rpnQueue) {
        if (token.type === 'NUMBER' || token.type === 'CONSTANT' || token.type === 'VARIABLE') {
            stackSize++;
        } else if (token.type === 'FUNCTION') {
            if (stackSize < 1) {
                throw new Error(`Parámetros insuficientes para la función "${token.value}"`);
            }
        } else if (token.type === 'OPERATOR') {
            const op = token.value;
            if (op === 'u-') {
                if (stackSize < 1) {
                    throw new Error('Parámetros insuficientes para el operador "-" unario');
                }
            } else {
                if (stackSize < 2) {
                    throw new Error(`Parámetros insuficientes para el operador "${op}"`);
                }
                stackSize--;
            }
        }
    }
    if (stackSize !== 1) {
        throw new Error('Expresión mal formulada (sobran operandos)');
    }
}

const fs = require('fs');
const vm = require('vm');

const parserPath = 'c:/Users/SantosC/Desktop/AG/calculadoraFancy/parser.js';
let parserCode = fs.readFileSync(parserPath, 'utf8');

// Inject validateRPNStructure into the MathParser compile function
// We will replace the start of compile() with the new logic
const validationCode = validateRPNStructure.toString();
parserCode = parserCode.replace(
    'function compile(expression) {',
    `${validationCode}\n    function compile(expression) {`
);
parserCode = parserCode.replace(
    'const rpn = shuntingYard(processedTokens);',
    'const rpn = shuntingYard(processedTokens);\n            validateRPNStructure(rpn);'
);

const context = {};
vm.createContext(context);
const MathParser = vm.runInContext(parserCode + '\nMathParser;', context);

const tests = [
    { expr: 'sin(x)', valid: true },
    { expr: 'x + 2', valid: true },
    { expr: 'sin()', valid: false },
    { expr: 'sin(x)+', valid: false },
    { expr: '+', valid: false },
    { expr: '*', valid: false },
    { expr: 'x y', valid: true } // Implicit multiplication: x * y -> which is variable x and variable y? Wait, 'y' is unknown, but what about 'x x'?
];

console.log('--- TESTING COMPILE-TIME RPN VALIDATION ---');
for (const tc of tests) {
    try {
        const compiled = MathParser.compile(tc.expr);
        if (compiled.isValid === tc.valid) {
            console.log(`PASS: "${tc.expr}" isValid = ${compiled.isValid} (Expected: ${tc.valid})`);
            if (!compiled.isValid) {
                console.log(`      Error: ${compiled.error}`);
            }
        } else {
            console.error(`FAIL: "${tc.expr}" isValid = ${compiled.isValid} (Expected: ${tc.valid})`);
        }
    } catch (e) {
        console.error(`FAIL: "${tc.expr}" threw: ${e.message}`);
    }
}
