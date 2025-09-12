import { ImageRenderer } from "./ImageRenderer.js";

export class JunctionRenderer extends ImageRenderer {
    constructor(context) {
        super(context, "junction", 30, 30);
    }

    renderElement(junction) {
        if (!this.image && !this.imageLoading) {
            this.initImageIfNeeded();
        }

        const [start, end] = junction.nodes;
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;

        this.renderTerminal(start);
        this.renderTerminal(end);

        if (!this.drawImage(midX, midY)) {
            this.renderFallback(junction, midX, midY);
        }

        this.renderConnections(start, end, midX, midY);

        if (junction.label && junction.label.text) {
            this.renderLabel(junction.label.text, midX, midY + 30);
        }
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

        this.context.beginPath();
        this.context.moveTo(start.x, start.y);
        this.context.lineTo(midX - 15, midY);
        this.context.stroke();

        this.context.beginPath();
        this.context.moveTo(midX + 15, midY);
        this.context.lineTo(end.x, end.y);
        this.context.stroke();

        this.context.restore();
    }
}
