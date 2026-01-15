
/**
 * Class representing a Resistance.
 */
export class Resistance {
    /**
     * Create a Resistance.
     * @param {number} value - The value of the resistance.
     * @throws {Error} Throws an error if the resistance value is less than or equal to zero.
     */
    constructor(value) {
        if (value <= 0) {
            throw new Error('Resistance must be greater than zero.');
        }
        this.value = value;
    }

    /**
     * Check if this resistance is equal to another resistance.
     * @param {Resistance} other - The other resistance to compare.
     * @returns {boolean} True if the resistances are equal, false otherwise.
     */
    equals(other) {
        return this.value === other.value;
    }
}
