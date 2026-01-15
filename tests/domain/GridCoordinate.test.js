import { expect } from 'chai';
import { GridCoordinate } from '../../src/domain/valueObjects/GridCoordinate.js';

describe('GridCoordinate Class Tests', () => {
    describe('Constructor', () => {
        it('should create a valid GridCoordinate with integer values', () => {
            const coord = new GridCoordinate(5, -3);
            expect(coord.x).to.equal(5);
            expect(coord.y).to.equal(-3);
        });

        it('should throw error for non-integer x coordinate', () => {
            expect(() => new GridCoordinate(5.5, 3)).to.throw('GridCoordinate requires integer values');
        });

        it('should throw error for non-integer y coordinate', () => {
            expect(() => new GridCoordinate(5, 3.7)).to.throw('GridCoordinate requires integer values');
        });

        it('should throw error for non-number coordinates', () => {
            expect(() => new GridCoordinate('5', 3)).to.throw('GridCoordinate requires integer values');
            expect(() => new GridCoordinate(5, null)).to.throw('GridCoordinate requires integer values');
        });

        it('should handle zero coordinates', () => {
            const coord = new GridCoordinate(0, 0);
            expect(coord.x).to.equal(0);
            expect(coord.y).to.equal(0);
        });

        it('should handle negative coordinates', () => {
            const coord = new GridCoordinate(-10, -20);
            expect(coord.x).to.equal(-10);
            expect(coord.y).to.equal(-20);
        });
    });

    describe('equals', () => {
        it('should return true for identical coordinates', () => {
            const coord1 = new GridCoordinate(5, 10);
            const coord2 = new GridCoordinate(5, 10);
            expect(coord1.equals(coord2)).to.be.true;
        });

        it('should return false for different coordinates', () => {
            const coord1 = new GridCoordinate(5, 10);
            const coord2 = new GridCoordinate(5, 11);
            expect(coord1.equals(coord2)).to.be.false;

            const coord3 = new GridCoordinate(6, 10);
            expect(coord1.equals(coord3)).to.be.false;
        });

        it('should return false for negative coordinate differences', () => {
            const coord1 = new GridCoordinate(-5, -10);
            const coord2 = new GridCoordinate(5, 10);
            expect(coord1.equals(coord2)).to.be.false;
        });
    });

    describe('toString', () => {
        it('should format positive coordinates correctly', () => {
            const coord = new GridCoordinate(5, 10);
            expect(coord.toString()).to.equal('5,10');
        });

        it('should format negative coordinates correctly', () => {
            const coord = new GridCoordinate(-5, -10);
            expect(coord.toString()).to.equal('-5,-10');
        });

        it('should format mixed coordinates correctly', () => {
            const coord = new GridCoordinate(-5, 10);
            expect(coord.toString()).to.equal('-5,10');
        });

        it('should format zero coordinates correctly', () => {
            const coord = new GridCoordinate(0, 0);
            expect(coord.toString()).to.equal('0,0');
        });
    });

    describe('fromString', () => {
        it('should parse positive coordinates correctly', () => {
            const coord = GridCoordinate.fromString('5,10');
            expect(coord.x).to.equal(5);
            expect(coord.y).to.equal(10);
        });

        it('should parse negative coordinates correctly', () => {
            const coord = GridCoordinate.fromString('-5,-10');
            expect(coord.x).to.equal(-5);
            expect(coord.y).to.equal(-10);
        });

        it('should parse mixed coordinates correctly', () => {
            const coord = GridCoordinate.fromString('-5,10');
            expect(coord.x).to.equal(-5);
            expect(coord.y).to.equal(10);
        });

        it('should handle whitespace around coordinates', () => {
            const coord = GridCoordinate.fromString(' -5 , 10 ');
            expect(coord.x).to.equal(-5);
            expect(coord.y).to.equal(10);
        });

        it('should handle zero coordinates', () => {
            const coord = GridCoordinate.fromString('0,0');
            expect(coord.x).to.equal(0);
            expect(coord.y).to.equal(0);
        });
    });

    describe('scale', () => {
        it('should scale positive coordinates correctly', () => {
            const coord = new GridCoordinate(2, 4);
            const scaled = coord.scale(3);
            expect(scaled.x).to.equal(6);
            expect(scaled.y).to.equal(12);
        });

        it('should scale negative coordinates correctly', () => {
            const coord = new GridCoordinate(-2, -4);
            const scaled = coord.scale(3);
            expect(scaled.x).to.equal(-6);
            expect(scaled.y).to.equal(-12);
        });

        it('should scale with fractional factor and round results', () => {
            const coord = new GridCoordinate(6, 9);
            const scaled = coord.scale(0.5);
            expect(scaled.x).to.equal(3);  // round(6 * 0.5) = round(3.0) = 3
            expect(scaled.y).to.equal(5);  // round(9 * 0.5) = round(4.5) = 5
        });

        it('should handle zero scaling', () => {
            const coord = new GridCoordinate(5, 10);
            const scaled = coord.scale(0);
            expect(scaled.x).to.equal(0);
            expect(scaled.y).to.equal(0);
        });

        it('should not modify original coordinate', () => {
            const coord = new GridCoordinate(2, 4);
            const scaled = coord.scale(3);
            expect(coord.x).to.equal(2);
            expect(coord.y).to.equal(4);
        });
    });

    describe('add', () => {
        it('should add coordinates correctly', () => {
            const coord1 = new GridCoordinate(3, 5);
            const coord2 = new GridCoordinate(2, -1);
            const result = coord1.add(coord2);
            expect(result.x).to.equal(5);
            expect(result.y).to.equal(4);
        });

        it('should handle negative addition', () => {
            const coord1 = new GridCoordinate(-3, -5);
            const coord2 = new GridCoordinate(-2, 1);
            const result = coord1.add(coord2);
            expect(result.x).to.equal(-5);
            expect(result.y).to.equal(-4);
        });

        it('should not modify original coordinates', () => {
            const coord1 = new GridCoordinate(3, 5);
            const coord2 = new GridCoordinate(2, -1);
            coord1.add(coord2);
            expect(coord1.x).to.equal(3);
            expect(coord1.y).to.equal(5);
        });
    });

    describe('subtract', () => {
        it('should subtract coordinates correctly', () => {
            const coord1 = new GridCoordinate(5, 8);
            const coord2 = new GridCoordinate(3, 2);
            const result = coord1.subtract(coord2);
            expect(result.x).to.equal(2);
            expect(result.y).to.equal(6);
        });

        it('should handle negative subtraction', () => {
            const coord1 = new GridCoordinate(3, 2);
            const coord2 = new GridCoordinate(5, 8);
            const result = coord1.subtract(coord2);
            expect(result.x).to.equal(-2);
            expect(result.y).to.equal(-6);
        });

        it('should not modify original coordinates', () => {
            const coord1 = new GridCoordinate(5, 8);
            const coord2 = new GridCoordinate(3, 2);
            coord1.subtract(coord2);
            expect(coord1.x).to.equal(5);
            expect(coord1.y).to.equal(8);
        });
    });

    describe('distanceTo', () => {
        it('should calculate Manhattan distance correctly', () => {
            const coord1 = new GridCoordinate(0, 0);
            const coord2 = new GridCoordinate(3, 4);
            const distance = coord1.distanceTo(coord2);
            expect(distance).to.equal(7); // |3-0| + |4-0| = 7
        });

        it('should handle negative coordinates', () => {
            const coord1 = new GridCoordinate(-2, -3);
            const coord2 = new GridCoordinate(1, 2);
            const distance = coord1.distanceTo(coord2);
            expect(distance).to.equal(8); // |1-(-2)| + |2-(-3)| = 3 + 5 = 8
        });

        it('should return zero for identical coordinates', () => {
            const coord1 = new GridCoordinate(5, 10);
            const coord2 = new GridCoordinate(5, 10);
            const distance = coord1.distanceTo(coord2);
            expect(distance).to.equal(0);
        });

        it('should be symmetric', () => {
            const coord1 = new GridCoordinate(2, 3);
            const coord2 = new GridCoordinate(5, 7);
            expect(coord1.distanceTo(coord2)).to.equal(coord2.distanceTo(coord1));
        });
    });

    describe('QuCat v1.0/v2.0 Coordinate System Tests', () => {
        it('should support v1.0 coordinate ranges (-10 to 10)', () => {
            const coord1 = new GridCoordinate(-5, 1);
            const coord2 = new GridCoordinate(-4, 1);
            expect(coord1.x).to.equal(-5);
            expect(coord2.x).to.equal(-4);
        });

        it('should support v2.0 coordinate scaling (3x factor)', () => {
            const v1Coord = new GridCoordinate(-1, 0);
            const v2Coord = v1Coord.scale(3);
            expect(v2Coord.x).to.equal(-3);
            expect(v2Coord.y).to.equal(0);
        });

        it('should maintain coordinate integrity through scaling', () => {
            const originalCoord = new GridCoordinate(2, -1);
            const scaled = originalCoord.scale(3);
            const scaledBack = new GridCoordinate(
                Math.round(scaled.x / 3),
                Math.round(scaled.y / 3)
            );
            expect(scaledBack.equals(originalCoord)).to.be.true;
        });
    });
});