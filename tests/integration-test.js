#!/usr/bin/env node
/**
 * Integration Test - PropertyPanel and Undo/Redo System
 * 
 * This test verifies that the key components work together correctly:
 * 1. PropertyPanel opens and displays element values
 * 2. Element properties can be updated through CircuitService
 * 3. Undo/Redo works correctly with property changes
 * 4. Label handling works properly with both strings and Label objects
 */

import { expect } from 'chai';
import { Circuit } from '../src/domain/aggregates/Circuit.js';
import { CircuitService } from '../src/application/CircuitService.js';
import { ElementRegistry } from '../src/config/registry.js';
import { Resistor } from '../src/domain/entities/Resistor.js';
import { Properties } from '../src/domain/valueObjects/Properties.js';
import { Position } from '../src/domain/valueObjects/Position.js';
import { UpdateElementPropertiesCommand } from '../src/gui/commands/UpdateElementPropertiesCommand.js';
import { CommandHistory } from '../src/gui/commands/CommandHistory.js';


// Create test environment
const circuit = new Circuit();
const circuitService = new CircuitService(circuit, ElementRegistry);
const commandHistory = new CommandHistory();

// Create a resistor for testing
const resistorProperties = new Properties({
    resistance: 1000,  // 1kΩ
    orientation: 0
});

const resistor = new Resistor(
    'TEST_R1',
    [new Position(10, 20), new Position(30, 20)],
    null, // no label initially
    resistorProperties
);

// Add the resistor to the circuit
circuitService.addElement(resistor);


// TEST 1: Property Panel Value Display

const elementForPanel = circuitService.getElementByID('TEST_R1');

// TEST 2: Property Updates via CircuitService
const updateSuccess = circuitService.updateElementProperties('TEST_R1', {
    resistance: 2200,
    label: 'R1_Test'
});

const updatedElement = circuitService.getElementByID('TEST_R1');

// TEST 3: Command Pattern with Undo/Redo

// Store initial state
const initialProperties = { ...updatedElement.properties.values };
const initialLabel = updatedElement.label ? updatedElement.label.value : null;

// First command: Change resistance and label
const command1 = new UpdateElementPropertiesCommand(circuitService);
command1.setData('TEST_R1', { resistance: 4700, label: 'R1_Modified' });
commandHistory.executeCommand(command1, circuitService);

let currentElement = circuitService.getElementByID('TEST_R1');

// Second command: Change again
const command2 = new UpdateElementPropertiesCommand(circuitService);
command2.setData('TEST_R1', { resistance: 10000, label: 'R1_Final' });
commandHistory.executeCommand(command2, circuitService);

currentElement = circuitService.getElementByID('TEST_R1');

// First undo: Should go back to command 1 state
commandHistory.undo(circuitService);
currentElement = circuitService.getElementByID('TEST_R1');

// Second undo: Should go back to initial state
commandHistory.undo(circuitService);
currentElement = circuitService.getElementByID('TEST_R1');

// Verify we're back to the initial state
const isResistanceCorrect = currentElement.properties.values.resistance === initialProperties.resistance;
const isLabelCorrect = (currentElement.label?.value || null) === initialLabel;


// Test redo
commandHistory.redo(circuitService);
currentElement = circuitService.getElementByID('TEST_R1');

// TEST 4: State Serialization/Deserialization
const exportedState = circuitService.exportState();

if (exportedState) {
    const parsedState = JSON.parse(exportedState);

    // Modify state and then import to verify restoration
    circuitService.updateElementProperties('TEST_R1', { resistance: 99999, label: 'TempLabel' });

    // Restore from exported state
    circuitService.importState(exportedState);
    const restoredElement = circuitService.getElementByID('TEST_R1');
} else {
}

// SUMMARY
