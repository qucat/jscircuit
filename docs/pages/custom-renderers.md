# Custom Renderers

Renderers control how circuit elements are drawn on the canvas. This guide shows you how to create beautiful, interactive visualizations.

## Renderer Basics

All renderers extend {@link ElementRenderer} and implement the `render()` method.

## Canvas Rendering Context

You have full access to the HTML5 Canvas 2D context:

```javascript
ctx.beginPath();
ctx.moveTo(x1, y1);
ctx.lineTo(x2, y2);
ctx.stroke();
```

## Basic Renderer Structure

```javascript
import { ElementRenderer } from './gui/renderers/ElementRenderer.js';

export class MyCustomRenderer extends ElementRenderer {
  /**
   * Render the element
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Element} element - Element to render
   * @param {boolean} isSelected - Is element selected?
   * @param {boolean} isHovered - Is mouse hovering?
   */
  render(ctx, element, isSelected, isHovered) {
    // Your drawing code here
  }
}
```

## Handling Selection and Hover

```javascript
render(ctx, element, isSelected, isHovered) {
  // Change appearance based on state
  if (isSelected) {
    ctx.strokeStyle = '#e74c3c'; // Red for selected
    ctx.lineWidth = 3;
  } else if (isHovered) {
    ctx.strokeStyle = '#3498db'; // Blue for hover
    ctx.lineWidth = 2.5;
  } else {
    ctx.strokeStyle = '#2c3e50'; // Default color
    ctx.lineWidth = 2;
  }
}
```

## Using Image Assets

You can load and draw images:

```javascript
export class ImageBasedRenderer extends ElementRenderer {
  constructor() {
    super();
    this.image = new Image();
    this.image.src = './assets/my-element.png';
  }
  
  render(ctx, element, isSelected, isHovered) {
    if (this.image.complete) {
      const x = element.nodes[0].x;
      const y = element.nodes[0].y;
      ctx.drawImage(this.image, x - 25, y - 25, 50, 50);
    }
  }
}
```

## HiDPI Support

The canvas automatically handles HiDPI displays. Just draw at logical coordinates:

```javascript
// This works correctly on retina displays
ctx.fillRect(100, 100, 50, 50);
```

## Example: Fancy Capacitor

```javascript
export class FancyCapacitorRenderer extends ElementRenderer {
  render(ctx, element, isSelected, isHovered) {
    const [node1, node2] = element.nodes;
    const midX = (node1.x + node2.x) / 2;
    const midY = (node1.y + node2.y) / 2;
    
    // Draw connection lines
    ctx.beginPath();
    ctx.moveTo(node1.x, node1.y);
    ctx.lineTo(midX - 10, midY);
    ctx.moveTo(midX + 10, midY);
    ctx.lineTo(node2.x, node2.y);
    ctx.strokeStyle = isSelected ? '#e74c3c' : '#34495e';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw plates
    ctx.beginPath();
    ctx.moveTo(midX - 10, midY - 20);
    ctx.lineTo(midX - 10, midY + 20);
    ctx.moveTo(midX + 10, midY - 20);
    ctx.lineTo(midX + 10, midY + 20);
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Add label
    this.renderLabel(ctx, element, midX, midY + 30);
  }
}
```

## Registering Your Renderer

```javascript
import { RendererFactory } from './gui/renderers/RendererFactory.js';

RendererFactory.register('C', () => new FancyCapacitorRenderer());
```

## Best Practices

- ✅ Use consistent colors across your theme
- ✅ Make selected elements clearly visible
- ✅ Test with both light and dark themes
- ✅ Consider HiDPI displays
- ✅ Keep rendering performant (avoid heavy calculations)
- ✅ Cache images and complex calculations

## Next Steps

- See {@tutorial custom-elements} to create the elements you'll render
- Learn about {@tutorial custom-commands} for interactions
