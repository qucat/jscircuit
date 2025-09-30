/**
 * @fileoverview PropertyPanel - A modal dialog for editing element properties
 * Provides dynamic property editing based on element type with validation and label management.
 */

import { CircuitService } from '../../application/CircuitService.js';
import { UpdateElementPropertiesCommand } from '../commands/UpdateElementPropertiesCommand.js';
import { CommandHistory } from '../commands/CommandHistory.js';

/**
 * PropertyPanel class for displaying and editing element properties
 * Follows the established GUI component patterns in the architecture
 */
export class PropertyPanel {
    constructor() {
        this.isVisible = false;
        this.currentElement = null;
        this.onSave = null;
        this.onCancel = null;
        this.panelElement = null;
        this.overlayElement = null;
        this.boundKeyDownHandler = null; // Store bound handler for cleanup
    }

    /**
     * Show the property panel for editing an element
     * @param {Element} element - The element to edit
     * @param {Function} onSave - Callback when properties are saved (element, newProperties) => void
     * @param {Function} onCancel - Callback when editing is cancelled
     */
    show(element, onSave, onCancel) {
        if (this.isVisible) {
            this.hide();
        }

        this.currentElement = element;
        this.onSave = onSave;
        this.onCancel = onCancel;
        this.isVisible = true;

        this.createPanelHTML();
        this.setupEventListeners();
        this.focusFirstInput();
    }

    /**
     * Hide the property panel
     */
    hide() {
        // Clean up keyboard event listener
        if (this.boundKeyDownHandler) {
            document.removeEventListener('keydown', this.boundKeyDownHandler, true);
            this.boundKeyDownHandler = null;
        }

        if (this.overlayElement && this.overlayElement.parentNode) {
            this.overlayElement.parentNode.removeChild(this.overlayElement);
        }
        
        this.isVisible = false;
        this.currentElement = null;
        this.onSave = null;
        this.onCancel = null;
        this.panelElement = null;
        this.overlayElement = null;
    }

    /**
     * Create the HTML structure for the property panel
     * @private
     */
    createPanelHTML() {
        // Create overlay for modal background
        this.overlayElement = document.createElement('div');
        this.overlayElement.className = 'property-panel-overlay';
        
        // Create main panel
        this.panelElement = document.createElement('div');
        this.panelElement.className = 'property-panel';
        
        // Generate content based on element type
        const content = this.generateContentForElement(this.currentElement);
        this.panelElement.innerHTML = content;
        
        this.overlayElement.appendChild(this.panelElement);
        document.body.appendChild(this.overlayElement);

        // Add CSS styles if not already present
        this.addStyles();
    }

