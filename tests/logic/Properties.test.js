import { expect } from 'chai';
import { Properties } from '../../src/domain/valueObjects/Properties.js';

describe('Properties Class Tests', () => {
    it('should describe properties correctly', () => {
        const properties = new Properties({ resistance: 100, capacitance: "variable" });
        const description = properties.describe();
        expect(description).to.equal("resistance: 100, capacitance: variable");
    });

    it('should handle empty properties correctly', () => {
        const properties = new Properties({});
        const description = properties.describe();
        expect(description).to.equal("");
    });
});
