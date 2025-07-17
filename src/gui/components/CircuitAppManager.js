/**
 * CircuitAppManager - Manages the complete circuit application setup
 * Encapsulates common initialization logic
 */

import { Circuit } from "../../domain/aggregates/Circuit.js";
import { CircuitService } from "../../application/CircuitService.js";
import { GUIAdapter } from "../adapters/GUIAdapter.js";
import {
  ElementRegistry,
  rendererFactory,
  GUICommandRegistry,
  setupCommands
} from "../../config/settings.js";

export class CircuitAppManager {
    constructor(options = {}) {
        this.options = {
            model: null, // For widget usage
            ...options
        };
        
        this.circuit = null;
        this.circuitService = null;
        this.guiAdapter = null;
        this.elements = {
            controls: null,
            canvas: null,
            buttons: {}
        };
    }

    /**
     * Initialize the circuit application
     * @param {HTMLElement} controls - Controls container
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @returns {Promise<void>}
     */
    async initialize(controls, canvas) {
        // Store references
        this.elements.controls = controls;
        this.elements.canvas = canvas;
        
        // Get button references
        this.elements.buttons = {
            addResistor: controls.querySelector("#addResistor"),
            addWire: controls.querySelector("#addWire"),
            undo: controls.querySelector("#undoButton"),
            redo: controls.querySelector("#redoButton"),
            export: controls.querySelector("#export")
        };

        // Set up the circuit and services
        this.circuit = new Circuit();
        this.circuitService = new CircuitService(this.circuit, ElementRegistry);

        // Create GUI adapter
        this.guiAdapter = new GUIAdapter(
            controls, 
            canvas, 
            this.circuitService, 
            ElementRegistry, 
            rendererFactory, 
            GUICommandRegistry
        );

        // Wait for commands to be set up
        await setupCommands(this.circuitService, this.guiAdapter.circuitRenderer);
        
        // Initialize the GUI adapter
        this.guiAdapter.initialize();

        // Set up additional event handlers
        this.setupEventHandlers();
    }

    /**
     * Set up additional event handlers (like export)
     */
    setupEventHandlers() {
        if (this.elements.buttons.export) {
            this.setupExportHandler();
        }
    }

    /**
     * Set up export functionality for widget usage
     */
    setupExportHandler() {
        const { model } = this.options;
        const exportButton = this.elements.buttons.export;
        
        if (!exportButton) return;

        exportButton.addEventListener('click', () => {
            const elements = this.circuitService.getElements();
            
            if (model) {
                // Widget usage - save to model
                model.set("circuitElements", elements);
                model.set("exportTrigger", (model.get("exportTrigger") || 0) + 1);
                model.save_changes();
            } else {
                // Standalone usage - download as JSON
                const dataStr = JSON.stringify(elements, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                
                const link = document.createElement('a');
                link.href = url;
                link.download = 'circuit-export.json';
                link.click();
                
                URL.revokeObjectURL(url);
            }
        });
    }

    /**
     * Get the circuit service instance
     */
    getCircuitService() {
        return this.circuitService;
    }

    /**
     * Get the GUI adapter instance
     */
    getGUIAdapter() {
        return this.guiAdapter;
    }

    /**
     * Get the circuit instance
     */
    getCircuit() {
        return this.circuit;
    }

    /**
     * Clean up resources
     */
    destroy() {
        // Clean up any event listeners or resources if needed
        this.circuit = null;
        this.circuitService = null;
        this.guiAdapter = null;
        this.elements = {
            controls: null,
            canvas: null,
            buttons: {}
        };
    }
}
