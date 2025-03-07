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
            const dx = x - this.offset.x;
            const dy = y - this.offset.y;
            this.draggedElement.nodes = this.draggedElement.nodes.map((node) => new Position(dx, dy));

            this.circuitService.emit("update", { type: "moveElement", element: this.draggedElement });
        }
    }

    stop() {
        this.draggedElement = null;
    }

    isInsideElement(x, y, element) {
        const [start] = element.nodes;
        return (
            x >= start.x &&
            x <= start.x + 50 &&
            y >= start.y &&
            y <= start.y + 50
        );
    }
}
