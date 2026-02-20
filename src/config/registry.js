/**
 * @module Configuration
 * @description
 * ⚙️ **Configuration Layer - Application Setup**
 *
 * Central configuration and dependency injection for the JSCircuit Editor.
 * This module implements the Registry pattern and provides the main setup
 * functions that developers need to extend the application.
 */

/**
 * @fileoverview Central Configuration Module for JSCircuit Editor
 * @description
 * This module serves as the application's main configuration hub, handling the registration
 * and setup of all circuit elements, renderers, and GUI commands. It implements the
 * Registry pattern to provide centralized management of application components.
 *
 * **Key Responsibilities:**
 * - Element registration (resistors, capacitors, wires, etc.) with their factory functions
 * - Renderer registration for visual component rendering
 * - GUI command registration for user interactions
 * - Dependency injection setup for the application architecture
 *
 * **🔧 Primary Extension Points:**
 * - Add new element types via ElementRegistry
 * - Register custom renderers via RendererFactory
 * - Add custom commands via GUICommandRegistry
 * - Configure application-wide settings
 *
 * **Architecture Pattern:**
 * This file implements the **Registry Pattern** and **Factory Pattern** to enable
 * dynamic component creation and loose coupling between modules.
 *
 * @module settings
 * @since 1.0.0
 */

// settings.js
import { ElementRegistry } from '../domain/factories/ElementRegistry.js';
import { RendererFactory } from '../gui/renderers/RendererFactory.js';
import { Resistor } from '../domain/entities/Resistor.js';
import { Wire } from '../domain/entities/Wire.js';
import { Capacitor } from '../domain/entities/Capacitor.js';
import { Inductor } from '../domain/entities/Inductor.js';
import { Junction } from '../domain/entities/Junction.js';
import { Ground } from '../domain/entities/Ground.js';
import { ResistorRenderer } from '../gui/renderers/ResistorRenderer.js';
import { WireRenderer } from '../gui/renderers/WireRenderer.js';
import { CapacitorRenderer } from '../gui/renderers/CapacitorRenderer.js';
import { InductorRenderer } from '../gui/renderers/InductorRenderer.js';
import { JunctionRenderer } from '../gui/renderers/JunctionRenderer.js';
import { GroundRenderer } from '../gui/renderers/GroundRenderer.js';
import { generateId } from '../utils/idGenerator.js';
import { Properties } from '../domain/valueObjects/Properties.js';

import { GUICommandRegistry } from "../gui/commands/GUICommandRegistry.js";

// Import commands - These implement the Command Pattern for undo/redo functionality
import { AddElementCommand } from "../gui/commands/AddElementCommand.js";
import { DrawWireCommand } from "../gui/commands/DrawWireCommand.js";
import { DragElementCommand } from "../gui/commands/GUIDragElementCommand.js";
import { SelectElementCommand } from "../gui/commands/SelectElementCommand.js";
import { MultiSelectElementCommand } from "../gui/commands/MultiSelectElementCommand.js";
import { SelectAllElementsCommand } from "../gui/commands/SelectAllElementsCommand.js";
import { DeleteElementCommand } from "../gui/commands/DeleteElementCommand.js";
import { DeleteAllCommand } from "../gui/commands/DeleteAllCommand.js";
import { UpdateElementPropertiesCommand } from "../gui/commands/UpdateElementPropertiesCommand.js";
import { CopyElementsCommand } from "../gui/commands/CopyElementsCommand.js";
import { PasteElementsCommand } from "../gui/commands/PasteElementsCommand.js";
import { SaveNetlistCommand } from "../gui/commands/SaveNetlistCommand.js";
import { OpenNetlistCommand } from "../gui/commands/OpenNetlistCommand.js";
import { CopyNetlistToClipboardCommand } from "../gui/commands/CopyNetlistToClipboardCommand.js";
import { PasteNetlistFromClipboardCommand } from "../gui/commands/PasteNetlistFromClipboardCommand.js";
import { Notification } from "../gui/components/Notification.js";
import { WireSplitService } from "../application/WireSplitService.js";
import { GRID_SPACING } from "./gridConfig.js";

