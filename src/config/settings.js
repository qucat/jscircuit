import { ElementRegistry } from '../domain/factories/ElementRegistry.js';
import { RendererFactory } from '../gui/renderers/RendererFactory.js';
import { Resistor } from '../domain/entities/Resistor.js';
import { Wire } from '../domain/entities/Wire.js';
import { ResistorRenderer } from '../gui/renderers/ResistorRenderer.js';
import { WireRenderer } from '../gui/renderers/WireRenderer.js';
import { generateId } from '../utils/idGenerator.js';
import { Properties } from '../domain/valueObjects/Properties.js';
import { GUICommandRegistry } from "../gui/commands/GUICommandRegistry.js";
import { AddElementCommand } from "../gui/commands/AddElementCommand.js";
import { DragElementCommand } from "../gui/commands/GUIDragElementCommand.js";
import { DrawWireCommand } from "../gui/commands/DrawWireCommand.js"; // wherever it's defined

// Ensure elements are registered once
if (ElementRegistry.getTypes().length === 0) {

    ElementRegistry.register('Resistor', (id = generateId('R'), nodes, label = null, properties = {}) =>
        new Resistor(id, nodes, label, new Properties(properties))
    );
    ElementRegistry.register('Wire', (id = generateId('W'), nodes, label = null, properties = {}) =>
        new Wire(id, nodes, label, new Properties(properties))
    );
}

console.log(" ElementRegistry after registration:", ElementRegistry.getTypes());

//  Register commands globally before GUI initialization
GUICommandRegistry.register("addElement", (circuitService, circuitRenderer, elementRegistry, elementType) =>
    new AddElementCommand(circuitService, circuitRenderer, elementRegistry, elementType)
);

GUICommandRegistry.register("dragElement", (circuitService) =>
    new DragElementCommand(circuitService)
);

GUICommandRegistry.register("drawWire", (circuitService, elementRegistry) =>
    new DrawWireCommand(circuitService, elementRegistry)
);

console.log("GUICommandRegistry after registration:", GUICommandRegistry.getTypes());

// Configure RendererFactory
const rendererFactory = new RendererFactory();
rendererFactory.register('resistor', ResistorRenderer);
rendererFactory.register('wire', WireRenderer);

export { ElementRegistry, rendererFactory, GUICommandRegistry };
export default ElementRegistry; // Add default export
