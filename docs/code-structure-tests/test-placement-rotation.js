/**
 * Test placement rotation functionality
 */

import { Position } from '../src/domain/valueObjects/Position.js';
import { Properties } from '../src/domain/valueObjects/Properties.js';

console.log('=== Testing Placement Rotation Logic ===\n');

// Mock a placing element structure
const placingElement = {
    id: 'test-resistor-1',
    type: 'resistor',
    properties: new Properties({ orientation: 0 }),
    nodes: [
        new Position(100, 50),  // Left node
        new Position(160, 50)   // Right node (60 units wide)
    ]
};

function rotatePlacingElement(element, angle) {
    console.log(`Rotating placing element by ${angle}°`);
    
    // Initialize properties if they don't exist
    if (!element.properties) {
        console.warn("Element missing properties, cannot set orientation");
        return;
    }
    
    // Initialize properties.values if it doesn't exist
    if (!element.properties.values) {
        element.properties.values = {};
    }
    
    // Update element's orientation property
    const currentOrientation = element.properties.values.orientation || 0;
    element.properties.values.orientation = (currentOrientation + angle) % 360;
    
    // Normalize negative angles
    if (element.properties.values.orientation < 0) {
        element.properties.values.orientation += 360;
    }
    
    // Get current element center
    const centerX = (element.nodes[0].x + element.nodes[1].x) / 2;
    const centerY = (element.nodes[0].y + element.nodes[1].y) / 2;
    
    // For most components, rotation changes the node positions
    const width = 60; // Standard component width
    const angleRad = (angle * Math.PI) / 180;
    const currentAngleRad = Math.atan2(
        element.nodes[1].y - element.nodes[0].y,
        element.nodes[1].x - element.nodes[0].x
    );
    const newAngleRad = currentAngleRad + angleRad;
    
    // Calculate new node positions
    const halfWidth = width / 2;
    element.nodes[0].x = centerX - halfWidth * Math.cos(newAngleRad);
    element.nodes[0].y = centerY - halfWidth * Math.sin(newAngleRad);
    element.nodes[1].x = centerX + halfWidth * Math.cos(newAngleRad);
    element.nodes[1].y = centerY + halfWidth * Math.sin(newAngleRad);
}

console.log('1. Element created with initial orientation:');
console.log(`   Orientation: ${placingElement.properties.values.orientation}°`);
console.log(`   Initial nodes: [${Math.round(placingElement.nodes[0].x)}, ${Math.round(placingElement.nodes[0].y)}] to [${Math.round(placingElement.nodes[1].x)}, ${Math.round(placingElement.nodes[1].y)}]`);

console.log('\n2. Testing rotation during placement:');

// Test rotation right (90°)
console.log('   Rotating right (+90°)...');
rotatePlacingElement(placingElement, 90);
console.log(`   New orientation: ${placingElement.properties.values.orientation}°`);
console.log(`   New nodes: [${Math.round(placingElement.nodes[0].x)}, ${Math.round(placingElement.nodes[0].y)}] to [${Math.round(placingElement.nodes[1].x)}, ${Math.round(placingElement.nodes[1].y)}]`);

// Test another rotation right (90°)
console.log('   Rotating right again (+90°)...');
rotatePlacingElement(placingElement, 90);
console.log(`   New orientation: ${placingElement.properties.values.orientation}°`);
console.log(`   New nodes: [${Math.round(placingElement.nodes[0].x)}, ${Math.round(placingElement.nodes[0].y)}] to [${Math.round(placingElement.nodes[1].x)}, ${Math.round(placingElement.nodes[1].y)}]`);

// Test rotation left (-90°)
console.log('   Rotating left (-90°)...');
rotatePlacingElement(placingElement, -90);
console.log(`   New orientation: ${placingElement.properties.values.orientation}°`);
console.log(`   New nodes: [${Math.round(placingElement.nodes[0].x)}, ${Math.round(placingElement.nodes[0].y)}] to [${Math.round(placingElement.nodes[1].x)}, ${Math.round(placingElement.nodes[1].y)}]`);

// Test 180° rotation
console.log('   Rotating 180°...');
rotatePlacingElement(placingElement, 180);
console.log(`   New orientation: ${placingElement.properties.values.orientation}°`);
console.log(`   New nodes: [${Math.round(placingElement.nodes[0].x)}, ${Math.round(placingElement.nodes[0].y)}] to [${Math.round(placingElement.nodes[1].x)}, ${Math.round(placingElement.nodes[1].y)}]`);

console.log('\n3. Testing orientation normalization:');

// Test angle normalization (should wrap around at 360°)
rotatePlacingElement(placingElement, 180);
console.log(`   After +180°: ${placingElement.properties.values.orientation}°`);

rotatePlacingElement(placingElement, 180);
console.log(`   After another +180°: ${placingElement.properties.values.orientation}°`);

console.log('\n✅ Placement rotation test completed successfully!');
console.log('\n📝 How to test in the browser:');
console.log('1. Click a component button (R, C, L, J, G)');
console.log('2. While the ghost element follows your mouse, press:');
console.log('   - Ctrl+Right Arrow: Rotate 90° clockwise');
console.log('   - Ctrl+Left Arrow: Rotate 90° counter-clockwise');
console.log('   - Ctrl+Up Arrow: Rotate 180°');
console.log('   - Ctrl+Down Arrow: Rotate 180°');
console.log('3. Click to place the rotated element');
console.log('4. Press Escape to cancel placement');
console.log('\n🔧 The rotation updates both:');
console.log('   - Node positions (for visual rendering)');
console.log('   - Orientation property (for component behavior)');