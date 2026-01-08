# Extend JSCircuit: Complete Tutorial

**Learn how to add custom elements to JSCircuit**

This tutorial shows you how to add custom elements to JSCircuit by creating a complete `MyInductor` component. You'll learn how to create your element's logic, make it appear on screen, and integrate it into the menu - all without modifying the core framework. 

Another important goal for this tutorial, is to reveal how the software architecture is designed for extensibility.

---

## What You'll Build

By the end of this tutorial, you'll have created a fully functional custom inductor element that:

- ✅ Has its own data and behavior
- ✅ Renders on the canvas with custom graphics
- ✅ Works without modifying core files
- ✅ Appears in the menu with keyboard shortcuts
- ✅ Supports undo/redo and all standard operations

## What You'll Learn

- How to use registries to plug in new components
- How to configure menus and shortcuts
- How to create custom command
- How the framework discovers your elements automatically


Let's dive in! 🚀

---

## Prerequisites

- Basic understanding of JavaScript ES6+ classes
- Node.js and npm installed
- A code editor (VS Code recommended)

## Setup

**1. Install dependencies:**
```bash
cd qucat-circuit-generator
npm install
```

**2. Build and run locally:**
```bash
npm run serve
```

This will:
- Bundle the application
- Start a local server at `http://127.0.0.1:8080`
- Watch for changes and rebuild automatically

**3. Open your browser:**
- Navigate to `http://127.0.0.1:8080`
- You should see the circuit editor

Now you're ready to add your custom element!

---

## Tutorial Overview
In this tutorial we will use the term "element" and "component" interchangeably to refer to circuit elements like resistors, capacitors, and our custom inductor.

We'll build a custom `MyInductor` element through these steps:

1. **Create Element Class** - The data and behavior
2. **Create Renderer** - How it looks on screen
3. **Register Components** - Tell the framework about them
4. **Behind the Scenes** - How it all works
5. **Menu Integration** - Add it to the UI
6. **Custom Commands** (Optional) - Advanced features
7. **Test Integration** - Make sure it works

---

## Step 1: Create Element Class

**Create this file in the following path**: `src/domain/entities/MyInductor.js`

The element class contains the data and behavior of your component. It doesn't know anything about how it's displayed.

### Key Requirements:
- Extend the `Element` base class
- Use `Position`, `Label`, and `Properties` types
- Store your element's specific data

```javascript
import { Element } from '../entities/Element.js';
import { Label } from '../valueObjects/Label.js';
import { Properties } from '../valueObjects/Properties.js';

/**
 * MyInductor - A custom inductor element
 */
export class MyInductor extends Element {
  /**
   * Creates a MyInductor instance
   * 
   * @param {string} id - Unique identifier
   * @param {Position[]} nodes - Connection points (array of Position objects)
   * @param {string|Label} label - Display label
   * @param {Object|Properties} properties - Element properties
   */
  constructor(id, nodes, label, properties = {}) {
    // Convert label to Label object if needed
    const labelInstance = label instanceof Label ? label : new Label(label || 'L1');
    
    // Convert properties to Properties object
    // Note: Properties only accepts numbers, "variable", or undefined
    const validProps = {};
    if (properties.inductance !== undefined) {
      validProps.inductance = properties.inductance;
    } else {
      validProps.inductance = 5e-9; // default: 5 nanohenries
    }
    const propsInstance = properties instanceof Properties 
      ? properties 
      : new Properties(validProps);
    
    // Call parent constructor
    super(id, nodes, labelInstance, propsInstance);
    
    // Set the type (used by framework to identify this element)
    this.type = 'MyInductor';
  }
}
```

### Important Notes:

1. **Label**: Must be a `Label` object (not a plain string)

2. **Properties**: Must be a `Properties` object (not a plain object)

3. **Position**: Nodes, i.e. component terminals must be `Position` objects

### Keep It Simple at this level:
- ✅ No imports from `src/gui/`
- ✅ No rendering code here
- ✅ Only data and basic behavior

---

## Testing Step 1: Unit Tests for Element Class

**Why Unit Testing?**

Unit tests are essential for verifiable, maintainable code:
- ✅ **Confidence**: Know your code works before integrating
- ✅ **Documentation**: Tests show how to use your code
- ✅ **Refactoring Safety**: Change code without breaking functionality
- ✅ **Modularity Validation**: If it's hard to test, it's poorly designed

Since JSCircuit is highly modular, each component can be tested independently. You can write tests **before** (Test-Driven Development) or **after** implementation, but we highly recommend writing them.

### Create Test File

**File**: `tests/integration/TutorialValidation.test.js`

