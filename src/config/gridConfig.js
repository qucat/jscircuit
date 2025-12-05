/**
 * Grid Configuration for Circuit Generator
 * 
 * Uses logical coordinate system with CoordinateAdapter for v1.0/v2.0 compatibility
 */

import { CoordinateAdapter } from '../infrastructure/adapters/CoordinateAdapter.js';

// Use CoordinateAdapter as the single source of truth
export const GRID_SPACING = CoordinateAdapter.CONFIG.PIXELS_PER_GRID_UNIT; // 10 pixels between logical grid units
export const COMPONENT_GRID_POINTS = CoordinateAdapter.CONFIG.V2_COMPONENT_SPAN; // Components span 5 logical grid intervals (50 pixels)
export const COMPONENT_SPAN_PIXELS = COMPONENT_GRID_POINTS * GRID_SPACING; // 60 pixels

/**
 * Central grid configuration object for component sizing
 */
export const GRID_CONFIG = {
    // Basic measurements
    spacing: GRID_SPACING,                    // 10 pixels between points
    componentGridPoints: COMPONENT_GRID_POINTS, // 5 grid points span
    componentSpanPixels: COMPONENT_SPAN_PIXELS, // 50 pixels total
    
    // Integration test compatibility properties
    pixelsPerGridUnit: GRID_SPACING,         // 10 pixels per grid unit
    componentLogicalSpan: COMPONENT_GRID_POINTS, // 5 logical grid intervals
    v1ComponentSpan: CoordinateAdapter.CONFIG.V1_COMPONENT_SPAN, // v1.0: 1 interval
    
    // Component height (2 grid points for visual appeal)
    componentHeightPixels: 2 * GRID_SPACING,   // 20 pixels
    
    // Legacy compatibility
    legacyComponentGridPoints: 5,               // Old system (migration)
    
    // Grid snapping utility function
    snapToGrid: (value) => Math.round(value / GRID_SPACING) * GRID_SPACING,
    
    // Logical grid snapping (pixels to logical grid units)
    snapToLogicalGrid: (pixelValue) => Math.round(pixelValue / GRID_SPACING),
    
    // Convert logical grid units to pixels
    logicalToPixel: (logicalValue) => logicalValue * GRID_SPACING,
    
    
    // Calculate node positions for 2-node components using logical coordinates
    // For v2.0: components span 5 logical grid intervals (50 pixels)
    calculateNodePositions: (centerX, centerY, angleRadians = 0) => {
        if (angleRadians === 0) {
            // Horizontal orientation: ensure nodes land on grid points
            // For 5-interval span, center must be at N+0.5 logical positions
            const centerLogicalX = Math.round(centerX / GRID_SPACING);
            const centerLogicalY = Math.round(centerY / GRID_SPACING);
            
            // Offset by ±2.5 intervals, then round to nearest grid points
            const startLogicalX = Math.round(centerLogicalX - 2.5);
            const endLogicalX = Math.round(centerLogicalX + 2.5);
            
            return {
                start: {
                    x: startLogicalX * GRID_SPACING,
                    y: centerLogicalY * GRID_SPACING
                },
                end: {
                    x: endLogicalX * GRID_SPACING,
                    y: centerLogicalY * GRID_SPACING
                }
            };
        } else {
            // For other orientations, use trigonometry but snap to grid
            const halfSpanPixels = COMPONENT_SPAN_PIXELS / 2; // 30 pixels
            
            const startX = centerX - halfSpanPixels * Math.cos(angleRadians);
            const startY = centerY - halfSpanPixels * Math.sin(angleRadians);
            const endX = centerX + halfSpanPixels * Math.cos(angleRadians);
            const endY = centerY + halfSpanPixels * Math.sin(angleRadians);
            
            // Snap both nodes to nearest grid points
            return {
                start: {
                    x: Math.round(startX / GRID_SPACING) * GRID_SPACING,
                    y: Math.round(startY / GRID_SPACING) * GRID_SPACING
                },
                end: {
                    x: Math.round(endX / GRID_SPACING) * GRID_SPACING,
                    y: Math.round(endY / GRID_SPACING) * GRID_SPACING
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