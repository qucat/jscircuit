import { ImageRenderer } from "./ImageRenderer.js";
import { GRID_CONFIG } from "../../config/gridConfig.js";

export class ResistorRenderer extends ImageRenderer {
    constructor(context) {
        // Use grid config for component dimensions
        // Width: 5 grid points = 50 pixels, Height: 2 grid points = 20 pixels
        const width = GRID_CONFIG.componentSpanPixels;   // 50 pixels (5 grid points)
        const height = GRID_CONFIG.componentHeightPixels; // 20 pixels (2 grid points)
        super(context, "resistor", width, height);
    }

    renderElement(resistor) {
        // Try to initialize image if needed (don't await, let it load in background)
        if (!this.image && !this.imageLoading) {
            this.initImageIfNeeded(); // Fire and forget
        }

        const [start, end] = resistor.nodes;
        // Compute midpoint between nodes
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;

        // Calculate the angle of the resistor based on the node positions
        const angle = Math.atan2(end.y - start.y, end.x - start.x);

        // Draw terminals first
        this.renderTerminal(start);
        this.renderTerminal(end);

        // Apply rotation based on the actual node orientation
        this.context.save();
        this.context.translate(midX, midY);
        this.context.rotate(angle);
        this.context.translate(-midX, -midY);

        // Draw the resistor representation using the image renderer
        if (!this.drawImage(midX, midY)) {
            // Fallback: draw a simple rectangle representation
            this.renderFallback(resistor, midX, midY);
        }

        // Restore rotation
        this.context.restore();

        // Draw connecting lines from terminals to resistor body
        this.renderConnections(start, end, midX, midY);

        // Render properties (label and/or value) using the new system
        this.renderProperties(resistor, midX, midY, angle);
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

        // Calculate the angle and connection points based on the actual node positions
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const halfWidth = this.SCALED_WIDTH / 2;
        
        // Calculate connection points on the resistor body edges
        const connectionStart = {
            x: midX - Math.cos(angle) * halfWidth,
            y: midY - Math.sin(angle) * halfWidth
        };
        
        const connectionEnd = {
            x: midX + Math.cos(angle) * halfWidth,
            y: midY + Math.sin(angle) * halfWidth
        };

        // Draw line from start node to resistor body
        this.context.beginPath();
        this.context.moveTo(start.x, start.y);
        this.context.lineTo(connectionStart.x, connectionStart.y);
        this.context.stroke();

        // Draw line from resistor body to end node
        this.context.beginPath();
        this.context.moveTo(connectionEnd.x, connectionEnd.y);
        this.context.lineTo(end.x, end.y);
        this.context.stroke();

        this.context.restore();
    }
}
