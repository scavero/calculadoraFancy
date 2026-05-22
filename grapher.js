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
        this.graphMode = 'real';
        
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
    hslToRgb(h, s, l) {
        let r, g, b;
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), 255];
    }

    getDomainColor(w) {
        if (!w || isNaN(w.re) || isNaN(w.im)) return [0, 0, 0, 0];
        
        const r = Math.hypot(w.re, w.im);
        let theta = Math.atan2(w.im, w.re);
        if (theta < 0) theta += 2 * Math.PI;
        
        const hue = theta / (2 * Math.PI);
        
        let lightness = 0.5;
        if (r === 0) {
            lightness = 0;
        } else if (isFinite(r)) {
            const logR = Math.log2(r);
            const gridEffect = 0.12 * Math.sin(2 * Math.PI * logR);
            const baseLight = r / (1 + r);
            lightness = baseLight + gridEffect * (1 - Math.abs(2 * baseLight - 1));
            lightness = Math.max(0.1, Math.min(0.9, lightness));
        } else {
            lightness = 1.0;
        }
        
        return this.hslToRgb(hue, 0.95, lightness);
    }

    drawTrackingDot(px, py, color, isDashed = false) {
        this.ctx.fillStyle = color;
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 8;
        this.ctx.beginPath();
        
        if (isDashed) {
            this.ctx.arc(px, py, 4.5, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.fillStyle = '#12141e';
            this.ctx.shadowBlur = 0;
            this.ctx.beginPath();
            this.ctx.arc(px, py, 2, 0, 2 * Math.PI);
            this.ctx.fill();
        } else {
            this.ctx.arc(px, py, 6, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.fillStyle = '#ffffff';
            this.ctx.shadowBlur = 0;
            this.ctx.beginPath();
            this.ctx.arc(px, py, 2.5, 0, 2 * Math.PI);
            this.ctx.fill();
        }
    }

    draw() {
        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);

        // Clear canvas
        this.ctx.clearRect(0, 0, width, height);

        // 1. Draw Domain Coloring if in that mode
        if (this.graphMode === 'domain-coloring') {
            const scale = this.isDragging ? 6 : 3;
            const offWidth = Math.ceil(width / scale);
            const offHeight = Math.ceil(height / scale);

            if (!this.offscreenCanvas || this.offscreenCanvas.width !== offWidth || this.offscreenCanvas.height !== offHeight) {
                this.offscreenCanvas = document.createElement('canvas');
                this.offscreenCanvas.width = offWidth;
                this.offscreenCanvas.height = offHeight;
                this.offscreenCtx = this.offscreenCanvas.getContext('2d');
            }

            const imgData = this.offscreenCtx.createImageData(offWidth, offHeight);
            const data = imgData.data;

            const activeFn = this.functions.find(fn => fn.active && fn.compiledExpr && fn.compiledExpr.isValid);

            if (activeFn) {
                let idx = 0;
                for (let py = 0; py < offHeight; py++) {
                    for (let px = 0; px < offWidth; px++) {
                        const mathPt = this.pixelToMath(px * scale, py * scale);
                        const z = new Complex(mathPt.x, mathPt.y);
                        const w = activeFn.compiledExpr.evaluate(z, true);
                        const rgb = this.getDomainColor(w);
                        data[idx] = rgb[0];
                        data[idx+1] = rgb[1];
                        data[idx+2] = rgb[2];
                        data[idx+3] = rgb[3];
                        idx += 4;
                    }
                }
                this.offscreenCtx.putImageData(imgData, 0, 0);
                this.ctx.imageSmoothingEnabled = true;
                this.ctx.drawImage(this.offscreenCanvas, 0, 0, width, height);
            }
        }

        const gridStep = this.getGridStep();
        const start = this.pixelToMath(0, height);
        const end = this.pixelToMath(width, 0);

        // 2. Draw Grid Lines
        this.ctx.lineWidth = 1;
        
        // Vertical grid lines
        let xStart = Math.ceil(start.x / gridStep) * gridStep;
        for (let x = xStart; x <= end.x; x += gridStep) {
            const pixelX = this.mathToPixel(x, 0).x;
            const isYAxis = Math.abs(x) < 1e-10;
            
            const strokeColor = this.graphMode === 'domain-coloring'
                ? (isYAxis ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.18)')
                : (isYAxis ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.05)');
            
            this.ctx.strokeStyle = strokeColor;
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
            
            const strokeColor = this.graphMode === 'domain-coloring'
                ? (isXAxis ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.18)')
                : (isXAxis ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.05)');
            
            this.ctx.strokeStyle = strokeColor;
            this.ctx.beginPath();
            this.ctx.moveTo(0, pixelY);
            this.ctx.lineTo(width, pixelY);
            this.ctx.stroke();
        }

        // 3. Draw Axes Labels (Numbers on axes)
        this.ctx.font = '10px "JetBrains Mono", monospace';
        this.ctx.fillStyle = this.graphMode === 'domain-coloring' ? '#ffffff' : 'rgba(255, 255, 255, 0.45)';
        if (this.graphMode === 'domain-coloring') {
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.lineWidth = 2.5;
        }
        
        const originPx = this.mathToPixel(0, 0);
        const labelMargin = 5;
        let axisX = Math.max(labelMargin, Math.min(width - 25, originPx.x));
        let axisY = Math.max(labelMargin + 10, Math.min(height - labelMargin, originPx.y));

        const drawText = (txt, tx, ty, align) => {
            this.ctx.textAlign = align;
            if (this.graphMode === 'domain-coloring') {
                this.ctx.strokeText(txt, tx, ty);
            }
            this.ctx.fillText(txt, tx, ty);
        };

        // Draw numbers along X axis
        for (let x = xStart; x <= end.x; x += gridStep) {
            if (Math.abs(x) < 1e-10) continue;
            const pt = this.mathToPixel(x, 0);
            drawText(this.formatAxisLabel(x), pt.x, axisY + 14, 'center');
        }

        // Draw numbers along Y axis
        for (let y = yStart; y <= end.y; y += gridStep) {
            if (Math.abs(y) < 1e-10) continue;
            const pt = this.mathToPixel(0, y);
            drawText(this.formatAxisLabel(y), axisX - 6, pt.y + 4, 'right');
        }

        // Origin label
        drawText('0', originPx.x - 6, originPx.y + 14, 'right');

        // Reset text stroke/shadow
        this.ctx.lineWidth = 1;

        // 4. Draw Functions (curves)
        if (this.graphMode !== 'domain-coloring') {
            this.ctx.shadowBlur = 0;
            this.functions.forEach((fn) => {
                if (!fn.active || !fn.compiledExpr || !fn.compiledExpr.isValid) return;

                this.ctx.strokeStyle = fn.color;
                this.ctx.lineWidth = 2.5;
                
                this.ctx.shadowColor = fn.color;
                this.ctx.shadowBlur = 10;

                if (this.graphMode === 'real') {
                    this.ctx.beginPath();
                    let isDrawing = false;
                    let lastY = null;
                    
                    for (let px = 0; px <= width; px += 1) {
                        const mathPt = this.pixelToMath(px, 0);
                        const valY = fn.compiledExpr.evaluate(mathPt.x, true);
                        
                        if (valY && typeof valY.re === 'number' && !isNaN(valY.re) && isFinite(valY.re) && Math.abs(valY.im || 0) < 1e-8) {
                            const pt = this.mathToPixel(mathPt.x, valY.re);
                            const asymptoteJump = lastY !== null && Math.abs(pt.y - lastY) > height * 1.5;

                            if (!isDrawing) {
                                this.ctx.moveTo(pt.x, pt.y);
                                isDrawing = true;
                            } else if (asymptoteJump) {
                                this.ctx.stroke();
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
                } else if (this.graphMode === 'complex-split') {
                    const pointsRe = [];
                    const pointsIm = [];
                    for (let px = 0; px <= width; px += 1) {
                        const mathPt = this.pixelToMath(px, 0);
                        const valY = fn.compiledExpr.evaluate(mathPt.x, true);
                        
                        if (valY) {
                            if (typeof valY.re === 'number' && !isNaN(valY.re) && isFinite(valY.re)) {
                                pointsRe.push({ px: px, py: this.mathToPixel(mathPt.x, valY.re).y });
                            } else {
                                pointsRe.push(null);
                            }
                            if (typeof valY.im === 'number' && !isNaN(valY.im) && isFinite(valY.im)) {
                                pointsIm.push({ px: px, py: this.mathToPixel(mathPt.x, valY.im).y });
                            } else {
                                pointsIm.push(null);
                            }
                        } else {
                            pointsRe.push(null);
                            pointsIm.push(null);
                        }
                    }
                    
                    // Draw Real Part (Solid)
                    this.ctx.beginPath();
                    let isDrawing = false;
                    let lastY = null;
                    for (let px = 0; px <= width; px++) {
                        const pt = pointsRe[px];
                        if (pt) {
                            const asymptoteJump = lastY !== null && Math.abs(pt.py - lastY) > height * 1.5;
                            if (!isDrawing) {
                                this.ctx.moveTo(pt.px, pt.py);
                                isDrawing = true;
                            } else if (asymptoteJump) {
                                this.ctx.stroke();
                                this.ctx.beginPath();
                                this.ctx.moveTo(pt.px, pt.py);
                            } else {
                                this.ctx.lineTo(pt.px, pt.py);
                            }
                            lastY = pt.py;
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
                    
                    // Draw Imaginary Part (Dashed)
                    this.ctx.beginPath();
                    this.ctx.setLineDash([5, 5]);
                    this.ctx.lineWidth = 1.8;
                    isDrawing = false;
                    lastY = null;
                    for (let px = 0; px <= width; px++) {
                        const pt = pointsIm[px];
                        if (pt) {
                            const asymptoteJump = lastY !== null && Math.abs(pt.py - lastY) > height * 1.5;
                            if (!isDrawing) {
                                this.ctx.moveTo(pt.px, pt.py);
                                isDrawing = true;
                            } else if (asymptoteJump) {
                                this.ctx.stroke();
                                this.ctx.beginPath();
                                this.ctx.moveTo(pt.px, pt.py);
                            } else {
                                this.ctx.lineTo(pt.px, pt.py);
                            }
                            lastY = pt.py;
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
                    this.ctx.setLineDash([]);
                    this.ctx.lineWidth = 2.5;
                }
            });
            this.ctx.shadowBlur = 0;
        }

        // 5. Draw Interactive Crosshair & Cursor tracking dots
        if (this.isMouseOver && !this.isDragging) {
            const mouseX = this.mousePos.x;
            const mouseY = this.mousePos.y;
            const mathX = this.hoverMathCoords.x;

            // Draw vertical coordinate line
            this.ctx.strokeStyle = this.graphMode === 'domain-coloring' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.12)';
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([4, 4]);
            this.ctx.beginPath();
            this.ctx.moveTo(mouseX, 0);
            this.ctx.lineTo(mouseX, height);
            
            if (this.graphMode === 'domain-coloring') {
                this.ctx.moveTo(0, mouseY);
                this.ctx.lineTo(width, mouseY);
            }
            this.ctx.stroke();
            this.ctx.setLineDash([]);

            if (this.graphMode === 'domain-coloring') {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
                this.ctx.lineWidth = 1.5;
                this.ctx.beginPath();
                this.ctx.arc(mouseX, mouseY, 5, 0, 2 * Math.PI);
                this.ctx.fill();
                this.ctx.stroke();
            } else {
                this.functions.forEach((fn) => {
                    if (!fn.active || !fn.compiledExpr || !fn.compiledExpr.isValid) return;

                    const valY = fn.compiledExpr.evaluate(mathX, true);
                    
                    if (this.graphMode === 'real') {
                        if (valY && typeof valY.re === 'number' && !isNaN(valY.re) && isFinite(valY.re) && Math.abs(valY.im || 0) < 1e-8) {
                            const pt = this.mathToPixel(mathX, valY.re);
                            this.drawTrackingDot(pt.x, pt.y, fn.color, false);
                        }
                    } else if (this.graphMode === 'complex-split') {
                        if (valY) {
                            if (typeof valY.re === 'number' && !isNaN(valY.re) && isFinite(valY.re)) {
                                const pt = this.mathToPixel(mathX, valY.re);
                                this.drawTrackingDot(pt.x, pt.y, fn.color, false);
                            }
                            if (typeof valY.im === 'number' && !isNaN(valY.im) && isFinite(valY.im)) {
                                const pt = this.mathToPixel(mathX, valY.im);
                                this.drawTrackingDot(pt.x, pt.y, fn.color, true);
                            }
                        }
                    }
                });
            }
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
     * Format a complex number to a string for coords display
     */
    formatComplex(c, decimals = 2) {
        if (!c || typeof c.re !== 'number' || isNaN(c.re)) return 'NaN';
        const re = c.re;
        const im = c.im || 0;
        if (Math.abs(im) < 1e-8) {
            return re.toFixed(decimals);
        }
        if (Math.abs(re) < 1e-8) {
            return im < 0 ? `-${Math.abs(im).toFixed(decimals)}i` : `${im.toFixed(decimals)}i`;
        }
        const sign = im < 0 ? '-' : '+';
        return `${re.toFixed(decimals)} ${sign} ${Math.abs(im).toFixed(decimals)}i`;
    }

    /**
     * Adjusts the floating coordinate label with active function evaluations at cursor X
     */
    updateCoordsDisplay() {
        if (this.graphMode === 'domain-coloring') {
            const activeFn = this.functions.find(fn => fn.active && fn.compiledExpr && fn.compiledExpr.isValid);
            const z = new Complex(this.hoverMathCoords.x, this.hoverMathCoords.y);
            const zStr = this.formatComplex(z, 2);
            if (activeFn) {
                const w = activeFn.compiledExpr.evaluate(z, true);
                if (w) {
                    const wStr = this.formatComplex(w, 2);
                    const modulus = Math.hypot(w.re, w.im);
                    this.coordsEl.innerHTML = `z: ${zStr} | <span style="color: ${activeFn.color}">f(z): ${wStr}</span> | |f(z)|: ${modulus.toFixed(2)}`;
                } else {
                    this.coordsEl.innerHTML = `z: ${zStr} | f(z): N/A`;
                }
            } else {
                this.coordsEl.innerHTML = `z: ${zStr}`;
            }
            return;
        }

        if (this.graphMode === 'complex-split') {
            const evaluations = [];
            this.functions.forEach((fn, idx) => {
                if (fn.active && fn.compiledExpr && fn.compiledExpr.isValid) {
                    const y = fn.compiledExpr.evaluate(this.hoverMathCoords.x, true);
                    if (y) {
                        const yStr = this.formatComplex(y, 2);
                        evaluations.push(`<span style="color: ${fn.color}">f${idx+1}(x): ${yStr}</span>`);
                    }
                }
            });
            if (evaluations.length > 0) {
                this.coordsEl.innerHTML = `x: ${this.hoverMathCoords.x.toFixed(2)} | ` + evaluations.join(' | ');
            } else {
                this.coordsEl.innerHTML = `x: ${this.hoverMathCoords.x.toFixed(2)}`;
            }
            return;
        }

        // Default 'real' mode
        let label = `x: ${this.hoverMathCoords.x.toFixed(2)}, y: ${this.hoverMathCoords.y.toFixed(2)}`;
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
