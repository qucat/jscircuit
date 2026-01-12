// Test PropertyPanel with different component types
import { CircuitService } from '../src/application/CircuitService.js';
import { Circuit } from '../src/domain/aggregates/Circuit.js';
import { ElementRegistry } from '../src/config/registry.js';
import { PropertyPanel } from '../src/gui/property_panel/PropertyPanel.js';
import { CommandHistory } from '../src/gui/commands/CommandHistory.js';
import { Position } from '../src/domain/valueObjects/Position.js';
import { Properties } from '../src/domain/valueObjects/Properties.js';


// Create test setup
const circuit = new Circuit();
const circuitService = new CircuitService(circuit, ElementRegistry);
const commandHistory = new CommandHistory(circuitService);
const propertyPanel = new PropertyPanel(circuitService, commandHistory);

// Test different element types
const elementTypes = [
    {
        name: 'resistor',
        factory: ElementRegistry.get('resistor'),
        properties: { resistance: 1000, orientation: 0 }
    },
    {
        name: 'Capacitor', 
        factory: ElementRegistry.get('capacitor'),
        properties: { capacitance: 1e-12, orientation: 0 }
    },
    {
        name: 'Inductor',
        factory: ElementRegistry.get('inductor'), 
        properties: { inductance: 1e-9, orientation: 0 }
    },
    {
        name: 'Wire',
        factory: ElementRegistry.get('wire'),
        properties: {}
    },
    {
        name: 'Ground',
        factory: ElementRegistry.get('ground'),
        properties: { orientation: 0 }
    }
];

elementTypes.forEach(elementType => {
    
    // Create test element
    const testElement = elementType.factory(
        `TEST_${elementType.name.toUpperCase()}`,
        [new Position(10, 20), new Position(30, 20)],
        null,
        new Properties(elementType.properties)
    );
    
    
    // Generate HTML
    const htmlContent = propertyPanel.generateContentForElement(testElement);
    
    // Extract field information from HTML
    const resistanceMatch = htmlContent.match(/<input[^>]*name="resistance"[^>]*>/);
    const capacitanceMatch = htmlContent.match(/<input[^>]*name="capacitance"[^>]*>/);
    const inductanceMatch = htmlContent.match(/<input[^>]*name="inductance"[^>]*>/);
    const orientationMatch = htmlContent.match(/<select[^>]*name="orientation"[^>]*>/);
    const labelMatch = htmlContent.match(/<input[^>]*name="label"[^>]*>/);
    
    
    // Count total property fields
    const propertyFieldCount = (htmlContent.match(/<div class="property-field">/g) || []).length;
});

