/**
 * AETHER CALCULATOR ENGINE
 * Manages the state, input parsing, memory, and history of the 
 * classic and scientific calculator.
 */

class Calculator {
    constructor(formulaDisplayId, resultDisplayId, historyContainerId) {
        this.formulaDisplay = document.getElementById(formulaDisplayId);
        this.resultDisplay = document.getElementById(resultDisplayId);
        this.historyContainer = document.getElementById(historyContainerId);
        
        // Calculator State
        this.expression = '';
        this.lastResult = null;
        this.isRadianMode = true; // Radian mode by default
        this.history = this.loadHistory();
        
        this.updateDisplay();
        this.renderHistory();
    }

    /**
     * Appends characters to the current expression.
     * Includes helper to insert functions with parenthesis automatically.
     */
    append(value) {
        // If there was a previous result and we press a number, clear and start fresh.
        // If we press an operator, chain the previous result.
        if (this.lastResult !== null) {
            const isOperator = ['+', '-', '*', '/', '^', '%', 'mod'].includes(value) || 
                               ['div', 'mul', 'add', 'sub', 'pow', 'mod'].includes(value);
            if (!isOperator) {
                this.expression = '';
            } else {
                this.expression = this.lastResult.toString();
            }
            this.lastResult = null;
        }

        // Map button actions to formula formats
        const functionMappings = {
            'sin': 'sin(', 'cos': 'cos(', 'tan': 'tan(',
            'asin': 'asin(', 'acos': 'acos(', 'atan': 'atan(',
            'log': 'log(', 'ln': 'ln(', 'sqrt': 'sqrt(',
            'abs': 'abs(', 'exp': 'exp(', 'pow': '^',
            'pi': 'π', 'e': 'e',
            'conj': 'conj(', 'arg': 'arg(', 'real': 'real(', 'imag': 'imag('
        };

        if (functionMappings[value] !== undefined) {
            this.expression += functionMappings[value];
        } else if (value === 'mod') {
            this.expression += ' mod ';
        } else if (value === 'div') {
            this.expression += '÷';
        } else if (value === 'mul') {
            this.expression += '×';
        } else if (value === 'add') {
            this.expression += '+';
        } else if (value === 'sub') {
            this.expression += '-';
        } else {
            this.expression += value;
        }

        this.updateDisplay();
    }

    /**
     * Deletes the last character or token (like full function name "sin(")
     */
    backspace() {
        if (this.lastResult !== null) {
            this.lastResult = null;
        }

        if (this.expression.length === 0) return;

        // Check if expression ends with a function call (e.g. "sin(", "asin(", "sqrt(")
        const funcEnds = [
            'asin(', 'acos(', 'atan(', 'sin(', 'cos(', 'tan(', 
            'log(', 'sqrt(', 'abs(', 'exp(', 'ln(', ' mod ',
            'conj(', 'arg(', 'real(', 'imag('
        ];

        let deleted = false;
        for (const f of funcEnds) {
            if (this.expression.endsWith(f)) {
                this.expression = this.expression.slice(0, -f.length);
                deleted = true;
                break;
            }
        }

        if (!deleted) {
            this.expression = this.expression.slice(0, -1);
        }

        this.updateDisplay();
    }

    /**
     * Clears all inputs and results.
     */
    clearAll() {
        this.expression = '';
        this.lastResult = null;
        this.updateDisplay();
    }

