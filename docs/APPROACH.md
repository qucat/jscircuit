# Documentation Approach

## Analysis of Repository Structure

The repository follows a **Hexagonal Architecture** (Ports and Adapters) with Domain-Driven Design principles.

### Directory Structure
- `src/domain/`: Core business logic (Entities, Aggregates, Value Objects). No external dependencies.
- `src/application/`: Service layer orchestrating domain operations (`CircuitService`).
- `src/gui/`: The user interface layer, including Canvas rendering and DOM interaction.
- `src/infrastructure/`: Adapters for external concerns (e.g., file I/O).
- `src/config/`: Configuration and registration (Dependency Injection).

### Entry Points
- **Browser Entry Point**: `src/gui/main.js` bootstraps the application, initializing the `CircuitService`, `GUIAdapter`, and `ElementRegistry`.
- **HTML Entry Point**: `src/gui/gui.html` (built to `dist/jscircuit.html`).

### Core Domain Concepts
- **Circuit**: The root aggregate managing elements and connections.
- **Element**: The base entity for all circuit components (Resistor, Capacitor, etc.).
- **ElementRegistry**: A factory/registry for creating element instances.
- **Renderer**: Visual representation of elements on the canvas.

### Extension Points
The system is designed for extensibility via:
1.  **ElementRegistry**: Registering new element types.
2.  **RendererFactory**: Registering new renderers for elements.
3.  **GUICommandRegistry**: Registering new user actions/commands.
4.  **Menu Configuration**: `src/config/menu.config.yaml` defines the UI menu structure.

## Documentation Strategy

### Information Architecture
The documentation is structured to provide a "gradual reveal" of complexity:
1.  **Home**: High-level overview and "Run Now" CTA.
2.  **Getting Started**: Basic usage guide for end-users.
3.  **Architecture**: Explaining the Hexagonal Architecture to contributors.
4.  **Extension Guide**: A dedicated tutorial for adding new capabilities.
5.  **API Reference**: Auto-generated JSDoc for the codebase.

### Tooling
- **JSDoc**: For generating API documentation from source code.
- **Docdash**: A clean, responsive template for JSDoc.
- **Embedded App**: The full application is built and embedded within the docs for immediate trial.

### Extensibility Documentation
We address the "Huge API Reference" problem by focusing on the *Extension API*. We prioritize documenting the registries and base classes (`Element`, `ElementRenderer`, `GUICommand`) that developers need to interact with to extend the system. Internal implementation details are de-emphasized or marked private.
