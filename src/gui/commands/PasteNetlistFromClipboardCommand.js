import { GUICommand } from './GUICommand.js';
import { QucatNetlistAdapter } from '../../infrastructure/adapters/QucatNetlistAdapter.js';

/**
 * PasteNetlistFromClipboardCommand
 *
 * Opens a modal dialog with a textarea where the user can paste a QuCat netlist
 * string (e.g. copied from a Jupyter cell). On confirmation the current circuit
 * is replaced with the parsed elements.  Supports undo.
 *
 * Follows the same Command-pattern contract as CopyNetlistToClipboardCommand
 * and OpenNetlistCommand.
 */
export class PasteNetlistFromClipboardCommand extends GUICommand {
    /**
     * @param {import('../../application/CircuitService.js').CircuitService} circuitService
     * @param {import('../../gui/renderers/CircuitRenderer.js').CircuitRenderer} circuitRenderer
     */
    constructor(circuitService, circuitRenderer) {
        super();
        this.circuitService = circuitService;
        this.circuitRenderer = circuitRenderer;
        this.previousState = null;
    }

    /* ------------------------------------------------------------------ */
    /*  execute()                                                          */
    /* ------------------------------------------------------------------ */

    /**
     * Show the paste-dialog and — on confirmation — load the netlist.
     * Returns a Promise that resolves to `{ undo }` (same contract as
     * OpenNetlistCommand).
     */
    execute() {
        // Save state for undo *before* any mutation.
        this.previousState = this.circuitService.exportState();

        return new Promise((resolve) => {
            this._showPasteDialog(
                (netlistText) => {
                    // --- user clicked Import ---
                    try {
                        const elements = QucatNetlistAdapter.importFromString(netlistText);

                        if (!elements || elements.length === 0) {
                            this._showErrorNotification('No valid circuit elements found in the pasted text.');
                            resolve({ undo: () => {} });
                            return;
                        }

                        this._loadElementsIntoCircuit(elements);
                        this.circuitService.emit('update');
                        this.circuitRenderer.render();
                        this._showSuccessNotification(`Imported ${elements.length} element(s) from netlist.`);

                        resolve({ undo: () => this.undo() });
                    } catch (error) {
                        console.error('[PasteNetlistFromClipboardCommand] Parse error:', error);
                        this._showErrorNotification(`Invalid netlist: ${error.message}`);
                        resolve({ undo: () => {} });
                    }
                },
                () => {
                    // --- user cancelled ---
                    resolve({ undo: () => {} });
                }
            );
        });
    }

    /* ------------------------------------------------------------------ */
    /*  undo()                                                             */
    /* ------------------------------------------------------------------ */

