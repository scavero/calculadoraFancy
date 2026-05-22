const fs = require('fs');
const vm = require('vm');

const parserPath = 'c:/Users/SantosC/Desktop/AG/calculadoraFancy/parser.js';
const parserCode = fs.readFileSync(parserPath, 'utf8');

const context = {};
vm.createContext(context);
const MathParser = vm.runInContext(parserCode + '\nMathParser;', context);

const tests = [
    'real(x)',
    'imag(x)',
    'conj(x)',
    'arg(x)',
    'real(2+3i)',
    'imag(2+3i)',
    'conj(2+3i)',
    'arg(i)'
];

console.log('--- TEST COMPILATION AND EVALUATION OF GRAPH FUNCTIONS ---');
for (const expr of tests) {
    const compiled = MathParser.compile(expr);
    if (!compiled.isValid) {
        console.error(`FAIL compile: "${expr}" => ${compiled.error}`);
    } else {
        const val = compiled.evaluate(2.5, true); // Evaluate at x = 2.5
        console.log(`PASS: "${expr}" evaluated at x=2.5 => ${val.toString()}`);
    }
}
