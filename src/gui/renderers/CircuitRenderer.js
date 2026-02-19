import { Logger } from "../../utils/Logger.js";
import { throttle, globalRenderScheduler, globalPerformanceMonitor } from "../../utils/PerformanceUtils.js";
import { AdaptiveSpatialIndex, BoundingBox } from "../../utils/SpatialIndex.js";

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
 * **Performance Optimizations**:
 * - Throttled mouse events to prevent excessive hover checks
 * - RequestAnimationFrame-based render scheduling
 * - Spatial optimization for element detectionww
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
        this.scale = 1.5; // Start at 150% zoom for better detail visibility
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

        // Performance optimizations
        this.renderScheduled = false;
        this.lastHoverCheck = 0;
        this.HOVER_CHECK_THROTTLE = 16; // Max 60fps for hover checks
        
        // Spatial indexing for fast element detection
        const initialBounds = new BoundingBox(-1000, -1000, 2000, 2000);
        this.spatialIndex = new AdaptiveSpatialIndex(initialBounds, 10, 5);
        this.spatialIndexNeedsUpdate = true;
        
        // Throttle expensive mouse operations
        this.throttledHoverCheck = throttle(
            this.checkElementHovers.bind(this),
            this.HOVER_CHECK_THROTTLE
        );

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

        // Grid visibility (off by default for performance; toggle with setShowGrid)
        this.showGrid = false;

        // Stable reference for render scheduling (enables deduplication in RenderScheduler)
        this._boundPerformRender = () => this.performRender();

        // Listen for circuit changes to update spatial index
        this.circuitService.on('elementAdded', () => this.invalidateSpatialIndex());
        this.circuitService.on('elementDeleted', () => this.invalidateSpatialIndex());
        this.circuitService.on('elementMoved', () => this.invalidateSpatialIndex());
        this.circuitService.on('circuitCleared', () => this.invalidateSpatialIndex());

        // NOTE: Canvas event listeners (wheel, mouse*, dblclick) are NOT registered here.
        // GUIAdapter is the single owner of all canvas event listeners and calls
        // our methods (zoom, startPan, pan, stopPan, handleMouseMove, etc.) directly.
    }
    
    /**
     * Clears the canvas by resetting its drawing context.
     */
    clearCanvas() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Optimized render method with scheduling to prevent excessive re-renders
     */
    render() {
        // Use render scheduler to batch multiple render requests.
        // _boundPerformRender is a stable reference so the Set deduplicates correctly.
        globalRenderScheduler.scheduleRender(this._boundPerformRender);
    }

    /**
     * Actual render implementation - called by scheduler
     */
    performRender() {
        globalPerformanceMonitor.startTiming('circuit-render');
        
        this.clearCanvas();

        // Apply transformations (panning & zooming)
        this.context.save();
        this.context.translate(this.offsetX, this.offsetY);
        this.context.scale(this.scale, this.scale);

        // Draw background grid (only when enabled)
        if (this.showGrid) {
            this.drawGrid();
        }

        // Iterate over circuit elements and render them
        this.circuitService.getElements().forEach((element) => {
            if (!this.renderers.has(element.type)) {
                const renderer = this.rendererFactory.create(element.type, this.context);
                if (!renderer) {
                    Logger.warn(`No renderer found for element type: ${element.type}`);
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
        
        const renderDuration = globalPerformanceMonitor.endTiming('circuit-render');
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
     * Toggle grid visibility.
     * @param {boolean} visible - Whether the dot-grid should be displayed.
     */
    setShowGrid(visible) {
        this.showGrid = !!visible;
        this.render();
    }

    /**
     * Optimized zoom handler with batched rendering
     */
    zoom(event) {
        event.preventDefault();

        const scaleFactor = 1.1; // Zoom factor
        const mouseX = event.offsetX;
        const mouseY = event.offsetY;
        const zoomDirection = event.deltaY > 0 ? 1 / scaleFactor : scaleFactor;

        const newScale = this.scale * zoomDirection;
        
        // Check zoom limits (50% to 150%)
        if (newScale < 1.0) {
            return;
        }
        if (newScale > 3.0) {
            return;
        }

        // Adjust pan offsets to maintain zoom focus on cursor position
        this.offsetX = mouseX - ((mouseX - this.offsetX) * zoomDirection);
        this.offsetY = mouseY - ((mouseY - this.offsetY) * zoomDirection);
        this.scale = newScale;

        // Schedule render and emit pan event (but don't render twice)
        this.render();
        
        // Emit pan event for scroll bar synchronization (throttled)
        this.emitPanEvent();
    }

    /**
     * Throttled pan event emission to prevent event spam
     */
    emitPanEvent() {
        if (!this.panEventThrottled) {
            this.panEventThrottled = throttle(() => {
                this.circuitService.emit("pan", {
                    offsetX: this.offsetX,
                    offsetY: this.offsetY
                });
            }, 50); // Limit pan events to 20fps
        }
        this.panEventThrottled();
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
     * Optimized panning with scheduled rendering
     */
    pan(event) {
        if (!this.isPanning) return;

        this.offsetX = event.clientX - this.startPan.x;
        this.offsetY = event.clientY - this.startPan.y;
        
        // Schedule render instead of immediate render
        this.render();
        
        // Throttled pan event emission
        this.emitPanEvent();
    }

    /**
     * Stops panning when the mouse button is released.
     */
    stopPan() {
        this.isPanning = false;
    }

    /**
     * Optimized mouse movement handler with throttling
     */
    handleMouseMove(event) {
        if (this.isPanning) return; // Don't handle hover during panning

        const rect = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // Transform mouse coordinates to logical coordinates
        const logicalX = (mouseX - this.offsetX) / this.scale;
        const logicalY = (mouseY - this.offsetY) / this.scale;

        // Use throttled hover check to prevent excessive re-renders
        this.throttledHoverCheck(logicalX, logicalY);
    }

    /**
     * Handles double-click events for property editing
     */
    handleDoubleClick(event) {
        event.preventDefault();

        const rect = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // Transform mouse coordinates to logical coordinates
        const logicalX = (mouseX - this.offsetX) / this.scale;
        const logicalY = (mouseY - this.offsetY) / this.scale;


        // Find element at click position
        const clickedElement = this.findElementAtPosition(logicalX, logicalY);

        if (clickedElement && this.onElementDoubleClick) {
            // Delegate to the GUIAdapter via callback
            this.onElementDoubleClick(clickedElement);
        } else if (!clickedElement) {
        } else if (!this.onElementDoubleClick) {
        }
    }

    /**
     * Find element at the given position using the same logic as hover detection
     */
    findElementAtPosition(x, y) {
        const elements = this.circuitService.getElements();
        if (!elements) return null;

        // Check elements in reverse order (top-most first)
        for (let i = elements.length - 1; i >= 0; i--) {
            const element = elements[i];
            const renderer = this.renderers.get(element.type);
            
            if (renderer) {
                let isHit = false;
                
                // Special handling for wires which need different hover detection
                if (element.type === 'wire' && renderer.checkHover) {
                    isHit = renderer.checkHover(element, x, y);
                } else if (renderer.isPointInBounds) {
                    const [start, end] = element.nodes;
                    const midX = (start.x + end.x) / 2;
                    const midY = (start.y + end.y) / 2;
                    isHit = renderer.isPointInBounds(x, y, midX, midY);
                }
                
                if (isHit) {
                    return element;
                }
            }
        }
        
        return null;
    }

    /**
     * Set callback for element double-click events
     */
    setElementDoubleClickCallback(callback) {
        this.onElementDoubleClick = callback;
    }

    /**
     * Optimized hover detection with spatial indexing and performance monitoring
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

        globalPerformanceMonitor.startTiming('hover-check');
        
        // Update spatial index if needed
        this.updateSpatialIndex();
        
        let newHoveredElement = null;
        
        // Use spatial index for fast element lookup
        const candidateElements = this.spatialIndex.findElementsAtPoint(mouseX, mouseY);
        
        if (candidateElements && candidateElements.length > 0) {
            // Sort candidates by render order (reverse order so top elements are checked first)
            const elements = this.circuitService.getElements();
            const elementIndices = new Map();
            elements.forEach((element, index) => {
                elementIndices.set(element.id, index);
            });
            
            candidateElements.sort((a, b) => {
                const indexA = elementIndices.get(a.id) || 0;
                const indexB = elementIndices.get(b.id) || 0;
                return indexB - indexA; // Reverse order
            });
            
            // Check candidates for precise hover detection
            for (const element of candidateElements) {
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
        
        const hoverDuration = globalPerformanceMonitor.endTiming('hover-check');
        if (hoverDuration > 5) { // Log if hover check is slow
        }
    }

    /**
     * Quick viewport check to skip elements that are clearly not visible
     * @param {Object} element - Element to check
     * @returns {boolean} True if element might be visible
     */
    isElementInViewport(element) {
        if (!element.nodes || element.nodes.length === 0) return true;
        
        // Get element bounds
        const xs = element.nodes.map(node => node.x);
        const ys = element.nodes.map(node => node.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        
        // Transform viewport bounds to logical coordinates
        const viewportLeft = -this.offsetX / this.scale;
        const viewportTop = -this.offsetY / this.scale;
        const viewportRight = (this.canvas.width - this.offsetX) / this.scale;
        const viewportBottom = (this.canvas.height - this.offsetY) / this.scale;
        
        // Add some margin for element size
        const margin = 50;
        
        // Check if element bounds intersect with viewport
        return !(maxX + margin < viewportLeft ||
                 minX - margin > viewportRight ||
                 maxY + margin < viewportTop ||
                 minY - margin > viewportBottom);
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
     * Set the selected element with optimized rendering.
     * Also syncs the selectedElements Set so both states are consistent.
     */
    setSelectedElement(element) {
        const changed = this.selectedElement !== element || this.selectedElements.size > 0;
        this.selectedElement = element;
        this.selectedElements.clear();
        if (element) {
            this.selectedElements.add(element);
        }
        if (changed) {
            this.render();
        }
    }

    /**
     * Clear the current selection with optimized rendering
     */
    clearSelection() {
        const hadSelection = this.selectedElement !== null || this.selectedElements.size > 0;
        this.selectedElement = null;
        this.selectedElements.clear();
        
        // Only render if there was actually a selection to clear
        if (hadSelection) {
            this.render();
        }
    }

    /**
     * Add element to multiple selection with optimized rendering
     */
    addToSelection(element) {
        if (element && !this.selectedElements.has(element)) {
            this.selectedElements.add(element);
            this.render();
        }
    }

    /**
     * Update spatial index with current elements and viewport
     */
    updateSpatialIndex() {
        const elements = this.circuitService.getElements();
        
        // Update viewport bounds for adaptive indexing
        this.spatialIndex.updateViewport(
            this.offsetX, this.offsetY, this.scale,
            this.canvas.width, this.canvas.height
        );
        
        // Rebuild index if needed or if marked for update
        if (this.spatialIndexNeedsUpdate) {
            this.spatialIndex.rebuild(elements);
            this.spatialIndexNeedsUpdate = false;
        }
    }

    /**
     * Mark spatial index for update (call when elements change)
     */
    invalidateSpatialIndex() {
        this.spatialIndexNeedsUpdate = true;
    }

    /**
     * Add element to spatial index
     */
    addElementToSpatialIndex(element) {
        this.spatialIndex.addElement(element);
    }

    /**
     * Remove element from spatial index
     */
    removeElementFromSpatialIndex(element) {
        this.spatialIndex.removeElement(element);
    }

    /**
     * Cleanup method to remove event listeners and prevent memory leaks
     */
    dispose() {
        // Clear any scheduled renders
        globalRenderScheduler.cancelRender(this._boundPerformRender);
        
        // Clear references
        this.renderers.clear();
        this.selectedElements.clear();
        this.hoveredElement = null;
        this.selectedElement = null;
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
     * Set multiple selected elements.
     * Also clears selectedElement (singular) so both states are consistent.
     * @param {Array|Set} elements - The elements to select
     */
    setSelectedElements(elements) {
        this.selectedElement = null;
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

    /**
     * Centers the logical coordinate system (0,0) in the middle of the canvas.
     * This provides an intuitive coordinate origin for circuit design.
     */
    reCenter() {
        // Get the CSS dimensions of the canvas (not the HiDPI pixel dimensions)
        const rect = this.canvas.getBoundingClientRect();
        const canvasCenterX = rect.width / 2;
        const canvasCenterY = rect.height / 2;
        
        // Set offset so that logical coordinate (0,0) appears at canvas center
        // Since the context transform is translate(offsetX, offsetY) then scale(scale, scale),
        // logical (0,0) will be drawn at screen position (offsetX, offsetY)
        this.offsetX = canvasCenterX;
        this.offsetY = canvasCenterY;
        
        // Trigger re-render to apply the new centering
        this.render();
        
    }

    /**
     * Centers the scroll position of the canvas container to align with logical center
     */
    centerScrollPosition() {
        const canvasContainer = this.canvas.parentElement;
        if (!canvasContainer) {
            console.warn('[CircuitRenderer] No canvas container found for scroll centering');
            return;
        }

        const containerRect = canvasContainer.getBoundingClientRect();
        
        // Calculate center scroll position based on canvas and container dimensions
        const scrollLeft = (this.canvas.clientWidth - containerRect.width) / 2;
        const scrollTop = (this.canvas.clientHeight - containerRect.height) / 2;
        
        // Set scroll position to center
        canvasContainer.scrollLeft = Math.max(0, scrollLeft);
        canvasContainer.scrollTop = Math.max(0, scrollTop);
        
    }
}