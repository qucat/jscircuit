# QuCat Circuit Generator

A modular and testable project for generating and testing circuits. This application provides a user-friendly GUI to add and manipulate circuit elements like resistors and wires, along with robust testing for the core functionalities.

---

## **Features**
- Add, delete, and connect circuit elements dynamically via the GUI.
- Modular architecture with clear separation between UI, application logic, and domain layers.
- Unit tests for ensuring functionality and maintainability.
- Bundling with Rollup for optimized builds.

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