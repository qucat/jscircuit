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
     * @param {Function} isCommandActive - Function that returns true if there's an active command
     */
    constructor(canvas, circuitService, rendererFactory, isCommandActive = null) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        this.circuitService = circuitService;
        this.rendererFactory = rendererFactory;
        this.isCommandActive = isCommandActive;

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

        // Track which specific element is currently hovered
        this.hoveredElement = null;
        
        // Track which elements are currently selected (support multiple selection)
        this.selectedElements = new Set();
        
        // Keep backwards compatibility with single selection
        this.selectedElement = null;

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
        this.canvas.addEventListener("mousemove", (event) => {
            this.pan(event);
            this.handleMouseMove(event);
        });
        this.canvas.addEventListener("mouseup", () => this.stopPan());
        this.canvas.addEventListener("mouseleave", () => {
            this.stopPan();
            this.clearAllHovers();
        });
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
            const isHovered = this.hoveredElement === element;
            const isSelected = this.selectedElements.has(element) || this.selectedElement === element;
            
            // Pass hover and selection states to the renderer
            if (renderer.renderElementWithStates) {
                renderer.renderElementWithStates(element, isHovered, isSelected);
            } else if (renderer.renderElementWithHover) {
                renderer.renderElementWithHover(element, isHovered);
            } else {
                // Fallback for renderers that don't support hover or selection
                renderer.renderElement(element);
            }
        });

        this.context.restore();
        
        // Render selection box overlay (after transformations are restored)
        this.renderSelectionBox();
        
        // Render bounding box for multiple selected elements (disabled for now)
        // this.renderSelectionBoundingBox();
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
        
        // Check zoom limits and show feedback
        if (newScale < 0.5) {
            this.showZoomMessage("Minimum zoom level reached (50%)");
            return;
        }
        if (newScale > 3.0) {
            this.showZoomMessage("Maximum zoom level reached (300%)");
            return;
        }

        // Adjust pan offsets to maintain zoom focus on cursor position
        this.offsetX = mouseX - ((mouseX - this.offsetX) * zoomDirection);
        this.offsetY = mouseY - ((mouseY - this.offsetY) * zoomDirection);
        this.scale = newScale;

        this.render(); // Redraw circuit with new zoom level
        
        // Emit pan event for scroll bar synchronization
        this.circuitService.emit("pan", {
            offsetX: this.offsetX,
            offsetY: this.offsetY
        });
    }

    /**
     * Show a temporary message in the top-left corner of the canvas
     * @param {string} message - The message to display
     */
    showZoomMessage(message) {
        // Create or get existing message element
        let messageElement = document.getElementById('zoom-message');
        if (!messageElement) {
            messageElement = document.createElement('div');
            messageElement.id = 'zoom-message';
            messageElement.style.cssText = `
                position: absolute;
                top: 10px;
                left: 10px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 8px 12px;
                border-radius: 4px;
                font-family: Arial, sans-serif;
                font-size: 12px;
                z-index: 1000;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;
            this.canvas.parentElement.appendChild(messageElement);
        }

        // Update message and show it
        messageElement.textContent = message;
        messageElement.style.opacity = '1';

        // Hide after 2 seconds
        clearTimeout(this.messageTimeout);
        this.messageTimeout = setTimeout(() => {
            messageElement.style.opacity = '0';
        }, 2000);
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
        
        // Emit pan event for scroll bar synchronization
        this.circuitService.emit("pan", {
            offsetX: this.offsetX,
            offsetY: this.offsetY
        });
    }

    /**
     * Stops panning when the mouse button is released.
     */
    stopPan() {
        this.isPanning = false;
    }

    /**
     * Handles mouse movement for hover detection
     */
    handleMouseMove(event) {
        if (this.isPanning) return; // Don't handle hover during panning

        const rect = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // Transform mouse coordinates to logical coordinates
        const logicalX = (mouseX - this.offsetX) / this.scale;
        const logicalY = (mouseY - this.offsetY) / this.scale;

        this.checkElementHovers(logicalX, logicalY);
    }

    /**
     * Check which elements should be hovered based on mouse position
     */
    checkElementHovers(mouseX, mouseY) {
        // Skip hover detection if there's an active command (like wire drawing)
        if (this.isCommandActive && this.isCommandActive()) {
            // Clear any existing hover state
            if (this.hoveredElement) {
                this.hoveredElement = null;
                this.render();
            }
            return;
        }

        let newHoveredElement = null;
        
        // Check all circuit elements for hover
        const elements = this.circuitService.getElements();
        if (elements) {
            for (const element of elements) {
                const renderer = this.renderers.get(element.type);
                if (renderer) {
                    let isHovered = false;
                    
                    // Special handling for wires which need different hover detection
                    if (element.type === 'wire' && renderer.checkHover) {
                        isHovered = renderer.checkHover(element, mouseX, mouseY);
                    } else if (renderer.isPointInBounds) {
                        const [start, end] = element.nodes;
                        const midX = (start.x + end.x) / 2;
                        const midY = (start.y + end.y) / 2;
                        isHovered = renderer.isPointInBounds(mouseX, mouseY, midX, midY);
                    }
                    
                    if (isHovered) {
                        newHoveredElement = element;
                        break; // Only hover one element at a time
                    }
                }
            }
        }

        // Update hover state and re-render if changed
        if (this.hoveredElement !== newHoveredElement) {
            this.hoveredElement = newHoveredElement;
            this.render();
        }
    }

    /**
     * Clear all hover states
     */
    clearAllHovers() {
        if (this.hoveredElement) {
            this.hoveredElement = null;
            this.render();
        }
    }

    /**
     * Set the selected element
     * @param {Object|null} element - The element to select, or null to clear selection
     */
    setSelectedElement(element) {
        if (this.selectedElement !== element) {
            this.selectedElement = element;
            this.render();
        }
    }

    /**
     * Get the currently selected element
     * @returns {Object|null} The selected element or null
     */
    getSelectedElement() {
        return this.selectedElement;
    }

    /**
     * Clear the current selection
     */
    clearSelection() {
        this.setSelectedElement(null);
        this.selectedElements.clear();
    }

    /**
     * Add element to multiple selection
     * @param {Object} element - The element to add to selection
     */
    addToSelection(element) {
        if (element) {
            this.selectedElements.add(element);
            this.render();
        }
    }

    /**
     * Remove element from multiple selection
     * @param {Object} element - The element to remove from selection
     */
    removeFromSelection(element) {
        if (this.selectedElements.has(element)) {
            this.selectedElements.delete(element);
            this.render();
        }
    }

    /**
     * Set multiple selected elements
     * @param {Array|Set} elements - The elements to select
     */
    setSelectedElements(elements) {
        this.selectedElements.clear();
        if (Array.isArray(elements)) {
            elements.forEach(element => this.selectedElements.add(element));
        } else if (elements instanceof Set) {
            this.selectedElements = new Set(elements);
        }
        this.render();
    }

    /**
     * Get all currently selected elements
     * @returns {Array} Array of selected elements
     */
    getSelectedElements() {
        const result = Array.from(this.selectedElements);
        // Include single selected element if it exists and isn't already in the Set
        if (this.selectedElement && !this.selectedElements.has(this.selectedElement)) {
            result.push(this.selectedElement);
        }
        return result;
    }

    /**
     * Check if an element is selected
     * @param {Object} element - The element to check
     * @returns {boolean} True if the element is selected
     */
    isElementSelected(element) {
        return this.selectedElements.has(element) || this.selectedElement === element;
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

    /**
     * Set selection box data for rendering
     * @param {Object|null} selectionBox - Selection box with startX, startY, endX, endY or null
     */
    setSelectionBox(selectionBox) {
        this.selectionBox = selectionBox;
    }

    /**
     * Render selection box overlay (in screen coordinates)
     * @private
     */
    renderSelectionBox() {
        if (!this.selectionBox) return;

        const { startX, startY, endX, endY } = this.selectionBox;
        
        // Convert world coordinates to screen coordinates
        const screenStartX = startX * this.scale + this.offsetX;
        const screenStartY = startY * this.scale + this.offsetY;
        const screenEndX = endX * this.scale + this.offsetX;
        const screenEndY = endY * this.scale + this.offsetY;

        const ctx = this.context;
        ctx.save();
        
        // Draw dashed rectangle
        ctx.strokeStyle = '#007ACC';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        
        const width = screenEndX - screenStartX;
        const height = screenEndY - screenStartY;
        
        ctx.strokeRect(screenStartX, screenStartY, width, height);
        
        // Optional: Add semi-transparent fill
        ctx.fillStyle = 'rgba(0, 122, 204, 0.1)';
        ctx.fillRect(screenStartX, screenStartY, width, height);
        
        ctx.restore();
    }

    /**
     * Render bounding box around selected elements with rotation center
     * @private
     */
    renderSelectionBoundingBox() {
        const selectedElements = this.getSelectedElements();
        
        if (selectedElements.length < 1) return;

        // Calculate bounding box in world coordinates
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        selectedElements.forEach(element => {
            element.nodes.forEach(node => {
                minX = Math.min(minX, node.x);
                minY = Math.min(minY, node.y);
                maxX = Math.max(maxX, node.x);
                maxY = Math.max(maxY, node.y);
            });
        });

        // Convert to screen coordinates
        const screenMinX = minX * this.scale + this.offsetX;
        const screenMinY = minY * this.scale + this.offsetY;
        const screenMaxX = maxX * this.scale + this.offsetX;
        const screenMaxY = maxY * this.scale + this.offsetY;

        // Calculate center in screen coordinates
        const centerX = (screenMinX + screenMaxX) / 2;
        const centerY = (screenMinY + screenMaxY) / 2;

        const ctx = this.context;
        ctx.save();
        
        // Draw bounding box
        ctx.strokeStyle = '#FF6B35'; // Orange color for rotation bounding box
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        
        const width = screenMaxX - screenMinX;
        const height = screenMaxY - screenMinY;
        
        // Add some padding to the bounding box
        const padding = 10;
        ctx.strokeRect(
            screenMinX - padding, 
            screenMinY - padding, 
            width + 2 * padding, 
            height + 2 * padding
        );
        
        // Draw rotation center indicator
        ctx.setLineDash([]); // Solid line for center
        ctx.strokeStyle = '#FF6B35';
        ctx.fillStyle = '#FF6B35';
        ctx.lineWidth = 2;
        
        // Cross at center
        const crossSize = 8;
        ctx.beginPath();
        ctx.moveTo(centerX - crossSize, centerY);
        ctx.lineTo(centerX + crossSize, centerY);
        ctx.moveTo(centerX, centerY - crossSize);
        ctx.lineTo(centerX, centerY + crossSize);
        ctx.stroke();
        
        // Small circle at center
        ctx.beginPath();
        ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}