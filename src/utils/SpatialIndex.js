/**
 * @file SpatialIndex.js
 * @description 
 * Spatial indexing utility using Quadtree for fast element detection.
 * Optimizes hover detection from O(n) to O(log n) for large circuits.
 */

/**
 * Represents a 2D bounding box
 */
export class BoundingBox {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    /**
     * Check if this box contains a point
     * @param {number} x - Point x coordinate
     * @param {number} y - Point y coordinate
     * @returns {boolean} True if point is inside box
     */
    containsPoint(x, y) {
        return x >= this.x && 
               x <= this.x + this.width && 
               y >= this.y && 
               y <= this.y + this.height;
    }

    /**
     * Check if this box intersects with another box
     * @param {BoundingBox} other - Other bounding box
     * @returns {boolean} True if boxes intersect
     */
    intersects(other) {
        return !(other.x > this.x + this.width || 
                 other.x + other.width < this.x || 
                 other.y > this.y + this.height || 
                 other.y + other.height < this.y);
    }

    /**
     * Create bounding box from element nodes
     * @param {Array} nodes - Element nodes with x,y properties
     * @param {number} padding - Extra padding around element
     * @returns {BoundingBox} Calculated bounding box
     */
    static fromElement(element, padding = 20) {
        if (!element.nodes || element.nodes.length === 0) {
            return new BoundingBox(0, 0, 0, 0);
        }

        const xs = element.nodes.map(node => node.x);
        const ys = element.nodes.map(node => node.y);
        const minX = Math.min(...xs) - padding;
        const maxX = Math.max(...xs) + padding;
        const minY = Math.min(...ys) - padding;
        const maxY = Math.max(...ys) + padding;

        return new BoundingBox(minX, minY, maxX - minX, maxY - minY);
    }
}

/**
 * Quadtree node for spatial indexing
 */
class QuadTreeNode {
    constructor(bounds, maxElements = 10, maxDepth = 5, depth = 0) {
        this.bounds = bounds;
        this.maxElements = maxElements;
        this.maxDepth = maxDepth;
        this.depth = depth;
        this.elements = [];
        this.children = null;
        this.divided = false;
    }

    /**
     * Insert an element into the quadtree
     * @param {Object} elementData - Object with element and boundingBox properties
     * @returns {boolean} True if successfully inserted
     */
    insert(elementData) {
        const { element, boundingBox } = elementData;

        // Check if element's bounding box intersects with this node's bounds
        if (!this.bounds.intersects(boundingBox)) {
            return false;
        }

        // If we can fit more elements and haven't subdivided, add here
        if (this.elements.length < this.maxElements && !this.divided) {
            this.elements.push(elementData);
            return true;
        }

        // If we haven't subdivided yet and can go deeper, subdivide
        if (!this.divided && this.depth < this.maxDepth) {
            this.subdivide();
        }

        // If subdivided, try to insert into children
        if (this.divided) {
            for (const child of this.children) {
                if (child.insert(elementData)) {
                    return true;
                }
            }
        }

        // If children couldn't take it, store here anyway
        this.elements.push(elementData);
        return true;
    }

    /**
     * Subdivide this node into four children
     */
    subdivide() {
        const { x, y, width, height } = this.bounds;
        const halfWidth = width / 2;
        const halfHeight = height / 2;

        this.children = [
            // Top-left
            new QuadTreeNode(
                new BoundingBox(x, y, halfWidth, halfHeight),
                this.maxElements, this.maxDepth, this.depth + 1
            ),
            // Top-right
            new QuadTreeNode(
                new BoundingBox(x + halfWidth, y, halfWidth, halfHeight),
                this.maxElements, this.maxDepth, this.depth + 1
            ),
            // Bottom-left
            new QuadTreeNode(
                new BoundingBox(x, y + halfHeight, halfWidth, halfHeight),
                this.maxElements, this.maxDepth, this.depth + 1
            ),
            // Bottom-right
            new QuadTreeNode(
                new BoundingBox(x + halfWidth, y + halfHeight, halfWidth, halfHeight),
                this.maxElements, this.maxDepth, this.depth + 1
            )
        ];

        this.divided = true;

        // Redistribute existing elements to children
        const elementsToRedistribute = [...this.elements];
        this.elements = [];

        for (const elementData of elementsToRedistribute) {
            this.insert(elementData);
        }
    }