    /**
     * Generate HTML content based on element type
     * @param {Element} element - The element to create content for
     * @returns {string} HTML content
     * @private
     */
    generateContentForElement(element) {
        // Use element.type instead of constructor.name to avoid minification issues
        const elementType = element.type || element.constructor.name;
        const properties = element.getProperties();
        const currentLabel = element.label ? element.label.value || element.label : '';
        
        console.log(`[PropertyPanel] Element type: "${elementType}", constructor: "${element.constructor.name}"`);
        console.log(`[PropertyPanel] Element properties:`, properties.values);
        
        // Simple hardcoded configurations for each element type
        const elementConfigs = {
            // Use both constructor names and type property names
            Junction: {
                title: 'Junction Properties',
                description: 'Configure Josephson junction parameters',
                helpText: 'Note: Josephson junctions act as nonlinear inductors in superconducting circuits.',
                fields: [
                    { key: 'critical_current', label: 'Critical Current', unit: 'A', placeholder: 'Enter critical current' },
                    { key: 'capacitance', label: 'Capacitance', unit: 'F', placeholder: 'Enter capacitance' },
                ]
            },
            junction: {  // lowercase version
                title: 'Junction Properties',
                description: 'Configure Josephson junction parameters',
                helpText: 'Note: Josephson junctions act as nonlinear inductors in superconducting circuits.',
                fields: [
                    { key: 'critical_current', label: 'Critical Current', unit: 'A', placeholder: 'Enter critical current' },
                    { key: 'capacitance', label: 'Capacitance', unit: 'F', placeholder: 'Enter capacitance' },
                ]
            },
            Resistor: {
                title: 'Resistor Properties',
                description: 'Configure resistance value',
                helpText: 'Specify resistance in Ohms (Ω)',
                fields: [
                    { key: 'resistance', label: 'Resistance', unit: 'Ω', placeholder: 'Enter resistance value' }
                ]
            },
            resistor: {  // lowercase version
                title: 'Resistor Properties',
                description: 'Configure resistance value', 
                helpText: 'Specify resistance in Ohms (Ω)',
                fields: [
                    { key: 'resistance', label: 'Resistance', unit: 'Ω', placeholder: 'Enter resistance value' }
                ]
            },
            Capacitor: {
                title: 'Capacitor Properties', 
                description: 'Configure capacitance value',
                helpText: 'Specify capacitance in Farads (F)',
                fields: [
                    { key: 'capacitance', label: 'Capacitance', unit: 'F', placeholder: 'Enter capacitance value' }
                ]
            },
            capacitor: {  // lowercase version
                title: 'Capacitor Properties', 
                description: 'Configure capacitance value',
                helpText: 'Specify capacitance in Farads (F)',
                fields: [
                    { key: 'capacitance', label: 'Capacitance', unit: 'F', placeholder: 'Enter capacitance value' }
                ]
            },
            Inductor: {
                title: 'Inductor Properties',
                description: 'Configure inductance value', 
                helpText: 'Specify inductance in Henry (H)',
                fields: [
                    { key: 'inductance', label: 'Inductance', unit: 'H', placeholder: 'Enter inductance value' }
                ]
            },
            inductor: {  // lowercase version
                title: 'Inductor Properties',
                description: 'Configure inductance value', 
                helpText: 'Specify inductance in Henry (H)',
                fields: [
                    { key: 'inductance', label: 'Inductance', unit: 'H', placeholder: 'Enter inductance value' }
                ]
            },
            Wire: {
                title: 'Wire Properties',
                description: 'Ideal conducting wire',
                helpText: 'Wires have no configurable electrical parameters',
                fields: []
            },
            wire: {  // lowercase version
                title: 'Wire Properties',
                description: 'Ideal conducting wire',
                helpText: 'Wires have no configurable electrical parameters',
                fields: []
            },
            Ground: {
                title: 'Ground Properties',
                description: 'Reference point (0V)',
                helpText: 'Ground has no configurable electrical parameters', 
                fields: []
            },
            ground: {  // lowercase version
                title: 'Ground Properties',
                description: 'Reference point (0V)',
                helpText: 'Ground has no configurable electrical parameters', 
                fields: []
            }
        };

        const config = elementConfigs[elementType];
        if (!config) {
            console.warn(`[PropertyPanel] No configuration found for element type: "${elementType}"`);
            console.warn(`[PropertyPanel] Available configurations:`, Object.keys(elementConfigs));
            return this.generateFallbackContent(elementType, currentLabel);
        }

        console.log(`[PropertyPanel] Using configuration for: "${elementType}"`);
        
        // Generate property fields
        const propertyFields = config.fields.map(field => {
            const currentValue = properties.values[field.key] || '';
            return `
                <div class="property-field">
                    <label for="${field.key}">${field.label}${field.unit ? ` (${field.unit})` : ''}</label>
                    <input type="number" 
                           id="${field.key}" 
                           name="${field.key}" 
                           value="${currentValue}" 
                           step="any" 
                           placeholder="${field.placeholder}">
                </div>
            `;
        }).join('');

        return `
            <div class="property-panel-header">
                <h3>${elementType.toUpperCase()}</h3>
            </div>
            <div class="property-panel-content">
                <div class="property-panel-title">
                    <em>${config.title}</em>
                    <div class="help-text">${config.helpText}</div>
                </div>
                ${propertyFields}
                <div class="property-field">
                    <label for="label">Label</label>
                    <input type="text" id="label" name="label" 
                           value="${currentLabel}" 
                           placeholder="Enter element label">
                    <small class="field-help">Optional identifier for this element</small>
                </div>
            </div>
            <div class="property-panel-actions">
                <button type="button" class="cancel-btn">Cancel</button>
                <button type="button" class="ok-btn">OK</button>
            </div>
        `;
    }

