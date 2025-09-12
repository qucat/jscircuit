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

        this.renderTerminal(start);
        this.renderTerminal(end);

        if (!this.drawImage(midX, midY)) {
            this.renderFallback(inductor, midX, midY);
        }

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

        this.context.beginPath();
        this.context.moveTo(start.x, start.y);
        this.context.lineTo(midX - 30, midY);
        this.context.stroke();

        this.context.beginPath();
        this.context.moveTo(midX + 30, midY);
        this.context.lineTo(end.x, end.y);
        this.context.stroke();

        this.context.restore();
    }
}
