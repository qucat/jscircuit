import { GridCoordinate } from '../../domain/valueObjects/GridCoordinate.js';
import { Position } from '../../domain/valueObjects/Position.js';

/**
 * CoordinateAdapter - Infrastructure adapter for coordinate system conversions
 * 
 * Follows Hexagonal Architecture principles:
 * - Port: Coordinate conversion interface for external systems
 * - Adapter: Implementation for QuCat v1.0/v2.0 format compatibility
 * 
 * Coordinate Systems:
 * 1. Logical Grid Coordinates (GridCoordinate): Integer positions for domain logic
 * 2. Pixel Coordinates (Position): Screen rendering positions for GUI
 * 
 * QuCat Format Compatibility:
 * - v1.0: Components span 2 logical grid points
 * - v2.0: Components span 6 logical grid points  
 * - Pixel grid spacing: 10 pixels per logical grid unit
 */
export class CoordinateAdapter {
    
    /**
     * Configuration constants for coordinate conversion
     */
    static CONFIG = {
        PIXELS_PER_GRID_UNIT: 10,
        V1_COMPONENT_SPAN: 1,        // v1.0: 1 interval per component
        V2_COMPONENT_SPAN: 5,        // v2.0: 5 intervals per component (1 × 5 scaling)
        SCALING_FACTOR: 5            // Coordinate scaling: 1 v1.0 interval = 5 v2.0 intervals
    };

    /**
     * Converts logical grid coordinates to pixel coordinates.
     * Used when rendering domain objects to the GUI.
     * 
     * @param {GridCoordinate} gridCoord - Logical grid coordinate
     * @returns {Position} Pixel coordinate
     */
    static gridToPixel(gridCoord) {
        const x = gridCoord.x * this.CONFIG.PIXELS_PER_GRID_UNIT;
        const y = gridCoord.y * this.CONFIG.PIXELS_PER_GRID_UNIT;
        return new Position(x, y);
    }

    /**
     * Converts pixel coordinates to logical grid coordinates.
     * Used when translating GUI interactions to domain operations.
     * 
     * @param {Position} pixelPos - Pixel coordinate
     * @returns {GridCoordinate} Logical grid coordinate (rounded to nearest)
     */
    static pixelToGrid(pixelPos) {
        const x = Math.round(pixelPos.x / this.CONFIG.PIXELS_PER_GRID_UNIT);
        const y = Math.round(pixelPos.y / this.CONFIG.PIXELS_PER_GRID_UNIT);
        return new GridCoordinate(x, y);
    }

    /**
     * Converts v1.0 QuCat format coordinates to v2.0 format.
     * Used when importing legacy v1.0 netlists.
     * 
     * @param {GridCoordinate} v1Coord - v1.0 logical coordinate
     * @returns {GridCoordinate} v2.0 logical coordinate
     */
    static v1ToV2Grid(v1Coord) {
        return v1Coord.scale(this.CONFIG.SCALING_FACTOR);
    }

    /**
     * Converts v2.0 QuCat format coordinates to v1.0 format.
     * Used when exporting to legacy v1.0 format.
     * 
     * @param {GridCoordinate} v2Coord - v2.0 logical coordinate
     * @returns {GridCoordinate} v1.0 logical coordinate
     */
    static v2ToV1Grid(v2Coord) {
        const x = Math.round(v2Coord.x / this.CONFIG.SCALING_FACTOR);
        const y = Math.round(v2Coord.y / this.CONFIG.SCALING_FACTOR);
        return new GridCoordinate(x, y);
    }

    /**
     * Snaps a pixel coordinate to the nearest grid position.
     * Used for grid-aligned element placement in the GUI.
     * 
     * @param {Position} pixelPos - Input pixel coordinate
     * @returns {Position} Pixel coordinate snapped to grid
     */
    static snapToGrid(pixelPos) {
        const gridCoord = this.pixelToGrid(pixelPos);
        return this.gridToPixel(gridCoord);
    }

    /**
     * Validates that coordinates form a proper v2.0 component (6 grid units span).
     * Used when validating imported circuit data.
     * 
     * @param {GridCoordinate} coord1 - First coordinate
     * @param {GridCoordinate} coord2 - Second coordinate
     * @returns {boolean} True if coordinates form valid v2.0 component
     */
    static isValidV2Component(coord1, coord2) {
        const dx = Math.abs(coord2.x - coord1.x);
        const dy = Math.abs(coord2.y - coord1.y);
        
        // Component should span exactly 6 grid units in one direction
        return (dx === this.CONFIG.V2_COMPONENT_SPAN && dy === 0) || 
               (dx === 0 && dy === this.CONFIG.V2_COMPONENT_SPAN);
    }

