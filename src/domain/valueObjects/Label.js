        
/**
 * Represents a label value object.
 * 
 * @class
 */
export class Label {
    /**
     * Creates an instance of Label.
     * 
     * @constructor
     * @param {string} value - The label value.
     * @throws {Error} If the label is invalid.
     */
    constructor(value) {
        if (!Label.isValid(value)) {
            throw new Error("Invalid label: Must be non-empty and less than 50 characters.");
        }
        this.value = value;
    }

    /**
     * Validates the label value.
     * 
     * @static
     * @param {string} value - The label value to validate.
     * @returns {boolean} True if the value is valid, otherwise false.
     */
    static isValid(value) {
        return typeof value === 'string' && value.trim().length > 0 && value.length <= 50;
    }

    /**
     * Returns the string representation of the label.
     * 
     * @returns {string} The label value.
     */
    toString() {
        return this.value;
    }

    /**
     * Checks if this label is equal to another label.
     * 
     * @param {Label} other - The other label to compare.
     * @returns {boolean} True if the labels are equal, otherwise false.
     */
    equals(other) {
        return other instanceof Label && this.value === other.value;
    }
}
