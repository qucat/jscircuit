import { ImageRenderer } from "./ImageRenderer.js";

export class ResistorRenderer extends ImageRenderer {
    constructor(context) {
        super(context, "resistor", 50, 20);
    }

    renderElement(resistor) {
        // Try to initialize image if needed (don't await, let it load in background)
        if (!this.image && !this.imageLoading) {
            this.initImageIfNeeded(); // Fire and forget
        }

        const [start, end] = resistor.nodes;
        // Compute midpoint between snapped nodes
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;

        // Draw terminals (using the base method from ElementRenderer)
        this.renderTerminal(start);
        this.renderTerminal(end);

        // Draw the resistor representation using the image renderer
        if (!this.drawImage(midX, midY)) {
            // Fallback: draw a simple rectangle representation
            this.renderFallback(resistor, midX, midY);
        }

        // Draw connecting lines from terminals to resistor body
        this.renderConnections(start, end, midX, midY);

        // Optionally, draw a label below the resistor.
        if (resistor.label) {
            this.renderLabel(resistor.label.text, midX, midY + 25);
        }
    }

    renderFallback(resistor, midX, midY) {
        // Fallback: draw a simple rectangle representation
        this.context.save();
        this.context.strokeStyle = '#8B4513'; // Brown color for resistor
        this.context.fillStyle = '#D2B48C';   // Light brown fill
        this.context.lineWidth = 2;
        
        const rectX = midX - this.SCALED_WIDTH / 2;
        const rectY = midY - this.SCALED_HEIGHT / 2;
        
        this.context.fillRect(rectX, rectY, this.SCALED_WIDTH, this.SCALED_HEIGHT);
        this.context.strokeRect(rectX, rectY, this.SCALED_WIDTH, this.SCALED_HEIGHT);
        
        this.context.restore();
    }

    renderConnections(start, end, midX, midY) {
        this.context.save();
        this.context.strokeStyle = '#000000';
        this.context.lineWidth = 1;

        // Draw line from start to resistor body
        this.context.beginPath();
        this.context.moveTo(start.x, start.y);
        this.context.lineTo(midX - this.SCALED_WIDTH/2, midY);
        this.context.stroke();

        // Draw line from resistor body to end
        this.context.beginPath();
        this.context.moveTo(midX + this.SCALED_WIDTH/2, midY);
        this.context.lineTo(end.x, end.y);
        this.context.stroke();

        this.context.restore();
    }
}
