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
            updates.push(event);
        });
        return updates;
    }


    it("should update CircuitService when dragging via Command (New Approach)", function () {
        const updates = setupListener("New");

        // Simulate drag using DragElementCommand (new approach)
        const command = new DragElementCommand(circuitService);
        command.start(50, 50);
        command.move(200, 200);
        command.stop();

        // Verify CircuitService received update
        expect(updates.length).to.be.greaterThan(0);
        expect(updates[0].type).to.equal("dragElement");
    });
});
