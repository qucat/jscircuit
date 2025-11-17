/**
 * @module GUIAdapter
 * @description
 * Bridges UI and application logic.
 *
 * UI adapters (menubar, keyboard, mouse) emit **semantic action ids** (from YAML/JSON config).
 * GUIAdapter maps those ids to domain commands (via GUICommandRegistry + CommandHistory)
 * or to view-only renderer operations. State changes emit "update" → Renderer re-renders.
 *
 */

import { CircuitRenderer } from "../renderers/CircuitRenderer.js";
import { CommandHistory } from "../commands/CommandHistory.js";
import { ACTIONS, KEYMAP } from "../../config/menu.bindings.js";
import { PropertyPanel } from "../property_panel/PropertyPanel.js";
import { Logger } from "../../utils/Logger.js";
import { throttle } from "../../utils/PerformanceUtils.js";
import { GRID_CONFIG } from "../../config/gridConfig.js";


/**
 * @class GUIAdapter
 * @classdesc
 * Translates user intents to domain operations (commands) or view ops.
 *
 * **Core Concepts**
 * - Event-driven execution (actions come from config-driven UI).
 * - Command injection via GUICommandRegistry.
 * - Undo/Redo via CommandHistory.
 *
 * **Responsibilities**
 * 1) Render via CircuitRenderer.
 * 2) Bind UI inputs (menu, keyboard, mouse) to actions.
 * 3) Execute actions against domain (commands/history) or renderer (view).
 */
export class GUIAdapter {
  /**
   * @constructor
   * @param {?HTMLElement} _controls Deprecated. Kept for signature compatibility; not used.
   * @param {!HTMLCanvasElement} canvas Canvas for circuit rendering.
   * @param {!CircuitService} circuitService Core domain service (aggregate orchestration, emits "update").
   * @param {!ElementRegistry} elementRegistry Registry of circuit components (DI).
   * @param {!RendererFactory} rendererFactory Factory for creating renderers (DI).
   * @param {!GUICommandRegistry} guiCommandRegistry Registry for GUI commands (DI).
   */
  constructor(
    _controls,
    canvas,
    circuitService,
    elementRegistry,
    rendererFactory,
    guiCommandRegistry,
  ) {
    /** @private @const {!HTMLCanvasElement} */
    this.canvas = canvas;
    /** @private @const {!CircuitService} */
    this.circuitService = circuitService;
    /** @private @const {!ElementRegistry} */
    this.elementRegistry = elementRegistry;

    /** @private @const {!CircuitRenderer} */
    this.circuitRenderer = new CircuitRenderer(
      canvas,
      circuitService,
      rendererFactory,
      () => this.activeCommand !== null, // Function to check if there's an active command
    );

    /** @private @const {!GUICommandRegistry} */
    this.guiCommandRegistry = guiCommandRegistry;

    /** @private @const {!CommandHistory} */
    this.commandHistory = new CommandHistory();

    // Interaction state
    /** @private */
    this.activeCommand = null;
    /** @private */
    this.hasDragged = false;
    /** @private */
    this.mouseDownPos = { x: 0, y: 0 };
    /** @private */
    this.wireDrawingMode = false; // Wire drawing mode state
    /** @private */
    this.placingElement = null;
    /** @private */
    this.selectionBox = null; // Selection box state: { startX, startY, endX, endY }
    /** @private */
    this.isSelecting = false; // True when drawing selection box
    /** @private */
    this.currentMousePos = { x: 0, y: 0 }; // Track current mouse position for immediate placement

    // Listener refs for clean disposal
    /** @private */ this._onMenuAction = null;
    /** @private */ this._onKeydown = null;
    /** @private */ this._onWheel = null;
    /** @private */ this._onImageLoaded = null;
  }

  /**
   * Initializes bindings and performs the initial render.
   * - Menu (config-driven) → ui:action
   * - Keyboard shortcuts (from YAML/JSON)
   * - Ctrl+wheel → zoom
   * - Mouse on canvas → draw/drag/wire logic
   */
  initialize() {
    // Declarative inputs
    this.bindMenu();
    this.bindShortcuts(KEYMAP);
    this.bindWheelZoom();
    this.bindImageLoadEvents();

    // Pointer interactions on canvas
    this.setupCanvasInteractions();

    // Property panel integration
    this.setupPropertyPanel();

    // Re-render on domain state changes
    this.circuitService.on("update", () => this.circuitRenderer.render());

    // Perform initial render
    this.circuitRenderer.render();
  }

