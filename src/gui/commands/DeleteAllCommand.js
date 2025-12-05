import { GUICommand } from "./GUICommand.js";

/**
 * DeleteAllCommand: Deletes all elements from the circuit
 * 
 * @param {CircuitService} circuitService - The circuit service to use
 * @param {CircuitRenderer} circuitRenderer - The circuit renderer to use
 * 
 * @return {DeleteAllCommand}
 */
export class DeleteAllCommand extends GUICommand {
  constructor(circuitService, circuitRenderer) {
    super();
    this.circuitService = circuitService;
    this.circuitRenderer = circuitRenderer;
    this.deletedElements = [];
    this.hasBeenExecuted = false; // Track if command was ever executed
  }

  /**
   * Execute the delete all command - remove all elements
   */
  execute() {
    // Get all elements from the circuit
    const allElements = this.circuitService.getElements();
    
    if (!allElements || allElements.length === 0) {
      return;
    }
    
    
    // Store elements for undo (deep copy to preserve state)
    this.deletedElements = allElements.map(element => ({
      element: JSON.parse(JSON.stringify(element)),
      id: element.id
    }));
    
    // Mark that this command has been executed
    this.hasBeenExecuted = true;
    
    // Delete all elements from the circuit
    allElements.forEach(element => {
      this.circuitService.deleteElement(element.id);
    });
    
    // Clear selection after deletion
    this.circuitRenderer.clearSelection();
    
  }

  /**
   * Undo the delete all command - restore all deleted elements
   */
  undo() {
    if (!this.deletedElements || this.deletedElements.length === 0) {
      return;
    }
    
    
    // Restore each deleted element (but only add if it doesn't already exist)
    this.deletedElements.forEach(({ element }) => {
      // Check if element already exists before adding
      const existingElement = this.circuitService.getElementByID(element.id);
      if (!existingElement) {
        this.circuitService.addElement(element);
      }
    });
    
  }

  /**
   * Check if this command can be undone
   * @returns {boolean}
   */
  canUndo() {
    // Return true if the command was ever executed, regardless of current state
    return this.hasBeenExecuted;
  }
}