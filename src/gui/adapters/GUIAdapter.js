import { CircuitRenderer } from "../renderers/CircuitRenderer.js";
import { CommandHistory } from "../commands/CommandHistory.js";

/**
 * @class GUIAdapter
 * @description
 * The `GUIAdapter` serves as the bridge between the user interface (UI) and the underlying application logic.
 * Instead of directly modifying the circuit, it retrieves and executes commands dynamically.
 *
 * **Core Concepts**:
 * - **Event-Driven Execution**: UI interactions trigger commands rather than modifying state directly.
 * - **Dynamic Command Injection**: Commands are managed by `GUICommandRegistry` and executed via `CommandHistory`.
 * - **Separation of Concerns**: The GUI delegates all logic to `CircuitService` via the command system.
 *
 * **Responsibilities**:
 * 1. **Initialization**:
 *    - Renders the circuit and **binds UI htmlelment controls/buttons dynamically**.
 * 2. **Command Execution**:
 *    - Retrieves commands from `GUICommandRegistry` and executes them.
 * 3. **Undo/Redo Support**:
 *    - Ensures that every executed command is trackable via `CommandHistory`.
 *
 * @example
 * const guiAdapter = new GUIAdapter(canvas, circuitService, elementRegistry);
 * guiAdapter.initialize();
 */
export class GUIAdapter {
  /**
   * @param {HTMLElement} controls - The controls/buttons div container element for adding components.
   * @param {HTMLCanvasElement} canvas - The canvas element for rendering the circuit.
   * @param {CircuitService} circuitService - The service managing circuit logic.
   * @param {Object} elementRegistry - The registry of circuit elements.
   * @param {RendererFactory} rendererFactory - The factory for creating element renderers.
   * @param {GUICommandRegistry} guiCommandRegistry - The factory for creating commands.
   */
  constructor(controls, canvas, circuitService, elementRegistry, rendererFactory, guiCommandRegistry) {
    this.controls = controls;
    this.canvas = canvas;
    this.circuitService = circuitService;
    this.elementRegistry = elementRegistry;
    this.circuitRenderer = new CircuitRenderer(canvas, circuitService, rendererFactory);
    this.guiCommandRegistry = guiCommandRegistry;
    this.commandHistory = new CommandHistory();
    this.dragCommand = null;
  }
  /**
   * Initializes the GUI by rendering the circuit and binding UI controls.
   */
  initialize() {
    this.circuitRenderer.render();
    this.bindUIControls();
    this.setupCanvasInteractions();

    // Listen for UI updates from CircuitService
    this.circuitService.on("update", () => this.circuitRenderer.render());
  }
  
  /**
   * Executes a command by retrieving it from `GUICommandRegistry` and executing via `CommandHistory`.
   * @param {string} commandName - The name of the command to execute.
   * @param {...any} args - Arguments to pass to the command.
   */
  executeCommand(commandName, ...args) {
    const command = this.guiCommandRegistry.get(commandName, ...args);
    if (command) {
      this.commandHistory.executeCommand(command, ...args);
    } else {
      console.warn(`Command "${commandName}" not found.`);
    }
  }

  /**
   * Dynamically binds UI controls to their corresponding commands.
   */
  bindUIControls() {
    this.elementRegistry.getTypes().forEach((elementType) => {
      const buttonName = `add${elementType}`;
      console.log(`Searching for button: ${buttonName}`);

      const button = this.controls.querySelector(`#${buttonName}`);
      if (button) {
        console.log(`Found button: ${button.id}, binding addElement command for ${elementType}`);

        button.addEventListener("click", () => {
          const command = this.guiCommandRegistry.get(
            "addElement",
            this.circuitService,
            this.circuitRenderer,
            this.elementRegistry,
            elementType
          );

          if (command) {
            command.execute();
            console.log(`Command 'addElement' executed for ${elementType}`);
          } else {
            console.warn(`Command 'addElement' not found for ${elementType}`);
          }
        });
      } else {
        console.warn(`Button for adding ${elementType} not found`);
      }
    });
  }

  /**
   * Executes a command by retrieving it from `GUICommandRegistry` and executing via `CommandHistory`.
   * @param {string} commandName - The name of the command to execute.
   * @param {...any} args - Arguments to pass to the command.
   */
  executeCommand(commandName, ...args) {
    const command = this.guiCommandRegistry.get(commandName, ...args);
    if (command) {
      this.commandHistory.executeCommand(command, ...args);
    } else {
      console.warn(`Command "${commandName}" not found.`);
    }
  }



