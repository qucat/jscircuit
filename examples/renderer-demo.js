// examples/renderer-demo.js
// Demo showing the new dynamic image loading system

import { ResistorRenderer } from '../src/gui/renderers/ResistorRenderer.js';
import { CapacitorRenderer } from '../src/gui/renderers/CapacitorRenderer.js';
import { JunctionRenderer } from '../src/gui/renderers/JunctionRenderer.js';

// Mock canvas context for demo
class MockCanvasContext {
    constructor() {
        this.operations = [];
    }

    drawImage(image, x, y) {
        this.operations.push({
            type: 'drawImage',
            imageSrc: image.src,
            x: x,
            y: y
        });
    }

    fillText(text, x, y) {
        this.operations.push({
            type: 'fillText',
            text: text,
            x: x,
            y: y
        });
    }

    set fillStyle(value) {
        this.operations.push({
            type: 'setFillStyle',
            value: value
        });
    }

    set font(value) {
        this.operations.push({
            type: 'setFont',
            value: value
        });
    }

    getOperations() {
        return this.operations;
    }
}

// Demo function
export function demonstrateRenderers() {
    console.log('=== Dynamic Image Loading Demo ===\n');
    
    const mockContext = new MockCanvasContext();
    
    // Create renderers
    const resistorRenderer = new ResistorRenderer(mockContext);
    const capacitorRenderer = new CapacitorRenderer(mockContext);
    const junctionRenderer = new JunctionRenderer(mockContext);
    
    // Demo elements
    const resistor = { id: 'R1', position: { x: 10, y: 20 } };
    const capacitor = { id: 'C1', position: { x: 30, y: 40 } };
    const junction = { id: 'J1', position: { x: 50, y: 60 } };
    
    console.log('1. Rendering resistor with default state:');
    resistorRenderer.render(resistor);
    console.log('   - Image loaded:', resistorRenderer.isImageLoaded());
    console.log('   - Default image path:', resistorRenderer.getImage('default').src);
    
    console.log('\n2. Rendering resistor with hover state:');
    resistorRenderer.render(resistor, { hover: true });
    console.log('   - Hover image path:', resistorRenderer.getImage('hover').src);
    
    console.log('\n3. Rendering capacitor with selected state:');
    capacitorRenderer.render(capacitor, { selected: true });
    console.log('   - Selected image path:', capacitorRenderer.getImage('selected').src);
    
    console.log('\n4. Rendering junction with hover+selected state:');
    junctionRenderer.render(junction, { hover: true, selected: true });
    console.log('   - Hover+selected image path:', junctionRenderer.getImage('hover_selected').src);
    
    console.log('\n5. All rendered operations:');
    mockContext.getOperations().forEach((op, index) => {
        console.log(`   ${index + 1}. ${op.type}:`, op);
    });
    
    return {
        resistorRenderer,
        capacitorRenderer,
        junctionRenderer,
        operations: mockContext.getOperations()
    };
}

// Run demo if this file is executed directly
if (typeof window === 'undefined') {
    demonstrateRenderers();
}