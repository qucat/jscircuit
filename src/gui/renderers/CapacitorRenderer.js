import { ElementRenderer } from "./ElementRenderer.js";
import { getImagePath } from '../../utils/getImagePath.js';

export class CapacitorRenderer extends ElementRenderer {
    constructor(context) {
        super(context);
        this.image = null;
        this.imageLoaded = false;
        this.imageLoading = false;

        // Define proper dimensions for the capacitor image
        this.SCALED_WIDTH = 50;
        this.SCALED_HEIGHT = 20;
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
                        const event = new CustomEvent('renderer:imageLoaded', { detail: { type: 'capacitor' } });
                        document.dispatchEvent(event);
                    }
                };

                const imagePath = await getImagePath("capacitor");
                this.image.src = imagePath;
            }
        } catch (error) {
            console.warn('Error loading capacitor image:', error);
        } finally {
            this.imageLoading = false;
        }
    }

    async init() {
        await this.initImageIfNeeded();
    }

    renderElement(capacitor) {
        // Try to initialize image if needed (don't await, let it load in background)
        if (!this.image && !this.imageLoading) {
            this.initImageIfNeeded(); // Fire and forget
        }

        const [start, end] = capacitor.nodes;
        // Compute midpoint between snapped nodes
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;

        // Draw terminals (using the base method from ElementRenderer)
        this.renderTerminal(start);
        this.renderTerminal(end);

        // Draw the capacitor representation
        if (this.imageLoaded && this.image) {
            // Draw the capacitor image centered on the midpoint
            this.context.drawImage(
                this.image,
                midX - this.SCALED_WIDTH / 2,
                midY - this.SCALED_HEIGHT / 2,
                this.SCALED_WIDTH,
                this.SCALED_HEIGHT,
            );
        } else if (!this.imageLoading) {
            // Fallback: Draw capacitor symbol (two parallel lines)
            this.renderFallback(capacitor, midX, midY);
        }

        // Draw connecting lines from terminals to capacitor body
        this.renderConnections(start, end, midX, midY);

        // Render label if present
        if (capacitor.label && capacitor.label.text) {
            this.renderLabel(capacitor.label.text, midX, midY + 30);
        }
    }

    renderFallback(capacitor, midX, midY) {
        // Capacitor symbol: two parallel lines
        this.context.save();
        this.context.strokeStyle = '#000000';
        this.context.lineWidth = 2;

        // Calculate perpendicular direction for capacitor plates
        const [start, end] = capacitor.nodes;
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length > 0) {
            const perpX = -dy / length * 10; // 10 pixels plate length
            const perpY = dx / length * 10;

            // Draw first plate
            this.context.beginPath();
            this.context.moveTo(midX - 5 + perpX, midY - 5 + perpY);
            this.context.lineTo(midX - 5 - perpX, midY - 5 - perpY);
            this.context.stroke();

            // Draw second plate
            this.context.beginPath();
            this.context.moveTo(midX + 5 + perpX, midY + 5 + perpY);
            this.context.lineTo(midX + 5 - perpX, midY + 5 - perpY);
            this.context.stroke();
        }

        this.context.restore();
    }

    renderConnections(start, end, midX, midY) {
        this.context.save();
        this.context.strokeStyle = '#000000';
        this.context.lineWidth = 1;

        // Draw line from start to capacitor body
        this.context.beginPath();
        this.context.moveTo(start.x, start.y);
        this.context.lineTo(midX - 20, midY);
        this.context.stroke();

        // Draw line from capacitor body to end
        this.context.beginPath();
        this.context.moveTo(midX + 20, midY);
        this.context.lineTo(end.x, end.y);
        this.context.stroke();

        this.context.restore();
    }
}