```javascript
import { expect } from 'chai';
import { MyInductor } from '../../src/domain/entities/MyInductor.js';
import { Position } from '../../src/domain/valueObjects/Position.js';
import { Label } from '../../src/domain/valueObjects/Label.js';
import { Properties } from '../../src/domain/valueObjects/Properties.js';
import { Element } from '../../src/domain/entities/Element.js';

describe('Extension Tutorial Validation', () => {
  describe('Step 1: Create Element Class', () => {

    it('should create MyInductor class that extends Element', () => {
      // Arrange: Create nodes for the inductor
      const node1 = new Position(0, 0);
      const node2 = new Position(50, 0);

      // Act: Create the inductor
      const inductor = new MyInductor('1', [node1, node2], 'L1', { inductance: 10e-9 });

      // Assert: Verify it's the correct type
      expect(inductor).to.be.instanceOf(Element);
      expect(inductor).to.be.instanceOf(MyInductor);
    });

    it('should set type to "MyInductor"', () => {
      const node1 = new Position(0, 0);
      const node2 = new Position(50, 0);
      const inductor = new MyInductor('1', [node1, node2], 'L1');

      // The framework uses this type to look up renderers and factories
      expect(inductor.type).to.equal('MyInductor');
    });

    it('should accept string label and convert to Label instance', () => {
      const node1 = new Position(0, 0);
      const node2 = new Position(50, 0);

      // Passing a plain string - should be converted internally
      const inductor = new MyInductor('1', [node1, node2], 'L1');

      expect(inductor.label).to.be.instanceOf(Label);
      expect(inductor.label.value).to.equal('L1');
    });

    it('should accept plain object properties and convert to Properties instance', () => {
      const node1 = new Position(0, 0);
      const node2 = new Position(50, 0);

      // Passing plain object - should be converted internally
      const inductor = new MyInductor('1', [node1, node2], 'L1', { inductance: 10e-9 });

      expect(inductor.properties).to.be.instanceOf(Properties);
      expect(inductor.properties.values.inductance).to.equal(10e-9);
    });

    it('should use default inductance of 5e-9 when not provided', () => {
      const node1 = new Position(0, 0);
      const node2 = new Position(50, 0);
      const inductor = new MyInductor('1', [node1, node2], 'L1');

      // Default value should be applied
      expect(inductor.properties.values.inductance).to.equal(5e-9);
    });

    it('should store nodes as Position objects', () => {
      const node1 = new Position(0, 0);
      const node2 = new Position(50, 0);
      const inductor = new MyInductor('1', [node1, node2], 'L1');

      expect(inductor.nodes).to.have.lengthOf(2);
      expect(inductor.nodes[0]).to.be.instanceOf(Position);
      expect(inductor.nodes[1]).to.be.instanceOf(Position);
    }); 
  });
});
```

### Run the Tests

```bash
npm test -- tests/integration/TutorialValidation.test.js
```

**Expected output:**
```
Extension Tutorial Validation
  Step 1: Create Element Class
    ✔ should create MyInductor class that extends Element
    ✔ should set type to "MyInductor"
    ✔ should accept string label and convert to Label instance
    ✔ should accept plain object properties and convert to Properties instance
    ✔ should use default inductance of 5e-9 when not provided
    ✔ should store nodes as Position objects

7 passing
```

### What We're Testing

1. **Inheritance** - Verifies `MyInductor` extends `Element`
2. **Type System** - Ensures `type` property is set correctly
3. **Type Conversion** - Tests automatic conversion from plain types to value objects
4. **Default Values** - Validates default inductance is applied
5. **Data Storage** - Confirms nodes are stored correctly
6. **Layer Separation** - Proves no GUI dependencies leak into domain

**Key Testing Principle**: Test behavior, not implementation. We verify that our element works correctly, not how it achieves it internally.

---

## Step 2: Create Renderer

**Create this file in the following path**: `src/gui/renderers/MyInductorRenderer.js`

The renderer handles how your element looks on screen. It's completely separate from the element's data.

```javascript
import { ElementRenderer } from './ElementRenderer.js';

/**
 * MyInductorRenderer - Renders MyInductor elements on canvas
 * 
 * Keep it simple: Just draw lines representing the element
 */
export class MyInductorRenderer extends ElementRenderer {
  /**
   * Renders the inductor on the canvas
   * 
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {MyInductor} element - The element to render
   * @param {boolean} isSelected - Whether element is selected
   * @param {boolean} isHovered - Whether element is hovered
   */
  render(ctx, element, isSelected, isHovered) {
    // Change color based on selection state
    ctx.strokeStyle = isSelected ? '#e74c3c' : '#3498db';
    ctx.lineWidth = isSelected ? 3 : 2;
    
    // Draw a simple line between the two nodes
    const [start, end] = element.nodes;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    
    // Draw label if present
    if (element.label) {
      ctx.fillStyle = '#2c3e50';
      ctx.font = '12px Arial';
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      ctx.fillText(element.label.value, midX, midY - 10);
    }
  }
}
```

