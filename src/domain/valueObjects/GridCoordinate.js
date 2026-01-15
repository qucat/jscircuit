/**
 * GridCoordinate - Represents logical grid coordinates (integer-based)
 * 
 * This class handles the logical coordinate system where:
 * - Coordinates are integers representing grid positions
 * - v1.0 components span 2 logical grid points
 * - v2.0 components span 6 logical grid points
 * - Coordinates can be negative (e.g., -3, -2, -1, 0, 1, 2, 3...)
 */
export class GridCoordinate {
    /**
     * Creates an instance of GridCoordinate.
     * @param {number} x - The logical x-coordinate (integer).
     * @param {number} y - The logical y-coordinate (integer).
     */
    constructor(x, y) {
        if (!Number.isInteger(x) || !Number.isInteger(y)) {
            throw new Error('GridCoordinate requires integer values');
        }
        this.x = x;
        this.y = y;
    }

    /**
     * Checks if this coordinate is equal to another coordinate.
     * @param {GridCoordinate} other - The other coordinate to compare with.
     * @returns {boolean} True if the coordinates are equal, false otherwise.
     */
    equals(other) {
        return this.x === other.x && this.y === other.y;
    }

    /**
     * Returns a string representation of the coordinate.
     * @returns {string} String in format "x,y"
     */
    toString() {
        return `${this.x},${this.y}`;
    }

    /**
     * Creates a GridCoordinate from a string representation.
     * @param {string} str - String in format "x,y"
     * @returns {GridCoordinate} New GridCoordinate instance
     */
    static fromString(str) {
        const [x, y] = str.split(',').map(s => parseInt(s.trim(), 10));
        return new GridCoordinate(x, y);
    }

    /**
     * Scales this coordinate by a factor (for v1.0 to v2.0 conversion).
     * Results are rounded to maintain integer constraint.
     * @param {number} factor - Scaling factor (e.g., 3 for v1.0 to v2.0)
     * @returns {GridCoordinate} New scaled coordinate
     */
    scale(factor) {
        return new GridCoordinate(Math.round(this.x * factor), Math.round(this.y * factor));
    }

    /**
     * Adds another coordinate to this one.
     * @param {GridCoordinate} other - The coordinate to add
     * @returns {GridCoordinate} New coordinate with sum
     */
    add(other) {
        return new GridCoordinate(this.x + other.x, this.y + other.y);
    }

    /**
     * Subtracts another coordinate from this one.
     * @param {GridCoordinate} other - The coordinate to subtract
     * @returns {GridCoordinate} New coordinate with difference
     */
    subtract(other) {
        return new GridCoordinate(this.x - other.x, this.y - other.y);
    }

    /**
     * Calculates the distance between two grid coordinates.
     * @param {GridCoordinate} other - The other coordinate
     * @returns {number} Grid distance (Manhattan distance)
     */
    distanceTo(other) {
        return Math.abs(this.x - other.x) + Math.abs(this.y - other.y);
    }
}