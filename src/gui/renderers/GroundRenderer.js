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
        
        // Special selection border positioning for ground
        if (this.isSelected) {
            const borderWidth = this.SELECTION_BORDER_WIDTH;
            const padding = this.GROUND_NODE_PADDING;
            
            // For ground: selection box should include connection node + ground image
            // The connection node is at the right end of the ground symbol
            // The image center is offset leftward from the node
            const imageLeft = -drawWidth / 2; // Left edge of the PNG image (relative to image center)
            const imageRight = drawWidth / 2; // Right edge of the PNG image (relative to image center)
            const nodeToImageCenter = drawWidth / 2; // Distance from node to image center
            
            // Selection box should extend from the left edge of image to the connection node
            const selectionLeft = imageLeft - padding;
            const selectionRight = imageRight + nodeToImageCenter + padding; // Include connection node
            const selectionWidth = selectionRight - selectionLeft;
            
            const borderX = selectionLeft;
            const borderY = -drawHeight / 2 - padding;
            const borderWidthTotal = selectionWidth;
            const borderHeightTotal = drawHeight + (padding * 2);
            
            this.context.strokeStyle = this.SELECTION_BORDER_COLOR;
            this.context.lineWidth = borderWidth;
            this.context.setLineDash([]);
            this.context.strokeRect(borderX, borderY, borderWidthTotal, borderHeightTotal);
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

    // Override isPointInBounds for ground specific positioning
    isPointInBounds(mouseX, mouseY, elementMidX, elementMidY) {
        // The elementMidX, elementMidY represents the connection node position (at right end)
        // The ground image center is offset leftward from the node
        const nodeX = elementMidX;
        const nodeY = elementMidY;
        const imageX = nodeX - (this.SCALED_WIDTH / 2); // Image center is offset left from node
        const imageY = nodeY; // Image center Y aligns with node Y
        
        const selectionPadding = 20; // 15 pixels padding on all sides
        const halfWidth = this.SCALED_WIDTH / 2 + selectionPadding;
        const halfHeight = this.SCALED_HEIGHT / 2 + selectionPadding;
        
        // Expanded selection bounds with padding around the entire ground element
        const inExpandedBounds = (
            mouseX >= imageX - halfWidth &&
            mouseX <= imageX + halfWidth &&
            mouseY >= imageY - halfHeight &&
            mouseY <= imageY + halfHeight
        );
        
        // Also include a larger area around the connection node (increased from 5 to 10 pixels)
        const nodeRadius = 10;
        const inNodeBounds = (
            mouseX >= nodeX - nodeRadius &&
            mouseX <= nodeX + nodeRadius &&
            mouseY >= nodeY - nodeRadius &&
            mouseY <= nodeY + nodeRadius
        );
        
        return inExpandedBounds || inNodeBounds;
    }
}
