# C4 Level 2: Containers

This diagram shows the high-level containers that make up the JSCircuit Editor and how they interact.

```mermaid
C4Container
    title Container diagram for JSCircuit Editor

    Person(user, "Circuit Designer", "Designs quantum superconducting circuits")

    Container_Boundary(qucatSystem, "JSCircuit Editor") {
        Container(webApp, "Web Application", "JavaScript, HTML5 Canvas", "Single-page application providing circuit design interface with real-time editing")
        
        Container(domainCore, "Domain Core", "JavaScript, DDD", "Business logic and domain entities for circuit modeling, validation, and relationships")
        
        Container(appServices, "Application Services", "JavaScript, Event-Driven", "Orchestrates use cases, command execution, and state management")
        
        Container(infrastructure, "Infrastructure Layer", "JavaScript Adapters", "External integrations, file I/O, and netlist format conversion")
        
        Container(devToolchain, "Development Toolchain", "Node.js, ESBuild, Mocha", "Build system, testing, and development workflow")
    }

    System_Ext(browser, "Web Browser", "HTML5 Canvas rendering")
    System_Ext(qucatLib, "QuCat Python Library", "Circuit analysis")
    System_Ext(filesystem, "File System", "Circuit storage")

    Rel(user, webApp, "Interacts with", "GUI events")
    Rel(webApp, appServices, "Sends commands to")
    Rel(appServices, domainCore, "Orchestrates")
    Rel(appServices, infrastructure, "Uses adapters from")
    Rel(infrastructure, filesystem, "Reads/writes files")
    Rel(infrastructure, qucatLib, "Exports to", "netlist format")
    Rel(webApp, browser, "Renders in")
    Rel(devToolchain, webApp, "Builds and tests")

    UpdateLayoutConfig($c4ShapeInRow="2", $c4BoundaryInRow="1")
```

## Container Descriptions

### Web Application
- **Technology**: Modern JavaScript (ES modules), HTML5 Canvas, CSS
- **Purpose**: Single-page web application providing the circuit design interface
- **Responsibilities**: User interaction, visual circuit rendering, real-time editing

### Domain Core
- **Technology**: Pure JavaScript with Domain-Driven Design patterns
- **Purpose**: Business logic and domain entities for circuit modeling
- **Responsibilities**: Circuit validation, element relationships, domain rules

### Application Services
- **Technology**: JavaScript with Event-Driven Architecture
- **Purpose**: Orchestrates use cases and coordinates between GUI and domain
- **Responsibilities**: Command execution, state management, event broadcasting

### Infrastructure Layer
- **Technology**: JavaScript adapters and repositories
- **Purpose**: External integrations and persistence
- **Responsibilities**: File I/O, netlist export/import, QuCat format conversion

### Development Toolchain
- **Technology**: ESBuild, Mocha, npm
- **Purpose**: Build system, testing, and development workflow
- **Responsibilities**: Bundling, test execution, asset management