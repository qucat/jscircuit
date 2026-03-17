import { ImageRenderer } from "./ImageRenderer.js";

export class GroundRenderer extends ImageRenderer {
    constructor(context) {
        super(context, "ground", 40, 30);
        this.GROUND_NODE_PADDING = 0; // Padding between node and bottom of ground image
    }

    /**
     * Override drawImage to provide special selection positioning for ground
     */
    drawImage(x, y, rotation = 0) {
        const currentImage = this.getCurrentImage();
        if (!this.isImageReady() || !currentImage) return false;

        // Maintain aspect ratio and center the image
        const aspectRatio = currentImage.naturalWidth / currentImage.naturalHeight;
        let drawWidth, drawHeight;
        
        if (aspectRatio > 1) {
            // Image is wider than tall
            drawWidth = this.SCALED_WIDTH;
            drawHeight = this.SCALED_WIDTH / aspectRatio;
        } else {
            // Image is taller than wide or square
            drawHeight = this.SCALED_HEIGHT;
            drawWidth = this.SCALED_HEIGHT * aspectRatio;
        }

        this.context.save();
        this.context.translate(x, y);
        if (rotation !== 0) {
            this.context.rotate(rotation);
        }
        
        // Selection border that includes both the image AND the connection node (dot).
        // In this local frame (translated to image center), the connection node
        // sits at (+SCALED_WIDTH/2, 0) — i.e. to the RIGHT of image center.
        // We draw a box from the image left edge to past the node.
        if (this.isSelected) {
            const nodeOffset = this.SCALED_WIDTH / 2; // distance from image center to node
            const pad = 4;
            // The ground symbol content spans from the node (+nodeOffset) to
            // roughly the image center (x ≈ 0).  Beyond that is transparent PNG
            // whitespace.  Keep the far-side gap proportional to the node-side
            // gap (both ≈ pad) so the box hugs the visible icon evenly.
            const boxLeft  = -(drawWidth * 0.01) - pad;   // trim far-side whitespace
            const boxRight =  nodeOffset + pad;
            const boxTop   = -drawHeight / 2 - pad;
            const boxBot   =  drawHeight / 2 + pad;
            this.context.strokeStyle = this.SELECTION_BORDER_COLOR;
            this.context.lineWidth = this.SELECTION_BORDER_WIDTH;
            this.context.setLineDash([]);
            this.context.strokeRect(boxLeft, boxTop, boxRight - boxLeft, boxBot - boxTop);
        }
        
        // Draw the main image
        this.context.drawImage(
            currentImage,
            -drawWidth / 2,
            -drawHeight / 2,
            drawWidth,
            drawHeight
        );
        this.context.restore();
        
        return true;
    }

    renderElement(ground) {
        if (!this.image && !this.imageLoading) {
            this.initImageIfNeeded();
        }

        const [connectionNode] = ground.nodes;
        
        // Position the image so the connection node is at the RIGHT END of the ground image
        // and aligned with the CENTER POINT of the image (using original position as reference)
        // The connection node should be at the right edge, vertically centered
        const groundX = connectionNode.x - (this.SCALED_WIDTH / 2); // Move image left so node is at right edge
        const groundY = connectionNode.y; // Node Y aligns with image center Y

        // Calculate rotation angle based on element orientation
        const orientation = ground.properties.values.orientation || 0;
        const orientationRad = (orientation * Math.PI) / 180;

        // Apply rotation around the connection node (the reference point)
        this.context.save();
        this.context.translate(connectionNode.x, connectionNode.y);
        this.context.rotate(orientationRad);
        this.context.translate(-connectionNode.x, -connectionNode.y);

        // Draw the ground symbol with node at the right end, center-aligned
        if (!this.drawImage(groundX, groundY)) {
            this.renderFallback(ground, connectionNode.x, connectionNode.y);
        }

        // Restore rotation
        this.context.restore();

        // Draw the connection node at the exact connection point
        this.renderTerminal(connectionNode);

        // Ground components don't need labeling, so we skip renderProperties
    }

    renderFallback(ground, nodeX, nodeY) {
        this.context.save();
        this.context.strokeStyle = '#000000';
        this.context.lineWidth = 2;

        // Draw the ground symbol with the connection node at the RIGHT END, center-aligned
        // The node is at (nodeX, nodeY) - this is at the right edge of the ground symbol
        
        // Draw horizontal line from the connection node leftward to the ground symbol
        const connectionLineLength = 15; // Length of the connection line from node to ground
        
        this.context.beginPath();
        this.context.moveTo(nodeX, nodeY); // Start at the connection node (right end)
        this.context.lineTo(nodeX - connectionLineLength, nodeY); // Draw left to ground symbol
        this.context.stroke();

        // Draw vertical ground lines extending downward from the end of the connection line
        // The ground lines should be centered vertically around the connection node
        const lineWidths = [20, 12, 6];
        const startX = nodeX - connectionLineLength; // Where the connection line ends
        
        for (let i = 0; i < lineWidths.length; i++) {
            const x = startX - (i * 3); // Move ground lines further left
            const halfHeight = lineWidths[i] / 2;
            this.context.beginPath();
            this.context.moveTo(x, nodeY - halfHeight); // Draw upward from center
            this.context.lineTo(x, nodeY + halfHeight); // Draw downward from center
            this.context.stroke();
        }

        this.context.restore();
    }

    renderConnections(connectionNode, groundX, groundY) {
        // No connection lines needed - the node is placed directly at the connection point
        // This method is kept for compatibility but does nothing
    }

    /**
     * Rotation-aware hit-test for ground elements.
     *
     * The ground image is anchored at the connection node (nodes[0]).
     * At 0° the image center sits SCALED_WIDTH/2 to the LEFT of the anchor.
     * We inverse-rotate the mouse into local frame so a single axis-aligned
     * bounding box works at every orientation.
     *
     * @param {number} mouseX
     * @param {number} mouseY
     * @param {number} midX   - midpoint fallback
     * @param {number} midY   - midpoint fallback
     * @param {Object} [element] - the ground element (for orientation + nodes)
     */
    isPointInBounds(mouseX, mouseY, midX, midY, element) {
        // Anchor = connection node (nodes[0]).
        const anchorX = element?.nodes?.[0]?.x ?? midX;
        const anchorY = element?.nodes?.[0]?.y ?? midY;

        const orientation = element?.properties?.values?.orientation || 0;
        const rad = -(orientation * Math.PI) / 180; // inverse rotation

        // Rotate mouse into local frame (anchor = connection node at origin)
        const dx = mouseX - anchorX;
        const dy = mouseY - anchorY;
        const localX = dx * Math.cos(rad) - dy * Math.sin(rad);
        const localY = dx * Math.sin(rad) + dy * Math.cos(rad);

        // In local frame, the image center is at (-SCALED_WIDTH/2, 0).
        // Match the visual selection box: from image left to the node.
        const pad = 8;
        const left   = -this.SCALED_WIDTH - pad;           // image far-left
        const right  =  pad;                                // just past the node
        const top    = -(this.SCALED_HEIGHT / 2) - pad;
        const bottom =  (this.SCALED_HEIGHT / 2) + pad;

        return localX >= left && localX <= right &&
               localY >= top  && localY <= bottom;
    }
}
