import { ElementRenderer } from './ElementRenderer.js';

export class WireRenderer extends ElementRenderer {
    constructor(context) {
        super(context);
        
        // Wire styling constants
        this.NORMAL_THICKNESS = 1;
        this.HOVER_THICKNESS = 3;
        this.NORMAL_COLOR = 'black';
        this.SELECTED_COLOR = '#007ACC'; // VS Code blue (same as selection boxes)
        this.HOVER_TOLERANCE = 5; // Pixels tolerance for hover detection
    }

    /**
     * Render element with hover and selection states
     */
    renderElementWithStates(wire, isHovered, isSelected) {
        const [start, end] = wire.nodes;

        // Draw terminals (always black)
        this.renderTerminal(start);
        this.renderTerminal(end);

        // Determine wire styling based on states
        let lineWidth = this.NORMAL_THICKNESS;
        let strokeColor = this.NORMAL_COLOR;

        if (isHovered) {
            lineWidth = this.HOVER_THICKNESS;
        }
        
        if (isSelected) {
            strokeColor = this.SELECTED_COLOR;
        }

        // Draw the wire with appropriate styling
        this.context.strokeStyle = strokeColor;
        this.context.lineWidth = lineWidth;
        this.context.beginPath();
        this.context.moveTo(start.x, start.y);
        this.context.lineTo(end.x, end.y);
        this.context.stroke();
    }

    /**
     * Check if mouse position is hovering over the wire
     */
    checkHover(wire, mouseX, mouseY) {
        const [start, end] = wire.nodes;
        
        // Calculate distance from point to line segment
        const distance = this.distanceToLineSegment(
            mouseX, mouseY,
            start.x, start.y,
            end.x, end.y
        );
        
        return distance <= this.HOVER_TOLERANCE;
    }

    /**
     * Calculate distance from a point to a line segment
     */
    distanceToLineSegment(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length === 0) {
            // Line segment is actually a point
            return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
        }
        
        // Calculate the t parameter for the closest point on the line
        const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (length * length)));
        
        // Find the closest point on the line segment
        const closestX = x1 + t * dx;
        const closestY = y1 + t * dy;
        
        // Return distance from point to closest point on segment
        return Math.sqrt((px - closestX) * (px - closestX) + (py - closestY) * (py - closestY));
    }

    /**
     * Fallback render method (for compatibility)
     */
    renderElement(wire) {
        this.renderElementWithStates(wire, false, false);
    }
}
