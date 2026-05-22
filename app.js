/**
 * AETHER APP ENTRY POINT
 * Coordinates mode switching, keypad event bindings, keyboard handlers,
 * live graphing function list synchronization, and history panel sliding.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Mode Elements
    const appContainer = document.querySelector('.app-container');
    const modeTitle = document.getElementById('current-mode-title');
    const classicModeBtn = document.getElementById('btn-mode-classic');
    const scientificModeBtn = document.getElementById('btn-mode-scientific');
    const graphingModeBtn = document.getElementById('btn-mode-graphing');
    
    // Panel Elements
    const calculatorPanel = document.getElementById('calculator-panel');
    const graphingPanel = document.getElementById('graphing-panel');
    
    // History Panel Elements
    const historyPanel = document.getElementById('history-panel');
    const toggleHistoryBtn = document.getElementById('btn-toggle-history');
    const closeHistoryBtn = document.getElementById('btn-close-history');
    const clearHistoryBtn = document.getElementById('btn-clear-history');
    const historyListContainer = document.getElementById('history-list-container');

    // Grapher UI Elements
    const btnAddFunction = document.getElementById('btn-add-function');
    const functionsContainer = document.getElementById('functions-container');
    const btnZoomIn = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');
    const btnZoomHome = document.getElementById('btn-zoom-home');

    // Instantiate cores
    const calc = new Calculator('formula-display', 'result-display', 'history-list-container');
    const grapher = new FunctionGrapher('graph-canvas', 'graph-coords');

    // Active calculator keys (all buttons in calculator panel grid)
    const calcKeys = document.querySelectorAll('#calculator-panel .btn');

    /* ==========================================================================
       MODE SWITCHING
       ========================================================================== */
    function setMode(mode) {
        // Toggle active buttons
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        
        // Hide all panels
        calculatorPanel.classList.remove('active');
        graphingPanel.classList.remove('active');

        // Reset mode attribute on container
        appContainer.setAttribute('data-active-mode', mode);

        if (mode === 'classic') {
            classicModeBtn.classList.add('active');
            calculatorPanel.classList.add('active');
            modeTitle.textContent = 'Calculadora Clásica';
        } else if (mode === 'scientific') {
            scientificModeBtn.classList.add('active');
            calculatorPanel.classList.add('active');
            modeTitle.textContent = 'Calculadora Científica';
        } else if (mode === 'graphing') {
            graphingModeBtn.classList.add('active');
            graphingPanel.classList.add('active');
            modeTitle.textContent = 'Graficador de Funciones';
            
            // Re-render/adjust graph canvas to ensure coordinates fit
            setTimeout(() => {
                grapher.resize();
            }, 100);
        }
    }

    // Attach Mode Button Listeners
    classicModeBtn.addEventListener('click', () => setMode('classic'));
    scientificModeBtn.addEventListener('click', () => setMode('scientific'));
    graphingModeBtn.addEventListener('click', () => setMode('graphing'));

    // Set initial mode
    setMode('classic');

    /* ==========================================================================
       CALCULATOR KEYBOARD & CLICK EVENT BINDINGS
       ========================================================================== */
    calcKeys.forEach(key => {
        key.addEventListener('click', () => {
            const val = key.getAttribute('data-val');
            const action = key.getAttribute('data-action');

            // Visual active feedback
            key.classList.add('active-tap');
            setTimeout(() => key.classList.remove('active-tap'), 80);

            if (val) {
                calc.append(val);
            } else if (action) {
                switch(action) {
                    case 'clear-all':
                        calc.clearAll();
                        break;
                    case 'backspace':
                        calc.backspace();
                        break;
                    case 'parenthesis':
                        calc.insertParenthesis();
                        break;
                    case 'fact':
                        calc.applyFactorial();
                        break;
                    case 'deg-rad':
                        calc.toggleDegRad('btn-deg-rad');
                        break;
                    default:
                        // Action matches operators like sin, cos, ln, add, mul
                        calc.append(action);
                        break;
                }
            } else if (key.id === 'btn-equals') {
                calc.evaluate();
            }
        });
    });

    // Global physical keyboard listener
    window.addEventListener('keydown', (e) => {
        const mode = appContainer.getAttribute('data-active-mode');
        
        // If typing inside an input element (like the function text box), ignore global hotkeys
        if (document.activeElement.tagName === 'INPUT') return;

        // Active mode-specific keyboard bindings
        if (mode === 'classic' || mode === 'scientific') {
            if (e.key >= '0' && e.key <= '9') {
                calc.append(e.key);
            } else if (e.key === '.') {
                calc.append('.');
            } else if (e.key === 'i' || e.key === 'I') {
                calc.append('i');
            } else if (e.key === '+') {
                calc.append('add');
            } else if (e.key === '-') {
                calc.append('sub');
            } else if (e.key === '*') {
                calc.append('mul');
            } else if (e.key === '/') {
                calc.append('div');
            } else if (e.key === '%') {
                calc.append('mod');
            } else if (e.key === '^') {
                calc.append('pow');
            } else if (e.key === '(') {
                calc.append('(');
            } else if (e.key === ')') {
                calc.append(')');
            } else if (e.key === 'Enter') {
                e.preventDefault();
                calc.evaluate();
            } else if (e.key === 'Backspace') {
                calc.backspace();
            } else if (e.key === 'Escape') {
                calc.clearAll();
            }
        }
    });

    /* ==========================================================================
       HISTORY SLIDEOUT ACTION
       ========================================================================== */
    toggleHistoryBtn.addEventListener('click', () => {
        historyPanel.classList.toggle('open');
    });

    closeHistoryBtn.addEventListener('click', () => {
        historyPanel.classList.remove('open');
    });

    clearHistoryBtn.addEventListener('click', () => {
        calc.clearHistory();
    });

    // Close history clicking outside
    window.addEventListener('mousedown', (e) => {
        if (historyPanel.classList.contains('open') && 
            !historyPanel.contains(e.target) && 
            !toggleHistoryBtn.contains(e.target)) {
            historyPanel.classList.remove('open');
        }
    });

    /* ==========================================================================
       GRAPHING FUNCTIONS LIST & INPUT MANAGEMENT
       ========================================================================== */
    let functionCounter = 0;

    /**
     * Appends a new mathematical function row inside the left side-panel
     */
    function addFunctionRow(initialExpression = '') {
        const id = `func-${functionCounter++}`;
        const color = grapher.getNextColor(grapher.functions.length);

        // Create DOM element
        const row = document.createElement('div');
        row.className = 'function-row';
        row.id = id;
        row.innerHTML = `
            <div class="function-header">
                <div class="color-indicator" style="color: ${color}; background-color: ${color}"></div>
                <span class="function-title">f${grapher.functions.length + 1}(x)</span>
                <button class="delete-func-btn" title="Eliminar">
                    <svg viewBox="0 0 24 24" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                </button>
            </div>
            <div class="function-input-wrapper">
                <span class="function-prefix">=</span>
                <input type="text" class="function-input" value="${initialExpression}" placeholder="Introduce expresión" autocomplete="off" spellcheck="false">
            </div>
            <div class="function-error" style="display: none;"></div>
        `;

        functionsContainer.appendChild(row);

        const input = row.querySelector('.function-input');
        const errorEl = row.querySelector('.function-error');
        const btnDelete = row.querySelector('.delete-func-btn');

        // Function state object
        const fnObj = {
            id: id,
            exprString: initialExpression,
            compiledExpr: MathParser.compile(initialExpression),
            color: color,
            active: true
        };

        grapher.functions.push(fnObj);

        // Show/hide error helper
        function updateFunctionValidation() {
            if (fnObj.exprString.trim() === '') {
                fnObj.compiledExpr = null;
                errorEl.style.display = 'none';
                return;
            }

            fnObj.compiledExpr = MathParser.compile(fnObj.exprString);
            if (!fnObj.compiledExpr.isValid) {
                errorEl.textContent = fnObj.compiledExpr.error;
                errorEl.style.display = 'block';
            } else {
                errorEl.style.display = 'none';
            }
        }

        // Live input typing handler with debounced plotting
        let debounceTimer;
        input.addEventListener('input', (e) => {
            fnObj.exprString = e.target.value;
            
            // Check validation instantly for error indicator
            updateFunctionValidation();

            // Debounce canvas redraw to avoid stutter during fast typing
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                grapher.requestRedraw();
            }, 100);
        });

        // Focus keyboard support
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                input.blur();
            }
        });

        // Delete Row
        btnDelete.addEventListener('click', () => {
            row.style.transform = 'scale(0.85)';
            row.style.opacity = '0';
            setTimeout(() => {
                // Remove from grapher functions array
                grapher.functions = grapher.functions.filter(f => f.id !== id);
                row.remove();
                
                // Re-label functions in UI (e.g. f1, f2, f3) for clarity
                const rows = functionsContainer.querySelectorAll('.function-row');
                rows.forEach((r, idx) => {
                    r.querySelector('.function-title').textContent = `f${idx + 1}(x)`;
                });

                grapher.requestRedraw();
            }, 150);
        });

        // Initial validation and redraw
        updateFunctionValidation();
        grapher.requestRedraw();
    }

    // Default functions to populate graph initially
    addFunctionRow('sin(x) * x');
    addFunctionRow('cos(x)');

    // Add function click event
    btnAddFunction.addEventListener('click', () => {
        addFunctionRow('');
        // Focus the newly added input
        setTimeout(() => {
            const inputs = functionsContainer.querySelectorAll('.function-input');
            if (inputs.length > 0) {
                inputs[inputs.length - 1].focus();
            }
        }, 50);
    });

    /* ==========================================================================
       CANVAS ZOOM & RESET CONTROLS
       ========================================================================== */
    btnZoomIn.addEventListener('click', () => {
        const cx = grapher.canvas.width / (2 * window.devicePixelRatio);
        const cy = grapher.canvas.height / (2 * window.devicePixelRatio);
        grapher.zoomAtPixel(1.3, cx, cy);
    });

    btnZoomOut.addEventListener('click', () => {
        const cx = grapher.canvas.width / (2 * window.devicePixelRatio);
        const cy = grapher.canvas.height / (2 * window.devicePixelRatio);
        grapher.zoomAtPixel(1 / 1.3, cx, cy);
    });

    btnZoomHome.addEventListener('click', () => {
        grapher.resetView();
    });
});
