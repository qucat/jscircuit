import { expect, assert } from 'chai';
globalThis.expect = expect;
globalThis.assert = assert;

global.Image = class {
    constructor() {
        this.src = null;
        this.onload = () => {}; // Simulate image loading
    }
};
