// src/utils/idGenerator.js
let counter = 0;

/**
 * Generates a unique ID using a simple counter.
 * Optionally adds a prefix for readability (e.g., "R1", "W2").
 * 
 * @param {string} prefix - A prefix for the ID (e.g., "R" for resistor).
 * @returns {string} A unique ID (e.g., "R1").
 */
export const generateId = (prefix = '') => {
    counter += 1;
    return `${prefix}${counter}`;
};
