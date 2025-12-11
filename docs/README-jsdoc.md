# QuCat Circuit Generator - API Documentation

Welcome to the QuCat Circuit Generator API reference! This documentation provides comprehensive coverage of all classes, methods, and interfaces for extending the circuit generator.

## 🔬 Live Demo

Try the circuit generator while browsing the API documentation:

<div style="text-align: center; margin: 20px 0;">
  <iframe 
    src="../dist/gui.html" 
    width="100%" 
    height="600" 
    style="border: none; border-radius: 12px; background: #f8f9fa; box-shadow: 0 8px 25px rgba(0,0,0,0.1);"
    title="QuCat Circuit Generator Demo">
  </iframe>
</div>

## 📋 API Overview

### Core Domain Classes
- **[Element](./module-Domain_Entities-Element.html)** - Abstract base class for all circuit components
- **[Circuit](./Circuit.html)** - Main circuit aggregate containing elements and validation
- **[Properties](./domain_entities_Element.js.html#Properties)** - Value object for element properties

### Application Services  
- **[CircuitService](./module-Application_Services.CircuitService.html)** - Main service for circuit operations
- **[Element Registry](./ElementRegistryClass.html)** - Factory for creating new element types

### GUI System
- **[ElementRenderer](./ElementRenderer.html)** - Base class for element visualization
- **[GUIAdapter](./module-GUIAdapter.GUIAdapter.html)** - Main GUI coordination and event handling
- **[GUICommand](./GUICommand.html)** - Command pattern for undo/redo operations

## 🔧 Extension Points

### Creating Custom Elements
```javascript
import { Element } from './src/domain/entities/Element.js';

class CustomElement extends Element {
  constructor(id, nodes, label, properties) {
    super(id, nodes, label, properties);
    this.type = 'custom';
  }
}
```

### Registering Elements
```javascript
import { ElementRegistry } from './src/domain/factories/ElementRegistry.js';

ElementRegistry.register('Custom', (id, nodes, label, properties) => 
  new CustomElement(id, nodes, label, properties));
```

### Creating Custom Renderers
```javascript
import { ElementRenderer } from './src/gui/renderers/ElementRenderer.js';

class CustomRenderer extends ElementRenderer {
  renderElement(element) {
    // Custom rendering logic
  }
}
```

## 🏗️ Architecture Overview

The QuCat Circuit Generator follows **Hexagonal Architecture** with **Domain-Driven Design**:

- **Domain Layer** - Core business logic (Element, Circuit, Properties)
- **Application Layer** - Orchestration services (CircuitService)  
- **Infrastructure Layer** - External adapters (File I/O, QuCat format)
- **GUI Layer** - User interface adapters (GUIAdapter, renderers, commands)

### Key Design Patterns

- **Factory Pattern** - ElementRegistry for creating elements
- **Command Pattern** - GUICommand for undo/redo operations  
- **Adapter Pattern** - GUIAdapter coordinates between layers
- **Strategy Pattern** - Different renderers for element visualization

## 📚 Complete Documentation

- **[🎯 Getting Started](../getting-started.html)** - User tutorial and examples
- **[👩‍💻 Developer Guide](../EXTENSION_GUIDE.md)** - Creating new components  
- **[🏛️ Architecture](../architecture/README.md)** - Complete system architecture

---

**QuCat Circuit Generator** - Part of the [QuCat Quantum Analysis Ecosystem](https://github.com/qucat/qucat)