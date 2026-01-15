// Test PropertyPanel HTML generation
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

// Create a test resistor
const resistorFactory = ElementRegistry.get('resistor');
const testResistor = resistorFactory(
    'TEST_R1',
    [new Position(10, 20), new Position(30, 20)],
    null,
    new Properties({ resistance: 1000, orientation: 0 })
);


// Create PropertyPanel
const propertyPanel = new PropertyPanel(circuitService, commandHistory);

// Test HTML generation

// Access the private method for testing
const htmlContent = propertyPanel.generateContentForElement(testResistor);


