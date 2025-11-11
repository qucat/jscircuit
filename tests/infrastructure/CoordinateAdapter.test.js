import { expect } from 'chai';
import { CoordinateAdapter } from '../../src/infrastructure/adapters/CoordinateAdapter.js';
import { GridCoordinate } from '../../src/domain/valueObjects/GridCoordinate.js';
import { Position } from '../../src/domain/valueObjects/Position.js';

describe('CoordinateAdapter Tests', () => {
    describe('Configuration Constants', () => {
        it('should have correct configuration values', () => {
            expect(CoordinateAdapter.CONFIG.PIXELS_PER_GRID_UNIT).to.equal(10);
            expect(CoordinateAdapter.CONFIG.V1_COMPONENT_SPAN).to.equal(1);
            expect(CoordinateAdapter.CONFIG.V2_COMPONENT_SPAN).to.equal(5);
            expect(CoordinateAdapter.CONFIG.SCALING_FACTOR).to.equal(5);
        });

        it('should maintain correct scaling relationship', () => {
            const expectedScaling = CoordinateAdapter.CONFIG.V2_COMPONENT_SPAN / CoordinateAdapter.CONFIG.V1_COMPONENT_SPAN;
            expect(CoordinateAdapter.CONFIG.SCALING_FACTOR).to.equal(expectedScaling);
        });
    });

    describe('gridToPixel', () => {
        it('should convert positive grid coordinates to pixels', () => {
            const gridCoord = new GridCoordinate(5, 3);
            const pixelPos = CoordinateAdapter.gridToPixel(gridCoord);
            expect(pixelPos.x).to.equal(50); // 5 * 10
            expect(pixelPos.y).to.equal(30); // 3 * 10
        });

        it('should convert negative grid coordinates to pixels', () => {
            const gridCoord = new GridCoordinate(-3, -7);
            const pixelPos = CoordinateAdapter.gridToPixel(gridCoord);
            expect(pixelPos.x).to.equal(-30); // -3 * 10
            expect(pixelPos.y).to.equal(-70); // -7 * 10
        });

        it('should handle zero coordinates', () => {
            const gridCoord = new GridCoordinate(0, 0);
            const pixelPos = CoordinateAdapter.gridToPixel(gridCoord);
            expect(pixelPos.x).to.equal(0);
            expect(pixelPos.y).to.equal(0);
        });

        it('should return Position instance', () => {
            const gridCoord = new GridCoordinate(1, 2);
            const pixelPos = CoordinateAdapter.gridToPixel(gridCoord);
            expect(pixelPos).to.be.instanceOf(Position);
        });
    });

    describe('pixelToGrid', () => {
        it('should convert positive pixel coordinates to grid', () => {
            const pixelPos = new Position(50, 30);
            const gridCoord = CoordinateAdapter.pixelToGrid(pixelPos);
            expect(gridCoord.x).to.equal(5); // 50 / 10
            expect(gridCoord.y).to.equal(3); // 30 / 10
        });

        it('should convert negative pixel coordinates to grid', () => {
            const pixelPos = new Position(-30, -70);
            const gridCoord = CoordinateAdapter.pixelToGrid(pixelPos);
            expect(gridCoord.x).to.equal(-3); // -30 / 10
            expect(gridCoord.y).to.equal(-7); // -70 / 10
        });

        it('should round fractional pixel coordinates to nearest grid', () => {
            const pixelPos = new Position(54, 36); // 5.4 and 3.6 grid units
            const gridCoord = CoordinateAdapter.pixelToGrid(pixelPos);
            expect(gridCoord.x).to.equal(5); // rounds down from 5.4
            expect(gridCoord.y).to.equal(4); // rounds up from 3.6
        });

        it('should handle coordinates exactly between grid points', () => {
            const pixelPos = new Position(55, 35); // 5.5 and 3.5 grid units
            const gridCoord = CoordinateAdapter.pixelToGrid(pixelPos);
            expect(gridCoord.x).to.equal(6); // rounds up from 5.5
            expect(gridCoord.y).to.equal(4); // rounds up from 3.5
        });

        it('should return GridCoordinate instance', () => {
            const pixelPos = new Position(10, 20);
            const gridCoord = CoordinateAdapter.pixelToGrid(pixelPos);
            expect(gridCoord).to.be.instanceOf(GridCoordinate);
        });
    });

    describe('Bidirectional Conversion', () => {
        it('should maintain consistency in grid-to-pixel-to-grid conversion', () => {
            const originalGrid = new GridCoordinate(5, -3);
            const pixelPos = CoordinateAdapter.gridToPixel(originalGrid);
            const backToGrid = CoordinateAdapter.pixelToGrid(pixelPos);
            expect(backToGrid.equals(originalGrid)).to.be.true;
        });

        it('should maintain consistency for zero coordinates', () => {
            const originalGrid = new GridCoordinate(0, 0);
            const pixelPos = CoordinateAdapter.gridToPixel(originalGrid);
            const backToGrid = CoordinateAdapter.pixelToGrid(pixelPos);
            expect(backToGrid.equals(originalGrid)).to.be.true;
        });
    });

    describe('v1ToV2Grid', () => {
        it('should scale v1.0 coordinates to v2.0 correctly', () => {
            const v1Coord = new GridCoordinate(-1, 0);
            const v2Coord = CoordinateAdapter.v1ToV2Grid(v1Coord);
            expect(v2Coord.x).to.equal(-5); // -1 * 5
            expect(v2Coord.y).to.equal(0);  // 0 * 5
        });

        it('should handle positive v1.0 coordinates', () => {
            const v1Coord = new GridCoordinate(2, 3);
            const v2Coord = CoordinateAdapter.v1ToV2Grid(v1Coord);
            expect(v2Coord.x).to.equal(10); // 2 * 5
            expect(v2Coord.y).to.equal(15); // 3 * 5
        });

        it('should handle zero v1.0 coordinates', () => {
            const v1Coord = new GridCoordinate(0, 0);
            const v2Coord = CoordinateAdapter.v1ToV2Grid(v1Coord);
            expect(v2Coord.x).to.equal(0);
            expect(v2Coord.y).to.equal(0);
        });

        it('should return GridCoordinate instance', () => {
            const v1Coord = new GridCoordinate(1, 2);
            const v2Coord = CoordinateAdapter.v1ToV2Grid(v1Coord);
            expect(v2Coord).to.be.instanceOf(GridCoordinate);
        });
    });

    describe('v2ToV1Grid', () => {
        it('should scale v2.0 coordinates to v1.0 correctly', () => {
            const v2Coord = new GridCoordinate(-5, 0);
            const v1Coord = CoordinateAdapter.v2ToV1Grid(v2Coord);
            expect(v1Coord.x).to.equal(-1); // round(-5 / 5)
            expect(v1Coord.y).to.equal(0);  // round(0 / 5)
        });

        it('should handle positive v2.0 coordinates', () => {
            const v2Coord = new GridCoordinate(10, 15);
            const v1Coord = CoordinateAdapter.v2ToV1Grid(v2Coord);
            expect(v1Coord.x).to.equal(2); // round(10 / 5)
            expect(v1Coord.y).to.equal(3); // round(15 / 5)
        });

        it('should round fractional results to nearest integer', () => {
            const v2Coord = new GridCoordinate(7, 8); // 7/5=1.4, 8/5=1.6
            const v1Coord = CoordinateAdapter.v2ToV1Grid(v2Coord);
            expect(v1Coord.x).to.equal(1); // round(1.4)
            expect(v1Coord.y).to.equal(2); // round(1.6)
        });

        it('should return GridCoordinate instance', () => {
            const v2Coord = new GridCoordinate(3, 6);
            const v1Coord = CoordinateAdapter.v2ToV1Grid(v2Coord);
            expect(v1Coord).to.be.instanceOf(GridCoordinate);
        });
    });

    describe('Version Conversion Round-trip', () => {
        it('should maintain consistency in v1-to-v2-to-v1 conversion', () => {
            const originalV1 = new GridCoordinate(-2, 1);
            const v2Coord = CoordinateAdapter.v1ToV2Grid(originalV1);
            const backToV1 = CoordinateAdapter.v2ToV1Grid(v2Coord);
            expect(backToV1.equals(originalV1)).to.be.true;
        });

        it('should handle zero coordinates in round-trip', () => {
            const originalV1 = new GridCoordinate(0, 0);
            const v2Coord = CoordinateAdapter.v1ToV2Grid(originalV1);
            const backToV1 = CoordinateAdapter.v2ToV1Grid(v2Coord);
            expect(backToV1.equals(originalV1)).to.be.true;
        });
    });

    describe('snapToGrid', () => {
        it('should snap pixel coordinates to nearest grid position', () => {
            const pixelPos = new Position(54, 36);
            const snapped = CoordinateAdapter.snapToGrid(pixelPos);
            expect(snapped.x).to.equal(50); // nearest grid at x=5, pixel=50
            expect(snapped.y).to.equal(40); // nearest grid at y=4, pixel=40
        });

        it('should handle coordinates already on grid', () => {
            const pixelPos = new Position(50, 30);
            const snapped = CoordinateAdapter.snapToGrid(pixelPos);
            expect(snapped.x).to.equal(50);
            expect(snapped.y).to.equal(30);
        });

        it('should handle negative coordinates', () => {
            const pixelPos = new Position(-34, -76);
            const snapped = CoordinateAdapter.snapToGrid(pixelPos);
            expect(snapped.x).to.equal(-30); // nearest grid at x=-3, pixel=-30
            expect(snapped.y).to.equal(-80); // nearest grid at y=-8, pixel=-80
        });

        it('should return Position instance', () => {
            const pixelPos = new Position(15, 25);
            const snapped = CoordinateAdapter.snapToGrid(pixelPos);
            expect(snapped).to.be.instanceOf(Position);
        });
    });

    describe('Component Validation', () => {
        describe('isValidV2Component', () => {
            it('should validate horizontal v2.0 component (5 units span)', () => {
                const start = new GridCoordinate(-2, 0); // -2 to +3 = 5 units span
                const end = new GridCoordinate(3, 0);
                expect(CoordinateAdapter.isValidV2Component(start, end)).to.be.true;
            });

            it('should validate vertical v2.0 component (5 units span)', () => {
                const start = new GridCoordinate(0, -2); // -2 to +3 = 5 units span
                const end = new GridCoordinate(0, 3);
                expect(CoordinateAdapter.isValidV2Component(start, end)).to.be.true;
            });

            it('should reject incorrect span length', () => {
                const start = new GridCoordinate(-2, 0);
                const end = new GridCoordinate(2, 0); // 4 units span, should be 6
                expect(CoordinateAdapter.isValidV2Component(start, end)).to.be.false;
            });

            it('should reject diagonal components', () => {
                const start = new GridCoordinate(0, 0);
                const end = new GridCoordinate(3, 3); // diagonal
                expect(CoordinateAdapter.isValidV2Component(start, end)).to.be.false;
            });

            it('should handle order independence', () => {
                const start = new GridCoordinate(3, 0);
                const end = new GridCoordinate(-2, 0); // 5 units span
                expect(CoordinateAdapter.isValidV2Component(start, end)).to.be.true;
            });
        });

        describe('isValidV1Component', () => {
            it('should validate horizontal v1.0 component (1 units span)', () => {
                const start = new GridCoordinate(0, 0);
                const end = new GridCoordinate(1, 0);
                expect(CoordinateAdapter.isValidV1Component(start, end)).to.be.true;
            });

            it('should validate vertical v1.0 component (1 units span)', () => {
                const start = new GridCoordinate(0, 0);
                const end = new GridCoordinate(0, 1);
                expect(CoordinateAdapter.isValidV1Component(start, end)).to.be.true;
            });

            it('should reject incorrect span length', () => {
                const start = new GridCoordinate(-2, 0);
                const end = new GridCoordinate(3, 0); // 5 units span, should be 1
                expect(CoordinateAdapter.isValidV1Component(start, end)).to.be.false;
            });

            it('should handle order independence', () => {
                const start = new GridCoordinate(1, 0);
                const end = new GridCoordinate(0, 0);
                expect(CoordinateAdapter.isValidV1Component(start, end)).to.be.true;
            });
        });
    });

    describe('Component Node Creation', () => {
        describe('createV2ComponentNodes', () => {
            it('should create horizontal v2.0 component nodes', () => {
                const center = new GridCoordinate(0, 5);
                const nodes = CoordinateAdapter.createV2ComponentNodes(center, 'horizontal');
                expect(nodes.start.x).to.equal(-2); // 0 + (-2)
                expect(nodes.start.y).to.equal(5);
                expect(nodes.end.x).to.equal(3);    // 0 + 3
                expect(nodes.end.y).to.equal(5);
            });

            it('should create vertical v2.0 component nodes', () => {
                const center = new GridCoordinate(2, 0);
                const nodes = CoordinateAdapter.createV2ComponentNodes(center, 'vertical');
                expect(nodes.start.x).to.equal(2);
                expect(nodes.start.y).to.equal(-2); // 0 + (-2)
                expect(nodes.end.x).to.equal(2);
                expect(nodes.end.y).to.equal(3);    // 0 + 3
            });

            it('should default to horizontal orientation', () => {
                const center = new GridCoordinate(0, 0);
                const nodes = CoordinateAdapter.createV2ComponentNodes(center);
                expect(nodes.start.x).to.equal(-2); // 0 + (-2)
                expect(nodes.end.x).to.equal(3);    // 0 + 3
                expect(nodes.start.y).to.equal(0);
                expect(nodes.end.y).to.equal(0);
            });

            it('should create valid v2.0 components', () => {
                const center = new GridCoordinate(1, 2);
                const nodes = CoordinateAdapter.createV2ComponentNodes(center, 'horizontal');
                expect(CoordinateAdapter.isValidV2Component(nodes.start, nodes.end)).to.be.true;
            });
        });

        describe('createV1ComponentNodes', () => {
            it('should create horizontal v1.0 component nodes', () => {
                const center = new GridCoordinate(0, 2);
                const nodes = CoordinateAdapter.createV1ComponentNodes(center, 'horizontal');
                expect(nodes.start.x).to.equal(0); // center
                expect(nodes.start.y).to.equal(2);
                expect(nodes.end.x).to.equal(1);   // center + 1 (1 unit span)
                expect(nodes.end.y).to.equal(2);
            });

            it('should create vertical v1.0 component nodes', () => {
                const center = new GridCoordinate(3, 0);
                const nodes = CoordinateAdapter.createV1ComponentNodes(center, 'vertical');
                expect(nodes.start.x).to.equal(3);
                expect(nodes.start.y).to.equal(0); // center
                expect(nodes.end.x).to.equal(3);
                expect(nodes.end.y).to.equal(1);   // center + 1 (1 unit span)
            });

            it('should create valid v1.0 components', () => {
                const center = new GridCoordinate(1, 2);
                const nodes = CoordinateAdapter.createV1ComponentNodes(center, 'vertical');
                expect(CoordinateAdapter.isValidV1Component(nodes.start, nodes.end)).to.be.true;
            });
        });
    });

    describe('detectFormat', () => {
        it('should detect v1.0 format for small coordinates', () => {
            const coordinates = [
                { x: -5, y: 1 },
                { x: -4, y: 1 },
                { x: 0, y: 2 }
            ];
            expect(CoordinateAdapter.detectFormat(coordinates)).to.equal('v1.0');
        });

        it('should detect v2.0 format for large coordinates', () => {
            const coordinates = [
                { x: 100, y: 110 },
                { x: 160, y: 110 },
                { x: 50, y: 200 }
            ];
            expect(CoordinateAdapter.detectFormat(coordinates)).to.equal('v2.0');
        });

        it('should handle edge case at boundary (20)', () => {
            const coordinates = [{ x: 20, y: 20 }];
            expect(CoordinateAdapter.detectFormat(coordinates)).to.equal('v1.0');
            
            const coordinates2 = [{ x: 21, y: 15 }];
            expect(CoordinateAdapter.detectFormat(coordinates2)).to.equal('v2.0');
        });

        it('should use maximum absolute coordinate for detection', () => {
            const coordinates = [
                { x: 5, y: 3 },
                { x: -25, y: 8 } // -25 has largest absolute value
            ];
            expect(CoordinateAdapter.detectFormat(coordinates)).to.equal('v2.0');
        });
    });

    describe('convertCoordinate', () => {
        it('should return same coordinate for identical formats', () => {
            const coord = new GridCoordinate(5, 3);
            const converted = CoordinateAdapter.convertCoordinate(coord, 'logical', 'logical');
            expect(converted.equals(coord)).to.be.true;
        });

        it('should convert from pixel to logical', () => {
            const pixelPos = new Position(50, -30);
            const logical = CoordinateAdapter.convertCoordinate(pixelPos, 'pixel', 'logical');
            expect(logical.x).to.equal(5);
            expect(logical.y).to.equal(-3);
        });

        it('should convert from logical to pixel', () => {
            const logical = new GridCoordinate(-2, 4);
            const pixel = CoordinateAdapter.convertCoordinate(logical, 'logical', 'pixel');
            expect(pixel.x).to.equal(-20);
            expect(pixel.y).to.equal(40);
        });

        it('should convert from v1.0 to v2.0', () => {
            const v1Coord = new GridCoordinate(-1, 2);
            const v2Coord = CoordinateAdapter.convertCoordinate(v1Coord, 'v1.0', 'v2.0');
            expect(v2Coord.x).to.equal(-5); // -1 * 5
            expect(v2Coord.y).to.equal(10); // 2 * 5
        });

        it('should convert from v2.0 to v1.0', () => {
            const v2Coord = new GridCoordinate(-5, 10);
            const v1Coord = CoordinateAdapter.convertCoordinate(v2Coord, 'v2.0', 'v1.0');
            expect(v1Coord.x).to.equal(-1); // round(-5 / 5)
            expect(v1Coord.y).to.equal(2);  // round(10 / 5)
        });

        it('should handle complex conversion chain (pixel -> v1.0)', () => {
            const pixelPos = new Position(30, -60);
            const v1Coord = CoordinateAdapter.convertCoordinate(pixelPos, 'pixel', 'v1.0');
            expect(v1Coord.x).to.equal(1);  // 30 pixels -> 3 logical -> 0.6 v1.0 -> round(1)
            expect(v1Coord.y).to.equal(-1); // -60 pixels -> -6 logical -> -1.2 v1.0 -> round(-1)
        });

        it('should throw error for unsupported source format', () => {
            const coord = new GridCoordinate(1, 2);
            expect(() => {
                CoordinateAdapter.convertCoordinate(coord, 'invalid', 'logical');
            }).to.throw('Unsupported source format: invalid');
        });

        it('should throw error for unsupported target format', () => {
            const coord = new GridCoordinate(1, 2);
            expect(() => {
                CoordinateAdapter.convertCoordinate(coord, 'logical', 'invalid');
            }).to.throw('Unsupported target format: invalid');
        });
    });

    describe('QuCat Format Compatibility Tests', () => {
        it('should handle v1.0 Ground example: G;0,-2;1,-2;;', () => {
            const start = new GridCoordinate(0, -2);
            const end = new GridCoordinate(1, -2);
            expect(CoordinateAdapter.isValidV1Component(start, end)).to.be.true; // Ground spans 1 unit correctly
            
            // Convert to v2.0 format
            const v2Start = CoordinateAdapter.v1ToV2Grid(start);
            const v2End = CoordinateAdapter.v1ToV2Grid(end);
            expect(v2Start.x).to.equal(0);
            expect(v2Start.y).to.equal(-10); // -2 * 5
            expect(v2End.x).to.equal(5);     // 1 * 5
            expect(v2End.y).to.equal(-10);   // -2 * 5
        });

        it('should handle v1.0 Resistor example: R;-5,1;-4,1;1.0e+00;', () => {
            const start = new GridCoordinate(-5, 1);
            const end = new GridCoordinate(-4, 1);
            expect(CoordinateAdapter.isValidV1Component(start, end)).to.be.true; // Spans 1 unit correctly
            
            // Convert to v2.0 format
            const v2Start = CoordinateAdapter.v1ToV2Grid(start);
            const v2End = CoordinateAdapter.v1ToV2Grid(end);
            expect(v2Start.x).to.equal(-25); // -5 * 5
            expect(v2Start.y).to.equal(5);   // 1 * 5
            expect(v2End.x).to.equal(-20);   // -4 * 5
            expect(v2End.y).to.equal(5);     // 1 * 5
        });

        it('should handle v2.0 pixel format: R;0,0;50,0;3.0e+1;', () => {
            const startPixel = new Position(0, 0);
            const endPixel = new Position(50, 0);
            
            // Convert to logical coordinates
            const startLogical = CoordinateAdapter.pixelToGrid(startPixel);
            const endLogical = CoordinateAdapter.pixelToGrid(endPixel);
            
            expect(startLogical.x).to.equal(0);
            expect(startLogical.y).to.equal(0);
            expect(endLogical.x).to.equal(5);
            expect(endLogical.y).to.equal(0);
            
            // Should be a valid v2.0 component (spans 5 units correctly)
            expect(CoordinateAdapter.isValidV2Component(startLogical, endLogical)).to.be.true;
        });
    });
});