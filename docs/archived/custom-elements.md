# Custom Elements

Custom elements allow you to extend the circuit generator with new components beyond the built-in capacitors, inductors, and junctions.

## Element Basics

All elements extend the {@link Element} base class and must:

1. Have a unique type identifier
2. Define connection nodes
3. Provide properties (values, labels, etc.)
4. Implement the QuCat netlist format

## Step 1: Create the Element Class

```javascript
import { Element } from './domain/entities/Element.js';

export class MemristorElement extends Element {
  constructor(id, nodes, label = 'M', properties = {}) {
    super(id, 'M', nodes, label, properties);
    
    // Set default properties
    this.properties = {
      resistance: properties.resistance || '100',
      memristance: properties.memristance || '1k',
      ...properties
    };
  }
  
  /**
   * Validate the element has required properties
   */
  validate() {
    if (this.nodes.length !== 2) {
      throw new Error('Memristor must have exactly 2 nodes');
    }
    return true;
  }
  
  /**
   * Generate QuCat netlist line
   */
  toNetlistLine() {
    return `${this.type}${this.id} ${this.nodes[0]} ${this.nodes[1]} ${this.properties.resistance}`;
  }
}
```

## Step 2: Register the Element

```javascript
import { ElementRegistry } from './domain/factories/ElementRegistry.js';
import { MemristorElement } from './domain/entities/MemristorElement.js';

// Register with the factory
ElementRegistry.register('Memristor', 
  (id, nodes, label, properties) => 
    new MemristorElement(id, nodes, label, properties)
);
```

## Step 3: Create a Renderer

```javascript
import { ElementRenderer } from './gui/renderers/ElementRenderer.js';

export class MemristorRenderer extends ElementRenderer {
  render(ctx, element, isSelected, isHovered) {
    const [node1, node2] = element.nodes;
    
    // Draw memristor symbol
    ctx.beginPath();
    ctx.moveTo(node1.x, node1.y);
    ctx.lineTo(node2.x, node2.y);
    ctx.strokeStyle = isSelected ? '#e74c3c' : '#2c3e50';
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.stroke();
    
    // Add label
    this.renderLabel(ctx, element, (node1.x + node2.x) / 2, (node1.y + node2.y) / 2);
  }
}
```

## Step 4: Register the Renderer

```javascript
import { RendererFactory } from './gui/renderers/RendererFactory.js';
import { MemristorRenderer } from './gui/renderers/MemristorRenderer.js';

RendererFactory.register('M', () => new MemristorRenderer());
```

## Step 5: Add a Command (Optional)

```javascript
import { AddElementCommand } from './gui/commands/AddElementCommand.js';
import { GUICommandRegistry } from './gui/commands/GUICommandRegistry.js';

// Register command for keyboard shortcut
GUICommandRegistry.register('add-memristor', () => 
  new AddElementCommand('Memristor', 'M')
);
```

## Testing Your Element

1. Rebuild the application: `npm run build`
2. Open the application
3. Use the keyboard shortcut (if configured)
4. Place your custom element
5. Export and verify the netlist format

## Best Practices

- ✅ Always validate node connections
- ✅ Provide sensible default values
- ✅ Follow QuCat netlist conventions
- ✅ Test with actual QuCat simulations
- ✅ Document properties clearly

## Next Steps

- Learn about {@tutorial custom-renderers} for advanced drawing
- Explore {@tutorial custom-commands} for keyboard shortcuts
- See {@tutorial architecture overview} for system design
