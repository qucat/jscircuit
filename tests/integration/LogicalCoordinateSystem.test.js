import { expect } from 'chai';
import { CoordinateAdapter } from '../../src/infrastructure/adapters/CoordinateAdapter.js';
import { GridCoordinate } from '../../src/domain/valueObjects/GridCoordinate.js';
import { Position } from '../../src/domain/valueObjects/Position.js';
import { GRID_CONFIG } from '../../src/config/gridConfig.js';

describe('Logical Coordinate System Integration Tests', () => {
    describe('Grid Configuration Integration', () => {
        it('should have consistent configuration with CoordinateAdapter', () => {
            expect(GRID_CONFIG.pixelsPerGridUnit).to.equal(CoordinateAdapter.CONFIG.PIXELS_PER_GRID_UNIT);
            expect(GRID_CONFIG.componentLogicalSpan).to.equal(CoordinateAdapter.CONFIG.V2_COMPONENT_SPAN);
            expect(GRID_CONFIG.v1ComponentSpan).to.equal(CoordinateAdapter.CONFIG.V1_COMPONENT_SPAN);
        });

        it('should use CoordinateAdapter configuration values', () => {
            expect(GRID_CONFIG.pixelsPerGridUnit).to.equal(10);
            expect(GRID_CONFIG.componentLogicalSpan).to.equal(5);
            expect(GRID_CONFIG.componentSpanPixels).to.equal(50); // 5 * 10
        });

        it('should maintain backwards compatibility with legacy spacing', () => {
            expect(GRID_CONFIG.spacing).to.equal(10); // Same as pixelsPerGridUnit
            expect(GRID_CONFIG.legacyComponentGridPoints).to.equal(5); // Old system
        });

        it('should provide working snap functions', () => {
            expect(GRID_CONFIG.snapToGrid(54)).to.equal(50);
            expect(GRID_CONFIG.snapToLogicalGrid(54)).to.equal(5);
            expect(GRID_CONFIG.logicalToPixel(5)).to.equal(50);
        });
    });

    describe('Component Positioning Integration', () => {
        it('should create v2.0 component with correct pixel positions', () => {
            // Create a v2.0 component centered at logical grid (0, 0)
            const center = new GridCoordinate(0, 0);
            const nodes = CoordinateAdapter.createV2ComponentNodes(center, 'horizontal');
            
            // Convert to pixel coordinates for rendering
            const startPixel = CoordinateAdapter.gridToPixel(nodes.start);
            const endPixel = CoordinateAdapter.gridToPixel(nodes.end);
            
            expect(startPixel.x).to.equal(-20); // -2 * 10
            expect(startPixel.y).to.equal(0);
            expect(endPixel.x).to.equal(30);    // 3 * 10
            expect(endPixel.y).to.equal(0);
            
            // Should span 5 logical units = 50 pixels
            expect(endPixel.x - startPixel.x).to.equal(50);
        });

        it('should position components using GRID_CONFIG', () => {
            const centerX = 0;
            const centerY = 0;
            const nodePositions = GRID_CONFIG.calculateNodePositions(centerX, centerY, 0);
            
            // The configuration should create nodes that span the component logical span
            const spanPixels = nodePositions.end.x - nodePositions.start.x;
            expect(spanPixels).to.equal(GRID_CONFIG.componentSpanPixels);
        });

        it('should create components that align to logical grid', () => {
            const centerX = 25; // Off-grid pixel position
            const centerY = 35; // Off-grid pixel position
            const nodePositions = GRID_CONFIG.calculateNodePositions(centerX, centerY, 0);
            
            // Positions should snap to logical grid (every 10 pixels)
            expect(nodePositions.start.x % 10).to.equal(0);
            expect(nodePositions.start.y % 10).to.equal(0);
            expect(nodePositions.end.x % 10).to.equal(0);
            expect(nodePositions.end.y % 10).to.equal(0);
        });
    });

    describe('Format Conversion Integration', () => {
        it('should convert v1.0 circuit to v2.0 format correctly', () => {
            // v1.0 format: Ground at G;0,-2;1,-2;;
            const v1Start = new GridCoordinate(0, -2);
            const v1End = new GridCoordinate(1, -2);
            
            // Convert to v2.0 logical coordinates
            const v2Start = CoordinateAdapter.v1ToV2Grid(v1Start);
            const v2End = CoordinateAdapter.v1ToV2Grid(v1End);
            
            expect(v2Start.x).to.equal(0);    // 0 * 5
            expect(v2Start.y).to.equal(-10);  // -2 * 5
            expect(v2End.x).to.equal(5);      // 1 * 5
            expect(v2End.y).to.equal(-10);    // -2 * 5
            
            // Convert to pixel coordinates for rendering
            const startPixel = CoordinateAdapter.gridToPixel(v2Start);
            const endPixel = CoordinateAdapter.gridToPixel(v2End);
            
            expect(startPixel.x).to.equal(0);
            expect(startPixel.y).to.equal(-100); // -10 * 10
            expect(endPixel.x).to.equal(50);     // 5 * 10
            expect(endPixel.y).to.equal(-100);   // -10 * 10
        });

        it('should detect and convert coordinate formats automatically', () => {
            // v1.0 format detection and conversion
            const v1Coordinates = [
                { x: -5, y: 1 },
                { x: -4, y: 1 },
                { x: 0, y: -2 }
            ];
            
            const detectedFormat = CoordinateAdapter.detectFormat(v1Coordinates);
            expect(detectedFormat).to.equal('v1.0');
            
            // Convert first coordinate
            const v1Coord = new GridCoordinate(v1Coordinates[0].x, v1Coordinates[0].y);
            const v2Coord = CoordinateAdapter.convertCoordinate(v1Coord, 'v1.0', 'v2.0');
            const pixelCoord = CoordinateAdapter.convertCoordinate(v2Coord, 'v2.0', 'pixel');
            
            expect(pixelCoord.x).to.equal(-250); // -5 * 5 * 10
            expect(pixelCoord.y).to.equal(50);   // 1 * 5 * 10
        });

        it('should handle modern pixel format conversion to logical', () => {
            // Current v2.0 pixel format: R;0,0;50,0;3.0e+1;
            const startPixel = new Position(0, 0);
            const endPixel = new Position(50, 0);
            
            // Convert to logical coordinates
            const startLogical = CoordinateAdapter.pixelToGrid(startPixel);
            const endLogical = CoordinateAdapter.pixelToGrid(endPixel);
            
            expect(startLogical.x).to.equal(0);
            expect(startLogical.y).to.equal(0);
            expect(endLogical.x).to.equal(5);
            expect(endLogical.y).to.equal(0);
            
            // Note: This spans 5 units (legacy) vs 6 units (new v2.0)
            // The system should be able to handle this for migration
        });
    });

    describe('Grid Snapping Integration', () => {
        it('should snap mouse coordinates to logical grid', () => {
            // Simulate mouse click at off-grid position
            const mousePixel = new Position(123, 87);
            
            // Snap to grid using CoordinateAdapter
            const snappedPixel = CoordinateAdapter.snapToGrid(mousePixel);
            
            expect(snappedPixel.x).to.equal(120); // 12 * 10
            expect(snappedPixel.y).to.equal(90);  // 9 * 10
            
            // Verify logical coordinates
            const logicalCoord = CoordinateAdapter.pixelToGrid(snappedPixel);
            expect(logicalCoord.x).to.equal(12);
            expect(logicalCoord.y).to.equal(9);
        });

        it('should snap using GRID_CONFIG methods', () => {
            const pixelValue = 123;
            const snappedPixel = GRID_CONFIG.snapToGrid(pixelValue);
            const logicalValue = GRID_CONFIG.snapToLogicalGrid(pixelValue);
            
            expect(snappedPixel).to.equal(120);
            expect(logicalValue).to.equal(12);
            expect(GRID_CONFIG.logicalToPixel(logicalValue)).to.equal(snappedPixel);
        });
    });

    describe('Rendering Coordinate Integration', () => {
        it('should convert logical component to render coordinates', () => {
            // Component stored in logical coordinates
            const logicalStart = new GridCoordinate(-2, 2);
            const logicalEnd = new GridCoordinate(3, 2);
            
            // Valid v2.0 component (spans 5 units)
            expect(CoordinateAdapter.isValidV2Component(logicalStart, logicalEnd)).to.be.true;
            
            // Convert for rendering
            const renderStart = CoordinateAdapter.gridToPixel(logicalStart);
            const renderEnd = CoordinateAdapter.gridToPixel(logicalEnd);
            
            expect(renderStart.x).to.equal(-20); // -2 * 10
            expect(renderStart.y).to.equal(20);  // 2 * 10
            expect(renderEnd.x).to.equal(30);    // 3 * 10
            expect(renderEnd.y).to.equal(20);    // 2 * 10
            
            // Calculate render center and dimensions
            const renderCenter = renderStart.midpoint(renderEnd);
            expect(renderCenter.x).to.equal(5);  // (-20 + 30) / 2 = 5
            expect(renderCenter.y).to.equal(20);
            
            const renderWidth = renderEnd.distanceTo(renderStart);
            expect(renderWidth).to.equal(50); // 5 logical units * 10 pixels
        });

        it('should maintain precision through coordinate transformations', () => {
            // Start with precise pixel coordinates
            const originalPixel = new Position(250.5, 180.3);
            
            // Convert to logical and back
            const logical = CoordinateAdapter.pixelToGrid(originalPixel);
            const backToPixel = CoordinateAdapter.gridToPixel(logical);
            
            // Logical coordinates are integers (rounded)
            expect(logical.x).to.equal(25); // round(250.5/10)
            expect(logical.y).to.equal(18); // round(180.3/10)
            
            // Back to pixel gives exact grid positions
            expect(backToPixel.x).to.equal(250);
            expect(backToPixel.y).to.equal(180);
            
            // Some precision is lost, but this is expected for grid alignment
            expect(Math.abs(backToPixel.x - originalPixel.x)).to.be.lessThan(10);
            expect(Math.abs(backToPixel.y - originalPixel.y)).to.be.lessThan(10);
        });
    });

    describe('Component Scaling Integration', () => {
        it('should scale components from v1.0 to v2.0 correctly', () => {
            // v1.0 component spans 1 logical unit (from 0 to 1)
            const v1Center = new GridCoordinate(0, 0);
            const v1Nodes = CoordinateAdapter.createV1ComponentNodes(v1Center, 'horizontal');
            
            expect(v1Nodes.start.x).to.equal(0);
            expect(v1Nodes.end.x).to.equal(1);
            expect(CoordinateAdapter.isValidV1Component(v1Nodes.start, v1Nodes.end)).to.be.true;
            
            // Scale to v2.0 (5x scaling)
            const v2Start = CoordinateAdapter.v1ToV2Grid(v1Nodes.start);
            const v2End = CoordinateAdapter.v1ToV2Grid(v1Nodes.end);
            
            expect(v2Start.x).to.equal(0);
            expect(v2End.x).to.equal(5);
            expect(CoordinateAdapter.isValidV2Component(v2Start, v2End)).to.be.true;
            
            // Pixel representation
            const pixelStart = CoordinateAdapter.gridToPixel(v2Start);
            const pixelEnd = CoordinateAdapter.gridToPixel(v2End);
            
            expect(pixelEnd.x - pixelStart.x).to.equal(50); // v2.0 component spans 50 pixels (5 intervals * 10px)
        });

        it('should maintain component proportions during scaling', () => {
            const components = [
                { v1Start: new GridCoordinate(0, 0), v1End: new GridCoordinate(1, 0) },    // Horizontal, span 1
                { v1Start: new GridCoordinate(2, 0), v1End: new GridCoordinate(2, 1) },    // Vertical, span 1
                { v1Start: new GridCoordinate(-3, 5), v1End: new GridCoordinate(-2, 5) }   // Horizontal, span 1
            ];
            
            components.forEach((comp, index) => {
                // Verify v1.0 component (should span exactly 1 unit)
                expect(CoordinateAdapter.isValidV1Component(comp.v1Start, comp.v1End)).to.be.true;
                
                // Scale to v2.0
                const v2Start = CoordinateAdapter.v1ToV2Grid(comp.v1Start);
                const v2End = CoordinateAdapter.v1ToV2Grid(comp.v1End);
                
                // Verify v2.0 component (should span exactly 5 units)
                expect(CoordinateAdapter.isValidV2Component(v2Start, v2End)).to.be.true;
                
                // Check scaling factor (v1 span 1 → v2 span 5)
                const v1Span = comp.v1Start.distanceTo(comp.v1End);
                const v2Span = v2Start.distanceTo(v2End);
                expect(v2Span).to.equal(v1Span * 5); // 5x scaling factor
            });
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('should handle extreme coordinate values', () => {
            const extremeGrid = new GridCoordinate(999, -999);
            const pixelPos = CoordinateAdapter.gridToPixel(extremeGrid);
            const backToGrid = CoordinateAdapter.pixelToGrid(pixelPos);
            
            expect(backToGrid.equals(extremeGrid)).to.be.true;
        });

        it('should handle fractional pixel coordinates gracefully', () => {
            const fractionalPixel = new Position(15.7, 23.2);
            const gridCoord = CoordinateAdapter.pixelToGrid(fractionalPixel);
            const snappedPixel = CoordinateAdapter.gridToPixel(gridCoord);
            
            expect(gridCoord.x).to.equal(2); // round(15.7/10)
            expect(gridCoord.y).to.equal(2); // round(23.2/10)
            expect(snappedPixel.x).to.equal(20);
            expect(snappedPixel.y).to.equal(20);
        });

        it('should validate coordinate system integrity', () => {
            // Test multiple round-trip conversions
            const testCoordinates = [
                new GridCoordinate(0, 0),
                new GridCoordinate(-5, 3),
                new GridCoordinate(10, -7),
                new GridCoordinate(-100, 50)
            ];
            
            testCoordinates.forEach(original => {
                const pixel = CoordinateAdapter.gridToPixel(original);
                const backToGrid = CoordinateAdapter.pixelToGrid(pixel);
                expect(backToGrid.equals(original)).to.be.true;
            });
        });
    });
});