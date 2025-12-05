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

/* ---------- HiDPI helpers ---------- */
function fitCanvasHiDPIOnce(canvas){
  const dpr  = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();   // CSS size
  const cssW = Math.max(1, Math.round(rect.width));
  const cssH = Math.max(1, Math.round(rect.height));
  canvas.width  = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
}

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

/* ---------- DOM refs ---------- */
const stage  = document.querySelector('.circuit-stage');
const canvas = document.getElementById("circuitCanvas");
const controls = document.querySelector(".controls"); // optional

/* ---------- Pre-fit BEFORE any render ---------- */
fitCanvasHiDPIOnce(canvas);

/* ---------- Services & GUI ---------- */
const circuit = new Circuit();
const circuitService = new CircuitService(circuit, ElementRegistry);
const guiAdapter = new GUIAdapter(
  controls, canvas, circuitService, ElementRegistry, rendererFactory, GUICommandRegistry
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
