# QuCat Circuit Generator

<div align="center">
  <img src="assets/logo.png" alt="QuCat Circuit Generator Logo" height="120"/>
  
  **Interactive Quantum Circuit Designer**
  
  *A professional circuit generator for superconducting quantum circuits compatible with the [QuCat Python Library](https://github.com/qucat/qucat)*
  
  [![🎮 Try Interactive Demo](https://img.shields.io/badge/🎮_Try_Interactive_Demo-blue?style=for-the-badge)](./docs/dist/extension-api/)
  [![📚 Documentation](https://img.shields.io/badge/📚_Documentation-green?style=for-the-badge)](./docs/README.md)
</div>

---

## **🚀 Quick Start**

### **🎮 Try It Now - No Installation Required**
**[🚀 Launch Interactive Demo](./docs/dist/extension-api/)** - Experience the full application in your browser
**[📚 Getting Started Guide](./docs/getting-started.md)** - Complete tutorial with example circuits

### **⚡ Features**
- **🎨 Visual Circuit Design**: Drag-and-drop interface for quantum circuit creation
- **🔧 QuCat Integration**: Export circuits as QuCat-compatible netlists
- **⚡ Josephson Junctions**: Full support for superconducting quantum circuits
- **📐 Professional Tools**: Grid snapping, multi-selection, undo/redo, property editing
- **🏗️ Extensible Architecture**: Domain-Driven Design with hexagonal architecture
- **🧪 Comprehensive Testing**: 400+ unit tests ensuring reliability

### **🔗 QuCat Ecosystem Integration**

This circuit generator creates designs compatible with the [QuCat Python Library](https://github.com/qucat/qucat) for quantum circuit analysis:

```python
# Example: Load generated circuit in QuCat
import qucat as qc

# Load circuit exported from this generator
circuit = qc.Network("exported_circuit.txt")

# Perform quantum analysis
freqs, modes = circuit.eigenfrequencies()
hamiltonian = circuit.hamiltonian()
```

**Workflow**: Design → Export → Analyze → Optimize → Repeat

---

## **Setup and Usage**

### **1. Clone the Repository**
```bash
git clone https://github.com/your-repo/qucat-circuit-generator.git
cd qucat-circuit-generator
```

### **2. Install Dependencies**
Install all required dependencies using npm:
```bash
npm install
```

### **3. Build the Project**
Bundle the project with Rollup:
```bash
npm run build
```
This will generate the bundled JavaScript files in the `dist` folder and copy the `gui.html` file there.

### **4. Open the Application**
After bundling, open the `gui.html` file in the `dist` folder in your browser:
```bash
open dist/gui.html
```

## **Testing**

### **1. Run All Tests**
Run the provided test suite using Mocha:
```bash
npm test
```

### **2. Test Coverage**
- **GUIAdapter**: Tests UI bindings and integration with `CircuitService`.
- **CircuitService**: Validates the addition, deletion, and connection of circuit elements.

---

## **Scripts**

- **Build**: Bundles the project with Rollup and copies `gui.html` to the `dist` folder.
  ```bash
  npm run build
  ```

- **Test**: Runs all tests in the `tests` folder using Mocha.
  ```bash
  npm test
  ```

---

## **📚 Documentation**

Complete documentation with clear separation by purpose:

### 🎮 For Users - Getting Started
- **[🚀 Interactive Demo](./docs/dist/extension-api/)** - Try the circuit generator immediately  
- **[📚 Complete Tutorial](./docs/getting-started.md)** - Step-by-step guide with examples
- **[⚡ Quick Start](#setup-and-usage)** - Installation and basic usage
- **[🔧 Feature Overview](./features.md)** - Complete capability list

### 👩‍💻 For Developers - Component Creation  
- **[🏗️ Developer Guide](./docs/EXTENSION_GUIDE.md)** - Creating custom circuit elements
- **[🔌 Quick Patterns](./docs/EXTENSION_API.md)** - Component creation patterns
- **[🏛️ Architecture Guide](./docs/architecture/README.md)** - Hexagonal architecture overview

### 📋 For Reference - API Documentation
- **[� API Reference](./docs/dist/extension-api/)** - Complete JSDoc documentation
- **[📖 Documentation Index](./docs/README.md)** - Complete navigation guide

### Quick Links by Role

**🧑‍💻 Users**: [Getting Started Tutorial](./docs/getting-started.md) • [Interactive Demo](./docs/dist/extension-api/)

**🏗️ Architects**: [Architecture Overview](./docs/architecture/README.md) • [System Context](./docs/architecture/c4-level1-system-context.md)

**⚡ Developers**: [Developer Guide](./docs/EXTENSION_GUIDE.md) • [API Reference](./docs/dist/extension-api/)

---

## **Configuration Details**

### **Rollup Config**
Rollup bundles the project into the `dist` folder for optimized performance. The configuration ensures all dependencies are correctly resolved and minified.

### **Scripts in `package.json`**
```json
"scripts": {
    "test": "mocha 'tests/**/*.test.js'",
    "build": "rollup -c && cp gui.html dist/"
}
```