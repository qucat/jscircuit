import { expect, assert } from 'chai';
globalThis.expect = expect;
globalThis.assert = assert;

// Mock Image constructor to prevent issues in Node.js environment
global.Image = class {
    constructor() {
        this.onload = null;
        this.onerror = null;
        this.src = '';
        this.width = 0;
        this.height = 0;
    }
};

// Mock requestAnimationFrame for Node.js test environment
global.requestAnimationFrame = (callback) => {
    // Use setTimeout to simulate async behavior
    return setTimeout(callback, 16); // ~60fps
};

global.cancelAnimationFrame = (id) => {
    clearTimeout(id);
};
