# Extend JSCircuit: Complete Tutorial

**Learn how to add custom elements to JSCircuit**

This tutorial shows you how to add custom elements to JSCircuit by creating a complete `MyInductor` component. You'll learn how to create your element's logic, make it appear on screen, and integrate it into the menu - all without modifying the core framework.

---

## What You'll Build

By the end of this tutorial, you'll have created a fully functional custom inductor element that:

- ✅ Has its own data and behavior
- ✅ Renders on the canvas with custom graphics
- ✅ Works without modifying core files
- ✅ Appears in the menu with keyboard shortcuts
- ✅ Supports undo/redo and all standard operations

## What You'll Learn

- How to separate element logic from visual display
- How the framework discovers your elements automatically
- How to use registries to plug in new components
- How to configure menus and shortcuts
- How to create custom commands (optional)

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

We'll build a custom `MyInductor` element through these steps:

1. **Create Element Class** - The data and behavior
2. **Create Renderer** - How it looks on screen
3. **Configure Property Panel** - How users edit properties (configuration-driven!)
4. **Register Components** - Tell the framework about them
5. **Behind the Scenes** - How it all works
6. **Menu Integration** - Add it to the UI
7. **Custom Commands** (Optional) - Advanced features
8. **Test Integration** - Make sure it works

---

## Step 1: Create Element Class

**Create this file in the following path**: `src/domain/entities/MyInductor.js`

The element class contains the data for a specific element, such as resistor, capacitor, or inductor. It doesn't know anything about how it's displayed.

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
    // IMPORTANT: Use lowercase - framework uses this for renderer and factory lookups
    this.type = 'myinductor';
  }
}
```

### Important Notes:

1. **Label**: Must be a `Label` object (not a plain string)
   - Handles validation automatically
   - Used for display

2. **Properties**: Must be a `Properties` object (not a plain object)
   - **Important**: Only accepts numbers, `"variable"`, or `undefined`
   - Cannot store strings like `"blue"` - use numbers instead
   - Access values via `properties.values.propertyName`

3. **Position**: Connection points must be `Position` objects
   - Framework provides these automatically

### Keep It Simple:
- ✅ No imports from `src/gui/`
- ✅ No rendering code here
- ✅ Only data and basic behavior

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

## Step 3: Configure Property Panel (NEW!)

**Configure property editing in YAML**: `src/config/gui.config.yaml`

The property panel now uses configuration decoupling to support extensibility. Add your element's property configuration:

```yaml
components:
  myinductor:
    menuLabel: My Inductor
    shortcut: Shift+I
    propertyPanel:
      title: "My Inductor Properties"
      description: "Custom inductor with configurable inductance"
      helpText: "Set inductance in Henry"
      fields:
        - key: inductance
          label: Inductance
          type: number
          unit: H
          placeholder: "5e-9"
        - key: label
          label: Label
          type: text
          unit: ""
          placeholder: ""
```

**How it works**:
- PropertyPanel loads `gui.config.yaml` (compiled to `gui.config.json` during build)
- When editing an element, it looks up the configuration by element type
- Fields are automatically generated as input fields with labels and units
- No code changes needed - pure configuration!

**Key field properties**:
- `key` - Property name in element.properties.values
- `type` - `"number"` or `"text"` 
- `label` - Display label in the property panel
- `unit` - Unit suffix shown after label (e.g., "H", "Ω", "F")
- `placeholder` - Hint text for input fields

---

## Step 4: Register Your Components

**Add the new component to the registry**: `src/config/registry.js` (This is where you plug everything in)

This is the **only core file you modify**. You're just telling the framework "hey, I have a new element type!"

```javascript
import { MyInductor } from '../domain/entities/MyInductor.js';
import { MyInductorRenderer } from '../gui/renderers/MyInductorRenderer.js';

// ... existing imports ...

/**
 * Register your custom element: MyInductor
 */

// Tell the framework how to create your element
// IMPORTANT: Use lowercase key to match element.type property
ElementRegistry.register('myinductor', (id, nodes, label, props) => {
  return new MyInductor(id, nodes, label, props);
});

// Tell the framework how to draw your element
// IMPORTANT: Use lowercase key to match element.type property
rendererFactory.register('myinductor', MyInductorRenderer);

// That's it! Your element is now integrated.
```

### How Registries Work:

**ElementRegistry** - Creates elements:
```javascript
// You register a function that creates your element
ElementRegistry.register('myinductor', (id, nodes, label, props) => {
  return new MyInductor(id, nodes, label, props);
});

// Framework uses it when needed:
const factory = ElementRegistry.get('myinductor');
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

---

## Step 5: Behind the Scenes - How It Works

