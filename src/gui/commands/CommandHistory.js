/**
 * @class CommandHistory
 * @description
 * Manages the execution history of commands, enabling undo and redo operations.
 * Used to track stateful interactions (e.g., adding, moving, deleting elements)
 * in a circuit design context.
 */
export class CommandHistory {
  /**
   * Initializes a new instance of CommandHistory.
   * Sets up empty history and future stacks.
   */
    constructor() {
      /**
       * @private
       * @type {Array<{execute: Function, undo: Function}>}
       */
      this.history = [];

      /**
       * @private
      * @type {Array<{execute: Function, undo: Function}>}
       */
      this.future = [];
    }

    /**
     * Executes a command and stores pre-command snapshot.
     * Clears future stack.
     *
     * @param {Object} command
     * @param {CircuitService} circuitService
     */
    executeCommand(command, circuitService) {
      const snapshot = circuitService.exportState();
      command.execute(circuitService);
      this.history.push({ snapshot, command });
      this.future = [];
    }
    /**
     * Reverts to the previous circuit state.
     * @param {CircuitService} circuitService
     */
    undo(circuitService) {
      if (this.history.length === 0) return;
      const { snapshot, command } = this.history.pop(); // Pop the last command
      const redoSnapshot = circuitService.exportState();
      circuitService.importState(snapshot);
      this.future.push({ snapshot: redoSnapshot, command });
    }

    /**
     * Reapplies the previously undone command.
     * @param {CircuitService} circuitService
     */
    redo(circuitService) {
      if (this.future.length === 0) return;
      const { snapshot, command } = this.future.pop();
      const undoSnapshot = circuitService.exportState();
      circuitService.importState(snapshot);
      this.history.push({ snapshot: undoSnapshot, command });
    }

    clear() {
      this.history = [];
      this.future = [];
    }
  }
