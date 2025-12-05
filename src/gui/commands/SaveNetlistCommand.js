import { GUICommand } from './GUICommand.js';
import { QucatNetlistAdapter } from '../../infrastructure/adapters/QucatNetlistAdapter.js';

/**
 * SaveNetlistCommand
 * 
 * Handles saving the current circuit to a netlist file through the browser's download mechanism.
 * Follows the GUI button → Command → CircuitService → State change flow.
 */
export class SaveNetlistCommand extends GUICommand {
    /**
     * @param {CircuitService} circuitService - The circuit service
     * @param {CircuitRenderer} circuitRenderer - The circuit renderer for UI updates
     */
    constructor(circuitService, circuitRenderer) {
        super();
        this.circuitService = circuitService;
        this.circuitRenderer = circuitRenderer;
    }

    /**
     * Execute save netlist operation
     */
    execute() {
        try {
            
            // Get current circuit state
            const circuit = this.circuitService.circuit;
            
            if (!circuit || circuit.elements.length === 0) {
                console.warn('[SaveNetlistCommand] No circuit elements to save');
                alert('No circuit elements to save. Please add some components first.');
                return { undo: () => {} };
            }

            // Convert circuit to netlist format using QucatNetlistAdapter
            const netlistContent = QucatNetlistAdapter.exportToString(circuit);
            
            // Create and trigger download
            this._downloadNetlist(netlistContent);
            
            
            // No undo needed for save operation
            return { undo: () => {} };
            
        } catch (error) {
            console.error('[SaveNetlistCommand] Error saving netlist:', error);
            alert(`Error saving netlist: ${error.message}`);
            return { undo: () => {} };
        }
    }

    /**
     * Create and trigger a download of the netlist content
     * @param {string} content - The netlist content to download
     * @private
     */
    _downloadNetlist(content) {
        // Create a blob with the netlist content
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        // Create a temporary download link
        const link = document.createElement('a');
        link.href = url;
        link.download = `circuit_${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}.txt`;
        
        // Trigger the download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the object URL
        URL.revokeObjectURL(url);
    }

    /**
     * Undo is not applicable for save operations
     */
    undo() {
        // Save operations cannot be undone
    }
}