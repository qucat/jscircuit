// gui/renderers/JunctionRenderer.js

import { ElementRenderer } from './ElementRenderer.js';

/**
 * Renderer for junction components
 */
export class JunctionRenderer extends ElementRenderer {
    constructor(context) {
        super(context);
        this.initializeImageAssets("junction");
    }

    /**
     * Render a junction element
     * @param {Object} element - The junction element to render
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
        
        // Draw the junction image
        ctx.drawImage(image, x, y);
        
        // Draw the junction label if present
        if (element.id) {
            ctx.fillStyle = 'black';
            ctx.font = '12px Arial';
            ctx.fillText(element.id, x, y - 5);
        }
    }
}