
/**
 * Represents a position with x and y pixel coordinates.
 *
 * This class handles pixel-based coordinates for GUI rendering.
 * For logical grid coordinates, use GridCoordinate class instead.
 * Use CoordinateAdapter to convert between Position and GridCoordinate.
 */
export class Position {
    /**
     * Creates an instance of Position.
     * @param {number} x - The x-coordinate in pixels.
     * @param {number} y - The y-coordinate in pixels.
     */
    constructor(x, y) {
        if (typeof x !== 'number' || typeof y !== 'number') {
            throw new Error('Position requires numeric coordinates');
        }
        if (!isFinite(x) || !isFinite(y)) {
            throw new Error('Position coordinates must be finite numbers');
        }
        this.x = x;
        this.y = y;
    }

    /**
     * Checks if this position is equal to another position.
     * @param {Position} other - The other position to compare with.
     * @param {number} tolerance - Optional tolerance for floating-point comparison (default: 0)
     * @returns {boolean} True if the positions are equal, false otherwise.
     */
    equals(other, tolerance = 0) {
        if (!(other instanceof Position)) {
            return false;
        }
        if (tolerance === 0) {
            return this.x === other.x && this.y === other.y;
        }
        return Math.abs(this.x - other.x) <= tolerance &&
               Math.abs(this.y - other.y) <= tolerance;
    }

    /**
     * Returns a string representation of the position.
     * @returns {string} String in format "x,y"
     */
    toString() {
        return `${this.x},${this.y}`;
    }

    /**
     * Creates a Position from a string representation.
     * @param {string} str - String in format "x,y"
     * @returns {Position} New Position instance
     */
    static fromString(str) {
        const [x, y] = str.split(',').map(s => parseFloat(s.trim()));
        return new Position(x, y);
    }

    /**
     * Creates a copy of this position.
     * @returns {Position} New Position instance with same coordinates
     */
    clone() {
        return new Position(this.x, this.y);
    }

    /**
     * Adds another position to this one.
     * @param {Position} other - The position to add
     * @returns {Position} New position with sum
     */
    add(other) {
        return new Position(this.x + other.x, this.y + other.y);
    }

    /**
     * Subtracts another position from this one.
     * @param {Position} other - The position to subtract
     * @returns {Position} New position with difference
     */
    subtract(other) {
        return new Position(this.x - other.x, this.y - other.y);
    }

    /**
     * Scales this position by a factor.
     * @param {number} factor - Scaling factor
     * @returns {Position} New scaled position
     */
    scale(factor) {
        return new Position(this.x * factor, this.y * factor);
    }

    /**
     * Calculates the Euclidean distance to another position.
     * @param {Position} other - The other position
     * @returns {number} Distance in pixels
     */
    distanceTo(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Calculates the Manhattan distance to another position.
     * @param {Position} other - The other position
     * @returns {number} Manhattan distance in pixels
     */
    manhattanDistanceTo(other) {
        return Math.abs(this.x - other.x) + Math.abs(this.y - other.y);
    }

    /**
     * Creates the midpoint between this position and another.
     * @param {Position} other - The other position
     * @returns {Position} Midpoint position
     */
    midpoint(other) {
        return new Position(
            (this.x + other.x) / 2,
            (this.y + other.y) / 2
        );
    }
}