    /**
     * Generate fallback content for unknown element types
     * @param {string} elementType - The element type name
     * @param {string} currentLabel - Current label value
     * @returns {string} HTML content
     * @private
     */
    generateFallbackContent(elementType, currentLabel) {
        return `
            <div class="property-panel-header">
                <h3>Circuit Editor</h3>
            </div>
            <div class="property-panel-content">
                <div class="property-panel-title">
                    <em>Configure ${elementType} properties</em>
                </div>
                <div class="property-field">
                    <label for="label">Label</label>
                    <input type="text" id="label" name="label" 
                           value="${currentLabel}" 
                           placeholder="Enter element label">
                </div>
            </div>
            <div class="property-panel-actions">
                <button type="button" class="cancel-btn">Cancel</button>
                <button type="button" class="ok-btn">OK</button>
            </div>
        `;
    }

    /**
     * Setup event listeners for the panel
     * @private
     */
    setupEventListeners() {
        // OK button
        const okBtn = this.panelElement.querySelector('.ok-btn');
        okBtn.addEventListener('click', () => this.handleSave());

        // Cancel button
        const cancelBtn = this.panelElement.querySelector('.cancel-btn');
        cancelBtn.addEventListener('click', () => this.handleCancel());

        // Escape key - store bound handler for cleanup
        this.boundKeyDownHandler = this.handleKeyDown.bind(this);
        document.addEventListener('keydown', this.boundKeyDownHandler, true); // Use capture phase

        // Click outside to close
        this.overlayElement.addEventListener('click', (event) => {
            if (event.target === this.overlayElement) {
                this.handleCancel();
            }
        });
    }

    /**
     * Handle keyboard events
     * @param {KeyboardEvent} event
     * @private
     */
    handleKeyDown(event) {
        if (!this.isVisible) return;

        // Block ALL keyboard shortcuts when property panel is open
        // This prevents conflicts with text input and component shortcuts
        console.log("[PropertyPanel] Blocking keyboard event:", event.key);
        event.stopPropagation();

        if (event.key === 'Escape') {
            event.preventDefault();
            this.handleCancel();
        } else if (event.key === 'Enter' && !event.shiftKey) {
            // Only prevent default for Enter if not in textarea or if not holding shift
            const activeElement = document.activeElement;
            const isTextarea = activeElement && activeElement.tagName === 'TEXTAREA';
            
            if (!isTextarea) {
                event.preventDefault();
                this.handleSave();
            }
        }
        // For all other keys, let them work normally in input fields
        // but prevent them from triggering application shortcuts
    }

    /**
     * Handle save action
     * @private
     */
    handleSave() {
        const newProperties = this.collectFormData();
        
        // Validation: Check if at least a label or one property is specified
        const hasLabel = newProperties.label && newProperties.label.trim() !== '';
        const hasProperties = Object.keys(newProperties).some(key =>
            key !== 'label' && newProperties[key] !== undefined && newProperties[key] !== ''
        );
        
        if (!hasLabel && !hasProperties) {
            this.showValidationWarning();
            return;
        }
        
        if (this.onSave) {
            this.onSave(this.currentElement, newProperties);
        }
        
        this.hide();
    }

