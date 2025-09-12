import { ImageRenderer } from "./ImageRenderer.js";

export class CapacitorRenderer extends ImageRenderer {
    constructor(context) {
        super(context, "capacitor", 50, 20);
    }

    renderElement(capacitor) {
        if (!this.image && !this.imageLoading) {
            this.initImageIfNeeded();
        }

        const [start, end] = capacitor.nodes;
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;

        this.renderTerminal(start);
        this.renderTerminal(end);

        if (!this.drawImage(midX, midY)) {
            this.renderFallback(capacitor, midX, midY);
        }

        this.renderConnections(start, end, midX, midY);

        if (capacitor.label && capacitor.label.text) {
            this.renderLabel(capacitor.label.text, midX, midY + 30);
        }
    }

    renderFallback(capacitor, midX, midY) {
        this.context.save();
        this.context.strokeStyle = '#000000';
        this.context.lineWidth = 2;

        const [start, end] = capacitor.nodes;
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length > 0) {
            const perpX = -dy / length * 10;
            const perpY = dx / length * 10;

            this.context.beginPath();
            this.context.moveTo(midX - 5 + perpX, midY - 5 + perpY);
            this.context.lineTo(midX - 5 - perpX, midY - 5 - perpY);
            this.context.stroke();

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

        this.context.beginPath();
        this.context.moveTo(start.x, start.y);
        this.context.lineTo(midX - 20, midY);
        this.context.stroke();

        this.context.beginPath();
        this.context.moveTo(midX + 20, midY);
        this.context.lineTo(end.x, end.y);
        this.context.stroke();

        this.context.restore();
    }
}
