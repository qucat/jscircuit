# Custom Commands

Commands implement user interactions with undo/redo support. This guide shows you how to create custom commands.

## Command Pattern

All commands extend {@link GUICommand} and implement:
- `execute()` - Perform the action
- `undo()` - Reverse the action

## Basic Command Structure

```javascript
import { GUICommand } from './gui/commands/GUICommand.js';

export class MyCustomCommand extends GUICommand {
  constructor(circuitService, ...params) {
    super();
    this.circuitService = circuitService;
    this.params = params;
  }
  
  execute() {
    // Perform the action
    // Store state for undo
  }
  
  undo() {
    // Reverse the action
  }
}
```

## Example: Add Element Command

```javascript
export class AddElementCommand extends GUICommand {
  constructor(circuitService, elementType, position) {
    super();
    this.circuitService = circuitService;
    this.elementType = elementType;
    this.position = position;
    this.addedElement = null;
  }
  
  execute() {
    // Create and add the element
    this.addedElement = this.circuitService.addElement(
      this.elementType,
      this.position
    );
    return this.addedElement;
  }
  
  undo() {
    // Remove the element
    if (this.addedElement) {
      this.circuitService.removeElement(this.addedElement.id);
    }
  }
}
```

## Example: Delete Element Command

```javascript
export class DeleteElementCommand extends GUICommand {
  constructor(circuitService, elementId) {
    super();
    this.circuitService = circuitService;
    this.elementId = elementId;
    this.deletedElement = null;
  }
  
  execute() {
    // Store element for undo
    this.deletedElement = this.circuitService.getElement(this.elementId);
    
    // Remove from circuit
    this.circuitService.removeElement(this.elementId);
  }
  
  undo() {
    // Restore the element
    if (this.deletedElement) {
      this.circuitService.restoreElement(this.deletedElement);
    }
  }
}
```

## Interactive Commands

Some commands require user interaction (like dragging):

```javascript
export class MoveElementCommand extends GUICommand {
  constructor(circuitService, elementId) {
    super();
    this.circuitService = circuitService;
    this.elementId = elementId;
    this.startPosition = null;
    this.endPosition = null;
  }
  
  /**
   * Called when user starts dragging
   */
  start(position) {
    const element = this.circuitService.getElement(this.elementId);
    this.startPosition = { ...element.position };
  }
  
  /**
   * Called during drag
   */
  update(position) {
    this.circuitService.moveElement(this.elementId, position);
  }
  
  /**
   * Called when drag ends
   */
  execute(position) {
    this.endPosition = position;
    this.circuitService.moveElement(this.elementId, position);
  }
  
  undo() {
    this.circuitService.moveElement(this.elementId, this.startPosition);
  }
}
```

## Registering Commands

Register commands with {@link GUICommandRegistry}:

```javascript
import { GUICommandRegistry } from './gui/commands/GUICommandRegistry.js';

GUICommandRegistry.register('add-custom', (circuitService) => 
  new AddCustomElementCommand(circuitService)
);

GUICommandRegistry.register('delete-element', (circuitService, elementId) =>
  new DeleteElementCommand(circuitService, elementId)
);
```

## Keyboard Shortcuts

Bind commands to keyboard shortcuts in the menu configuration:

```javascript
// In menu.config.yaml
commands:
  - key: 'M'
    command: 'add-custom'
    description: 'Add custom element'
```

## Command History

The system automatically manages command history for undo/redo:

```javascript
// In GUIAdapter
commandHistory.execute(new AddElementCommand(...));

// User presses Ctrl+Z
commandHistory.undo();

// User presses Ctrl+Y
commandHistory.redo();
```

## Best Practices

- ✅ Always implement both `execute()` and `undo()`
- ✅ Store enough state to properly undo
- ✅ Handle edge cases (element not found, etc.)
- ✅ Keep commands focused on one action
- ✅ Test undo/redo thoroughly
- ✅ Don't modify state outside the command

## Testing Commands

```javascript
// Example test
const command = new AddElementCommand(service, 'Capacitor', {x: 100, y: 100});

// Test execute
command.execute();
assert(service.getElements().length === 1);

// Test undo
command.undo();
assert(service.getElements().length === 0);
```

## Next Steps

- Learn about {@tutorial custom-elements} to create elements for your commands
- See {@tutorial architecture overview} to understand the command pattern in context