    /**
     * Query elements at a specific point
     * @param {number} x - Query point x coordinate
     * @param {number} y - Query point y coordinate
     * @param {Array} results - Array to collect results
     * @returns {Array} Elements at the query point
     */
    queryPoint(x, y, results = []) {
        // Check if point is within this node's bounds
        if (!this.bounds.containsPoint(x, y)) {
            return results;
        }

        // Add elements from this node that contain the point
        for (const elementData of this.elements) {
            if (elementData.boundingBox.containsPoint(x, y)) {
                results.push(elementData);
            }
        }

        // Query children if subdivided
        if (this.divided) {
            for (const child of this.children) {
                child.queryPoint(x, y, results);
            }
        }

        return results;
    }

    /**
     * Query elements within a bounding box
     * @param {BoundingBox} queryBounds - Bounding box to query
     * @param {Array} results - Array to collect results
     * @returns {Array} Elements within the query bounds
     */
    queryRange(queryBounds, results = []) {
        // Check if query bounds intersect with this node's bounds
        if (!this.bounds.intersects(queryBounds)) {
            return results;
        }

        // Add elements from this node that intersect with query bounds
        for (const elementData of this.elements) {
            if (elementData.boundingBox.intersects(queryBounds)) {
                results.push(elementData);
            }
        }

        // Query children if subdivided
        if (this.divided) {
            for (const child of this.children) {
                child.queryRange(queryBounds, results);
            }
        }

        return results;
    }

    /**
     * Clear all elements from the tree
     */
    clear() {
        this.elements = [];
        this.children = null;
        this.divided = false;
    }

    /**
     * Get total number of elements in this subtree
     * @returns {number} Total element count
     */
    getElementCount() {
        let count = this.elements.length;
        if (this.divided) {
            for (const child of this.children) {
                count += child.getElementCount();
            }
        }
        return count;
    }
}

/**
 * Spatial index for fast element location queries
 */
export class SpatialIndex {
    constructor(bounds, maxElements = 10, maxDepth = 5) {
        this.bounds = bounds;
        this.maxElements = maxElements;
        this.maxDepth = maxDepth;
        this.root = new QuadTreeNode(bounds, maxElements, maxDepth);
        this.elementMap = new Map(); // Track elements for updates/removal
    }

    /**
     * Add or update an element in the spatial index
     * @param {Object} element - Circuit element
     * @param {BoundingBox} boundingBox - Optional precomputed bounding box
     */
    addElement(element, boundingBox = null) {
        // Remove existing entry if present
        this.removeElement(element);

        // Calculate bounding box if not provided
        if (!boundingBox) {
            boundingBox = BoundingBox.fromElement(element);
        }

        const elementData = { element, boundingBox };
        
        // Insert into quadtree
        this.root.insert(elementData);
        
        // Track in map for easy removal/updates
        this.elementMap.set(element.id, elementData);
    }

    /**
     * Remove an element from the spatial index
     * @param {Object} element - Circuit element to remove
     */
    removeElement(element) {
        if (this.elementMap.has(element.id)) {
            this.elementMap.delete(element.id);
            // Note: For efficiency, we don't remove from quadtree immediately
            // Instead, we rebuild periodically or mark as deleted
        }
    }

    /**
     * Find elements at a specific point
     * @param {number} x - Query point x coordinate
     * @param {number} y - Query point y coordinate
     * @returns {Array} Elements at the query point
     */
    findElementsAtPoint(x, y) {
        const candidates = this.root.queryPoint(x, y);
        
        // Filter out removed elements and return only the element objects
        return candidates
            .filter(data => this.elementMap.has(data.element.id))
            .map(data => data.element);
    }

