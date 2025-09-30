import { GUICommand } from "./GUICommand.js";

/**
 * DeleteElementCommand: Deletes selected elements from the circuit
 * 
 * @param {CircuitService} circuitService - The circuit service to use
 * @param {CircuitRenderer} circuitRenderer - The circuit renderer to use
 * 
 * @return {DeleteElementCommand}
 */
export class DeleteElementCommand extends GUICommand {
  constructor(circuitService, circuitRenderer) {
    super();
    this.circuitService = circuitService;
    this.circuitRenderer = circuitRenderer;
    this.deletedElements = [];
  }

  /**
   * Execute the delete command - remove selected elements
   */
  execute() {
    const selectedElements = this.circuitRenderer.getSelectedElements();
    
    if (!selectedElements || selectedElements.length === 0) {
      console.log("[DeleteElementCommand] No elements selected for deletion");
      return;
    }
    
    console.log(`[DeleteElementCommand] Deleting ${selectedElements.length} selected element(s)`);
    
    // Store elements for undo (deep copy to preserve state)
    this.deletedElements = selectedElements.map(element => ({
      element: JSON.parse(JSON.stringify(element)),
      id: element.id
    }));
    
    // Delete each selected element from the circuit
    selectedElements.forEach(element => {
      this.circuitService.deleteElement(element.id);
    });
    
    // Clear selection after deletion
    this.circuitRenderer.clearSelection();
    
    console.log("[DeleteElementCommand] Elements deleted successfully");
  }

  /**
   * Undo the delete command - restore deleted elements
   */
  undo() {
    if (!this.deletedElements || this.deletedElements.length === 0) {
      console.log("[DeleteElementCommand] No elements to restore");
      return;
    }
    
    console.log(`[DeleteElementCommand] Restoring ${this.deletedElements.length} deleted element(s)`);
    
    // Restore each deleted element
    this.deletedElements.forEach(({ element }) => {
      this.circuitService.addElement(element);
    });
    
    console.log("[DeleteElementCommand] Elements restored successfully");
  }

  /**
   * Check if this command can be undone
   * @returns {boolean}
   */
  canUndo() {
    return this.deletedElements && this.deletedElements.length > 0;
  }
}