    /**
     * Show validation warning dialog
     * @private
     */
    showValidationWarning() {
        // Create warning dialog
        const warningOverlay = document.createElement('div');
        warningOverlay.className = 'property-panel-warning-overlay';
        
        const warningDialog = document.createElement('div');
        warningDialog.className = 'property-panel-warning-dialog';
        
        warningDialog.innerHTML = `
            <div class="warning-header">
                <h4>⚠️ Incomplete Properties</h4>
            </div>
            <div class="warning-content">
                <p>Please specify at least one of the following:</p>
                <ul>
                    <li>A label for the component</li>
                    <li>A property value (resistance, capacitance, etc.)</li>
                </ul>
                <p>This ensures the component can be properly identified and used in the circuit.</p>
            </div>
            <div class="warning-actions">
                <button type="button" class="warning-ok-btn">OK</button>
            </div>
        `;
        
        warningOverlay.appendChild(warningDialog);
        document.body.appendChild(warningOverlay);
        
        // Add warning dialog styles
        this.addWarningStyles();
        
        // Handle warning dialog close
        const okBtn = warningDialog.querySelector('.warning-ok-btn');
        okBtn.addEventListener('click', () => {
            document.body.removeChild(warningOverlay);
            // Focus on the label input to guide user
            const labelInput = this.panelElement.querySelector('#label');
            if (labelInput) {
                labelInput.focus();
            }
        });
        
        // Close on overlay click
        warningOverlay.addEventListener('click', (event) => {
            if (event.target === warningOverlay) {
                document.body.removeChild(warningOverlay);
            }
        });
        
        // Close on Escape key
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                document.removeEventListener('keydown', handleEscape);
                if (document.body.contains(warningOverlay)) {
                    document.body.removeChild(warningOverlay);
                }
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    /**
     * Handle cancel action
     * @private
     */
    handleCancel() {
        if (this.onCancel) {
            this.onCancel();
        }
        
        this.hide();
    }

    /**
     * Collect form data into properties object
     * @returns {Object} Properties object with updated values
     * @private
     */
    collectFormData() {
        const properties = {};
        
        // Get label
        const labelInput = this.panelElement.querySelector('#label');
        if (labelInput && labelInput.value.trim()) {
            properties.label = labelInput.value.trim();
        } else {
            // Explicitly set null/empty if label is cleared
            properties.label = null;
        }

        // Get all input fields except label
        const inputs = this.panelElement.querySelectorAll('input:not(#label), select');
        
        inputs.forEach(input => {
            const key = input.name;
            const value = input.value.trim();
            
            if (key && value !== '') {
                if (input.type === 'number') {
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue)) {
                        properties[key] = numValue;
                    }
                } else if (input.type === 'select-one' || input.tagName === 'SELECT') {
                    // Handle select elements
                    properties[key] = parseInt(value) || value;
                } else {
                    properties[key] = value;
                }
            }
        });

