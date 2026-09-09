import { ImageRenderer } from "./ImageRenderer.js";
import { GRID_CONFIG } from "../../config/gridConfig.js";

export class NonLinearInductorRenderer extends ImageRenderer {
    constructor(context) {
        // Use grid config for component dimensions, same footprint as the (linear) inductor
        const width = GRID_CONFIG.componentSpanPixels;
        const height = GRID_CONFIG.spacing * 2.5;
        super(context, "nonlinearinductor", width, height);
    }

    renderElement(nonLinearInductor) {
        if (!this.image && !this.imageLoading) {
            this.initImageIfNeeded();
        }

        const [start, end] = nonLinearInductor.nodes;
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;

        // Calculate the angle based on the node positions.
        // node[0] is the "minus" node, node[1] is the "plus" node - this must
        // match the "+" polarity mark baked into the icon (drawn on the
        // "plus" side), since this element is polarized (unlike a plain inductor).
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
            this.renderFallback(nonLinearInductor, midX, midY);
        }

        // Restore rotation
        this.context.restore();

        // Draw connections with constrained length
        this.renderConstrainedConnections(start, end, midX, midY);

        // Render the (label-only) properties using this element's own display text
        this.renderNonLinearInductorProperties(nonLinearInductor, midX, midY, angle);
    }

    renderFallback(nonLinearInductor, midX, midY) {
        this.context.save();
        this.context.strokeStyle = '#000000';
        this.context.lineWidth = 2;

        const coilWidth = 40;
        const coilHeight = 20;

        for (let i = 0; i < 3; i++) {
            const x = midX - coilWidth / 2 + (i * coilWidth / 3);
            this.context.beginPath();
            this.context.arc(x, midY, coilHeight / 2, 0, Math.PI, false);
            this.context.stroke();
        }

        this.context.restore();
    }

    renderConstrainedConnections(start, end, midX, midY) {
        this.context.save();
        this.context.strokeStyle = '#000000';
        this.context.lineWidth = 1;

        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const maxConnectionLength = (this.SCALED_WIDTH / 2) - 5;

        const connectionStart = {
            x: midX - Math.cos(angle) * maxConnectionLength,
            y: midY - Math.sin(angle) * maxConnectionLength
        };

        const connectionEnd = {
            x: midX + Math.cos(angle) * maxConnectionLength,
            y: midY + Math.sin(angle) * maxConnectionLength
        };

        const startDistance = Math.sqrt((start.x - midX) ** 2 + (start.y - midY) ** 2);
        const endDistance = Math.sqrt((end.x - midX) ** 2 + (end.y - midY) ** 2);

        if (startDistance > maxConnectionLength) {
            this.context.beginPath();
            this.context.moveTo(start.x, start.y);
            this.context.lineTo(connectionStart.x, connectionStart.y);
            this.context.stroke();
        }

        if (endDistance > maxConnectionLength) {
            this.context.beginPath();
            this.context.moveTo(connectionEnd.x, connectionEnd.y);
            this.context.lineTo(end.x, end.y);
            this.context.stroke();
        }

        this.context.restore();
    }

    /**
     * A non-linear inductor has no single primary numeric property (it has up to
     * three independent labels for its 2nd/3rd/4th order terms), so it builds its
     * own display text instead of using ElementRenderer's generic single-value logic.
     */
    renderNonLinearInductorProperties(nonLinearInductor, centerX, centerY, angle) {
        const properties = nonLinearInductor.getProperties();
        if (!properties || !properties.values) return;

        const displayText = [properties.values.e2Label, properties.values.e3Label, properties.values.e4Label]
            .filter(label => label !== undefined && label !== null && label !== '')
            .join(',');

        if (!displayText) return;

        const { textX, textY, textAlign } = this.calculateTextPosition(centerX, centerY, angle);

        this.context.save();
        this.context.fillStyle = "black";
        this.context.font = "9px Arial";
        this.context.textAlign = textAlign;
        this.context.textBaseline = "middle";
        this.context.fillText(displayText, textX, textY);
        this.context.restore();
    }
}
