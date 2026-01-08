# Extension Integration Tutorial: Adding Custom Components

This tutorial walks you through extending JSCircuit Editor with a custom component (`MyInductor`) from start to finish. You'll learn the complete integration workflow while adhering to the **Open-Closed Principle**: the framework is **closed for modification, open for extension**.

## Prerequisites

- Familiarity with JavaScript ES6+ classes
- Understanding of the [Hexagonal Architecture](./architecture.md)
- JSCircuit Editor development environment set up

## What You'll Learn

1. Create a domain entity (element) with proper value objects
2. Create a GUI renderer for visual representation
3. Register your component in the framework
4. Understand how GUIAdapter coordinates without modification
5. Integrate with the menu system
6. (Optional) Create custom commands

## The Extension Principle

**Critical Concept**: You will **NEVER modify** [`GUIAdapter.js`](../../src/gui/adapters/GUIAdapter.js) or any core framework files. Extensions work through **registries** that the framework discovers automatically.

---

## Step 1: Create the Domain Entity

**Goal**: Define your component's business logic independently of GUI concerns.

**File to Create**: `src/domain/entities/MyInductor.js`

```javascript
import { Element } from './Element.js';
import { Label } from '../valueObjects/Label.js';
import { Properties } from '../valueObjects/Properties.js';

/**
 * Custom inductor element for quantum circuits
 */
export class MyInductor extends Element {
  constructor(id, nodes, label, properties = {}) {
    // Wrap label string in Label value object
    const labelInstance = label instanceof Label 
      ? label 
      : new Label(label || 'L1');
    
    // Prepare properties - Properties only accepts: float, "variable", or undefined
    const validProps = {
      inductance: properties.inductance !== undefined 
        ? properties.inductance 
        : 5e-9  // Default: 5 nanohenries
    };
    const propsInstance = properties instanceof Properties 
      ? properties 
      : new Properties(validProps);
    
    // Element constructor signature: (id, nodes, label, properties)
    super(id, nodes, labelInstance, propsInstance);
    
    // Set type AFTER super() call
    this.type = 'MyInductor';
  }

  /**
   * Generate SPICE netlist entry for this inductor
   */
  toNetlistEntry() {
    const inductance = this.properties.values.inductance;
    return `L${this.id} ${this.nodes[0]} ${this.nodes[1]} ${inductance}`;
  }
}
```

### Key Points

- **Value Objects Required**: Element constructor validates that `label` is a `Label` instance and `properties` is a `Properties` instance
- **Properties Validation**: The `Properties` class only accepts numeric values, `"variable"` string, or `undefined` - no arbitrary types like strings for color
- **Type Setting**: Set `this.type` after calling `super()` to identify your element
- **Domain Purity**: No GUI code here - no references to canvas, rendering, or user interface

### Testing Your Entity

```javascript
import { MyInductor } from './domain/entities/MyInductor.js';
import { Position } from './domain/valueObjects/Position.js';

const node1 = new Position(0, 0);
const node2 = new Position(50, 0);
const inductor = new MyInductor('1', [node1, node2], 'L1', { inductance: 10e-9 });

console.log(inductor.type); // 'MyInductor'
console.log(inductor.properties.values.inductance); // 10e-9
console.log(inductor.toNetlistEntry()); // 'L1 ...'
```

---

## Step 2: Create the GUI Renderer

**Goal**: Define how your component appears on the canvas.

**File to Create**: `src/gui/renderers/MyInductorRenderer.js`

