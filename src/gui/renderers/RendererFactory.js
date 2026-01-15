/**
 * @module GUI/Renderers
 * @description
 * 🎨 **GUI Layer - Element Renderers**
 *
 * Visual rendering system for circuit elements using HTML5 Canvas.
 * Provides extensible rendering through the Factory pattern.
 */

/**
 * @class RendererFactory
 * @description
 * **🔧 Renderer Extension Point**
 *
 * Factory for creating and managing element renderers. This is the primary
 * extension point for developers who want to add visual rendering for new
 * circuit element types.
 *
 * **Usage Pattern:**
 * 1. Create a new renderer class extending ElementRenderer
 * 2. Register it with RendererFactory
 * 3. The factory automatically creates instances as needed
 *
 * @example
 * // Adding a custom renderer
 * class MyCustomRenderer extends ElementRenderer {
 *   render(element, isSelected, isHovered) {
 *     // Custom rendering logic
 *   }
 * }
 *
 * rendererFactory.register('mycustom', MyCustomRenderer);
 *
 * @example
 * // Getting a renderer instance
 * const renderer = rendererFactory.create('resistor', context);
 * renderer.render(element, false, false);
 */
export class RendererFactory {
    constructor() {
        this.registry = new Map();
    }

    /**
     * Registers a renderer for a specific element type.
     * @param {string} type - The type of element (e.g., "Resistor", "Wire").
     * @param {Function} rendererConstructor - The constructor function for the renderer.
     */
    register(type, rendererConstructor) {
        this.registry.set(type, rendererConstructor);
    }

    /**
     * Creates a renderer for the specified element type.
     * @param {string} type - The type of element.
     * @param {CanvasRenderingContext2D} context - The canvas rendering context.
     * @returns {Object} - The renderer instance.
     * @throws {Error} - If no renderer is registered for the given type.
     */
    create(type, context) {
        const Renderer = this.registry.get(type);
        if (!Renderer) {
            throw new Error(`No renderer registered for element type: "${type}"`);
        }
        return new Renderer(context);
    }

    /**
     * Returns all registered renderer types for debugging.
     * @returns {string[]} - Array of registered type names.
     */
    getRegisteredTypes() {
        return [...this.registry.keys()];
    }
}