### Renderer Guidelines:
- ✅ Extends `ElementRenderer`
- ✅ Implements `render(ctx, element, isSelected, isHovered)`
- ✅ No business logic - only drawing commands
- ✅ Keep it simple - you can make it fancy later!

---

## Testing Step 2: Unit Tests for Renderer

**Why Test Renderers?**

Renderers are purely presentational - they translate data into visuals. Testing them ensures:
- ✅ **Visual State Changes**: Selection/hover states render correctly
- ✅ **No Side Effects**: Renderers don't modify element data
- ✅ **Layer Separation**: No business logic in presentation layer

### Add Tests to TutorialValidation.test.js

Add this to your test file:

```javascript
describe('Step 2: Create Renderer', () => {
  let MyInductorRenderer;
  
  before(async () => {
    // Dynamically import the renderer after it's created
    const module = await import('../../src/gui/renderers/MyInductorRenderer.js');
    MyInductorRenderer = module.MyInductorRenderer;
  });
  
  it('should extend ElementRenderer', async () => {
    const { ElementRenderer } = await import('../../src/gui/renderers/ElementRenderer.js');
    const renderer = new MyInductorRenderer();
    
    // Renderer must extend base class for framework integration
    expect(renderer).to.be.instanceOf(ElementRenderer);
  });
  
  it('should have a render method', () => {
    const renderer = new MyInductorRenderer();
    
    // Render method is required by the framework
    expect(renderer.render).to.be.a('function');
  });
  
  it('should change stroke style based on selection state', () => {
    const renderer = new MyInductorRenderer();
    
    // Create mock canvas context to capture drawing calls
    const mockCtx = {
      strokeStyle: null,
      lineWidth: null,
      fillStyle: null,
      font: null,
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      fillText: () => {}
    };
    
    // Create mock element
    const node1 = new Position(0, 0);
    const node2 = new Position(100, 0);
    const mockElement = new MyInductor('test', [node1, node2], 'L1');
    
    // Test unselected state - should use blue
    renderer.render(mockCtx, mockElement, false, false);
    expect(mockCtx.strokeStyle).to.equal('#3498db');
    expect(mockCtx.lineWidth).to.equal(2);
    
    // Test selected state - should use red and thicker line
    renderer.render(mockCtx, mockElement, true, false);
    expect(mockCtx.strokeStyle).to.equal('#e74c3c');
    expect(mockCtx.lineWidth).to.equal(3);
  });
  
  it('should draw line between element nodes', () => {
    const renderer = new MyInductorRenderer();
    
    // Capture the drawing coordinates
    let moveToX, moveToY, lineToX, lineToY;
    const mockCtx = {
      strokeStyle: null,
      lineWidth: null,
      fillStyle: null,
      font: null,
      beginPath: () => {},
      moveTo: (x, y) => { moveToX = x; moveToY = y; },
      lineTo: (x, y) => { lineToX = x; lineToY = y; },
      stroke: () => {},
      fillText: () => {}
    };
    
    const node1 = new Position(10, 20);
    const node2 = new Position(110, 120);
    const mockElement = new MyInductor('test', [node1, node2], 'L1');
    
    renderer.render(mockCtx, mockElement, false, false);
    
    // Verify line is drawn from start to end
    expect(moveToX).to.equal(10);
    expect(moveToY).to.equal(20);
    expect(lineToX).to.equal(110);
    expect(lineToY).to.equal(120);
  });
  
  it('should draw label at midpoint if present', () => {
    const renderer = new MyInductorRenderer();
    
    // Capture label drawing
    let labelText, labelX, labelY;
    const mockCtx = {
      strokeStyle: null,
      lineWidth: null,
      fillStyle: null,
      font: null,
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      fillText: (text, x, y) => { labelText = text; labelX = x; labelY = y; }
    };
    
    const node1 = new Position(0, 0);
    const node2 = new Position(100, 100);
    const mockElement = new MyInductor('test', [node1, node2], 'L5');
    
    renderer.render(mockCtx, mockElement, false, false);
    
    // Label should be at midpoint, slightly above the line
    expect(labelText).to.equal('L5');
    expect(labelX).to.equal(50); // (0 + 100) / 2
    expect(labelY).to.equal(40); // (0 + 100) / 2 - 10
  });

  it('should not have business logic or domain knowledge', () => {
    const renderer = new MyInductorRenderer();

    // Renderer should ONLY handle drawing - no domain logic
    expect(renderer.calculateInductance).to.be.undefined;
    expect(renderer.validateProperties).to.be.undefined;
    expect(renderer.updateProperties).to.be.undefined;
  });
});
```

### Run the Tests

