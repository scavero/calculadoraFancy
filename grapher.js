/**
 * AETHER INTERACTIVE FUNCTION GRAPHER
 * Manages the HTML5 <canvas> rendering, grid coordinates, mouse/touch dragging,
 * scroll zooming, and plotting curves with neon colors and glowing effects.
 */

class FunctionGrapher {
    constructor(canvasId, coordsId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.coordsEl = document.getElementById(coordsId);
        
        // Cartesian Coordinate Space state
        this.zoom = 45; // Pixels per math unit
        this.offsetX = 0; // Offset from canvas center in pixels
        this.offsetY = 0; // Offset from canvas center in pixels
        
        // Interactive state
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.mousePos = { x: 0, y: 0 }; // Current mouse position in pixels
        this.hoverMathCoords = { x: 0, y: 0 };
        this.isMouseOver = false;

        // List of functions to draw: { id, exprString, compiledExpr, color, active }
        this.functions = [];
        
        // Colors palette for function lines (neon glow)
        this.colorPalette = [
            '#00f2fe', // Cyan
            '#ff0844', // Hot Pink
            '#00cdac', // Emerald
            '#a18cd1', // Purple
            '#f5d020', // Yellow
            '#f857a6'  // Magenta
        ];

        // Bind events
        this.initEvents();
        this.resize();
    }

