import { ElementRenderer } from './ElementRenderer.js';

/**
 * MyInductorRenderer - Renders MyInductor elements on canvas
 * 
 * Keep it simple: Just draw lines representing the element
 */
export class MyInductorRenderer extends ElementRenderer {
  /**
   * Renders the inductor on the canvas
   * 
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {MyInductor} element - The element to render
   * @param {boolean} isSelected - Whether element is selected
   * @param {boolean} isHovered - Whether element is hovered
   */
  render(ctx, element, isSelected, isHovered) {
    // Change color based on selection state
    ctx.strokeStyle = isSelected ? '#e74c3c' : '#3498db';
    ctx.lineWidth = isSelected ? 3 : 2;
    
    // Draw a simple line between the two nodes
    const [start, end] = element.nodes;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    
    // Draw label if present
    if (element.label) {
      ctx.fillStyle = '#2c3e50';
      ctx.font = '12px Arial';
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      ctx.fillText(element.label.value, midX, midY - 10);
    }
  }
}
