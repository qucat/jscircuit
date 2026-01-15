import { setupJsdom } from '../setup/jsdomSetup.js';
import { createMockControls } from '../gui/controlsFixture.js';
import { createMockCanvas } from '../gui/canvasFixture.js';
import { Circuit } from '../../src/domain/aggregates/Circuit.js';
import { CircuitService } from '../../src/application/CircuitService.js';
import { GUIAdapter } from '../../src/gui/adapters/GUIAdapter.js';
import { setupCommands, ElementRegistry, GUICommandRegistry, rendererFactory } from '../../src/config/registry.js';

/**
 * Sets up the entire GUI environment including controls, canvas, DOM buttons,
 * circuitService, GUIAdapter, command registry, and registered commands.
 * 
 * @returns {Promise<{
 *   guiAdapter: GUIAdapter,
 *   controls: HTMLElement,
 *   canvas: HTMLCanvasElement,
 *   circuitService: CircuitService,
 *   getAddElementCommand: (elementType: string) => any
 * }>}
 */
export async function createGUIEnvironmentFixture() {
  setupJsdom();

  // Create test DOM buttons
  const elementTypes = ['resistor', 'wire', 'mockelement'];
  elementTypes.forEach((type) => {
    const button = document.createElement('button');
    // Button ID uses PascalCase for legacy button naming (addResistor, addWire)
    button.id = `add${type.charAt(0).toUpperCase() + type.slice(1)}`;
    document.body.appendChild(button);
  });

  const controls = createMockControls();
  const canvas = createMockCanvas();
  const circuit = new Circuit();
  const circuitService = new CircuitService(circuit, ElementRegistry);
  const guiAdapter = new GUIAdapter(controls, canvas, circuitService, ElementRegistry, rendererFactory, GUICommandRegistry);

  await setupCommands(circuitService, guiAdapter.circuitRenderer);

  return {
    guiAdapter,
    controls,
    canvas,
    circuitService,
    getAddElementCommand: (elementType) =>
      GUICommandRegistry.get(
        'addElement',
        circuitService,
        guiAdapter.circuitRenderer,
        ElementRegistry,
        elementType // Use lowercase type directly
      ),
  };
}
