import { ElementRenderer } from "./ElementRenderer.js";
import { Position } from "../../domain/valueObjects/Position.js";
import { getImagePath } from "../../utils/getImagePath.js";

export class ResistorRenderer extends ElementRenderer {
  constructor(context) {
    super(context);
    this.image = null;
    this.hoverImage = null;
    this.imageLoaded = false;
    this.hoverImageLoaded = false;
    this.imageLoading = false;
    this.isHovered = false;

    // Define proper dimensions for the resistor image
    this.SCALED_WIDTH = 50; // Adjusted width for display
    this.SCALED_HEIGHT = 20; // Adjusted height for display
  }

  async initImageIfNeeded() {
    if (this.imageLoading) return;

    this.imageLoading = true;
    try {
      // Only create Image if we're in a browser environment
      if (typeof Image !== 'undefined') {
        // Load normal image
        if (!this.image) {
          this.image = new Image();
          this.image.onload = () => {
            this.imageLoaded = true;
            this.triggerRerender();
          };
          this.image.onerror = () => {
            console.warn('Failed to load resistor image');
            this.imageLoaded = false;
          };
          
          const imagePath = await getImagePath("resistor");
          this.image.src = imagePath;
        }

        // Load hover image
        if (!this.hoverImage) {
          this.hoverImage = new Image();
          this.hoverImage.onload = () => {
            this.hoverImageLoaded = true;
            this.triggerRerender();
          };
          this.hoverImage.onerror = () => {
            console.warn('Failed to load resistor hover image');
            this.hoverImageLoaded = false;
          };
          
          const hoverImagePath = await getImagePath("resistor", "hover");
          this.hoverImage.src = hoverImagePath;
        }
      }
    } catch (error) {
      console.warn('Error loading resistor images:', error);
    } finally {
      this.imageLoading = false;
    }
  }

  triggerRerender() {
    if (this.context && this.context.canvas) {
      const event = new CustomEvent('renderer:imageLoaded', { detail: { type: 'resistor' } });
      document.dispatchEvent(event);
    }
  }

  async init() {
    await this.initImageIfNeeded();
  }

  renderElement(resistor) {
    // Try to initialize image if needed (don't await, let it load in background)
    if (!this.image && !this.imageLoading) {
      this.initImageIfNeeded(); // Fire and forget
    }

    const [start, end] = resistor.nodes;
    // Compute midpoint between snapped nodes
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;

    // Draw terminals (using the base method from ElementRenderer)
    this.renderTerminal(start);
    this.renderTerminal(end);

    // Draw the resistor representation using appropriate image
    const currentImage = this.isHovered && this.hoverImageLoaded ? this.hoverImage : this.image;
    const imageReady = this.isHovered && this.hoverImageLoaded ? this.hoverImageLoaded : this.imageLoaded;

    if (imageReady && currentImage) {
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
      
      this.context.drawImage(
        currentImage,
        midX - drawWidth / 2,
        midY - drawHeight / 2,
        drawWidth,
        drawHeight,
      );
    } else if (!this.imageLoading) {
      // Only show fallback if image is not currently loading
      // Fallback: draw a simple rectangle representation
      this.context.save();
      this.context.strokeStyle = '#8B4513'; // Brown color for resistor
      this.context.fillStyle = '#D2B48C';   // Light brown fill
      this.context.lineWidth = 2;
      
      const rectX = midX - this.SCALED_WIDTH / 2;
      const rectY = midY - this.SCALED_HEIGHT / 2;
      
      this.context.fillRect(rectX, rectY, this.SCALED_WIDTH, this.SCALED_HEIGHT);
      this.context.strokeRect(rectX, rectY, this.SCALED_WIDTH, this.SCALED_HEIGHT);
      
      this.context.restore();
    }

    // Draw connecting lines from terminals to resistor body
    this.renderConnections(start, end, midX, midY);
    // If imageLoading is true, draw nothing for the resistor body
    // (terminals are already drawn above), wait for image to load

    // Optionally, draw a label below the resistor.
    if (resistor.label) {
      this.renderLabel(resistor.label.text, midX, midY + 25);
    }
  }

  /**
   * Render a resistor element with hover state
   * @param {Object} resistor - The resistor element to render
   * @param {boolean} isHovered - Whether the element is being hovered
   */
  renderElementWithHover(resistor, isHovered) {
    // Set hover state and render
    this.isHovered = isHovered;
    this.renderElement(resistor);
  }

  registerClickHandler(canvas, command) {
    canvas.addEventListener(
      "mouseup",
      (event) => {
        const rect = canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        console.log(`📌 Click detected at: ${clickX}, ${clickY}`);

        // Ensure correct positions for terminals based on scaled image
        const nodes = [
          new Position(clickX - this.SCALED_WIDTH / 2, clickY), // Left terminal
          new Position(clickX + this.SCALED_WIDTH / 2, clickY), // Right terminal
        ];

        console.log(`📌 Calculated node positions:`, nodes);

        // Execute the command with computed positions
        if (command) {
          command.execute(nodes);
          console.log(
            `AddElementCommand executed for ${command.elementType}`,
          );
        } else {
          console.warn("⚠️ No command provided for adding the element.");
        }
      },
      { once: true },
    );
  }

  renderConnections(start, end, midX, midY) {
    this.context.save();
    this.context.strokeStyle = '#000000';
    this.context.lineWidth = 1;

    // Draw line from start to resistor body
    this.context.beginPath();
    this.context.moveTo(start.x, start.y);
    this.context.lineTo(midX - this.SCALED_WIDTH / 2, midY);
    this.context.stroke();

    // Draw line from resistor body to end
    this.context.beginPath();
    this.context.moveTo(midX + this.SCALED_WIDTH / 2, midY);
    this.context.lineTo(end.x, end.y);
    this.context.stroke();

    this.context.restore();
  }

  // Check if a point is within the resistor bounds
  isPointInBounds(mouseX, mouseY, elementMidX, elementMidY) {
    const halfWidth = this.SCALED_WIDTH / 2;
    const halfHeight = this.SCALED_HEIGHT / 2;
    
    return (
      mouseX >= elementMidX - halfWidth &&
      mouseX <= elementMidX + halfWidth &&
      mouseY >= elementMidY - halfHeight &&
      mouseY <= elementMidY + halfHeight
    );
  }
}
