/**
 * @file DirtyRectangleManager.js
 * @description 
 * Manages dirty rectangles for optimized canvas rendering.
 * Only redraws parts of the canvas that have actually changed.
 */

/**
 * Represents a dirty rectangle that needs to be redrawn
 */
export class DirtyRectangle {
    constructor(x, y, width, height, reason = '') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.reason = reason; // For debugging
    }

    /**
     * Check if this rectangle intersects with another
     * @param {DirtyRectangle} other - Other rectangle
     * @returns {boolean} True if rectangles intersect
     */
    intersects(other) {
        return !(other.x > this.x + this.width || 
                 other.x + other.width < this.x || 
                 other.y > this.y + this.height || 
                 other.y + other.height < this.y);
    }

    /**
     * Merge this rectangle with another
     * @param {DirtyRectangle} other - Other rectangle to merge
     * @returns {DirtyRectangle} New merged rectangle
     */
    merge(other) {
        const left = Math.min(this.x, other.x);
        const top = Math.min(this.y, other.y);
        const right = Math.max(this.x + this.width, other.x + other.width);
        const bottom = Math.max(this.y + this.height, other.y + other.height);
        
        return new DirtyRectangle(
            left, top, 
            right - left, bottom - top,
            `merged(${this.reason},${other.reason})`
        );
    }

    /**
     * Expand rectangle by margin
     * @param {number} margin - Margin to add on all sides
     * @returns {DirtyRectangle} New expanded rectangle
     */
    expand(margin) {
        return new DirtyRectangle(
            this.x - margin,
            this.y - margin,
            this.width + 2 * margin,
            this.height + 2 * margin,
            this.reason
        );
    }

    /**
     * Get area of rectangle
     * @returns {number} Area in pixels
     */
    getArea() {
        return this.width * this.height;
    }

    /**
     * Create dirty rectangle from element bounds
     * @param {Object} element - Circuit element
     * @param {number} scale - Canvas scale factor
     * @param {number} offsetX - Canvas offset X
     * @param {number} offsetY - Canvas offset Y
     * @param {number} padding - Extra padding around element
     * @returns {DirtyRectangle} Dirty rectangle for element
     */
    static fromElement(element, scale, offsetX, offsetY, padding = 30) {
        if (!element.nodes || element.nodes.length === 0) {
            return new DirtyRectangle(0, 0, 0, 0, `empty-${element.type}`);
        }

        // Calculate element bounds in logical coordinates
        const xs = element.nodes.map(node => node.x);
        const ys = element.nodes.map(node => node.y);
        const minX = Math.min(...xs) - padding;
        const maxX = Math.max(...xs) + padding;
        const minY = Math.min(...ys) - padding;
        const maxY = Math.max(...ys) + padding;

        // Transform to screen coordinates
        const screenMinX = minX * scale + offsetX;
        const screenMinY = minY * scale + offsetY;
        const screenMaxX = maxX * scale + offsetX;
        const screenMaxY = maxY * scale + offsetY;

        return new DirtyRectangle(
            Math.floor(screenMinX),
            Math.floor(screenMinY),
            Math.ceil(screenMaxX - screenMinX),
            Math.ceil(screenMaxY - screenMinY),
            `element-${element.type}-${element.id}`
        );
    }

    /**
     * Create dirty rectangle for full canvas
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @returns {DirtyRectangle} Full canvas rectangle
     */
    static fullCanvas(width, height) {
        return new DirtyRectangle(0, 0, width, height, 'full-canvas');
    }
}

/**
 * Manages dirty rectangles for optimized rendering
 */
