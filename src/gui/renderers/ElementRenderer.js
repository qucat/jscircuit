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
   * Formats a component value with its unit for display
   * @param {string} propertyKey - The property key (e.g., 'resistance', 'capacitance')
   * @param {number} value - The numeric value
   * @returns {string} Formatted value with unit (e.g., "10 Ω", "1.5 μF")
   */
  formatValue(propertyKey, value) {
    if (value === undefined || value === null) return '';
    
    const formatters = {
      resistance: (val) => this.formatWithPrefix(val, 'Ω'),
      capacitance: (val) => this.formatWithPrefix(val, 'F'),
      inductance: (val) => this.formatWithPrefix(val, 'H'),
      critical_current: (val) => this.formatWithPrefix(val, 'A')
    };
    
    const formatter = formatters[propertyKey];
    return formatter ? formatter(value) : `${value}`;
  }

  /**
   * Formats a number with appropriate SI prefix and unit
   * @param {number} value - The numeric value
   * @param {string} unit - The base unit (e.g., 'Ω', 'F', 'H')
   * @returns {string} Formatted string with prefix and unit
   */
  formatWithPrefix(value, unit) {
    if (value === 0) return `0 ${unit}`;
    
    const prefixes = [
      { threshold: 1e9, symbol: 'G' },
      { threshold: 1e6, symbol: 'M' },
      { threshold: 1e3, symbol: 'k' },
      { threshold: 1, symbol: '' },
      { threshold: 1e-3, symbol: 'm' },
      { threshold: 1e-6, symbol: 'μ' },
      { threshold: 1e-9, symbol: 'n' },
      { threshold: 1e-12, symbol: 'p' },
      { threshold: 1e-15, symbol: 'f' }
    ];
    
    const absValue = Math.abs(value);
    for (const prefix of prefixes) {
      if (absValue >= prefix.threshold) {
        const scaledValue = value / prefix.threshold;
        const formattedValue = scaledValue % 1 === 0 ? scaledValue.toString() : scaledValue.toPrecision(3);
        return `${formattedValue} ${prefix.symbol}${unit}`;
      }
    }
    
    // For very small values, use scientific notation
    return `${value.toExponential(2)} ${unit}`;
  }

  /**
   * Renders element properties (label and/or value) below/beside the component
   * @param {Object} element - The element to render properties for
   * @param {number} centerX - Center X coordinate of the component
   * @param {number} centerY - Center Y coordinate of the component
   * @param {number} angle - Rotation angle in radians
   */
  renderProperties(element, centerX, centerY, angle = 0) {
    // Safety check: ensure element has required methods and properties
    if (!element || typeof element.getProperties !== 'function') {
      return; // Skip property rendering for invalid elements
    }

    const label = element.label ? element.label.value || element.label : null;
    const properties = element.getProperties();
    
    // Safety check for properties
    if (!properties || !properties.values) {
      return; // Skip if properties are not accessible
    }
    
    // Get the primary property value for this component type
    const primaryProperty = this.getPrimaryProperty(element);
    const propertyValue = primaryProperty ? properties.values[primaryProperty] : null;
    
    // Build the display text
    let displayText = '';
    
    if (label && propertyValue !== undefined && propertyValue !== null) {
      // Show both label and value: "R1=10 Ω"
      const formattedValue = this.formatValue(primaryProperty, propertyValue);
      displayText = `${label}=${formattedValue}`;
    } else if (label) {
      // Show only label: "R1"
      displayText = label;
    } else if (propertyValue !== undefined && propertyValue !== null) {
      // Show only value: "10 Ω"
      displayText = this.formatValue(primaryProperty, propertyValue);
    }
    
    // If nothing to display, return early
    if (!displayText) return;
    
    // Calculate text position based on component orientation
    const { textX, textY, textAlign } = this.calculateTextPosition(centerX, centerY, angle);
    
    // Render the text
    this.context.save();
    this.context.fillStyle = "black";
    this.context.font = "12px Arial";
    this.context.textAlign = textAlign;
    this.context.textBaseline = "middle";
    this.context.fillText(displayText, textX, textY);
    this.context.restore();
  }

  /**
   * Gets the primary property key for a component type
   * @param {Object} element - The element
   * @returns {string|null} The primary property key
   */
  getPrimaryProperty(element) {
    const typeMapping = {
      resistor: 'resistance',
      capacitor: 'capacitance',
      inductor: 'inductance',
      junction: 'critical_current'
    };
    return typeMapping[element.type] || null;
  }

  /**
   * Calculates text position based on component center and rotation
   * @param {number} centerX - Component center X
   * @param {number} centerY - Component center Y
   * @param {number} angle - Rotation angle in radians
   * @returns {Object} Text positioning info {textX, textY, textAlign}
   */
  calculateTextPosition(centerX, centerY, angle) {
    const offsetDistance = 25; // Distance from component center
    
    // Normalize angle to 0-2π range
    const normalizedAngle = ((angle % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
    
    // Determine if component is more horizontal or vertical
    const isVertical = (normalizedAngle > Math.PI/4 && normalizedAngle < 3*Math.PI/4) ||
                      (normalizedAngle > 5*Math.PI/4 && normalizedAngle < 7*Math.PI/4);
    
    if (isVertical) {
      // For vertical components: label to the right
      return {
        textX: centerX + offsetDistance,
        textY: centerY,
        textAlign: 'left'
      };
    } else {
      // For horizontal components: label below
      return {
        textX: centerX,
        textY: centerY + offsetDistance,
        textAlign: 'center'
      };
    }
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
