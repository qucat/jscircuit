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
import { WireSplitService } from "../application/WireSplitService.js";

// Register elements once
if (ElementRegistry.getTypes().length === 0) {
    ElementRegistry.register('Resistor', (id = generateId('R'), nodes, label = null, properties = new Properties({})) => {
        const defaultProps = { resistance: 1.0 };
        const finalProps = properties instanceof Properties ? properties : new Properties(defaultProps);
        return new Resistor(id, nodes, label, finalProps);
    });

    ElementRegistry.register('Wire', (id = generateId('W'), nodes, label = null, properties = new Properties({})) => {
        const finalProps = properties instanceof Properties ? properties : new Properties({});
        return new Wire(id, nodes, label, finalProps);
    });

    ElementRegistry.register('Capacitor', (id = generateId('C'), nodes, label = null, properties = new Properties({})) => {
        const defaultProps = { capacitance: 1e-12 }; // 1 pF default
        const finalProps = properties instanceof Properties ? properties : new Properties(defaultProps);
        return new Capacitor(id, nodes, label, finalProps);
    });

    ElementRegistry.register('Inductor', (id = generateId('L'), nodes, label = null, properties = new Properties({})) => {
        const defaultProps = { inductance: 1e-9 }; // 1 nH default
        const finalProps = properties instanceof Properties ? properties : new Properties(defaultProps);
        return new Inductor(id, nodes, label, finalProps);
    });

    ElementRegistry.register('Junction', (id = generateId('J'), nodes, label = null, properties = new Properties({})) => {
        const finalProps = properties instanceof Properties ? properties : new Properties({});
        return new Junction(id, nodes, label, finalProps);
    });

    ElementRegistry.register('Ground', (id = generateId('G'), nodes, label = null, properties = new Properties({})) => {
        const finalProps = properties instanceof Properties ? properties : new Properties({});
        return new Ground(id, nodes, label, finalProps);
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
            new DragElementCommand(circuitService, wireSplitService)
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
        GUICommandRegistry.register("selectAll", () => ({
            execute: () => console.log("Select All not implemented yet"),
            undo: () => console.log("Select All undo not implemented yet")
        }));
    }

    if (!GUICommandRegistry.getTypes().includes("deleteSelection")) {
        GUICommandRegistry.register("deleteSelection", () => ({
            execute: () => console.log("Delete Selection not implemented yet"),
            undo: () => console.log("Delete Selection undo not implemented yet")
        }));
    }

    if (!GUICommandRegistry.getTypes().includes("deleteAll")) {
        GUICommandRegistry.register("deleteAll", () => ({
            execute: () => {
                console.log("Delete All executing");
                circuitService.circuit.elements = [];
                circuitService.emit("update");
            },
            undo: () => console.log("Delete All undo not implemented yet")
        }));
    }
}
