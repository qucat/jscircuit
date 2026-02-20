import { expect } from "chai";
import { Circuit } from "../../src/domain/aggregates/Circuit.js";
import { CircuitService } from "../../src/application/CircuitService.js";
import { Position } from "../../src/domain/valueObjects/Position.js";
import { Properties } from "../../src/domain/valueObjects/Properties.js";
import { ElementRegistry } from "../../src/config/registry.js";
import { GRID_SPACING } from "../../src/config/gridConfig.js";

describe("Nudge Elements (Arrow Key Movement)", function () {
  let circuitService;
  let resistor;
  let capacitor;

  beforeEach(() => {
    const circuit = new Circuit();
    circuitService = new CircuitService(circuit, ElementRegistry);

    resistor = {
      id: "R1",
      type: "resistor",
      nodes: [new Position(50, 50), new Position(100, 50)],
      properties: new Properties({ orientation: 0 }),
    };
    capacitor = {
      id: "C1",
      type: "capacitor",
      nodes: [new Position(80, 80), new Position(130, 80)],
      properties: new Properties({ orientation: 0 }),
    };
    circuitService.addElement(resistor);
    circuitService.addElement(capacitor);
  });

  it("should nudge a single element right by one grid unit", function () {
    circuitService.nudgeElements(["R1"], GRID_SPACING, 0);

    expect(resistor.nodes[0].x).to.equal(50 + GRID_SPACING);
    expect(resistor.nodes[0].y).to.equal(50);
    expect(resistor.nodes[1].x).to.equal(100 + GRID_SPACING);
    expect(resistor.nodes[1].y).to.equal(50);
  });

  it("should nudge a single element left by one grid unit", function () {
    circuitService.nudgeElements(["R1"], -GRID_SPACING, 0);

    expect(resistor.nodes[0].x).to.equal(50 - GRID_SPACING);
    expect(resistor.nodes[1].x).to.equal(100 - GRID_SPACING);
  });

  it("should nudge a single element up by one grid unit", function () {
    circuitService.nudgeElements(["R1"], 0, -GRID_SPACING);

    expect(resistor.nodes[0].y).to.equal(50 - GRID_SPACING);
    expect(resistor.nodes[1].y).to.equal(50 - GRID_SPACING);
    // X should be unchanged
    expect(resistor.nodes[0].x).to.equal(50);
    expect(resistor.nodes[1].x).to.equal(100);
  });

  it("should nudge a single element down by one grid unit", function () {
    circuitService.nudgeElements(["R1"], 0, GRID_SPACING);

    expect(resistor.nodes[0].y).to.equal(50 + GRID_SPACING);
    expect(resistor.nodes[1].y).to.equal(50 + GRID_SPACING);
  });

  it("should nudge multiple elements together", function () {
    circuitService.nudgeElements(["R1", "C1"], GRID_SPACING, 0);

    expect(resistor.nodes[0].x).to.equal(50 + GRID_SPACING);
    expect(resistor.nodes[1].x).to.equal(100 + GRID_SPACING);
    expect(capacitor.nodes[0].x).to.equal(80 + GRID_SPACING);
    expect(capacitor.nodes[1].x).to.equal(130 + GRID_SPACING);
  });

  it("should preserve relative positions when nudging multiple elements", function () {
    const relativeX = capacitor.nodes[0].x - resistor.nodes[0].x; // 30
    const relativeY = capacitor.nodes[0].y - resistor.nodes[0].y; // 30

    circuitService.nudgeElements(["R1", "C1"], GRID_SPACING, -GRID_SPACING);

    const newRelativeX = capacitor.nodes[0].x - resistor.nodes[0].x;
    const newRelativeY = capacitor.nodes[0].y - resistor.nodes[0].y;

    expect(newRelativeX).to.equal(relativeX);
    expect(newRelativeY).to.equal(relativeY);
  });

  it("should skip non-existent element IDs without error", function () {
    circuitService.nudgeElements(["NONEXISTENT", "R1"], GRID_SPACING, 0);

    // R1 should still be nudged
    expect(resistor.nodes[0].x).to.equal(50 + GRID_SPACING);
    // C1 should be untouched
    expect(capacitor.nodes[0].x).to.equal(80);
  });

  it("should no-op with empty element list", function () {
    circuitService.nudgeElements([], GRID_SPACING, 0);

    expect(resistor.nodes[0].x).to.equal(50);
    expect(capacitor.nodes[0].x).to.equal(80);
  });

  it("should emit an update event on nudge", function () {
    let emitted = false;
    circuitService.on("update", (data) => {
      emitted = true;
      expect(data.type).to.equal("nudgeElements");
      expect(data.dx).to.equal(GRID_SPACING);
      expect(data.dy).to.equal(0);
    });

    circuitService.nudgeElements(["R1"], GRID_SPACING, 0);
    expect(emitted).to.be.true;
  });

  it("should support undo via exportState/importState", function () {
    const before = circuitService.exportState();

    circuitService.nudgeElements(["R1"], GRID_SPACING, GRID_SPACING);

    // Verify it moved
    expect(resistor.nodes[0].x).to.equal(50 + GRID_SPACING);
    expect(resistor.nodes[0].y).to.equal(50 + GRID_SPACING);

    // Undo
    circuitService.importState(before);
    const restored = circuitService.getElements().find(el => el.id === "R1");

    expect(restored.nodes[0].x).to.equal(50);
    expect(restored.nodes[0].y).to.equal(50);
  });
});
