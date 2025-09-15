// ElementRenderer.js
export class ElementRenderer {
  constructor(context) {
    this.context = context;
    // Optional: show alignment guide markers (set to true to debug or visualize)
    this.showAlignmentGuide = false;
    // You can configure the guide color and size here:
    this.alignmentGuideColor = "red";
    this.alignmentGuideSize = 4; // pixels radius for the guide cross
  }

  /**
   * Renders a terminal as a small circle.
   * @param {Position} position - The terminal's position.
   */
  renderTerminal(position) {
    this.context.fillStyle = "black";
    this.context.beginPath();
    this.context.arc(position.x, position.y, 2, 0, Math.PI * 2);
    this.context.fill();

    if (this.showAlignmentGuide) {
      this.renderAlignmentGuide(position);
    }
  }

  /**
   * Renders a label at a given position.
   * @param {string} text - The label text.
   * @param {number} x - X-coordinate.
   * @param {number} y - Y-coordinate.
   */
  renderLabel(text, x, y) {
    this.context.fillStyle = "white";
    this.context.font = "12px Arial";
    this.context.textAlign = "center";
    this.context.fillText(text, x, y);
  }

  /**
   * Optional: Renders an alignment guide (e.g., a small cross) at a given position.
   * This can be used to visualize the grid intersections.
   * @param {Position} position - The position to mark.
   */
  renderAlignmentGuide(position) {
    const ctx = this.context;
    const size = this.alignmentGuideSize;
    ctx.save();
    ctx.strokeStyle = this.alignmentGuideColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(position.x - size, position.y);
    ctx.lineTo(position.x + size, position.y);
    ctx.moveTo(position.x, position.y - size);
    ctx.lineTo(position.x, position.y + size);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Get the rotation angle in radians from element properties.
   * @param {Object} element - The element with properties.
   * @returns {number} Rotation angle in radians.
   */
  getElementRotation(element) {
    const orientationDegrees = element.properties?.values?.orientation || 0;
    return (orientationDegrees * Math.PI) / 180;
  }

  /**
   * Apply element rotation to the canvas context.
   * This should be called before drawing, and must be paired with restoreRotation().
   * @param {Object} element - The element with rotation properties.
   * @param {number} centerX - Center X coordinate for rotation.
   * @param {number} centerY - Center Y coordinate for rotation.
   */
  applyRotation(element, centerX, centerY) {
    const rotation = this.getElementRotation(element);
    if (rotation !== 0) {
      this.context.save();
      this.context.translate(centerX, centerY);
      this.context.rotate(rotation);
      this.context.translate(-centerX, -centerY);
      return true; // Indicates rotation was applied
    }
    return false; // No rotation applied
  }

  /**
   * Restore canvas context after rotation.
   * Only call this if applyRotation() returned true.
   */
  restoreRotation() {
    this.context.restore();
  }

  /**
   * Abstract method for rendering an element.
   * @param {Object} element - The element to render.
   */
  renderElement(element) {
    throw new Error("renderElement() must be implemented in derived classes.");
  }
}
