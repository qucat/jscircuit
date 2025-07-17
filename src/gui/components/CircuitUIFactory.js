/**
 * CircuitUIFactory - Factory for creating circuit UI components
 * Centralizes common UI creation logic to reduce code duplication
 */

export class CircuitUIFactory {
    /**
     * Creates a standardized button element
     * @param {string} id - The button ID
     * @param {string} text - The button text
     * @param {Object} options - Additional options
     * @returns {HTMLButtonElement}
     */
    static createButton(id, text, options = {}) {
        const btn = document.createElement("button");
        btn.id = id;
        btn.textContent = text;
        
        if (options.className) {
            btn.className = options.className;
        }
        
        if (options.style) {
            Object.assign(btn.style, options.style);
        }
        
        return btn;
    }

    /**
     * Creates a standardized canvas element
     * @param {Object} options - Canvas configuration
     * @returns {HTMLCanvasElement}
     */
    static createCanvas(options = {}) {
        const canvas = document.createElement("canvas");
        canvas.id = options.id || "circuitCanvas";
        canvas.width = options.width || 800;
        canvas.height = options.height || 600;
        
        // Default styling
        canvas.style.border = options.border || "1px solid #ccc";
        canvas.style.marginTop = options.marginTop || "20px";
        
        if (options.style) {
            Object.assign(canvas.style, options.style);
        }
        
        return canvas;
    }

    /**
     * Creates a controls container with standard buttons
     * @param {Object} options - Configuration options
     * @returns {HTMLDivElement}
     */
    static createControlsContainer(options = {}) {
        const controls = document.createElement("div");
        controls.className = options.className || "controls";
        
        // Default styling
        controls.style.marginTop = options.marginTop || "10px";
        
        if (options.style) {
            Object.assign(controls.style, options.style);
        }
        
        // Create standard buttons
        const buttons = this.createStandardButtons(options.buttons || {});
        buttons.forEach(button => controls.appendChild(button));
        
        return controls;
    }

    /**
     * Creates the standard set of circuit control buttons
     * @param {Object} buttonConfig - Configuration for which buttons to include
     * @returns {HTMLButtonElement[]}
     */
    static createStandardButtons(buttonConfig = {}) {
        const buttons = [];
        
        const defaultButtons = [
            { id: "addResistor", text: "Add Resistor", include: buttonConfig.addResistor !== false },
            { id: "addWire", text: "Add Wire", include: buttonConfig.addWire !== false },
            { id: "undoButton", text: "<", include: buttonConfig.undo !== false },
            { id: "redoButton", text: ">", include: buttonConfig.redo !== false },
            { id: "export", text: "Export circuit", include: true } // Always include export button
        ];
        
        defaultButtons.forEach(({ id, text, include }) => {
            if (include) {
                buttons.push(this.createButton(id, text));
            }
        });
        
        return buttons;
    }

    /**
     * Creates a complete circuit interface
     * @param {HTMLElement} container - Container element to append to
     * @param {Object} options - Configuration options
     * @returns {Object} - Object containing references to created elements
     */
    static createCircuitInterface(container, options = {}) {
        const controls = this.createControlsContainer(options.controls);
        const canvas = this.createCanvas(options.canvas);
        
        // Add title if specified
        if (options.title) {
            const title = document.createElement("h1");
            title.textContent = options.title;
            container.appendChild(title);
        }
        
        container.appendChild(controls);
        container.appendChild(canvas);
        
        return {
            controls,
            canvas,
            buttons: {
                addResistor: controls.querySelector("#addResistor"),
                addWire: controls.querySelector("#addWire"),
                undo: controls.querySelector("#undoButton"),
                redo: controls.querySelector("#redoButton"),
                export: controls.querySelector("#export")
            }
        };
    }

    /**
     * Applies standard CSS styles to the document
     */
    static applyStandardStyles() {
        const style = document.createElement("style");
        style.textContent = `
            canvas {
                border: 1px solid #ccc;
                margin-top: 20px;
            }
            .controls {
                margin-top: 10px;
            }
            .controls button {
                margin-right: 5px;
                padding: 5px 10px;
                cursor: pointer;
            }
        `;
        document.head.appendChild(style);
    }
}
