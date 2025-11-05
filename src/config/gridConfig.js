/**
 * Grid Configuration for Component Sizing
 * 
 * Simplified Approach - Using Grid Points Only:
 * - Grid composed of points spaced 10 pixels apart
 * - Components span 5 grid points (50 pixels)
 * - Node-to-node distance: 5 grid points
 */

// Base grid measurements
export const GRID_SPACING = 10; // 10 pixels between each grid point

// Component sizing - simplified to use only grid points
export const COMPONENT_GRID_POINTS = 5; // Components span 5 grid points
export const COMPONENT_SPAN_PIXELS = COMPONENT_GRID_POINTS * GRID_SPACING; // 50 pixels

/**
 * Central grid configuration object for component sizing
 */
export const GRID_CONFIG = {
    // Basic measurements
    spacing: GRID_SPACING,                    // 10 pixels between points
    componentGridPoints: COMPONENT_GRID_POINTS, // 5 grid points span
    componentSpanPixels: COMPONENT_SPAN_PIXELS, // 50 pixels total
    
    // Component height (2 grid points for visual appeal)
    componentHeightPixels: 2 * GRID_SPACING,   // 20 pixels
    
    // Grid snapping utility function
    snapToGrid: (value) => Math.round(value / GRID_SPACING) * GRID_SPACING,
    
    // Calculate node positions for 2-node components
    // For nodes to be on grid points AND span 5 grid spaces:
    // - If component spans 5 grid spaces (50 pixels), nodes must be 5 spaces apart
    // - For horizontal orientation: if one node is at grid point X, other is at X + 50
    // - The center will be at X + 25 (which is NOT on a grid point)
    // - So we need to calculate from the intended center to find proper node positions
    calculateNodePositions: (centerX, centerY, angleRadians = 0) => {
        if (angleRadians === 0) {
            // Horizontal orientation: calculate start node on grid, end node 5 spaces away
            const halfSpan = COMPONENT_SPAN_PIXELS / 2; // 25 pixels
            const startX = Math.round((centerX - halfSpan) / GRID_SPACING) * GRID_SPACING;
            const endX = startX + COMPONENT_SPAN_PIXELS; // Exactly 5 grid spaces away
            const snapY = Math.round(centerY / GRID_SPACING) * GRID_SPACING;
            
            return {
                start: { x: startX, y: snapY },
                end: { x: endX, y: snapY }
            };
        } else {
            // For other orientations, use trigonometry but ensure nodes land on grid points
            const halfSpanPixels = COMPONENT_SPAN_PIXELS / 2; // 25 pixels
            
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
    console.log('✅ Grid Configuration for Component Sizing:');
    console.log(`   Grid spacing: ${GRID_SPACING} pixels between points`);
    console.log(`   Component span: ${COMPONENT_GRID_POINTS} grid points = ${COMPONENT_SPAN_PIXELS} pixels`);
    console.log(`   Component height: ${GRID_CONFIG.componentHeightPixels} pixels`);
    
    // Validate calculations
    if (COMPONENT_SPAN_PIXELS !== COMPONENT_GRID_POINTS * GRID_SPACING) {
        throw new Error('Grid configuration error: component span calculation is incorrect');
    }
    
    return true;
}

// Run validation on import
validateGridConfig();