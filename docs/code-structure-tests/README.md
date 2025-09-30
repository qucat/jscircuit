# Code Structure Tests

This directory contains tests that serve as living documentation, revealing the structure and behavior of the codebase. Unlike the main test suite (which focuses on correctness and regression testing), these tests are designed to:

1. **Demonstrate how features work** - Show the interaction between different components
2. **Reveal code architecture** - Make the relationships between classes visible
3. **Document expected behavior** - Provide concrete examples of how the system should behave
4. **Serve as learning tools** - Help developers understand the codebase structure

## Current Tests

### Element Placement Features

- **`test-immediate-placement.js`** - Demonstrates how elements immediately stick to the pointer when created
  - Shows the interaction between GUIAdapter, CircuitService, and mouse position tracking
  - Reveals the event-driven architecture with `startPlacing` events
  - Documents the grid snapping behavior

- **`test-escape-removal.js`** - Shows how the Escape key properly removes placing elements
  - Demonstrates the command pattern usage with `deleteSelection` 
  - Reveals the integration between keyboard events and circuit management
  - Documents the state cleanup process

- **`test-rotation-preservation.js`** - Shows how rotation is preserved during element movement
  - Demonstrates the coordinate transformation logic
  - Reveals how properties are stored and used for positioning
  - Documents the trigonometric calculations for rotated positioning

## How to Run

These tests are standalone and can be run individually:

```bash
node docs/code-structure-tests/test-immediate-placement.js
node docs/code-structure-tests/test-escape-removal.js  
node docs/code-structure-tests/test-rotation-preservation.js
```

## Purpose as Documentation

These tests reveal important architectural patterns:

1. **Event-driven architecture** - Shows how `CircuitService` uses events to coordinate between components
2. **Command pattern** - Demonstrates how user actions are encapsulated as commands
3. **State management** - Shows how element properties and positioning state are managed
4. **Coordinate transformations** - Reveals the mathematical logic behind element positioning
5. **Component interactions** - Shows how GUIAdapter orchestrates between different services

## Future Development

This approach can be extended to document other architectural aspects:
- Wire drawing and splitting behavior
- Property panel integration patterns  
- Undo/redo system mechanics
- Selection and multi-element operations
- File import/export workflows

Each test should focus on revealing one architectural concept while providing concrete, runnable examples of how the system works.