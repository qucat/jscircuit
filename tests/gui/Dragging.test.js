import { expect } from "chai";
import { createMockCanvas } from "./canvasFixture.js";
import { Circuit } from "../../src/domain/aggregates/Circuit.js";
import { CircuitService } from "../../src/application/CircuitService.js";
import { DragElementCommand } from "../../src/gui/commands/GUIDragElementCommand.js";
import { CircuitRenderer } from "../../src/gui/renderers/CircuitRenderer.js";
import { Position } from "../../src/domain/valueObjects/Position.js";
import { rendererFactory  } from "../../src/config/settings.js";

describe("CircuitService Dragging Test", function () {
    let canvas;
    let circuitService;
    let testElement;

    beforeEach(() => {
        canvas = createMockCanvas();

        // Create a fresh CircuitService instance for each test
        const circuit = new Circuit();
        circuitService = new CircuitService(circuit);

        // Add a test element to the circuit
        testElement = {
            id: "T1",
            type: "resistor",
            nodes: [new Position(50, 50), new Position(100, 50)],
        };
        circuitService.addElement(testElement);
    });

    function setupListener(label) {
        const updates = [];
        circuitService.on("update", (event) => {
            console.log(`[${label} Update]`, event);
            updates.push(event);
        });
        return updates;
    }

    it("should update CircuitService when dragging via Renderer (Old Approach)", function () {
        const updates = setupListener("Old");
        console.log("Event Listener Setup");
        console.log(updates);

        // Simulate drag using CircuitRenderer (old approach)
        const renderer = new CircuitRenderer(canvas, circuitService, rendererFactory);
        renderer.draggedElement = testElement;
        renderer.dragElement(200, 200);
        renderer.stopDrag();

        // Verify CircuitService received update
        expect(updates.length).to.be.greaterThan(0);
        expect(updates[0].type).to.equal("moveElement");
    });

    it("should update CircuitService when dragging via Command (New Approach)", function () {
        const updates = setupListener("New");

        // Simulate drag using DragElementCommand (new approach)
        const command = new DragElementCommand(circuitService);
        command.start(50, 50);
        command.move(200, 200);
        command.stop();

        // Verify CircuitService received update
        expect(updates.length).to.be.greaterThan(0);
        expect(updates[0].type).to.equal("moveElement");
    });

    it("should produce the same updates for both approaches", function () {
        const oldUpdates = setupListener("Old");
        const newUpdates = setupListener("New");

        // Run old approach
        const renderer = new CircuitRenderer(canvas, circuitService, rendererFactory);
        renderer.draggedElement = testElement;
        renderer.dragElement(200, 200);
        renderer.stopDrag();

        // Reset CircuitService for new approach
        circuitService = new CircuitService(new Circuit());
        testElement = {
            id: "T1",
            type: "resistor",
            nodes: [new Position(50, 50), new Position(100, 50)],
        };
        circuitService.addElement(testElement);

        // Run new approach
        const command = new DragElementCommand(circuitService);
        command.start(50, 50);
        command.move(200, 200);
        command.stop();

        expect(oldUpdates).to.deep.equal(newUpdates);
    });
});
