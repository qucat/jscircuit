/**
 * @file PerformanceUtils.js
 * @description 
 * Utilities for optimizing performance-critical operations in the circuit renderer.
 */

/**
 * Throttle function to limit how often a function can be called
 * @param {Function} func - Function to throttle
 * @param {number} delay - Minimum delay between calls in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, delay) {
    let timeoutId;
    let lastExecTime = 0;
    
    return function (...args) {
        const currentTime = Date.now();
        
        if (currentTime - lastExecTime > delay) {
            func.apply(this, args);
            lastExecTime = currentTime;
        } else {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
                lastExecTime = Date.now();
            }, delay - (currentTime - lastExecTime));
        }
    };
}

/**
 * Debounce function to delay execution until after calls have stopped
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, delay) {
    let timeoutId;
    
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * RequestAnimationFrame-based render scheduler
 * Ensures renders happen at most once per frame
 */
export class RenderScheduler {
    constructor() {
        this.pendingRender = false;
        this.renderCallbacks = new Set();
    }
    
    /**
     * Schedule a render callback to run on next frame
     * @param {Function} callback - Render function to call
     */
    scheduleRender(callback) {
        this.renderCallbacks.add(callback);
        
        if (!this.pendingRender) {
            this.pendingRender = true;
            requestAnimationFrame(() => {
                this.pendingRender = false;
                
                // Execute all pending renders
                for (const cb of this.renderCallbacks) {
                    try {
                        cb();
                    } catch (error) {
                        console.error('Render callback error:', error);
                    }
                }
                
                this.renderCallbacks.clear();
            });
        }
    }
    
    /**
     * Cancel a scheduled render callback
     * @param {Function} callback - Callback to cancel
     */
    cancelRender(callback) {
        this.renderCallbacks.delete(callback);
    }
    
    /**
     * Check if renders are currently pending
     * @returns {boolean} True if renders are scheduled
     */
    hasPendingRenders() {
        return this.pendingRender || this.renderCallbacks.size > 0;
    }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
    }
    
    /**
     * Start timing an operation
     * @param {string} name - Operation name
     */
    startTiming(name) {
        this.metrics.set(name, performance.now());
    }
    
    /**
     * End timing and log duration
     * @param {string} name - Operation name
     * @returns {number} Duration in milliseconds
     */
    endTiming(name) {
        const startTime = this.metrics.get(name);
        if (startTime !== undefined) {
            const duration = performance.now() - startTime;
            this.metrics.delete(name);
            return duration;
        }
        return 0;
    }
    
    /**
     * Measure and log function execution time
     * @param {string} name - Operation name
     * @param {Function} fn - Function to measure
     * @returns {*} Function result
     */
    measure(name, fn) {
        this.startTiming(name);
        try {
            const result = fn();
            const duration = this.endTiming(name);
            
            // Log slow operations in development
            if (typeof window !== 'undefined' && 
                (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && 
                duration > 16) {
                console.warn(`Slow operation: ${name} took ${duration.toFixed(2)}ms`);
            }
            
            return result;
        } catch (error) {
            this.endTiming(name);
            throw error;
        }
    }
}

// Global instances
export const globalRenderScheduler = new RenderScheduler();
export const globalPerformanceMonitor = new PerformanceMonitor();