```bash
npm test -- tests/integration/TutorialValidation.test.js
```

**Expected output:**
```
Extension Tutorial Validation
  Step 1: Create Element Class
    ✔ should create MyInductor class that extends Element
    ✔ should set type to "MyInductor"
    ✔ should accept string label and convert to Label instance
    ✔ should accept plain object properties and convert to Properties instance
    ✔ should use default inductance of 5e-9 when not provided
    ✔ should store nodes as Position objects
  Step 2: Create Renderer
    ✔ should extend ElementRenderer
    ✔ should have a render method
    ✔ should change stroke style based on selection state
    ✔ should draw line between element nodes
    ✔ should draw label at midpoint if present
    ✔ should not have business logic or domain knowledge

13 passing
```

### What We're Testing

1. **Inheritance** - Renderer extends `ElementRenderer`
2. **API Contract** - Has required `render()` method
3. **Visual States** - Different colors for selected/unselected
4. **Drawing Logic** - Draws lines between correct coordinates
5. **Label Positioning** - Label appears at midpoint
6. **Layer Purity** - No domain/business logic in renderer

**Testing Pattern**: Use mock canvas context to verify drawing calls without actually rendering to a canvas. This makes tests fast and deterministic.

---

## Step 3: Register Your Components

**Add the new component to the registry**: `src/config/registry.js` (This is where you plug everything in)

This is the **only core file you modify**. You're just telling the framework "hey, I have a new element type!"

### 3.1 Add Imports

At the top of `registry.js`, add your imports:

```javascript
import { MyInductor } from '../domain/entities/MyInductor.js';
import { MyInductorRenderer } from '../gui/renderers/MyInductorRenderer.js';
```

### 3.2 Register Element Factory

Find the section after the main element registration block (after the closing `}` of the `if` statement around line 153). Add your element registration:

```javascript
// Tutorial: Register custom MyInductor element (outside guard to ensure it's always registered)
ElementRegistry.register('MyInductor', (id = generateId('L'), nodes, label = null, properties = new Properties({})) => {
    // Handle both Properties instances and plain objects
    let finalProps;
    if (properties instanceof Properties) {
        finalProps = properties;
    } else {
        // Plain object - merge with defaults
        const propsObject = typeof properties === 'object' && properties !== null ? properties : {};
        finalProps = new Properties({ inductance: propsObject.inductance || 5e-9 });
    }
    // Ensure inductance is set
    if (finalProps.values.inductance === undefined) {
        finalProps.values.inductance = 5e-9;
    }
    return new MyInductor(id, nodes, label, finalProps);
});
```

**Why outside the guard?** The `if (ElementRegistry.getTypes().length === 0)` guard prevents duplicate registrations. By placing MyInductor outside this guard, we ensure it's always registered when the module loads.

### 3.3 Register Renderer

Find the renderer registration section (around line 190). Add your renderer:

```javascript
rendererFactory.register('myinductor', MyInductorRenderer);
```

**Important**: Use lowercase for the renderer key (`'myinductor'`) while the element type uses PascalCase (`'MyInductor'`). This is the framework's convention.

### Complete Example

Your registry.js should look like this:

```javascript
// ... existing imports ...
import { MyInductor } from '../domain/entities/MyInductor.js';
import { MyInductorRenderer } from '../gui/renderers/MyInductorRenderer.js';

// ... existing element registrations in guard block ...

}

// Tutorial: Register custom MyInductor element
ElementRegistry.register('MyInductor', (id = generateId('L'), nodes, label = null, properties = new Properties({})) => {
    let finalProps;
    if (properties instanceof Properties) {
        finalProps = properties;
    } else {
        const propsObject = typeof properties === 'object' && properties !== null ? properties : {};
        finalProps = new Properties({ inductance: propsObject.inductance || 5e-9 });
    }
    if (finalProps.values.inductance === undefined) {
        finalProps.values.inductance = 5e-9;
    }
    return new MyInductor(id, nodes, label, finalProps);
});

// ... renderer factory setup ...
const rendererFactory = new RendererFactory();
rendererFactory.register('resistor', ResistorRenderer);
// ... other renderers ...
rendererFactory.register('myinductor', MyInductorRenderer);
```

### How Registries Work:

**ElementRegistry** - Creates elements:
```javascript
// You register a factory function that creates your element
ElementRegistry.register('MyInductor', (id, nodes, label, props) => {
  return new MyInductor(id, nodes, label, props);
});

// Framework uses it when needed:
const factory = ElementRegistry.get('MyInductor');
const element = factory('id-1', [pos1, pos2], 'L1', { inductance: 10e-9 });
```

