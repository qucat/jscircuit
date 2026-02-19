import { expect } from "chai";
import { createMockCanvas } from "./canvasFixture.js";
import { Circuit } from "../../src/domain/aggregates/Circuit.js";
import { CircuitService } from "../../src/application/CircuitService.js";
import { CircuitRenderer } from "../../src/gui/renderers/CircuitRenderer.js";
import { PasteNetlistFromClipboardCommand } from "../../src/gui/commands/PasteNetlistFromClipboardCommand.js";
import { Position } from "../../src/domain/valueObjects/Position.js";
import { Properties } from "../../src/domain/valueObjects/Properties.js";
import { Resistor } from "../../src/domain/entities/Resistor.js";
import { QucatNetlistAdapter } from "../../src/infrastructure/adapters/QucatNetlistAdapter.js";
import { ElementRegistry, rendererFactory } from "../../src/config/registry.js";

describe("PasteNetlistFromClipboardCommand Tests", function () {
    let canvas;
    let circuitService;
    let circuitRenderer;

    beforeEach(() => {
        canvas = createMockCanvas();
        const circuit = new Circuit();
        circuitService = new CircuitService(circuit, ElementRegistry);
        circuitRenderer = new CircuitRenderer(
            canvas,
            circuitService,
            rendererFactory,
            () => false
        );

        // Mock global alert if not available (Node.js environment)
        if (typeof global.alert === "undefined") {
            global.alert = () => {};
        }
    });

    it("should create command without error", function () {
        const command = new PasteNetlistFromClipboardCommand(
            circuitService,
            circuitRenderer
        );

        expect(command).to.be.an("object");
        expect(command.execute).to.be.a("function");
        expect(command.undo).to.be.a("function");
    });

    it("should parse a valid netlist string and load elements", function () {
        // Simulate what the command does internally — parse + load
        const resistor = new Resistor(
            "R1",
            [new Position(50, 50), new Position(100, 50)],
            null,
            new Properties({ resistance: 1000 })
        );
        circuitService.addElement(resistor);

        // Export to netlist string (this is what a user would copy from Jupyter)
        const netlistContent = QucatNetlistAdapter.exportToString(
            circuitService.circuit
        );

        expect(netlistContent).to.be.a("string");
        expect(netlistContent.length).to.be.greaterThan(0);

        // Parse the netlist back (this is what the command does)
        const parsed = QucatNetlistAdapter.importFromString(netlistContent);
        expect(parsed).to.be.an("array");
        expect(parsed.length).to.equal(1);
        expect(parsed[0].type).to.equal("resistor");
    });

    it("should round-trip a circuit through export → import", function () {
        // Build a small circuit
        const r1 = new Resistor(
            "R1",
            [new Position(50, 50), new Position(100, 50)],
            null,
            new Properties({ resistance: 500 })
        );
        const r2 = new Resistor(
            "R2",
            [new Position(100, 50), new Position(150, 50)],
            null,
            new Properties({ resistance: 1000 })
        );
        circuitService.addElement(r1);
        circuitService.addElement(r2);
        expect(circuitService.circuit.elements.length).to.equal(2);

        // Export
        const netlist = QucatNetlistAdapter.exportToString(circuitService.circuit);

        // Clear
        for (const el of [...circuitService.circuit.elements]) {
            circuitService.deleteElement(el.id);
        }
        expect(circuitService.circuit.elements.length).to.equal(0);

        // Import
        const elements = QucatNetlistAdapter.importFromString(netlist);
        for (const el of elements) {
            circuitService.addElement(el);
        }
        expect(circuitService.circuit.elements.length).to.equal(2);
    });

    it("should throw on invalid netlist content", function () {
        expect(() =>
            QucatNetlistAdapter.importFromString("INVALID;netlist;data")
        ).to.throw();
    });

    it("should support undo by restoring previous state", function () {
        // Pre-populate circuit with one element
        const r1 = new Resistor(
            "R1",
            [new Position(50, 50), new Position(100, 50)],
            null,
            new Properties({ resistance: 1000 })
        );
        circuitService.addElement(r1);
        expect(circuitService.circuit.elements.length).to.equal(1);

        // Save state (what the command does before mutating)
        const previousState = circuitService.exportState();

        // Simulate what the command does: clear + load new elements
        for (const el of [...circuitService.circuit.elements]) {
            circuitService.deleteElement(el.id);
        }
        const r2 = new Resistor(
            "R2",
            [new Position(200, 200), new Position(250, 200)],
            null,
            new Properties({ resistance: 2000 })
        );
        circuitService.addElement(r2);
        expect(circuitService.circuit.elements.length).to.equal(1);
        expect(circuitService.circuit.elements[0].id).to.equal("R2");

        // Undo: restore previous state
        circuitService.importState(previousState);
        expect(circuitService.circuit.elements.length).to.equal(1);
        expect(circuitService.circuit.elements[0].id).to.equal("R1");
    });

    it("should cancel gracefully in non-browser environment", async function () {
        // Temporarily remove document.body to simulate non-browser
        const originalBody = document.body;
        Object.defineProperty(document, 'body', { value: null, configurable: true });

        const command = new PasteNetlistFromClipboardCommand(
            circuitService,
            circuitRenderer
        );

        const result = await command.execute();

        expect(result).to.be.an("object");
        expect(result.undo).to.be.a("function");
        // Circuit should be unchanged (cancel = no-op)
        expect(circuitService.circuit.elements.length).to.equal(0);

        // Restore
        Object.defineProperty(document, 'body', { value: originalBody, configurable: true });
    });
});