```javascript
import { ElementRenderer } from './ElementRenderer.js';

/**
 * Renders MyInductor element on the canvas
 */
export class MyInductorRenderer extends ElementRenderer {
  /**
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {MyInductor} element - The element to render
   * @param {boolean} isSelected - Whether element is selected
   * @param {boolean} isHovered - Whether element is hovered
   */
  render(ctx, element, isSelected, isHovered) {
    ctx.save();
    
    // Visual feedback for interaction states
    ctx.strokeStyle = isSelected ? '#e74c3c' : (isHovered ? '#3498db' : '#2c3e50');
    ctx.lineWidth = isSelected ? 3 : 2;
    
    // Draw inductor symbol (simplified coil representation)
    const [start, end] = element.nodes;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    
    ctx.translate(start.x, start.y);
    ctx.rotate(angle);
    
    // Draw coil loops
    ctx.beginPath();
    const loops = 4;
    const loopWidth = length / loops;
    for (let i = 0; i < loops; i++) {
      const x = i * loopWidth;
      ctx.arc(x + loopWidth / 2, 0, loopWidth / 2, Math.PI, 0, false);
    }
    ctx.stroke();
    
    ctx.restore();
    
    // Draw label if present
    if (element.label && element.label.value) {
      ctx.fillStyle = '#2c3e50';
      ctx.font = '12px Arial';
      ctx.fillText(element.label.value, start.x, start.y - 10);
    }
  }
}
```

### Key Points

- **Extends ElementRenderer**: Inherit from the base renderer class
- **render() Method**: Main method called by the framework
- **State Awareness**: Handle `isSelected` and `isHovered` for visual feedback
- **Canvas API**: Use standard Canvas 2D context methods
- **Domain Access**: Access element properties via `element.properties.values.*`

---

## Step 3: Register Your Component

**Goal**: Make the framework aware of your new component.

**File to Modify**: `src/config/registry.js` ⚠️ **(This is the ONLY core file you modify)**

```javascript
// ... existing imports ...

// ADD YOUR IMPORTS
import { MyInductor } from '../domain/entities/MyInductor.js';
import { MyInductorRenderer } from '../gui/renderers/MyInductorRenderer.js';

// ... existing registrations ...

// Register MyInductor Element
ElementRegistry.register('MyInductor', 
  (id, nodes, label, props) => new MyInductor(id, nodes, label, props)
);

// Register MyInductor Renderer
rendererFactory.register('MyInductor', MyInductorRenderer);

// ... rest of file ...
```

### Registration Details

**ElementRegistry.register()**
- **First parameter**: Type string (must match `element.type`)
- **Second parameter**: Factory function that creates element instances
- **Why a factory?** Allows the framework to create elements without knowing the concrete class

**rendererFactory.register()**
- **First parameter**: Type string (must match element type)
- **Second parameter**: Renderer **Constructor** (not an instance!)
- **Framework creates instances**: Uses `rendererFactory.create(type, ctx)` internally

### Validation

After registration, verify it works:

```javascript
// Element creation through registry
const factory = ElementRegistry.get('MyInductor');
const element = factory('1', [node1, node2], 'L1', { inductance: 5e-9 });

// Renderer creation through factory
const renderer = rendererFactory.create('MyInductor', canvasContext);
renderer.render(ctx, element, false, false);
```

---

## Step 4: Understanding GUIAdapter Coordination

**Goal**: Understand how the framework uses your component **without being modified**.

### How GUIAdapter Discovers Your Component

The [`GUIAdapter`](../../src/gui/adapters/GUIAdapter.js) **never references `MyInductor` directly**. Instead, it:

1. **Receives registries as dependencies** (Dependency Injection)
   ```javascript
   constructor(canvas, circuitService, elementRegistry, rendererFactory, commandRegistry) {
     this.elementRegistry = elementRegistry;
     this.rendererFactory = rendererFactory;
     // ...
   }
   ```

2. **Creates elements generically**
   ```javascript
   // GUIAdapter doesn't know about MyInductor specifically!
   const factory = this.elementRegistry.get(type); // type = 'MyInductor'
   const element = factory(id, nodes, label, properties);
   ```

3. **Renders elements generically**
   ```javascript
   // GUIAdapter asks RendererFactory for the right renderer
   const renderer = this.rendererFactory.create(element.type, ctx);
   renderer.render(ctx, element, isSelected, isHovered);
   ```

### The Open-Closed Principle in Action

```javascript
// ❌ WRONG: Modifying GUIAdapter (CLOSED for modification)
class GUIAdapter {
  createMyInductor(...) { /* DON'T DO THIS */ }
}

// ✅ CORRECT: Extending via registries (OPEN for extension)
ElementRegistry.register('MyInductor', factoryFunction);
rendererFactory.register('MyInductor', MyInductorRenderer);
// GUIAdapter automatically discovers and uses them!
```

### Verification

