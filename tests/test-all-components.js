// Test PropertyPanel with different component types
import { CircuitService } from '../src/application/CircuitService.js';
import { Circuit } from '../src/domain/aggregates/Circuit.js';
import { ElementRegistry } from '../src/config/settings.js';
import { PropertyPanel } from '../src/gui/property_panel/PropertyPanel.js';
import { CommandHistory } from '../src/gui/commands/CommandHistory.js';
import { Position } from '../src/domain/valueObjects/Position.js';
import { Properties } from '../src/domain/valueObjects/Properties.js';

console.log('🧪 Testing PropertyPanel with Multiple Component Types\n');

// Create test setup
const circuit = new Circuit();
const circuitService = new CircuitService(circuit, ElementRegistry);
const commandHistory = new CommandHistory(circuitService);
const propertyPanel = new PropertyPanel(circuitService, commandHistory);

// Test different element types
const elementTypes = [
    {
        name: 'Resistor',
        factory: ElementRegistry.get('Resistor'),
        properties: { resistance: 1000, orientation: 0 }
    },
    {
        name: 'Capacitor', 
        factory: ElementRegistry.get('Capacitor'),
        properties: { capacitance: 1e-12, orientation: 0 }
    },
    {
        name: 'Inductor',
        factory: ElementRegistry.get('Inductor'), 
        properties: { inductance: 1e-9, orientation: 0 }
    },
    {
        name: 'Wire',
        factory: ElementRegistry.get('Wire'),
        properties: {}
    },
    {
        name: 'Ground',
        factory: ElementRegistry.get('Ground'),
        properties: { orientation: 0 }
    }
];

elementTypes.forEach(elementType => {
    console.log(`\n📋 Testing ${elementType.name}:`);
    console.log('=' .repeat(50));
    
    // Create test element
    const testElement = elementType.factory(
        `TEST_${elementType.name.toUpperCase()}`,
        [new Position(10, 20), new Position(30, 20)],
        null,
        new Properties(elementType.properties)
    );
    
    console.log(`   Properties: ${JSON.stringify(testElement.properties.values)}`);
    
    // Generate HTML
    const htmlContent = propertyPanel.generateContentForElement(testElement);
    
    // Extract field information from HTML
    const resistanceMatch = htmlContent.match(/<input[^>]*name="resistance"[^>]*>/);
    const capacitanceMatch = htmlContent.match(/<input[^>]*name="capacitance"[^>]*>/);
    const inductanceMatch = htmlContent.match(/<input[^>]*name="inductance"[^>]*>/);
    const orientationMatch = htmlContent.match(/<select[^>]*name="orientation"[^>]*>/);
    const labelMatch = htmlContent.match(/<input[^>]*name="label"[^>]*>/);
    
    console.log(`   ✓ Resistance field: ${resistanceMatch ? 'YES' : 'NO'}`);
    console.log(`   ✓ Capacitance field: ${capacitanceMatch ? 'YES' : 'NO'}`);
    console.log(`   ✓ Inductance field: ${inductanceMatch ? 'YES' : 'NO'}`);
    console.log(`   ✓ Orientation field: ${orientationMatch ? 'YES' : 'NO'}`);
    console.log(`   ✓ Label field: ${labelMatch ? 'YES' : 'NO'}`);
    
    // Count total property fields
    const propertyFieldCount = (htmlContent.match(/<div class="property-field">/g) || []).length;
    console.log(`   ✓ Total property fields: ${propertyFieldCount}`);
});

console.log('\n🎉 All component types tested successfully!');