  /**
   * Unhook global listeners (useful for hot-reload/tests).
   */
  dispose() {
    if (this._onMenuAction) document.removeEventListener("ui:action", this._onMenuAction);
    if (this._onKeydown) document.removeEventListener("keydown", this._onKeydown);
    if (this._onWheel) this.canvas.removeEventListener("wheel", this._onWheel);
    if (this._onImageLoaded) document.removeEventListener("renderer:imageLoaded", this._onImageLoaded);
  }

  /* ---------------------------------------------------------------------- */
  /*                               BINDERS                                  */
  /* ---------------------------------------------------------------------- */

  /**
   * Bind config-driven menubar events to action handling.
   * The MenuBar emits: CustomEvent('ui:action', { detail: { id } }).
   */
  bindMenu() {
    this._onMenuAction = (e) => this.handleAction(e.detail.id);
    document.addEventListener("ui:action", this._onMenuAction);
  }

  /**
   * Bind global keyboard shortcuts to the same action ids from config.
   * @param {!Object<string,string>} keymap Map of "Ctrl+X" → "action.id"
   */
  bindShortcuts(keymap) {
    const signature = (e) => {
      const ctrl = e.ctrlKey || e.metaKey ? "Ctrl+" : "";
      let key = e.key;
      
      // Map arrow keys to text names to match menu config
      const arrowMap = {
        'ArrowRight': 'Right',
        'ArrowLeft': 'Left', 
        'ArrowUp': 'Up',
        'ArrowDown': 'Down'
      };
      
      // Map special keys to match menu config names
      const specialKeyMap = {
        'Delete': 'Del',
        'Backspace': 'Del'  // Both Del and Backspace should trigger delete
      };
      
      if (arrowMap[key]) {
        key = arrowMap[key];
      } else if (specialKeyMap[key]) {
        key = specialKeyMap[key];
      } else if (key.length === 1) {
        key = key.toUpperCase();
      }
      
      return ctrl + key;
    };

    this._onKeydown = (e) => {
      // Handle Escape key to cancel wire drawing mode
      if (e.key === 'Escape' && this.wireDrawingMode) {
        this.resetCursor();
        console.log("[GUIAdapter] Wire drawing mode cancelled");
        e.preventDefault();
        return;
      }

      // Handle Escape key to cancel element placement
      if (e.key === 'Escape' && this.placingElement) {
        console.log("[GUIAdapter] Element placement cancelled with Escape");
        
        // Delete only the placing element, not all selected elements
        this.circuitService.deleteElement(this.placingElement.id);
        
        // Clear placement mode
        this.placingElement = null;
        // Clear selection since placement was cancelled
        this.circuitRenderer.setSelectedElements([]);
        this.circuitRenderer.render();
        e.preventDefault();
        return;
      }

      // Handle rotation keys during element placement
      if (this.placingElement && e.ctrlKey) {
        let rotationAngle = 0;
        
        if (e.key === 'ArrowRight') {
          rotationAngle = 90; // Rotate 90° clockwise
          e.preventDefault();
        } else if (e.key === 'ArrowLeft') {
          rotationAngle = -90; // Rotate 90° counterclockwise
          e.preventDefault();
        } else if (e.key === 'ArrowUp') {
          rotationAngle = 180; // Rotate 180°
          e.preventDefault();
        } else if (e.key === 'ArrowDown') {
          rotationAngle = 180; // Rotate 180° (same as up for simple elements)
          e.preventDefault();
        }

        if (rotationAngle !== 0) {
          this.rotatePlacingElement(rotationAngle);
          return;
        }
      }

      const sig = signature(e);
      const id = keymap[sig];
      if (!id) return;
      e.preventDefault();
      this.handleAction(id);
    };

    document.addEventListener("keydown", this._onKeydown);
  }

