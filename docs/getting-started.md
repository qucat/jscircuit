# Getting Started - QuCat Circuit Generator

> **⚠️ WORK IN PROGRESS** 
> 
> This tutorial is being enhanced with interactive examples. Basic functionality works but documentation is being improved.

<div align="center">
  <img src="qucat-logo.png" alt="QuCat Logo" height="80"/>
  <h2>Interactive Quantum Circuit Designer</h2>
  <p><em>Compatible with the <a href="https://github.com/qucat/qucat">QuCat Python Library</a> for quantum circuit analysis</em></p>
</div>

---

## 🎮 Interactive Demo

<div style="text-align: center; margin: 30px 0;">
  <iframe 
    src="embedded-demo.html" 
    width="100%" 
    height="600" 
    style="border: none; border-radius: 12px; background: #f8f9fa; box-shadow: 0 8px 25px rgba(0,0,0,0.1);"
    title="QuCat Circuit Generator Demo">
  </iframe>
</div>

### 🎯 Quick Start Controls
- **C** - Add Capacitor
- **L** - Add Inductor  
- **J** - Add Josephson Junction
- **R** - Add Resistor
- **W** - Add Wire
- **G** - Add Ground
- **Del** - Delete selected element
- **Ctrl+Z** - Undo

---

## 🔬 Circuit Design to Quantum Analysis Workflow

From visual design to quantum simulation in 4 steps:

### 1. 🎨 Visual Design
Create quantum circuits with drag-and-drop components. Add Josephson junctions, capacitors, inductors, and resistors to design superconducting qubits and resonators.

### 2. 📄 Export Netlist
Export your circuit as a QuCat-compatible netlist file. The generator automatically handles node numbering and component formatting.

### 3. 🐍 QuCat Analysis
Load the netlist in Python with the QuCat library. Calculate eigenfrequencies, generate Hamiltonians, and analyze quantum noise.

### 4. 📊 Iterate & Optimize
Use analysis results to refine your circuit design. Adjust parameters and topology for optimal quantum device performance.

---

## 🔧 Example Circuits

Copy these example circuits and use **File > Import Netlist** to load them:

### Single Qubit Transmon
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

### Two-Qubit Coupling System
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

---

## 📋 Understanding QuCat Netlists

The circuit generator exports netlists compatible with the QuCat Python library. Each line represents a circuit component with its connections and parameters.

### Netlist Format
```
# Component format:
# TYPE;node1_x,node1_y;node2_x,node2_y;value;label

# Example components:
C;-5,-10;0,-10;1.0e-13;        # Capacitor, 0.1 fF
L;-5,10;0,10;1.0e-8;           # Inductor, 10 nH  
J;-5,-5;0,-5;;Lj               # Josephson Junction
R;-5,15;0,15;1.0e+6;           # Resistor, 1 MΩ
W;-5,5;-5,10;;                 # Wire connection
G;-10,5;-5,5;;                 # Ground connection
```

### Component Types
- **C** - Capacitor (value in Farads)
- **L** - Inductor (value in Henry)
- **J** - Josephson Junction (label only)
- **R** - Resistor (value in Ohms)
- **W** - Wire (connection only)
- **G** - Ground (connection to ground)

---

## 🖥️ Running the Application Locally

Want to run the full QuCat Circuit Generator on your machine? Follow these simple steps:

### 1. Clone & Install
```bash
git clone https://github.com/jurra/qucat-circuit-generator.git
cd qucat-circuit-generator
npm install
```

### 2. Build & Serve
```bash
npm run build
npm run serve
```
Opens at `http://localhost:8080`

### 3. Development Mode
```bash
npm run dev
```
Auto-rebuilds on file changes

### 4. Run Tests
```bash
npm test
```
Validates all 440+ tests pass

### 💡 Development Requirements
- **Node.js** v16+ and npm
- **Modern browser** with HTML5 Canvas support
- **Python 3.7+** for QuCat integration (optional)

---

## 🐍 QuCat Integration Workflow

Ready to simulate your quantum circuit? Here's how to connect your visual design to QuCat's powerful analysis capabilities:

### Python Integration Example
```python
import qucat as qc

# Load your exported circuit
circuit = qc.Network('exported_circuit.txt')

# Calculate eigenfrequencies
f, A = circuit.eigenfrequencies()
print(f"Frequencies: {f} GHz")

# Generate Hamiltonian
H = circuit.hamiltonian() 
print(f"Hamiltonian shape: {H.shape}")

# Analyze quantum noise
loss_rates = circuit.loss_rates()
print(f"Loss rates: {loss_rates}")

# Plot circuit network
circuit.show()
```

### Analysis Workflow
1. **Design** your circuit using the visual editor above
2. **Export** the netlist via File > Export Netlist
3. **Load** the netlist in Python with `qc.Network('file.txt')`
4. **Analyze** eigenfrequencies, Hamiltonians, and quantum noise
5. **Iterate** on your design based on analysis results

---

## 📚 Next Steps

- **[🔧 Developer Guide](./EXTENSION_GUIDE.md)** - Create custom circuit elements
- **[📋 API Reference](./dist/extension-api/)** - Complete API documentation  
- **[🏛️ Architecture](./architecture/README.md)** - System architecture overview
- **[🐍 QuCat Documentation](https://qucat.readthedocs.io/)** - Complete QuCat library docs

---

**QuCat Circuit Generator** - Part of the [QuCat Quantum Analysis Ecosystem](https://github.com/qucat/qucat)