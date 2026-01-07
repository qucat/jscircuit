# C4 Level 1: System Context

This diagram shows the overall system context for the JSCircuit Editor, including users and external systems.

```mermaid
C4Context
    title System Context diagram for JSCircuit Editor

    Person(circuitDesigner, "Circuit Designer", "Quantum circuit researchers and engineers who design superconducting quantum circuits")
    Person(physicsResearcher, "Physics Researcher", "Scientists working with quantum electronics and Josephson junction circuits")

    System(qucatGenerator, "JSCircuit Editor", "Web-based application for designing, visualizing, and analyzing quantum superconducting circuits")

    System_Ext(qucatLibrary, "QuCat Python Library", "Quantum circuit analysis tool for eigenfrequency calculations, Hamiltonian generation, and circuit analysis")
    System_Ext(webBrowser, "Web Browser", "Renders HTML5 canvas-based GUI and handles user interactions")
    System_Ext(fileSystem, "File System", "Stores and loads circuit designs in netlist format")
    System_Ext(devTools, "Development Tools", "Node.js ecosystem (npm, ESBuild, Mocha) for building and testing")

    Rel(circuitDesigner, qucatGenerator, "Designs quantum circuits using")
    Rel(physicsResearcher, qucatGenerator, "Models Josephson circuits with")
    
    Rel(qucatGenerator, webBrowser, "Runs in")
    Rel(qucatGenerator, qucatLibrary, "Exports circuits to", "netlist format")
    Rel(qucatGenerator, fileSystem, "Saves/loads designs from")
    Rel(devTools, qucatGenerator, "Builds and tests")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="2")
```

## Key Elements

### Users
- **Circuit Designer**: Primary user who creates and modifies quantum circuit designs
- **Physics Researcher**: Secondary user who uses the tool for quantum electronics modeling

### System Purpose
The JSCircuit Editor enables graphical design of quantum superconducting circuits with components like Josephson junctions, capacitors, inductors, and resistors.

### External Dependencies
- **QuCat Python Library**: Target system for circuit analysis
- **Web Browser**: Runtime environment for the application
- **File System**: Persistence layer for circuit designs
- **Development Tools**: Build and testing infrastructure