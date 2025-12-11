# QuCat Circuit Generator - Extension API Quick Reference

## 🚀 Quick Start

For the **complete extension guide**, see **[EXTENSION_GUIDE.md](./EXTENSION_GUIDE.md)**.

This document provides a quick reference for the most common extension patterns.

## 🏗️ Architecture Overview

The QuCat Circuit Generator follows **Hexagonal Architecture** with **Domain-Driven Design**:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   🎨 GUI Layer  │────│ ⚡ Application  │────│ 🏗️ Domain Layer │
│                 │    │    Services     │    │                 │
│ • Renderers     │    │ • CircuitService│    │ • Elements      │
│ • Commands      │    │ • Use Cases     │    │ • Aggregates    │
│ • Adapters      │    │                 │    │ • Value Objects │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Quick Extension Points

### 1. Adding New Elements (3 steps)

**Domain Entity** (`src/domain/entities/`):
```javascript
export class MyElement extends Element {
    constructor(id, nodes, label, properties) {
        super(id, nodes, label, properties);
        this.type = 'myelement';
    }
}
```

**Renderer** (`src/gui/renderers/`):
```javascript  
export class MyElementRenderer extends ElementRenderer {
    render(element, isSelected, isHovered) {
        // Custom rendering logic
    }
}
```

**Registration** (`src/config/settings.js`):
```javascript
// Import and register
ElementRegistry.register('MyElement', (...) => new MyElement(...));
rendererFactory.register('myelement', MyElementRenderer);
```

### 2. Adding Commands

**Command Class** (`src/gui/commands/`):
```javascript
export class MyCommand extends GUICommand {
    execute() { /* command logic */ }
    undo() { /* undo logic */ }
}
```

**Registration** (`src/config/settings.js`):
```javascript
GUICommandRegistry.register("myCommand", () => new MyCommand(...));
```

**Menu Configuration** (`src/config/menu.config.yaml`):
```yaml
items:
  - label: "My Action"
    action: "myCommand" 
    shortcut: "Ctrl+M"
```

## 📚 Resources

- **[Complete Extension Guide](./EXTENSION_GUIDE.md)** - Comprehensive tutorial with examples
- **[API Reference](./extension-api/index.html)** - Generated JSDoc documentation  
- **[Architecture Documentation](./architecture/README.md)** - C4 model architecture
- **[Configuration Patterns](./EXTENSION_GUIDE.md#configuration-and-registration)** - Registry and Factory patterns

---

*For detailed examples and advanced patterns, see the [complete extension guide](./EXTENSION_GUIDE.md).*