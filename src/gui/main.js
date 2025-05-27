import { Circuit } from "../domain/aggregates/Circuit.js";
import { CircuitService } from "../application/CircuitService.js";
import { GUIAdapter } from "./adapters/GUIAdapter.js";

import {
  ElementRegistry,
  rendererFactory,
  GUICommandRegistry,
  setupCommands
} from "../config/settings.js";

// Init services
const circuit = new Circuit();
const circuitService = new CircuitService(circuit, ElementRegistry);

// Canvas
const canvas = document.getElementById("circuitCanvas");
const guiAdapter = new GUIAdapter(canvas, circuitService, ElementRegistry, rendererFactory, GUICommandRegistry);

// Wait for commands to be set up
setupCommands(circuitService, guiAdapter.circuitRenderer).then(() => {
  guiAdapter.initialize();
});
