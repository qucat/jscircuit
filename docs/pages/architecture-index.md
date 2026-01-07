# C4 Architecture Index

This directory contains the complete C4 model documentation for the JSCircuit Editor, showing the software architecture from high-level system context down to detailed code structure.

## Overview

The C4 model provides a hierarchical set of software architecture diagrams for the JSCircuit Editor:

1. **System Context** - Shows the big picture
2. **Containers** - Shows the high-level technology choices  
3. **Components** - Shows how containers are made up of components
4. **Code** - Shows how components are implemented

## Files

- [`c4-level1-system-context.md`](./c4-level1-system-context.md) - System context diagram showing users and external systems
- [`c4-level2-container.md`](./c4-level2-container.md) - Container diagram showing high-level technology containers
- [`c4-level3-component.md`](./c4-level3-component.md) - Component diagram showing internal component structure
- [`c4-level4-code.md`](./c4-level4-code.md) - Code diagram showing key classes and relationships
- [`architecture-flow.md`](./architecture-flow.md) - Data flow and interaction patterns

## Architecture Summary

### Key Architectural Patterns

1. **Domain-Driven Design (DDD)**: Clear separation of domain logic from infrastructure
2. **Hexagonal Architecture**: Ports and adapters isolate core business logic
3. **Command Pattern**: All user actions implemented as reversible commands
4. **Event-Driven Architecture**: CircuitService broadcasts state changes
5. **Factory Pattern**: ElementRegistry and RendererFactory for object creation
6. **Repository Pattern**: Abstracted data persistence through adapters
7. **Observer Pattern**: GUI updates reactively to domain state changes

### Technology Stack

- **Frontend**: JavaScript ES modules, HTML5 Canvas, CSS
- **Architecture**: Domain-Driven Design with Hexagonal Architecture
- **Build System**: ESBuild for bundling and optimization
- **Testing**: Mocha with Chai for unit testing
- **Development**: Node.js ecosystem with npm

### Key Design Decisions

- **Canvas-based Rendering**: HTML5 Canvas for precise circuit visualization
- **Event-driven Updates**: Real-time GUI synchronization with domain state
- **Immutable Value Objects**: Position, Properties prevent accidental mutations
- **Modular Element System**: Easy extension for new circuit components
- **Config-driven UI**: YAML-based menu and keyboard binding configuration
- **Test-first Development**: Comprehensive unit test coverage

## Usage

These diagrams can be rendered using any Mermaid-compatible tool:

- **GitHub**: Diagrams render automatically in GitHub markdown
- **VS Code**: Use Mermaid Preview extension
- **Online**: Copy diagrams to [mermaid.live](https://mermaid.live/)
- **Documentation**: Include in Sphinx/GitBook documentation

## Viewing the Diagrams

To view these diagrams:

1. **In GitHub**: Open any `.md` file - diagrams render automatically
2. **Locally**: Use VS Code with Mermaid Preview extension
3. **Web Browser**: Copy diagram code to [mermaid.live](https://mermaid.live/)

## Contributing

When modifying the architecture:

1. Update the relevant C4 level diagram(s)
2. Ensure consistency across all levels
3. Update this README if new patterns are introduced
4. Validate diagrams render correctly in GitHub