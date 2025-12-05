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

// Import commands
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
import { WireSplitService } from "../application/WireSplitService.js";

// Register elements once
if (ElementRegistry.getTypes().length === 0) {
    ElementRegistry.register('Resistor', (id = generateId('R'), nodes, label = null, properties = new Properties({})) => {
        const defaultProps = { resistance: 1.0, orientation: 0 };
        const finalProps = properties instanceof Properties ? properties : new Properties(defaultProps);
        // Ensure orientation is set
        if (finalProps.values.orientation === undefined) {
            finalProps.values.orientation = 0;
        }
        return new Resistor(id, nodes, label, finalProps);
    });

    ElementRegistry.register('Wire', (id = generateId('W'), nodes, label = null, properties = new Properties({})) => {
        const finalProps = properties instanceof Properties ? properties : new Properties({});
        return new Wire(id, nodes, label, finalProps);
    });

    ElementRegistry.register('Capacitor', (id = generateId('C'), nodes, label = null, properties = new Properties({})) => {
        const defaultProps = { capacitance: 1e-12, orientation: 0 }; // 1 pF default
        const finalProps = properties instanceof Properties ? properties : new Properties(defaultProps);
        // Ensure orientation is set
        if (finalProps.values.orientation === undefined) {
            finalProps.values.orientation = 0;
        }
        return new Capacitor(id, nodes, label, finalProps);
    });

    ElementRegistry.register('Inductor', (id = generateId('L'), nodes, label = null, properties = new Properties({})) => {
        const defaultProps = { inductance: 1e-9, orientation: 0 }; // 1 nH default
        const finalProps = properties instanceof Properties ? properties : new Properties(defaultProps);
        // Ensure orientation is set
        if (finalProps.values.orientation === undefined) {
            finalProps.values.orientation = 0;
        }
        return new Inductor(id, nodes, label, finalProps);
    });

    ElementRegistry.register('Junction', (id = generateId('J'), nodes, label = null, properties = new Properties({})) => {
        const finalProps = properties instanceof Properties ? properties : new Properties({ orientation: 0 });
        // Ensure orientation is set
        if (finalProps.values.orientation === undefined) {
            finalProps.values.orientation = 0;
        }
        return new Junction(id, nodes, label, finalProps);
    });

    ElementRegistry.register('Ground', (id = generateId('G'), nodes, label = null, properties = new Properties({})) => {
        const finalProps = properties instanceof Properties ? properties : new Properties({ orientation: 0 });
        // Ensure orientation is set
        if (finalProps.values.orientation === undefined) {
            finalProps.values.orientation = 0;
        }
        // Ground elements don't need labels, always pass null
        return new Ground(id, nodes, null, finalProps);
    });
}

// Set up renderer factory
const rendererFactory = new RendererFactory();
rendererFactory.register('resistor', ResistorRenderer);
rendererFactory.register('wire', WireRenderer);
rendererFactory.register('capacitor', CapacitorRenderer);
rendererFactory.register('inductor', InductorRenderer);
rendererFactory.register('junction', JunctionRenderer);
rendererFactory.register('ground', GroundRenderer);

// Export everything, and a command setup function
export { ElementRegistry, rendererFactory, GUICommandRegistry };

// Export a function to register commands later
// This is needed to avoid circular dependencies
// and to ensure commands are set up after the GUIAdapter is initialized.
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
}
