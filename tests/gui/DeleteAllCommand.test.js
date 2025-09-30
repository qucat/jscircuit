import { expect } from "chai";
import { createMockCanvas } from "./canvasFixture.js";
import { Circuit } from "../../src/domain/aggregates/Circuit.js";
import { CircuitService } from "../../src/application/CircuitService.js";
import { CircuitRenderer } from "../../src/gui/renderers/CircuitRenderer.js";
import { DeleteAllCommand } from "../../src/gui/commands/DeleteAllCommand.js";
import { Position } from "../../src/domain/valueObjects/Position.js";
import { rendererFactory } from "../../src/config/settings.js";

describe("DeleteAllCommand Tests", function () {
  let canvas;
  let circuitService;
  let circuitRenderer;
  let testResistor;
  let testWire;
  let testCapacitor;
  let testInductor;

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
      properties: { resistance: 1000, orientation: 0 }
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
      properties: { capacitance: 1e-12, orientation: 90 }
    };

    testInductor = {
      id: "L1",
      type: "inductor",
      nodes: [new Position(300, 300), new Position(350, 300)],
      properties: { inductance: 1e-9, orientation: 180 }
    };

    // Add elements to circuit
    circuitService.addElement(testResistor);
    circuitService.addElement(testWire);
    circuitService.addElement(testCapacitor);
    circuitService.addElement(testInductor);
  });

  function setupUpdateListener() {
    const updates = [];
    circuitService.on("update", (event) => {
      updates.push(event);
    });
    return updates;
  }

  describe("execute() method", function () {
    it("should delete all elements from circuit", function () {
      const updates = setupUpdateListener();
      
      const command = new DeleteAllCommand(circuitService, circuitRenderer);
      command.execute();
      
      // Verify all elements were deleted
      const remainingElements = circuitService.getElements();
      expect(remainingElements).to.have.length(0);
      
      // Verify update events were emitted
      expect(updates.length).to.be.greaterThan(0);
      
      // Verify selection was cleared
      expect(circuitRenderer.getSelectedElements()).to.have.length(0);
    });

    it("should handle empty circuit gracefully", function () {
      // Clear circuit first
      circuitService.getElements().forEach(element => {
        circuitService.deleteElement(element.id);
      });
      
      const updates = setupUpdateListener();
      
      const command = new DeleteAllCommand(circuitService, circuitRenderer);
      command.execute();
      
      // Should not throw and circuit should remain empty
      expect(circuitService.getElements()).to.have.length(0);
      
      // No update events should be emitted for no-op
      expect(updates).to.have.length(0);
    });

    it("should store all deleted elements for undo", function () {
      const command = new DeleteAllCommand(circuitService, circuitRenderer);
      command.execute();
      
      // Verify all elements are stored internally
      expect(command.deletedElements).to.have.length(4);
      
      const storedIds = command.deletedElements.map(del => del.element.id);
      expect(storedIds).to.include("R1");
      expect(storedIds).to.include("W1");
      expect(storedIds).to.include("C1");
      expect(storedIds).to.include("L1");
      
      // Verify deep copy worked
      const storedResistor = command.deletedElements.find(del => del.element.id === "R1");
      expect(storedResistor.element.type).to.equal("resistor");
      expect(storedResistor.element.properties.resistance).to.equal(1000);
    });

    it("should work with circuit containing only one element", function () {
      // Clear circuit and add only one element
      circuitService.getElements().forEach(element => {
        circuitService.deleteElement(element.id);
      });
      
      const singleElement = {
        id: "SINGLE",
        type: "resistor",
        nodes: [new Position(0, 0), new Position(10, 0)],
        properties: { resistance: 100 }
      };
      circuitService.addElement(singleElement);
      
      const command = new DeleteAllCommand(circuitService, circuitRenderer);
      command.execute();
      
      // Verify element was deleted
      expect(circuitService.getElements()).to.have.length(0);
      expect(command.deletedElements).to.have.length(1);
      expect(command.deletedElements[0].element.id).to.equal("SINGLE");
    });

    it("should clear selection regardless of what was selected", function () {
      // Select some elements before deleting all
      circuitRenderer.setSelectedElements([testResistor, testWire]);
      
      const command = new DeleteAllCommand(circuitService, circuitRenderer);
      command.execute();
      
      // Verify selection was cleared
      expect(circuitRenderer.getSelectedElements()).to.have.length(0);
    });
  });

  describe("undo() method", function () {
    it("should restore all deleted elements", function () {
      const command = new DeleteAllCommand(circuitService, circuitRenderer);
      command.execute();
      
      // Verify deletion
      expect(circuitService.getElements()).to.have.length(0);
      
      // Undo the deletion
      command.undo();
      
      // Verify all elements were restored
      const elementsAfterUndo = circuitService.getElements();
      expect(elementsAfterUndo).to.have.length(4);
      
      // Verify specific elements are back
      expect(elementsAfterUndo.find(el => el.id === "R1")).to.not.be.undefined;
      expect(elementsAfterUndo.find(el => el.id === "W1")).to.not.be.undefined;
      expect(elementsAfterUndo.find(el => el.id === "C1")).to.not.be.undefined;
      expect(elementsAfterUndo.find(el => el.id === "L1")).to.not.be.undefined;
    });

    it("should restore elements with original properties", function () {
      const command = new DeleteAllCommand(circuitService, circuitRenderer);
      command.execute();
      command.undo();
      
      // Verify restored elements have correct properties
      const restoredResistor = circuitService.getElements().find(el => el.id === "R1");
      expect(restoredResistor.properties.resistance).to.equal(1000);
      expect(restoredResistor.properties.orientation).to.equal(0);
      
      const restoredCapacitor = circuitService.getElements().find(el => el.id === "C1");
      expect(restoredCapacitor.properties.capacitance).to.equal(1e-12);
      expect(restoredCapacitor.properties.orientation).to.equal(90);
      
      const restoredInductor = circuitService.getElements().find(el => el.id === "L1");
      expect(restoredInductor.properties.inductance).to.equal(1e-9);
      expect(restoredInductor.properties.orientation).to.equal(180);
    });

    it("should restore elements with correct node positions", function () {
      const command = new DeleteAllCommand(circuitService, circuitRenderer);
      command.execute();
      command.undo();
      
      // Verify node positions are correct
      const restoredResistor = circuitService.getElements().find(el => el.id === "R1");
      expect(restoredResistor.nodes[0].x).to.equal(50);
      expect(restoredResistor.nodes[0].y).to.equal(50);
      expect(restoredResistor.nodes[1].x).to.equal(100);
      expect(restoredResistor.nodes[1].y).to.equal(50);
      
      const restoredWire = circuitService.getElements().find(el => el.id === "W1");
      expect(restoredWire.nodes[0].x).to.equal(200);
      expect(restoredWire.nodes[0].y).to.equal(200);
      expect(restoredWire.nodes[1].x).to.equal(240);
      expect(restoredWire.nodes[1].y).to.equal(200);
    });

    it("should handle undo with no deleted elements gracefully", function () {
      const command = new DeleteAllCommand(circuitService, circuitRenderer);
      
      // Try to undo without executing delete first
      expect(() => command.undo()).to.not.throw();
      
      // Circuit should remain unchanged
      expect(circuitService.getElements()).to.have.length(4);
    });

    it("should handle undo after no-op execute gracefully", function () {
      // Clear circuit first to make execute a no-op
      circuitService.getElements().forEach(element => {
        circuitService.deleteElement(element.id);
      });
      
      const command = new DeleteAllCommand(circuitService, circuitRenderer);
      command.execute(); // No-op
      
      // Try to undo - should not throw
      expect(() => command.undo()).to.not.throw();
      
      // Circuit should remain empty
      expect(circuitService.getElements()).to.have.length(0);
    });

    it("should handle multiple undo calls gracefully", function () {
      const command = new DeleteAllCommand(circuitService, circuitRenderer);
      command.execute();
      
      // First undo should work
      command.undo();
      expect(circuitService.getElements()).to.have.length(4);
      
      // Second undo should not cause issues
      expect(() => command.undo()).to.not.throw();
      expect(circuitService.getElements()).to.have.length(4);
    });
  });

  describe("canUndo() method", function () {
    it("should return true after successful execute", function () {
      const command = new DeleteAllCommand(circuitService, circuitRenderer);
      command.execute();
      
      expect(command.canUndo()).to.be.true;
    });

    it("should return false for new command", function () {
      const command = new DeleteAllCommand(circuitService, circuitRenderer);
      
      expect(command.canUndo()).to.be.false;
    });

    it("should return false after no-op execute", function () {
      // Clear circuit first
      circuitService.getElements().forEach(element => {
        circuitService.deleteElement(element.id);
      });
      
      const command = new DeleteAllCommand(circuitService, circuitRenderer);
      command.execute(); // No-op
      
      expect(command.canUndo()).to.be.false;
    });

    it("should return true even after undo", function () {
      const command = new DeleteAllCommand(circuitService, circuitRenderer);
      command.execute();
      command.undo();
      
      // Should still be able to "undo" (though it's effectively a no-op at this point)
      expect(command.canUndo()).to.be.true;
    });
  });

  describe("edge cases", function () {
    it("should handle circuit with complex element structures", function () {
      // Add element with complex nested properties
      const complexElement = {
        id: "COMPLEX1",
        type: "custom",
        nodes: [new Position(0, 0), new Position(10, 10)],
        properties: {
          value: 42,
          nested: {
            subProperty: "test",
            array: [1, 2, 3],
            deepNested: {
              level3: "deep"
            }
          },
          metadata: {
            created: new Date().toISOString(),
            tags: ["test", "complex"]
          }
        }
      };
      
      circuitService.addElement(complexElement);
      
      const command = new DeleteAllCommand(circuitService, circuitRenderer);
      command.execute();
      command.undo();
      
      // Verify complex element was restored correctly
      const restoredComplex = circuitService.getElements().find(el => el.id === "COMPLEX1");
      expect(restoredComplex).to.not.be.undefined;
      expect(restoredComplex.properties.nested.subProperty).to.equal("test");
      expect(restoredComplex.properties.nested.array).to.deep.equal([1, 2, 3]);
      expect(restoredComplex.properties.nested.deepNested.level3).to.equal("deep");
      expect(restoredComplex.properties.metadata.tags).to.deep.equal(["test", "complex"]);
    });

    it("should handle circuit with many elements efficiently", function () {
      // Clear existing elements and add many elements
      circuitService.getElements().forEach(element => {
        circuitService.deleteElement(element.id);
      });
      
      const manyElements = [];
      for (let i = 0; i < 100; i++) {
        const element = {
          id: `R${i}`,
          type: "resistor",
          nodes: [new Position(i * 10, 0), new Position(i * 10 + 10, 0)],
          properties: { resistance: 1000 + i }
        };
        manyElements.push(element);
        circuitService.addElement(element);
      }
      
      const command = new DeleteAllCommand(circuitService, circuitRenderer);
      
      // Measure execution time (should be reasonable)
      const startTime = Date.now();
      command.execute();
      const executeTime = Date.now() - startTime;
      
      expect(circuitService.getElements()).to.have.length(0);
      expect(command.deletedElements).to.have.length(100);
      expect(executeTime).to.be.lessThan(1000); // Should complete in under 1 second
      
      // Test undo performance
      const undoStartTime = Date.now();
      command.undo();
      const undoTime = Date.now() - undoStartTime;
      
      expect(circuitService.getElements()).to.have.length(100);
      expect(undoTime).to.be.lessThan(1000); // Should complete in under 1 second
    });

    it("should maintain element independence after deep copy", function () {
      const command = new DeleteAllCommand(circuitService, circuitRenderer);
      
      // Modify an element after command creation but before execute
      testResistor.properties.resistance = 9999;
      
      command.execute();
      
      // Stored element should have original value from when execute was called
      const storedResistor = command.deletedElements.find(del => del.element.id === "R1");
      expect(storedResistor.element.properties.resistance).to.equal(9999);
      
      command.undo();
      
      // Restored element should have the value from when execute was called
      const restoredResistor = circuitService.getElements().find(el => el.id === "R1");
      expect(restoredResistor.properties.resistance).to.equal(9999);
    });

    it("should handle null/undefined properties gracefully", function () {
      // Add element with minimal properties
      const minimalElement = {
        id: "MINIMAL",
        type: "minimal",
        nodes: [new Position(0, 0)],
        properties: null
      };
      
      circuitService.addElement(minimalElement);
      
      const command = new DeleteAllCommand(circuitService, circuitRenderer);
      
      // Should not throw with null properties
      expect(() => command.execute()).to.not.throw();
      expect(() => command.undo()).to.not.throw();
      
      // Element should be restored correctly
      const restoredMinimal = circuitService.getElements().find(el => el.id === "MINIMAL");
      expect(restoredMinimal).to.not.be.undefined;
    });
  });

  describe("integration with CircuitService", function () {
    it("should emit appropriate update events during execute", function () {
      const updates = setupUpdateListener();
      
      const command = new DeleteAllCommand(circuitService, circuitRenderer);
      command.execute();
      
      // Should have emitted updates for each deleted element
      expect(updates.length).to.equal(4);
      updates.forEach(update => {
        expect(update.type).to.equal("deleteElement");
      });
    });

    it("should emit appropriate update events during undo", function () {
      const command = new DeleteAllCommand(circuitService, circuitRenderer);
      command.execute();
      
      // Clear previous updates and listen for undo updates
      const undoUpdates = setupUpdateListener();
      command.undo();
      
      // Should have emitted updates for each restored element
      expect(undoUpdates.length).to.equal(4);
      undoUpdates.forEach(update => {
        expect(update.type).to.equal("addElement");
      });
    });
  });
});