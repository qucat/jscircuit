# C4 Level 4: Code

This diagram shows the key classes and their relationships in the JSCircuit Editor.

```mermaid
classDiagram
    class Circuit {
        -Map~string,Element~ elements
        -Connection[] connections
        +addElement(element: Element): void
        +removeElement(id: string): void
        +validateCircuit(): boolean
        +getElements(): Element[]
        +getConnections(): Connection[]
    }

    class Element {
        <<abstract>>
        #string id
        #Position position
        #Properties properties
        +getId(): string
        +getPosition(): Position
        +setPosition(position: Position): void
        +getProperties(): Properties
    }

    class Resistor {
        -number resistance
        +getResistance(): number
        +setResistance(value: number): void
    }

    class Capacitor {
        -number capacitance
        +getCapacitance(): number
        +setCapacitance(value: number): void
    }

    class Junction {
        -number energy
        +getEnergy(): number
        +setEnergy(value: number): void
    }

    class CircuitService {
        -Circuit circuit
        -ElementRegistry elementRegistry
        +addElement(type: string, position: Position, properties: Properties): void
        +deleteElement(id: string): void
        +connectElements(id1: string, id2: string): void
        +exportState(): object
        +importState(state: object): void
        +emit(event: string, data: any): void
    }

    class GUIAdapter {
        -CircuitRenderer renderer
        -CommandHistory commandHistory
        -GUICommandRegistry commandRegistry
        +handleAction(actionId: string): void
        +setupEventListeners(): void
        +bindMenuActions(): void
    }

    class CircuitRenderer {
        -HTMLCanvasElement canvas
        -Circuit circuit
        +renderCircuit(circuit: Circuit): void
        +handleMouseEvents(): void
        +showZoomMessage(message: string): void
        +getSelectedElements(): Element[]
    }

    class Command {
        <<interface>>
        +execute(): object
    }

    class AddElementCommand {
        -CircuitService circuitService
        -string elementType
        -Position position
        +execute(): object
    }

    class Position {
        -number x
        -number y
        +getX(): number
        +getY(): number
    }

    class Properties {
        -Map~string,any~ values
        +get(key: string): any
        +set(key: string, value: any): void
    }

    Element <|-- Resistor
    Element <|-- Capacitor
    Element <|-- Junction
    Circuit *-- Element
    Element *-- Position
    Element *-- Properties
    CircuitService --> Circuit
    CircuitService --|> EventEmitter
    GUIAdapter --> CircuitRenderer
    GUIAdapter --> CommandHistory
    CircuitRenderer --> Circuit
    Command <|.. AddElementCommand
    AddElementCommand --> CircuitService
```

## Key Classes

### Core Domain Classes

#### Circuit (Aggregate Root)
- **Purpose**: Central aggregate managing the entire circuit state
- **Responsibilities**: Element management, validation, state consistency
- **Key Methods**: addElement(), removeElement(), validateCircuit()

#### Element (Abstract Base)
- **Purpose**: Base class for all circuit components
- **Concrete Implementations**: Resistor, Capacitor, Inductor, Junction, Ground, Wire
- **Key Properties**: id, position, properties

#### Value Objects
- **Position**: Immutable coordinate representation (x, y)
- **Properties**: Key-value store for element-specific attributes
- **Label**: Text identifier for elements

### Application Service Pattern

#### CircuitService
- **Purpose**: Main orchestrator for circuit operations
- **Pattern**: Application Service + Event Emitter
- **Responsibilities**: Command coordination, state management, event broadcasting

### GUI Architecture

#### GUIAdapter
- **Purpose**: Bridge between UI events and domain commands
- **Pattern**: Adapter + Mediator
- **Responsibilities**: Event handling, command routing, UI coordination

#### CircuitRenderer
- **Purpose**: Canvas-based visual representation of circuits
- **Technology**: HTML5 Canvas API
- **Responsibilities**: Rendering, user interaction, visual feedback

### Command Pattern Implementation

#### Command Interface
- **Purpose**: Encapsulate user actions as executable objects
- **Pattern**: Command Pattern
- **Implementations**: AddElementCommand, DeleteElementCommand, RotateElementCommand

## Design Patterns Used

1. **Domain-Driven Design (DDD)**: Clear separation of domain logic
2. **Command Pattern**: All user actions as reversible commands
3. **Factory Pattern**: Element and renderer creation
4. **Observer Pattern**: Event-driven GUI updates
5. **Repository Pattern**: Data persistence abstraction
6. **Adapter Pattern**: External system integration