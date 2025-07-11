import { expect } from 'chai';
import { ElementRenderer } from '../../../src/gui/renderers/ElementRenderer.js';
import { ResistorRenderer } from '../../../src/gui/renderers/ResistorRenderer.js';
import { CapacitorRenderer } from '../../../src/gui/renderers/CapacitorRenderer.js';
import { JunctionRenderer } from '../../../src/gui/renderers/JunctionRenderer.js';

// Mock canvas context for testing
class MockCanvasContext {
    constructor() {
        this.calls = [];
    }

    drawImage(...args) {
        this.calls.push({ method: 'drawImage', args });
    }

    fillText(...args) {
        this.calls.push({ method: 'fillText', args });
    }

    set fillStyle(value) {
        this.calls.push({ method: 'set fillStyle', value });
    }

    set font(value) {
        this.calls.push({ method: 'set font', value });
    }

    getCalls() {
        return this.calls;
    }

    clearCalls() {
        this.calls = [];
    }
}

describe('ElementRenderer', () => {
    let mockContext;

    beforeEach(() => {
        mockContext = new MockCanvasContext();
    });

    it('should be abstract and not directly instantiable', () => {
        expect(() => new ElementRenderer(mockContext)).to.throw('Cannot instantiate abstract class ElementRenderer directly.');
    });

    it('should initialize with context', () => {
        class TestRenderer extends ElementRenderer {
            constructor(context) {
                super(context);
            }
        }

        const renderer = new TestRenderer(mockContext);
        expect(renderer.context).to.equal(mockContext);
        expect(renderer.images).to.be.an('object');
        expect(renderer.imageLoaded).to.be.false;
    });

    it('should throw error if render method is not implemented', () => {
        class TestRenderer extends ElementRenderer {
            constructor(context) {
                super(context);
            }
        }

        const renderer = new TestRenderer(mockContext);
        expect(() => renderer.render({})).to.throw('render method must be implemented by subclass');
    });

    it('should determine current image based on state', () => {
        class TestRenderer extends ElementRenderer {
            constructor(context) {
                super(context);
                // Mock some images
                this.images = {
                    'default': 'default-image',
                    'hover': 'hover-image',
                    'selected': 'selected-image',
                    'hover_selected': 'hover-selected-image'
                };
            }
        }

        const renderer = new TestRenderer(mockContext);
        
        expect(renderer.getCurrentImage()).to.equal('default-image');
        expect(renderer.getCurrentImage({ hover: true })).to.equal('hover-image');
        expect(renderer.getCurrentImage({ selected: true })).to.equal('selected-image');
        expect(renderer.getCurrentImage({ hover: true, selected: true })).to.equal('hover-selected-image');
    });

    it('should initialize image assets and return promise', async () => {
        class TestRenderer extends ElementRenderer {
            constructor(context) {
                super(context);
            }
        }

        const renderer = new TestRenderer(mockContext);
        const result = await renderer.initializeImageAssets('resistor');
        
        expect(renderer.isImageLoaded()).to.be.true;
        expect(renderer.getImage('default')).to.exist;
        expect(renderer.getImage('hover')).to.exist;
        expect(renderer.getImage('selected')).to.exist;
        expect(renderer.getImage('hover_selected')).to.exist;
    });

    it('should handle multiple calls to initializeImageAssets', async () => {
        class TestRenderer extends ElementRenderer {
            constructor(context) {
                super(context);
            }
        }

        const renderer = new TestRenderer(mockContext);
        const promise1 = renderer.initializeImageAssets('resistor');
        const promise2 = renderer.initializeImageAssets('resistor');
        
        expect(promise1).to.equal(promise2);
    });
});

describe('ResistorRenderer', () => {
    let mockContext;

    beforeEach(() => {
        mockContext = new MockCanvasContext();
    });

    it('should be instantiable', () => {
        const renderer = new ResistorRenderer(mockContext);
        expect(renderer).to.be.an.instanceof(ElementRenderer);
        expect(renderer).to.be.an.instanceof(ResistorRenderer);
    });

    it('should initialize with resistor type', () => {
        const renderer = new ResistorRenderer(mockContext);
        expect(renderer.context).to.equal(mockContext);
        expect(renderer.isImageLoaded()).to.be.true;
    });

    it('should render resistor element', () => {
        const renderer = new ResistorRenderer(mockContext);
        const element = {
            id: 'R1',
            position: { x: 10, y: 20 }
        };
        
        renderer.render(element);
        const calls = mockContext.getCalls();
        
        expect(calls.some(call => call.method === 'drawImage')).to.be.true;
        expect(calls.some(call => call.method === 'fillText' && call.args[0] === 'R1')).to.be.true;
    });
});

describe('CapacitorRenderer', () => {
    let mockContext;

    beforeEach(() => {
        mockContext = new MockCanvasContext();
    });

    it('should be instantiable', () => {
        const renderer = new CapacitorRenderer(mockContext);
        expect(renderer).to.be.an.instanceof(ElementRenderer);
        expect(renderer).to.be.an.instanceof(CapacitorRenderer);
    });

    it('should initialize with capacitor type', () => {
        const renderer = new CapacitorRenderer(mockContext);
        expect(renderer.context).to.equal(mockContext);
        expect(renderer.isImageLoaded()).to.be.true;
    });

    it('should render capacitor element', () => {
        const renderer = new CapacitorRenderer(mockContext);
        const element = {
            id: 'C1',
            position: { x: 30, y: 40 }
        };
        
        renderer.render(element);
        const calls = mockContext.getCalls();
        
        expect(calls.some(call => call.method === 'drawImage')).to.be.true;
        expect(calls.some(call => call.method === 'fillText' && call.args[0] === 'C1')).to.be.true;
    });
});

describe('JunctionRenderer', () => {
    let mockContext;

    beforeEach(() => {
        mockContext = new MockCanvasContext();
    });

    it('should be instantiable', () => {
        const renderer = new JunctionRenderer(mockContext);
        expect(renderer).to.be.an.instanceof(ElementRenderer);
        expect(renderer).to.be.an.instanceof(JunctionRenderer);
    });

    it('should initialize with junction type', () => {
        const renderer = new JunctionRenderer(mockContext);
        expect(renderer.context).to.equal(mockContext);
        expect(renderer.isImageLoaded()).to.be.true;
    });

    it('should render junction element', () => {
        const renderer = new JunctionRenderer(mockContext);
        const element = {
            id: 'J1',
            position: { x: 50, y: 60 }
        };
        
        renderer.render(element);
        const calls = mockContext.getCalls();
        
        expect(calls.some(call => call.method === 'drawImage')).to.be.true;
        expect(calls.some(call => call.method === 'fillText' && call.args[0] === 'J1')).to.be.true;
    });
});