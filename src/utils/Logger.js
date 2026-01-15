/**
 * @file Logger.js
 * @description 
 * Development-aware logging utility to prevent performance issues in production.
 * Console logging is extremely expensive when browser DevTools are open.
 */

/**
 * Check if we're in development mode
 * Can be controlled via URL parameter, localStorage, or environment
 */
function isDevelopmentMode() {
    // Check URL parameter first
    if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('debug')) {
            return urlParams.get('debug') !== 'false';
        }
        
        // Check localStorage
        const debugMode = localStorage.getItem('qucat-debug');
        if (debugMode !== null) {
            return debugMode === 'true';
        }
    }
    
    // Default to development mode for localhost or if no production indicators
    if (typeof window !== 'undefined') {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.protocol === 'file:';
    }
    
    // Fallback to true for development
    return true;
}

/**
 * Performance-aware logger that only logs in development mode
 */
export class Logger {
    static isDev = isDevelopmentMode();
    
    static log(...args) {
        if (Logger.isDev) {
            console.log(...args);
        }
    }
    
    static warn(...args) {
        if (Logger.isDev) {
            console.warn(...args);
        }
    }
    
    static error(...args) {
        // Always log errors, but add dev flag for verbose errors
        if (Logger.isDev) {
            console.error(...args);
        } else {
            // Log minimal error info in production
            console.error('Error occurred:', args[0]);
        }
    }
    
    static debug(...args) {
        if (Logger.isDev) {
            console.debug(...args);
        }
    }
    
    static info(...args) {
        if (Logger.isDev) {
            console.info(...args);
        }
    }
    
    /**
     * Enable/disable debug mode at runtime
     */
    static setDebugMode(enabled) {
        Logger.isDev = enabled;
        if (typeof window !== 'undefined') {
            localStorage.setItem('qucat-debug', enabled.toString());
        }
    }
    
    /**
     * Log performance timing information
     */
    static time(label) {
        if (Logger.isDev) {
            console.time(label);
        }
    }
    
    static timeEnd(label) {
        if (Logger.isDev) {
            console.timeEnd(label);
        }
    }
}

// Global debug control
if (typeof window !== 'undefined') {
    window.setQuCatDebug = Logger.setDebugMode;
}