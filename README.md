
## Code Structure explanation
```plaintext
src/
├── domain/                     # Core business logic
│   ├── aggregates/             # Aggregate roots
│   │   └── Circuit.js          # Circuit aggregate root
│   ├── entities/               # Domain entities
│   │   ├── Element.js          # Abstract element base class
│   │   ├── Resistor.js         # Resistor entity
│   │   └── Capacitor.js        # Capacitor entity
│   ├── value-objects/          # Value objects
│   │   ├── Position.js         # Position value object
│   │   ├── Resistance.js       # Resistance value object
│   │   └── Capacitance.js      # Capacitance value object
├── application/                # Application services
│   └── CircuitService.js       # Circuit application service
├── infrastructure/             # Adapters and repositories
│   ├── adapters/               # Adapters for external systems
│   │   ├── CanvasAdapter.js    # Adapter for canvas interactions
│   │   └── FilePersistenceAdapter.js  # Adapter for file persistence
│   ├── repositories/           # Data persistence
│       └── CircuitRepository.js# Circuit repository
├── gui/                        # Graphical user interface
│   ├── renderers/              # Component renderers
│   │   ├── ElementRenderer.js  # Base renderer with dynamic image loading
│   │   ├── ResistorRenderer.js # Resistor renderer
│   │   ├── CapacitorRenderer.js# Capacitor renderer
│   │   └── JunctionRenderer.js # Junction renderer
│   ├── gui.html                # Main HTML file for the GUI
│   └── main.js                 # Main GUI entry point
├── utils/                      # Utility functions
│   └── getImagePath.js         # Dynamic image path resolution
├── assets/                     # Image assets
│   ├── R.png                   # Resistor default image
│   ├── R_hover.png             # Resistor hover image
│   ├── R_selected.png          # Resistor selected image
│   ├── R_hover_selected.png    # Resistor hover+selected image
│   ├── C.png                   # Capacitor default image
│   ├── C_hover.png             # Capacitor hover image
│   ├── C_selected.png          # Capacitor selected image
│   ├── C_hover_selected.png    # Capacitor hover+selected image
│   └── J*.png                  # Junction variants
```

### Domain Layer
- **Aggregates**: Encapsulate entities and value objects, ensuring consistency within the aggregate. 
  - `Circuit.js`
- **Entities**: Represent core business objects with a distinct identity.
  - `Element.js` (abstract base class)
  - `Resistor.js`, `Capacitor.js`
- **Value Objects**: Represent immutable concepts with no distinct identity.
  - `Position.js`, `Resistance.js`, `Capacitance.js`

### Application Layer
- **Application Services**: Manage use cases and orchestrate domain operations.
  - `CircuitService.js`

### Infrastructure Layer
- **Adapters**: Convert data between the domain and external systems.
  - `CanvasAdapter.js`, `FilePersistenceAdapter.js`
- **Repositories**: Handle data persistence and retrieval.
  - `CircuitRepository.js`

### GUI Layer
- **Renderers**: Handle visual representation of circuit elements with dynamic image loading.
  - `ElementRenderer.js` - Base class with dynamic image loading capabilities
  - `ResistorRenderer.js`, `CapacitorRenderer.js`, `JunctionRenderer.js` - Specific renderers
- **GUI**: Main user interface components.
  - `gui.html`, `main.js`

### Utilities
- **getImagePath.js**: Dynamic image path resolution based on component type and state

## Dynamic Image Loading System

The GUI now features a dynamic image loading system that eliminates the need for hardcoded image imports. Instead of manually importing each image:

```js
// OLD WAY (no longer needed)
import R from '../../../assets/R.png';
this.image.src = GetImage("R.png");
```

You can now use the dynamic renderer system:

```js
// NEW WAY
const renderer = new ResistorRenderer(canvasContext);
renderer.render(resistorElement, { hover: true, selected: false });
```

### Key Features:

1. **Automatic Image Resolution**: Images are automatically resolved based on component type
2. **State-based Variants**: Supports default, hover, selected, and hover_selected states
3. **Type Safety**: Validates component types and throws descriptive errors for missing assets
4. **Caching**: Images are loaded once and cached for performance
5. **Environment Agnostic**: Works in both browser and Node.js environments for testing

### Usage Example:

```js
import { ResistorRenderer } from './gui/renderers/ResistorRenderer.js';

// Create renderer
const renderer = new ResistorRenderer(canvasContext);

// Render with different states
renderer.render(resistor, { hover: false, selected: false }); // Uses R.png
renderer.render(resistor, { hover: true, selected: false });  // Uses R_hover.png
renderer.render(resistor, { hover: false, selected: true });  // Uses R_selected.png
renderer.render(resistor, { hover: true, selected: true });   // Uses R_hover_selected.png
```

## Testing

The project includes comprehensive tests for both domain logic and the new rendering system:

```bash
npm test
```

Tests cover:
- Domain entities and value objects
- Dynamic image path resolution
- Renderer functionality and state management
- Error handling for missing assets

## Rationale

Hexagonal Architecture allows us to isolate the core business logic from external concerns, making the system more modular and easier to maintain. The new dynamic image loading system further enhances this by:

- **Reducing Coupling**: Eliminates hardcoded image imports
- **Improving Scalability**: Easy to add new component types
- **Enhancing Maintainability**: Centralized image management
- **Supporting Variants**: Consistent handling of different component states

By organizing the code into distinct layers with clear separation of concerns, we ensure that changes in one part of the system do not affect other parts, promoting clean architecture and enhanced testability.