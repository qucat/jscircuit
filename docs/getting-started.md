# Getting Started with JSCircuit

<div align="center">
  <img src="qucat-logo.png" alt="JSCircuit Logo" height="80"/>
  <h2>Interactive Quantum Circuit Designer</h2>
  <p><em>From visual design to quantum analysis in minutes</em></p>
</div>

---

## 🎮 Interactive Demo

<div style="text-align: center; margin: 30px 0;">
  <iframe 
    src="dist/app/jscircuit.html" 
    width="100%" 
    height="600" 
    style="border: none; border-radius: 12px; background: #f8f9fa; box-shadow: 0 8px 25px rgba(0,0,0,0.1);"
    title="JSCircuit Demo">
  </iframe>
  <p style="margin-top: 10px; font-size: 14px; color: #666;">
    ↗️ <a href="dist/app/jscircuit.html" target="_blank" style="color: #667eea; text-decoration: none;">Open JSCircuit in full screen</a>
  </p>
</div>

### 🎯 Essential Controls

| Key | Action | Description |
|-----|--------|-------------|
| **C** | Add Capacitor | Click to place capacitor |
| **L** | Add Inductor | Click to place inductor |
| **J** | Add Junction | Click to place Josephson junction |
| **R** | Add Resistor | Click to place resistor |
| **W** | Add Wire | Click to place wire |
| **G** | Add Ground | Click to place ground |
| **Del** | Delete | Remove selected element |
| **Ctrl+Z** | Undo | Undo last action |

---

## 🔬 Circuit Design to Quantum Analysis Workflow

### Step 1: 🎨 Visual Design
Create quantum circuits using the drag-and-drop interface. Add Josephson junctions, capacitors, inductors, and resistors to design superconducting qubits and resonators.

### Step 2: 📄 Export Netlist
Export your circuit as a QuCat-compatible netlist file. JSCircuit automatically handles node numbering and component formatting.

### Step 3: 🐍 QuCat Analysis
Load the netlist in Python with the QuCat library. Calculate eigenfrequencies, generate Hamiltonians, and analyze quantum noise.

### Step 4: 📊 Iterate & Optimize
Use analysis results to refine your circuit design. Adjust parameters and topology for optimal quantum device performance.

---

## 📋 Example Circuits

### Example 1: Single Qubit Transmon

Try this example by copying the netlist and using **File > Import Netlist**:

```
# Single qubit transmon - JSCircuit Example
C01 1 0 5e-15
J12 1 2 1e-9 
C02 2 0 2e-14
```

**Components:**
- `C01`: Coupling capacitor (5 fF)
- `J12`: Josephson junction (1 nH equivalent)
- `C02`: Shunt capacitor (20 fF)

### Example 2: Two-Qubit Coupling Circuit

```
# Two-qubit coupling - JSCircuit Example
# Qubit 1
C01 1 0 5e-15
J12 1 2 1e-9
C02 2 0 2e-14

# Coupling
C23 2 3 1e-15

# Qubit 2  
C03 3 0 5e-15
J34 3 4 1e-9
C04 4 0 2e-14
```

---

## 🐍 QuCat Python Integration

Once you've designed your circuit in JSCircuit, analyze it with QuCat:

```python
import qucat as qc

# Load your exported netlist
circuit = qc.Network("your_circuit.txt")

# Calculate eigenfrequencies
frequencies = circuit.eigenfrequencies(modes=[0, 1, 2])
print(f"Qubit frequencies: {frequencies[:2]/1e9:.3f} GHz")

# Generate Hamiltonian
H = circuit.hamiltonian(modes=[0, 1], taylor=4)
print("Hamiltonian matrix shape:", H.shape)

# Analyze coupling strength
coupling = circuit.anharmonicity([0, 1])
print(f"Anharmonicity: {coupling/1e6:.1f} MHz")
```

---

## ⚡ Advanced Features

### Keyboard Shortcuts
- **Ctrl+S**: Save circuit
- **Ctrl+O**: Open circuit
- **Ctrl+C**: Copy elements
- **Ctrl+V**: Paste elements
- **Ctrl+A**: Select all
- **Space**: Pan mode
- **+/-**: Zoom in/out

### Property Editing
1. Click any component to select it
2. Use the property panel to edit values
3. Press Enter to apply changes
4. Use scientific notation (e.g., `1e-15` for 1 fF)

### Circuit Validation
JSCircuit automatically validates your circuit:
- ✅ Connected components
- ✅ Proper node numbering
- ✅ Valid component values
- ⚠️ Warnings for unusual configurations

---

## 🎯 Next Steps

### 🛠️ Want to create custom components?
→ [Component Development Tutorial](./component-tutorial.md)

### 📚 Need API documentation?
→ [Public API Reference](./dist/extension-api/)

### 🏗️ Curious about the architecture?
→ [Architecture & Concepts](./architecture/)

### 🎮 Want more examples?
→ [Circuit Examples Gallery](./circuit-examples/)

---

## 🆘 Need Help?

- **📖 Documentation**: Explore the sections above
- **🐛 Issues**: Report bugs on GitHub
- **💡 Feature Requests**: Suggest improvements
- **💬 Community**: Join the discussion

---

<div align="center">
  <p><em>Ready to start designing quantum circuits? <a href="dist/app/jscircuit.html" target="_blank">Launch JSCircuit →</a></em></p>
</div>