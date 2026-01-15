import { ElementRenderer } from '../../../src/gui/renderers/ElementRenderer.js';

/**
 * MyInductorRenderer - Renders MyInductor elements on canvas
 * 
 * Keep it simple: Just draw lines representing the element
 */
export class MyInductorRenderer extends ElementRenderer {
  /**
   * Renders the inductor element (required by framework)
   * 
   * @param {MyInductor} element - The element to render
   */
  renderElement(element) {
    const ctx = this.context;
    
    // Change color based on selection state (framework handles this via CircuitRenderer)
    ctx.strokeStyle = '#3498db'; // Default blue color
    ctx.lineWidth = 2;
    
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