  /**
   * Convert Ctrl+wheel into renderer zoom steps (declarative equivalent).
   * Leaves normal scrolling alone if Ctrl is not pressed.
   */
  bindWheelZoom() {
    // Let CircuitRenderer handle wheel events directly - it has its own zoom method
    // No need to bind wheel events here as CircuitRenderer.initEventListeners() handles them
  }

  /**
   * Bind renderer image load events to trigger re-renders when images finish loading.
   */
  bindImageLoadEvents() {
    this._onImageLoaded = (event) => {
      // Re-render when any renderer image loads
      this.circuitRenderer.render();
    };
    document.addEventListener("renderer:imageLoaded", this._onImageLoaded);
  }

  /* ---------------------------------------------------------------------- */
  /*                          ACTION ROUTING (DECLARATIVE)                  */
  /* ---------------------------------------------------------------------- */

  /**
   * Handle a semantic action id from the config.
   * @param {string} id Action identifier (e.g., "edit.undo", "insert.resistor").
   */
  handleAction(id) {
    /** @type {ActionSpec|undefined} */
    const spec = ACTIONS[id];
    if (!spec) {
      console.warn("[GUIAdapter] Unhandled action id:", id);
      return;
    }
    if (spec.kind === "disabled") {
      console.warn(`[GUIAdapter] '${id}' is disabled.`);
      return;
    }

    this._exec(spec);

    // Note: Domain operations (commands) will emit "update" → render() automatically via event listener.
    // Only render manually for UI-only operations that don't trigger domain events.
    if (spec.kind !== "command") {
      this.circuitRenderer.render();
    }
  }

  /**
   * Execute a declarative action spec (from YAML/JSON).
   * @param {!ActionSpec} spec
   * @private
   */
  _exec(spec) {
    switch (spec.kind) {
      case "command": {
        // Special handling for wire drawing mode
        if (spec.name === "addElement" && spec.args && spec.args[0] === "Wire") {
          this.wireDrawingMode = true;
          this.setCrosshairCursor();
          console.log("[GUIAdapter] Wire drawing mode activated");
          return;
        }

        // If user is creating a non-wire element while in wire drawing mode, exit wire mode
        if (spec.name === "addElement" && this.wireDrawingMode && spec.args && spec.args[0] !== "Wire") {
          this.resetCursor();
          console.log("[GUIAdapter] Wire drawing mode deactivated - creating", spec.args[0]);
        }

        const args = spec.args ?? [];
        const cmd = this.guiCommandRegistry.get(
          spec.name,
          this.circuitService,
          this.circuitRenderer,
          this.elementRegistry,
          ...args
        );
        if (!cmd) {
          console.warn("[GUIAdapter] Missing command:", spec.name, args);
          return;
        }
        
        // Special handling for addElement: pass current mouse position for grid alignment
        if (spec.name === "addElement" && cmd.setMousePosition && this.currentMousePos) {
          cmd.setMousePosition(this.currentMousePos);
        }
        
        this.commandHistory.executeCommand(cmd, this.circuitService);
        break;
      }

      case "history": {
        if (spec.op === "undo") this.commandHistory.undo(this.circuitService);
        else if (spec.op === "redo") this.commandHistory.redo(this.circuitService);
        else console.warn("[GUIAdapter] Unknown history op:", spec.op);
        break;
      }

      case "renderer": {
        // Support special shorthands (no need to expose renderer internals in config)
        if (spec.op === "zoomStep") {
          this._zoomStep(spec.args?.[0] ?? +1);
          break;
        }
        if (spec.op === "recenter") {
          this._recenterView();
          break;
        }
        // Power-user path: call renderer method by name if it exists
        if (typeof this.circuitRenderer[spec.op] === "function") {
          this.circuitRenderer[spec.op](...(spec.args ?? []));
        } else {
          console.warn("[GUIAdapter] Unknown renderer op:", spec.op);
        }
        break;
      }

      case "todo": {
        console.warn("[GUIAdapter] TODO:", spec.note ?? "(no note)");
        break;
      }

      case "disabled": {
        // No-op for disabled menu items
        break;
      }

      default: {
        console.warn("[GUIAdapter] Unknown action kind:", /** @type {*} */(spec).kind, spec);
      }
    }
  }

