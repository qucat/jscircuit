import { expect } from "chai";
import { createMockCanvas } from "./canvasFixture.js";
import { Circuit } from "../../src/domain/aggregates/Circuit.js";
import { CircuitService } from "../../src/application/CircuitService.js";
import { CircuitRenderer } from "../../src/gui/renderers/CircuitRenderer.js";
import { RotateElementCommand } from "../../src/gui/commands/RotateElementCommand.js";
import { Position } from "../../src/domain/valueObjects/Position.js";
import { rendererFactory } from "../../src/config/registry.js";

describe("RotateElementCommand Tests", function () {
  let canvas;
  let circuitService;
  let circuitRenderer;
  let testResistor;

  beforeEach(() => {
    canvas = createMockCanvas();
    const circuit = new Circuit();
    circuitService = new CircuitService(circuit);
    circuitRenderer = new CircuitRenderer(
      canvas, 
      circuitService, 
      rendererFactory, 
      () => false
    );

    // Create a test resistor (horizontal: left to right)
    testResistor = {
      id: "R1",
      type: "resistor",
      nodes: [new Position(50, 50), new Position(100, 50)],
    };
    circuitService.addElement(testResistor);
  });

  it("should rotate a selected element 90 degrees clockwise", function () {
    // Select the resistor
    circuitRenderer.setSelectedElements([testResistor]);
    
    const command = new RotateElementCommand(circuitService, circuitRenderer);
    
    // Store original positions
    const origNode0 = { x: testResistor.nodes[0].x, y: testResistor.nodes[0].y };
    const origNode1 = { x: testResistor.nodes[1].x, y: testResistor.nodes[1].y };
    
    // Execute rotation
    command.execute();
    
    // After 90° clockwise rotation from horizontal (50,50)-(100,50):
    // The first node stays as reference point (50,50)
    // The second node should rotate from (50,0) relative to (0,-50) relative
    // So (100,50) should become (50,100) - but let's check the actual logic
    
    expect(testResistor.nodes[0].x).to.equal(origNode0.x); // Reference point unchanged
    expect(testResistor.nodes[0].y).to.equal(origNode0.y);
    
    // The second node should have rotated 90° clockwise around the first node
    // Original relative position: (50, 0) -> After 90° rotation: (0, 50)
    expect(testResistor.nodes[1].x).to.equal(50); // 50 + 0
    expect(testResistor.nodes[1].y).to.equal(100); // 50 + 50
  });

  it("should rotate multiple selected elements", function () {
    // Add another resistor
    const testResistor2 = {
      id: "R2",
      type: "resistor", 
      nodes: [new Position(150, 100), new Position(200, 100)],
    };
    circuitService.addElement(testResistor2);
    
    // Select both resistors
    circuitRenderer.setSelectedElements([testResistor, testResistor2]);
    
    const command = new RotateElementCommand(circuitService, circuitRenderer);
    
    // Store original positions
    const origR1Node1 = { x: testResistor.nodes[1].x, y: testResistor.nodes[1].y };
    const origR2Node1 = { x: testResistor2.nodes[1].x, y: testResistor2.nodes[1].y };
    
    // Execute rotation
    command.execute();
    
    // Both elements should be rotated
    expect(testResistor.nodes[1].x).to.not.equal(origR1Node1.x);
    expect(testResistor2.nodes[1].x).to.not.equal(origR2Node1.x);
  });

  it("should undo rotation correctly", function () {
    // Select the resistor
    circuitRenderer.setSelectedElements([testResistor]);
    
    const command = new RotateElementCommand(circuitService, circuitRenderer);
    
    // Store original positions
    const origNode0 = { x: testResistor.nodes[0].x, y: testResistor.nodes[0].y };
    const origNode1 = { x: testResistor.nodes[1].x, y: testResistor.nodes[1].y };
    
    // Execute rotation
    command.execute();
    
    // Verify it rotated
    expect(testResistor.nodes[1].x).to.not.equal(origNode1.x);
    expect(testResistor.nodes[1].y).to.not.equal(origNode1.y);
    
    // Undo rotation
    command.undo();
    
    // Should be back to original positions
    expect(testResistor.nodes[0].x).to.equal(origNode0.x);
    expect(testResistor.nodes[0].y).to.equal(origNode0.y);
    expect(testResistor.nodes[1].x).to.equal(origNode1.x);
    expect(testResistor.nodes[1].y).to.equal(origNode1.y);
  });

  it("should handle no selected elements gracefully", function () {
    // No elements selected
    circuitRenderer.setSelectedElements([]);
    
    const command = new RotateElementCommand(circuitService, circuitRenderer);
    
    // Should not throw an error
    expect(() => command.execute()).to.not.throw();
  });
});
