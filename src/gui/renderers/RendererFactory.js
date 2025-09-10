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
