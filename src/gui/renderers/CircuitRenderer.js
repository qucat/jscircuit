/**
 * @class CircuitRenderer
 * @description
 * Responsible for rendering a circuit on the provided canvas, using specific renderers for each element type.
 * The class relies on the `RendererFactory` to create and manage renderers dynamically, ensuring a clean and
 * scalable approach to adding new element types.
 *
 * **Core Responsibilities**:
 * - Manage rendering logic for the circuit.
 * - Delegate element-specific rendering to appropriate renderers via the `RendererFactory`.
 * - Handle user interactions such as dragging elements.
 *
 * @example
 * const canvas = document.getElementById('circuitCanvas');
 * const circuitRenderer = new CircuitRenderer(canvas, circuitService);
 * circuitRenderer.render();
 */

export class CircuitRenderer {
    /**
     * @constructor
     * @param {HTMLCanvasElement} canvas - The canvas element for rendering.
     * @param {CircuitService} circuitService - The service managing circuit elements.
     * @param {RendererFactory} rendererFactory - The factory responsible for creating element renderers.
     */
    constructor(canvas, circuitService, rendererFactory) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        this.circuitService = circuitService;
        this.rendererFactory = rendererFactory;

        // Preload renderers from the factory
        this.renderers = new Map(
            Array.from(rendererFactory.registry.entries()).map(([type, RendererClass]) => [
                type,
                new RendererClass(this.context),
            ])
        );
    
        // Dragging and Transformations
        this.draggedElement = null;
        this.offset = { x: 0, y: 0 };

       // Zooming and Panning State
        this.scale = 1.0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.isPanning = false;
        this.startPanPosition = { x: 0, y: 0 };

        // Bind event handlers to maintain correct "this" reference
        this.zoom = this.zoom.bind(this);
        this.startPan = this.startPan.bind(this);
        this.pan = this.pan.bind(this);
        this.stopPan = this.stopPan.bind(this);

        // Grid settings: these are configurable.
        // For example, gridSpacing is in logical (domain) coordinates.
        this.gridSpacing = 10;        // Default grid spacing
        this.gridColor = 'gray';        // Color for the grid lines
        this.gridLineWidth = 0.5;         // Line width for grid lines

        // Attach Event Listeners
        this.initEventListeners();
    }
    
    /**
     * Initializes event listeners for zooming and panning.
     */
    initEventListeners() {
        this.canvas.addEventListener("wheel", (event) => this.zoom(event));
        this.canvas.addEventListener("mousedown", (event) => this.startPan(event));
        this.canvas.addEventListener("mousemove", (event) => this.pan(event));
        this.canvas.addEventListener("mouseup", () => this.stopPan());
        this.canvas.addEventListener("mouseleave", () => this.stopPan());
    }

    /**
     * Clears the canvas by resetting its drawing context.
     */
    clearCanvas() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Renders the entire circuit with applied zoom and pan transformations.
     */
    render() {
        this.clearCanvas();

        // Apply transformations (panning & zooming)
        this.context.save();
        this.context.translate(this.offsetX, this.offsetY);
        this.context.scale(this.scale, this.scale);

        // Draw background grid
        this.drawGrid();

        // Iterate over circuit elements and render them
        this.circuitService.getElements().forEach((element) => {
            if (!this.renderers.has(element.type)) {
                const renderer = this.rendererFactory.create(element.type, this.context);
                if (!renderer) {
                    console.warn(`No renderer found for element type: ${element.type}`);
                    return;
                }
                this.renderers.set(element.type, renderer);
            }

            const renderer = this.renderers.get(element.type);
            renderer.renderElement(element);
        });

        this.context.restore();
    }

    /**
    * Draws a grid composed of gray vertical and horizontal lines.
    * The grid spacing is configurable (this.gridSpacing).
    */
    drawGrid() {
        const ctx = this.context;
        const spacing = this.gridSpacing;
        const dotRadius = 0.8; // Radius of each grid dot
        ctx.fillStyle = this.gridColor;

        // The context is already transformed (translated & scaled)
        // Determine the visible logical area:
        const logicalWidth = this.canvas.width / this.scale;
        const logicalHeight = this.canvas.height / this.scale;

        // Determine start positions in logical coordinates:
        // Since we have already translated the context, the origin (0,0) is shifted by offsetX and offsetY.
        const startX = -this.offsetX / this.scale;
        const startY = -this.offsetY / this.scale;

        // Find the first visible vertical grid line:
        const firstX = Math.floor(startX / spacing) * spacing;
        // Find the first visible horizontal grid line:
        const firstY = Math.floor(startY / spacing) * spacing;

        // Iterate over visible grid points and draw dots
        for (let x = firstX; x <= startX + logicalWidth; x += spacing) {
            for (let y = firstY; y <= startY + logicalHeight; y += spacing) {
                ctx.beginPath();
                ctx.arc(x, y, dotRadius, 0, Math.PI * 2); // Draw a circle at each grid point
                ctx.fill(); // Fill the dot with the current fillStyle
            }
        }
    }


    /**
     * Handles zooming in and out on the canvas.
     * @param {WheelEvent} event - The mouse wheel event.
     */
    zoom(event) {
        event.preventDefault();

        const scaleFactor = 1.1; // Zoom factor
        const mouseX = event.offsetX;
        const mouseY = event.offsetY;
        const zoomDirection = event.deltaY > 0 ? 1 / scaleFactor : scaleFactor;

        const newScale = this.scale * zoomDirection;
        if (newScale < 0.5 || newScale > 3.0) return; // Set zoom limits

        // Adjust pan offsets to maintain zoom focus on cursor position
        this.offsetX = mouseX - ((mouseX - this.offsetX) * zoomDirection);
        this.offsetY = mouseY - ((mouseY - this.offsetY) * zoomDirection);
        this.scale = newScale;

        this.render(); // Redraw circuit with new zoom level
    }

    /**
     * Starts panning when mouse is pressed.
     * @param {MouseEvent} event - The mouse event.
     */
    startPan(event) {
        if (event.button !== 1) return; // Middle mouse button only

        this.isPanning = true;
        this.startPan.x = event.clientX - this.offsetX;
        this.startPan.y = event.clientY - this.offsetY;
    }

    /**
     * Handles panning when the mouse moves.
     * @param {MouseEvent} event - The mouse event.
     */
    pan(event) {
        if (!this.isPanning) return;

        this.offsetX = event.clientX - this.startPan.x;
        this.offsetY = event.clientY - this.startPan.y;
        this.render();
    }

    /**
     * Stops panning when the mouse button is released.
     */
    stopPan() {
        this.isPanning = false;
    }


    /**
     * Determines if a point is inside an element's boundary.
     * @param {number} x - The X-coordinate of the point.
     * @param {number} y - The Y-coordinate of the point.
     * @param {Object} element - The circuit element to check.
     * @returns {boolean} True if the point is within the element's boundary.
     */
    isInsideElement(x, y, element) {
        const [start] = element.nodes;
        const size = 50; // Fixed size for simplicity.
        return (
            x >= start.x &&
            x <= start.x + size &&
            y >= start.y &&
            y <= start.y + size
        );
    }
}