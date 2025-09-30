import { ImageRenderer } from "./ImageRenderer.js";

export class JunctionRenderer extends ImageRenderer {
    constructor(context) {
        super(context, "junction", 40, 40);
    }

    renderElement(junction) {
        if (!this.image && !this.imageLoading) {
            this.initImageIfNeeded();
        }

        const [start, end] = junction.nodes;
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;

        // Calculate the angle of the junction based on the node positions
        const angle = Math.atan2(end.y - start.y, end.x - start.x);

        // Draw terminals first
        this.renderTerminal(start);
        this.renderTerminal(end);

        // Apply rotation based on the actual node orientation
        this.context.save();
        this.context.translate(midX, midY);
        this.context.rotate(angle);
        this.context.translate(-midX, -midY);

        if (!this.drawImage(midX, midY)) {
            this.renderFallback(junction, midX, midY);
        }

        // Restore rotation
        this.context.restore();

        // Draw connections
        this.renderConnections(start, end, midX, midY);

        // Render properties (label and/or value) using the new system
        this.renderProperties(junction, midX, midY, angle);
    }

    renderFallback(junction, midX, midY) {
        this.context.save();
        this.context.strokeStyle = '#000000';
        this.context.lineWidth = 2;

        const size = 12;
        this.context.beginPath();
        this.context.moveTo(midX - size, midY - size);
        this.context.lineTo(midX + size, midY + size);
        this.context.moveTo(midX + size, midY - size);
        this.context.lineTo(midX - size, midY + size);
        this.context.stroke();

        this.context.restore();
    }

    renderConnections(start, end, midX, midY) {
        this.context.save();
        this.context.strokeStyle = '#000000';
        this.context.lineWidth = 1;

        // Calculate the angle and connection points based on the actual node positions
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const halfWidth = 15; // Connection distance from center
        
        // Calculate connection points on the junction body edges
        const connectionStart = {
            x: midX - Math.cos(angle) * halfWidth,
            y: midY - Math.sin(angle) * halfWidth
        };
        
        const connectionEnd = {
            x: midX + Math.cos(angle) * halfWidth,
            y: midY + Math.sin(angle) * halfWidth
        };

        // Draw line from start node to junction body
        this.context.beginPath();
        this.context.moveTo(start.x, start.y);
        this.context.lineTo(connectionStart.x, connectionStart.y);
        this.context.stroke();

        // Draw line from junction body to end node
        this.context.beginPath();
        this.context.moveTo(connectionEnd.x, connectionEnd.y);
        this.context.lineTo(end.x, end.y);
        this.context.stroke();

        this.context.restore();
    }
}
