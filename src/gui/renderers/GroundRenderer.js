import { ImageRenderer } from "./ImageRenderer.js";

export class GroundRenderer extends ImageRenderer {
    constructor(context) {
        super(context, "ground", 40, 30);
    }

    renderElement(ground) {
        if (!this.image && !this.imageLoading) {
            this.initImageIfNeeded();
        }

        const [connectionNode] = ground.nodes;
        const groundX = connectionNode.x;
        const groundY = connectionNode.y + 30;

        this.renderTerminal(connectionNode);

        if (!this.drawImage(groundX, groundY, 3 * Math.PI / 2)) {
            this.renderFallback(ground, groundX, groundY);
        }

        this.renderConnections(connectionNode, groundX, groundY);

        if (ground.label && ground.label.text) {
            this.renderLabel(ground.label.text, groundX, groundY + 30);
        }
    }

    renderFallback(ground, groundX, groundY) {
        this.context.save();
        this.context.strokeStyle = '#000000';
        this.context.lineWidth = 2;

        const lineWidths = [20, 12, 6];
        for (let i = 0; i < lineWidths.length; i++) {
            const y = groundY + (i * 5);
            const halfWidth = lineWidths[i] / 2;
            this.context.beginPath();
            this.context.moveTo(groundX - halfWidth, y);
            this.context.lineTo(groundX + halfWidth, y);
            this.context.stroke();
        }

        this.context.restore();
    }

    renderConnections(connectionNode, groundX, groundY) {
        this.context.save();
        this.context.strokeStyle = '#000000';
        this.context.lineWidth = 2;

        const strokeEndY = groundY - 15;
        
        this.context.beginPath();
        this.context.moveTo(connectionNode.x, connectionNode.y);
        this.context.lineTo(groundX, strokeEndY);
        this.context.stroke();

        this.context.restore();
    }

    // Override isPointInBounds for ground specific positioning
    isPointInBounds(mouseX, mouseY, elementMidX, elementMidY) {
        const groundX = elementMidX;
        const groundY = elementMidY + 30;
        const halfWidth = this.SCALED_WIDTH / 2;
        const halfHeight = this.SCALED_HEIGHT / 2;
        
        return (
            mouseX >= groundX - halfWidth &&
            mouseX <= groundX + halfWidth &&
            mouseY >= groundY - halfHeight &&
            mouseY <= groundY + halfHeight
        );
    }
}