**RendererFactory** - Draws elements:
```javascript
// You register your renderer class
rendererFactory.register('myinductor', MyInductorRenderer);

// Framework creates instances when drawing:
const renderer = rendererFactory.create('myinductor', ctx);
renderer.render(ctx, element, isSelected, isHovered);
```

### Why This Works:
- ✅ Framework discovers your elements automatically
- ✅ No hardcoded element names in core files
- ✅ You extend without modifying core code
- ✅ Clean separation between different elements

### Testing Step 3

Add these tests to verify registration works:

```javascript
describe('Step 3: Register Components', () => {
  
  it('should register MyInductor in ElementRegistry', () => {
    // Verify MyInductor is registered
    const factory = ElementRegistry.get('MyInductor');
    expect(factory).to.be.a('function');
  });
  
  it('should create MyInductor instances via ElementRegistry', () => {
    // Get factory and create an element
    const factory = ElementRegistry.get('MyInductor');
    const node1 = new Position(0, 0);
    const node2 = new Position(50, 0);
    const inductor = factory('test-id', [node1, node2], 'L1', { inductance: 10e-9 });
    
    // Should create a proper MyInductor instance
    expect(inductor).to.be.instanceOf(MyInductor);
    expect(inductor.type).to.equal('MyInductor');
    expect(inductor.properties.values.inductance).to.equal(10e-9);
  });
  
  it('should register MyInductorRenderer in RendererFactory', () => {
    // Verify renderer is registered (lowercase 'myinductor')
    const renderer = rendererFactory.create('myinductor');
    expect(renderer).to.be.an('object');
  });
  
  it('should create MyInductorRenderer instances via RendererFactory', () => {
    // Create renderer via factory
    const renderer = rendererFactory.create('myinductor');
    
    // Should be correct type
    expect(renderer).to.be.instanceOf(MyInductorRenderer);
    expect(renderer.render).to.be.a('function');
  });
  
  it('should integrate element and renderer through registries', () => {
    // Create element via registry
    const factory = ElementRegistry.get('MyInductor');
    const node1 = new Position(0, 0);
    const node2 = new Position(50, 0);
    const element = factory('test-id', [node1, node2], 'L1', {});
    
    // Get renderer via factory
    const renderer = rendererFactory.create('myinductor');
    
    // Should work together (no errors when rendering)
    const mockCtx = createMockCanvas();
    expect(() => {
      renderer.render(mockCtx, element, false, false);
    }).to.not.throw();
  });
  
  it('should prove no GUIAdapter modification needed', () => {
    // Grep for MyInductor in core adapter files
    const { execSync } = require('child_process');
    const result = execSync('grep -r "MyInductor" src/gui/adapters/ || echo "not found"')
      .toString();
    
    // Should not find MyInductor in core files
    expect(result).to.include('not found');
  });
});
```

**What We Test**:
1. **Element Registration** - Factory function exists and creates instances
2. **Renderer Registration** - Renderer can be created via factory
3. **Factory Behavior** - Factory handles properties correctly
4. **Integration** - Element and renderer work together
5. **Architectural Proof** - Core files don't reference MyInductor

---

## Behind the Scenes - How It Works

Now that you've created your element, renderer, and registered them, let's see what happens when someone uses it.

### Basic Flow for creating and rendering `MyInductor`:

1. **Element Creation** → Framework looks up `'MyInductor'` in `ElementRegistry`
2. **Your Factory Runs** → Creates `new MyInductor(...)`
3. **Element Added** → Added to the circuit
4. **Rendering** → Framework looks up `'myinductor'` in `rendererFactory`
5. **Your Renderer Runs** → `MyInductorRenderer.render()` draws it

**The key point**: The framework discovers your extension automatically through registries.

### Why This Approach

Instead of editing core files and adding `if` statements like:
```javascript
if (type === 'MyInductor') {
  // special code for inductors
}
```

You register your components once, and the framework handles everything.

### Verify It Works

Search core files for your element:
```bash
grep -r "MyInductor" src/gui/adapters/ src/gui/renderers/CircuitRenderer.js
# Result: No matches! Core files don't know about MyInductor
```

Your extension only exists in:
- ✅ `src/domain/entities/MyInductor.js` (your element)
- ✅ `src/gui/renderers/MyInductorRenderer.js` (your renderer)
- ✅ `src/config/registry.js` (your registration)
- ✅ `src/config/menu.config.yaml` (your menu entry)

---

## Step 5: Menu Integration

Now let's add a menu item so users can insert your element with a keyboard shortcut.

### Edit the Menu Configuration

**File**: `src/config/menu.config.yaml`

Add your element to the Insert menu:

```yaml
menus:
  - label: Insert
    items:
      # ... existing elements (Wire, Junction, Inductor, Capacitor, etc.) ...
      
      # Add your custom element:
      - id: insert.myInductor
        label: My Inductor
        shortcut: Shift+I
        action: { kind: command, name: addElement, args: ["MyInductor"] }
```

