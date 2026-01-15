import { GUICommand } from './GUICommand.js';
import { QucatNetlistAdapter } from '../../infrastructure/adapters/QucatNetlistAdapter.js';

/**
 * CopyNetlistToClipboardCommand
 * 
 * Handles copying the current circuit netlist to the system clipboard.
 * Provides user feedback on success/failure.
 */
export class CopyNetlistToClipboardCommand extends GUICommand {
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
     * Execute copy netlist to clipboard operation
     */
    execute() {
        try {
            // Get current circuit state
            const circuit = this.circuitService.circuit;
            
            if (!circuit || circuit.elements.length === 0) {
                console.warn('[CopyNetlistToClipboardCommand] No circuit elements to copy');
                alert('No circuit elements to copy. Please add some components first.');
                return { undo: () => {} };
            }

            // Convert circuit to netlist format using QucatNetlistAdapter
            const netlistContent = QucatNetlistAdapter.exportToString(circuit);
            
            // Copy to clipboard
            this._copyToClipboard(netlistContent);
            
            // No undo needed for clipboard operation
            return { undo: () => {} };
            
        } catch (error) {
            console.error('[CopyNetlistToClipboardCommand] Error copying netlist to clipboard:', error);
            alert(`Error copying netlist to clipboard: ${error.message}`);
            return { undo: () => {} };
        }
    }

    /**
     * Copy text to clipboard using the Clipboard API
     * Falls back to older execCommand method if needed
     * @param {string} content - The content to copy
     * @private
     */
    _copyToClipboard(content) {
        // Use modern Clipboard API if available
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(content)
                .then(() => {
                    console.log('[CopyNetlistToClipboardCommand] Netlist copied to clipboard');
                    this._showSuccessNotification('Netlist copied to clipboard');
                })
                .catch(err => {
                    console.error('[CopyNetlistToClipboardCommand] Failed to copy to clipboard:', err);
                    this._showErrorNotification('Failed to copy to clipboard');
                });
        } else {
            // Fallback to older method for browsers that don't support Clipboard API
            this._copyToClipboardFallback(content);
        }
    }

    /**
     * Fallback method for copying to clipboard using execCommand
     * @param {string} content - The content to copy
     * @private
     */
    _copyToClipboardFallback(content) {
        const textArea = document.createElement('textarea');
        textArea.value = content;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        
        try {
            textArea.select();
            const successful = document.execCommand('copy');
            if (successful) {
                console.log('[CopyNetlistToClipboardCommand] Netlist copied to clipboard (fallback method)');
                this._showSuccessNotification('Netlist copied to clipboard');
            } else {
                console.error('[CopyNetlistToClipboardCommand] execCommand failed');
                this._showErrorNotification('Failed to copy to clipboard');
            }
        } catch (err) {
            console.error('[CopyNetlistToClipboardCommand] Fallback copy failed:', err);
            this._showErrorNotification('Failed to copy to clipboard');
        } finally {
            document.body.removeChild(textArea);
        }
    }

    /**
     * Show success notification to user
     * @param {string} message - The message to display
     * @private
     */
    _showSuccessNotification(message) {
        // Only show notification in browser environment
        if (typeof document === "undefined" || !document.body) {
            return;
        }

        // Create a simple notification element
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #4caf50;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 14px;
        `;
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s';
            setTimeout(() => {
                // Check if notification is still in the DOM before removing
                if (notification.parentNode === document.body) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    /**
     * Show error notification to user
     * @param {string} message - The message to display
     * @private
     */
    _showErrorNotification(message) {
        // Only show notification in browser environment
        if (typeof document === "undefined" || !document.body) {
            return;
        }

        // Create a simple notification element
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #f44336;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 14px;
        `;
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s';
            setTimeout(() => {
                // Check if notification is still in the DOM before removing
                if (notification.parentNode === document.body) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}