You can verify GUIAdapter has no component-specific code:

```bash
# Search GUIAdapter.js for your component name
grep -i "myinductor" src/gui/adapters/GUIAdapter.js
# Should return: no matches (✓ Correct!)
```

---

## Step 5: Menu Integration

**Goal**: Allow users to add your component from the menu.

**File to Modify**: `src/config/menu.bindings.js`

```javascript
// ... existing menu items ...

{
  id: 'add-inductor',
  label: 'Add Inductor',
  shortcut: 'Ctrl+Shift+L',
  action: 'addElement',
  params: {
    type: 'MyInductor',
    defaultProperties: {
      inductance: 5e-9
    }
  },
  category: 'elements'
}

// ... rest of menu ...
```

### How Menu Actions Work

1. **User clicks menu item** or uses keyboard shortcut
2. **Menu system looks up action**: `'addElement'` → mapped to `AddElementCommand`
3. **Command receives parameters**: `{ type: 'MyInductor', defaultProperties: {...} }`
4. **Command uses ElementRegistry**: 
   ```javascript
   const factory = ElementRegistry.get(params.type);
   const element = factory(id, nodes, label, params.defaultProperties);
   ```
5. **GUIAdapter renders**: Uses `rendererFactory.create(element.type, ctx)`

### No GUIAdapter Modification Needed

Notice: You didn't modify GUIAdapter to add menu support. The existing `AddElementCommand` works generically with **any registered element type**.

---

## Step 6: Custom Commands (Optional)

**Goal**: Add specialized behavior beyond standard element operations.

Sometimes you need custom logic (e.g., "Optimize Inductor Network"). Create a custom command:

**File to Create**: `src/gui/commands/OptimizeInductorCommand.js`

```javascript
import { GUICommand } from './GUICommand.js';

/**
 * Custom command to optimize inductor properties
 */
export class OptimizeInductorCommand extends GUICommand {
  constructor(guiAdapter, targetElementId) {
    super();
    this.guiAdapter = guiAdapter;
    this.targetElementId = targetElementId;
    this.oldInductance = null;
    this.newInductance = null;
  }

  execute() {
    // Find the inductor element
    const element = this.guiAdapter.circuitService.circuit.elements
      .find(el => el.id === this.targetElementId && el.type === 'MyInductor');
    
    if (!element) {
      throw new Error('Inductor not found');
    }

    // Store old value for undo
    this.oldInductance = element.properties.values.inductance;
    
    // Apply optimization (example: reduce to 90%)
    this.newInductance = this.oldInductance * 0.9;
    element.properties.values.inductance = this.newInductance;
    
    // Trigger re-render through GUIAdapter
    this.guiAdapter.circuitRenderer.render();
    
    return { success: true, optimizedValue: this.newInductance };
  }

  undo() {
    const element = this.guiAdapter.circuitService.circuit.elements
      .find(el => el.id === this.targetElementId);
    
    if (element) {
      element.properties.values.inductance = this.oldInductance;
      this.guiAdapter.circuitRenderer.render();
    }
  }
}
```

### Register the Custom Command

**File to Modify**: `src/config/registry.js`

```javascript
import { OptimizeInductorCommand } from '../gui/commands/OptimizeInductorCommand.js';

// Register custom command
GUICommandRegistry.register('optimizeInductor', OptimizeInductorCommand);
```

### Add to Menu

**File to Modify**: `src/config/menu.bindings.js`

```javascript
{
  id: 'optimize-inductor',
  label: 'Optimize Selected Inductor',
  shortcut: 'Ctrl+Alt+O',
  action: 'optimizeInductor',
  category: 'tools',
  enabledWhen: 'selection.type === "MyInductor"'
}
```

### The GUIAdapter ↔ Command Relationship

**Bidirectional Relationship**:

```
┌─────────────┐                    ┌──────────────────────┐
│ GUIAdapter  │───creates──────────>│  Command             │
│             │                     │                      │
│  - commands │<───receives ref────│  - guiAdapter (ref)  │
│  - execute()│                     │  - execute()         │
└─────────────┘                    └──────────────────────┘
```

