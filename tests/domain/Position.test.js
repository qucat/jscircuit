import { expect } from 'chai';
import { Position } from '../../src/domain/valueObjects/Position.js';

describe('Position Class Tests', () => {
    describe('Constructor', () => {
        it('should create a valid Position with numeric values', () => {
            const pos = new Position(5.5, -3.2);
            expect(pos.x).to.equal(5.5);
            expect(pos.y).to.equal(-3.2);
        });

        it('should handle integer values', () => {
            const pos = new Position(10, -20);
            expect(pos.x).to.equal(10);
            expect(pos.y).to.equal(-20);
        });

        it('should handle zero coordinates', () => {
            const pos = new Position(0, 0);
            expect(pos.x).to.equal(0);
            expect(pos.y).to.equal(0);
        });

        it('should throw error for non-numeric x coordinate', () => {
            expect(() => new Position('5', 3)).to.throw('Position requires numeric coordinates');
            expect(() => new Position(null, 3)).to.throw('Position requires numeric coordinates');
            expect(() => new Position(undefined, 3)).to.throw('Position requires numeric coordinates');
        });

        it('should throw error for non-numeric y coordinate', () => {
            expect(() => new Position(5, '3')).to.throw('Position requires numeric coordinates');
            expect(() => new Position(5, null)).to.throw('Position requires numeric coordinates');
            expect(() => new Position(5, undefined)).to.throw('Position requires numeric coordinates');
        });

        it('should throw error for infinite coordinates', () => {
            expect(() => new Position(Infinity, 3)).to.throw('Position coordinates must be finite numbers');
            expect(() => new Position(5, -Infinity)).to.throw('Position coordinates must be finite numbers');
            expect(() => new Position(NaN, 3)).to.throw('Position coordinates must be finite numbers');
        });
    });

    describe('equals', () => {
        it('should return true for identical coordinates', () => {
            const pos1 = new Position(5.5, 10.2);
            const pos2 = new Position(5.5, 10.2);
            expect(pos1.equals(pos2)).to.be.true;
        });

        it('should return false for different coordinates', () => {
            const pos1 = new Position(5.5, 10.2);
            const pos2 = new Position(5.5, 10.3);
            expect(pos1.equals(pos2)).to.be.false;

            const pos3 = new Position(5.6, 10.2);
            expect(pos1.equals(pos3)).to.be.false;
        });

        it('should return false for non-Position objects', () => {
            const pos = new Position(5, 10);
            expect(pos.equals({ x: 5, y: 10 })).to.be.false;
            expect(pos.equals(null)).to.be.false;
            expect(pos.equals('5,10')).to.be.false;
        });

        it('should support tolerance for floating-point comparison', () => {
            const pos1 = new Position(5.001, 10.001);
            const pos2 = new Position(5.002, 10.002);
            expect(pos1.equals(pos2, 0.01)).to.be.true;
            expect(pos1.equals(pos2, 0.0001)).to.be.false;
        });

        it('should handle zero tolerance correctly', () => {
            const pos1 = new Position(5.001, 10.001);
            const pos2 = new Position(5.002, 10.002);
            expect(pos1.equals(pos2, 0)).to.be.false;
            expect(pos1.equals(pos2)).to.be.false; // Default tolerance is 0
        });
    });

    describe('toString', () => {
        it('should format positive coordinates correctly', () => {
            const pos = new Position(5.5, 10.2);
            expect(pos.toString()).to.equal('5.5,10.2');
        });

        it('should format negative coordinates correctly', () => {
            const pos = new Position(-5.5, -10.2);
            expect(pos.toString()).to.equal('-5.5,-10.2');
        });

        it('should format integer coordinates correctly', () => {
            const pos = new Position(5, 10);
            expect(pos.toString()).to.equal('5,10');
        });

        it('should format zero coordinates correctly', () => {
            const pos = new Position(0, 0);
            expect(pos.toString()).to.equal('0,0');
        });
    });

    describe('fromString', () => {
        it('should parse positive coordinates correctly', () => {
            const pos = Position.fromString('5.5,10.2');
            expect(pos.x).to.equal(5.5);
            expect(pos.y).to.equal(10.2);
        });

        it('should parse negative coordinates correctly', () => {
            const pos = Position.fromString('-5.5,-10.2');
            expect(pos.x).to.equal(-5.5);
            expect(pos.y).to.equal(-10.2);
        });

        it('should parse integer coordinates correctly', () => {
            const pos = Position.fromString('5,10');
            expect(pos.x).to.equal(5);
            expect(pos.y).to.equal(10);
        });

        it('should handle whitespace around coordinates', () => {
            const pos = Position.fromString(' -5.5 , 10.2 ');
            expect(pos.x).to.equal(-5.5);
            expect(pos.y).to.equal(10.2);
        });
    });

    describe('clone', () => {
        it('should create an exact copy', () => {
            const pos = new Position(5.5, 10.2);
            const cloned = pos.clone();
            expect(cloned.x).to.equal(5.5);
            expect(cloned.y).to.equal(10.2);
            expect(cloned.equals(pos)).to.be.true;
        });

        it('should create independent instances', () => {
            const pos = new Position(5.5, 10.2);
            const cloned = pos.clone();
            cloned.x = 999;
            expect(pos.x).to.equal(5.5); // Original unchanged
        });
    });

    describe('add', () => {
        it('should add coordinates correctly', () => {
            const pos1 = new Position(3.5, 5.2);
            const pos2 = new Position(2.1, -1.7);
            const result = pos1.add(pos2);
            expect(result.x).to.be.closeTo(5.6, 0.0001);
            expect(result.y).to.be.closeTo(3.5, 0.0001);
        });

        it('should handle negative addition', () => {
            const pos1 = new Position(-3.5, -5.2);
            const pos2 = new Position(-2.1, 1.7);
            const result = pos1.add(pos2);
            expect(result.x).to.be.closeTo(-5.6, 0.0001);
            expect(result.y).to.be.closeTo(-3.5, 0.0001);
        });

        it('should not modify original positions', () => {
            const pos1 = new Position(3.5, 5.2);
            const pos2 = new Position(2.1, -1.7);
            pos1.add(pos2);
            expect(pos1.x).to.equal(3.5);
            expect(pos1.y).to.equal(5.2);
        });
    });

    describe('subtract', () => {
        it('should subtract coordinates correctly', () => {
            const pos1 = new Position(5.5, 8.3);
            const pos2 = new Position(3.2, 2.1);
            const result = pos1.subtract(pos2);
            expect(result.x).to.be.closeTo(2.3, 0.0001);
            expect(result.y).to.be.closeTo(6.2, 0.0001);
        });

        it('should handle negative subtraction', () => {
            const pos1 = new Position(3.2, 2.1);
            const pos2 = new Position(5.5, 8.3);
            const result = pos1.subtract(pos2);
            expect(result.x).to.be.closeTo(-2.3, 0.0001);
            expect(result.y).to.be.closeTo(-6.2, 0.0001);
        });

        it('should not modify original positions', () => {
            const pos1 = new Position(5.5, 8.3);
            const pos2 = new Position(3.2, 2.1);
            pos1.subtract(pos2);
            expect(pos1.x).to.equal(5.5);
            expect(pos1.y).to.equal(8.3);
        });
    });

    describe('scale', () => {
        it('should scale coordinates correctly', () => {
            const pos = new Position(2.5, 4.0);
            const scaled = pos.scale(3);
            expect(scaled.x).to.equal(7.5);
            expect(scaled.y).to.equal(12.0);
        });

        it('should handle fractional scaling', () => {
            const pos = new Position(10, 20);
            const scaled = pos.scale(0.5);
            expect(scaled.x).to.equal(5);
            expect(scaled.y).to.equal(10);
        });

        it('should handle negative scaling', () => {
            const pos = new Position(5, -10);
            const scaled = pos.scale(-2);
            expect(scaled.x).to.equal(-10);
            expect(scaled.y).to.equal(20);
        });

        it('should not modify original position', () => {
            const pos = new Position(2.5, 4.0);
            pos.scale(3);
            expect(pos.x).to.equal(2.5);
            expect(pos.y).to.equal(4.0);
        });
    });

    describe('distanceTo', () => {
        it('should calculate Euclidean distance correctly', () => {
            const pos1 = new Position(0, 0);
            const pos2 = new Position(3, 4);
            const distance = pos1.distanceTo(pos2);
            expect(distance).to.equal(5); // sqrt(3² + 4²) = 5
        });

        it('should handle negative coordinates', () => {
            const pos1 = new Position(-1, -1);
            const pos2 = new Position(2, 3);
            const distance = pos1.distanceTo(pos2);
            expect(distance).to.equal(5); // sqrt((2-(-1))² + (3-(-1))²) = sqrt(9+16) = 5
        });

        it('should return zero for identical positions', () => {
            const pos1 = new Position(5.5, 10.2);
            const pos2 = new Position(5.5, 10.2);
            const distance = pos1.distanceTo(pos2);
            expect(distance).to.equal(0);
        });

        it('should be symmetric', () => {
            const pos1 = new Position(2.5, 3.7);
            const pos2 = new Position(5.1, 7.2);
            expect(pos1.distanceTo(pos2)).to.be.closeTo(pos2.distanceTo(pos1), 0.0001);
        });
    });

    describe('manhattanDistanceTo', () => {
        it('should calculate Manhattan distance correctly', () => {
            const pos1 = new Position(0, 0);
            const pos2 = new Position(3, 4);
            const distance = pos1.manhattanDistanceTo(pos2);
            expect(distance).to.equal(7); // |3-0| + |4-0| = 7
        });

        it('should handle negative coordinates', () => {
            const pos1 = new Position(-2.5, -3.1);
            const pos2 = new Position(1.2, 2.7);
            const distance = pos1.manhattanDistanceTo(pos2);
            expect(distance).to.be.closeTo(9.5, 0.0001); // |1.2-(-2.5)| + |2.7-(-3.1)| = 3.7 + 5.8 = 9.5
        });

        it('should return zero for identical positions', () => {
            const pos1 = new Position(5.5, 10.2);
            const pos2 = new Position(5.5, 10.2);
            const distance = pos1.manhattanDistanceTo(pos2);
            expect(distance).to.equal(0);
        });

        it('should be symmetric', () => {
            const pos1 = new Position(2.5, 3.7);
            const pos2 = new Position(5.1, 7.2);
            expect(pos1.manhattanDistanceTo(pos2)).to.be.closeTo(pos2.manhattanDistanceTo(pos1), 0.0001);
        });
    });

    describe('midpoint', () => {
        it('should calculate midpoint correctly', () => {
            const pos1 = new Position(0, 0);
            const pos2 = new Position(4, 6);
            const midpoint = pos1.midpoint(pos2);
            expect(midpoint.x).to.equal(2);
            expect(midpoint.y).to.equal(3);
        });

        it('should handle negative coordinates', () => {
            const pos1 = new Position(-2, -4);
            const pos2 = new Position(6, 2);
            const midpoint = pos1.midpoint(pos2);
            expect(midpoint.x).to.equal(2);
            expect(midpoint.y).to.equal(-1);
        });

        it('should handle fractional coordinates', () => {
            const pos1 = new Position(1.5, 2.5);
            const pos2 = new Position(4.5, 8.5);
            const midpoint = pos1.midpoint(pos2);
            expect(midpoint.x).to.equal(3);
            expect(midpoint.y).to.equal(5.5);
        });

        it('should not modify original positions', () => {
            const pos1 = new Position(1, 2);
            const pos2 = new Position(5, 8);
            pos1.midpoint(pos2);
            expect(pos1.x).to.equal(1);
            expect(pos1.y).to.equal(2);
        });
    });

    describe('Pixel Coordinate System Integration', () => {
        it('should support typical pixel coordinate ranges', () => {
            const pos = new Position(1920, 1080);
            expect(pos.x).to.equal(1920);
            expect(pos.y).to.equal(1080);
        });

        it('should support sub-pixel precision', () => {
            const pos = new Position(123.45, 678.90);
            expect(pos.x).to.equal(123.45);
            expect(pos.y).to.equal(678.90);
        });

        it('should handle coordinate operations for UI rendering', () => {
            const center = new Position(100, 100);
            const offset = new Position(10, 10);
            const renderPos = center.add(offset);
            expect(renderPos.x).to.equal(110);
            expect(renderPos.y).to.equal(110);
        });
    });
});