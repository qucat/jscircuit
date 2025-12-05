import { GUICommand } from "./GUICommand.js";

/**
 * UpdateElementPropertiesCommand: Updates properties of an existing element
 * Follows the command pattern for undo/redo functionality
 */
export class UpdateElementPropertiesCommand extends GUICommand {
    constructor(circuitService, circuitRenderer) {
        super();
        this.circuitService = circuitService;
        this.circuitRenderer = circuitRenderer;
        this.elementId = null;
        this.oldProperties = null;
        this.oldLabel = null;
        this.newProperties = null;
        this.newLabel = null;
    }

    /**
     * Initialize the command with element and new properties
     * @param {string} elementId - ID of the element to update
     * @param {Object} newProperties - New properties to set
     */
    setData(elementId, newProperties) {
        this.elementId = elementId;
        this.newProperties = newProperties;
        this.newLabel = newProperties.label;
        
        // Store current state for undo
        const element = this.circuitService.getElementByID(elementId);
        if (element) {
            this.oldProperties = { ...element.getProperties().values };
            this.oldLabel = element.label;
        }
    }

    /**
     * Execute the property update through CircuitService
     */
    execute() {
        if (!this.elementId || !this.newProperties) {
            return;
        }

        // Use CircuitService to update properties (maintains aggregate boundary)
        const success = this.circuitService.updateElementProperties(this.elementId, this.newProperties);
        
        if (!success) {
            console.error(`Failed to update element ${this.elementId}`);
        }
    }

    /**
     * Undo the property update by restoring old values through CircuitService
     */
    undo() {
        if (!this.elementId || !this.oldProperties) {
            return;
        }


        // Create combined properties object with old values and old label
        const oldPropertiesWithLabel = {
            ...this.oldProperties,
            label: this.oldLabel
        };

        // Use CircuitService to restore properties (maintains aggregate boundary)
        const success = this.circuitService.updateElementProperties(this.elementId, oldPropertiesWithLabel);
        
        if (!success) {
        } else {
        }
    }

    /**
     * Check if this command can be undone
     * @returns {boolean}
     */
    canUndo() {
        return this.elementId && this.oldProperties;
    }
}