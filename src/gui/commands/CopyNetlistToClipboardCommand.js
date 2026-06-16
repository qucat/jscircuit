import { GUICommand } from './GUICommand.js';
import { QucatNetlistAdapter } from '../../infrastructure/adapters/QucatNetlistAdapter.js';
import { tr } from '../i18n/i18n.js';

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
     * @param {(message: string, type: 'success'|'error') => void} notify - Notification callback
     */
    constructor(circuitService, circuitRenderer, notify) {
        super();
        this.circuitService = circuitService;
        this.circuitRenderer = circuitRenderer;
        this.notify = notify || (() => {});
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
                alert(tr('command.noElementsToCopy'));
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
            alert(tr('command.copyError', { message: error.message }));
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
                    this._showSuccessNotification(tr('command.netlistCopied'));
                })
                .catch(err => {
                    console.error('[CopyNetlistToClipboardCommand] Failed to copy to clipboard:', err);
                    this._showErrorNotification(tr('command.copyFailed'));
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
                this._showSuccessNotification(tr('command.netlistCopied'));
            } else {
                console.error('[CopyNetlistToClipboardCommand] execCommand failed');
                this._showErrorNotification(tr('command.copyFailed'));
            }
        } catch (err) {
            console.error('[CopyNetlistToClipboardCommand] Fallback copy failed:', err);
            this._showErrorNotification(tr('command.copyFailed'));
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
        this.notify(message, 'success');
    }

    /**
     * Show error notification to user
     * @param {string} message - The message to display
     * @private
     */
    _showErrorNotification(message) {
        this.notify(message, 'error');
    }
}
