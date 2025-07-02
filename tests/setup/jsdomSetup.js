/**
 * @module jsdomSetup
 * @description
 * This module provides a utility function to set up a simulated DOM environment
 * using JSDOM. It is designed for use in Node.js testing environments where
 * browser-like global objects, such as `window`, `document`, and `navigator`, 
 * are required for testing GUI-related logic.
 * 
 * The `setupJsdom` function ensures that tests relying on DOM manipulation
 * and browser APIs can run seamlessly by mimicking a browser environment.
 * 
 * Features:
 * - Creates a `window` object with a basic HTML structure.
 * - Attaches `document` to the global scope for DOM access.
 * - Safely configures `navigator` on the `window` and global objects.
 * 
 * Example Usage:
 * Import and invoke `setupJsdom` in a `beforeEach` hook of your test files:
 * 
 * ```javascript
 * import { setupJsdom } from './jsdomSetup.js';
 * 
 * beforeEach(() => {
 *     setupJsdom();
 * });
 * ```
 * 
 * @requires jsdom
 */

import { JSDOM } from 'jsdom';

/**
 * Sets up a simulated DOM environment using JSDOM.
 * 
 * This function initializes a `window` and `document` object, attaching them
 * to the global scope. It also configures the `navigator` object to mimic
 * a browser environment.
 */
export function setupJsdom() {
    const { window } = new JSDOM('<!doctype html><html><body></body></html>');

    global.window = window;
    global.document = window.document;

    // Patch the userAgent safely, even if it's readonly
    if (!window.navigator.userAgent || window.navigator.userAgent !== 'node.js') {
        try {
            Object.defineProperty(window.navigator, 'userAgent', {
                value: 'node.js',
                configurable: true,
            });
        } catch (e) {
            // Fallback if it fails due to being non-configurable
            console.warn('Failed to override navigator.userAgent:', e.message);
        }
    }

    // Bind window.navigator to global (as a getter, readonly)
    if (!('navigator' in global)) {
        Object.defineProperty(global, 'navigator', {
            get() {
                return window.navigator;
            },
            configurable: true,
        });
    }
}
