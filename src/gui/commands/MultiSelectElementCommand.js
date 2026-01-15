import { GUICommand } from "./GUICommand.js";

/**
 * MultiSelectElementCommand: Handles multiple element selection
 */
export class MultiSelectElementCommand extends GUICommand {
    constructor(circuitService, circuitRenderer) {
        super();
        this.circuitService = circuitService;
        this.circuitRenderer = circuitRenderer;
        this.previousSelection = new Set();
        this.currentSelection = new Set();
    }

    /**
     * Execute multi-selection command
     * @param {Array} elements - The elements to select
     * @param {boolean} additive - Whether to add to existing selection or replace it
     */
    execute(elements, additive = false) {
        // Store previous selection for undo
        this.previousSelection = new Set(this.circuitRenderer.getSelectedElements());
        
        if (!additive) {
            // Clear existing selection
            this.circuitRenderer.clearSelection();
        }
        
        // Add new elements to selection
        if (Array.isArray(elements)) {
            elements.forEach(element => {
                if (element) {
                    this.circuitRenderer.addToSelection(element);
                    this.currentSelection.add(element);
                }
            });
        } else if (elements) {
            this.circuitRenderer.addToSelection(elements);
            this.currentSelection.add(elements);
        }
        
    }

    /**
     * Undo multi-selection command
     */
    undo() {
        // Restore previous selection
        this.circuitRenderer.setSelectedElements(this.previousSelection);
        
    }

    /**
     * Check if this command can be undone
     */
    canUndo() {
        return false; // Selection changes are not undoable in this implementation
    }
}