    /**
     * Set up mouse and touch interactions for panning and zooming.
     */
    initEvents() {
        // Window Resize
        window.addEventListener('resize', () => this.resize());

        // Mouse Down (Start Drag)
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.startX = e.clientX - this.offsetX;
            this.startY = e.clientY - this.offsetY;
            this.canvas.style.cursor = 'grabbing';
        });

        // Mouse Move (Drag & Coordinate Tracking)
        window.addEventListener('mousemove', (e) => {
            // Get mouse position relative to canvas
            const rect = this.canvas.getBoundingClientRect();
            this.mousePos.x = e.clientX - rect.left;
            this.mousePos.y = e.clientY - rect.top;

            this.isMouseOver = (
                this.mousePos.x >= 0 && 
                this.mousePos.x <= rect.width &&
                this.mousePos.y >= 0 && 
                this.mousePos.y <= rect.height
            );

            if (this.isDragging) {
                this.offsetX = e.clientX - this.startX;
                this.offsetY = e.clientY - this.startY;
                this.requestRedraw();
            } else if (this.isMouseOver) {
                // Update coordinates indicator
                const mathPt = this.pixelToMath(this.mousePos.x, this.mousePos.y);
                this.hoverMathCoords.x = mathPt.x;
                this.hoverMathCoords.y = mathPt.y;
                
                this.updateCoordsDisplay();
                this.requestRedraw(); // Redraw crosshair
            }
        });

        // Mouse Up (End Drag)
        window.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.canvas.style.cursor = 'crosshair';
            }
        });

        // Mouse Wheel (Zoom Relative to Cursor)
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            const zoomFactor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
            this.zoomAtPixel(zoomFactor, this.mousePos.x, this.mousePos.y);
        }, { passive: false });

        // Touch support (Mobile Panning and Zoom)
        let lastTouchDist = null;
        let lastTouchCenter = null;

        this.canvas.addEventListener('touchstart', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            if (e.touches.length === 1) {
                this.isDragging = true;
                this.startX = e.touches[0].clientX - this.offsetX;
                this.startY = e.touches[0].clientY - this.offsetY;
            } else if (e.touches.length === 2) {
                this.isDragging = false;
                lastTouchDist = this.getTouchDistance(e.touches);
                lastTouchCenter = this.getTouchCenter(e.touches, rect);
            }
        });

        this.canvas.addEventListener('touchmove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            if (e.touches.length === 1 && this.isDragging) {
                this.offsetX = e.touches[0].clientX - this.startX;
                this.offsetY = e.touches[0].clientY - this.startY;
                
                // Set mouse position for coordinate display
                this.mousePos.x = e.touches[0].clientX - rect.left;
                this.mousePos.y = e.touches[0].clientY - rect.top;
                const mathPt = this.pixelToMath(this.mousePos.x, this.mousePos.y);
                this.hoverMathCoords.x = mathPt.x;
                this.hoverMathCoords.y = mathPt.y;
                this.isMouseOver = true;
                
                this.updateCoordsDisplay();
                this.requestRedraw();
            } else if (e.touches.length === 2 && lastTouchDist && lastTouchCenter) {
                const currentDist = this.getTouchDistance(e.touches);
                const zoomFactor = currentDist / lastTouchDist;
                
                // Limit zoom rates
                const center = this.getTouchCenter(e.touches, rect);
                this.zoomAtPixel(zoomFactor, center.x, center.y);
                
                lastTouchDist = currentDist;
                lastTouchCenter = center;
            }
        });

        this.canvas.addEventListener('touchend', () => {
            this.isDragging = false;
            lastTouchDist = null;
            lastTouchCenter = null;
            this.isMouseOver = false;
            this.requestRedraw();
        });
    }

    /**
     * Zoom centered around a specific pixel coordinate
     */
    zoomAtPixel(zoomFactor, px, py) {
        // Find mathematical coordinate under pixel before zoom
        const mathPt = this.pixelToMath(px, py);
        
        // Apply zoom limits (5px to 2000px per math unit)
        const nextZoom = Math.max(5, Math.min(2000, this.zoom * zoomFactor));
        if (nextZoom === this.zoom) return;
        
        this.zoom = nextZoom;
        
        // Re-calculate offsets so that the math point stays exactly under the same pixel
        // mathX = (px - width/2 - offsetX) / zoom
        // => offsetX = px - width/2 - mathX * zoom
        this.offsetX = px - this.canvas.width / 2 - mathPt.x * this.zoom;
        this.offsetY = py - this.canvas.height / 2 + mathPt.y * this.zoom;
        
        this.requestRedraw();
    }

    getTouchDistance(touches) {
        return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
    }

    getTouchCenter(touches, rect) {
        return {
            x: (touches[0].clientX + touches[1].clientX) / 2 - rect.left,
            y: (touches[0].clientY + touches[1].clientY) / 2 - rect.top
        };
    }

    /**
     * Adapts canvas size to container dimensions.
     */
    resize() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        // Scale context
        this.ctx.resetTransform();
        this.ctx.scale(dpr, dpr);
        
        this.requestRedraw();
    }

    /**
     * Converts a mathematical coordinate to pixel space on canvas.
     */
    mathToPixel(x, y) {
        const cx = this.canvas.width / (2 * (window.devicePixelRatio || 1));
        const cy = this.canvas.height / (2 * (window.devicePixelRatio || 1));
        return {
            x: cx + this.offsetX + x * this.zoom,
            y: cy + this.offsetY - y * this.zoom // Y goes up in math, down in screen pixels
        };
    }

    /**
     * Converts a pixel coordinate to mathematical Cartesian space.
     */
    pixelToMath(px, py) {
        const cx = this.canvas.width / (2 * (window.devicePixelRatio || 1));
        const cy = this.canvas.height / (2 * (window.devicePixelRatio || 1));
        return {
            x: (px - cx - this.offsetX) / this.zoom,
            y: (cy - py + this.offsetY) / this.zoom
        };
    }

    /**
     * Triggers canvas redraw on the next animation frame.
     */
    requestRedraw() {
        if (!this.redrawQueued) {
            this.redrawQueued = true;
            requestAnimationFrame(() => {
                this.draw();
                this.redrawQueued = false;
            });
        }
    }

    /**
     * Dynamically calculates optimal grid spacing based on zoom scale
     */
    getGridStep() {
        const targetSpacingPixels = 80; // Ideal distance between grid lines
        const rawStep = targetSpacingPixels / this.zoom;
        const log = Math.log10(rawStep);
        const floorLog = Math.floor(log);
        const pow = Math.pow(10, floorLog);
        const ratio = rawStep / pow;

        if (ratio < 1.5) return 1 * pow;
        if (ratio < 3.5) return 2 * pow;
        if (ratio < 7.5) return 5 * pow;
        return 10 * pow;
    }

    /**
     * Format number for display on the axes
     */
    formatAxisLabel(val) {
        // Precision based on decimal place
        if (Math.abs(val) < 1e-10) return '0';
        
        // Remove floating point inaccuracies (e.g. 0.300000000000004)
        const str = Number(val.toFixed(8)).toString();
        return str;
    }

    /**
     * Renders grid lines, coordinate axes, curves, and tracking lines.
     */
    draw() {
        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);

        // Clear canvas
        this.ctx.clearRect(0, 0, width, height);

        const gridStep = this.getGridStep();
        const start = this.pixelToMath(0, height);
        const end = this.pixelToMath(width, 0);

        // 1. Draw Grid Lines
        this.ctx.lineWidth = 1;
        
        // Vertical grid lines
        let xStart = Math.ceil(start.x / gridStep) * gridStep;
        for (let x = xStart; x <= end.x; x += gridStep) {
            const pixelX = this.mathToPixel(x, 0).x;
            const isYAxis = Math.abs(x) < 1e-10;
            
            this.ctx.strokeStyle = isYAxis ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.05)';
            this.ctx.beginPath();
            this.ctx.moveTo(pixelX, 0);
            this.ctx.lineTo(pixelX, height);
            this.ctx.stroke();
        }

        // Horizontal grid lines
        let yStart = Math.ceil(start.y / gridStep) * gridStep;
        for (let y = yStart; y <= end.y; y += gridStep) {
            const pixelY = this.mathToPixel(0, y).y;
            const isXAxis = Math.abs(y) < 1e-10;
            
            this.ctx.strokeStyle = isXAxis ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.05)';
            this.ctx.beginPath();
            this.ctx.moveTo(0, pixelY);
            this.ctx.lineTo(width, pixelY);
            this.ctx.stroke();
        }

        // 2. Draw Axes Labels (Numbers on axes)
        this.ctx.font = '10px "JetBrains Mono", monospace';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        
        // Find intersection of axes on screen (constrained to stay visible on edges if scrolled out)
        const originPx = this.mathToPixel(0, 0);
        const labelMargin = 5;
        let axisX = Math.max(labelMargin, Math.min(width - 25, originPx.x));
        let axisY = Math.max(labelMargin + 10, Math.min(height - labelMargin, originPx.y));

        // Draw numbers along X axis
        for (let x = xStart; x <= end.x; x += gridStep) {
            if (Math.abs(x) < 1e-10) continue; // Skip zero (handled separately)
            const pt = this.mathToPixel(x, 0);
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.formatAxisLabel(x), pt.x, axisY + 14);
        }

        // Draw numbers along Y axis
        for (let y = yStart; y <= end.y; y += gridStep) {
            if (Math.abs(y) < 1e-10) continue;
            const pt = this.mathToPixel(0, y);
            this.ctx.textAlign = 'right';
            this.ctx.fillText(this.formatAxisLabel(y), axisX - 6, pt.y + 4);
        }

        // Origin label
        this.ctx.textAlign = 'right';
        this.ctx.fillText('0', originPx.x - 6, originPx.y + 14);

        // 3. Draw Functions
        this.ctx.shadowBlur = 0; // Disable shadows for quick grid rendering
        this.functions.forEach((fn) => {
            if (!fn.active || !fn.compiledExpr || !fn.compiledExpr.isValid) return;

            this.ctx.strokeStyle = fn.color;
            this.ctx.lineWidth = 2.5;
            
            // Enable neon glow for the active lines
            this.ctx.shadowColor = fn.color;
            this.ctx.shadowBlur = 10;

            this.ctx.beginPath();
            
            let isDrawing = false;
            let lastY = null;
            
            // Evaluate for every pixel column
            for (let px = 0; px <= width; px += 1) {
                // Convert pixel X to math X
                const mathPt = this.pixelToMath(px, 0);
                const valY = fn.compiledExpr.evaluate(mathPt.x, true); // Evaluate using Radian mode
                
                if (valY && typeof valY.re === 'number' && !isNaN(valY.re) && isFinite(valY.re) && Math.abs(valY.im || 0) < 1e-8) {
                    const pt = this.mathToPixel(mathPt.x, valY.re);
                    
                    // Asymptote detection: if y jumps wildly from high positive to deep negative, break path
                    // e.g. for tan(x)
                    const outOfBounds = pt.y < -height * 2 || pt.y > height * 3;
                    const asymptoteJump = lastY !== null && Math.abs(pt.y - lastY) > height * 1.5;

                    if (!isDrawing) {
                        this.ctx.moveTo(pt.x, pt.y);
                        isDrawing = true;
                    } else if (asymptoteJump) {
                        this.ctx.stroke(); // stroke current line
                        this.ctx.beginPath();
                        this.ctx.moveTo(pt.x, pt.y);
                    } else {
                        this.ctx.lineTo(pt.x, pt.y);
                    }
                    
                    lastY = pt.y;
                } else {
                    if (isDrawing) {
                        this.ctx.stroke();
                        this.ctx.beginPath();
                        isDrawing = false;
                    }
                    lastY = null;
                }
            }
            this.ctx.stroke();
        });

        // Reset shadow
        this.ctx.shadowBlur = 0;

        // 4. Draw Interactive Crosshair & Cursor tracking dots
        if (this.isMouseOver && !this.isDragging) {
            const mouseX = this.mousePos.x;
            const mathX = this.hoverMathCoords.x;

            // Draw vertical coordinate line
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([4, 4]);
            this.ctx.beginPath();
            this.ctx.moveTo(mouseX, 0);
            this.ctx.lineTo(mouseX, height);
            this.ctx.stroke();
            this.ctx.setLineDash([]); // Reset line dash

            // Draw intersection dots on functions
            this.functions.forEach((fn) => {
                if (!fn.active || !fn.compiledExpr || !fn.compiledExpr.isValid) return;

                const valY = fn.compiledExpr.evaluate(mathX, true);
                if (valY && typeof valY.re === 'number' && !isNaN(valY.re) && isFinite(valY.re) && Math.abs(valY.im || 0) < 1e-8) {
                    const pt = this.mathToPixel(mathX, valY.re);
                    
                    // Draw outer glowing circle
                    this.ctx.fillStyle = fn.color;
                    this.ctx.shadowColor = fn.color;
                    this.ctx.shadowBlur = 8;
                    this.ctx.beginPath();
                    this.ctx.arc(pt.x, pt.y, 6, 0, 2 * Math.PI);
                    this.ctx.fill();

                    // Draw inner white dot
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.shadowBlur = 0;
                    this.ctx.beginPath();
                    this.ctx.arc(pt.x, pt.y, 2.5, 0, 2 * Math.PI);
                    this.ctx.fill();
                }
            });
        }
    }

    /**
     * Center coordinates at (0, 0) and reset zoom
     */
    resetView() {
        this.offsetX = 0;
        this.offsetY = 0;
        this.zoom = 45;
        this.requestRedraw();
    }

    /**
     * Adjusts the floating coordinate label with active function evaluations at cursor X
     */
    updateCoordsDisplay() {
        let label = `x: ${this.hoverMathCoords.x.toFixed(2)}, y: ${this.hoverMathCoords.y.toFixed(2)}`;
        
        // If hovered over active functions, display evaluated y values
        const evaluations = [];
        this.functions.forEach((fn, idx) => {
            if (fn.active && fn.compiledExpr && fn.compiledExpr.isValid) {
                const y = fn.compiledExpr.evaluate(this.hoverMathCoords.x, true);
                if (y && typeof y.re === 'number' && !isNaN(y.re) && isFinite(y.re) && Math.abs(y.im || 0) < 1e-8) {
                    evaluations.push(`<span style="color: ${fn.color}">f${idx+1}(x): ${y.re.toFixed(2)}</span>`);
                }
            }
        });

        if (evaluations.length > 0) {
            this.coordsEl.innerHTML = `x: ${this.hoverMathCoords.x.toFixed(2)} | ` + evaluations.join(' | ');
        } else {
            this.coordsEl.innerHTML = label;
        }
    }

    /**
     * Assigns a color from the palette based on index
     */
    getNextColor(index) {
        return this.colorPalette[index % this.colorPalette.length];
    }
}
