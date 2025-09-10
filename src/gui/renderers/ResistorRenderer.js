import { ElementRenderer } from "./ElementRenderer.js";
import { Position } from "../../domain/valueObjects/Position.js";
import { getImagePath } from "../../utils/getImagePath.js";

export class ResistorRenderer extends ElementRenderer {
  constructor(context) {
    super(context);
    this.image = null;
    this.imageLoaded = false;
    this.imageLoading = false;

    // Define proper dimensions for the resistor image
    this.SCALED_WIDTH = 50; // Adjusted width for display
    this.SCALED_HEIGHT = 20; // Adjusted height for display
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
            // Dispatch a custom event to trigger re-render
            const event = new CustomEvent('renderer:imageLoaded', { detail: { type: 'resistor' } });
            document.dispatchEvent(event);
          }
        };
        this.image.onerror = () => {
          console.warn('Failed to load resistor image');
          this.imageLoaded = false;
        };
        this.image.src = await getImagePath("resistor");
      }
    } catch (error) {
      console.warn('Error loading resistor image:', error);
    } finally {
      this.imageLoading = false;
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

    // Draw the resistor representation
    if (this.imageLoaded && this.image) {
      // Draw the resistor image centered on the midpoint.
      // Since the nodes are snapped, this should align with the grid.
      this.context.drawImage(
        this.image,
        midX - this.SCALED_WIDTH / 2,
        midY - this.SCALED_HEIGHT / 2,
        this.SCALED_WIDTH,
        this.SCALED_HEIGHT,
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
      
      // Draw connection lines from terminals to the body
      this.context.beginPath();
      this.context.moveTo(start.x, start.y);
      this.context.lineTo(rectX, midY);
      this.context.moveTo(end.x, end.y);
      this.context.lineTo(rectX + this.SCALED_WIDTH, midY);
      this.context.stroke();
      
      this.context.restore();
    }
    // If imageLoading is true, draw nothing for the resistor body
    // (terminals are already drawn above), wait for image to load

    // Optionally, draw a label below the resistor.
    if (resistor.label) {
      this.renderLabel(resistor.label.text, midX, midY + 25);
    }
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
}
