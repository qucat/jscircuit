# QuCat Circuit Generator - Extension Guide

> **🚧 DOCUMENTATION IN DEVELOPMENT** 
> 
> This developer guide is being written and examples are being added. The extension API is stable but documentation is incomplete.

This guide explains how to extend the QuCat Circuit Generator with new elements, renderers, and commands using the hexagonal architecture API.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Adding New Circuit Elements](#adding-new-circuit-elements)
- [Creating Custom Renderers](#creating-custom-renderers)
- [Implementing Commands](#implementing-commands)
- [Configuration and Registration](#configuration-and-registration)
- [API Reference](#api-reference)
- [Examples](#examples)

## Architecture Overview

The QuCat Circuit Generator follows **Hexagonal Architecture** with **Domain-Driven Design** principles. Understanding these layers is essential for proper extension:

### Core Layers

1. **Domain Layer** (`src/domain/`): Core business logic
   - `Circuit` - Aggregate root managing circuit elements
   - `Element` - Base class for all circuit components
   - Value Objects: `Position`, `Properties`, `Label`

2. **Application Layer** (`src/application/`):
   - `CircuitService` - Main application service
   - Domain services for complex operations

3. **GUI Layer** (`src/gui/`):
   - `GUIAdapter` - Primary adapter for user interactions
   - Renderers - Visual representation adapters
   - Commands - User action encapsulation

4. **Infrastructure Layer** (`src/infrastructure/`):
   - File I/O adapters
   - External format converters

### Extension Points

The system provides several **extension points** for adding functionality:

- **ElementRegistry**: Register new circuit element types
- **RendererFactory**: Register visual renderers for elements
- **GUICommandRegistry**: Register new user commands
- **Event System**: React to circuit state changes

## Adding New Circuit Elements

### 1. Create the Domain Entity

First, create your element class in `src/domain/entities/`:

```javascript
// src/domain/entities/Transformer.js
import { Element } from './Element.js';

/**
 * @class Transformer
 * @extends Element
 * @description Represents a transformer component with primary and secondary windings
 */
export class Transformer extends Element {
    constructor(id, nodes, label = null, properties) {
        // Validate transformer-specific requirements
        if (nodes.length !== 4) {
            throw new Error("A Transformer must have exactly four nodes (primary and secondary).");
        }
        
        super(id, nodes, label, properties);
        this.type = 'transformer';
    }
    
    /**
     * Get the turns ratio of the transformer
     * @returns {number} The turns ratio
     */
    getTurnsRatio() {
        return this.properties.values.turnsRatio || 1.0;
    }
}
```

### 2. Register the Element

Add registration in `src/config/settings.js`:

```javascript
// In the ElementRegistry registration section
ElementRegistry.register('Transformer', (id = generateId('T'), nodes, label = null, properties = new Properties({})) => {
    const defaultProps = { 
        turnsRatio: 1.0,        // 1:1 transformer by default
        primaryInductance: 1e-6, // 1 μH
        coupling: 0.99,         // 99% coupling
        orientation: 0 
    };
    const finalProps = properties instanceof Properties ? properties : new Properties(defaultProps);
    
    if (finalProps.values.orientation === undefined) {
        finalProps.values.orientation = 0;
    }
    
    return new Transformer(id, nodes, label, finalProps);
});
```

### 3. Import Your Element

Don't forget to import your new element in `settings.js`:

```javascript
import { Transformer } from '../domain/entities/Transformer.js';
```

## Creating Custom Renderers

### 1. Create the Renderer Class

Create your renderer in `src/gui/renderers/`:

```javascript
// src/gui/renderers/TransformerRenderer.js
import { ImageRenderer } from './ImageRenderer.js';

/**
 * @class TransformerRenderer
 * @extends ImageRenderer
 * @description Renders transformer components with primary/secondary coil visualization
 */
export class TransformerRenderer extends ImageRenderer {
    constructor(context) {
        super(context);
        this.elementType = 'transformer';
    }
    
    /**
     * Custom rendering logic for transformers
     */
    render(element, isSelected, isHovered) {
        // Call parent implementation for basic rendering
        super.render(element, isSelected, isHovered);
        
        // Add custom transformer-specific rendering
        this.renderTurnsRatio(element);
    }
    
    /**
     * Render turns ratio indicator
     */
    renderTurnsRatio(element) {
        const ratio = element.getTurnsRatio();
        if (ratio !== 1.0) {
            const center = element.nodes[0].midpoint(element.nodes[1]);
            this.renderLabel(`1:${ratio}`, center.x, center.y - 15);
        }
    }
}
```

### 2. Register the Renderer

Add registration in `src/config/settings.js`:

```javascript
// Import the renderer
import { TransformerRenderer } from '../gui/renderers/TransformerRenderer.js';

// In the renderer registration section
rendererFactory.register('transformer', TransformerRenderer);
```

### 3. Add Element Assets

Add the transformer images to the `assets/` directory:
- `T.png` (default state)
- `T_hover.png` (hover state)  
- `T_selected.png` (selected state)
- `T_hover_selected.png` (hover + selected state)

## Implementing Commands

### 1. Create Command Class

Create your command in `src/gui/commands/`:

```javascript
// src/gui/commands/OptimizeTransformerCommand.js
import { GUICommand } from "./GUICommand.js";

/**
 * @class OptimizeTransformerCommand
 * @extends GUICommand
 * @description Automatically optimizes transformer coupling and turns ratio
 */
export class OptimizeTransformerCommand extends GUICommand {
    constructor(circuitService, circuitRenderer) {
        super();
        this.circuitService = circuitService;
        this.circuitRenderer = circuitRenderer;
        this.originalProperties = new Map();
    }

    execute() {
        const selectedElements = this.circuitRenderer.getSelectedElements();
        const transformers = selectedElements.filter(el => el.type === 'transformer');
        
        if (transformers.length === 0) {
            console.warn('No transformers selected for optimization');
            return;
        }
        
        // Store original properties for undo
        transformers.forEach(transformer => {
            this.originalProperties.set(transformer.id, {
                ...transformer.properties.values
            });
            
            // Apply optimization logic
            const optimizedProps = this.optimizeTransformer(transformer);
            this.circuitService.updateElementProperties(transformer.id, optimizedProps);
        });
    }
    
    undo() {
        this.originalProperties.forEach((originalProps, elementId) => {
            this.circuitService.updateElementProperties(elementId, originalProps);
        });
        
        this.originalProperties.clear();
    }
    
    optimizeTransformer(transformer) {
        // Custom optimization logic here
        return {
            coupling: 0.98,
            turnsRatio: this.calculateOptimalRatio(transformer)
        };
    }
    
    calculateOptimalRatio(transformer) {
        // Implement your optimization algorithm
        return 1.5; // Example
    }
}
```

### 2. Register the Command

Add registration in `src/config/settings.js` within the `setupCommands` function:

```javascript
// Import the command
import { OptimizeTransformerCommand } from "../gui/commands/OptimizeTransformerCommand.js";

// In setupCommands function
if (!GUICommandRegistry.getTypes().includes("optimizeTransformer")) {
    GUICommandRegistry.register("optimizeTransformer", () =>
        new OptimizeTransformerCommand(circuitService, circuitRenderer)
    );
}
```

### 3. Add to Menu Configuration

Add your command to `src/config/menu.config.yaml`:

```yaml
items:
  - label: "Tools"
    items:
      - label: "Optimize Transformer"
        action: "optimizeTransformer"
        shortcut: "Ctrl+T"
```

## Configuration and Registration

### Element Registry Pattern

The `ElementRegistry` uses the Factory Pattern:

```javascript
// Register with factory function
ElementRegistry.register('ElementType', (id, nodes, label, properties) => {
    return new ElementType(id, nodes, label, properties);
});

// Get registered factory
const factory = ElementRegistry.get('ElementType');
const element = factory('E1', nodes, label, properties);
```

### Renderer Factory Pattern

The `RendererFactory` manages renderer instances:

```javascript
// Register renderer class
rendererFactory.register('elementType', RendererClass);

// Factory creates instances automatically
const renderer = rendererFactory.createRenderer('elementType', context);
```

### Command Registry Pattern

The `GUICommandRegistry` provides command factories:

```javascript
// Register command factory
GUICommandRegistry.register('commandName', (services) => {
    return new CommandClass(services.circuitService, services.circuitRenderer);
});

// Get command instance
const command = GUICommandRegistry.get('commandName');
```

## API Reference

### Core Extension APIs

#### CircuitService (Application Layer)

```javascript
// Add elements to the circuit
circuitService.addElement(element);

// Update element properties
circuitService.updateElementProperties(elementId, newProperties);

// Get elements from the circuit
const elements = circuitService.getElements();

// Event listening
circuitService.on('elementAdded', (element) => {
    // React to element addition
});
```

#### Element (Domain Entity)

```javascript
class CustomElement extends Element {
    constructor(id, nodes, label, properties) {
        super(id, nodes, label, properties);
        this.type = 'customElement'; // Required: set element type
    }
    
    // Custom domain methods
    customBusinessLogic() {
        // Element-specific logic here
    }
}
```

#### ElementRenderer (GUI Layer)

```javascript
class CustomRenderer extends ElementRenderer {
    render(element, isSelected, isHovered) {
        // Rendering logic
        this.renderTerminals(element.nodes);
        this.renderCustomShape(element);
        
        if (isSelected) {
            this.renderSelection(element);
        }
    }
}
```

## Examples

### Complete Extension Example

Here's a complete example adding a variable capacitor:

```javascript
// 1. Domain Entity
// src/domain/entities/VariableCapacitor.js
export class VariableCapacitor extends Element {
    constructor(id, nodes, label, properties) {
        super(id, nodes, label, properties);
        this.type = 'variableCapacitor';
    }
    
    getCapacitanceRange() {
        const props = this.properties.values;
        return {
            min: props.minCapacitance || 1e-12,
            max: props.maxCapacitance || 100e-12
        };
    }
}

// 2. Renderer
// src/gui/renderers/VariableCapacitorRenderer.js
export class VariableCapacitorRenderer extends ImageRenderer {
    constructor(context) {
        super(context);
        this.elementType = 'variableCapacitor';
    }
    
    render(element, isSelected, isHovered) {
        super.render(element, isSelected, isHovered);
        this.renderVariabilityIndicator(element);
    }
    
    renderVariabilityIndicator(element) {
        // Add arrow or other indicator showing variability
        const center = this.getElementCenter(element);
        this.context.strokeStyle = '#666';
        this.context.beginPath();
        this.context.moveTo(center.x - 10, center.y - 10);
        this.context.lineTo(center.x + 10, center.y + 10);
        this.context.stroke();
    }
}

// 3. Registration in settings.js
import { VariableCapacitor } from '../domain/entities/VariableCapacitor.js';
import { VariableCapacitorRenderer } from '../gui/renderers/VariableCapacitorRenderer.js';

// Element registration
ElementRegistry.register('VariableCapacitor', (id = generateId('VC'), nodes, label = null, properties = new Properties({})) => {
    const defaultProps = { 
        minCapacitance: 1e-12,
        maxCapacitance: 100e-12,
        currentCapacitance: 10e-12,
        orientation: 0 
    };
    const finalProps = properties instanceof Properties ? properties : new Properties(defaultProps);
    return new VariableCapacitor(id, nodes, label, finalProps);
});

// Renderer registration
rendererFactory.register('variableCapacitor', VariableCapacitorRenderer);
```

This extension pattern ensures your custom elements integrate seamlessly with the existing architecture while maintaining the separation of concerns and testability that hexagonal architecture provides.

## Testing Your Extensions

Always test your extensions thoroughly:

1. **Unit Tests**: Test domain entities in isolation
2. **Integration Tests**: Test registration and factory patterns
3. **GUI Tests**: Test rendering and user interactions
4. **Performance Tests**: Ensure extensions don't impact performance

Follow the existing test patterns in the `tests/` directory for guidance.

## Best Practices

1. **Follow DDD Principles**: Keep business logic in the domain layer
2. **Respect Layer Boundaries**: Don't bypass the architectural layers
3. **Use Dependency Injection**: Register components rather than hard-coding dependencies
4. **Implement Command Pattern**: All user actions should be commands with undo/redo
5. **Emit Domain Events**: Use the event system for loose coupling
6. **Validate Input**: Always validate user input and domain constraints
7. **Document APIs**: Add JSDoc documentation for public methods
8. **Performance**: Consider performance impact of custom rendering logic