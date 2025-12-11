/**
 * @fileoverview QuCat Circuit Generator - Application Entry Point
 * @description
 * This is the main application bootstrap file demonstrating how to initialize and
 * configure the QuCat Circuit Generator using the hexagonal architecture API.
 *
 * **Architecture Example:**
 * This file serves as a practical example of how the different architectural layers
 * work together in the hexagonal architecture pattern:
 *
 * 1. **Domain Layer**: Circuit aggregate and domain entities
 * 2. **Application Layer**: CircuitService for use case orchestration
 * 3. **GUI Layer**: GUIAdapter as the primary adapter for user interactions
 * 4. **Infrastructure Layer**: Renderers and configuration adapters
 *
 * **Extension Points Demonstrated:**
 * - Element registration through ElementRegistry
 * - Renderer registration through RendererFactory
 * - Command registration through GUICommandRegistry
 * - Event-driven architecture through CircuitService
 *
 * **Performance Optimizations:**
 * - HiDPI canvas setup for crisp rendering on high-resolution displays
 * - Resize observer pattern for efficient canvas management
 * - Performance monitoring for development debugging
 *
 * @example
 * // To extend with a new element type:
 * ElementRegistry.register('CustomElement', (id, nodes, label, properties) => {
 *   return new CustomElement(id, nodes, label, properties);
 * });
 *
 * // To add a new renderer:
 * rendererFactory.register('custom', CustomRenderer);
 *
 * // To add a new command:
 * GUICommandRegistry.register('customAction', (services) => {
 *   return new CustomCommand(services.circuitService, services.circuitRenderer);
 * });
 *
 * @module main
 * @requires Circuit - Domain aggregate
 * @requires CircuitService - Application service
 * @requires GUIAdapter - Primary GUI adapter
 * @requires ElementRegistry - Element factory registry
 * @requires RendererFactory - Renderer factory
 * @requires GUICommandRegistry - Command registry
 */

import { Circuit } from "../domain/aggregates/Circuit.js";
import { CircuitService } from "../application/CircuitService.js";
import { GUIAdapter } from "./adapters/GUIAdapter.js";
import {
  ElementRegistry,
  rendererFactory,
  GUICommandRegistry,
  setupCommands
} from "../config/settings.js";
import { initMenu } from "./menu/initMenu.js";
import { Logger } from "../utils/Logger.js";
import { globalPerformanceMonitor } from "../utils/PerformanceUtils.js";

/**
 * HiDPI Canvas Utilities
 *
 * These utilities demonstrate how to properly handle high-resolution displays
 * in a canvas-based application, ensuring crisp rendering across all devices.
 */

/**
 * Fits canvas to HiDPI display once during initialization.
 *
 * @param {HTMLCanvasElement} canvas - The canvas element to configure
 */
function fitCanvasHiDPIOnce(canvas){
  const dpr  = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();   // CSS size
  const cssW = Math.max(1, Math.round(rect.width));
  const cssH = Math.max(1, Math.round(rect.height));
  canvas.width  = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
}

/**
 * Sets up responsive HiDPI canvas with automatic resizing.
 *
 * @param {HTMLCanvasElement} canvas - The canvas element to configure
 * @param {Function} onResize - Callback function to execute after resize
 * @returns {Function} Cleanup function to remove observers
 */
