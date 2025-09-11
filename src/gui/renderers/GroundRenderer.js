import { ElementRenderer } from "./ElementRenderer.js";
import { getImagePath } from '../../utils/getImagePath.js';

export class GroundRenderer extends ElementRenderer {
    constructor(context) {
        super(context);
        this.image = null;
        this.imageLoaded = false;
        this.imageLoading = false;

        // Define proper dimensions for the ground image
        this.SCALED_WIDTH = 40;  // Reduced from 50
        this.SCALED_HEIGHT = 30; // Increased from 20
    }

    async initImageIfNeeded() {
        if (this.image || this.imageLoading) return;

        this.imageLoading = true;
        try {
            // Only create Image if we're in a browser environment
            if (typeof Image !== 'undefined') {
                this.image = new Image();
                this.image.onload = () => {
                    this.imageLoaded = true;
                    // Trigger a re-render when the image loads
                    if (this.context && this.context.canvas) {
                        const event = new CustomEvent('renderer:imageLoaded', { detail: { type: 'ground' } });
                        document.dispatchEvent(event);
                    }
                };

                const imagePath = await getImagePath("ground");
                this.image.src = imagePath;
            }
        } catch (error) {
            console.warn('Error loading ground image:', error);
        } finally {
            this.imageLoading = false;
        }
    }

    async init() {
        await this.initImageIfNeeded();
    }

    renderElement(ground) {
        // Try to initialize image if needed (don't await, let it load in background)
        if (!this.image && !this.imageLoading) {
            this.initImageIfNeeded(); // Fire and forget
        }

        // Ground should have only one node (connection point)
        const connectionNode = ground.nodes[0];
        
        // Position ground symbol below the connection point
        const groundX = connectionNode.x;
        const groundY = connectionNode.y + 30; // Reduced offset for better alignment

        // Draw only the connection terminal
        this.renderTerminal(connectionNode);

        // Draw the ground representation
        if (this.imageLoaded && this.image) {
            // Save context for rotation
            this.context.save();
            
            // Translate to the ground position (center it with the stroke)
            this.context.translate(groundX, groundY);
            
            // Rotate 270 degrees (3π/2 radians) - This is 90° clockwise + 180° = 270° total
            // This orients the ground symbol so its connection point faces upward
            // Canvas rotation: 90° clockwise puts it horizontal, then +180° flips it
            // so the connection line/stick of the ground symbol points up toward our stroke
            this.context.rotate(3 * Math.PI / 2);
            
            // Draw the ground image centered at the rotated coordinate system
            // The image is drawn from (-width/2, -height/2) to (width/2, height/2)
            // which centers it at the current origin (which is now at groundX, groundY)
            this.context.drawImage(
                this.image,
                -this.SCALED_WIDTH / 2,
                -this.SCALED_HEIGHT / 2,
                this.SCALED_WIDTH,
                this.SCALED_HEIGHT,
            );
            
            this.context.restore();
            
            // Draw connecting line from terminal to ground symbol
            this.renderConnections(connectionNode, groundX, groundY);
        } else {
            // Fallback: Draw ground symbol vertically (pointing down) 
            this.renderFallback(ground, groundX, groundY);
            
            // Draw connecting line from terminal to ground symbol
            this.renderConnections(connectionNode, groundX, groundY - 5);
        }

        // Render label if present
        if (ground.label && ground.label.text) {
            this.renderLabel(ground.label.text, groundX, groundY + 30);
        }
    }

    renderFallback(ground, groundX, groundY) {
        // Ground symbol: series of horizontal lines getting shorter (pointing down)
        this.context.save();
        this.context.strokeStyle = '#000000';
        this.context.lineWidth = 2;

        // Draw ground symbol (three horizontal lines getting shorter, vertically oriented)
        const lineWidths = [20, 14, 8]; // Made lines a bit wider for better visibility
        for (let i = 0; i < lineWidths.length; i++) {
            const y = groundY + (i * 4); // Vertical spacing between lines
            const width = lineWidths[i];
            
            this.context.beginPath();
            this.context.moveTo(groundX - width/2, y);
            this.context.lineTo(groundX + width/2, y);
            this.context.stroke();
        }

        this.context.restore();
    }

    renderConnections(connectionNode, groundX, groundY) {
        this.context.save();
        this.context.strokeStyle = '#000000';
        this.context.lineWidth = 2;

        // Draw line from connection point to top of ground symbol (not center)
        // Ground symbol height is ~30px, so connect to about 15px above center
        const strokeEndY = groundY - 15;
        
        this.context.beginPath();
        this.context.moveTo(connectionNode.x, connectionNode.y);
        this.context.lineTo(groundX, strokeEndY);
        this.context.stroke();

        this.context.restore();
    }
}