That's it! The YAML configuration automatically:
1. **Creates menu bindings** → Compiles to `dist/static/menu.config.json`
2. **Generates keyboard shortcuts** → `menu.bindings.js` exports ACTIONS and KEYMAP
3. **Routes to commands** → `addElement` command uses `args[0]` to get "MyInductor"

### How It Works Behind the Scenes:

When you run `npm run serve`, the build process:

1. **Compiles YAML** → Creates `dist/static/menu.config.json`
2. **Auto-generates `menu.bindings.js`** → Imports the JSON and exports:
   - `ACTIONS`: Maps IDs like `insert.myInductor` to action specs
   - `KEYMAP`: Maps shortcuts like `Shift+I` to action IDs

3. **GUIAdapter handles the action**:
   ```javascript
   // When user presses Shift+I:
   const spec = ACTIONS["insert.myInductor"];
   // spec = { kind: "command", name: "addElement", args: ["MyInductor"] }
   
   const cmd = GUICommandRegistry.get("addElement", circuitService, circuitRenderer, elementRegistry, "MyInductor");
   // Returns: new AddElementCommand(..., "MyInductor")
   
   commandHistory.executeCommand(cmd, circuitService);
   ```

4. **AddElementCommand creates the element**:
   ```javascript
   // Inside AddElementCommand.execute():
   const elementClass = this.elementRegistry.get(this.elementType); // Gets MyInductor class
   const element = new elementClass(id, nodes, label, properties);
   ```

### No Code Changes Needed!

You don't modify:
- ❌ `menu.bindings.js` (auto-generated)
- ❌ `GUIAdapter.js` (generic command handler)
- ❌ `AddElementCommand.js` (uses ElementRegistry dynamically)

You only:
- ✅ Edit `menu.config.yaml`
- ✅ Run `npm run serve` (compiles YAML)
- ✅ Test with keyboard shortcut

---

## Step 6: Custom Commands (Optional)

For new features beyond element creation, you can create custom commands.

### Example: Export Circuit as PNG

Let's say you want to add a feature to export the circuit as a PNG image.

**File**: `src/gui/commands/ExportPngCommand.js`

```javascript
import { GUICommand } from './GUICommand.js';

/**
 * ExportPngCommand - Export circuit to PNG image
 */
export class ExportPngCommand extends GUICommand {
  constructor(circuitService, circuitRenderer) {
    super();
    this.circuitService = circuitService;
    this.circuitRenderer = circuitRenderer;
  }

  execute() {
    // Get canvas data as PNG
    const canvas = this.circuitRenderer.canvas;
    const dataURL = canvas.toDataURL('image/png');
    
    // Trigger download
    const link = document.createElement('a');
    link.download = 'circuit.png';
    link.href = dataURL;
    link.click();
  }

  // No undo for export operations
  undo() {}
  redo() {}
}
```

### Register the Command:

**File**: `src/config/registry.js` (Add to existing command registrations)

```javascript
import { ExportPngCommand } from '../gui/commands/ExportPngCommand.js';

GUICommandRegistry.register('exportPng', (circuitService, circuitRenderer) => {
  return new ExportPngCommand(circuitService, circuitRenderer);
});
```

### Add to Menu:

**File**: `src/config/menu.config.yaml`

```yaml
menus:
  - label: File
    items:
      # ... existing items ...
      
      - id: file.exportPng
        label: Export as PNG
        shortcut: Ctrl+Shift+P
        action: { kind: command, name: exportPng }
```

### When You Need More Than Commands:

Some features need both a **command** and an **output adapter**:

- **Export to PNG** → Just a command (like above)
- **Export to Netlist** → Command + Output Adapter (like the existing netlist adapter)
- **Import from file** → Command + Input Adapter

**Output adapters** transform your circuit data into different formats. For example, the existing netlist adapter converts the circuit into SPICE format. If you wanted to export to other formats (JSON, XML, etc.), you'd create an adapter in `src/infrastructure/adapters/` alongside the command

---

## Step 7: Complete Integration (Proving Open-Closed Principle)

Let's verify the complete integration works without modifying GUIAdapter.

### Integration Checklist:

#### ✅ Domain Entity Created
- [ ] `MyInductor` class extends `Element`
- [ ] Uses `Label` and `Properties` value objects
- [ ] Implements `toNetlistEntry()` or domain-specific methods
- [ ] No GUI dependencies

#### ✅ Renderer Created
- [ ] `MyInductorRenderer` extends `ElementRenderer`
- [ ] Implements `render(ctx, element, isSelected, isHovered)`
- [ ] No business logic

