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
import { CircuitRenderer } from "../renderers/CircuitRenderer.js";
import { CommandHistory } from "../commands/CommandHistory.js";

export class GUIAdapter {
  constructor(controls, canvas, circuitService, elementRegistry, rendererFactory, guiCommandRegistry) {
    this.controls = controls;
    this.canvas = canvas;
    this.circuitService = circuitService;
    this.elementRegistry = elementRegistry;
    this.circuitRenderer = new CircuitRenderer(canvas, circuitService, rendererFactory);
    this.guiCommandRegistry = guiCommandRegistry;
    this.commandHistory = new CommandHistory();
    this.dragCommand = null;
    this.hasDragged = false;
    this.mouseDownPos = { x: 0, y: 0 };
    this.activeCommand = null;
  }

  initialize() {
    console.log("GUIAdapter initialized");
    this.circuitRenderer.render();
    this.bindUIControls();
    this.setupCanvasInteractions();

    this.circuitService.on("update", () => this.circuitRenderer.render());
  }

  executeCommand(commandName, ...args) {
    const command = this.guiCommandRegistry.get(commandName, ...args);
    if (command) {
      this.commandHistory.executeCommand(command, this.circuitService);
    } else {
      console.warn(`Command "${commandName}" not found.`);
    }
  }

  bindUIControls() {
    this.elementRegistry.getTypes().forEach((elementType) => {
      const buttonName = `add${elementType}`;
      console.log(`Searching for button: ${buttonName}`);

      const oldButton = this.controls.querySelector(`#${buttonName}`);
      if (oldButton) {
        const button = oldButton.cloneNode(true);
        oldButton.replaceWith(button);

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
            this.commandHistory.executeCommand(command, this.circuitService);
            console.log(`Command 'addElement' executed for ${elementType}`);
          } else {
            console.warn(`Command 'addElement' not found for ${elementType}`);
          }
        });
      } else {
        console.warn(`Button for adding ${elementType} not found`);
      }
    });

    const undoButton = this.controls.querySelector("#undoButton");
    if (undoButton) {
      undoButton.replaceWith(undoButton.cloneNode(true));
      this.controls.querySelector("#undoButton").addEventListener("click", () => {
        this.commandHistory.undo(this.circuitService);
        this.circuitRenderer.render();
      });
    } else {
      console.warn("Undo button not found");
    }

    const redoButton = this.controls.querySelector("#redoButton");
    if (redoButton) {
      redoButton.replaceWith(redoButton.cloneNode(true));
      this.controls.querySelector("#redoButton").addEventListener("click", () => {
        this.commandHistory.redo(this.circuitService);
        this.circuitRenderer.render();
      });
    } else {
      console.warn("Redo button not found");
    }
  }

  setupCanvasInteractions() {
    this.canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      this.circuitRenderer.zoom(event);
    });

    this.canvas.addEventListener("mousedown", (event) => {
      if (event.button === 1) {
        this.canvas.style.cursor = "grabbing";
        this.panStartX = event.clientX - this.circuitRenderer.offsetX;
        this.panStartY = event.clientY - this.circuitRenderer.offsetY;
        return;
      }

      if (event.button === 0) {
        const { offsetX, offsetY } = this.getTransformedMousePosition(event);

        const element = this.findElementAt(offsetX, offsetY);
        if (element) {
          this.activeCommand = this.guiCommandRegistry.get("dragElement", this.circuitService);
        } else {
          this.activeCommand = this.guiCommandRegistry.get("drawWire", this.circuitService, this.elementRegistry);
        }

        if (this.activeCommand) {
          this.activeCommand.beforeSnapshot = this.circuitService.exportState();
          this.activeCommand.start(offsetX, offsetY);
        }

        this.hasDragged = false;
        this.mouseDownPos = { x: offsetX, y: offsetY };
      }
    });

    this.canvas.addEventListener("mousemove", (event) => {
      if (this.activeCommand) {
        const { offsetX, offsetY } = this.getTransformedMousePosition(event);

        const dx = offsetX - this.mouseDownPos.x;
        const dy = offsetY - this.mouseDownPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 2) {
          this.hasDragged = true;
        }

        this.activeCommand.move(offsetX, offsetY);
      }
    });

    this.canvas.addEventListener("mouseup", (event) => {
      if (event.button === 1) {
        this.canvas.style.cursor = "default";
        return;
      }

      if (this.activeCommand) {
        if (!this.hasDragged && this.activeCommand.cancel) {
          this.activeCommand.cancel();
        } else {
          this.activeCommand.stop();
          const before = this.activeCommand.beforeSnapshot;
          const after = this.circuitService.exportState();

          const snapshotCommand = {
            execute: () => this.circuitService.importState(after),
            undo: () => this.circuitService.importState(before),
          };

          this.commandHistory.executeCommand(snapshotCommand, this.circuitService);
        }

        this.activeCommand = null;
      }
    });
  }

  getTransformedMousePosition(event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      offsetX: (event.clientX - rect.left - this.circuitRenderer.offsetX) / this.circuitRenderer.scale,
      offsetY: (event.clientY - rect.top - this.circuitRenderer.offsetY) / this.circuitRenderer.scale,
    };
  }

  findElementAt(worldX, worldY) {
    for (const element of this.circuitService.getElements()) {
      if (this.isInsideElement(worldX, worldY, element)) {
        return element;
      }
    }
    return null;
  }

  isInsideElement(x, y, element) {
    if (element.nodes.length < 2) return false;

    const aura = 10;
    const [start, end] = element.nodes;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    if (length < 1e-6) {
      return Math.hypot(x - start.x, y - start.y) <= aura;
    }
    const distance = Math.abs(dy * x - dx * y + end.x * start.y - end.y * start.x) / length;
    if (distance > aura) return false;

    const minX = Math.min(start.x, end.x) - aura;
    const maxX = Math.max(start.x, end.x) + aura;
    const minY = Math.min(start.y, end.y) - aura;
    const maxY = Math.max(start.y, end.y) + aura;
    if (x < minX || x > maxX || y < minY || y > maxY) return false;

    return true;
  }
}