- **GUIAdapter creates commands**: Instantiates commands when actions are triggered
- **Commands receive GUIAdapter reference**: Can access `circuitService`, `circuitRenderer`, etc.
- **Commands call GUIAdapter methods**: Like `guiAdapter.circuitRenderer.render()` to update display
- **Both stay generic**: Neither has hardcoded knowledge of specific element types

---

## Step 7: Complete Integration Checklist

✅ **Domain Entity Created**: `MyInductor.js` extends `Element`  
✅ **Renderer Created**: `MyInductorRenderer.js` extends `ElementRenderer`  
✅ **Element Registered**: Added to `ElementRegistry` in `registry.js`  
✅ **Renderer Registered**: Added to `rendererFactory` in `registry.js`  
✅ **Menu Entry Added**: Added to `menu.bindings.js`  
✅ **(Optional) Custom Command**: Created and registered if needed  
✅ **GUIAdapter Unchanged**: Verified no modifications to core framework  

### Testing Your Integration

1. **Start the application**
   ```bash
   npm start
   ```

2. **Add your component**
   - Use menu: **Elements → Add Inductor**
   - Or keyboard: **Ctrl+Shift+L**

3. **Verify rendering**
   - Component appears on canvas
   - Selection/hover states work
   - Properties are correct

4. **Test commands**
   - Undo/redo works
   - Custom commands execute correctly

---

## Architecture Validation

Your extension respects the **Hexagonal Architecture** principles:

### Domain Independence
```javascript
// ✅ MyInductor has NO GUI dependencies
import { Element } from './Element.js';  // Domain only
// ❌ NO imports from /gui/ or /application/
```

### Registry Pattern Enables Extensibility
```javascript
// Framework discovers extensions through registries
// Not through hardcoded type checks or switch statements
const factory = ElementRegistry.get(type);  // Generic!
const renderer = rendererFactory.create(type, ctx);  // Generic!
```

### Open-Closed Principle
- **Closed**: GUIAdapter source code unchanged
- **Open**: New behavior added via registries

---

## Common Pitfalls

### ❌ Pitfall 1: Modifying GUIAdapter

```javascript
// DON'T DO THIS
class GUIAdapter {
  addMyInductor() { /* WRONG */ }
}
```

**Solution**: Use `ElementRegistry` and existing `AddElementCommand`

### ❌ Pitfall 2: Wrong Properties Type

```javascript
// DON'T DO THIS
const props = { 
  inductance: 5e-9,
  color: 'blue'  // ❌ Properties rejects strings!
};
```

**Solution**: Only use `float`, `"variable"`, or `undefined` in Properties

### ❌ Pitfall 3: Registering Factory Instead of Constructor

```javascript
// DON'T DO THIS
rendererFactory.register('MyInductor', () => new MyInductorRenderer());  // ❌ Wrong!
```

**Solution**: Pass the Constructor directly
```javascript
rendererFactory.register('MyInductor', MyInductorRenderer);  // ✅ Correct
```

### ❌ Pitfall 4: Accessing Properties Incorrectly

```javascript
// DON'T DO THIS
element.properties.inductance  // ❌ Undefined!
```

**Solution**: Access through `.values`
```javascript
element.properties.values.inductance  // ✅ Correct
```

---

## Next Steps

- **Study existing components**: See [`Resistor.js`](../../src/domain/entities/Resistor.js), [`Capacitor.js`](../../src/domain/entities/Capacitor.js)
- **Read architecture docs**: [Hexagonal Architecture](./architecture.md)
- **Explore command system**: [Commands Guide](./commands-guide.md)
- **Add tests**: Create integration tests like [`ExtensionIntegration.test.js`](../../tests/integration/ExtensionIntegration.test.js)

---

## Summary

You've learned to extend JSCircuit Editor by:

1. ✅ Creating domain entities with proper value objects
2. ✅ Building GUI renderers for visual representation
3. ✅ Registering components in `registry.js` (the **only** file you modify)
4. ✅ Understanding GUIAdapter's generic coordination
5. ✅ Integrating with menus through configuration
6. ✅ Creating custom commands with bidirectional GUIAdapter relationships

**The key principle**: The framework discovers your extensions through registries, making it **closed for modification, open for extension**.

Happy extending! 🚀
