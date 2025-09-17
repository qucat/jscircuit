
/**
 * Represents a position with x and y coordinates.
 */
export class Position {
    /**
     * Creates an instance of Position.
     * @param {number} x - The x-coordinate.
     * @param {number} y - The y-coordinate.
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * Checks if this position is equal to another position.
     * @param {Position} other - The other position to compare with.
     * @returns {boolean} True if the positions are equal, false otherwise.
     */
    equals(other) {
        return this.x === other.x && this.y === other.y;
    }
}