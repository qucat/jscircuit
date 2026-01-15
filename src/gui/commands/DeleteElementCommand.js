import { GUICommand } from "./GUICommand.js";
import { Logger } from "../../utils/Logger.js";

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
      return;
    }
    
    
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
    
  }

  /**
   * Undo the delete command - restore deleted elements
   */
  undo() {
    if (!this.deletedElements || this.deletedElements.length === 0) {
      return;
    }
    
    
    // Restore each deleted element
    this.deletedElements.forEach(({ element }) => {
      this.circuitService.addElement(element);
    });
    
  }

  /**
   * Check if this command can be undone
   * @returns {boolean}
   */
  canUndo() {
    return this.deletedElements && this.deletedElements.length > 0;
  }
}