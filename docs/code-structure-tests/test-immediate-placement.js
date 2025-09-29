/**
 * Test that elements immediately stick to pointer position when created
 */

import { GUIAdapter } from '../src/gui/adapters/GUIAdapter.js';
import { CircuitService } from '../src/domain/services/CircuitService.js';
import { ElementRegistry } from '../src/domain/registries/ElementRegistry.js';
import { RendererFactory } from '../src/gui/renderers/RendererFactory.js';
import { GUICommandRegistry } from '../src/gui/commands/GUICommandRegistry.js';
import { Properties } from '../src/domain/valueObjects/Properties.js';
import { Position } from '../src/domain/valueObjects/Position.js';

console.log('=== Testing Immediate Element Placement ===\n');

// Create a mock canvas
const mockCanvas = {
  addEventListener: () => {},
  width: 800,
  height: 600,
  getContext: () => ({
    clearRect: () => {},
    save: () => {},
    restore: () => {},
    translate: () => {},
    scale: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
    fill: () => {},
    drawImage: () => {},
    fillText: () => {},
    measureText: () => ({ width: 10 }),
    setLineDash: () => {},
  }),
};

// Mock DOM element
const mockContainer = document.createElement('div');

// Create dependencies
const circuitService = new CircuitService();
const elementRegistry = new ElementRegistry();
const rendererFactory = new RendererFactory();
const guiCommandRegistry = new GUICommandRegistry(circuitService, elementRegistry);

// Create GUIAdapter
const guiAdapter = new GUIAdapter(
  mockContainer,
  mockCanvas,
  circuitService,
  elementRegistry,
  rendererFactory,
  guiCommandRegistry
);

console.log('1. GUIAdapter created and initialized');

// Simulate mouse position before element creation
console.log('2. Simulating mouse movement to position (200, 150)');
guiAdapter.currentMousePos.x = 200;
guiAdapter.currentMousePos.y = 150;

// Create an element (this should trigger placement mode)
console.log('3. Creating resistor element...');
const element = {
  id: 'test-resistor',
  type: 'resistor',
  properties: new Properties({ orientation: 0 }),
  nodes: [
    new Position(400, 300), // Default position (should be overridden)
    new Position(460, 300)  // Default position (should be overridden)
  ]
};

console.log(`   Initial element position: [${element.nodes[0].x}, ${element.nodes[0].y}] to [${element.nodes[1].x}, ${element.nodes[1].y}]`);

// Simulate the placement event that would be triggered by AddElementCommand
console.log('4. Triggering startPlacing event...');
circuitService.emit('startPlacing', { element });

// Check that the element was immediately positioned at the mouse location
const snappedMouseX = Math.round(200 / 10) * 10; // 200
const snappedMouseY = Math.round(150 / 10) * 10; // 150
const width = 60;
const expectedX1 = snappedMouseX - width / 2; // 170
const expectedY1 = snappedMouseY; // 150  
const expectedX2 = snappedMouseX + width / 2; // 230
const expectedY2 = snappedMouseY; // 150

console.log(`   Expected position after placement: [${expectedX1}, ${expectedY1}] to [${expectedX2}, ${expectedY2}]`);
console.log(`   Actual position after placement: [${element.nodes[0].x}, ${element.nodes[0].y}] to [${element.nodes[1].x}, ${element.nodes[1].y}]`);

// Verify the element was positioned correctly
const positionMatches = (
  element.nodes[0].x === expectedX1 &&
  element.nodes[0].y === expectedY1 &&
  element.nodes[1].x === expectedX2 &&
  element.nodes[1].y === expectedY2
);

if (positionMatches) {
  console.log('✅ SUCCESS: Element immediately positioned at mouse location!');
} else {
  console.log('❌ FAILED: Element not positioned at mouse location');
  console.log(`   Position difference: Node 0: (${element.nodes[0].x - expectedX1}, ${element.nodes[0].y - expectedY1})`);
  console.log(`   Position difference: Node 1: (${element.nodes[1].x - expectedX2}, ${element.nodes[1].y - expectedY2})`);
}

// Test with different mouse position
console.log('\n5. Testing with different mouse position (350, 200)');
guiAdapter.currentMousePos.x = 350;
guiAdapter.currentMousePos.y = 200;

const element2 = {
  id: 'test-capacitor',
  type: 'capacitor',
  properties: new Properties({ orientation: 0 }),
  nodes: [
    new Position(400, 300), // Default position (should be overridden)
    new Position(460, 300)  // Default position (should be overridden)
  ]
};

console.log(`   Initial element2 position: [${element2.nodes[0].x}, ${element2.nodes[0].y}] to [${element2.nodes[1].x}, ${element2.nodes[1].y}]`);

// Simulate placement
circuitService.emit('startPlacing', { element: element2 });

// Check positioning
const snappedMouseX2 = Math.round(350 / 10) * 10; // 350
const snappedMouseY2 = Math.round(200 / 10) * 10; // 200
const expectedX1_2 = snappedMouseX2 - width / 2; // 320
const expectedY1_2 = snappedMouseY2; // 200
const expectedX2_2 = snappedMouseX2 + width / 2; // 380
const expectedY2_2 = snappedMouseY2; // 200

console.log(`   Expected position after placement: [${expectedX1_2}, ${expectedY1_2}] to [${expectedX2_2}, ${expectedY2_2}]`);
console.log(`   Actual position after placement: [${element2.nodes[0].x}, ${element2.nodes[0].y}] to [${element2.nodes[1].x}, ${element2.nodes[1].y}]`);

const positionMatches2 = (
  element2.nodes[0].x === expectedX1_2 &&
  element2.nodes[0].y === expectedY1_2 &&
  element2.nodes[1].x === expectedX2_2 &&
  element2.nodes[1].y === expectedY2_2
);

if (positionMatches2) {
  console.log('✅ SUCCESS: Element2 immediately positioned at different mouse location!');
} else {
  console.log('❌ FAILED: Element2 not positioned at mouse location');
}

console.log('\n🎯 Test Summary:');
console.log('- Elements are immediately positioned at mouse location when created');
console.log('- No mouse movement required to make elements stick to pointer');
console.log('- Grid snapping works correctly during immediate placement');
console.log('- Multiple elements can be placed at different positions');

if (positionMatches && positionMatches2) {
  console.log('\n✅ All tests passed! Immediate placement is working correctly.');
} else {
  console.log('\n❌ Some tests failed. Check the implementation.');
}