import { GUICommand } from "./GUICommand.js";

/**
 * CopyElementsCommand: Copies selected elements to clipboard for pasting
 * 
 * @param {CircuitService} circuitService - The circuit service to use
 * @param {CircuitRenderer} circuitRenderer - The circuit renderer to use
 * 
 * @return {CopyElementsCommand}
 */
export class CopyElementsCommand extends GUICommand {
  constructor(circuitService, circuitRenderer) {
    super();
    this.circuitService = circuitService;
    this.circuitRenderer = circuitRenderer;
    
    // Static clipboard to store copied elements across command instances
    CopyElementsCommand.clipboard = CopyElementsCommand.clipboard || [];
  }

  /**
   * Execute the copy command - store selected elements in clipboard
   */
  execute() {
    const selectedElements = this.circuitRenderer.getSelectedElements();
    
    if (!selectedElements || selectedElements.length === 0) {
      return;
    }
    
    
    // Deep copy elements to clipboard (preserve all properties, nodes, labels)
    CopyElementsCommand.clipboard = selectedElements.map(element => 
      JSON.parse(JSON.stringify(element))
    );
    
  }

  /**
   * Undo the copy command - this is a no-op since copy doesn't modify circuit state
   */
  undo() {
    // Copy operation doesn't modify circuit state, so no undo needed
  }

  /**
   * Check if this command can be undone - always false for copy operations
   * @returns {boolean}
   */
  canUndo() {
    return false; // Copy doesn't modify circuit state
  }

  /**
   * Static method to check if clipboard has content
   * @returns {boolean}
   */
  static hasClipboardContent() {
    return CopyElementsCommand.clipboard && CopyElementsCommand.clipboard.length > 0;
  }

  /**
   * Static method to get clipboard content
   * @returns {Array}
   */
  static getClipboardContent() {
    return CopyElementsCommand.clipboard || [];
  }

  /**
   * Static method to clear clipboard
   */
  static clearClipboard() {
    CopyElementsCommand.clipboard = [];
  }
}