/**
 * Element Registration - Factory Pattern Implementation
 *
 * This section demonstrates how to register domain entities using the Factory Pattern.
 * Each element type is registered with a factory function that creates instances
 * with proper default values and validation.
 *
 * **Extension Pattern:**
 * To add a new element type:
 * 1. Create the domain entity class extending Element
 * 2. Register it here with ElementRegistry.register()
 * 3. Add the corresponding renderer to the renderer registry
 * 4. Optionally add specific commands for the element type
 *
 * @example
 * // Adding a new element type
 * ElementRegistry.register('CustomElement', (id, nodes, label, properties) => {
 *   const defaultProps = { customProperty: 'default', orientation: 0 };
 *   const finalProps = properties instanceof Properties
 *     ? properties : new Properties(defaultProps);
 *   return new CustomElement(id, nodes, label, finalProps);
 * });
 */
if (ElementRegistry.getTypes().length === 0) {
    // Resistor factory - demonstrates default property handling
    ElementRegistry.register('resistor', (id = generateId('R'), nodes, label = null, properties = new Properties({})) => {
        const defaultProps = { resistance: 1.0, orientation: 0 };
        const finalProps = properties instanceof Properties ? properties : new Properties(defaultProps);
        // Ensure orientation is set
        if (finalProps.values.orientation === undefined) {
            finalProps.values.orientation = 0;
        }
        return new Resistor(id, nodes, label, finalProps);
    });

    ElementRegistry.register('wire', (id = generateId('W'), nodes, label = null, properties = new Properties({})) => {
        const finalProps = properties instanceof Properties ? properties : new Properties({});
        return new Wire(id, nodes, label, finalProps);
    });

    ElementRegistry.register('capacitor', (id = generateId('C'), nodes, label = null, properties = new Properties({})) => {
        const defaultProps = { capacitance: 1e-12, orientation: 0 }; // 1 pF default
        const finalProps = properties instanceof Properties ? properties : new Properties(defaultProps);
        // Ensure orientation is set
        if (finalProps.values.orientation === undefined) {
            finalProps.values.orientation = 0;
        }
        return new Capacitor(id, nodes, label, finalProps);
    });

    ElementRegistry.register('inductor', (id = generateId('L'), nodes, label = null, properties = new Properties({})) => {
        const defaultProps = { inductance: 1e-9, orientation: 0 }; // 1 nH default
        const finalProps = properties instanceof Properties ? properties : new Properties(defaultProps);
        // Ensure orientation is set
        if (finalProps.values.orientation === undefined) {
            finalProps.values.orientation = 0;
        }
        return new Inductor(id, nodes, label, finalProps);
    });

    ElementRegistry.register('junction', (id = generateId('J'), nodes, label = null, properties = new Properties({})) => {
        const finalProps = properties instanceof Properties ? properties : new Properties({ orientation: 0 });
        // Ensure orientation is set
        if (finalProps.values.orientation === undefined) {
            finalProps.values.orientation = 0;
        }
        return new Junction(id, nodes, label, finalProps);
    });

    ElementRegistry.register('ground', (id = generateId('G'), nodes, label = null, properties = new Properties({})) => {
        const finalProps = properties instanceof Properties ? properties : new Properties({ orientation: 0 });
        // Ensure orientation is set
        if (finalProps.values.orientation === undefined) {
            finalProps.values.orientation = 0;
        }
        // Ground elements don't need labels, always pass null
        return new Ground(id, nodes, null, finalProps);
    });
}

