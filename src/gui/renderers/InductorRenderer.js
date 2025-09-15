import { ImageRenderer } from "./ImageRenderer.js";

export class InductorRenderer extends ImageRenderer {
    constructor(context) {
        super(context, "inductor", 60, 25);
    }

    renderElement(inductor) {
        if (!this.image && !this.imageLoading) {
            this.initImageIfNeeded();
        }

        const [start, end] = inductor.nodes;
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;

        // Calculate the angle of the inductor based on the node positions
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
            this.renderFallback(inductor, midX, midY);
        }

        // Restore rotation
        this.context.restore();

        // Draw connections
        this.renderConnections(start, end, midX, midY);

        if (inductor.label && inductor.label.text) {
            this.renderLabel(inductor.label.text, midX, midY + 30);
        }
    }

    renderFallback(inductor, midX, midY) {
        this.context.save();
        this.context.strokeStyle = '#000000';
        this.context.lineWidth = 2;
        
        const coilWidth = 40;
        const coilHeight = 20;

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

        // Calculate the angle and connection points based on the actual node positions
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const halfWidth = 30; // Connection distance from center
        
        // Calculate connection points on the inductor body edges
        const connectionStart = {
            x: midX - Math.cos(angle) * halfWidth,
            y: midY - Math.sin(angle) * halfWidth
        };
        
        const connectionEnd = {
            x: midX + Math.cos(angle) * halfWidth,
            y: midY + Math.sin(angle) * halfWidth
        };

        // Draw line from start node to inductor body
        this.context.beginPath();
        this.context.moveTo(start.x, start.y);
        this.context.lineTo(connectionStart.x, connectionStart.y);
        this.context.stroke();

        // Draw line from inductor body to end node
        this.context.beginPath();
        this.context.moveTo(connectionEnd.x, connectionEnd.y);
        this.context.lineTo(end.x, end.y);
        this.context.stroke();

        this.context.restore();
    }
}
