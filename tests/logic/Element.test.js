import { expect } from 'chai';
import { Element } from '../../src/domain/entities/Element.js';
import { Resistor } from '../../src/domain/entities/Resistor.js';
import { Wire } from '../../src/domain/entities/Wire.js';
import { MockElement } from './MockElement.js'; // A mock element class for testing
import { Position } from '../../src/domain/valueObjects/Position.js';
import { Label } from '../../src/domain/valueObjects/Label.js';
import { Properties } from '../../src/domain/valueObjects/Properties.js';


describe('Basic Import Test', () => {
    it('should import Element successfully', () => {
        expect(Element).to.be.a('function');
    });
});

describe('Element Class Tests', () => {
    /**
     * Parameterized test function to validate Element subclasses.
     *
     * @param {string} type - The type of the Element subclass (e.g., 'resistor', 'Wire', 'MockElement').
     * @param {Function} ElementClass - The Element subclass to test.
     * @param {Object} defaultProperties - Default properties for the Element subclass.
     */
    const testElementSubclass = (type, ElementClass, defaultProperties) => {
        describe(`${type} Tests`, () => {
            it(`A ${type.toLowerCase()} should have a unique identifier`, () => {
                const element = new ElementClass('E1', [new Position(10, 20), new Position(30, 40)], null, new Properties(defaultProperties));
                expect(element.id).to.equal('E1');
            });

            it(`A ${type.toLowerCase()} should validate nodes as an array of Position instances`, () => {
                const nodes = [new Position(10, 20), new Position(30, 40)];
                const element = new ElementClass('E2', nodes, null, new Properties(defaultProperties));
                expect(element.nodes).to.deep.equal(nodes);
            });

            it(`A ${type.toLowerCase()} should throw an error if nodes are invalid`, () => {
                expect(() => new ElementClass('E3', [10, 20], null, new Properties(defaultProperties))).to.throw(
                    "Nodes must be an array of Position instances."
                );
            });

            it(`A ${type.toLowerCase()} should accept a label of type Label or null`, () => {
                const label = new Label(`${type} Label`);
                const element = new ElementClass('E4', [new Position(10, 20), new Position(30, 40)], label, new Properties(defaultProperties));
                expect(element.label).to.equal(label);
            });

            it(`A ${type.toLowerCase()} should throw an error if label is invalid`, () => {
                expect(() => new ElementClass('E5', [new Position(10, 20), new Position(30, 40)], 'Invalid Label', new Properties(defaultProperties))).to.throw(
                    "Label must be an instance of Label or null."
                );
            });

            it(`A ${type.toLowerCase()} should accept properties of type Properties`, () => {
                const properties = new Properties(defaultProperties);
                const element = new ElementClass('E6', [new Position(10, 20), new Position(30, 40)], null, properties);
                expect(element.properties).to.equal(properties);
            });

            it(`A ${type.toLowerCase()} should throw an error if properties are invalid`, () => {
                expect(() => new ElementClass('E7', [new Position(10, 20), new Position(30, 40)], null, { invalid: 'properties' })).to.throw(
                    "Properties must be an instance of Properties."
                );
            });

            it(`A ${type.toLowerCase()} should support the describe method`, () => {
                const nodes = [new Position(10, 20), new Position(30, 40)];
                const label = new Label(`${type} Label`);
                const properties = new Properties(defaultProperties);

                const element = new ElementClass('E8', nodes, label, properties);

                const description = element.describe();
                expect(description).to.include(`${type.toLowerCase()} (E8): nodes:`);
                expect(description).to.include(`label: "${type} Label"`);
                expect(description).to.include(`properties:`);
            });
        });
    };
    
    // Tests for MockElement
    testElementSubclass('MockElement', MockElement, { mockProperty: 42 });

    // Tests for Resistor
    testElementSubclass('resistor', Resistor, { resistance: 100 });

    // Tests for Wire
    testElementSubclass('Wire', Wire, {});
});