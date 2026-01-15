import { expect } from "chai";
import sinon from "sinon";
import { Circuit } from "../../src/domain/aggregates/Circuit.js";
import { CircuitService } from "../../src/application/CircuitService.js";
import { MockElement } from "./MockElement.js"; // Mock element class
import { Position } from "../../src/domain/valueObjects/Position.js";
import { ElementRegistry } from "../../src/config/registry.js"; // Import elementFactory

describe("CircuitService Tests", () => {
    let circuit;
    let circuitService;
    let emitSpy;

    beforeEach(() => {
        circuit = new Circuit();
        circuitService = new CircuitService(circuit, ElementRegistry); // ✅ Pass elementFactory
        emitSpy = sinon.spy(circuitService, "emit"); // Spy on event emission
    });

    afterEach(() => {
        sinon.restore(); // Clean up spies
    });

    describe("addElement", () => {
        it("should add an element to the circuit and emit an event", () => {
            const element = new MockElement("E1", [
                new Position(10, 20),
                new Position(30, 40),
            ]);

            circuitService.addElement(element);

            expect(circuit.elements).to.include(element);

            // ✅ Check if event was emitted
            expect(emitSpy.calledWith("update", { type: "addElement", element })).to.be.true;
            
            // Remove element from circuit
            circuit.elements = [];
        });

        it("should process a commandExecuted event for addElement", () => {
        
            // Simulating raw position data (as sent by events)
            const nodes = [
                { x: 50, y: 60 },
                { x: 70, y: 80 }
            ];
        
            circuitService.emit("commandExecuted", {
                type: "addElement",
                elementType: "MockElement",
                nodes: nodes // ✅ Ensure correct property is passed
            });
        
            expect(emitSpy.calledWithMatch("update", { type: "addElement" })).to.be.true;
        });        
    });

    describe("deleteElement", () => {
        it("should delete an element and emit an event", () => {
            const element = new MockElement("E2", [
                new Position(10, 20),
                new Position(30, 40),
            ]);

            circuitService.addElement(element);
            circuitService.deleteElement("E2");

            expect(circuit.elements).to.not.include(element);
            expect(emitSpy.calledWith("update", { type: "deleteElement", elementId: "E2" })).to.be.true;
        });

        it("should handle deletion of a non-existent element gracefully", () => {
            circuitService.deleteElement("NonExistentID");

            // Action: Try deleting something that doesn't exist
            expect(() => circuitService.deleteElement("NonExistentID")).to.not.throw();

            // Assert: No update event should be emitted
            expect(emitSpy.called).to.be.false;
        });
    });

    describe("connectElements", () => {
        it("should connect two elements and emit an event", () => {
            const element1 = new MockElement("E4", [
                new Position(10, 20),
                new Position(30, 40),
            ]);

            const element2 = new MockElement("E5", [
                new Position(10, 20),
                new Position(50, 60),
            ]);

            circuitService.addElement(element1);
            circuitService.addElement(element2);
            circuitService.connectElements(element1, element2);

            expect(emitSpy.calledWith("update", { type: "connectElements", elements: [element1, element2] })).to.be.true;
        });

        it("should throw an error if a node is already fully connected", () => {
            const element1 = new MockElement("E6", [
                new Position(10, 20),
                new Position(30, 40),
            ]);

            const element2 = new MockElement("E7", [
                new Position(10, 20),
                new Position(50, 60),
            ]);

            const element3 = new MockElement("E8", [
                new Position(10, 20),
                new Position(70, 80),
            ]);

            circuitService.addElement(element1);
            circuitService.addElement(element2);
            circuitService.connectElements(element1, element2);

            expect(() => circuitService.connectElements(element1, element3)).to.throw(
                "Node at position (10, 20) is already connected and cannot accept additional connections."
            );
        });
    });

    describe("findConnections", () => {
        it("should return all elements connected to a given element", () => {
            const element1 = new MockElement("E9", [
                new Position(10, 20),
                new Position(30, 40),
            ]);

            const element2 = new MockElement("E10", [
                new Position(10, 20),
                new Position(50, 60),
            ]);

            const element3 = new MockElement("E11", [
                new Position(30, 40),
                new Position(70, 80),
            ]);

            circuitService.addElement(element1);
            circuitService.addElement(element2);
            circuitService.addElement(element3);

            circuitService.connectElements(element1, element2);
            circuitService.connectElements(element1, element3);

            const connections = circuitService.findConnections(element1);

            expect(connections).to.include(element2);
            expect(connections).to.include(element3);
        });

        it("should return an empty array for an element with no connections", () => {
            const element = new MockElement("E12", [
                new Position(10, 20),
                new Position(30, 40),
            ]);

            circuitService.addElement(element);
            const connections = circuitService.findConnections(element);

            expect(connections).to.be.an("array").that.is.empty;
        });
    });
});
