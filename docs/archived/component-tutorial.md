<div align="center">
  <img src="qucat-logo.png" alt="JSCircuit Logo" height="60"/>
  <h2>Creating Custom Components</h2>
  <p><em>Extend JSCircuit with your own quantum elements</em></p>
</div>

---

## 🎯 Tutorial Overview

Learn to create custom components for JSCircuit by building a **Variable Capacitor** from scratch. This tutorial covers the complete development workflow using JSCircuit's hexagonal architecture.

### What You'll Build
- **Domain Entity**: Variable capacitor with tunable capacitance
- **GUI Renderer**: Visual representation with control handle
- **Integration**: Full component registration and menu integration

---

## 🏗️ Architecture Quick Primer

JSCircuit follows **Domain-Driven Design (DDD)** with **Hexagonal Architecture**:

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│     GUI     │◄──►│ Application │◄──►│   Domain    │
│  (Canvas)   │    │  (Service)  │    │ (Business)  │
└─────────────┘    └─────────────┘    └─────────────┘
       ▲                                      ▲
       │                                      │
       ▼                                      ▼
┌─────────────┐                    ┌─────────────┐
│Infrastructure│                    │   Value     │
│ (QuCat I/O) │                    │   Objects   │
└─────────────┘                    └─────────────┘
```

**Key Principle**: Domain layer has no dependencies - external concerns are injected through ports/adapters.

---

## 📂 File Structure

For our Variable Capacitor, we'll create:

```
src/
├── domain/
│   └── entities/
│       └── VariableCapacitor.js     # Core business logic
├── gui/
│   └── renderers/
│       └── VariableCapacitorRenderer.js  # Visual representation
└── config/
    └── registry.js                  # Registration
```

---

## 🧱 Step 1: Create the Domain Entity

First, let's create the core business logic:

**File**: `src/domain/entities/VariableCapacitor.js`

```javascript
import { Element } from './Element.js';

/**
 * Variable Capacitor with tunable capacitance
 * Supports both manual and voltage-controlled tuning
 */
export class VariableCapacitor extends Element {
    /**
     * @param {string} id - Unique element identifier
     * @param {Array<string>} nodes - Connection node IDs [node1, node2]
     * @param {string} label - Display label
     * @param {Object} properties - Component properties
     */
    constructor(id, nodes, label, properties = {}) {
        super(id, nodes, label, 'VariableCapacitor');
        
        // Default properties with validation
        this.properties = {
            minCapacitance: properties.minCapacitance || 1e-15, // 1 fF
            maxCapacitance: properties.maxCapacitance || 10e-15, // 10 fF
            currentCapacitance: properties.currentCapacitance || 5e-15, // 5 fF
            controlVoltage: properties.controlVoltage || 0, // 0V
            tuningRate: properties.tuningRate || 1e-15, // 1 fF/V
            ...properties
        };
        
        this.validate();
    }

    /**
     * Validate component properties
     */
    validate() {
        const { minCapacitance, maxCapacitance, currentCapacitance } = this.properties;
        
        if (minCapacitance <= 0) {
            throw new Error('Minimum capacitance must be positive');
        }
        
        if (maxCapacitance <= minCapacitance) {
            throw new Error('Maximum capacitance must exceed minimum');
        }
        
        if (currentCapacitance < minCapacitance || currentCapacitance > maxCapacitance) {
            throw new Error('Current capacitance must be within min/max range');
        }
    }

    /**
     * Set capacitance value with range validation
     * @param {number} capacitance - New capacitance value
     */
    setCapacitance(capacitance) {
        const { minCapacitance, maxCapacitance } = this.properties;
        
        if (capacitance < minCapacitance) {
            capacitance = minCapacitance;
        } else if (capacitance > maxCapacitance) {
            capacitance = maxCapacitance;
        }
        
        this.properties.currentCapacitance = capacitance;
        this.notifyChange(); // Emit change event for GUI updates
    }

    /**
     * Calculate capacitance from control voltage
     * @param {number} voltage - Control voltage
     * @returns {number} Calculated capacitance
     */
    getCapacitanceFromVoltage(voltage) {
        const { minCapacitance, tuningRate } = this.properties;
        return minCapacitance + (voltage * tuningRate);
    }

