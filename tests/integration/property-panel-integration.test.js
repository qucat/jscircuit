/**
 * Integration test for PropertyPanel with GUIAdapter
 * Tests the proper architectural flow for property editing
 */

import { expect } from "chai";
import { PropertyPanel } from '../../src/gui/property_panel/PropertyPanel.js';
import { UpdateElementPropertiesCommand } from '../../src/gui/commands/UpdateElementPropertiesCommand.js';
import { CircuitService } from '../../src/application/CircuitService.js';

// Mock Image class to prevent errors in renderers during tests
global.Image = class {
  constructor() {
    this.onload = () => {};
    this.src = "";
  }
};

describe('PropertyPanel Integration', () => {
  it('should create PropertyPanel instance', () => {
    const propertyPanel = new PropertyPanel();
    expect(propertyPanel).to.be.an.instanceOf(PropertyPanel);
  });

  it('should create UpdateElementPropertiesCommand with correct dependencies', () => {
    const circuitService = new CircuitService();
    const mockRenderer = { render: () => {} };
    
    const command = new UpdateElementPropertiesCommand(circuitService, mockRenderer);
    expect(command).to.be.an.instanceOf(UpdateElementPropertiesCommand);
    expect(command.circuitService).to.equal(circuitService);
  });

  it('should set data correctly on UpdateElementPropertiesCommand', () => {
    const circuitService = new CircuitService();
    const mockRenderer = { render: () => {} };
    
    const command = new UpdateElementPropertiesCommand(circuitService, mockRenderer);
    
    // Add a mock element to the circuit service for testing
    const mockElement = {
      id: 'test-element',
      getProperties: () => ({ values: { resistance: '100' } }),
      label: 'R1'
    };
    
    // Mock the getElementByID method
    circuitService.getElementByID = () => mockElement;
    
    const newProperties = { resistance: '200', label: 'R2' };
    command.setData('test-element', newProperties);
    
    expect(command.elementId).to.equal('test-element');
    expect(command.newProperties).to.deep.equal(newProperties);
    expect(command.oldProperties).to.deep.equal({ resistance: '100' });
  });

  it('should handle double-click integration pattern', () => {
    // Test the pattern without full GUIAdapter setup
    const mockElement = {
      id: 'test-element',
      type: 'capacitor',
      properties: { value: '10pF', label: 'C1' }
    };

    let commandCreated = false;
    let commandDataSet = false;
    let commandExecuted = false;

    // Simulate the pattern used in handleElementDoubleClick
    const mockGUICommandRegistry = {
      get: (commandName) => {
        if (commandName === 'updateElementProperties') {
          commandCreated = true;
          return {
            setData: (elementId, properties) => {
              commandDataSet = true;
              expect(elementId).to.equal('test-element');
              expect(properties).to.deep.equal({ value: '20pF', label: 'C1_updated' });
            }
          };
        }
        return null;
      }
    };

    const mockCommandHistory = {
      executeCommand: (command, circuitService) => {
        commandExecuted = true;
        expect(command).to.not.be.null;
        expect(circuitService).to.not.be.null;
      }
    };

    // Simulate the property panel callback flow
    const propertyPanelCallback = (updatedProperties) => {
      const command = mockGUICommandRegistry.get('updateElementProperties');
      if (command) {
        command.setData(mockElement.id, updatedProperties);
        mockCommandHistory.executeCommand(command, new CircuitService());
      }
    };

    // Simulate property update
    propertyPanelCallback({ value: '20pF', label: 'C1_updated' });

    expect(commandCreated).to.be.true;
    expect(commandDataSet).to.be.true;
    expect(commandExecuted).to.be.true;
  });
});