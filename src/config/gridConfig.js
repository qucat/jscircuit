/**
 * Grid Configuration for Circuit Generator
 * 
 * Uses logical coordinate system with CoordinateAdapter for v1.0/v2.0 compatibility
 */

import { CoordinateAdapter } from '../infrastructure/adapters/CoordinateAdapter.js';

// Coordinate system constants
const LOGICAL_PIXELS_PER_GRID_UNIT = CoordinateAdapter.CONFIG.PIXELS_PER_GRID_UNIT;

// Visual grid display spacing (independent from coordinate system)
// Wires snap and jump by this amount on screen
const VISUAL_GRID_SPACING = 50; // Visual grid spacing for user interactions

// Use CoordinateAdapter as the single source of truth for coordinates
export const GRID_SPACING = LOGICAL_PIXELS_PER_GRID_UNIT; // Logical grid unit spacing
export const COMPONENT_GRID_POINTS = CoordinateAdapter.CONFIG.V2_COMPONENT_SPAN; // Component span in logical grid intervals
export const COMPONENT_SPAN_PIXELS = COMPONENT_GRID_POINTS * GRID_SPACING;

/**
 * Central grid configuration object for component sizing
 */
export const GRID_CONFIG = {
    // Visual grid display (for wire snapping and grid rendering)
    visualGridSpacing: VISUAL_GRID_SPACING,   // Visual grid spacing for wire interactions

    // Logical grid (coordinate system)
    spacing: GRID_SPACING,                    // Logical grid unit spacing
    componentGridPoints: COMPONENT_GRID_POINTS, // Component grid span
    componentSpanPixels: COMPONENT_SPAN_PIXELS,

    // Integration test compatibility properties
    pixelsPerGridUnit: GRID_SPACING,
    componentLogicalSpan: COMPONENT_GRID_POINTS,
    v1ComponentSpan: CoordinateAdapter.CONFIG.V1_COMPONENT_SPAN, // v1.0: 1 interval

    // Component height (2 grid points for visual appeal)
    componentHeightPixels: 2 * GRID_SPACING,   // 20 pixels

    // Legacy compatibility
    legacyComponentGridPoints: 5,               // Old system (migration)

    // Grid snapping utility function
    snapToGrid: (value) => Math.round(value / GRID_SPACING) * GRID_SPACING,

    // Visual grid snapping - snaps to visual grid increments
    snapToVisualGrid: (value) => Math.round(value / VISUAL_GRID_SPACING) * VISUAL_GRID_SPACING,

    // Logical grid snapping (pixels to logical grid units)
    snapToLogicalGrid: (pixelValue) => Math.round(pixelValue / GRID_SPACING),

    // Convert logical grid units to pixels
    logicalToPixel: (logicalValue) => logicalValue * GRID_SPACING,
    
    
    // Calculate node positions for 2-node components using logical coordinates
    // Center position should be pre-snapped to visual grid
    calculateNodePositions: (centerX, centerY, angleRadians = 0) => {
        if (angleRadians === 0) {
            // Horizontal orientation: calculate nodes and snap them to visual grid
            const halfSpanPixels = COMPONENT_SPAN_PIXELS / 2;

            const startX = centerX - halfSpanPixels;
            const endX = centerX + halfSpanPixels;

            // Snap nodes to visual grid to ensure they land on grid points
            return {
                start: {
                    x: GRID_CONFIG.snapToVisualGrid(startX),
                    y: GRID_CONFIG.snapToVisualGrid(centerY)
                },
                end: {
                    x: GRID_CONFIG.snapToVisualGrid(endX),
                    y: GRID_CONFIG.snapToVisualGrid(centerY)
                }
            };
        } else {
            // For other orientations, use trigonometry but snap to visual grid
            const halfSpanPixels = COMPONENT_SPAN_PIXELS / 2; // 25 pixels

            const startX = centerX - halfSpanPixels * Math.cos(angleRadians);
            const startY = centerY - halfSpanPixels * Math.sin(angleRadians);
            const endX = centerX + halfSpanPixels * Math.cos(angleRadians);
            const endY = centerY + halfSpanPixels * Math.sin(angleRadians);

            // Snap both nodes to nearest visual grid points
            return {
                start: {
                    x: GRID_CONFIG.snapToVisualGrid(startX),
                    y: GRID_CONFIG.snapToVisualGrid(startY)
                },
                end: {
                    x: GRID_CONFIG.snapToVisualGrid(endX),
                    y: GRID_CONFIG.snapToVisualGrid(endY)
                }
            };
        }
    }
};

/**
 * Validation function to ensure grid configuration is correct
 */
export function validateGridConfig() {
    
    // Validate calculations
    if (COMPONENT_SPAN_PIXELS !== COMPONENT_GRID_POINTS * GRID_SPACING) {
        throw new Error('Grid configuration error: component span calculation is incorrect');
    }
    
    return true;
}

// Run validation on import
validateGridConfig();