Now that you've created your element, renderer, and registered them, let's see what happens when someone uses it.

### The Flow

When a user clicks "Add Inductor" in the menu:

1. **User Action** → Menu sets the pending element type to `'myinductor'`
2. **User Clicks Nodes** → Framework collects the connection points
3. **Element Creation** → Framework looks up `'myinductor'` in `ElementRegistry`
4. **Your Factory Runs** → Creates `new MyInductor(...)`
5. **Element Added** → Added to the circuit
6. **Rendering** → Framework looks up `'myinductor'` in `rendererFactory`
7. **Your Renderer Runs** → `MyInductorRenderer.render()` draws it

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
grep -r "myinductor" src/gui/adapters/ src/gui/renderers/CircuitRenderer.js
# Result: No matches! Core files don't know about myinductor
```

Your extension only exists in:
- ✅ `src/domain/entities/MyInductor.js` (your element class - PascalCase)
- ✅ `src/gui/renderers/MyInductorRenderer.js` (your renderer class - PascalCase)
- ✅ `src/config/registry.js` (registrations with lowercase `'myinductor'`)
- ✅ `src/config/gui.config.yaml` (config with lowercase `myinductor:` key)
- ✅ `src/config/menu.config.yaml` (menu entry with lowercase key)

---

## Step 5.5: Property Panel - The Open-Closed Principle in Action

The PropertyPanel system demonstrates how to extend functionality without modifying core code through **configuration decoupling**. This section explains how it works so you can leverage it for your custom elements.

### How PropertyPanel Works

When a user double-clicks an element to edit its properties:

1. **ElementSelected** → User double-clicks element of type `MyInductor`
2. **PropertyPanel.show()** → Called with element instance
3. **loadConfig()** → Fetches compiled `gui.config.json`
4. **generateContentForElement()** → Looks up `components.myInductor` in config
5. **createPanelHTML()** → Generates form fields from `propertyPanel.fields` array
6. **Form Rendered** → User sees input fields for `inductance` and `label`
7. **User edits** → Changes values
8. **onSave Callback** → Updates element properties via `UpdateElementPropertiesCommand`

**No PropertyPanel code changes required!** The component is completely configuration-driven.

### Configuration Structure

Your `gui.config.yaml` entry defines:

```yaml
components:
  myInductor:
    # Menu integration
    menuLabel: My Inductor         # Display name in menu
    shortcut: Shift+I              # Keyboard shortcut
    
    # Property panel configuration
    propertyPanel:
      title: "My Inductor Properties"           # Modal title
      description: "Custom inductor element"    # Help text
      helpText: "Set inductance in Henry"       # Additional info
      
      fields:  # Array of editable properties
        - key: inductance           # Must match element.properties.values[key]
          label: Inductance         # Displayed to user
          type: number              # "number" or "text"
          unit: H                   # Unit suffix (optional)
          placeholder: "5e-9"       # Input hint text (optional)
          
        - key: label
          label: Label
          type: text
          unit: ""
          placeholder: ""
```

### Build Process: YAML to JSON

During `npm run build`, this happens automatically:

1. **YAML parsed** → `src/config/gui.config.yaml` read
2. **JSON compiled** → `dist/static/gui.config.json` created
3. **Menu generated** → `menu.config.json` created from same YAML
4. **Assets bundled** → All JSON files included in bundle

When PropertyPanel loads at runtime:
```javascript
// In PropertyPanel.loadConfig()
const response = await fetch('./static/gui.config.json');
const config = await response.json();

// PropertyPanel looks up your element's config:
const myInductorConfig = config.components.myInductor;
// Gets: { menuLabel, shortcut, propertyPanel: { ... } }
```

### Important: Type Naming Convention

**Framework uses lowercase throughout for consistency:**

```javascript
// In your element class:
export class MyInductor extends Element {
  constructor(id, nodes, label, properties = {}) {
    // ...
    this.type = 'myinductor';  // ← Lowercase (must match config key!)
  }
}
```

```yaml
components:
  myinductor:  # ← Lowercase (must match element.type)
    propertyPanel: { ... }
```

```javascript
// In registry.js:
ElementRegistry.register('myinductor', factory);  // ← Lowercase
rendererFactory.register('myinductor', MyInductorRenderer);  // ← Lowercase
```

**Lookup process**:
```javascript
const elementType = element.type;  // 'myinductor'
const config = guiConfig.components[elementType];  // ← Exact lowercase match
const renderer = rendererFactory.create(elementType, ctx);  // ← Exact lowercase match
```

**Summary**:
- **Class names**: PascalCase (`MyInductor`, `MyInductorRenderer`)
- **Type/key everywhere else**: lowercase (`'myinductor'`)

### Allowed Field Types

PropertyPanel automatically generates appropriate HTML inputs:

```yaml
fields:
  # Number input - HTML5 number type, supports decimals
  - key: inductance
    type: number
    # Renders: <input type="number" step="any">
    
  # Text input - any text value
  - key: label
    type: text
    # Renders: <input type="text">