    /**
     * Validates that coordinates form a proper v1.0 component (2 grid units span).
     * Used when validating imported v1.0 circuit data.
     * 
     * @param {GridCoordinate} coord1 - First coordinate
     * @param {GridCoordinate} coord2 - Second coordinate
     * @returns {boolean} True if coordinates form valid v1.0 component
     */
    static isValidV1Component(coord1, coord2) {
        const dx = Math.abs(coord2.x - coord1.x);
        const dy = Math.abs(coord2.y - coord1.y);
        
        // Component should span exactly 2 grid units in one direction
        return (dx === this.CONFIG.V1_COMPONENT_SPAN && dy === 0) || 
               (dx === 0 && dy === this.CONFIG.V1_COMPONENT_SPAN);
    }

    /**
     * Creates a v2.0 component node pair from a center position and orientation.
     * For 5-interval span: positions nodes at -2 and +3 from center (asymmetric).
     * Used when creating new components with proper v2.0 spacing.
     * 
     * @param {GridCoordinate} center - Center logical grid coordinate
     * @param {string} orientation - 'horizontal' or 'vertical'
     * @returns {Object} Object with {start: GridCoordinate, end: GridCoordinate}
     */
    static createV2ComponentNodes(center, orientation = 'horizontal') {
        const span = this.CONFIG.V2_COMPONENT_SPAN; // 5 intervals
        // For 5-interval span: start at -2, end at +3 (relative to center)
        const startOffset = -Math.floor(span / 2); // -2 
        const endOffset = startOffset + span; // +3
        
        if (orientation === 'horizontal') {
            return {
                start: new GridCoordinate(center.x + startOffset, center.y),
                end: new GridCoordinate(center.x + endOffset, center.y)
            };
        } else { // vertical
            return {
                start: new GridCoordinate(center.x, center.y + startOffset),
                end: new GridCoordinate(center.x, center.y + endOffset)
            };
        }
    }

    /**
     * Creates a v1.0 component node pair from a center position and orientation.
     * Used when creating components for v1.0 export compatibility.
     * 
     * @param {GridCoordinate} center - Center logical grid coordinate
     * @param {string} orientation - 'horizontal' or 'vertical'
     * @returns {Object} Object with {start: GridCoordinate, end: GridCoordinate}
     */
    static createV1ComponentNodes(center, orientation = 'horizontal') {
        // For v1.0: 1 unit span means start=center, end=center+1
        if (orientation === 'horizontal') {
            return {
                start: new GridCoordinate(center.x, center.y),
                end: new GridCoordinate(center.x + this.CONFIG.V1_COMPONENT_SPAN, center.y)
            };
        } else { // vertical
            return {
                start: new GridCoordinate(center.x, center.y),
                end: new GridCoordinate(center.x, center.y + this.CONFIG.V1_COMPONENT_SPAN)
            };
        }
    }

    /**
     * Detects the QuCat format version based on coordinate ranges.
     * Used when importing circuits to determine appropriate adapter.
     * 
     * @param {Array<{x: number, y: number}>} coordinates - Array of coordinate objects
     * @returns {string} 'v1.0' or 'v2.0'
     */
    static detectFormat(coordinates) {
        const maxCoord = Math.max(...coordinates.map(c => Math.max(Math.abs(c.x), Math.abs(c.y))));
        
        // v1.0 typically uses small integer coordinates (-10 to 10)
        // v2.0 typically uses larger coordinates (pixels or large logical values)
        return maxCoord <= 20 ? 'v1.0' : 'v2.0';
    }

    /**
     * Converts between different coordinate representations for external systems.
     * Used by other adapters (GUI, netlist import/export) for coordinate translation.
     * 
     * @param {Object} sourceCoord - Source coordinate object
     * @param {string} sourceFormat - 'pixel', 'logical', 'v1.0', 'v2.0'
     * @param {string} targetFormat - 'pixel', 'logical', 'v1.0', 'v2.0'
     * @returns {Object} Converted coordinate object
     */
    static convertCoordinate(sourceCoord, sourceFormat, targetFormat) {
        if (sourceFormat === targetFormat) {
            return sourceCoord;
        }

        let gridCoord;

        // Convert source to logical grid coordinate
        switch (sourceFormat) {
            case 'pixel':
                gridCoord = this.pixelToGrid(sourceCoord);
                break;
            case 'logical':
            case 'v2.0':
                gridCoord = sourceCoord;
                break;
            case 'v1.0':
                gridCoord = this.v1ToV2Grid(sourceCoord);
                break;
            default:
                throw new Error(`Unsupported source format: ${sourceFormat}`);
        }

        // Convert logical to target format
        switch (targetFormat) {
            case 'pixel':
                return this.gridToPixel(gridCoord);
            case 'logical':
            case 'v2.0':
                return gridCoord;
            case 'v1.0':
                return this.v2ToV1Grid(gridCoord);
            default:
                throw new Error(`Unsupported target format: ${targetFormat}`);
        }
    }
}