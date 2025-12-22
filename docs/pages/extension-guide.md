The JSCircuit Editor is designed to be **extensible**. You can add custom elements, renderers, and commands.

## Extension Points

The system provides three main extension points:

1. **Custom Elements** - Add new circuit components
2. **Custom Renderers** - Control how elements are drawn
3. **Custom Commands** - Add new user interactions

## Architecture

The system follows **Domain-Driven Design** with **Hexagonal Architecture**:

- **Domain Layer** - Pure business logic (no dependencies)
- **Application Layer** - Service orchestration
- **GUI Layer** - Canvas rendering and user interaction
- **Infrastructure Layer** - External adapters (file I/O, etc.)

## Getting Started with Extensions

See the following tutorials to create your extensions:

- {@tutorial custom-elements} - Create new circuit components
- {@tutorial custom-renderers} - Customize element appearance
- {@tutorial custom-commands} - Add new user interactions

## Key Classes

- {@link Element} - Base class for all circuit elements
- {@link ElementRegistry} - Registry for element factories
- {@link ElementRenderer} - Base class for renderers
- {@link RendererFactory} - Factory for creating renderers
- {@link GUICommand} - Base class for commands
- {@link GUICommandRegistry} - Registry for commands
- {@link CircuitService} - Main application service

## Example: Adding a Custom Element

```javascript
import { Element } from './domain/entities/Element.js';
import { ElementRegistry } from './domain/factories/ElementRegistry.js';

class CustomInductor extends Element {
  constructor(id, nodes, label, properties) {
    super(id, 'L', nodes, label, properties);
  }
  
  // Override methods as needed
}

// Register the element
ElementRegistry.register('CustomInductor', 
  (id, nodes, label, props) => new CustomInductor(id, nodes, label, props)
);
```

See {@tutorial custom-elements} for a complete guide.