  /**
   * Renderer zoom helper; mimics your existing `zoom(event)` API.
   * @param {number} sign +1 for out, -1 for in
   * @private
   */
  _zoomStep(sign) {
    // Get canvas center for zoom focus when using menu commands
    const rect = this.canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const evtLike = {
      deltaY: sign > 0 ? 100 : -100,
      ctrlKey: true,
      offsetX: centerX,
      offsetY: centerY,
      preventDefault() {}
    };
    this.circuitRenderer.zoom(evtLike);
  }

  /**
   * Recenter the view; prefers a renderer method if available, otherwise resets transform.
   * @private
   */
  _recenterView() {
    if (typeof this.circuitRenderer.reCenter === "function") {
      this.circuitRenderer.reCenter();
      return;
    }
    // Fallback: reset to defaults expected by your interaction math.
    this.circuitRenderer.scale = 1;
    this.circuitRenderer.offsetX = 0;
    this.circuitRenderer.offsetY = 0;
  }

  /* ---------------------------------------------------------------------- */
  /*                        CANVAS INTERACTIONS (UNCHANGED)                  */
  /* ---------------------------------------------------------------------- */

  /**
   * Sets up mouse events for interaction on the canvas: pan (MMB), drag, draw, placement.
   * Note: Ctrl+wheel zoom is handled by bindWheelZoom(); regular wheel is left to the page.
   */
  setupCanvasInteractions() {
    // Middle-mouse pan start
    this.canvas.addEventListener("mousedown", (event) => {
      if (event.button === 1) {
        this.canvas.style.cursor = "grabbing";
        this.panStartX = event.clientX - this.circuitRenderer.offsetX;
        this.panStartY = event.clientY - this.circuitRenderer.offsetY;
        return;
      }

      const { offsetX, offsetY } = this.getTransformedMousePosition(event);

      // If placing an element, finalize its position on left click
      if (event.button === 0 && this.placingElement) {
        const snappedX = GRID_CONFIG.snapToGrid(offsetX);
        const snappedY = GRID_CONFIG.snapToGrid(offsetY);

        // Get current orientation from element properties (preserve rotation)
        const currentOrientation = this.placingElement.properties?.values?.orientation || 0;
        const angleRad = (currentOrientation * Math.PI) / 180;
        
        // Use grid configuration to calculate proper node positions that align to grid
        const nodePositions = GRID_CONFIG.calculateNodePositions(snappedX, snappedY, angleRad);
        this.placingElement.nodes[0].x = nodePositions.start.x;
        this.placingElement.nodes[0].y = nodePositions.start.y;
        this.placingElement.nodes[1].x = nodePositions.end.x;
        this.placingElement.nodes[1].y = nodePositions.end.y;

        this.circuitService.emit("update", {
          type: "finalizePlacement",
          element: this.placingElement,
        });

        // Store reference to placed element for property panel
        const placedElement = this.placingElement;
        
        this.placingElement = null;
        // Keep the placed element selected for user convenience
        this.circuitRenderer.setSelectedElements([placedElement]);
        this.circuitRenderer.render();
        
        // Open property panel immediately after placing element
        console.log("[GUIAdapter] Auto-opening property panel for newly placed element:", placedElement.id);
        this.handleElementDoubleClick(placedElement, true); // true indicates this is a newly placed element
        
        return;
      }

      // Regular command start
      if (event.button === 0) {
        // Wire drawing mode takes priority over all other interactions
        if (this.wireDrawingMode) {
          // In wire drawing mode, always start wire drawing regardless of what's under the cursor
          // This allows drawing wire nodes on top of existing nodes/elements
          console.log("[GUIAdapter] Wire drawing mode: creating wire node at", offsetX, offsetY);
          this.activeCommand = this.guiCommandRegistry.get(
            "drawWire",
            this.circuitService,
            this.elementRegistry,
          );
        } else {
          // Normal interaction logic when not in wire drawing mode
          const element = this.findElementAt(offsetX, offsetY);

          // If clicking on an element, select it first
          if (element) {
            const selectCommand = this.guiCommandRegistry.get("selectElement");
            if (selectCommand) {
              selectCommand.execute(element);
            }
          }

          // Determine which command to start based on context
          if (element) {
            // Clicking on an element starts drag
            this.activeCommand = this.guiCommandRegistry.get("dragElement", this.circuitService);
          } else {
            // Clicking on empty space starts selection box
            this.startSelectionBox(offsetX, offsetY);
            this.activeCommand = null;
          }
        }

        if (this.activeCommand) {
          const before = this.circuitService.exportState();
          this.activeCommand.start(offsetX, offsetY);
          this.activeCommand.beforeSnapshot = before;
        }

        this.hasDragged = false;
        this.mouseDownPos = { x: offsetX, y: offsetY };
      }
    });

    // Move / live placement preview / command move
    this.canvas.addEventListener("mousemove", (event) => {
      const { offsetX, offsetY } = this.getTransformedMousePosition(event);
      
      // Always track current mouse position for immediate element placement
      this.currentMousePos.x = offsetX;
      this.currentMousePos.y = offsetY;

      // Live update for placing element
      if (this.placingElement) {
        const snappedX = GRID_CONFIG.snapToGrid(offsetX);
        const snappedY = GRID_CONFIG.snapToGrid(offsetY);

        // Get current orientation from element properties (preserve rotation)
        const currentOrientation = this.placingElement.properties?.values?.orientation || 0;
        const angleRad = (currentOrientation * Math.PI) / 180;
        
        // Use grid configuration to calculate proper node positions that align to grid
        const nodePositions = GRID_CONFIG.calculateNodePositions(snappedX, snappedY, angleRad);
        this.placingElement.nodes[0].x = nodePositions.start.x;
        this.placingElement.nodes[0].y = nodePositions.start.y;
        this.placingElement.nodes[1].x = nodePositions.end.x;
        this.placingElement.nodes[1].y = nodePositions.end.y;

        this.circuitService.emit("update", {
          type: "movePreview",
          element: this.placingElement,
        });

        return;
      }

      // Update selection box if selecting
      if (this.isSelecting) {
        this.updateSelectionBox(offsetX, offsetY);
        return;
      }

      // Regular move for active command
      if (this.activeCommand) {
        const dx = offsetX - this.mouseDownPos.x;
        const dy = offsetY - this.mouseDownPos.y;
        if (Math.sqrt(dx * dx + dy * dy) > 2) {
          this.hasDragged = true;
        }
        this.activeCommand.move(offsetX, offsetY);
      }
    });

    // Mouse up → finalize command / snapshot for undo
    this.canvas.addEventListener("mouseup", (event) => {
      if (event.button === 1) {
        this.canvas.style.cursor = "default";
        return;
      }

      const { offsetX, offsetY } = this.getTransformedMousePosition(event);

      // Finalize selection box if selecting
      if (this.isSelecting) {
        this.finalizeSelection();
        return;
      }

      if (this.activeCommand) {
        const before = this.activeCommand.beforeSnapshot;
        const wasWireDrawing = this.activeCommand.constructor.name === 'DrawWireCommand';

        if (!this.hasDragged && this.activeCommand.cancel) {
          this.activeCommand.cancel();
        } else {
          this.activeCommand.stop();
          const after = this.circuitService.exportState();

          if (this.hasStateChanged(before, after)) {
            // Convert the delta into a single undoable snapshot command
            this.circuitService.importState(before);

            const snapshotCommand = {
              execute: () => this.circuitService.importState(after),
              undo: () => this.circuitService.importState(before),
            };

            this.commandHistory.executeCommand(snapshotCommand, this.circuitService);
          }
        }

        // Reset wire drawing mode after completing a wire
        if (wasWireDrawing && this.wireDrawingMode) {
          this.resetCursor();
          console.log("[GUIAdapter] Wire drawing mode deactivated");
        }

        this.activeCommand = null;
      }
    });

    // Listen to the element placement event
    this.circuitService.on("startPlacing", ({ element }) => {
      this.placingElement = element;
      
      // Clear existing selections and select only the placing element
      // This ensures rotation during placement only affects the placing element
      this.circuitRenderer.setSelectedElements([element]);
      console.log("[GUIAdapter] Starting placement mode - selected placing element:", element.id);
      
      // Immediately position the element at the current mouse position
      // This prevents the element from staying at default coordinates until mouse movement
      const snappedX = GRID_CONFIG.snapToGrid(this.currentMousePos.x);
      const snappedY = GRID_CONFIG.snapToGrid(this.currentMousePos.y);

      // Get current orientation from element properties (preserve rotation)
      const currentOrientation = element.properties?.values?.orientation || 0;
      const angleRad = (currentOrientation * Math.PI) / 180;
      
      // Use grid configuration to calculate proper node positions that align to grid
      const nodePositions = GRID_CONFIG.calculateNodePositions(snappedX, snappedY, angleRad);
      element.nodes[0].x = nodePositions.start.x;
      element.nodes[0].y = nodePositions.start.y;
      element.nodes[1].x = nodePositions.end.x;
      element.nodes[1].y = nodePositions.end.y;

      // Emit update to immediately show the element at the correct position
      this.circuitService.emit("update", {
        type: "movePreview",
        element: element,
      });
      
      // If user starts placing a non-wire element while in wire drawing mode, exit wire mode
      if (this.wireDrawingMode && element.type !== 'wire') {
        this.resetCursor();
        console.log("[GUIAdapter] Wire drawing mode deactivated - placing", element.type);
      }
    });
  }

