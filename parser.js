/**
 * AETHER MATHEMATICAL EXPRESSION PARSER (COMPLEX ALGEBRA EDITION)
 * Evaluates mathematical formulas by parsing them into Reverse Polish Notation (RPN)
 * using the Shunting-Yard algorithm and evaluating them using Complex number arithmetic.
 */

class Complex {
    constructor(re = 0, im = 0) {
        this.re = re === 0 ? 0 : re;
        this.im = im === 0 ? 0 : im;
    }

    add(other) {
        return new Complex(this.re + other.re, this.im + other.im);
    }

    sub(other) {
        return new Complex(this.re - other.re, this.im - other.im);
    }

    mul(other) {
        return new Complex(
            this.re * other.re - this.im * other.im,
            this.re * other.im + this.im * other.re
        );
    }

    div(other) {
        const denom = other.re * other.re + other.im * other.im;
        if (denom === 0) return new Complex(NaN, NaN);
        return new Complex(
            (this.re * other.re + this.im * other.im) / denom,
            (this.im * other.re - this.re * other.im) / denom
        );
    }

    neg() {
        return new Complex(-this.re, -this.im);
    }

    pow(other) {
        // Complex power: w^z = exp(z * ln(w))
        const r = Math.hypot(this.re, this.im);
        if (r === 0) {
            if (other.re === 0 && other.im === 0) return new Complex(1, 0); // 0^0 = 1
            return new Complex(0, 0); // 0^z = 0
        }
        const theta = Math.atan2(this.im, this.re);
        const ln_r = Math.log(r);

        // z * ln(w) = (other.re + i other.im) * (ln_r + i theta)
        const re_part = other.re * ln_r - other.im * theta;
        const im_part = other.im * ln_r + other.re * theta;

        const exp_a = Math.exp(re_part);
        return new Complex(
            exp_a * Math.cos(im_part),
            exp_a * Math.sin(im_part)
        );
    }

    sqrt() {
        const r = Math.hypot(this.re, this.im);
        const theta = Math.atan2(this.im, this.re);
        const sqrt_r = Math.sqrt(r);
        return new Complex(
            sqrt_r * Math.cos(theta / 2),
            sqrt_r * Math.sin(theta / 2)
        );
    }

    abs() {
        return new Complex(Math.hypot(this.re, this.im), 0);
    }

    conj() {
        return new Complex(this.re, -this.im);
    }

    arg(isRad = true) {
        let theta = Math.atan2(this.im, this.re);
        if (!isRad) theta = (theta * 180) / Math.PI;
        return new Complex(theta, 0);
    }

    ln() {
        const r = Math.hypot(this.re, this.im);
        const theta = Math.atan2(this.im, this.re);
        return new Complex(Math.log(r), theta);
    }

    log() {
        const ln_z = this.ln();
        return ln_z.div(new Complex(Math.log(10), 0));
    }

    exp() {
        const exp_x = Math.exp(this.re);
        return new Complex(
            exp_x * Math.cos(this.im),
            exp_x * Math.sin(this.im)
        );
    }

    sin(isRad = true) {
        const x = isRad ? this.re : (this.re * Math.PI) / 180;
        const y = this.im;
        return new Complex(
            Math.sin(x) * Math.cosh(y),
            Math.cos(x) * Math.sinh(y)
        );
    }

    cos(isRad = true) {
        const x = isRad ? this.re : (this.re * Math.PI) / 180;
        const y = this.im;
        return new Complex(
            Math.cos(x) * Math.cosh(y),
            -Math.sin(x) * Math.sinh(y)
        );
    }

    tan(isRad = true) {
        return this.sin(isRad).div(this.cos(isRad));
    }