#### ✅ Registrations Complete
- [ ] `ElementRegistry.register('MyInductor', factory)` in registry.js
- [ ] `rendererFactory.register('MyInductor', MyInductorRenderer)` in registry.js
- [ ] Optional: Custom commands registered in `GUICommandRegistry`

#### ✅ Menu Integration
- [ ] Action added to `menu.bindings.js`
- [ ] Keyboard shortcut configured
- [ ] Action calls `guiAdapter.setPendingElementType('MyInductor')`

#### ✅ Core Framework Unchanged
- [ ] Run `grep -r "MyInductor" src/gui/adapters/` → No matches
- [ ] Core framework files have same line count before/after
- [ ] All coordination happens through registries

### Test the Integration:

**Test File**: `tests/manual/test-my-inductor.js` (or in browser console)

```javascript
// Create a test circuit
import { Circuit } from './src/domain/entities/Circuit.js';
import { Position } from './src/domain/valueObjects/Position.js';
import { ElementRegistry } from './src/config/registry.js';

// Get the factory from registry (GUIAdapter does this internally)
const factory = ElementRegistry.get('MyInductor');

// Create element
const node1 = new Position(0, 0);
const node2 = new Position(50, 0);
const inductor = factory('L1', [node1, node2], 'My Custom Inductor', { 
  inductance: 10e-9 
});

console.log(inductor.type); // 'MyInductor'
console.log(inductor.toNetlistEntry()); // 'LL1 0,0 50,0 1e-08'

// Add to circuit
circuit.elements.push(inductor);

// Render - MyInductorRenderer.render() is called automatically!
framework.render();
```

### Proof of Open-Closed Principle:

**Before MyInductor:**
```bash
$ wc -l src/gui/adapters/GUIAdapter.js
342 src/gui/adapters/GUIAdapter.js
```

**After MyInductor:**
```bash
$ wc -l src/gui/adapters/GUIAdapter.js
342 src/gui/adapters/GUIAdapter.js  # Same line count!
```

**Search for element-specific code:**
```bash
$ grep -r "Resistor\|Capacitor\|Inductor" src/gui/adapters/
# No matches found - Core is type-agnostic!
```

---

## Architecture: How the Pieces Fit

### Separation of Concerns

```
┌─────────────────────────────────────────────────────────┐
│                    GUI Layer                           │
│                                                          │
│  Framework Coordinator ────┐                            │
│  MyInductorRenderer        │                            │
│  Commands                  │                            │
│  Menu Actions              │                            │
└────────────────────────────┼─────────────────────────────┘
                             │
                             │ uses
                             ↓
┌─────────────────────────────────────────────────────────┐
│                  Element Classes                        │
│                                                          │
│  MyInductor (your data & behavior)                     │
│  Circuit                                                │
│  Element                                                │
│  Position, Label, Properties                            │
└─────────────────────────────────────────────────────────┘
```

**Key Point**: GUI depends on elements, but elements don't know about GUI.

### How Registries Work

```
┌──────────────┐
│  Framework   │ ←─── Asks for elements/renderers
│  Coordinator │
└───────┬──────┘
        │
        │ looks up in
        ↓
┌──────────────────────┐
│   ElementRegistry    │ ←─── You register here
│   RendererFactory    │
│   GUICommandRegistry │
└──────────┬───────────┘
           │
           │ returns
           ↓
┌──────────────────────┐
│   MyInductor         │ ←─── Your code
│   MyInductorRenderer │
└──────────────────────┘
```

### Testing Your Element

You can test your element separately from the GUI:

**Test File**: `tests/unit/MyInductor.test.js`

```javascript
// Test element data and behavior
describe('MyInductor', () => {
  it('should create with correct properties', () => {
    const node1 = new Position(0, 0);
    const node2 = new Position(50, 0);
    const inductor = new MyInductor('L1', [node1, node2], 'Test', { 
      inductance: 10e-9 
    });
    
    expect(inductor.properties.values.inductance).toBe(10e-9);
    expect(inductor.type).toBe('MyInductor');
  });
});
```

**Test File**: `tests/unit/MyInductorRenderer.test.js`

```javascript
// Test rendering separately
describe('MyInductorRenderer', () => {
  it('should render coil symbol', () => {
    const mockCtx = createMockCanvas2DContext();
    const mockElement = { type: 'MyInductor', nodes: [...] };
    const renderer = new MyInductorRenderer();
    
    renderer.render(mockCtx, mockElement, false, false);
    
    expect(mockCtx.arc).toHaveBeenCalled();
  });
});
```

### Run the Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/unit/MyInductor.test.js

# Run integration tests
npm test -- tests/integration/
```

---

## Common Pitfalls & Solutions

### ❌ Pitfall 1: Plain String Label
```javascript
// WRONG - Element will throw error
const inductor = new MyInductor('1', nodes, 'L1', props);
// Error: "Label must be an instance of Label or null"
```

✅ **Solution**: Wrap in Label or handle in constructor

**In your code**: `src/domain/entities/MyInductor.js`

```javascript
// Either wrap explicitly:
const inductor = new MyInductor('1', nodes, new Label('L1'), props);

