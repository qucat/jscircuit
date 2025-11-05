import { GUICommand } from "./GUICommand.js";
import { Position } from "../../domain/valueObjects/Position.js";
import { GRID_CONFIG } from "../../config/gridConfig.js";

/**
 * DrawWireCommand:
 * - On first click, we place a start node for the wire.
 * - As the user drags, we compute how far they've moved in x vs. y from that start node.
 * - If the difference between |dx| and |dy| exceeds a threshold, we lock to horizontal or vertical.
 * - If it's never exceeded, the wire remains “unlocked” and can track the mouse freely.
 * - On mouseup, we finalize; or if there's a "cancel()" call (no real movement), remove it.
 */
export class DrawWireCommand extends GUICommand {
  constructor(circuitService, elementRegistry, wireSplitService) {
    super();
    this.circuitService = circuitService;
    this.elementRegistry = elementRegistry;
    this.wireSplitService = wireSplitService;

    // The wire we’re drawing
    this.wireElement = null;
    this.drawing = false;

    // We'll lock to "horizontal", "vertical", or stay null if not locked yet
    this.direction = null;

    // If the user never moves, we can remove the ephemeral wire in a cancel() method
    this.enableSnapping = true;

    // If you want to wait for a bigger movement before locking, set this higher
    this.THRESHOLD = 2;
  }

  /**
   * Called on mousedown when user first clicks an empty area.
   * We'll place both wire nodes at the same position initially.
   */
  start(mouseX, mouseY) {
    // 1) Snap or not, as desired
    let snappedX = mouseX;
    let snappedY = mouseY;
    if (this.enableSnapping) {
      snappedX = GRID_CONFIG.snapToGrid(mouseX);
      snappedY = GRID_CONFIG.snapToGrid(mouseY);
    }

    // 2) Create a new wire with both nodes at the same place
    const wireFactory = this.elementRegistry.get("Wire");
    if (!wireFactory) {
      console.error("No wire factory registered.");
      return;
    }
    this.wireElement = wireFactory(
      undefined,
      [new Position(snappedX, snappedY), new Position(snappedX, snappedY)],
      null,
      {},
    );

    // 3) Add to circuit so it's visible
    this.circuitService.addElement(this.wireElement);

    // 4) Mark that we’re currently drawing
    this.drawing = true;
    this.direction = null;
  }

  /**
   * Called on mousemove as user drags.
   */
  move(mouseX, mouseY) {
    if (!this.drawing || !this.wireElement) return;

    // 1) Snap to grid if enabled
    let snappedX = mouseX;
    let snappedY = mouseY;
    if (this.enableSnapping) {
      snappedX = GRID_CONFIG.snapToGrid(mouseX);
      snappedY = GRID_CONFIG.snapToGrid(mouseY);
    }

    // 2) Compare how far we've moved from the start node
    const [startNode, endNode] = this.wireElement.nodes;
    const dx = snappedX - startNode.x;
    const dy = snappedY - startNode.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // 3) If no direction locked, see if we exceed the threshold
    if (!this.direction) {
      if (absDx - absDy >= this.THRESHOLD) {
        // Moved significantly more horizontally => lock horizontal
        this.direction = "horizontal";
      } else if (absDy - absDx >= this.THRESHOLD) {
        // Moved significantly more vertically => lock vertical
        this.direction = "vertical";
      }
      // else remain unlocked until one axis wins
    }

    // 4) Apply the lock
    if (this.direction === "horizontal") {
      // Keep y fixed to the start node
      endNode.x = startNode.x + dx;
      endNode.y = startNode.y;
    } else if (this.direction === "vertical") {
      // Keep x fixed
      endNode.x = startNode.x;
      endNode.y = startNode.y + dy;
    } else {
      // No direction locked => let the user place the wire freely (diagonal)
      endNode.x = startNode.x + dx;
      endNode.y = startNode.y + dy;
    }

    // If snapping is important after we fix an axis, you could re-snap endNode again
    // but that might let you “jump” if you do it incorrectly. This is optional.

    // 5) Emit update so UI re-renders
    this.circuitService.emit("update", {
      type: "drawWire",
      wire: this.wireElement,
    });
  }

  /**
   * Called on mouseup to finalize the wire.
   */
  stop() {
    this.drawing = false;
    this.direction = null;

    // Attempt to split an existing wire if the drawn wire end touches it
    if (this.wireElement && this.wireElement.nodes?.[1]) {
      const endNode = this.wireElement.nodes[1];
      this.wireSplitService.trySplitAtNode(endNode);
    }

    this.wireElement = null;
  }

  /**
   * If the user never actually moved,
   * we can remove this ephemeral wire to avoid leftover dots.
   */
  cancel() {
    if (this.wireElement) {
      this.circuitService.deleteElement(this.wireElement.id);
    }
    this.drawing = false;
    this.direction = null;
    this.wireElement = null;
  }
}
