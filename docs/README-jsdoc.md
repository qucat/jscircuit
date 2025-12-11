# 🔬 QuCat Circuit Generator - Professional Extension API

<div align="center">
  <img src="../qucat-logo.png" alt="QuCat Logo" height="80" style="margin-bottom: 1rem;">
  
  **Modern, Professional API for Quantum Circuit Design Extensions**
  
  *Build custom circuit elements, renderers, and commands using hexagonal architecture*
  
  [![GitHub](https://img.shields.io/badge/GitHub-View%20Source-blue?style=for-the-badge&logo=github)](https://github.com/jurra/qucat-circuit-generator)
  [![Demo](https://img.shields.io/badge/Demo-Try%20Live-success?style=for-the-badge&logo=codesandbox)](../embedded-demo.html)
  [![Docs](https://img.shields.io/badge/Docs-Getting%20Started-orange?style=for-the-badge&logo=gitbook)](../getting-started.md)
</div>

---

## 🎯 **Quick Start for Developers**

This API documentation covers the **extension layer** of the QuCat Circuit Generator - everything you need to create custom components and extend the application.

### 🏗️ **Core Extension Points**

| Extension Type | Purpose | Key Classes |
|----------------|---------|-------------|
| **🔧 Elements** | Custom circuit components | `Element`, `ElementRegistry` |
| **🎨 Renderers** | Visual representation | `ElementRenderer`, `RendererFactory` |  
| **⚡ Commands** | User interactions | `GUICommand`, `GUICommandRegistry` |
| **🔌 Services** | Business logic | `CircuitService`, `GUIAdapter` |

### 💡 **Architecture Overview**

The QuCat Circuit Generator follows **Domain-Driven Design** with **Hexagonal Architecture**:

```
┌─────────────────────────────────────────────┐
│                   GUI Layer                 │
│  ┌─────────────┐ ┌─────────────┐           │
│  │  Renderers  │ │  Commands   │           │
│  └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│               Application Layer             │
│  ┌─────────────┐ ┌─────────────┐           │
│  │CircuitService│ │ GUIAdapter  │           │
│  └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│                Domain Layer                 │
│  ┌─────────────┐ ┌─────────────┐           │
│  │   Circuit   │ │  Elements   │           │
│  │ (Aggregate) │ │ (Entities)  │           │
│  └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────┘
```

## 🔬 Try the Interactive Demo

<div style="text-align: center; margin: 20px 0;">
  <iframe 
    src="../../dist/gui.html" 
    width="100%" 
    height="600" 
    style="border: 2px solid #e74c3c; border-radius: 8px; background: #f8f9fa;"
    title="QuCat Circuit Generator Demo">
  </iframe>
</div>

### Quick Start Controls
- **C** - Add Capacitor
- **L** - Add Inductor  
- **J** - Add Josephson Junction
- **R** - Add Resistor
- **W** - Add Wire
- **G** - Add Ground
- **Del** - Delete selected element
- **Ctrl+Z** - Undo

### Example Circuits
Try these example circuits by copying and using **File > Import Netlist**:

**Single Qubit Transmon:**
```
C;-5,-10;0,-10;1.0e-13;
C;-5,5;0,5;1.0e-13;
L;-5,10;0,10;1.0e-8;
C;5,0;5,-5;1.0e-15;
J;-5,-5;0,-5;;Lj
R;-5,15;0,15;1.0e+6;
W;-5,5;-5,10;;
W;-5,15;-5,10;;
W;0,5;0,10;;
W;0,15;0,10;;
W;-5,-10;-5,-5;;
W;0,-10;0,-5;;
W;0,-5;5,-5;;
W;0,5;5,5;;
W;5,0;5,5;;
G;-10,5;-5,5;;
G;-10,-5;-5,-5;;
W;-10,-5;-5,-5;;
W;-10,5;-5,5;;
```

**Two-Qubit Coupling System:**
```
J;-10,-10;-5,-10;;Lj1
C;-10,-10;-5,-10;1.0e-13;Cg1
C;-10,-5;-5,-5;5.0e-15;Cc1
J;10,-10;15,-10;;Lj2
C;10,-10;15,-10;1.0e-13;Cg2
C;10,-5;15,-5;5.0e-15;Cc2
L;-5,0;5,0;2.0e-8;Lr
C;-5,0;5,0;1.0e-12;Cr
W;-5,-5;-5,0;;
W;5,0;15,-5;;
W;-10,-10;-10,-5;;
W;-10,-5;-15,-5;;
G;-15,-5;-20,-5;;
W;10,-10;10,-5;;
W;10,-5;20,-5;;
G;20,-5;25,-5;;
C;-5,5;0,5;1.0e-15;Cro1
C;5,5;10,5;1.0e-15;Cro2
W;-5,0;-5,5;;
W;5,0;5,5;;
L;0,-15;0,-10;1.0e-9;Lf
W;0,-10;-5,0;;
W;0,-10;5,0;;
```

## 🐍 QuCat Integration Workflow

1. **Design Circuit** - Use the visual editor above to create your quantum circuit
2. **Export Netlist** - Use **File > Export Netlist** to get QuCat-compatible format  
3. **Analyze with QuCat** - Load the netlist in Python for quantum analysis:

```python
import qucat as qc

# Load your exported circuit
circuit = qc.Network('your_circuit.txt')

# Calculate eigenfrequencies
f, A = circuit.eigenfrequencies()
print(f"Frequencies: {f} GHz")

# Generate Hamiltonian
H = circuit.hamiltonian() 
print(f"Hamiltonian shape: {H.shape}")

# Analyze quantum noise
loss_rates = circuit.loss_rates()
print(f"Loss rates: {loss_rates}")
```

## 📚 Extension API Documentation

Extend the circuit generator with custom elements, renderers, and commands using our hexagonal architecture:

- **[Domain Layer](./Circuit.html)** - Core circuit logic and element definitions
- **[Application Services](./module-Application_Services.html)** - Circuit operations and business logic  
- **[GUI Adapters](./module-GUIAdapter.html)** - User interface integration patterns
- **[Element Registry](./ElementRegistryClass.html)** - Register custom circuit elements
- **[Renderer Factory](./module-GUI_Renderers-RendererFactory.html)** - Custom element visualization
- **[Command System](./GUICommand.html)** - Undo/redo action patterns

### Quick Extension Example

```javascript
// Register a custom element
import { ElementRegistry } from './src/domain/factories/ElementRegistry.js';

ElementRegistry.register('CustomQubit', (id, nodes, label, properties) => {
  return new CustomQubit(id, nodes, label, properties);
});

// Register a custom renderer  
import { RendererFactory } from './src/gui/renderers/RendererFactory.js';

RendererFactory.register('CustomQubit', CustomQubitRenderer);
```

## 🚀 Local Development

```bash
git clone https://github.com/jurra/qucat-circuit-generator.git
cd qucat-circuit-generator
npm install
npm run build
npm run serve
```

Opens at `http://localhost:8080`

---

**QuCat Circuit Generator** - Part of the [QuCat Quantum Analysis Ecosystem](https://github.com/qucat/qucat)