import { ElementRenderer } from "./ElementRenderer.js";
import { getImagePath } from '../../utils/getImagePath.js';

export class InductorRenderer extends ElementRenderer {
    constructor(context) {
        super(context);
        this.image = null;
        this.imageLoaded = false;
        this.imageLoading = false;

        // Define proper dimensions for the inductor image (coil needs more width)
        this.SCALED_WIDTH = 60;  // Increased from 50 to show full coil
        this.SCALED_HEIGHT = 25; // Slightly increased from 20
    }

    async initImageIfNeeded() {
        if (this.image || this.imageLoading) return;

        this.imageLoading = true;
        try {
            // Only create Image if we're in a browser environment
            if (typeof Image !== 'undefined') {
                this.image = new Image();
                this.image.onload = () => {
                    this.imageLoaded = true;
                    // Trigger a re-render when the image loads
                    if (this.context && this.context.canvas) {
                        const event = new CustomEvent('renderer:imageLoaded', { detail: { type: 'inductor' } });
                        document.dispatchEvent(event);
                    }
                };

                const imagePath = await getImagePath("inductor");
                this.image.src = imagePath;
            }
        } catch (error) {
            console.warn('Error loading inductor image:', error);
        } finally {
            this.imageLoading = false;
        }
    }

    async init() {
        await this.initImageIfNeeded();
    }

    renderElement(inductor) {
        // Try to initialize image if needed (don't await, let it load in background)
        if (!this.image && !this.imageLoading) {
            this.initImageIfNeeded(); // Fire and forget
        }

        const [start, end] = inductor.nodes;
        // Compute midpoint between snapped nodes
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;

        // Draw terminals (using the base method from ElementRenderer)
        this.renderTerminal(start);
        this.renderTerminal(end);

        // Draw the inductor representation
        if (this.imageLoaded && this.image) {
            // Draw the inductor image centered on the midpoint
            this.context.drawImage(
                this.image,
                midX - this.SCALED_WIDTH / 2,
                midY - this.SCALED_HEIGHT / 2,
                this.SCALED_WIDTH,
                this.SCALED_HEIGHT,
            );
        } else if (!this.imageLoading) {
            // Fallback: Draw inductor symbol (spiral coil)
            this.renderFallback(inductor, midX, midY);
        }

        // Draw connecting lines from terminals to inductor body
        this.renderConnections(start, end, midX, midY);

        // Render label if present
        if (inductor.label && inductor.label.text) {
            this.renderLabel(inductor.label.text, midX, midY + 30);
        }
    }

    renderFallback(inductor, midX, midY) {
        // Inductor symbol: spiral coil
        this.context.save();
        this.context.strokeStyle = '#000000';
        this.context.lineWidth = 2;

        // Draw simplified coil representation
        const coilWidth = 20;
        const coilHeight = 8;
        
        // Draw series of arcs to represent coil
        for (let i = 0; i < 3; i++) {
            const x = midX - coilWidth/2 + (i * coilWidth/3);
            this.context.beginPath();
            this.context.arc(x, midY, coilHeight/2, 0, Math.PI, false);
            this.context.stroke();
        }

        this.context.restore();
    }

    renderConnections(start, end, midX, midY) {
        this.context.save();
        this.context.strokeStyle = '#000000';
        this.context.lineWidth = 1;

        // Draw line from start to inductor body (adjusted for wider inductor)
        this.context.beginPath();
        this.context.moveTo(start.x, start.y);
        this.context.lineTo(midX - 30, midY); // Adjusted from -20 to -30
        this.context.stroke();

        // Draw line from inductor body to end (adjusted for wider inductor)
        this.context.beginPath();
        this.context.moveTo(midX + 30, midY); // Adjusted from +20 to +30
        this.context.lineTo(end.x, end.y);
        this.context.stroke();

        this.context.restore();
    }
}
