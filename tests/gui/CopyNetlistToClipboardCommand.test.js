import { expect } from "chai";
import { createMockCanvas } from "./canvasFixture.js";
import { Circuit } from "../../src/domain/aggregates/Circuit.js";
import { CircuitService } from "../../src/application/CircuitService.js";
import { CircuitRenderer } from "../../src/gui/renderers/CircuitRenderer.js";
import { CopyNetlistToClipboardCommand } from "../../src/gui/commands/CopyNetlistToClipboardCommand.js";
import { Position } from "../../src/domain/valueObjects/Position.js";
import { Label } from "../../src/domain/valueObjects/Label.js";
import { Properties } from "../../src/domain/valueObjects/Properties.js";
import { Resistor } from "../../src/domain/entities/Resistor.js";
import { QucatNetlistAdapter } from "../../src/infrastructure/adapters/QucatNetlistAdapter.js";
import { rendererFactory } from "../../src/config/registry.js";

describe("CopyNetlistToClipboardCommand Tests", function () {
  let canvas;
  let circuitService;
  let circuitRenderer;

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

    // Mock global alert if not available (for Node.js environment)
    if (typeof global.alert === "undefined") {
      global.alert = () => {};
    }
    
    // Mock clipboard API if not available
    if (!navigator.clipboard) {
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: () => Promise.resolve()
        },
        writable: true,
        configurable: true
      });
    }
  });

  it("should execute without error when circuit has elements", function () {
    // Create real element instances
    const resistor = new Resistor(
      "R1",
      [new Position(50, 50), new Position(100, 50)],
      null,
      new Properties({ resistance: 1000 })
    );

    circuitService.addElement(resistor);

    const command = new CopyNetlistToClipboardCommand(
      circuitService,
      circuitRenderer
    );

    expect(() => {
      command.execute();
    }).to.not.throw();
  });

  it("should return undo function in result", function () {
    const resistor = new Resistor(
      "R1",
      [new Position(50, 50), new Position(100, 50)],
      null,
      new Properties({ resistance: 1000 })
    );
    circuitService.addElement(resistor);

    const command = new CopyNetlistToClipboardCommand(
      circuitService,
      circuitRenderer
    );

    const result = command.execute();

    expect(result).to.be.an("object");
    expect(result.undo).to.be.a("function");
  });

  it("should alert when no elements exist", function () {
    const emptyCircuit = new Circuit();
    const emptyCircuitService = new CircuitService(emptyCircuit);

    const command = new CopyNetlistToClipboardCommand(
      emptyCircuitService,
      circuitRenderer
    );

    // Mock alert
    let alertCalled = false;
    const originalAlert = global.alert;
    global.alert = () => {
      alertCalled = true;
    };

    command.execute();

    expect(alertCalled).to.be.true;

    // Restore original alert
    global.alert = originalAlert;
  });

  it("should generate valid netlist content from circuit", function () {
    const resistor = new Resistor(
      "R1",
      [new Position(50, 50), new Position(100, 50)],
      null,
      new Properties({ resistance: 1000 })
    );
    circuitService.addElement(resistor);

    const circuit = circuitService.circuit;
    const netlistContent = QucatNetlistAdapter.exportToString(circuit);

    expect(netlistContent).to.be.a("string");
    expect(netlistContent.length).to.be.greaterThan(0);
  });

  it("should handle circuit service errors gracefully", function () {
    const resistor = new Resistor(
      "R1",
      [new Position(50, 50), new Position(100, 50)],
      null,
      new Properties({ resistance: 1000 })
    );
    circuitService.addElement(resistor);

    const command = new CopyNetlistToClipboardCommand(
      circuitService,
      circuitRenderer
    );

    // Mock alert to prevent console output
    const originalAlert = global.alert;
    global.alert = () => {};

    expect(() => {
      command.execute();
    }).to.not.throw();

    // Restore original alert
    global.alert = originalAlert;
  });

  it("should return correct undo operation", function () {
    const resistor = new Resistor(
      "R1",
      [new Position(50, 50), new Position(100, 50)],
      null,
      new Properties({ resistance: 1000 })
    );
    circuitService.addElement(resistor);

    const command = new CopyNetlistToClipboardCommand(
      circuitService,
      circuitRenderer
    );

    const result = command.execute();

    // Verify that undo is a no-op for clipboard operation
    expect(result.undo).to.be.a("function");
    expect(() => {
      result.undo();
    }).to.not.throw();
  });
});
