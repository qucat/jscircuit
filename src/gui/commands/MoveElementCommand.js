import { Command } from "./Command.js";

export class MoveElementCommand extends Command {
    constructor() {
        super();
        this.previousPositions = new Map(); // Store positions for undo
    }

    execute(element, newPosition) {
        if (!element) return;

        // Store previous position for undo
        this.previousPositions.set(element.id, [...element.nodes]);


        this.emit("commandExecuted", {
            type: "dragElement",
            elementId: element.id,
            newPosition,
        });
    }

    undo() {
        this.previousPositions.forEach((oldPosition, elementId) => {
            this.emit("commandExecuted", {
                type: "dragElement",
                elementId,
                newPosition: oldPosition,
            });
        });

        this.previousPositions.clear();
    }
}