function setupHiDPICanvas(canvas, onResize) {
  const ctx = canvas.getContext('2d');
  const resize = () => {
    const dpr  = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const cssW = Math.max(1, Math.round(rect.width));
    const cssH = Math.max(1, Math.round(rect.height));
    const pxW = Math.round(cssW * dpr);
    const pxH = Math.round(cssH * dpr);
    if (canvas.width !== pxW || canvas.height !== pxH) {
      canvas.width = pxW; canvas.height = pxH;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      onResize?.();
    }
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  window.addEventListener('resize', resize, { passive: true });
  resize(); // initial (will be no-op because we already pre-fit once)
  return () => { ro.disconnect(); window.removeEventListener('resize', resize); };
}

/**
 * Application Bootstrap - Hexagonal Architecture Initialization
 *
 * This section demonstrates the proper initialization sequence for a hexagonal
 * architecture application with dependency injection and event-driven design.
 */

// DOM element references
const stage  = document.querySelector('.circuit-stage');
const canvas = document.getElementById("circuitCanvas");
const controls = document.querySelector(".controls"); // optional

// Pre-configure canvas for HiDPI before any rendering
fitCanvasHiDPIOnce(canvas);

/**
 * Domain and Application Layer Initialization
 *
 * Following hexagonal architecture, we initialize from the inside-out:
 * 1. Domain aggregate (Circuit)
 * 2. Application service (CircuitService)
 * 3. Primary adapter (GUIAdapter)
 */
const circuit = new Circuit();                    // Domain: Aggregate root
const circuitService = new CircuitService(       // Application: Use case orchestration
  circuit,
  ElementRegistry
);
const guiAdapter = new GUIAdapter(                // GUI: Primary adapter
  controls,
  canvas,
  circuitService,
  ElementRegistry,
  rendererFactory,
  GUICommandRegistry
);

/* ---------- Menu (emits ui:action only) ---------- */
await initMenu();

/* ---------- Commands, first render, reveal, THEN start resize observer ---------- */
globalPerformanceMonitor.startTiming('app-initialization');

setupCommands(circuitService, guiAdapter.circuitRenderer);
guiAdapter.initialize();                  // this will call first render
setupHiDPICanvas(canvas, () => {
    guiAdapter.circuitRenderer.reCenter(); // Re-center after canvas resize
    guiAdapter.circuitRenderer.centerScrollPosition(); // Center scroll position after resize
    guiAdapter.circuitRenderer.render();
});
// Center the coordinates and scroll position after the HiDPI canvas is set up
guiAdapter.circuitRenderer.reCenter();
guiAdapter.circuitRenderer.centerScrollPosition();
stage.classList.add('ready');             // fade in only after crisp render

const initTime = globalPerformanceMonitor.endTiming('app-initialization');

// Add performance monitoring for development
if (Logger.isDev) {
  // Monitor for slow operations
  const originalRender = guiAdapter.circuitRenderer.render;
  let renderCount = 0;
  
  guiAdapter.circuitRenderer.render = function() {
    renderCount++;
    const start = performance.now();
    const result = originalRender.apply(this, arguments);
    const duration = performance.now() - start;
    
    if (duration > 16) { // Slower than 60fps
      Logger.warn(`Slow render #${renderCount}: ${duration.toFixed(2)}ms`);
    }
    
    return result;
  };
  
}

/* ---------- Documentation Integration: PostMessage Support ---------- */
/**
 * Listen for postMessage commands from parent documentation pages.
 * This enables the documentation to load example circuits automatically.
 */
window.addEventListener('message', function(event) {
  // Security: Only accept messages from same origin or trusted documentation
  if (event.origin !== window.location.origin &&
      !event.origin.includes('github.io') &&
      !event.origin.includes('localhost')) {
    return;
  }

  const data = event.data;
  
  if (data.type === 'loadCircuit' && data.netlist) {
    try {
      Logger.info('[Documentation] Loading example circuit from documentation');
      
      // Get the openNetlist command and use its internal methods
      const openCommand = guiCommandRegistry.get('openNetlist');
      if (openCommand) {
        // Store current state for undo
        openCommand.previousState = circuitService.exportState();
        
        // Parse and load the netlist content directly
        openCommand._parseNetlistContent(data.netlist).then(elements => {
          return openCommand._loadElementsIntoCircuit(elements);
        }).then(() => {
          // Auto-zoom to fit the loaded circuit after a short delay
          setTimeout(() => {
            guiAdapter.circuitRenderer.zoomToFit();
            guiAdapter.circuitRenderer.render();
          }, 500);
          
          Logger.info('[Documentation] Example circuit loaded successfully');
        }).catch(error => {
          Logger.error('[Documentation] Failed to load example circuit:', error);
        });
      } else {
        Logger.error('[Documentation] OpenNetlist command not available');
      }
    } catch (error) {
      Logger.error('[Documentation] Failed to load example circuit:', error);
    }
  }
});

// Notify parent that the application is ready to receive commands
window.parent.postMessage({ type: 'appReady' }, '*');
