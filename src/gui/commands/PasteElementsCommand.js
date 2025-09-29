import { GUICommand } from "./GUICommand.js";
import { CopyElementsCommand } from "./CopyElementsCommand.js";
import { Position } from "../../domain/valueObjects/Position.js";
import { ElementFactory } from "../../domain/factories/ElementFactory.js";
import { Properties } from "../../domain/valueObjects/Properties.js";
import { Label } from "../../domain/valueObjects/Label.js";

/**
 * PasteElementsCommand: Pastes elements from clipboard with new IDs and offset positioning
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
    
    // Offset for pasted elements to avoid exact overlap
    this.PASTE_OFFSET_X = 20;
    this.PASTE_OFFSET_Y = 20;
  }

  /**
   * Execute the paste command - create new elements from clipboard with new IDs
   */
  execute() {
    const clipboardContent = CopyElementsCommand.getClipboardContent();
    
    if (!clipboardContent || clipboardContent.length === 0) {
      console.log("[PasteElementsCommand] No elements in clipboard to paste");
      return;
    }
    
    console.log(`[PasteElementsCommand] Pasting ${clipboardContent.length} element(s) from clipboard`);
    
    this.pastedElements = [];
    
    // Create new elements from clipboard content
    clipboardContent.forEach(originalElement => {
      try {
        // Create offset nodes (paste slightly offset from original position)
        const offsetNodes = originalElement.nodes.map(node => 
          new Position(node.x + this.PASTE_OFFSET_X, node.y + this.PASTE_OFFSET_Y)
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
        // Capitalize the type since ElementFactory expects capitalized names
        const capitalizedType = originalElement.type.charAt(0).toUpperCase() + originalElement.type.slice(1);
        const newElement = ElementFactory.create(
          capitalizedType,
          newId, // Use our generated unique ID
          offsetNodes,
          properties,
          label
        );
        
        // Add element to circuit
        this.circuitService.addElement(newElement);
        this.pastedElements.push(newElement);
        
        console.log(`[PasteElementsCommand] Created new ${newElement.type} with ID: ${newElement.id}`);
        
      } catch (error) {
        console.error(`[PasteElementsCommand] Failed to paste element:`, error);
      }
    });
    
    // Select all pasted elements
    this.circuitRenderer.setSelectedElements(this.pastedElements);
    
    console.log(`[PasteElementsCommand] Successfully pasted ${this.pastedElements.length} element(s)`);
  }

  /**
   * Undo the paste command - remove all pasted elements
   */
  undo() {
    if (!this.pastedElements || this.pastedElements.length === 0) {
      console.log("[PasteElementsCommand] No pasted elements to undo");
      return;
    }
    
    console.log(`[PasteElementsCommand] Undoing paste - removing ${this.pastedElements.length} element(s)`);
    
    // Remove each pasted element from the circuit
    this.pastedElements.forEach(element => {
      this.circuitService.deleteElement(element.id);
    });
    
    // Clear selection
    this.circuitRenderer.clearSelection();
    
    console.log("[PasteElementsCommand] Paste operation undone successfully");
  }

  /**
   * Check if this command can be undone
   * @returns {boolean}
   */
  canUndo() {
    return this.pastedElements && this.pastedElements.length > 0;
  }
}