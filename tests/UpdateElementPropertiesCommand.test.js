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
    
    console.log("Original resistor properties:", resistor.getProperties().values);
    console.log("Original resistor label:", resistor.label);
    
    command.setData(resistor.id, newProperties);
    command.execute();
    
    console.log("After update - resistor properties:", resistor.getProperties().values);
    console.log("After update - resistor label:", resistor.label);
    
    // Check that properties were updated
    expect(resistor.getProperties().values.resistance).to.equal(500);
    expect(resistor.label.value).to.equal("R1");
  });

  it("should support undo/redo with property updates using CommandHistory", () => {
    // Store original state
    const originalProperties = { ...resistor.getProperties().values };
    const originalLabel = resistor.label;
    
    console.log("=== Initial State ===");
    console.log("Original properties:", originalProperties);
    console.log("Original label:", originalLabel);
    
    // First property update
    const command1 = new UpdateElementPropertiesCommand(circuitService, circuitRenderer);
    const newProperties1 = { resistance: 100, label: "R1" };
    command1.setData(resistor.id, newProperties1);
    
    console.log("=== First Update ===");
    history.executeCommand(command1, circuitService);
    
    console.log("After first update - properties:", resistor.getProperties().values);
    console.log("After first update - label:", resistor.label);
    expect(resistor.getProperties().values.resistance).to.equal(100);
    expect(resistor.label.value).to.equal("R1");

    // Second property update
    const command2 = new UpdateElementPropertiesCommand(circuitService, circuitRenderer);
    const newProperties2 = { resistance: 200, label: "R2" };
    command2.setData(resistor.id, newProperties2);
    
    console.log("=== Second Update ===");
    history.executeCommand(command2, circuitService);
    
    console.log("After second update - properties:", resistor.getProperties().values);
    console.log("After second update - label:", resistor.label);
    expect(resistor.getProperties().values.resistance).to.equal(200);
    expect(resistor.label.value).to.equal("R2");

    // First undo - should go back to first update
    console.log("=== First Undo ===");
    console.log("History length before undo:", history.history.length);
    const stateBeforeUndo = circuitService.exportState();
    console.log("State before undo:", JSON.parse(stateBeforeUndo));
    
    history.undo(circuitService);
    
    const stateAfterUndo = circuitService.exportState();
    console.log("State after undo:", JSON.parse(stateAfterUndo));
    console.log("History length after undo:", history.history.length);
    
    // Get the current element from the circuit (new instance after importState)
    const currentResistor = circuitService.getElements()[0];
    console.log("After first undo - properties:", currentResistor.getProperties().values);
    console.log("After first undo - label:", currentResistor.label);
    expect(currentResistor.getProperties().values.resistance).to.equal(100);
    expect(currentResistor.label.value).to.equal("R1");

    // Second undo - should go back to original state
    console.log("=== Second Undo ===");
    history.undo(circuitService);
    
    const secondUndoResistor = circuitService.getElements()[0];
    console.log("After second undo - properties:", secondUndoResistor.getProperties().values);
    console.log("After second undo - label:", secondUndoResistor.label);
    expect(secondUndoResistor.getProperties().values.resistance).to.deep.equal(originalProperties.resistance);
    expect(secondUndoResistor.label).to.equal(originalLabel);

    // First redo - should go back to first update
    console.log("=== First Redo ===");
    history.redo(circuitService);
    
    const redoResistor = circuitService.getElements()[0];
    console.log("After first redo - properties:", redoResistor.getProperties().values);
    console.log("After first redo - label:", redoResistor.label);
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
    
    console.log("=== Direct CircuitService Test ===");
    console.log("Before update - properties:", originalProps);
    console.log("Before update - label:", originalLabel);
    
    const success = circuitService.updateElementProperties(resistor.id, { 
      resistance: 750, 
      label: "TestResistor" 
    });
    
    console.log("Update success:", success);
    console.log("After update - properties:", resistor.getProperties().values);
    console.log("After update - label:", resistor.label);
    
    expect(success).to.be.true;
    expect(resistor.getProperties().values.resistance).to.equal(750);
    expect(resistor.label.value).to.equal("TestResistor");
  });
});