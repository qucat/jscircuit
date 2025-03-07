import { GUICommand } from "./GUICommand.js";
import { Position } from "../../domain/valueObjects/Position.js";

export class DragElementCommand extends GUICommand {
  constructor(circuitService) {
    super();
    this.circuitService = circuitService;
    this.draggedElement = null;
    this.offset = { x: 0, y: 0 };
  }

  start(x, y) {
    for (const element of this.circuitService.getElements()) {
      if (this.isInsideElement(x, y, element)) {
        this.draggedElement = element;
        const [start] = element.nodes;
        this.offset.x = x - start.x;
        this.offset.y = y - start.y;
        return;
      }
    }
  }

  move(x, y) {
    if (this.draggedElement) {
        const dx = (x - this.offset.x);
        const dy = (y - this.offset.y);

        const firstNode = this.draggedElement.nodes[0];
        const deltaX = dx - firstNode.x;
        const deltaY = dy - firstNode.y;

        this.draggedElement.nodes = this.draggedElement.nodes.map((node) =>
            new Position(node.x + deltaX, node.y + deltaY)
        );

        this.circuitService.emit("update", { type: "moveElement", element: this.draggedElement });
    }
}

  stop() {
    this.draggedElement = null;
  }

  // Helper method to check if a point is inside an element
  isInsideElement(x, y, element) {
    const auraSize = 10; //  Expand clickable area beyond element size

    if (element.nodes.length < 2) return false; //  Must have at least two nodes

    const [start, end] = element.nodes;

    // Calculate distance of the point (x, y) from the element line
    const lineLength = Math.hypot(end.x - start.x, end.y - start.y);
    const distance =
      Math.abs(
        (end.y - start.y) * x -
          (end.x - start.x) * y +
          end.x * start.y -
          end.y * start.x,
      ) / lineLength;

    // Allow clicks if within `auraSize` pixels of the element
    return distance <= auraSize;
  }
}
