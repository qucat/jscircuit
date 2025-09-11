import { ElementRenderer } from "./ElementRenderer.js";
import { getImagePath } from '../../utils/getImagePath.js';

export class JunctionRenderer extends ElementRenderer {
    constructor(context) {
        super(context);
        this.image = null;
        this.imageLoaded = false;
        this.imageLoading = false;

        // Define proper dimensions for the junction image (should be square for circular junction)
        this.SCALED_WIDTH = 30;  // Reduced and made square
        this.SCALED_HEIGHT = 30; // Same as width for circular appearance
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
                        const event = new CustomEvent('renderer:imageLoaded', { detail: { type: 'junction' } });
                        document.dispatchEvent(event);
                    }
                };

                const imagePath = await getImagePath("junction");
                this.image.src = imagePath;
            }
        } catch (error) {
            console.warn('Error loading junction image:', error);
        } finally {
            this.imageLoading = false;
        }
    }

    async init() {
        await this.initImageIfNeeded();
    }

    renderElement(junction) {
        // Try to initialize image if needed (don't await, let it load in background)
        if (!this.image && !this.imageLoading) {
            this.initImageIfNeeded(); // Fire and forget
        }

        const [start, end] = junction.nodes;
        // Compute midpoint between snapped nodes
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;

        // Draw terminals (using the base method from ElementRenderer)
        this.renderTerminal(start);
        this.renderTerminal(end);

        // Draw the junction representation
        if (this.imageLoaded && this.image) {
            // Draw the junction image centered on the midpoint
            this.context.drawImage(
                this.image,
                midX - this.SCALED_WIDTH / 2,
                midY - this.SCALED_HEIGHT / 2,
                this.SCALED_WIDTH,
                this.SCALED_HEIGHT,
            );
        } else if (!this.imageLoading) {
            // Fallback: Draw junction symbol (solid circle)
            this.renderFallback(junction, midX, midY);
        }

        // Draw connecting lines from terminals to junction body
        this.renderConnections(start, end, midX, midY);

        // Render label if present
        if (junction.label && junction.label.text) {
            this.renderLabel(junction.label.text, midX, midY + 30);
        }
    }

    renderFallback(junction, midX, midY) {
        // Junction symbol: solid circle at connection point
        this.context.save();
        this.context.fillStyle = '#000000';
        
        // Draw solid circle
        this.context.beginPath();
        this.context.arc(midX, midY, 4, 0, Math.PI * 2);
        this.context.fill();

        this.context.restore();
    }

    renderConnections(start, end, midX, midY) {
        this.context.save();
        this.context.strokeStyle = '#000000';
        this.context.lineWidth = 1;

        // For junction, draw lines from terminals to junction body edges (adjusted for smaller size)
        this.context.beginPath();
        this.context.moveTo(start.x, start.y);
        this.context.lineTo(midX - 15, midY); // Adjusted from center to edge
        this.context.stroke();

        this.context.beginPath();
        this.context.moveTo(midX + 15, midY); // Adjusted from center to edge
        this.context.lineTo(end.x, end.y);
        this.context.stroke();

        this.context.restore();
    }
}