  /**
   * Sets up canvas interactions like dragging elements, selecting elements, etc.
   */
  setupCanvasInteractions() {
    // 1) Zoom with wheel
    this.canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      this.circuitRenderer.zoom(event);
    });

    // 2) Mousedown
    this.canvas.addEventListener("mousedown", (event) => {
      // Middle mouse => panning
      if (event.button === 1) {
        this.canvas.style.cursor = "grabbing";
        this.panStartX = event.clientX - this.circuitRenderer.offsetX;
        this.panStartY = event.clientY - this.circuitRenderer.offsetY;
        return;
      }

      // Left mouse => could be drag or wire
      if (event.button === 0) {
        const { offsetX, offsetY } = this.getTransformedMousePosition(event);

        // Check if user clicked an existing element
        const element = this.findElementAt(offsetX, offsetY);
        if (element) {
          // We do dragElement
          this.activeCommand = this.guiCommandRegistry.get("dragElement", this.circuitService);
          if (this.activeCommand) {
            this.activeCommand.start(offsetX, offsetY);
          }
        } else {
          // We do drawWire
          this.activeCommand = this.guiCommandRegistry.get("drawWire", this.circuitService, this.elementRegistry);
          if (this.activeCommand) {
            this.activeCommand.start(offsetX, offsetY);
          }
        }

        // Reset our "did we move?" tracking
        this.hasDragged = false;
        this.mouseDownPos = { x: offsetX, y: offsetY };
      }
    });

    // 3) Mousemove
    this.canvas.addEventListener("mousemove", (event) => {
      // If we have an active command (drag or wire) => move
      if (this.activeCommand) {
        const { offsetX, offsetY } = this.getTransformedMousePosition(event);

        // Check if user has moved enough to count as a "drag"
        const dx = offsetX - this.mouseDownPos.x;
        const dy = offsetY - this.mouseDownPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 2) {
          this.hasDragged = true;
        }

        this.activeCommand.move(offsetX, offsetY);
      }
    });

    // 4) Mouseup
    this.canvas.addEventListener("mouseup", (event) => {
      // Stop panning
      if (event.button === 1) {
        this.canvas.style.cursor = "default";
        return;
      }

      // If we had an active command
      if (this.activeCommand) {
        // If user never really moved, we "cancel" for wires so no leftover dot
        if (!this.hasDragged && this.activeCommand.cancel) {
          this.activeCommand.cancel();
        }

        this.activeCommand.stop();
        this.activeCommand = null;
      }
    });
  }

  /**
   * Convert from screen coords to "world/circuit" coords
   */
  getTransformedMousePosition(event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      offsetX: (event.clientX - rect.left - this.circuitRenderer.offsetX) / this.circuitRenderer.scale,
      offsetY: (event.clientY - rect.top - this.circuitRenderer.offsetY) / this.circuitRenderer.scale,
    };
  }

    /**
   * A bounding check to see if the user clicked near any element (including wires).
   */
    findElementAt(worldX, worldY) {
      // We'll rely on the circuitRenderer or a helper to check each element.
      // If you have something like circuitRenderer.isInsideElement, use that.
      for (const element of this.circuitService.getElements()) {
        if (this.isInsideElement(worldX, worldY, element)) {
          return element;
        }
      }
      return null;
    }

    /**
     * Basic line or bounding-box check for an element.
     * If it's a wire, do line-dist. If it's a two-node element, do similar, etc.
     */
    isInsideElement(x, y, element) {
      if (element.nodes.length < 2) return false;

      const aura = 10;
      const [start, end] = element.nodes;
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const length = Math.hypot(dx, dy);
      if (length < 1e-6) {
        // It's effectively a point
        return Math.hypot(x - start.x, y - start.y) <= aura;
      }
      const distance = Math.abs(dy * x - dx * y + end.x * start.y - end.y * start.x) / length;
      if (distance > aura) return false;

      // Also ensure x,y is within the bounding box + aura
      const minX = Math.min(start.x, end.x) - aura;
      const maxX = Math.max(start.x, end.x) + aura;
      const minY = Math.min(start.y, end.y) - aura;
      const maxY = Math.max(start.y, end.y) + aura;
      if (x < minX || x > maxX || y < minY || y > maxY) return false;

      return true;
    }
}