    undo() {
        if (this.previousState) {
            this.circuitService.importState(this.previousState);
            this.circuitService.emit('update');
            this.circuitRenderer.render();
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Private helpers                                                    */
    /* ------------------------------------------------------------------ */

    /**
     * Clear the circuit and load parsed elements (same pattern as OpenNetlistCommand).
     * @param {import('../../domain/entities/Element.js').Element[]} elements
     * @private
     */
    _loadElementsIntoCircuit(elements) {
        const currentElements = [...this.circuitService.circuit.elements];
        for (const element of currentElements) {
            this.circuitService.deleteElement(element.id);
        }
        for (const element of elements) {
            this.circuitService.addElement(element);
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Paste-dialog                                                       */
    /* ------------------------------------------------------------------ */

    /**
     * Render a modal dialog containing a <textarea> and Import / Cancel buttons.
     *
     * @param {(text: string) => void} onImport  Called with the textarea value.
     * @param {() => void}             onCancel  Called when the dialog is dismissed.
     * @private
     */
    _showPasteDialog(onImport, onCancel) {
        if (typeof document === 'undefined' || !document.body) {
            // Non-browser environment (unit tests) – fall back to cancel.
            onCancel();
            return;
        }

        // --- Overlay ---
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; inset: 0;
            background: rgba(0,0,0,0.45);
            display: flex; align-items: center; justify-content: center;
            z-index: 10000;
        `;

        // --- Dialog ---
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: #fff; border-radius: 8px;
            padding: 24px; width: 520px; max-width: 90vw;
            box-shadow: 0 8px 32px rgba(0,0,0,0.25);
            font-family: Arial, sans-serif;
        `;

        // Title
        const title = document.createElement('h3');
        title.textContent = 'Paste Netlist';
        title.style.cssText = 'margin: 0 0 8px; font-size: 16px; color: #2c3e50;';

        // Description
        const desc = document.createElement('p');
        desc.textContent = 'Paste a QuCat netlist below (e.g. from a Jupyter cell) and click Import.';
        desc.style.cssText = 'margin: 0 0 12px; font-size: 13px; color: #666;';

        // Textarea
        const textarea = document.createElement('textarea');
        textarea.placeholder = 'R;1,0;2,0;1000;R_1\nC;2,0;3,0;1e-12;C_1';
        textarea.style.cssText = `
            width: 100%; height: 160px;
            padding: 10px; font-family: monospace; font-size: 13px;
            border: 1px solid #ccc; border-radius: 4px;
            resize: vertical; box-sizing: border-box;
        `;

        // Button bar
        const btnBar = document.createElement('div');
        btnBar.style.cssText = 'display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px;';

        const btnCancel = document.createElement('button');
        btnCancel.textContent = 'Cancel';
        btnCancel.style.cssText = `
            padding: 8px 18px; border: 1px solid #ccc; border-radius: 4px;
            background: #fff; cursor: pointer; font-size: 13px;
        `;

        const btnImport = document.createElement('button');
        btnImport.textContent = 'Import';
        btnImport.style.cssText = `
            padding: 8px 18px; border: none; border-radius: 4px;
            background: #3498db; color: #fff; cursor: pointer; font-size: 13px;
        `;

        btnBar.append(btnCancel, btnImport);
        dialog.append(title, desc, textarea, btnBar);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // Auto-focus the textarea so user can paste immediately.
        textarea.focus();

        // --- Cleanup helper ---
        const close = () => {
            if (overlay.parentNode) document.body.removeChild(overlay);
        };

        // --- Event handlers ---
        btnImport.addEventListener('click', () => {
            const text = textarea.value.trim();
            close();
            if (text) {
                onImport(text);
            } else {
                this._showErrorNotification('Netlist text is empty.');
                onCancel();
            }
        });

        btnCancel.addEventListener('click', () => {
            close();
            onCancel();
        });

        // Esc key dismisses
        const onKeydown = (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                close();
                onCancel();
                document.removeEventListener('keydown', onKeydown, true);
            }
        };
        document.addEventListener('keydown', onKeydown, true);

        // Click on overlay (outside dialog) dismisses
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                close();
                onCancel();
            }
        });
    }

    /* ------------------------------------------------------------------ */
    /*  Notifications (same pattern as CopyNetlistToClipboardCommand)     */
    /* ------------------------------------------------------------------ */

    /** @private */
    _showSuccessNotification(message) {
        this._showNotification(message, '#4caf50');
    }

    /** @private */
    _showErrorNotification(message) {
        this._showNotification(message, '#f44336');
    }

    /**
     * @param {string} message
     * @param {string} bgColor
     * @private
     */
    _showNotification(message, bgColor) {
        if (typeof document === 'undefined' || !document.body) return;

        const el = document.createElement('div');
        el.textContent = message;
        el.style.cssText = `
            position: fixed; top: 20px; right: 20px;
            background-color: ${bgColor}; color: white;
            padding: 12px 20px; border-radius: 4px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            z-index: 10001; font-family: Arial, sans-serif; font-size: 14px;
        `;
        document.body.appendChild(el);

        setTimeout(() => {
            el.style.opacity = '0';
            el.style.transition = 'opacity 0.3s';
            setTimeout(() => {
                if (el.parentNode === document.body) document.body.removeChild(el);
            }, 300);
        }, 3000);
    }
}