    /**
     * Toggles angle calculation unit between Radians (RAD) and Degrees (DEG).
     */
    toggleDegRad(btnId) {
        this.isRadianMode = !this.isRadianMode;
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.textContent = this.isRadianMode ? 'RAD' : 'DEG';
            btn.classList.toggle('active', !this.isRadianMode);
        }
    }

    /**
     * Smart parenthesis placement:
     * - If expression is empty or ends with operator/open parenthesis -> add "("
     * - If expression has unbalanced open parentheses -> add ")"
     * - Otherwise -> add "("
     */
    insertParenthesis() {
        if (this.lastResult !== null) {
            this.expression = '';
            this.lastResult = null;
        }

        // Count current parentheses balance
        let openCount = 0;
        for (const char of this.expression) {
            if (char === '(') openCount++;
            if (char === ')') openCount--;
        }

        const lastChar = this.expression.slice(-1);
        const isOpenParenthesisNeeded = 
            this.expression.length === 0 || 
            '+-×÷^( '.includes(lastChar) ||
            this.expression.endsWith('mod ');

        if (isOpenParenthesisNeeded) {
            this.expression += '(';
        } else if (openCount > 0) {
            this.expression += ')';
        } else {
            this.expression += '(';
        }

        this.updateDisplay();
    }

    /**
     * Computes the factorial of the current number or wraps expression in factorial.
     */
    applyFactorial() {
        if (this.expression.length === 0) return;
        this.expression += '!';
        this.updateDisplay();
    }

    /**
     * Performs math compilation and evaluation.
     */
    evaluate() {
        if (this.expression.length === 0) return;

        // Replace factorial symbol '!' with function call 'fact()' for the parser.
        // e.g. "5!" -> "fact(5)", "(3+2)!" -> "fact((3+2))"
        // Let's do a simple regex mapping for common factorial cases
        let parsedExpr = this.expression;
        
        // Match numbers or parenthesized blocks preceding !
        // This is a simple regex that finds digits+dots preceding ! (e.g. 5!) or parenthesized expressions (e.g. (3+2)!)
        while (parsedExpr.includes('!')) {
            const index = parsedExpr.indexOf('!');
            // Look backwards to find operand
            let openParenCount = 0;
            let startIdx = index - 1;
            
            if (parsedExpr[startIdx] === ')') {
                openParenCount = 1;
                startIdx--;
                while (startIdx >= 0 && openParenCount > 0) {
                    if (parsedExpr[startIdx] === ')') openParenCount++;
                    if (parsedExpr[startIdx] === '(') openParenCount--;
                    startIdx--;
                }
                startIdx++; // Adjust index
            } else {
                while (startIdx >= 0 && /[0-9.xpiπe]/i.test(parsedExpr[startIdx])) {
                    startIdx--;
                }
                startIdx++;
            }
            
            const operand = parsedExpr.substring(startIdx, index);
            parsedExpr = parsedExpr.substring(0, startIdx) + `fact(${operand})` + parsedExpr.substring(index + 1);
        }

        // Compile expression
        const compiled = MathParser.compile(parsedExpr);
        
        if (compiled.isValid) {
            const res = compiled.evaluate(0, this.isRadianMode); // xVal is 0 in standard calculator mode

            const isResNaN = isNaN(res.re) || isNaN(res.im);
            const isResInfinite = !isFinite(res.re) || !isFinite(res.im);

            if (isResNaN) {
                this.showError('Resultado indefinido');
            } else if (isResInfinite) {
                this.showError('División por cero o infinito');
            } else {
                const formattedResult = res.toString();
                
                if (formattedResult === 'Error') {
                    this.showError('Resultado indefinido');
                } else {
                    // Add to history
                    this.addHistoryItem(this.expression, formattedResult);
                    
                    // Update display
                    this.formulaDisplay.textContent = this.expression + ' =';
                    this.resultDisplay.textContent = formattedResult;
                    
                    // Save state
                    this.lastResult = formattedResult;
                    this.expression = formattedResult;
                }
            }
        } else {
            this.showError(compiled.error || 'Error de Sintaxis');
        }
    }

    showError(msg) {
        this.formulaDisplay.textContent = this.expression;
        this.resultDisplay.textContent = 'Error';
        this.formulaDisplay.title = msg; // Hover to see description
        this.lastResult = null;
        
        // Temp glow red display on error
        this.resultDisplay.style.color = 'var(--color-pink)';
        setTimeout(() => {
            this.resultDisplay.style.color = '';
        }, 1000);
    }

    updateDisplay() {
        this.formulaDisplay.textContent = this.expression || '';
        this.resultDisplay.textContent = this.expression ? '...' : '0';
        this.formulaDisplay.title = '';
    }

    /* ==========================================================================
       HISTORY MANAGEMENT (LocalStorage persisted)
       ========================================================================== */
    loadHistory() {
        try {
            const data = localStorage.getItem('aether_calc_history');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    saveHistory() {
        try {
            localStorage.setItem('aether_calc_history', JSON.stringify(this.history));
        } catch (e) {}
    }

    addHistoryItem(expr, result) {
        // Prevent duplicate consecutive entries
        if (this.history.length > 0 && this.history[0].expr === expr) return;

        this.history.unshift({ expr, result });
        
        // Limit to 20 items
        if (this.history.length > 20) {
            this.history.pop();
        }
        
        this.saveHistory();
        this.renderHistory();
    }

    clearHistory() {
        this.history = [];
        this.saveHistory();
        this.renderHistory();
    }

    renderHistory() {
        if (!this.historyContainer) return;
        
        if (this.history.length === 0) {
            this.historyContainer.innerHTML = '<div class="history-empty">No hay cálculos recientes</div>';
            return;
        }

        this.historyContainer.innerHTML = this.history.map((item, idx) => `
            <div class="history-item glass-panel" data-index="${idx}">
                <div class="history-expr">${item.expr}</div>
                <div class="history-result">${item.result}</div>
            </div>
        `).join('');

        // Attach click listeners to history items
        this.historyContainer.querySelectorAll('.history-item').forEach(el => {
            el.addEventListener('click', () => {
                const idx = parseInt(el.getAttribute('data-index'));
                const item = this.history[idx];
                this.expression = item.expr;
                this.lastResult = null;
                this.updateDisplay();
                
                // Auto close history on click for better flow on mobile
                const historyPanel = document.getElementById('history-panel');
                if (historyPanel) historyPanel.classList.remove('open');
            });
        });
    }
}
