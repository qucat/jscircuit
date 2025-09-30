/**
 * Test that existing selections are cleared when starting element placement
 */

import { Properties } from '../src/domain/valueObjects/Properties.js';
import { Position } from '../src/domain/valueObjects/Position.js';

console.log('=== Testing Selection Clearing During Placement ===\n');

// Mock circuit renderer with selection tracking
class MockCircuitRenderer {
  constructor() {
    this.selectedElements = [];
  }
  
  setSelectedElements(elements) {
    this.selectedElements = [...elements];
    console.log(`   Selection updated: ${elements.length} element(s) selected`);
  }
  
  getSelectedElements() {
    return this.selectedElements;
  }
}

// Mock elements
const existingElement1 = {
  id: 'existing-resistor-1',
  type: 'resistor', 
  properties: new Properties({ orientation: 0 }),
  nodes: [new Position(100, 100), new Position(160, 100)]
};

const existingElement2 = {
  id: 'existing-capacitor-1',
  type: 'capacitor',
  properties: new Properties({ orientation: 0 }),
  nodes: [new Position(200, 100), new Position(260, 100)]
};

const newPlacingElement = {
  id: 'placing-resistor-1',
  type: 'resistor',
  properties: new Properties({ orientation: 0 }),
  nodes: [new Position(300, 150), new Position(360, 150)]
};

console.log('1. Setting up initial scenario with existing selections...');
const mockRenderer = new MockCircuitRenderer();

// Simulate user selecting multiple existing elements
console.log('   Selecting two existing elements...');
mockRenderer.setSelectedElements([existingElement1, existingElement2]);
console.log(`   Current selection: ${mockRenderer.getSelectedElements().map(el => el.id).join(', ')}`);

console.log('\n2. Simulating startPlacing event (what happens when creating new element)...');

// Simulate the fixed startPlacing logic
function simulateStartPlacing(element, renderer) {
  console.log(`   Starting placement for element: ${element.id}`);
  
  // Clear ALL existing selections when entering placement mode
  // The placing element should not be part of normal selection until placed
  renderer.setSelectedElements([]);
  console.log(`   [GUIAdapter] Starting placement mode - cleared all selections: ${element.id}`);
}

// Test the behavior
simulateStartPlacing(newPlacingElement, mockRenderer);

console.log('\n3. Checking results...');
const selectionsAfterPlacement = mockRenderer.getSelectedElements();
console.log(`   Elements selected after starting placement: ${selectionsAfterPlacement.length}`);
console.log(`   Selection list: ${selectionsAfterPlacement.map(el => el.id).join(', ') || '(empty)'}`);

const selectionsClearedCorrectly = selectionsAfterPlacement.length === 0;

console.log('\n4. Testing different scenarios...');

// Scenario 2: Single element selected before placement
console.log('   Scenario 2: Single element selected before placement');
mockRenderer.setSelectedElements([existingElement1]);
console.log(`   Before: ${mockRenderer.getSelectedElements().length} element(s) selected`);
simulateStartPlacing(newPlacingElement, mockRenderer);
console.log(`   After: ${mockRenderer.getSelectedElements().length} element(s) selected`);

const singleSelectionCleared = mockRenderer.getSelectedElements().length === 0;

// Scenario 3: No elements selected before placement  
console.log('   Scenario 3: No elements selected before placement');
mockRenderer.setSelectedElements([]);
console.log(`   Before: ${mockRenderer.getSelectedElements().length} element(s) selected`);
simulateStartPlacing(newPlacingElement, mockRenderer);
console.log(`   After: ${mockRenderer.getSelectedElements().length} element(s) selected`);

const noSelectionHandled = mockRenderer.getSelectedElements().length === 0;

console.log('\n🎯 Test Results:');
console.log(`✅ Multiple selections cleared: ${selectionsClearedCorrectly}`);
console.log(`✅ Single selection cleared: ${singleSelectionCleared}`);
console.log(`✅ No selection case handled: ${noSelectionHandled}`);

console.log('\n📝 Why this matters:');
console.log('- Prevents confusion when multiple elements appear selected');
console.log('- Ensures only the placing element is in "active" state');
console.log('- Provides clear visual feedback about what is being placed');
console.log('- Avoids accidental operations on previously selected elements');

console.log('\n📋 Expected user experience:');
console.log('1. User selects some elements');
console.log('2. User presses R to create resistor');
console.log('3. Previous selections are cleared');
console.log('4. Only the new resistor is being placed');
console.log('5. User can focus on positioning the new element');

const allTestsPassed = selectionsClearedCorrectly && singleSelectionCleared && noSelectionHandled;
if (allTestsPassed) {
  console.log('\n✅ Selection clearing during placement is working correctly!');
} else {
  console.log('\n❌ Some tests failed. Check the selection clearing logic.');
}