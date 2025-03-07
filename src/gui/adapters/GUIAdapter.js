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
 *    - Renders the circuit and **binds UI controls dynamically**.
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
   * @param {HTMLCanvasElement} canvas - The canvas element for rendering the circuit.
   * @param {CircuitService} circuitService - The service managing circuit logic.
   * @param {Object} elementRegistry - The registry of circuit elements.
   * @param {RendererFactory} rendererFactory - The factory for creating element renderers.
   * @param {GUICommandRegistry} guiCommandRegistry - The factory for creating commands.
   */
  constructor(canvas, circuitService, elementRegistry, rendererFactory, guiCommandRegistry) {
    this.canvas = canvas;
    this.circuitService = circuitService;
    this.elementRegistry = elementRegistry;
    this.circuitRenderer = new CircuitRenderer(canvas, circuitService, rendererFactory);
    this.guiCommandRegistry = guiCommandRegistry;
    this.commandHistory = new CommandHistory();
    this.dragCommand = null;
  }

  /**
   * Dynamically binds UI controls to their corresponding commands.
   */
  bindUIControls() {
    console.log("Binding UI controls in GUIAdapter...");
    console.log("Commands available:", this.guiCommandRegistry.getTypes());

    this.elementRegistry.getTypes().forEach((elementType) => {
      const buttonName = `add${elementType}`;
      console.log(`Searching for button: ${buttonName}`);

      const button = document.getElementById(buttonName);
      if (button) {
        console.log(`Found button: ${button.id}, binding addElement command for ${elementType}`);

        button.addEventListener("click", () => {
          console.log(`Executing addElement command for: ${elementType}`);

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
    console.log(`Executing command: ${commandName} with args:`, args);

    const command = this.guiCommandRegistry.get(commandName, ...args);
    if (command) {
      this.commandHistory.executeCommand(command, ...args);
    } else {
      console.warn(`Command "${commandName}" not found.`);
    }
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
   * Sets up canvas interactions for dragging elements.
   */
  setupCanvasInteractions() {
    this.canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      this.circuitRenderer.zoom(event);
    });

    this.canvas.addEventListener("mousedown", (event) => {
      const { offsetX, offsetY } = this.getTransformedMousePosition(event);
      this.dragCommand = this.guiCommandRegistry.get("dragElement", this.circuitService);

      if (this.dragCommand) {
        this.dragCommand.start(offsetX, offsetY);
      }
    });

    this.canvas.addEventListener("mousemove", (event) => {
      if (this.dragCommand) {
        const { offsetX, offsetY } = this.getTransformedMousePosition(event);
        this.dragCommand.move(offsetX, offsetY);
      }
    });

    this.canvas.addEventListener("mouseup", () => {
      if (this.dragCommand) {
        this.dragCommand.stop();
        this.dragCommand = null;
      }
    });

    // Enable panning with middle mouse button
    this.canvas.addEventListener("mousedown", (event) => {
      if (event.button === 1) {
        this.canvas.style.cursor = "grabbing";
        this.panStartX = event.clientX - this.circuitRenderer.offsetX;
        this.panStartY = event.clientY - this.circuitRenderer.offsetY;
      }
    });

    this.canvas.addEventListener("mousemove", (event) => {
      if (event.buttons === 4) {
        const newX = event.clientX - this.panStartX;
        const newY = event.clientY - this.panStartY;
        this.circuitRenderer.setPan(newX, newY);
      }
    });

    this.canvas.addEventListener("mouseup", () => {
      this.canvas.style.cursor = "default";
    });
  }

  /**
   * Adjusts mouse position based on zoom and pan.
   */
  getTransformedMousePosition(event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      offsetX: (event.clientX - rect.left - this.circuitRenderer.offsetX) / this.circuitRenderer.scale,
      offsetY: (event.clientY - rect.top - this.circuitRenderer.offsetY) / this.circuitRenderer.scale,
    };
  }
}
