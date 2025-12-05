import { GUICommand } from "./GUICommand.js";

/**
 * SelectElementCommand: Handles element selection
 */
export class SelectElementCommand extends GUICommand {
    constructor(circuitService, circuitRenderer) {
        super();
        this.circuitService = circuitService;
        this.circuitRenderer = circuitRenderer;
        this.previousSelection = null;
        this.currentSelection = null;
    }

    /**
     * Execute selection command
     * @param {Object} element - The element to select, or null to clear selection
     */
    execute(element) {
        // Store previous selection for undo
        this.previousSelection = this.circuitRenderer.selectedElement;
        this.currentSelection = element;
        
        // Set selection in renderer
        this.circuitRenderer.setSelectedElement(element);
        
        // Trigger re-render
        this.circuitRenderer.render();
        
    }

    /**
     * Undo selection command
     */
    undo() {
        // Restore previous selection
        this.circuitRenderer.setSelectedElement(this.previousSelection);
        
        // Trigger re-render
        this.circuitRenderer.render();
        
    }

    /**
     * Check if this command can be undone
     */
    canUndo() {
        return false; // Selection changes are not undoable in this implementation
    }
}