export class DirtyRectangleManager {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.dirtyRectangles = [];
        this.fullRedrawRequested = false;
        this.maxRectangles = 10; // Merge if more than this
        this.mergeThreshold = 0.3; // Merge if overlap > 30%
    }

    /**
     * Add a dirty rectangle
     * @param {DirtyRectangle} rect - Rectangle to add
     */
    addDirtyRectangle(rect) {
        // Clamp to canvas bounds
        const clampedRect = new DirtyRectangle(
            Math.max(0, Math.min(rect.x, this.canvasWidth)),
            Math.max(0, Math.min(rect.y, this.canvasHeight)),
            Math.max(0, Math.min(rect.width, this.canvasWidth - rect.x)),
            Math.max(0, Math.min(rect.height, this.canvasHeight - rect.y)),
            rect.reason
        );

        // Skip zero-area rectangles
        if (clampedRect.width <= 0 || clampedRect.height <= 0) {
            return;
        }

        this.dirtyRectangles.push(clampedRect);
        this.optimize();
    }

    /**
     * Mark element as dirty
     * @param {Object} element - Circuit element that changed
     * @param {number} scale - Canvas scale
     * @param {number} offsetX - Canvas offset X
     * @param {number} offsetY - Canvas offset Y
     * @param {string} reason - Reason for marking dirty
     */
    markElementDirty(element, scale, offsetX, offsetY, reason = 'element-change') {
        const rect = DirtyRectangle.fromElement(element, scale, offsetX, offsetY);
        rect.reason = reason;
        this.addDirtyRectangle(rect);
    }

    /**
     * Mark viewport area as dirty
     * @param {number} x - Viewport X in screen coordinates
     * @param {number} y - Viewport Y in screen coordinates
     * @param {number} width - Viewport width
     * @param {number} height - Viewport height
     * @param {string} reason - Reason for marking dirty
     */
    markViewportDirty(x, y, width, height, reason = 'viewport-change') {
        this.addDirtyRectangle(new DirtyRectangle(x, y, width, height, reason));
    }

    /**
     * Request full canvas redraw
     * @param {string} reason - Reason for full redraw
     */
    markFullCanvasDirty(reason = 'full-redraw') {
        this.fullRedrawRequested = true;
        this.dirtyRectangles = [DirtyRectangle.fullCanvas(this.canvasWidth, this.canvasHeight)];
        this.dirtyRectangles[0].reason = reason;
    }

    /**
     * Get all dirty rectangles and clear the list
     * @returns {Array<DirtyRectangle>} Array of dirty rectangles
     */
    getDirtyRectanglesAndClear() {
        const rectangles = [...this.dirtyRectangles];
        this.dirtyRectangles = [];
        this.fullRedrawRequested = false;
        return rectangles;
    }

    /**
     * Check if any areas are dirty
     * @returns {boolean} True if canvas needs redrawing
     */
    hasDirtyAreas() {
        return this.dirtyRectangles.length > 0 || this.fullRedrawRequested;
    }

    /**
     * Check if full redraw is needed
     * @returns {boolean} True if full canvas redraw is needed
     */
    needsFullRedraw() {
        return this.fullRedrawRequested || this.getTotalDirtyArea() > this.canvasWidth * this.canvasHeight * 0.5;
    }

    /**
     * Optimize dirty rectangles by merging overlapping ones
     */
    optimize() {
        if (this.dirtyRectangles.length <= 1) return;

        // Sort by area (largest first) for better merging
        this.dirtyRectangles.sort((a, b) => b.getArea() - a.getArea());

        // Merge overlapping rectangles
        let merged = true;
        while (merged && this.dirtyRectangles.length > 1) {
            merged = false;
            
            for (let i = 0; i < this.dirtyRectangles.length - 1; i++) {
                for (let j = i + 1; j < this.dirtyRectangles.length; j++) {
                    const rect1 = this.dirtyRectangles[i];
                    const rect2 = this.dirtyRectangles[j];
                    
                    if (this.shouldMerge(rect1, rect2)) {
                        const mergedRect = rect1.merge(rect2);
                        this.dirtyRectangles.splice(j, 1); // Remove second
                        this.dirtyRectangles.splice(i, 1); // Remove first
                        this.dirtyRectangles.push(mergedRect);
                        merged = true;
                        break;
                    }
                }
                if (merged) break;
            }
        }

        // If too many rectangles, merge aggressively or switch to full redraw
        if (this.dirtyRectangles.length > this.maxRectangles) {
            const totalArea = this.getTotalDirtyArea();
            const canvasArea = this.canvasWidth * this.canvasHeight;
            
            if (totalArea > canvasArea * 0.4) {
                // Switch to full redraw if dirty area is too large
                this.markFullCanvasDirty('too-many-dirty-areas');
            } else {
                // Merge aggressively
                this.aggressiveMerge();
            }
        }
    }

    /**
     * Check if two rectangles should be merged
     * @param {DirtyRectangle} rect1 - First rectangle
     * @param {DirtyRectangle} rect2 - Second rectangle
     * @returns {boolean} True if rectangles should be merged
     */
    shouldMerge(rect1, rect2) {
        // Check if they intersect
        if (!rect1.intersects(rect2)) {
            // Check if they're close enough to merge anyway
            const gap = this.getGapBetweenRectangles(rect1, rect2);
            return gap < 20; // Merge if gap is small
        }
        
        // If they intersect, check if merging is beneficial
        const mergedRect = rect1.merge(rect2);
        const originalArea = rect1.getArea() + rect2.getArea();
        const mergedArea = mergedRect.getArea();
        const efficiency = originalArea / mergedArea;
        
        return efficiency > this.mergeThreshold;
    }

    /**
     * Get gap between two rectangles
     * @param {DirtyRectangle} rect1 - First rectangle
     * @param {DirtyRectangle} rect2 - Second rectangle
     * @returns {number} Minimum gap between rectangles
     */
    getGapBetweenRectangles(rect1, rect2) {
        const horizontalGap = Math.max(0, 
            Math.max(rect1.x - (rect2.x + rect2.width), rect2.x - (rect1.x + rect1.width))
        );
        const verticalGap = Math.max(0,
            Math.max(rect1.y - (rect2.y + rect2.height), rect2.y - (rect1.y + rect1.height))
        );
        
        return Math.max(horizontalGap, verticalGap);
    }

    /**
     * Aggressively merge rectangles to reduce count
     */
    aggressiveMerge() {
        while (this.dirtyRectangles.length > this.maxRectangles / 2) {
            // Find closest pair and merge them
            let bestI = 0, bestJ = 1;
            let bestDistance = Number.MAX_VALUE;
            
            for (let i = 0; i < this.dirtyRectangles.length - 1; i++) {
                for (let j = i + 1; j < this.dirtyRectangles.length; j++) {
                    const distance = this.getGapBetweenRectangles(
                        this.dirtyRectangles[i], 
                        this.dirtyRectangles[j]
                    );
                    if (distance < bestDistance) {
                        bestDistance = distance;
                        bestI = i;
                        bestJ = j;
                    }
                }
            }
            
            // Merge the closest pair
            const mergedRect = this.dirtyRectangles[bestI].merge(this.dirtyRectangles[bestJ]);
            this.dirtyRectangles.splice(bestJ, 1);
            this.dirtyRectangles.splice(bestI, 1);
            this.dirtyRectangles.push(mergedRect);
        }
    }

    /**
     * Get total area covered by dirty rectangles
     * @returns {number} Total dirty area in pixels
     */
    getTotalDirtyArea() {
        return this.dirtyRectangles.reduce((total, rect) => total + rect.getArea(), 0);
    }

    /**
     * Update canvas size
     * @param {number} width - New canvas width
     * @param {number} height - New canvas height
     */
    updateCanvasSize(width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;
    }

    /**
     * Get debug information about dirty rectangles
     * @returns {Object} Debug information
     */
    getDebugInfo() {
        return {
            rectangleCount: this.dirtyRectangles.length,
            totalArea: this.getTotalDirtyArea(),
            canvasArea: this.canvasWidth * this.canvasHeight,
            coveragePercentage: (this.getTotalDirtyArea() / (this.canvasWidth * this.canvasHeight) * 100).toFixed(1),
            fullRedrawRequested: this.fullRedrawRequested,
            rectangles: this.dirtyRectangles.map(rect => ({
                x: rect.x, y: rect.y, 
                width: rect.width, height: rect.height, 
                reason: rect.reason
            }))
        };
    }
}