    /**
     * Find elements within a bounding box
     * @param {BoundingBox} bounds - Query bounding box
     * @returns {Array} Elements within the bounds
     */
    findElementsInRange(bounds) {
        const candidates = this.root.queryRange(bounds);
        
        // Filter out removed elements and return only the element objects
        return candidates
            .filter(data => this.elementMap.has(data.element.id))
            .map(data => data.element);
    }

    /**
     * Update the spatial index with current elements
     * @param {Array} elements - All current circuit elements
     */
    rebuild(elements) {
        this.clear();
        
        for (const element of elements) {
            this.addElement(element);
        }
    }

    /**
     * Clear the spatial index
     */
    clear() {
        this.root.clear();
        this.elementMap.clear();
    }

    /**
     * Get statistics about the spatial index
     * @returns {Object} Index statistics
     */
    getStats() {
        return {
            totalElements: this.elementMap.size,
            treeElements: this.root.getElementCount(),
            bounds: this.bounds,
            maxDepth: this.maxDepth,
            maxElements: this.maxElements
        };
    }

    /**
     * Resize the spatial index bounds
     * @param {BoundingBox} newBounds - New bounds for the index
     */
    resize(newBounds) {
        const elements = Array.from(this.elementMap.values()).map(data => data.element);
        this.bounds = newBounds;
        this.root = new QuadTreeNode(newBounds, this.maxElements, this.maxDepth);
        this.rebuild(elements);
    }
}

/**
 * Adaptive spatial index that adjusts to viewport changes
 */
export class AdaptiveSpatialIndex extends SpatialIndex {
    constructor(initialBounds, maxElements = 10, maxDepth = 5) {
        super(initialBounds, maxElements, maxDepth);
        this.lastRebuild = 0;
        this.rebuildThreshold = 100; // Rebuild after 100 changes
        this.changeCount = 0;
    }

    /**
     * Add element with automatic rebuilding
     */
    addElement(element, boundingBox = null) {
        super.addElement(element, boundingBox);
        this.changeCount++;
        this.checkRebuild();
    }

    /**
     * Remove element with automatic rebuilding
     */
    removeElement(element) {
        super.removeElement(element);
        this.changeCount++;
        this.checkRebuild();
    }

    /**
     * Check if rebuild is needed and perform if necessary
     */
    checkRebuild() {
        if (this.changeCount >= this.rebuildThreshold) {
            const elements = Array.from(this.elementMap.values()).map(data => data.element);
            this.rebuild(elements);
            this.changeCount = 0;
            this.lastRebuild = Date.now();
        }
    }

    /**
     * Update bounds based on viewport and zoom level
     * @param {number} offsetX - Viewport offset X
     * @param {number} offsetY - Viewport offset Y
     * @param {number} scale - Zoom scale
     * @param {number} canvasWidth - Canvas width
     * @param {number} canvasHeight - Canvas height
     */
    updateViewport(offsetX, offsetY, scale, canvasWidth, canvasHeight) {
        // Calculate viewport bounds in logical coordinates
        const logicalLeft = -offsetX / scale;
        const logicalTop = -offsetY / scale;
        const logicalWidth = canvasWidth / scale;
        const logicalHeight = canvasHeight / scale;

        // Expand bounds to include some margin for smooth panning
        const margin = Math.max(logicalWidth, logicalHeight) * 0.5;
        const newBounds = new BoundingBox(
            logicalLeft - margin,
            logicalTop - margin,
            logicalWidth + 2 * margin,
            logicalHeight + 2 * margin
        );

        // Only resize if bounds changed significantly
        const boundsChanged = 
            Math.abs(newBounds.x - this.bounds.x) > margin / 4 ||
            Math.abs(newBounds.y - this.bounds.y) > margin / 4 ||
            Math.abs(newBounds.width - this.bounds.width) > margin / 2 ||
            Math.abs(newBounds.height - this.bounds.height) > margin / 2;

        if (boundsChanged) {
            this.resize(newBounds);
        }
    }
}