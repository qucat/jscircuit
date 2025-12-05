import { expect } from "chai";
import { CommandHistory } from "../src/gui/commands/CommandHistory.js";
import { UpdateElementPropertiesCommand } from "../src/gui/commands/UpdateElementPropertiesCommand.js";
import { createGUIEnvironmentFixture } from "./gui/GUIEnvironmentFixture.js";

// Mock Image class to prevent errors in renderers during tests
global.Image = class {
  constructor() {
    this.onload = () => {};
    this.src = "";
  }
};

describe("UpdateElementPropertiesCommand and Undo/Redo", () => {
  let circuitService, circuitRenderer, history, resistor;

  beforeEach(async () => {
    const fixture = await createGUIEnvironmentFixture();
    circuitService = fixture.circuitService;
    circuitRenderer = fixture.circuitRenderer;
    
    // Add a test resistor
    const addCommand = fixture.getAddElementCommand("resistor");
    addCommand.execute(circuitService);
    resistor = circuitService.getElements()[0];
    
    history = new CommandHistory();
  });

  it("should update element properties correctly", () => {
    const command = new UpdateElementPropertiesCommand(circuitService, circuitRenderer);
    const newProperties = { resistance: 500, label: "R1" };
    
    
    command.setData(resistor.id, newProperties);
    command.execute();
    
    
    // Check that properties were updated
    expect(resistor.getProperties().values.resistance).to.equal(500);
    expect(resistor.label.value).to.equal("R1");
  });

  it("should support undo/redo with property updates using CommandHistory", () => {
    // Store original state
    const originalProperties = { ...resistor.getProperties().values };
    const originalLabel = resistor.label;
    
    
    // First property update
    const command1 = new UpdateElementPropertiesCommand(circuitService, circuitRenderer);
    const newProperties1 = { resistance: 100, label: "R1" };
    command1.setData(resistor.id, newProperties1);
    
    history.executeCommand(command1, circuitService);
    
    expect(resistor.getProperties().values.resistance).to.equal(100);
    expect(resistor.label.value).to.equal("R1");

    // Second property update
    const command2 = new UpdateElementPropertiesCommand(circuitService, circuitRenderer);
    const newProperties2 = { resistance: 200, label: "R2" };
    command2.setData(resistor.id, newProperties2);
    
    history.executeCommand(command2, circuitService);
    
    expect(resistor.getProperties().values.resistance).to.equal(200);
    expect(resistor.label.value).to.equal("R2");

    // First undo - should go back to first update
    const stateBeforeUndo = circuitService.exportState();
    
    history.undo(circuitService);
    
    const stateAfterUndo = circuitService.exportState();
    
    // Get the current element from the circuit (new instance after importState)
    const currentResistor = circuitService.getElements()[0];
    expect(currentResistor.getProperties().values.resistance).to.equal(100);
    expect(currentResistor.label.value).to.equal("R1");

    // Second undo - should go back to original state
    history.undo(circuitService);
    
    const secondUndoResistor = circuitService.getElements()[0];
    expect(secondUndoResistor.getProperties().values.resistance).to.deep.equal(originalProperties.resistance);
    expect(secondUndoResistor.label).to.equal(originalLabel);

    // First redo - should go back to first update
    history.redo(circuitService);
    
    const redoResistor = circuitService.getElements()[0];
    expect(redoResistor.getProperties().values.resistance).to.equal(100);
    expect(redoResistor.label.value).to.equal("R1");
  });

  it("should create separate command instances for multiple updates", () => {
    const command1 = new UpdateElementPropertiesCommand(circuitService, circuitRenderer);
    const command2 = new UpdateElementPropertiesCommand(circuitService, circuitRenderer);
    
    // They should be different instances
    expect(command1).to.not.equal(command2);
    
    command1.setData(resistor.id, { resistance: 100, label: "R1" });
    command2.setData(resistor.id, { resistance: 200, label: "R2" });
    
    // They should have different old properties captured
    expect(command1.newProperties.resistance).to.equal(100);
    expect(command2.newProperties.resistance).to.equal(200);
  });

  it("should test CircuitService.updateElementProperties directly", () => {
    const originalProps = { ...resistor.getProperties().values };
    const originalLabel = resistor.label;
    
    
    const success = circuitService.updateElementProperties(resistor.id, { 
      resistance: 750, 
      label: "TestResistor" 
    });
    
    
    expect(success).to.be.true;
    expect(resistor.getProperties().values.resistance).to.equal(750);
    expect(resistor.label.value).to.equal("TestResistor");
  });
});