    /**
     * Generate QuCat netlist entry
     * @returns {string} Netlist line for QuCat
     */
    toNetlistEntry() {
        const { currentCapacitance } = this.properties;
        const [node1, node2] = this.nodes;
        return `C${node1}${node2} ${node1} ${node2} ${currentCapacitance}`;
    }

    /**
     * Clone the component with new properties
     * @param {Object} newProperties - Properties to override
     * @returns {VariableCapacitor} New instance
     */
    clone(newProperties = {}) {
        return new VariableCapacitor(
            this.id,
            [...this.nodes],
            this.label,
            { ...this.properties, ...newProperties }
        );
    }
}
```

---

## 🎨 Step 2: Create the GUI Renderer

Now, let's create the visual representation:

**File**: `src/gui/renderers/VariableCapacitorRenderer.js`

```javascript
import { Renderer } from './Renderer.js';

/**
 * Renders Variable Capacitor with interactive control handle
 */
export class VariableCapacitorRenderer extends Renderer {
    constructor(element, position) {
        super(element, position);
        this.width = 40;
        this.height = 30;
        this.isDraggingHandle = false;
    }

    /**
     * Render the variable capacitor
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} options - Rendering options
     */
    render(ctx, options = {}) {
        const { isSelected, isHovered } = options;
        
        ctx.save();
        ctx.translate(this.position.x, this.position.y);

        // Set colors based on state
        const strokeColor = isSelected ? '#00ff00' : isHovered ? '#ffaa00' : '#333333';
        const fillColor = isHovered ? 'rgba(255, 170, 0, 0.1)' : 'rgba(0, 0, 0, 0.05)';

        // Main capacitor symbol
        this.drawCapacitorPlates(ctx, strokeColor, fillColor);
        
        // Variable indicator (diagonal arrow)
        this.drawVariableIndicator(ctx, strokeColor);
        
        // Control handle
        this.drawControlHandle(ctx, strokeColor, isSelected);
        
        // Connection points
        this.drawConnectionPoints(ctx, strokeColor);
        
        // Label
        this.drawLabel(ctx, strokeColor);
        
        ctx.restore();
    }

    /**
     * Draw the main capacitor plates
     */
    drawCapacitorPlates(ctx, strokeColor, fillColor) {
        ctx.strokeStyle = strokeColor;
        ctx.fillStyle = fillColor;
        ctx.lineWidth = 2;

        // Left plate
        ctx.fillRect(-15, -12, 8, 24);
        ctx.strokeRect(-15, -12, 8, 24);
        
        // Right plate
        ctx.fillRect(7, -12, 8, 24);
        ctx.strokeRect(7, -12, 8, 24);
        
        // Connection lines
        ctx.beginPath();
        ctx.moveTo(-25, 0);
        ctx.lineTo(-15, 0);
        ctx.moveTo(15, 0);
        ctx.lineTo(25, 0);
        ctx.stroke();
    }

    /**
     * Draw variable indicator arrow
     */
    drawVariableIndicator(ctx, strokeColor) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1.5;
        
        // Diagonal arrow through capacitor
        ctx.beginPath();
        ctx.moveTo(-8, -15);
        ctx.lineTo(8, 15);
        