    asin(isRad = true) {
        // asin(z) = -i * ln(i*z + sqrt(1 - z^2))
        const z = this;
        const one = new Complex(1, 0);
        const i = new Complex(0, 1);
        const z_sq = z.mul(z);
        const one_minus_z_sq = one.sub(z_sq);
        const sqrt_term = one_minus_z_sq.sqrt();
        const i_z = i.mul(z);
        const sum = i_z.add(sqrt_term);
        const ln_term = sum.ln();
        const res = i.neg().mul(ln_term);
        
        if (!isRad) {
            return new Complex((res.re * 180) / Math.PI, (res.im * 180) / Math.PI);
        }
        return res;
    }

    acos(isRad = true) {
        // acos(z) = pi/2 - asin(z)
        const asin_z = this.asin(isRad);
        const half_pi = new Complex(isRad ? Math.PI / 2 : 90, 0);
        return half_pi.sub(asin_z);
    }

    atan(isRad = true) {
        // atan(z) = 0.5 * i * (ln(1 - i*z) - ln(1 + i*z))
        const z = this;
        const i = new Complex(0, 1);
        const one = new Complex(1, 0);
        const half_i = new Complex(0, 0.5);
        const i_z = i.mul(z);
        const one_minus_i_z = one.sub(i_z);
        const one_plus_i_z = one.add(i_z);
        const ln1 = one_minus_i_z.ln();
        const ln2 = one_plus_i_z.ln();
        const diff = ln1.sub(ln2);
        const res = half_i.mul(diff);
        
        if (!isRad) {
            return new Complex((res.re * 180) / Math.PI, (res.im * 180) / Math.PI);
        }
        return res;
    }

    toString() {
        const threshold = 1e-11;
        let r = this.re;
        let i = this.im;

        if (Math.abs(r) < threshold) r = 0;
        if (Math.abs(i) < threshold) i = 0;

        if (isNaN(r) || isNaN(i)) return 'Error';

        r = Number(r.toFixed(10));
        i = Number(i.toFixed(10));

        if (r === 0 && i === 0) return '0';
        if (i === 0) return r.toString();
        if (r === 0) {
            if (i === 1) return 'i';
            if (i === -1) return '-i';
            return i.toString() + 'i';
        }
        
        if (i > 0) {
            if (i === 1) return `${r} + i`;
            return `${r} + ${i}i`;
        } else {
            if (i === -1) return `${r} - i`;
            return `${r} - ${Math.abs(i)}i`;
        }
    }
}

