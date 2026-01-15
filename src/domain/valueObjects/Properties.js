/**
 * A container for element-specific properties.
 */
export class Properties {
    /**
     * Creates a properties container.
     * 
     * @param {Object} values - An object containing the value objects for the properties.
     * @throws {Error} If any value is invalid.
     */
    constructor(values = {}) {
        if (typeof values !== 'object' || values === null) {
            throw new Error("Properties must be a non-null object.");
        }

        // Validate each property value
        Object.entries(values).forEach(([key, value]) => {
            if (!this.isValidValue(value)) {
                throw new Error(`Invalid value for property "${key}". Must be a float, "variable", or undefined.`);
            }
        });

        this.values = values; // Store valid values
    }

    /**
     * Checks if a value is valid.
     * 
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is valid, otherwise false.
     */
    isValidValue(value) {
        return typeof value === 'number' || value === "variable" || value === undefined;
    }

    /**
     * Updates a property value.
     * 
     * @param {string} key - The property key to update.
     * @param {*} value - The new value for the property.
     * @throws {Error} If the value is invalid.
     */
    updateProperty(key, value) {
        if (!this.isValidValue(value)) {
            throw new Error(`Invalid value for property "${key}". Must be a float, "variable", or "undefined".`);
        }
        this.values[key] = value;
    }

    /**
     * Describes the properties in the container.
     * 
     * @returns {string} A string description of the properties.
     */
    describe() {
        return Object.entries(this.values)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
    }
}
