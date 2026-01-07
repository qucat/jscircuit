# Architecture

The JSCircuit Editor follows **Domain-Driven Design (DDD)** with **Hexagonal Architecture** principles.

## Layered Architecture

```
┌─────────────────────────────────────────────┐
│              GUI Layer                      │
│  Canvas rendering, user interaction         │
│  - Renderers, Commands, Event handlers     │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         Application Layer                   │
│  Service orchestration, use cases          │
│  - CircuitService, GUIAdapter              │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│           Domain Layer                      │
│  Pure business logic (no dependencies)     │
│  - Circuit, Element, ValueObjects          │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│       Infrastructure Layer                  │
│  External adapters (file I/O, format)     │
│  - NetlistAdapter, FileService             │
└─────────────────────────────────────────────┘
```

## Core Principles

### 1. Domain Independence

The domain layer has **zero external dependencies**. It contains pure business logic:

```javascript
// Domain/Circuit.js - No GUI, no I/O, pure logic
class Circuit {
  addElement(element) {
    this.elements.push(element);
    this.emit('elementAdded', element);
  }
}
```

### 2. Ports and Adapters

External concerns are injected through interfaces:

```javascript
// Port (interface)
interface INetlistAdapter {
  toNetlist(circuit): string;
  fromNetlist(text): Circuit;
}

// Adapter (implementation)
class QuCatNetlistAdapter implements INetlistAdapter {
  toNetlist(circuit) { /* QuCat format */ }
  fromNetlist(text) { /* parse QuCat */ }
}
```

### 3. Event-Driven Communication

Layers communicate through events, not direct calls:

```javascript
// Service emits events
circuitService.on('elementAdded', (element) => {
  // GUI reacts
  guiAdapter.renderElement(element);
});
```

## Directory Structure

```
src/
├── domain/              # Pure business logic
│   ├── aggregates/      # Circuit (root aggregate)
│   ├── entities/        # Element, Wire, Junction
│   ├── valueObjects/    # Position, Properties, NodeId
│   └── factories/       # ElementRegistry
│
├── application/         # Service layer
│   └── CircuitService.js
│
├── gui/                 # User interface
│   ├── adapters/        # GUIAdapter
│   ├── renderers/       # Element renderers
│   ├── commands/        # User commands
│   └── main.js          # Entry point
│
├── infrastructure/      # External adapters
│   └── adapters/        # File I/O, netlist format
│
└── config/             # Registration & settings
    ├── registry.js     # Central registry
    └── menu.config.yaml # UI configuration
```

## Design Patterns

### Factory Pattern

Elements and renderers use factories for creation:

```javascript
// Element factory
ElementRegistry.register('Capacitor', 
  (id, nodes, label, props) => new Capacitor(id, nodes, label, props)
);

// Renderer factory
RendererFactory.register('C', 
  () => new CapacitorRenderer()
);
```

### Command Pattern

All user actions are commands with undo/redo:

```javascript
class AddElementCommand extends GUICommand {
  execute() { /* add element */ }
  undo() { /* remove element */ }
}

commandHistory.execute(new AddElementCommand(...));
```

### Observer Pattern

Components communicate through events:

```javascript
circuitService.on('elementAdded', handler);
circuitService.emit('elementAdded', element);
```

## Key Classes

See the API documentation for details on:

- {@link Circuit} - Root aggregate
- {@link Element} - Base entity
- {@link CircuitService} - Main service
- {@link GUIAdapter} - GUI coordinator
- {@link ElementRenderer} - Rendering base
- {@link GUICommand} - Command base

## Benefits of This Architecture

- ✅ **Testable** - Pure domain logic is easy to test
- ✅ **Maintainable** - Clear separation of concerns
- ✅ **Extensible** - Add features without modifying core
- ✅ **Flexible** - Swap implementations easily
- ✅ **Understandable** - Each layer has one responsibility

## Next Steps

- {@tutorial domain-layer} - Deep dive into domain logic
- {@tutorial application-layer} - Service orchestration
- {@tutorial gui-layer} - User interface architecture
