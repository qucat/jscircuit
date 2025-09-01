// Mock Image class to prevent errors in tests
global.Image = class {
    constructor() {
      this.onload = () => {};
      this.src = '';
    }
};