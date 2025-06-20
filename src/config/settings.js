// settings.js
import { ElementRegistry } from '../domain/factories/ElementRegistry.js';
import { RendererFactory } from '../gui/renderers/RendererFactory.js';
import { Resistor } from '../domain/entities/Resistor.js';
import { Wire } from '../domain/entities/Wire.js';
import { ResistorRenderer } from '../gui/renderers/ResistorRenderer.js';
import { WireRenderer } from '../gui/renderers/WireRenderer.js';
import { generateId } from '../utils/idGenerator.js';
import { Properties } from '../domain/valueObjects/Properties.js';

import { GUICommandRegistry } from "../gui/commands/GUICommandRegistry.js";

// Import commands
import { AddElementCommand } from "../gui/commands/AddElementCommand.js";
import { DrawWireCommand } from "../gui/commands/DrawWireCommand.js";
import { DragElementCommand } from "../gui/commands/GUIDragElementCommand.js";
import { WireSplitService } from "../application/WireSplitService.js";

// Register elements once
if (ElementRegistry.getTypes().length === 0) {
    ElementRegistry.register('Resistor', (id = generateId('R'), nodes, label = null, properties = {}) => {
        const defaultProps = { resistance: 1.0 };
        return new Resistor(id, nodes, label, new Properties( defaultProps ));
    });

    ElementRegistry.register('Wire', (id = generateId('W'), nodes) =>
        new Wire(id, nodes)
    );
}

// Set up renderer factory
const rendererFactory = new RendererFactory();
rendererFactory.register('resistor', ResistorRenderer);
rendererFactory.register('wire', WireRenderer);

// Export everything, and a command setup function
export { ElementRegistry, rendererFactory, GUICommandRegistry };

// Export a function to register commands later
// This is needed to avoid circular dependencies
// and to ensure commands are set up after the GUIAdapter is initialized.
export async function setupCommands(circuitService, circuitRenderer) {
    // const { AddElementCommand } = await import("../gui/commands/AddElementCommand.js");
    // const { DrawWireCommand } = await import("../gui/commands/DrawWireCommand.js");
    // const { DragElementCommand } = await import("../gui/commands/GUIDragElementCommand.js");
    // const { WireSplitService } = await import("../application/WireSplitService.js");

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
}