```

**Important**: Your element's `properties` must only store:
- Numbers (integers, floats, scientific notation)
- `"variable"` (special string for symbolic parameters)
- `undefined` (unset values)

Cannot store colors, booleans, or arbitrary strings!

### Validation: PropertyPanel → Element

When user saves:

```javascript
// PropertyPanel.savePanelProperties()
const values = {
  inductance: parseFloat(document.getElementById('inductance').value),
  label: document.getElementById('label').value
};

// Called with callback:
this.onSave(element, newProperties);

// Which calls UpdateElementPropertiesCommand:
command.execute();
// → Validates properties in element
// → Updates element.properties via Properties class
// → Validates element.label via Label class
```

Both `Properties` and `Label` classes validate input automatically!

### Error Handling

If configuration is missing:

```javascript
// PropertyPanel.generateContentForElement()
const config = guiConfig.components[elementType];

if (!config) {
  console.warn(`No configuration found for: "${elementType}"`);
  console.warn(`Available:`, Object.keys(guiConfig.components));
  
  // Falls back to:
  return this.generateFallbackContent(elementType, currentLabel);
  // Shows basic label editor with no property fields
}
```

---

## Step 6: Menu Integration

Now let's add a menu item so users can insert your element with a keyboard shortcut.

### Edit the Menu Configuration

**File**: `src/config/gui.config.yaml`

The menu configuration is **already defined** in Step 3 when you configured the property panel! The same YAML entry that configures properties also defines menu integration:

```yaml
components:
  myInductor:
    menuLabel: My Inductor      # ← Used for menu display
    shortcut: Shift+I           # ← Keyboard shortcut
    propertyPanel:
      # ... property panel config ...
```

**No additional menu configuration file needed!** Both menu and property panel settings come from the same `gui.config.yaml`.

### How It Works Behind the Scenes:

When you run `npm run serve`, the build process:

1. **Compiles YAML** → `src/config/gui.config.yaml` read
2. **Creates two outputs**:
   - `dist/static/gui.config.json` → Loaded by PropertyPanel at runtime
   - `dist/static/menu.config.json` → Loaded by menu system at runtime
3. **Both files use the same source** → Your configuration automatically applies to both menu and property panel

### Testing Your Menu Entry

After building (`npm run serve`), test with:
- **Mouse**: Find "My Inductor" in Insert menu → Click → Draw element
- **Keyboard**: Press `Shift+I` → Click nodes to place element
- **Property Editing**: Double-click element → Property panel shows fields from config

**That's it!** Configuration in one place, menu + property panel automatically synchronized.

---

### Previous Step 6 Content (for reference)

The original tutorial had this section before the unified config:



---

## Step 7: Custom Commands (Optional)

For features beyond element creation (like export/import), create custom commands that may use adapters.

### Example: Export Circuit as PNG

Let's add PNG export. This needs:
1. **An adapter** to handle PNG conversion → `src/infrastructure/adapters/PngExportAdapter.js`
2. **A command** to trigger the export → `src/gui/commands/ExportPngCommand.js`
3. **Registration** in `src/config/registry.js`
4. **Menu entry** in `src/config/menu.config.yaml`

### Step 6.1: Create the Adapter

**File**: `src/infrastructure/adapters/PngExportAdapter.js`

```javascript
/**
 * PngExportAdapter - Converts canvas to PNG format
 * 
 * Infrastructure layer: Handles external format conversion
 */
export class PngExportAdapter {
  static exportToBlob(canvas) {
    // Your PNG conversion logic here
    // Use canvas.toDataURL() or canvas.toBlob()
    // Return blob for download
  }
}
```

**Pattern**: Look at `QucatNetlistAdapter.js` in the same folder to see how the netlist adapter works.

### Step 6.2: Create the Command

**File**: `src/gui/commands/ExportPngCommand.js`

```javascript
import { GUICommand } from './GUICommand.js';
import { PngExportAdapter } from '../../infrastructure/adapters/PngExportAdapter.js';

/**
 * ExportPngCommand - Export circuit as PNG image
 */
export class ExportPngCommand extends GUICommand {
  constructor(circuitService, circuitRenderer) {
    super();
    this.circuitService = circuitService;
    this.circuitRenderer = circuitRenderer;
  }

  execute() {
    const canvas = this.circuitRenderer.canvas;
    const blob = PngExportAdapter.exportToBlob(canvas);
    
    // Trigger browser download
    // ... your download logic here ...
  }