// Or handle in constructor (recommended):
constructor(id, nodes, label, properties) {
  const labelInstance = label instanceof Label ? label : new Label(label);
  super(id, nodes, labelInstance, ...);
}
```

### ❌ Pitfall 2: Invalid Property Types
```javascript
// WRONG - Properties only accepts float, "variable", or undefined
const props = new Properties({ 
  inductance: 10e-9,
  color: 'blue',      // ❌ String not allowed!
  isActive: true      // ❌ Boolean not allowed!
});
// Error: "Invalid value for property 'color'"
```

✅ **Solution**: Use floats or external metadata

**In your domain entity**: `src/domain/entities/MyInductor.js`

```javascript
// Store only valid numeric properties
const props = new Properties({ 
  inductance: 10e-9,
  quality: 0.95  // Use float for any numeric property
});

// Store display preferences elsewhere (in renderer or state)
class MyInductorRenderer {
  render(ctx, element, isSelected, isHovered) {
    const color = isSelected ? 'red' : 'blue'; // Visual logic in renderer
    // ...
  }
}
```

### ❌ Pitfall 3: Modifying Core Framework
```javascript
// WRONG - Never modify core framework files
// File: src/gui/adapters/GUIAdapter.js
class GUIAdapter {
  handleMyInductor() {  // ❌ Don't add element-specific methods
    // ...
  }
}
```

✅ **Solution**: Use registries and commands

**In registry file**: `src/config/registry.js`

```javascript
// RIGHT - Extend through registries
ElementRegistry.register('MyInductor', factory);
rendererFactory.register('MyInductor', MyInductorRenderer);
```

### ❌ Pitfall 4: Renderer Factory Function
```javascript
// WRONG - Passing factory function instead of Constructor
rendererFactory.register('MyInductor', () => new MyInductorRenderer());
// Error: "RendererClass is not a constructor"
```

✅ **Solution**: Pass Constructor reference
```javascript
// RIGHT - Pass the class itself
rendererFactory.register('MyInductor', MyInductorRenderer);

// RendererFactory creates instances internally:
const renderer = rendererFactory.create('MyInductor', ctx);
```

---

## Summary: What You Learned

### ✅ How to Extend Without Breaking Things
- Created custom element without touching core files
- Used registries to plug in new functionality
- Framework discovers your elements automatically

### ✅ Separation of Concerns
- Element class: data and behavior
- Renderer class: visual display
- Clear boundary between the two

### ✅ Important Types
- `Position` for coordinates
- `Label` for text labels
- `Properties` for element data (numbers only!)

### ✅ How It All Works
```
User Action (Menu/Shortcut)
  → Framework looks up 'MyInductor' in ElementRegistry
  → Your factory creates new MyInductor(...)
  → Element added to circuit
  → Framework looks up 'MyInductor' in RendererFactory
  → Your renderer draws it on screen
```

---

## Next Steps

1. **Explore Existing Elements**: Study `Resistor.js`, `Capacitor.js` for patterns
2. **Read Architecture Docs**: [Architecture Notes](./Architecture_Notes.md)
3. **Run Tests**: `npm test -- tests/integration/ExtensionIntegration.test.js`
4. **Build Advanced Features**: 
   - Multi-node elements (3+ connection points)
   - Interactive properties (drag-to-resize)
   - Custom animations (pulse, highlight)
   - Compound elements (grouped components)

---

## Reference: Complete File Structure

```
src/
├── domain/
│   ├── entities/
│   │   ├── Element.js          (Base class)
│   │   └── MyInductor.js       ← YOU CREATE THIS
│   └── valueObjects/
│       ├── Position.js         (Framework provided)
│       ├── Label.js            (Framework provided)
│       └── Properties.js       (Framework provided)
├── gui/
│   ├── adapters/
│   │   └── GUIAdapter.js       ← DON'T MODIFY (framework handles this)
│   ├── renderers/
│   │   ├── ElementRenderer.js  (Base class)
│   │   └── MyInductorRenderer.js  ← YOU CREATE THIS
│   └── commands/
│       ├── GUICommand.js       (Base class)
│       └── CustomInductorCommand.js  ← OPTIONAL
└── config/
    ├── registry.js             ← YOU MODIFY THIS (registrations)
    └── menu.bindings.js        ← YOU MODIFY THIS (UI actions)
```

---

**Congratulations!** 🎉 

You've successfully extended JSCircuit with a custom element. Your element works seamlessly without modifying any core framework code - that's the power of the registry pattern!