  /**
   * Sets up property panel integration with double-click handling.
   */
  setupPropertyPanel() {
    // Set up double-click callback on the circuit renderer
    this.circuitRenderer.setElementDoubleClickCallback((element) => {
      this.handleElementDoubleClick(element);
    });
  }

  /**
   * Handles double-click on circuit elements to open property panel.
   * @param {Object} element - The clicked circuit element
   * @param {boolean} isNewlyPlaced - Whether this element was just placed (true) or is being edited (false)
   */
  handleElementDoubleClick(element, isNewlyPlaced = false) {
    if (!element) return;
    
    // Skip property panel for ground elements - they don't need labeling or property editing
    if (element.type === 'ground') {
      return;
    }

    // Open property panel for the element
    this.propertyPanel = new PropertyPanel();
    console.log("[GUIAdapter] Opening property panel for element:", element.id, "newly placed:", isNewlyPlaced);
    this.propertyPanel.show(element,
      // onSave callback
      (element, updatedProperties) => {
        console.log("[GUIAdapter] Property panel save callback with properties:", updatedProperties);
        // Handle property save - get fresh command instance
        const command = this.guiCommandRegistry.get('updateElementProperties');
        if (command) {
          command.setData(element.id, updatedProperties);
          this.commandHistory.executeCommand(command, this.circuitService);
        }
      },
      // onCancel callback
      () => {
        console.log("[GUIAdapter] Property panel cancelled for element:", element.id, "newly placed:", isNewlyPlaced);
        if (isNewlyPlaced) {
          // If this element was just placed and user cancelled, delete it
          console.log("[GUIAdapter] Removing newly placed element due to cancellation:", element.id);
          // Delete only the specific element, not all selected elements
          this.circuitService.deleteElement(element.id);
          // Clear selections since we deleted the element
          this.circuitRenderer.setSelectedElements([]);
          this.circuitRenderer.render();
        }
      }
    );
  }