  undo() {} // No undo for export operations
}
```

**Pattern**: Look at `SaveNetlistCommand.js` in the same folder - it uses `QucatNetlistAdapter` and triggers downloads.

### Step 6.3: Register the Command

**File**: `src/config/registry.js` (Add with other command registrations around line 420)

```javascript
import { ExportPngCommand } from '../gui/commands/ExportPngCommand.js';

// In registerCommands() function, add:
if (!GUICommandRegistry.getTypes().includes("exportPng")) {
  GUICommandRegistry.register("exportPng", () =>
    new ExportPngCommand(circuitService, circuitRenderer)
  );
}
```

**Pattern**: Search for `saveNetlist` in this file to see the exact registration pattern.

### Step 6.4: Add Menu Entry

**File**: `src/config/menu.config.yaml` (Add to File menu around line 12)

```yaml
menus:
  - label: File
    items:
      # ... existing items like Save Netlist ...
      
      - id: exportPng
        label: "Export as PNG..."
        shortcut: Ctrl+Shift+P
        action: { kind: command, name: exportPng }
```

**Pattern**: Look at `saveNetlist` entry to see the exact format.

### That's It - No GUIAdapter Changes!

The framework automatically:
- ✅ Compiles YAML → generates menu bindings
- ✅ Routes menu action → calls your registered command
- ✅ Command uses adapter → performs export
- ✅ All without touching `GUIAdapter.js`

### When You Need Adapters vs Just Commands:

- **Simple operations** (select all, delete) → Just a command
- **Export/Import** (PNG, netlist, JSON) → Command + Adapter
- **Format conversion** (circuit → netlist text) → Adapter in `src/infrastructure/adapters/`
- **User interactions** (add element, drag) → Command in `src/gui/commands/`

**Key principle**: Adapters handle external formats, commands handle user actions.

---

## Step 8: Complete Integration (Proving Open-Closed Principle)

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

#### ✅ Property Panel Configured
- [ ] Added `myinductor` component to `src/config/gui.config.yaml` (lowercase key)
- [ ] Defined `propertyPanel` section with `title`, `description`, `helpText`
- [ ] Configured all editable `fields` with `key`, `label`, `type`, `unit`
- [ ] Run `npm run build` to compile YAML to JSON

#### ✅ Registrations Complete
- [ ] `ElementRegistry.register('myinductor', factory)` in registry.js (lowercase key)
- [ ] `rendererFactory.register('myinductor', MyInductorRenderer)` in registry.js (lowercase key)
- [ ] Optional: Custom commands registered in `GUICommandRegistry`

#### ✅ Menu Integration
- [ ] Action added to `gui.config.yaml` with menuLabel, shortcut
- [ ] Keyboard shortcut configured
- [ ] Action passes lowercase element type (`'myinductor'`) to framework

#### ✅ Core Framework Unchanged
- [ ] Run `grep -r "myinductor" src/gui/adapters/` → No matches in core files
- [ ] Run `grep -r "MyInductor" src/gui/adapters/` → No matches (class is only in your files)
- [ ] Core framework files have same line count before/after
- [ ] All coordination happens through registries and config files

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
│   ├── property_panel/
│   │   └── PropertyPanel.js    ← DON'T MODIFY (configuration-driven)
│   ├── renderers/
│   │   ├── ElementRenderer.js  (Base class)
│   │   └── MyInductorRenderer.js  ← YOU CREATE THIS
│   └── commands/
│       ├── GUICommand.js       (Base class)
│       └── CustomInductorCommand.js  ← OPTIONAL
└── config/
    ├── registry.js             ← YOU MODIFY THIS (registrations)
    ├── gui.config.yaml         ← YOU MODIFY THIS (property panel + menu config)
    └── menu.config.yaml        ← AUTO-GENERATED (from gui.config.yaml)
```

### Configuration-Driven Architecture

**Key files you modify**:
1. **`src/domain/entities/MyInductor.js`** - Element data & behavior
2. **`src/gui/renderers/MyInductorRenderer.js`** - Visual representation
3. **`src/config/registry.js`** - Register element & renderer
4. **`src/config/gui.config.yaml`** - Property panel + menu config

**Key files you DON'T modify**:
- `PropertyPanel.js` - Completely configuration-driven
- `GUIAdapter.js` - Generic command handler
- `CircuitRenderer.js` - Generic rendering coordinator
- `menu.config.yaml` - Auto-generated from gui.config.yaml

---

**Congratulations!** 🎉 

You've successfully extended JSCircuit with a custom element. Your element works seamlessly without modifying any core framework code - that's the power of the registry pattern!
