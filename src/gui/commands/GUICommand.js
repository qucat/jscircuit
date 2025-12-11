/**
 * @class GUICommand
 * @abstract
 * @description
 * Abstract base class for all GUI-related commands in the QuCat Circuit Generator.
 *
 * This class implements the Command Pattern, providing a standardized interface
 * for encapsulating user actions and enabling features like undo/redo, command
 * queuing, and macro recording.
 *
 * **Command Pattern Benefits:**
 * - Decouples GUI interactions from business logic
 * - Enables undo/redo functionality through command history
 * - Provides consistent interface for all user actions
 * - Supports command composition and macro operations
 *
 * **Usage in Architecture:**
 * All user interactions (add element, delete element, move, etc.) are implemented
 * as concrete commands extending this base class. Commands are registered in
 * GUICommandRegistry and executed through CommandHistory for undo support.
 *
 * @example
 * class CustomCommand extends GUICommand {
 *   constructor(circuitService) {
 *     super();
 *     this.circuitService = circuitService;
 *   }
 *
 *   execute() {
 *     // Implement specific command logic
 *   }
 *
 *   undo() {
 *     // Implement undo logic
 *   }
 * }
 */
export class GUICommand {
    /**
     * Creates a new GUICommand instance.
     *
     * @param {GUIAdapter} [guiAdapter] - Optional reference to the GUI adapter
     * @throws {Error} If attempting to instantiate the abstract base class directly
     */
    constructor(guiAdapter) {
        if (new.target === GUICommand) {
            throw new Error("Cannot instantiate abstract class GUICommand.");
        }
        this.guiAdapter = guiAdapter;
    }

    /**
     * Executes the command.
     * @abstract
     */
    execute() {
        throw new Error("Execute method must be implemented.");
    }

    /**
     * Undoes the command, reversing its effect.
     * @abstract
     */
    undo() {
        throw new Error("Undo method must be implemented.");
    }
}