  /**
   * Convert screen to world coords, accounting for renderer transform.
   * @param {!MouseEvent} event
   * @returns {{offsetX:number, offsetY:number}}
   */
  getTransformedMousePosition(event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      offsetX:
        (event.clientX - rect.left - this.circuitRenderer.offsetX) /
        this.circuitRenderer.scale,
      offsetY:
        (event.clientY - rect.top - this.circuitRenderer.offsetY) /
        this.circuitRenderer.scale,
    };
  }

  /**
   * Find the most appropriate element at given world coordinates.
   * Prioritizes elements with nodes close to the click point, and non-wire elements over wires.
   * @param {number} worldX
   * @param {number} worldY
   * @returns {?Object} element or null
   */
  findElementAt(worldX, worldY) {
    const elements = this.circuitService.getElements();
    const nodeProximityThreshold = 15; // Distance to prioritize node-based selection

    let bestElement = null;
    let bestScore = -1;

    for (const element of elements) {
      if (!this.isInsideElement(worldX, worldY, element)) continue;

      // Calculate selection score based on proximity to nodes and element type
      let score = 0;

      // Check if click is close to any node of this element
      let closestNodeDistance = Infinity;
      if (Array.isArray(element.nodes)) {
        for (const node of element.nodes) {
          const distance = Math.hypot(worldX - node.x, worldY - node.y);
          closestNodeDistance = Math.min(closestNodeDistance, distance);
        }
      }

      // Higher score for elements with nodes close to click point
      if (closestNodeDistance <= nodeProximityThreshold) {
        score += 100 - closestNodeDistance; // Closer nodes get higher scores
      }

      // Prioritize non-wire elements over wires
      if (element.type !== 'wire') {
        score += 50;
      }

      // Update best element if this one has a higher score
      if (score > bestScore) {
        bestScore = score;
        bestElement = element;
      }
    }

    return bestElement;
  }

  /**
   * Hit-test for a line-like element with an "aura".
   * @param {number} x
   * @param {number} y
   * @param {!Object} element
   * @returns {boolean}
   */
  isInsideElement(x, y, element) {
    if (element.nodes.length < 2) return false;
    const aura = 10;
    const [start, end] = element.nodes;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    if (length < 1e-6) return Math.hypot(x - start.x, y - start.y) <= aura;
    const distance =
      Math.abs(dy * x - dx * y + end.x * start.y - end.y * start.x) / length;
    if (distance > aura) return false;
    const minX = Math.min(start.x, end.x) - aura;
    const maxX = Math.max(start.x, end.x) + aura;
    const minY = Math.min(start.y, end.y) - aura;
    const maxY = Math.max(start.y, end.y) + aura;
    return !(x < minX || x > maxX || y < minY || y > maxY);
  }

  /**
   * Shallow state delta check for snapshotting (undo batching).
   * @param {string|Object} before JSON string or object
   * @param {string|Object} after JSON string or object
   * @returns {boolean}
   */
  hasStateChanged(before, after) {
    before = typeof before === "string" ? JSON.parse(before) : before;
    after  = typeof after  === "string" ? JSON.parse(after)  : after;
    if (!before || !after) return true;
    if (before.elements.length !== after.elements.length) return true;
    for (let i = 0; i < before.elements.length; i++) {
      const a = before.elements[i];
      const b = after.elements[i];
      if (a.id !== b.id || a.type !== b.type) return true;
      if (JSON.stringify(a.nodes) !== JSON.stringify(b.nodes)) return true;
    }
    return false;
  }

  /**
   * Start selection box drawing
   * @param {number} x World X coordinate
   * @param {number} y World Y coordinate
   * @private
   */
  startSelectionBox(x, y) {
    this.isSelecting = true;
    this.selectionBox = {
      startX: x,
      startY: y,
      endX: x,
      endY: y
    };
    console.log("[GUIAdapter] Started selection box at", x, y);
  }

  /**
   * Update selection box during drag
   * @param {number} x World X coordinate
   * @param {number} y World Y coordinate
   * @private
   */
  updateSelectionBox(x, y) {
    if (!this.selectionBox) return;
    
    this.selectionBox.endX = x;
    this.selectionBox.endY = y;
    
    // Pass selection box to renderer
    this.circuitRenderer.setSelectionBox(this.selectionBox);
    
    // Trigger re-render to show selection box
    this.circuitRenderer.render();
  }

  /**
   * Finalize selection and select elements within box
   * @private
   */
  finalizeSelection() {
    if (!this.selectionBox) return;

    const { startX, startY, endX, endY } = this.selectionBox;
    
    // Normalize box coordinates
    const left = Math.min(startX, endX);
    const right = Math.max(startX, endX);
    const top = Math.min(startY, endY);
    const bottom = Math.max(startY, endY);

    // Check if this was just a click (very small selection box)
    const boxWidth = right - left;
    const boxHeight = bottom - top;
    const isJustClick = boxWidth <= 5 && boxHeight <= 5;

    // Find elements within selection box
    const selectedElements = this.circuitService.getElements().filter(element => {
      return this.isElementInBox(element, left, top, right, bottom);
    });

    if (selectedElements.length > 0) {
      // Select all elements using multi-select command
      const multiSelectCommand = this.guiCommandRegistry.get("multiSelectElement");
      if (multiSelectCommand) {
        multiSelectCommand.execute(selectedElements);
      }
    } else if (isJustClick) {
      // If it was just a click on empty space, deselect all
      const deselectAllCommand = this.guiCommandRegistry.get("deselectAll");
      if (deselectAllCommand) {
        deselectAllCommand.execute();
      }
    }

    console.log("[GUIAdapter] Found", selectedElements.length, "elements in selection box");

    // Clean up selection state
    this.isSelecting = false;
    this.selectionBox = null;
    
    // Clear selection box from renderer
    this.circuitRenderer.setSelectionBox(null);
    
    // Re-render to clear selection box and show selected elements
    this.circuitRenderer.render();
  }

  /**
   * Check if an element is within the selection box
   * @param {Object} element Circuit element
   * @param {number} left Left boundary
   * @param {number} top Top boundary  
   * @param {number} right Right boundary
   * @param {number} bottom Bottom boundary
   * @returns {boolean}
   * @private
   */
  isElementInBox(element, left, top, right, bottom) {
    if (!element.nodes || element.nodes.length === 0) return false;

    // Check if any node of the element is within the box
    return element.nodes.some(node => {
      return node.x >= left && node.x <= right && 
             node.y >= top && node.y <= bottom;
    });
  }

  /**
   * Set crosshair cursor for wire drawing mode
   * @private
   */
  setCrosshairCursor() {
    if (this.canvas && this.canvas.style) {
      this.canvas.style.cursor = 'crosshair';
    }
  }

  /**
   * Reset cursor to default and deactivate wire drawing mode
   * @private
   */
  resetCursor() {
    if (this.canvas && this.canvas.style) {
      this.canvas.style.cursor = 'default';
    }
    this.wireDrawingMode = false;
  }

  /**
   * Rotate the element currently being placed
   * @param {number} angle - Rotation angle in degrees (90, -90, 180, etc.)
   * @private
   */
  rotatePlacingElement(angle) {
    if (!this.placingElement) return;

    console.log(`[GUIAdapter] Rotating placing element by ${angle}°`);
    
    // Initialize properties if they don't exist
    if (!this.placingElement.properties) {
      console.warn("[GUIAdapter] Element missing properties, cannot set orientation");
    } else {
      // Initialize properties.values if it doesn't exist
      if (!this.placingElement.properties.values) {
        this.placingElement.properties.values = {};
      }
      
      // Update element's orientation property
      const currentOrientation = this.placingElement.properties.values.orientation || 0;
      this.placingElement.properties.values.orientation = (currentOrientation + angle) % 360;
      
      // Normalize negative angles
      if (this.placingElement.properties.values.orientation < 0) {
        this.placingElement.properties.values.orientation += 360;
      }
    }
    
    // Get current element center
    const centerX = (this.placingElement.nodes[0].x + this.placingElement.nodes[1].x) / 2;
    const centerY = (this.placingElement.nodes[0].y + this.placingElement.nodes[1].y) / 2;
    
    // For most components, rotation changes the node positions
    const angleRad = (angle * Math.PI) / 180;
    const currentAngleRad = Math.atan2(
      this.placingElement.nodes[1].y - this.placingElement.nodes[0].y,
      this.placingElement.nodes[1].x - this.placingElement.nodes[0].x
    );
    const newAngleRad = currentAngleRad + angleRad;
    
    // Use grid configuration to calculate proper node positions that align to grid
    const nodePositions = GRID_CONFIG.calculateNodePositions(centerX, centerY, newAngleRad);
    this.placingElement.nodes[0].x = nodePositions.start.x;
    this.placingElement.nodes[0].y = nodePositions.start.y;
    this.placingElement.nodes[1].x = nodePositions.end.x;
    this.placingElement.nodes[1].y = nodePositions.end.y;
    
    // Emit update event for rotation
    this.circuitService.emit('update', {
      type: 'rotatePlacingElement',
      element: this.placingElement,
    });
    
    // Force immediate re-render to show rotation
    this.circuitRenderer.render();
  }
}
