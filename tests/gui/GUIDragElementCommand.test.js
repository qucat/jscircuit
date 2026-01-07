import { expect } from "chai";
import { createMockCanvas } from "./canvasFixture.js";
import { Circuit } from "../../src/domain/aggregates/Circuit.js";
import { CircuitService } from "../../src/application/CircuitService.js";
import { DragElementCommand } from "../../src/gui/commands/GUIDragElementCommand.js";
import { CircuitRenderer } from "../../src/gui/renderers/CircuitRenderer.js";
import { Position } from "../../src/domain/valueObjects/Position.js";
import { rendererFactory } from "../../src/config/registry.js"
import { WireSplitService } from "../../src/application/WireSplitService.js";
import { ElementRegistry } from "../../src/domain/factories/ElementRegistry.js";


describe("CircuitService Dragging Tests", function () {
  let canvas;
  let circuitService;
  let wireSplitService;
  let testResistor;
  let testWire;

  beforeEach(() => {
    // Mock canvas setup (if your environment relies on it)
    canvas = createMockCanvas();

    // Fresh circuit + service each test
    const circuit = new Circuit();
    circuitService = new CircuitService(circuit);
    wireSplitService = new WireSplitService(circuitService, ElementRegistry);


    // A two-node resistor (does not allow node-level dragging)
    testResistor = {
      id: "R1",
      type: "resistor",
      nodes: [new Position(50, 50), new Position(100, 50)],
    };
    circuitService.addElement(testResistor);

    // A two-node wire (allows node-level dragging, orthogonal)
    testWire = {
      id: "W_test",
      type: "wire",
      nodes: [new Position(200, 200), new Position(240, 200)], // horizontal
    };
    circuitService.addElement(testWire);
  });

  function setupListener(label) {
    const updates = [];
    circuitService.on("update", (event) => {
      updates.push(event);
    });
    return updates;
  }

  it("should update CircuitService when dragging entire resistor shape", function () {
    const updates = setupListener("ResistorDrag");
    const command = new DragElementCommand(circuitService, wireSplitService);

    // Click exactly on the resistor node (50,50), but because it's a resistor,
    // we expect an entire-shape drag, not node-level
    command.start(50, 50);
    command.move(80, 70);
    command.stop();

    expect(updates.length).to.be.greaterThan(0);
    expect(updates[0].type).to.equal("dragElement");

    // The resistor should have moved as a whole. Original nodes: (50,50) & (100,50).
    // Movement from (50,50)->(80,70) => dx=30, dy=20
    expect(testResistor.nodes[0].x).to.equal(80);
    expect(testResistor.nodes[0].y).to.equal(70);
    expect(testResistor.nodes[1].x).to.equal(130);
    expect(testResistor.nodes[1].y).to.equal(70);
  });

  it("keeps Y locked on a horizontal wire when user drags mostly vertically", function () {
    /*
       ─── Initial set-up ──────────────────────────────────────────
       Horizontal wire:  (200,200) ─── (240,200)
       We’ll click the left node (200,200) and then try to
       drag it straight DOWN by 40 px (to y = 240).
       Expected:   X may move only if we move sideways,
                   Y must remain 200 because the wire is horizontal.
    */
    const wire = {
      id: "W2",
      type: "wire",
      nodes: [new Position(200, 200), new Position(240, 200)],
    };
    circuitService.addElement(wire);
  
    const updates = [];
    circuitService.on("update", e => updates.push(e));
  
    const cmd = new DragElementCommand(circuitService, wireSplitService);
  
    // ── 1. mousedown exactly on the first node
    cmd.start(200, 200);
    expect(cmd.draggingNodeIndex).to.equal(0, "single-node drag started");
  
    // ── 2. mousemove straight down (no horizontal delta)
    cmd.move(200, 240);          // user tries to pull node to (200,240)
    cmd.stop();
  
    // ── 3. we DID get an update
    expect(updates).to.have.length.above(0);
    expect(updates[0].type).to.equal("dragElement");
  
    // ── 4. axis-lock check: Y stayed 200, X unchanged
    expect(wire.nodes[0].x).to.equal(200); // X unchanged (no sideways drag)
    expect(wire.nodes[0].y).to.equal(200); // Y locked — did NOT become 240
  
    // ── 5. the other wire node never moved
    expect(wire.nodes[1].x).to.equal(240);
    expect(wire.nodes[1].y).to.equal(200);
  });
  

  it("should allow wire node-level dragging and lock axis vertically if the wire is more vertical", function () {
    // Let's tweak the wire to be more vertical than horizontal:
    testWire.nodes = [new Position(300, 300), new Position(300, 340)]; // vertical wire

    const updates = setupListener("WireDragVertical");
    const command = new DragElementCommand(circuitService, wireSplitService);

    // Mousedown on first node (300,300)
    command.start(300, 300);

    // Try to drag it horizontally to (330,300),
    // but since the wire is vertical, x stays at 300, y can still be 300
    command.move(330, 300);
    command.stop();

    // Confirm an update
    expect(updates.length).to.be.greaterThan(0);
    expect(updates[0].type).to.equal("dragElement");

    // We locked vertical => the user tried to move x+30, but we keep x=300
    expect(testWire.nodes[0].x).to.equal(300);
    expect(testWire.nodes[0].y).to.equal(300);
  });

  it("should drag the entire wire if not clicking near a node (line body)", function () {
    const updates = setupListener("EntireWireDrag");
    const command = new DragElementCommand(circuitService, wireSplitService);

    // Our test wire is from (200,200)->(240,200). 
    // Click somewhere in the middle, say (220,200), not near a node
    command.start(220, 200);
    expect(command.draggingNodeIndex).to.be.null;

    // Move the entire shape from (220,200)->(230,210)
    command.move(230, 210);
    command.stop();

    expect(updates.length).to.be.greaterThan(0);
    expect(updates[0].type).to.equal("dragElement");

    // The first node was (200,200). Movement is +10x, +10y
    expect(testWire.nodes[0].x).to.equal(210);
    expect(testWire.nodes[0].y).to.equal(210);

    // The second node was (240,200). Movement is +10x, +10y => (250,210)
    expect(testWire.nodes[1].x).to.equal(250);
    expect(testWire.nodes[1].y).to.equal(210);
  });

  it("should still update circuitService for normal shape drag (resistor) in the new approach", function () {
    // This is basically the test you had originally, showing normal shape drag
    const updates = setupListener("New");
    const command = new DragElementCommand(circuitService, wireSplitService);

    // Simulate dragging the resistor from (50,50)->(200,200)
    command.start(50, 50);
    command.move(200, 200);
    command.stop();

    expect(updates.length).to.be.greaterThan(0);
    expect(updates[0].type).to.equal("dragElement");
    // Confirm new position of resistor’s first node
    // (50,50) => (200,200) => dx=150, dy=150
    expect(testResistor.nodes[0].x).to.equal(200);
    expect(testResistor.nodes[0].y).to.equal(200);
  });

  it("should delete the original wire when it is split by trySplitAtNode", function () {
    const splitPoint = new Position(220, 200);

    // Remove the conflicting wire added in beforeEach (optional)
    const existingWire = circuitService.getElements().find(e => e.id === "W");
    if (existingWire) {
      circuitService.deleteElement(existingWire.id);
    }

    // Add a wire that will be split — no manual ID
    const wire = {
      type: "wire",
      nodes: [new Position(180, 200), new Position(260, 200)],
    };
    circuitService.addElement(wire);

    // Trigger the split
    const didSplit = wireSplitService.trySplitAtNode(splitPoint);
    expect(didSplit).to.equal(true);

    const allWires = circuitService.getElements().filter(e => e.type === "wire");

    // Ensure two new wires contain the split point
    const wiresWithSplit = allWires.filter(w =>
      w.nodes.some(n => n.x === splitPoint.x && n.y === splitPoint.y)
    );

    expect(wiresWithSplit.length).to.equal(2);
  });

  it("should split a dragged wire when its body touches a node", function () {
    // Setup:
    const splitPoint = new Position(220, 200);
    const anchorWire = {
      id: "W_anchor",
      type: "wire",
      nodes: [new Position(180, 200), new Position(260, 200)],
    };

    circuitService.addElement(anchorWire);

    const draggedWire = {
      id: "W_drag",
      type: "wire",
      nodes: [new Position(100, 100), new Position(120, 100)],
    };

    circuitService.addElement(draggedWire);

    const command = new DragElementCommand(circuitService, wireSplitService);

    // Simulate dragging the wire body so it touches splitPoint
    command.start(110, 100);  // somewhere on wire
    command.move(220, 200);   // move the body onto the node
    command.stop();

    const updatedElements = circuitService.getElements().filter(e => e.type === "wire");

    // Expect that the anchor wire was split into two
    expect(updatedElements.length).to.be.greaterThan(2);
    const ids = updatedElements.map(w => w.id);
    expect(ids.includes("W_anchor")).to.be.false; // original should be deleted
  });

  it("should split a wire when a dragged node touches another wire’s body", function () {
    // The stationary wire to be split — horizontal wire at y = 200
    const stationaryWire = {
      id: "W_stationary",
      type: "wire",
      nodes: [new Position(180, 200), new Position(260, 200)],
    };

    // The wire we’ll drag — vertical wire at x = 220
    const movingWire = {
      id: "W_moving",
      type: "wire",
      nodes: [new Position(220, 180), new Position(220, 160)], // vertical
    };
    circuitService.addElement(movingWire);

    const command = new DragElementCommand(circuitService, wireSplitService);

    // Simulate node drag: select top node (220,180) and drag it to (220,200)
    command.start(220, 180);
    command.move(220, 200);
    command.stop();

    // Check wire count and deletion
    const allWires = circuitService.getElements().filter(e => e.type === "wire");
    const wireIds = allWires.map(w => w.id);

    // The original wire should be gone
    expect(wireIds.includes("W_stationary")).to.be.false;

    // There should be more than two wires (original plus 1 dragged = 2; +2 new = 4)
    expect(allWires.length).to.be.greaterThan(2);
  });

  it("should split a wire when a dragged wire's node touches a node from another wire", function () {
    // Stationary wire that we'll touch with another wire's node
    const anchorWire = {
      id: "W_anchor",
      type: "wire",
      nodes: [new Position(180, 200), new Position(260, 200)], // wider segment
    };

    circuitService.addElement(anchorWire);

    // Wire we will drag — horizontally aligned, node will land on (220,200)
    const draggedWire = {
      id: "W_dragged",
      type: "wire",
      nodes: [new Position(100, 100), new Position(140, 100)],
    };
    circuitService.addElement(draggedWire);

    const command = new DragElementCommand(circuitService, wireSplitService);

    const originalWires = circuitService.getElements().filter(e => e.type === "wire");
    let wireIds = originalWires.map(w => w.id);

    expect(wireIds.includes("W_test")).to.be.true;

    // Click body (not node)
    command.start(120, 100);     // click midpoint
    command.move(200, 200);      // drag body so one node lands at (220, 200)
    command.stop();

    const updatedWires = circuitService.getElements().filter(e => e.type === "wire");
    wireIds = updatedWires.map(w => w.id);

    // const updatedWires = circuitService.getElements().filter(e => e.type === "wire");
    const newWireIds = updatedWires.map(w => w.id);

    //  Assert that wires were added, and none of them reused the old anchor wire ID
    const wiresFromSplit = newWireIds.filter(id => id !== "W_anchor");
    expect(wiresFromSplit.length).to.be.greaterThan(2); // e.g. original + 2 splits

    // The original anchor wire should be gone (it was split)
    expect(wireIds.includes("W_test")).to.be.false;

    // There should be more than 2 wires (1 dragged, 2 split segments)
    expect(updatedWires.length).to.be.greaterThan(2);
  });

  it("should drag multiple selected elements maintaining relative positions", function () {
    // Create a mock circuit renderer that has multiple elements selected
    const circuitRenderer = new CircuitRenderer(
      canvas, 
      circuitService, 
      rendererFactory, 
      () => false // isCommandActive function
    );
    
    // Add another resistor to have multiple elements
    const testResistor2 = {
      id: "R2",
      type: "resistor",
      nodes: [new Position(150, 100), new Position(200, 100)],
    };
    circuitService.addElement(testResistor2);

    // Mock the selected elements
    circuitRenderer.setSelectedElements([testResistor, testResistor2]);

    const updates = setupListener("MultipleDrag");
    const command = new DragElementCommand(circuitService, circuitRenderer, wireSplitService);

    // Store original positions
    const origR1Node0 = { x: testResistor.nodes[0].x, y: testResistor.nodes[0].y };
    const origR1Node1 = { x: testResistor.nodes[1].x, y: testResistor.nodes[1].y };
    const origR2Node0 = { x: testResistor2.nodes[0].x, y: testResistor2.nodes[0].y };
    const origR2Node1 = { x: testResistor2.nodes[1].x, y: testResistor2.nodes[1].y };

    // Calculate original relative distance between the two resistors
    const origRelativeX = origR2Node0.x - origR1Node0.x; // 150 - 50 = 100
    const origRelativeY = origR2Node0.y - origR1Node0.y; // 100 - 50 = 50

    // Click on first resistor to start multi-element drag
    command.start(50, 50);
    
    // Move by (30, 20)
    command.move(80, 70);
    command.stop();

    expect(updates.length).to.be.greaterThan(0);
    expect(updates[0].type).to.equal("dragElement");

    // Both resistors should have moved by the same amount
    const expectedDeltaX = 30; // 80 - 50
    const expectedDeltaY = 20; // 70 - 50

    // Check first resistor moved correctly
    expect(testResistor.nodes[0].x).to.equal(origR1Node0.x + expectedDeltaX);
    expect(testResistor.nodes[0].y).to.equal(origR1Node0.y + expectedDeltaY);
    expect(testResistor.nodes[1].x).to.equal(origR1Node1.x + expectedDeltaX);
    expect(testResistor.nodes[1].y).to.equal(origR1Node1.y + expectedDeltaY);

    // Check second resistor moved correctly
    expect(testResistor2.nodes[0].x).to.equal(origR2Node0.x + expectedDeltaX);
    expect(testResistor2.nodes[0].y).to.equal(origR2Node0.y + expectedDeltaY);
    expect(testResistor2.nodes[1].x).to.equal(origR2Node1.x + expectedDeltaX);
    expect(testResistor2.nodes[1].y).to.equal(origR2Node1.y + expectedDeltaY);

    // Check that relative positions are maintained
    const newRelativeX = testResistor2.nodes[0].x - testResistor.nodes[0].x;
    const newRelativeY = testResistor2.nodes[0].y - testResistor.nodes[0].y;
    
    expect(newRelativeX).to.equal(origRelativeX);
    expect(newRelativeY).to.equal(origRelativeY);
  });

  it("should handle single element drag when only one element is selected", function () {
    // Create a mock circuit renderer with single element selected
    const circuitRenderer = new CircuitRenderer(
      canvas, 
      circuitService, 
      rendererFactory, 
      () => false // isCommandActive function
    );
    circuitRenderer.setSelectedElements([testResistor]);

    const updates = setupListener("SingleDragFromSelection");
    const command = new DragElementCommand(circuitService, circuitRenderer, wireSplitService);

    // Store original positions
    const origNode0 = { x: testResistor.nodes[0].x, y: testResistor.nodes[0].y };
    const origNode1 = { x: testResistor.nodes[1].x, y: testResistor.nodes[1].y };

    // Click on resistor to start drag
    command.start(50, 50);
    command.move(80, 70);
    command.stop();

    expect(updates.length).to.be.greaterThan(0);

    // Should behave exactly like normal single element drag
    const expectedDeltaX = 30;
    const expectedDeltaY = 20;

    expect(testResistor.nodes[0].x).to.equal(origNode0.x + expectedDeltaX);
    expect(testResistor.nodes[0].y).to.equal(origNode0.y + expectedDeltaY);
    expect(testResistor.nodes[1].x).to.equal(origNode1.x + expectedDeltaX);
    expect(testResistor.nodes[1].y).to.equal(origNode1.y + expectedDeltaY);
  });

});