/**
 * Renderer Registration - Adapter Pattern Implementation
 *
 * This section registers visual renderers for each element type using the
 * Factory and Adapter patterns. Each renderer adapts domain entities to
 * visual representation on the HTML5 canvas.
 *
 * **Extension Pattern:**
 * To add a new renderer:
 * 1. Create a renderer class extending ElementRenderer
 * 2. Register it here with the same key as the element type
 * 3. The renderer will automatically be used for that element type
 *
 * @example
 * // Adding a renderer for a custom element
 * rendererFactory.register('customElement', CustomElementRenderer);
 */
const rendererFactory = new RendererFactory();
rendererFactory.register('resistor', ResistorRenderer);
rendererFactory.register('wire', WireRenderer);
rendererFactory.register('capacitor', CapacitorRenderer);
rendererFactory.register('inductor', InductorRenderer);
rendererFactory.register('junction', JunctionRenderer);
rendererFactory.register('ground', GroundRenderer);

/**
 * Registry Exports - Dependency Injection Pattern
 *
 * These registries are exported for dependency injection throughout the application.
 * This implements the Registry Pattern and enables loose coupling between modules.
 */
export { ElementRegistry, rendererFactory, GUICommandRegistry };

/**
 * Sets up and registers all GUI commands for the application.
 *
 * This function is responsible for registering all available commands in the GUICommandRegistry.
 * It's called after the GUIAdapter is initialized to avoid circular dependencies and ensure
 * that all required services (CircuitService, CircuitRenderer) are available.
 *
 * **Dependency Injection Pattern:**
 * Commands are registered with factory functions that receive the necessary dependencies
 * at runtime, enabling proper dependency injection and loose coupling.
 *
 * **Command Categories:**
 * - Element manipulation: add, delete, rotate, drag
 * - Selection: select single, multi-select, select all
 * - Wire operations: draw wires with splitting logic
 * - File operations: save/load netlist files
 * - Clipboard: copy/paste operations
 *
 * @param {CircuitService} circuitService - The circuit service for domain operations
 * @param {CircuitRenderer} circuitRenderer - The renderer for UI operations
 *
 * @example
 * const circuitService = new CircuitService(circuit);
 * const circuitRenderer = new CircuitRenderer(canvas, circuitService);
 * setupCommands(circuitService, circuitRenderer);
 */
