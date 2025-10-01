import { GUICommand } from './GUICommand.js';
import { QucatNetlistAdapter } from '../../infrastructure/adapters/QucatNetlistAdapter.js';

/**
 * OpenNetlistCommand
 * 
 * Handles opening/loading a netlist file from the user's file system.
 * Follows the GUI button → Command → CircuitService → State change → Renderer update flow.
 */
export class OpenNetlistCommand extends GUICommand {
    /**
     * @param {CircuitService} circuitService - The circuit service
     * @param {CircuitRenderer} circuitRenderer - The circuit renderer for UI updates
     */
    constructor(circuitService, circuitRenderer) {
        super();
        this.circuitService = circuitService;
        this.circuitRenderer = circuitRenderer;
        this.previousState = null; // Store state for undo
    }

    /**
     * Execute open netlist operation
     */
    execute() {
        console.log('[OpenNetlistCommand] Opening netlist file');
        
        // Store current state for undo
        this.previousState = this.circuitService.exportState();
        
        // Create file input for user to select netlist file
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.txt,.qucat';
        fileInput.style.display = 'none';
        
        return new Promise((resolve) => {
            fileInput.addEventListener('change', async (event) => {
                try {
                    const file = event.target.files[0];
                    if (!file) {
                        console.log('[OpenNetlistCommand] No file selected');
                        resolve({ undo: () => {} });
                        return;
                    }
                    
                    console.log('[OpenNetlistCommand] Loading file:', file.name);
                    
                    // Read file content
                    const content = await this._readFileContent(file);
                    
                    // Parse netlist content
                    const elements = await this._parseNetlistContent(content);
                    
                    if (!elements || elements.length === 0) {
                        console.warn('[OpenNetlistCommand] No valid elements found in netlist');
                        alert('No valid circuit elements found in the selected file.');
                        resolve({ undo: () => {} });
                        return;
                    }
                    
                    // Clear current circuit and load new elements
                    await this._loadElementsIntoCircuit(elements);
                    
                    console.log(`[OpenNetlistCommand] Successfully loaded ${elements.length} elements`);
                    
                    // Trigger circuit update and re-render
                    this.circuitService.emit('update');
                    this.circuitRenderer.render();
                    
                    resolve({
                        undo: () => this.undo()
                    });
                    
                } catch (error) {
                    console.error('[OpenNetlistCommand] Error loading netlist:', error);
                    alert(`Error loading netlist file: ${error.message}`);
                    resolve({ undo: () => {} });
                } finally {
                    // Clean up file input
                    document.body.removeChild(fileInput);
                }
            });
            
            // Trigger file selection dialog
            document.body.appendChild(fileInput);
            fileInput.click();
        });
    }

    /**
     * Read the content of the selected file
     * @param {File} file - The file to read
     * @returns {Promise<string>} The file content
     * @private
     */
    _readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    /**
     * Parse netlist content into Element instances
     * @param {string} content - The netlist file content
     * @returns {Promise<Element[]>} Array of parsed elements
     * @private
     */
    async _parseNetlistContent(content) {
        try {
            // Use QucatNetlistAdapter to deserialize elements
            const elements = QucatNetlistAdapter.importFromString(content);
            
            return elements;
            
        } catch (error) {
            throw new Error(`Failed to parse netlist content: ${error.message}`);
        }
    }

    /**
     * Load the parsed elements into the circuit
     * @param {Element[]} elements - The elements to load
     * @private
     */
    async _loadElementsIntoCircuit(elements) {
        try {
            // Clear current circuit
            const currentElements = [...this.circuitService.circuit.elements];
            for (const element of currentElements) {
                this.circuitService.deleteElement(element.id);
            }
            
            // Add new elements to circuit via CircuitService
            for (const element of elements) {
                this.circuitService.addElement(element);
            }
            
            console.log('[OpenNetlistCommand] Circuit loaded with new elements');
            
        } catch (error) {
            throw new Error(`Failed to load elements into circuit: ${error.message}`);
        }
    }

    /**
     * Undo the open operation by restoring previous state
     */
    undo() {
        if (this.previousState) {
            console.log('[OpenNetlistCommand] Undoing netlist load, restoring previous state');
            this.circuitService.importState(this.previousState);
            this.circuitService.emit('update');
            this.circuitRenderer.render();
        } else {
            console.log('[OpenNetlistCommand] No previous state to restore');
        }
    }
}