const MathParser = (() => {
    // Arithmetic operations on Complex objects
    const OPERATORS = {
        '+': { precedence: 2, associativity: 'L', exec: (a, b) => a.add(b) },
        '-': { precedence: 2, associativity: 'L', exec: (a, b) => a.sub(b) },
        '*': { precedence: 3, associativity: 'L', exec: (a, b) => a.mul(b) },
        '/': { precedence: 3, associativity: 'L', exec: (a, b) => a.div(b) },
        'mod': { precedence: 3, associativity: 'L', exec: (a, b) => new Complex(a.re % b.re, 0) }, // Mod is real-only
        '^': { precedence: 4, associativity: 'R', exec: (a, b) => a.pow(b) },
        'u-': { precedence: 5, associativity: 'R', exec: (a) => a.neg() }
    };

    const FUNCTIONS = {
        'sin': (z, rad = true) => z.sin(rad),
        'cos': (z, rad = true) => z.cos(rad),
        'tan': (z, rad = true) => z.tan(rad),
        'asin': (z, rad = true) => z.asin(rad),
        'acos': (z, rad = true) => z.acos(rad),
        'atan': (z, rad = true) => z.atan(rad),
        'log': (z) => z.log(),
        'ln': (z) => z.ln(),
        'sqrt': (z) => z.sqrt(),
        'abs': (z) => z.abs(),
        'conj': (z) => z.conj(),
        'arg': (z, rad = true) => z.arg(rad),
        'exp': (z) => z.exp(),
        'fact': (z) => new Complex(factorial(z.re), 0),
        'real': (z) => new Complex(z.re, 0),
        'imag': (z) => new Complex(z.im, 0),
        're': (z) => new Complex(z.re, 0),
        'im': (z) => new Complex(z.im, 0)
    };

    const CONSTANTS = {
        'pi': new Complex(Math.PI, 0),
        'π': new Complex(Math.PI, 0),
        'e': new Complex(Math.E, 0),
        'i': new Complex(0, 1)
    };

    function factorial(n) {
        if (n < 0) return NaN;
        if (n === 0 || n === 1) return 1;
        if (!Number.isInteger(n)) {
            n = Math.floor(n);
        }
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
            if (result === Infinity) return Infinity;
        }
        return result;
    }

    function tokenize(expression) {
        const tokens = [];
        let i = 0;
        
        let cleanExpr = expression
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/\s+/g, '');

        while (i < cleanExpr.length) {
            const char = cleanExpr[i];

            if (/[0-9.]/.test(char)) {
                let numStr = '';
                while (i < cleanExpr.length && /[0-9.]/.test(cleanExpr[i])) {
                    numStr += cleanExpr[i];
                    i++;
                }
                tokens.push({ type: 'NUMBER', value: parseFloat(numStr) });
                continue;
            }

            if ('+-*/^()'.includes(char)) {
                tokens.push({ type: 'OPERATOR', value: char });
                i++;
                continue;
            }

            if (cleanExpr.substring(i, i + 3) === 'mod') {
                tokens.push({ type: 'OPERATOR', value: 'mod' });
                i += 3;
                continue;
            }

            if (/[a-zA-Zπ]/.test(char)) {
                let wordStr = '';
                while (i < cleanExpr.length && /[a-zA-Z0-9π]/.test(cleanExpr[i])) {
                    wordStr += cleanExpr[i];
                    i++;
                }
                
                const lowerWord = wordStr.toLowerCase();
                if (lowerWord === 'x') {
                    tokens.push({ type: 'VARIABLE', value: 'x' });
                } else if (CONSTANTS[lowerWord] !== undefined) {
                    tokens.push({ type: 'CONSTANT', value: lowerWord });
                } else if (FUNCTIONS[lowerWord] !== undefined) {
                    tokens.push({ type: 'FUNCTION', value: lowerWord });
                } else {
                    throw new Error(`Símbolo desconocido: "${wordStr}"`);
                }
                continue;
            }

            throw new Error(`Carácter inválido en la expresión: "${char}"`);
        }

        return tokens;
    }

    function preprocess(tokens) {
        const result = [];
        
        for (let i = 0; i < tokens.length; i++) {
            const curr = tokens[i];
            const prev = i > 0 ? tokens[i - 1] : null;

            if (curr.type === 'OPERATOR' && curr.value === '-') {
                if (!prev || (prev.type === 'OPERATOR' && prev.value !== ')') || prev.value === '(') {
                    result.push({ type: 'OPERATOR', value: 'u-' });
                    continue;
                }
            }

            if (curr.type === 'OPERATOR' && curr.value === '+') {
                if (!prev || (prev.type === 'OPERATOR' && prev.value !== ')') || prev.value === '(') {
                    continue;
                }
            }

            if (prev) {
                const isPrevValue = ['NUMBER', 'VARIABLE', 'CONSTANT'].includes(prev.type) || (prev.type === 'OPERATOR' && prev.value === ')');
                const isCurrValue = ['NUMBER', 'VARIABLE', 'CONSTANT', 'FUNCTION'].includes(curr.type) || (curr.type === 'OPERATOR' && curr.value === '(');

                if (isPrevValue && isCurrValue) {
                    result.push({ type: 'OPERATOR', value: '*' });
                }
            }

            result.push(curr);
        }

        return result;
    }

    function shuntingYard(tokens) {
        const outputQueue = [];
        const operatorStack = [];

        for (const token of tokens) {
            if (token.type === 'NUMBER' || token.type === 'VARIABLE' || token.type === 'CONSTANT') {
                outputQueue.push(token);
            } else if (token.type === 'FUNCTION') {
                operatorStack.push(token);
            } else if (token.type === 'OPERATOR') {
                const op = token.value;

                if (op === '(') {
                    operatorStack.push(token);
                } else if (op === ')') {
                    let top = operatorStack.pop();
                    while (top && top.value !== '(') {
                        outputQueue.push(top);
                        top = operatorStack.pop();
                    }
                    if (!top) {
                        throw new Error('Paréntesis desbalanceados (falta "(" )');
                    }
                    if (operatorStack.length > 0 && operatorStack[operatorStack.length - 1].type === 'FUNCTION') {
                        outputQueue.push(operatorStack.pop());
                    }
                } else {
                    const o1 = op;
                    let top = operatorStack[operatorStack.length - 1];

                    while (top && top.type === 'OPERATOR' && top.value !== '(') {
                        const o2 = top.value;
                        const p1 = OPERATORS[o1].precedence;
                        const p2 = OPERATORS[o2].precedence;
                        const assoc = OPERATORS[o1].associativity;

                        if ((assoc === 'L' && p1 <= p2) || (assoc === 'R' && p1 < p2)) {
                            outputQueue.push(operatorStack.pop());
                            top = operatorStack[operatorStack.length - 1];
                        } else {
                            break;
                        }
                    }
                    operatorStack.push(token);
                }
            }
        }

        while (operatorStack.length > 0) {
            const top = operatorStack.pop();
            if (top.value === '(' || top.value === ')') {
                throw new Error('Paréntesis desbalanceados (exceso de abiertos)');
            }
            outputQueue.push(top);
        }

        return outputQueue;
    }

    function evaluateRPN(rpnQueue, xVal = 0, isRad = true) {
        const stack = [];

        for (const token of rpnQueue) {
            if (token.type === 'NUMBER') {
                stack.push(new Complex(token.value, 0));
            } else if (token.type === 'CONSTANT') {
                stack.push(CONSTANTS[token.value]);
            } else if (token.type === 'VARIABLE') {
                stack.push(new Complex(xVal, 0));
            } else if (token.type === 'FUNCTION') {
                if (stack.length < 1) {
                    throw new Error(`Parámetros insuficientes para la función "${token.value}"`);
                }
                const arg = stack.pop();
                stack.push(FUNCTIONS[token.value](arg, isRad));
            } else if (token.type === 'OPERATOR') {
                const op = token.value;
                if (op === 'u-') {
                    if (stack.length < 1) {
                        throw new Error('Parámetros insuficientes para el operador "-" unario');
                    }
                    const arg = stack.pop();
                    stack.push(OPERATORS['u-'].exec(arg));
                } else {
                    if (stack.length < 2) {
                        throw new Error(`Parámetros insuficientes para el operador "${op}"`);
                    }
                    const val2 = stack.pop();
                    const val1 = stack.pop();
                    stack.push(OPERATORS[op].exec(val1, val2));
                }
            }
        }

        if (stack.length !== 1) {
            throw new Error('Expresión mal formulada (sobran operandos)');
        }

        return stack[0];
    }

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

    function compile(expression) {
        try {
            let cleanExpr = expression.trim();
            const prefixRegex = /^(?:y|f[a-zA-Z0-9_]*\s*\(\s*x\s*\))\s*=/i;
            if (prefixRegex.test(cleanExpr)) {
                cleanExpr = cleanExpr.replace(prefixRegex, '');
            }
            const rawTokens = tokenize(cleanExpr);
            const processedTokens = preprocess(rawTokens);
            const rpn = shuntingYard(processedTokens);
            validateRPNStructure(rpn);

            return {
                evaluate: (xVal = 0, isRad = true) => {
                    try {
                        return evaluateRPN(rpn, xVal, isRad);
                    } catch (e) {
                        return new Complex(NaN, NaN);
                    }
                },
                isValid: true,
                expression: expression
            };
        } catch (error) {
            return {
                evaluate: () => new Complex(NaN, NaN),
                isValid: false,
                error: error.message,
                expression: expression
            };
        }
    }

    return {
        compile: compile
    };
})();
