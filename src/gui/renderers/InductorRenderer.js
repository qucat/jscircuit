import { ImageRenderer } from "./ImageRenderer.js";
import { GRID_CONFIG } from "../../config/gridConfig.js";

export class InductorRenderer extends ImageRenderer {
    constructor(context) {
        // Use grid config for component dimensions
        // Width: 5 grid points = 50 pixels, Height: 2.5 grid points = 25 pixels
        const width = GRID_CONFIG.componentSpanPixels; // 50 pixels (5 grid points)
        const height = GRID_CONFIG.spacing * 2.5; // 25 pixels (2.5 grid points)
        super(context, "inductor", width, height);
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

        // Draw connections with constrained length to fit within 5 grid points
        this.renderConstrainedConnections(start, end, midX, midY);

        // Render properties (label and/or value) using the new system
        this.renderProperties(inductor, midX, midY, angle);
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

    renderConstrainedConnections(start, end, midX, midY) {
        this.context.save();
        this.context.strokeStyle = '#000000';
        this.context.lineWidth = 1;

        // Calculate the angle and constrain connection length to fit within component bounds
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        
        // Use half the component width minus a small margin to stay within bounds
        const maxConnectionLength = (this.SCALED_WIDTH / 2) - 5; // 5 pixel margin
        
        // Calculate connection points on the inductor body edges
        const connectionStart = {
            x: midX - Math.cos(angle) * maxConnectionLength,
            y: midY - Math.sin(angle) * maxConnectionLength
        };
        
        const connectionEnd = {
            x: midX + Math.cos(angle) * maxConnectionLength,
            y: midY + Math.sin(angle) * maxConnectionLength
        };

        // Only draw connection lines if the nodes are far enough from the center
        const startDistance = Math.sqrt((start.x - midX) ** 2 + (start.y - midY) ** 2);
        const endDistance = Math.sqrt((end.x - midX) ** 2 + (end.y - midY) ** 2);

        // Draw line from start node to inductor body only if needed
        if (startDistance > maxConnectionLength) {
            this.context.beginPath();
            this.context.moveTo(start.x, start.y);
            this.context.lineTo(connectionStart.x, connectionStart.y);
            this.context.stroke();
        }

        // Draw line from inductor body to end node only if needed
        if (endDistance > maxConnectionLength) {
            this.context.beginPath();
            this.context.moveTo(connectionEnd.x, connectionEnd.y);
            this.context.lineTo(end.x, end.y);
            this.context.stroke();
        }

        this.context.restore();
    }
}