        // Arrowhead
        ctx.lineTo(5, 12);
        ctx.moveTo(8, 15);
        ctx.lineTo(11, 12);
        ctx.stroke();
    }

    /**
     * Draw interactive control handle
     */
    drawControlHandle(ctx, strokeColor, isSelected) {
        const { currentCapacitance, minCapacitance, maxCapacitance } = this.element.properties;
        
        // Calculate handle position (0-1 normalized)
        const ratio = (currentCapacitance - minCapacitance) / (maxCapacitance - minCapacitance);
        const handleX = -15 + (30 * ratio); // Map to capacitor width
        
        // Handle track
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-15, -18);
        ctx.lineTo(15, -18);
        ctx.stroke();
        
        // Handle knob
        ctx.fillStyle = isSelected ? '#00ff00' : strokeColor;
        ctx.beginPath();
        ctx.arc(handleX, -18, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Capacitance value display
        ctx.fillStyle = strokeColor;
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        const valueText = `${(currentCapacitance * 1e15).toFixed(1)}fF`;
        ctx.fillText(valueText, 0, -25);
    }

    /**
     * Draw connection points
     */
    drawConnectionPoints(ctx, strokeColor) {
        ctx.fillStyle = strokeColor;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1;
        
        // Left connection
        ctx.beginPath();
        ctx.arc(-25, 0, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Right connection
        ctx.beginPath();
        ctx.arc(25, 0, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Draw component label
     */
    drawLabel(ctx, strokeColor) {
        ctx.fillStyle = strokeColor;
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.element.label, 0, 20);
    }

    /**
     * Handle mouse events for interactive control
     */
    handleMouseDown(event, canvasPos) {
        const localPos = this.globalToLocal(canvasPos);
        
        // Check if clicking on control handle
        const handleArea = this.getHandleHitArea();
        if (this.isPointInRect(localPos, handleArea)) {
            this.isDraggingHandle = true;
            return true; // Event handled
        }
        
        return super.handleMouseDown(event, canvasPos);
    }

    /**
     * Handle mouse drag for capacitance adjustment
     */
    handleMouseMove(event, canvasPos) {
        if (this.isDraggingHandle) {
            const localPos = this.globalToLocal(canvasPos);
            
            // Convert X position to capacitance ratio
            const ratio = Math.max(0, Math.min(1, (localPos.x + 15) / 30));
            
            // Calculate new capacitance
            const { minCapacitance, maxCapacitance } = this.element.properties;
            const newCapacitance = minCapacitance + (ratio * (maxCapacitance - minCapacitance));
            
            // Update element
            this.element.setCapacitance(newCapacitance);
            
            return true; // Event handled
        }
        
        return super.handleMouseMove(event, canvasPos);
    }

    /**
     * Handle mouse release
     */
    handleMouseUp(event, canvasPos) {
        if (this.isDraggingHandle) {
            this.isDraggingHandle = false;
            return true; // Event handled
        }
        
        return super.handleMouseUp(event, canvasPos);
    }

    /**
     * Get hit area for control handle
     */
    getHandleHitArea() {
        return {
            x: -20,
            y: -22,
            width: 40,
            height: 8
        };
    }

    /**
     * Get connection points for wiring
     */
    getConnectionPoints() {
        return [
            { x: this.position.x - 25, y: this.position.y, nodeId: this.element.nodes[0] },
            { x: this.position.x + 25, y: this.position.y, nodeId: this.element.nodes[1] }
        ];
    }

    /**
     * Get bounding box for selection
     */
    getBoundingBox() {
        return {
            x: this.position.x - 25,
            y: this.position.y - 25,
            width: 50,
            height: 50
        };
    }
}
```

---

## ⚙️ Step 3: Register the Component

Now register both the entity and renderer:

**File**: `src/config/registry.js` (add to existing registrations)

```javascript
import { VariableCapacitor } from '../domain/entities/VariableCapacitor.js';
import { VariableCapacitorRenderer } from '../gui/renderers/VariableCapacitorRenderer.js';

// Element Registration
ElementRegistry.register('VariableCapacitor', (id, nodes, label, properties) => 
    new VariableCapacitor(id, nodes, label, properties)
);

// Renderer Registration  
RendererRegistry.register('VariableCapacitor', (element, position) =>
    new VariableCapacitorRenderer(element, position)
);

// Command Registration (for menu integration)
CommandRegistry.register('addVariableCapacitor', {
    name: 'Add Variable Capacitor',
    description: 'Add a variable capacitor to the circuit',
    keyBinding: 'V',
    execute: (canvasManager) => {
        const command = new AddElementCommand(
            canvasManager.circuitService,
            'VariableCapacitor',
            canvasManager.getNextClickPosition(),
            { label: 'VC1' }
        );
        canvasManager.commandManager.execute(command);
    }
});
```

---

## 🎮 Step 4: Menu Integration

Add the component to the GUI menu:

**File**: `src/config/menu.config.yaml` (add to Components section)

```yaml
components:
  label: "Components"
  icon: "⚡"
  items:
    # ... existing components ...
    variableCapacitor:
      label: "Variable Capacitor"
      icon: "🔄"
      shortcut: "V"
      command: "addVariableCapacitor"
      tooltip: "Add variable capacitor (V)"
```

---

## 🧪 Step 5: Testing Your Component

Create a test file to validate your component:

**File**: `tests/domain/entities/VariableCapacitor.test.js`

```javascript
import { expect } from 'chai';
import { VariableCapacitor } from '../../../src/domain/entities/VariableCapacitor.js';

describe('VariableCapacitor', () => {
    let capacitor;
    
    beforeEach(() => {
        capacitor = new VariableCapacitor('vc1', ['1', '2'], 'VC1', {
            minCapacitance: 1e-15,
            maxCapacitance: 10e-15,
            currentCapacitance: 5e-15
        });
    });

    it('should create with default properties', () => {
        expect(capacitor.properties.currentCapacitance).to.equal(5e-15);
        expect(capacitor.label).to.equal('VC1');
    });

    it('should validate capacitance range', () => {
        expect(() => capacitor.setCapacitance(15e-15)).to.not.throw();
        expect(capacitor.properties.currentCapacitance).to.equal(10e-15); // Clamped to max
    });

    it('should generate correct netlist entry', () => {
        const netlist = capacitor.toNetlistEntry();
        expect(netlist).to.equal('C12 1 2 5e-15');
    });

    it('should calculate voltage-controlled capacitance', () => {
        const capacitance = capacitor.getCapacitanceFromVoltage(2); // 2V
        expect(capacitance).to.equal(1e-15 + (2 * 1e-15)); // min + voltage * rate
    });
});
```

Run the test with: `npm test`

---

## 🚀 Step 6: Build and Test

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Test in browser**:
   ```bash
   npm run serve
   ```

3. **Verify functionality**:
   - Press **V** to add a variable capacitor
   - Click and drag the control handle to adjust capacitance
   - Export circuit and verify QuCat netlist format
   - Test with different property values

---

## 📚 Advanced Customization

### Custom Property Panel

Add a custom property editor:

```javascript
// src/gui/panels/VariableCapacitorPanel.js
export class VariableCapacitorPanel extends PropertyPanel {
    createControls() {
        return [
            this.createSlider('currentCapacitance', 'Capacitance', 'fF'),
            this.createInput('minCapacitance', 'Min Capacitance', 'fF'),
            this.createInput('maxCapacitance', 'Max Capacitance', 'fF'),
            this.createSlider('controlVoltage', 'Control Voltage', 'V'),
            this.createInput('tuningRate', 'Tuning Rate', 'fF/V')
        ];
    }
}
```

### Animation Support

Add smooth animations for value changes:

```javascript
// In VariableCapacitorRenderer.js
animateCapacitanceChange(targetValue, duration = 200) {
    const startValue = this.element.properties.currentCapacitance;
    const startTime = Date.now();
    
    const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const currentValue = startValue + (targetValue - startValue) * progress;
        this.element.setCapacitance(currentValue);
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    };
    
    requestAnimationFrame(animate);
}
```

---

## 🎯 Summary

You've successfully created a custom Variable Capacitor component with:

✅ **Domain Entity** with business logic and validation  
✅ **GUI Renderer** with interactive controls  
✅ **Component Registration** in the application  
✅ **Menu Integration** with keyboard shortcut  
✅ **Testing** with unit tests  

---

## 🔗 Complete Integration Guide

This tutorial covered the basics of creating a component. For a comprehensive understanding of how components integrate into the full framework architecture, including:

- **GUIAdapter coordination** - How the framework discovers and uses your component
- **Command system integration** - Bidirectional GUIAdapter ↔ Command relationships  
- **Value object requirements** - Proper use of Position, Label, and Properties
- **Open-Closed Principle** - Extending without modifying core framework code
- **Custom commands** - Creating specialized behaviors beyond standard operations
- **Architecture validation** - Ensuring hexagonal principles are maintained

👉 **See the [Extend JSCircuit Tutorial](../extension-integration-tutorial.md)** for the complete architecture walkthrough from domain to GUI.

---

### Next Steps:
- **📚 [Extend JSCircuit Tutorial](../extension-integration-tutorial.md)** - Complete architecture guide
- **🔧 [API Documentation](./dist/extension-api/)** - Deep dive into extension APIs
- **🏗️ [Architecture Guide](./architecture/)** - Understand the full system design
- **🎮 [Try JSCircuit](./live-demo.html)** - Test your component in action

---

<div align="center">
  <p><em>Ready to build more components? The JSCircuit architecture makes it easy to extend!</em></p>
</div>