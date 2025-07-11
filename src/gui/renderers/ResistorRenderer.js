// gui/renderers/ResistorRenderer.js

import { ElementRenderer } from './ElementRenderer.js';

/**
 * Renderer for resistor components
 */
export class ResistorRenderer extends ElementRenderer {
    constructor(context) {
        super(context);
        this.initializeImageAssets("resistor");
    }

    /**
     * Render a resistor element
     * @param {Object} element - The resistor element to render
     * @param {Object} state - Current element state (hover, selected, etc.)
     */
    render(element, state = {}) {
        if (!this.isImageLoaded()) {
            return; // Wait for images to load
        }

        const image = this.getCurrentImage(state);
        if (!image) {
            return;
        }

        const ctx = this.context;
        const x = element.position.x;
        const y = element.position.y;
        
        // Draw the resistor image
        ctx.drawImage(image, x, y);
        
        // Draw the resistor label if present
        if (element.id) {
            ctx.fillStyle = 'black';
            ctx.font = '12px Arial';
            ctx.fillText(element.id, x, y - 5);
        }
    }
}