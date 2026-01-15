import { expect } from 'chai';
import { Circuit } from '../../src/domain/aggregates/Circuit.js';
import { MockElement } from './MockElement.js'; // A mock element class for testing
import { Position } from '../../src/domain/valueObjects/Position.js';

describe('Circuit Tests', () => {
    let circuit;

    beforeEach(() => {
        circuit = new Circuit();
    });

    describe('Constructor', () => {
        it('should initialize with an empty elements list', () => {
            expect(circuit.elements).to.be.an('array').that.is.empty;
        });

        it('should initialize with an empty connections map', () => {
            expect(circuit.connections).to.be.instanceOf(Map);
            expect(circuit.connections.size).to.equal(0);
        });
    });

    describe('validateAddElement', () => {
        it('should make sure that the element id is unique in the circuit', () => { 
            const element1 = new MockElement('E1', [
                new Position(10, 20),
                new Position(30, 40)
            ]);
            const element2 = new MockElement('E1', [ // Duplicate ID
                new Position(50, 60),
                new Position(70, 80)
            ]);
        
            // Add the first element to the circuit
            circuit.elements.push(element1);
        
            // Attempt to add the second element with the same ID
            expect(() => circuit.validateAddElement(element2)).to.throw(
                'Element with id E1 is already in the circuit'

            );
        });           
    });

    describe('validateConnection', () => {
        it('should allow valid connections between two elements via shared nodes', () => {
            const element1 = new MockElement('E5', [
                new Position(10, 20),
                new Position(30, 40)
            ]);

            const element2 = new MockElement('E6', [
                new Position(10, 20), // Shared node
                new Position(50, 60)
            ]);

            expect(() => circuit.validateConnection(element1, element2)).to.not.throw();
            // expect(() => circuit.validateConnection(element1, element2, [new Position(10, 20)])).to.not.throw();
        });


        it('should allow wires to have multiple connections across the wire line from external nodes', () => {
            const wire = new MockElement('W7', [
                new Position(40, 10),
                new Position(60, 10) // Horizontal wire from (40, 10) to (60, 10)
            ]);

            circuit.elements.push(wire);

            const connectingWire1 = new MockElement('W8', [
                new Position(50, 10), // Along the main wire's line
                new Position(50, 20) // Extends vertically
            ]);

            const connectingWire2 = new MockElement('W9', [
                new Position(45, 10), // Along the main wire's line
                new Position(45, 20) // Extends vertically
            ]);

            expect(() => circuit.validateConnection(wire, connectingWire1, [new Position(50, 10)])).to.not.throw();
            expect(() => circuit.validateConnection(wire, connectingWire2, [new Position(45, 10)])).to.not.throw();
        });
        
        it('should throw an error if a node is already connected to another element', () => {
            const wire1 = new MockElement('W1', [
                new Position(10, 20),
                new Position(30, 40)
            ]);

            const wire2 = new MockElement('W2', [
                new Position(10, 20), // Shared node
                new Position(50, 60)
            ]);

            const resistor = new MockElement('R1', [
                new Position(10, 20) // Same node as wire1 and wire2
            ]);

            circuit.connections.set('10,20', [wire1, wire2]);

            expect(() => circuit.validateConnection(wire1, resistor)).to.throw(
                'Node at position (10, 20) is already connected and cannot accept additional connections.'
            );
        });
    });
});
