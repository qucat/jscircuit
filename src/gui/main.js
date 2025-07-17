import { CircuitUIFactory } from './components/CircuitUIFactory.js';
import { CircuitAppManager } from './components/CircuitAppManager.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    // Apply standard styles
    CircuitUIFactory.applyStandardStyles();

    // Set document title
    document.title = "Circuit Designer";

    // Create the complete circuit interface in the body
    const ui = CircuitUIFactory.createCircuitInterface(document.body, {
        title: "Circuit Designer"
    });

    // Initialize the circuit application
    const appManager = new CircuitAppManager();
    appManager.initialize(ui.controls, ui.canvas);
});
