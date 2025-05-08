import { expect } from 'chai';
import { ElementService } from '../../src/application/ElementService.js';
import { MockElement } from './MockElement.js'; // A mock element class for testing
import { Position } from '../../src/domain/valueObjects/Position.js';
import { Properties } from '../../src/domain/valueObjects/Properties.js';

describe('Element Service Tests', () => {
    let elementFactory;

    // Mock element factory setup before tests
    before(() => {
        elementFactory = {
            create: (type, id, nodes, propertiesArgs) => {
                if (type !== 'MockElement') {
                    throw new Error(`Element type "${type}" is not registered.`);
                }
                return new MockElement(id, nodes, ...propertiesArgs);
            }
        };

        // Inject the mock factory into the ElementService as a static property
        ElementService.elementFactory = elementFactory;
    });

    describe('Element Creation', () => {
        it('should create an element successfully', () => {
            const nodes = [new Position(10, 20), new Position(30, 40)];
            const properties = new Properties({ resistance: 100 });
            const element = ElementService.create('MockElement', 'E1', nodes, [null, properties]);

            expect(element).to.be.instanceOf(MockElement);
            expect(element.id).to.equal('E1');
            expect(element.nodes).to.deep.equal(nodes);
            expect(element.properties).to.equal(properties);
        });

        it('should throw an error if creation inputs are invalid', () => {
            expect(() => ElementService.create('MockElement', 'E2', [10, 20], [null, new Properties()])).to.throw(
                "Nodes must be an array of Position instances."
            );
        });

        it('should throw an error if type is not registered', () => {
            expect(() => ElementService.create('UnknownType', 'E3', [], [])).to.throw(
                'Element type "UnknownType" is not registered.'
            );
        });
    });

    describe('Element Deletion', () => {
        it('should delete an element successfully', () => {
            const nodes = [new Position(10, 20)];
            const properties = new Properties();
            const element = new MockElement('E3', nodes, null, properties);

            let elements = [element];
            elements = ElementService.delete(elements, 'E3');

            expect(elements).to.be.an('array').that.is.empty;
        });

        it('should do nothing when deleting a non-existent element', () => {
            const nodes = [new Position(10, 20)];
            const properties = new Properties();
            const element = new MockElement('E4', nodes, null, properties);

            let elements = [element];
            elements = ElementService.delete(elements, 'NonExistentID');

            expect(elements).to.have.lengthOf(1);
            expect(elements[0].id).to.equal('E4');
        });
    });

    describe('Element Movement', () => {
        it('should move an element successfully', () => {
            const nodes = [new Position(10, 20), new Position(30, 40)];
            const element = new MockElement('E5', nodes, null, new Properties());

            ElementService.move(element, new Position(20, 30));

            expect(element.nodes).to.deep.equal([
                new Position(20, 30),
                new Position(40, 50),
            ]);
        });

        it('should not change nodes if moved to the same position', () => {
            const nodes = [new Position(10, 20), new Position(30, 40)];
            const element = new MockElement('E6', nodes, null, new Properties());

            ElementService.move(element, new Position(10, 20));

            expect(element.nodes).to.deep.equal(nodes);
        });
    });

    describe('Element Rotation', () => {
        it('should rotate an element by 90 degrees', () => {
            const nodes = [new Position(10, 10), new Position(20, 10)];
            const element = new MockElement('E7', nodes, null, new Properties());

            ElementService.rotate(element, 90);

            expect(element.nodes).to.deep.equal([
                new Position(10, 10), // Reference terminal remains unchanged
                new Position(10, 20), // Rotated position
            ]);
        });

        it('should rotate an element by 180 degrees', () => {
            const nodes = [new Position(10, 10), new Position(20, 10)];
            const element = new MockElement('E8', nodes, null, new Properties());

            ElementService.rotate(element, 180);

            expect(element.nodes).to.deep.equal([
                new Position(10, 10), // Reference terminal remains unchanged
                new Position(0, 10), // Rotated position
            ]);
        });

        it('should throw an error for invalid rotation angles', () => {
            const nodes = [new Position(10, 10), new Position(20, 10)];
            const element = new MockElement('E9', nodes, null, new Properties());

            expect(() => ElementService.rotate(element, 45)).to.throw(
                "Orientation must be one of 0, 90, 180, or 270 degrees."
            );
        });
    });

    describe('Element Service Property Updates', () => {
        it('should update properties through ElementService', () => {
            const nodes = [new Position(10, 20)];
            const properties = new Properties({ resistance: 100 });
            const element = new MockElement('E2', nodes, null, properties);
    
            // Update the property to a new float value
            ElementService.updateProperties(element, { resistance: 200 });
    
            expect(element.properties.values.resistance).to.equal(200);
        });

        it('should allow to define a property as undefined', () => {
            const nodes = [new Position(10, 20)];
            const properties = new Properties({ resistance: 100 });
            const element = new MockElement('E1', nodes, null, properties);
    
            // Update the property to undefined
            ElementService.updateProperties(element, { resistance: undefined });
    
            expect(element.properties.values.resistance).to.equal(undefined);
        });
    
        it('should allow defining properties as a variable parameter for the simulation engine', () => {
            const nodes = [new Position(10, 20)];
            const properties = new Properties({ resistance: 100 });
            const element = new MockElement('E3', nodes, null, properties);
    
            // Define the property as "variable"
            ElementService.updateProperties(element, { resistance: "variable" });
    
            expect(element.properties.values.resistance).to.equal("variable");
        });
    });
});
