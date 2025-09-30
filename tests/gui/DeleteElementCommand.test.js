import { expect } from "chai";
import { createMockCanvas } from "./canvasFixture.js";
import { Circuit } from "../../src/domain/aggregates/Circuit.js";
import { CircuitService } from "../../src/application/CircuitService.js";
import { CircuitRenderer } from "../../src/gui/renderers/CircuitRenderer.js";
import { DeleteElementCommand } from "../../src/gui/commands/DeleteElementCommand.js";
import { Position } from "../../src/domain/valueObjects/Position.js";
import { rendererFactory } from "../../src/config/settings.js";

describe("DeleteElementCommand Tests", function () {
  let canvas;
  let circuitService;
  let circuitRenderer;
  let testResistor;
  let testWire;
  let testCapacitor;

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

    // Create test elements
    testResistor = {
      id: "R1",
      type: "resistor",
      nodes: [new Position(50, 50), new Position(100, 50)],
      properties: { resistance: 1000 }
    };

    testWire = {
      id: "W1", 
      type: "wire",
      nodes: [new Position(200, 200), new Position(240, 200)],
      properties: {}
    };

    testCapacitor = {
      id: "C1",
      type: "capacitor", 
      nodes: [new Position(150, 150), new Position(200, 150)],
      properties: { capacitance: 1e-12 }
    };

    // Add elements to circuit
    circuitService.addElement(testResistor);
    circuitService.addElement(testWire);
    circuitService.addElement(testCapacitor);
  });

  function setupUpdateListener() {
    const updates = [];
    circuitService.on("update", (event) => {
      updates.push(event);
    });
    return updates;
  }

  describe("execute() method", function () {
    it("should delete a single selected element", function () {
      const updates = setupUpdateListener();
      
      // Select only the resistor
      circuitRenderer.setSelectedElements([testResistor]);
      
      const command = new DeleteElementCommand(circuitService, circuitRenderer);
      command.execute();
      
      // Verify element was deleted from circuit
      const remainingElements = circuitService.getElements();
      expect(remainingElements).to.have.length(2);
      expect(remainingElements.find(el => el.id === "R1")).to.be.undefined;
      expect(remainingElements.find(el => el.id === "W1")).to.not.be.undefined;
      expect(remainingElements.find(el => el.id === "C1")).to.not.be.undefined;
      
      // Verify update events were emitted
      expect(updates.length).to.be.greaterThan(0);
      
      // Verify selection was cleared
      expect(circuitRenderer.getSelectedElements()).to.have.length(0);
    });

    it("should delete multiple selected elements", function () {
      const updates = setupUpdateListener();
      
      // Select both resistor and wire
      circuitRenderer.setSelectedElements([testResistor, testWire]);
      
      const command = new DeleteElementCommand(circuitService, circuitRenderer);
      command.execute();
      
      // Verify both elements were deleted
      const remainingElements = circuitService.getElements();
      expect(remainingElements).to.have.length(1);
      expect(remainingElements.find(el => el.id === "R1")).to.be.undefined;
      expect(remainingElements.find(el => el.id === "W1")).to.be.undefined;
      expect(remainingElements.find(el => el.id === "C1")).to.not.be.undefined;
      
      // Verify update events were emitted
      expect(updates.length).to.be.greaterThan(0);
      
      // Verify selection was cleared
      expect(circuitRenderer.getSelectedElements()).to.have.length(0);
    });

    it("should handle no selected elements gracefully", function () {
      const updates = setupUpdateListener();
      
      // Clear selection
      circuitRenderer.setSelectedElements([]);
      
      const command = new DeleteElementCommand(circuitService, circuitRenderer);
      command.execute();
      
      // Verify no elements were deleted
      const remainingElements = circuitService.getElements();
      expect(remainingElements).to.have.length(3);
      
      // No update events should be emitted for no-op
      expect(updates).to.have.length(0);
    });

    it("should handle null/undefined selected elements", function () {
      // Simulate renderer returning null/undefined
      circuitRenderer.setSelectedElements(null);
      
      const command = new DeleteElementCommand(circuitService, circuitRenderer);
      
      // Should not throw an error
      expect(() => command.execute()).to.not.throw();
      
      // Verify no elements were deleted
      const remainingElements = circuitService.getElements();
      expect(remainingElements).to.have.length(3);
    });

    it("should store deleted elements for undo", function () {
      // Select resistor
      circuitRenderer.setSelectedElements([testResistor]);
      
      const command = new DeleteElementCommand(circuitService, circuitRenderer);
      command.execute();
      
      // Verify deleted elements are stored internally
      expect(command.deletedElements).to.have.length(1);
      expect(command.deletedElements[0].element.id).to.equal("R1");
      expect(command.deletedElements[0].element.type).to.equal("resistor");
      expect(command.deletedElements[0].id).to.equal("R1");
    });
  });

  describe("undo() method", function () {
    it("should restore a single deleted element", function () {
      // Select and delete resistor
      circuitRenderer.setSelectedElements([testResistor]);
      
      const command = new DeleteElementCommand(circuitService, circuitRenderer);
      command.execute();
      
      // Verify deletion
      expect(circuitService.getElements()).to.have.length(2);
      
      // Undo the deletion
      command.undo();
      
      // Verify element was restored
      const elementsAfterUndo = circuitService.getElements();
      expect(elementsAfterUndo).to.have.length(3);
      
      const restoredResistor = elementsAfterUndo.find(el => el.id === "R1");
      expect(restoredResistor).to.not.be.undefined;
      expect(restoredResistor.type).to.equal("resistor");
      expect(restoredResistor.nodes).to.have.length(2);
      expect(restoredResistor.nodes[0].x).to.equal(50);
      expect(restoredResistor.nodes[0].y).to.equal(50);
    });

    it("should restore multiple deleted elements", function () {
      // Select and delete both resistor and wire
      circuitRenderer.setSelectedElements([testResistor, testWire]);
      
      const command = new DeleteElementCommand(circuitService, circuitRenderer);
      command.execute();
      
      // Verify deletion
      expect(circuitService.getElements()).to.have.length(1);
      
      // Undo the deletion
      command.undo();
      
      // Verify both elements were restored
      const elementsAfterUndo = circuitService.getElements();
      expect(elementsAfterUndo).to.have.length(3);
      
      expect(elementsAfterUndo.find(el => el.id === "R1")).to.not.be.undefined;
      expect(elementsAfterUndo.find(el => el.id === "W1")).to.not.be.undefined;
      expect(elementsAfterUndo.find(el => el.id === "C1")).to.not.be.undefined;
    });

    it("should handle undo with no deleted elements gracefully", function () {
      const command = new DeleteElementCommand(circuitService, circuitRenderer);
      
      // Try to undo without executing delete first
      expect(() => command.undo()).to.not.throw();
      
      // Circuit should remain unchanged
      expect(circuitService.getElements()).to.have.length(3);
    });

    it("should handle undo after no-op execute gracefully", function () {
      // Execute with no selection (no-op)
      circuitRenderer.setSelectedElements([]);
      
      const command = new DeleteElementCommand(circuitService, circuitRenderer);
      command.execute();
      
      // Try to undo - should not throw
      expect(() => command.undo()).to.not.throw();
      
      // Circuit should remain unchanged
      expect(circuitService.getElements()).to.have.length(3);
    });

    it("should preserve element properties and state during undo", function () {
      // Modify resistor properties before deletion
      testResistor.properties.resistance = 5000;
      testResistor.properties.orientation = 90;
      
      // Select and delete resistor
      circuitRenderer.setSelectedElements([testResistor]);
      
      const command = new DeleteElementCommand(circuitService, circuitRenderer);
      command.execute();
      
      // Undo the deletion
      command.undo();
      
      // Verify restored element has original properties
      const restoredResistor = circuitService.getElements().find(el => el.id === "R1");
      expect(restoredResistor.properties.resistance).to.equal(5000);
      expect(restoredResistor.properties.orientation).to.equal(90);
    });
  });

  describe("canUndo() method", function () {
    it("should return true after successful execute", function () {
      circuitRenderer.setSelectedElements([testResistor]);
      
      const command = new DeleteElementCommand(circuitService, circuitRenderer);
      command.execute();
      
      expect(command.canUndo()).to.be.true;
    });

    it("should return false for new command", function () {
      const command = new DeleteElementCommand(circuitService, circuitRenderer);
      
      expect(command.canUndo()).to.be.false;
    });

    it("should return false after no-op execute", function () {
      circuitRenderer.setSelectedElements([]);
      
      const command = new DeleteElementCommand(circuitService, circuitRenderer);
      command.execute();
      
      expect(command.canUndo()).to.be.false;
    });
  });

  describe("edge cases", function () {
    it("should handle elements that no longer exist in circuit", function () {
      // Select resistor
      circuitRenderer.setSelectedElements([testResistor]);
      
      // Manually remove element from circuit (simulating external deletion)
      circuitService.deleteElement("R1");
      
      const command = new DeleteElementCommand(circuitService, circuitRenderer);
      
      // Should not throw when trying to delete non-existent element
      expect(() => command.execute()).to.not.throw();
      
      // Circuit should remain with 2 elements (wire and capacitor)
      expect(circuitService.getElements()).to.have.length(2);
    });
  });
});