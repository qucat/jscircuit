import { GUICommand } from "./GUICommand.js";
import { CopyElementsCommand } from "./CopyElementsCommand.js";
import { Position } from "../../domain/valueObjects/Position.js";
import { ElementFactory } from "../../domain/factories/ElementFactory.js";
import { Properties } from "../../domain/valueObjects/Properties.js";
import { Label } from "../../domain/valueObjects/Label.js";

/**
 * PasteElementsCommand: Pastes elements from clipboard and starts group placement
 * 
 * @param {CircuitService} circuitService - The circuit service to use
 * @param {CircuitRenderer} circuitRenderer - The circuit renderer to use
 * 
 * @return {PasteElementsCommand}
 */
export class PasteElementsCommand extends GUICommand {
  constructor(circuitService, circuitRenderer) {
    super();
    this.circuitService = circuitService;
    this.circuitRenderer = circuitRenderer;
    this.pastedElements = [];
  }

  /**
   * Execute the paste command - create new elements from clipboard with new IDs
   */
  execute() {
    const clipboardContent = CopyElementsCommand.getClipboardContent();
    
    if (!clipboardContent || clipboardContent.length === 0) {
      return;
    }
    
    
    this.pastedElements = [];
    
    // Create new elements from clipboard content
    clipboardContent.forEach(originalElement => {
      try {
        // Preserve the copied geometry. GUIAdapter translates the complete group
        // to the cursor without changing the relative node positions.
        const copiedNodes = originalElement.nodes.map(node =>
          new Position(node.x, node.y)
        );
        
        // Create Properties instance preserving original properties
        const properties = new Properties(originalElement.properties?.values || {});
        
        // Create Label instance preserving original label (if any)
        const label = originalElement.label?.value ? new Label(originalElement.label.value) : null;
        
        // Generate a unique ID that doesn't conflict with existing elements
        const prefix = originalElement.type.charAt(0).toUpperCase();
        const existingIds = this.circuitService.circuit.elements.map(el => el.id);
        let newId;
        let counter = 1;
        do {
          newId = `${prefix}${counter}`;
          counter++;
        } while (existingIds.includes(newId));
        
        // Create new element with ElementFactory using the unique ID
        // Direct type lookup - element.type matches registry key (both lowercase)
        const newElement = ElementFactory.create(
          originalElement.type,
          newId, // Use our generated unique ID
          copiedNodes,
          properties,
          label
        );
        
        // Add element to circuit
        this.circuitService.addElement(newElement);
        this.pastedElements.push(newElement);
        
        
      } catch (error) {
        console.error(`[PasteElementsCommand] Failed to paste element:`, error);
      }
    });
    
    // Select all pasted elements
    this.circuitRenderer.setSelectedElements(this.pastedElements);

    // Hand the clones to GUI placement mode so they follow the cursor until
    // the user clicks. A single translation keeps groups rigid and connected.
    if (this.pastedElements.length > 0) {
      this.circuitService.emit('startPlacingGroup', { elements: this.pastedElements });
    }
  }

  /**
   * Undo the paste command - remove all pasted elements
   */
  undo() {
    if (!this.pastedElements || this.pastedElements.length === 0) {
      return;
    }
    
    
    // Remove each pasted element from the circuit
    this.pastedElements.forEach(element => {
      this.circuitService.deleteElement(element.id);
    });
    
    // Clear selection
    this.circuitRenderer.clearSelection();
    
  }

  /**
   * Check if this command can be undone
   * @returns {boolean}
   */
  canUndo() {
    return this.pastedElements && this.pastedElements.length > 0;
  }
}