        console.log("[PropertyPanel] Collected properties:", properties);
        return properties;
    }

    /**
     * Focus the first input field
     * @private
     */
    focusFirstInput() {
        // Focus the first property input if available, otherwise the label input
        const firstPropertyInput = this.panelElement.querySelector('.property-field input[type="number"]');
        const labelInput = this.panelElement.querySelector('#label');
        
        if (firstPropertyInput) {
            firstPropertyInput.focus();
            firstPropertyInput.select();
        } else if (labelInput) {
            labelInput.focus();
            labelInput.select();
        }
    }

    /**
     * Add CSS styles to the page if not already present
     * @private
     */
    addStyles() {
        if (document.getElementById('property-panel-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'property-panel-styles';
        style.textContent = `
            /* Use the same font family as MenuBar for consistency */
            .property-panel-overlay,
            .property-panel,
            .property-panel * {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
            }

            .property-panel-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .property-panel {
                background: white;
                border-radius: 14px;
                box-shadow: 0 14px 40px rgba(0,0,0,.28), 0 6px 16px rgba(0,0,0,.25);
                width: 400px;
                max-width: 90vw;
                max-height: 90vh;
                overflow: auto;
                position: relative;
                border: 1px solid #d0d0d0;
            }

            .property-panel-header {
                background: linear-gradient(#ecf3fb, #dbe6f4);
                padding: 12px 20px;
                border-bottom: 1px solid #c5d2e2;
                border-radius: 14px 14px 0 0;
            }

            .property-panel-header h3 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
                color: #161616;
            }

            .property-panel-content {
                padding: 20px;
            }

            .property-panel-title {
                margin-bottom: 20px;
                font-style: italic;
                color: #555;
                font-size: 14px;
                line-height: 1.4;
            }

            .help-text {
                margin-top: 8px;
                padding: 8px 12px;
                background: #f8f9fa;
                border-left: 3px solid #007bff;
                border-radius: 0 4px 4px 0;
                font-size: 13px;
                color: #6c757d;
                font-style: normal;
            }

            .property-field {
                margin-bottom: 15px;
            }

            .property-field:last-of-type {
                margin-bottom: 0;
            }

            .property-field label {
                display: block;
                margin-bottom: 5px;
                font-weight: 500;
                color: #161616;
                font-size: 14px;
            }

            .property-field input,
            .property-field select {
                width: 100%;
                padding: 8px 12px;
                border: 2px solid #ddd;
                border-radius: 8px;
                font-size: 14px;
                box-sizing: border-box;
                transition: border-color 0.2s;
                background: white;
            }

            .property-field input:focus,
            .property-field select:focus {
                outline: none;
                border-color: #007bff;
            }

            .field-help {
                display: block;
                margin-top: 4px;
                font-size: 12px;
                color: #6c757d;
                font-style: italic;
            }

            .property-panel-actions {
                padding: 15px 20px;
                border-top: 1px solid #c5d2e2;
                text-align: right;
                background: linear-gradient(#ecf3fb, #dbe6f4);
                border-radius: 0 0 14px 14px;
            }

            .property-panel-actions button {
                padding: 8px 16px;
                border: 1px solid #c5d2e2;
                border-radius: 8px;
                background: white;
                cursor: pointer;
                font-size: 14px;
                margin-left: 8px;
                transition: all 0.2s ease;
                font-family: inherit;
            }

            .property-panel-actions button:hover {
                background: rgba(0,0,0,.08);
            }

            .property-panel-actions .ok-btn {
                background: #007bff;
                color: white;
                border-color: #007bff;
            }

            .property-panel-actions .ok-btn:hover {
                background: #0056b3;
                border-color: #0056b3;
            }

            .property-panel-actions .cancel-btn:hover {
                background: rgba(0,0,0,.08);
            }
        `;

        document.head.appendChild(style);
    }

    /**
     * Add warning dialog styles
     * @private
     */
    addWarningStyles() {
        // Check if warning styles already exist
        if (document.querySelector('#property-panel-warning-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'property-panel-warning-styles';
        style.textContent = `
            .property-panel-warning-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1001;
                animation: fadeIn 0.15s ease-out;
            }

            .property-panel-warning-dialog {
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.15);
                max-width: 400px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                animation: slideIn 0.2s ease-out;
                border: 1px solid #e0e0e0;
            }

            .warning-header {
                padding: 20px 20px 0 20px;
                border-bottom: 1px solid #f0f0f0;
                margin-bottom: 20px;
            }

            .warning-header h4 {
                margin: 0 0 15px 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                font-size: 18px;
                font-weight: 600;
                color: #d73a49;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .warning-content {
                padding: 0 20px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                font-size: 14px;
                line-height: 1.5;
                color: #161616;
            }

            .warning-content ul {
                margin: 10px 0;
                padding-left: 20px;
            }

            .warning-content li {
                margin-bottom: 5px;
            }

            .warning-actions {
                padding: 20px;
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                border-top: 1px solid #f0f0f0;
                margin-top: 20px;
            }

            .warning-ok-btn {
                padding: 8px 16px;
                background: #007bff;
                color: white;
                border: 2px solid #007bff;
                border-radius: 6px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.15s ease;
                min-width: 80px;
            }

            .warning-ok-btn:hover {
                background: #0056b3;
                border-color: #0056b3;
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translate(-50%, -48%) scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
            }
        `;

        document.head.appendChild(style);
    }

    /**
     * Check if the panel is currently visible
     * @returns {boolean}
     */
    isOpen() {
        return this.isVisible;
    }
}

// Create and export a shared instance
const propertyPanel = new PropertyPanel();
export default propertyPanel;