export function setupCommands(circuitService, circuitRenderer) {
    const wireSplitService = new WireSplitService(circuitService, ElementRegistry);

    if (!GUICommandRegistry.getTypes().includes("addElement")) {
        GUICommandRegistry.register("addElement", (circuitService, circuitRenderer, elementRegistry, elementType) =>
            new AddElementCommand(circuitService, circuitRenderer, elementRegistry, elementType)
        );
    }

    if (!GUICommandRegistry.getTypes().includes("drawWire")) {
        GUICommandRegistry.register("drawWire", () =>
            new DrawWireCommand(circuitService, ElementRegistry, wireSplitService)
        );
    }

    if (!GUICommandRegistry.getTypes().includes("dragElement")) {
        GUICommandRegistry.register("dragElement", () =>
            new DragElementCommand(circuitService, circuitRenderer, wireSplitService)
        );
    }

    if (!GUICommandRegistry.getTypes().includes("selectElement")) {
        GUICommandRegistry.register("selectElement", () =>
            new SelectElementCommand(circuitService, circuitRenderer)
        );
    }

    if (!GUICommandRegistry.getTypes().includes("multiSelectElement")) {
        GUICommandRegistry.register("multiSelectElement", () =>
            new MultiSelectElementCommand(circuitService, circuitRenderer)
        );
    }

    // Add missing commands that are referenced in the menu config
    if (!GUICommandRegistry.getTypes().includes("selectAll")) {
        GUICommandRegistry.register("selectAll", () => new SelectAllElementsCommand(circuitService, circuitRenderer));
    }

    if (!GUICommandRegistry.getTypes().includes("deleteSelection")) {
        GUICommandRegistry.register("deleteSelection", () => new DeleteElementCommand(circuitService, circuitRenderer));
    }

    if (!GUICommandRegistry.getTypes().includes("deleteAll")) {
        GUICommandRegistry.register("deleteAll", () => new DeleteAllCommand(circuitService, circuitRenderer));
    }

    if (!GUICommandRegistry.getTypes().includes("updateElementProperties")) {
        GUICommandRegistry.register("updateElementProperties", () => new UpdateElementPropertiesCommand(circuitService, circuitRenderer));
    }

    if (!GUICommandRegistry.getTypes().includes("copyElements")) {
        GUICommandRegistry.register("copyElements", () => new CopyElementsCommand(circuitService, circuitRenderer));
    }

    if (!GUICommandRegistry.getTypes().includes("pasteElements")) {
        GUICommandRegistry.register("pasteElements", () => new PasteElementsCommand(circuitService, circuitRenderer));
    }

    if (!GUICommandRegistry.getTypes().includes("deselectAll")) {
        GUICommandRegistry.register("deselectAll", () => ({
            execute: () => {
                circuitRenderer.clearSelection();
                circuitService.emit("update");
            },
        }));
    }

        // Register rotation commands
    if (!GUICommandRegistry.getTypes().includes("rotateRight")) {
        GUICommandRegistry.register("rotateRight", (circuitService, circuitRenderer, elementRegistry) => ({
            execute: () => {
                const before = circuitService.exportState();
                const selectedElements = circuitRenderer.getSelectedElements();
                
                if (!selectedElements || selectedElements.length === 0) {
                    return { undo: () => {} }; // No-op if nothing selected
                }
                
                if (selectedElements.length > 1) {
                    return { undo: () => {} }; // No-op if multiple elements selected
                }
                
                // Get element IDs for single element rotation
                const elementIds = selectedElements.map(element => element.id);
                
                // Rotate 90 degrees clockwise (to the right)
                circuitService.rotateElements(elementIds, 90);
                
                
                return {
                    undo: () => circuitService.importState(before)
                };
            },
        }));
    }

    if (!GUICommandRegistry.getTypes().includes("rotateUp")) {
        GUICommandRegistry.register("rotateUp", (circuitService, circuitRenderer, elementRegistry) => ({
            execute: () => {
                const before = circuitService.exportState();
                const selectedElements = circuitRenderer.getSelectedElements();
                
                if (!selectedElements || selectedElements.length === 0) {
                    return { undo: () => {} }; // No-op if nothing selected
                }
                
                if (selectedElements.length > 1) {
                    return { undo: () => {} }; // No-op if multiple elements selected
                }
                
                // Get element IDs for single element rotation
                const elementIds = selectedElements.map(element => element.id);
                
                // Rotate 180 degrees (flip upside down)
                circuitService.rotateElements(elementIds, 180);
                
                
                return {
                    undo: () => circuitService.importState(before)
                };
            },
        }));
    }

    if (!GUICommandRegistry.getTypes().includes("rotateLeft")) {
        GUICommandRegistry.register("rotateLeft", (circuitService, circuitRenderer, elementRegistry) => ({
            execute: () => {
                const before = circuitService.exportState();
                const selectedElements = circuitRenderer.getSelectedElements();
                
                if (!selectedElements || selectedElements.length === 0) {
                    return { undo: () => {} }; // No-op if nothing selected
                }
                
                if (selectedElements.length > 1) {
                    return { undo: () => {} }; // No-op if multiple elements selected
                }
                
                // Get element IDs for single element rotation
                const elementIds = selectedElements.map(element => element.id);
                
                // Rotate 90 degrees counter-clockwise (to the left)
                circuitService.rotateElements(elementIds, -90);
                
                
                return {
                    undo: () => circuitService.importState(before)
                };
            },
        }));
    }

    if (!GUICommandRegistry.getTypes().includes("rotateDown")) {
        GUICommandRegistry.register("rotateDown", (circuitService, circuitRenderer, elementRegistry) => ({
            execute: () => {
                const before = circuitService.exportState();
                const selectedElements = circuitRenderer.getSelectedElements();
                
                if (!selectedElements || selectedElements.length === 0) {
                    return { undo: () => {} }; // No-op if nothing selected
                }
                
                if (selectedElements.length > 1) {
                    return { undo: () => {} }; // No-op if multiple elements selected
                }
                
                // Get element IDs for single element rotation
                const elementIds = selectedElements.map(element => element.id);
                
                // Rotate 180 degrees (same as "up" - flip)
                circuitService.rotateElements(elementIds, 180);
                
                
                return {
                    undo: () => circuitService.importState(before)
                };
            },
        }));
    }

    // ── Nudge commands (arrow-key element movement) ──────────────
    const nudgeFactory = (dx, dy) => (circuitService, circuitRenderer) => ({
        execute: () => {
            const selected = circuitRenderer.getSelectedElements();
            if (!selected || selected.length === 0) return { undo: () => {} };

            const before = circuitService.exportState();
            const ids = selected.map(el => el.id);
            circuitService.nudgeElements(ids, dx, dy);
            return { undo: () => circuitService.importState(before) };
        },
    });

    for (const [name, dx, dy] of [
        ["nudgeRight", GRID_SPACING, 0],
        ["nudgeLeft",  -GRID_SPACING, 0],
        ["nudgeUp",    0, -GRID_SPACING],
        ["nudgeDown",  0,  GRID_SPACING],
    ]) {
        if (!GUICommandRegistry.getTypes().includes(name)) {
            GUICommandRegistry.register(name, nudgeFactory(dx, dy));
        }
    }

    // Register general rotate element command (defaults to 90° clockwise)
    if (!GUICommandRegistry.getTypes().includes("rotateElement")) {
        GUICommandRegistry.register("rotateElement", (circuitService, circuitRenderer, elementRegistry) => ({
            execute: () => {
                const before = circuitService.exportState();
                const selectedElements = circuitRenderer.getSelectedElements();

                if (!selectedElements || selectedElements.length === 0) {
                    return { undo: () => {} }; // No-op if nothing selected
                }

                if (selectedElements.length > 1) {
                    return { undo: () => {} }; // No-op if multiple elements selected
                }

                // Get element IDs for single element rotation
                const elementIds = selectedElements.map(element => element.id);

                // Rotate 90 degrees clockwise (default rotation)
                circuitService.rotateElements(elementIds, 90);


                return {
                    undo: () => circuitService.importState(before)
                };
            },
        }));
    }

    // Register save and open netlist commands
    if (!GUICommandRegistry.getTypes().includes("saveNetlist")) {
        GUICommandRegistry.register("saveNetlist", () =>
            new SaveNetlistCommand(circuitService, circuitRenderer)
        );
    }

    if (!GUICommandRegistry.getTypes().includes("openNetlist")) {
        GUICommandRegistry.register("openNetlist", () =>
            new OpenNetlistCommand(circuitService, circuitRenderer)
        );
    }

    // Wire a notify callback that delegates to the shared Notification component.
    const notify = (message, type) => {
        if (type === 'error') {
            Notification.error(circuitRenderer, message);
        } else {
            Notification.success(circuitRenderer, message);
        }
    };

    if (!GUICommandRegistry.getTypes().includes("copyNetlistToClipboard")) {
        GUICommandRegistry.register("copyNetlistToClipboard", () =>
            new CopyNetlistToClipboardCommand(circuitService, circuitRenderer, notify)
        );
    }

    if (!GUICommandRegistry.getTypes().includes("pasteNetlistFromClipboard")) {
        GUICommandRegistry.register("pasteNetlistFromClipboard", () =>
            new PasteNetlistFromClipboardCommand(circuitService, circuitRenderer, notify)
        );
    }
}
