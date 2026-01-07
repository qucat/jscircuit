import { expect } from 'chai';
import sinon from 'sinon';
import { Circuit } from '../../src/domain/aggregates/Circuit.js';
import { CircuitService } from '../../src/application/CircuitService.js';
import { MockElement } from './MockElement.js'; // A mock element class for testing
import { Position } from '../../src/domain/valueObjects/Position.js';
import { ElementRegistry } from '../../src/config/registry.js';

describe('CircuitService Tests', () => {
    let circuit;
    let circuitService;
    let emitSpy;

    beforeEach(() => {
        circuit = new Circuit();

        circuitService = new CircuitService(circuit, ElementRegistry);

        // Ensure emitSpy is correctly tracking circuitService.emit
        emitSpy = sinon.spy(circuitService, "emit");

    });

    describe('addElement', () => {
        it('should add an element to the circuit', () => {
            const element = new MockElement('E1', [
                new Position(10, 20),
                new Position(30, 40)
            ]);

            circuitService.addElement(element);

            expect(circuit.elements).to.include(element);
        });

        it('should throw an error if an element with the same ID already exists', () => {
            const element1 = new MockElement('E1', [
                new Position(10, 20),
                new Position(30, 40)
            ]);

            const element2 = new MockElement('E1', [
                new Position(50, 60),
                new Position(70, 80)
            ]);

            circuitService.addElement(element1);

            expect(() => circuitService.addElement(element2)).to.throw(
                'Element with id E1 is already in the circuit.'
            );
            // delete Element
            circuitService.deleteElement('E1');

        });

        it("should add an element to the circuit and emit an update", function (done) {
            this.timeout(5000); // ✅ Only works in function declarations

            const element = new MockElement("E1", [
                new Position(10, 20),
                new Position(30, 40),
            ]);

            circuitService.addElement(element);

            process.nextTick(() => {
                try {
                    expect(circuit.elements).to.include(element);

                    const emittedElement = emitSpy.getCalls()[0].args[1].element;
                    expect(emittedElement.id).to.equal(element.id);

                    done(); // Ensures Mocha completes successfully
                } catch (err) {
                    done(err); // Ensures Mocha captures errors
                }
            });
        });
            });

    describe('deleteElement', () => {
        it('should delete an element from the circuit', () => {
            const element = new MockElement('E2', [
                new Position(10, 20),
                new Position(30, 40)
            ]);

            circuitService.addElement(element);
            circuitService.deleteElement('E2');

            expect(circuit.elements).to.not.include(element);
        });

        it('should handle deletion of a non-existent element gracefully', () => {
            const element = new MockElement('E3', [
                new Position(10, 20),
                new Position(30, 40)
            ]);

            circuitService.addElement(element);
            circuitService.deleteElement('NonExistentID');

            expect(circuit.elements).to.include(element);
        });
    });

    describe('connectElements', () => {
        it('should connect two elements via shared nodes', () => {
            const element1 = new MockElement('E4', [
                new Position(10, 20),
                new Position(30, 40)
            ]);

            const element2 = new MockElement('E5', [
                new Position(10, 20), // Shared node
                new Position(50, 60)
            ]);

            circuitService.addElement(element1);
            circuitService.addElement(element2);

            circuitService.connectElements(element1, element2);

            const connections = circuitService.findConnections(element1);
            expect(connections).to.include(element2);
        });

        it('should throw an error if a node is already fully connected', () => {
            const element1 = new MockElement('E6', [
                new Position(10, 20),
                new Position(30, 40)
            ]);

            const element2 = new MockElement('E7', [
                new Position(10, 20), // Shared node
                new Position(50, 60)
            ]);

            const element3 = new MockElement('E8', [
                new Position(10, 20), // Attempting to share the same node
                new Position(70, 80)
            ]);

            circuitService.addElement(element1);
            circuitService.addElement(element2);
            circuitService.connectElements(element1, element2);

            expect(() => circuitService.connectElements(element1, element3)).to.throw(
                'Node at position (10, 20) is already connected and cannot accept additional connections.'
            );
        });
    });

    describe('findConnections', () => {
        it('should return all elements connected to a given element', () => {
            const element1 = new MockElement('E9', [
                new Position(10, 20),
                new Position(30, 40)
            ]);

            const element2 = new MockElement('E10', [
                new Position(10, 20), // Shared node
                new Position(50, 60)
            ]);

            const element3 = new MockElement('E11', [
                new Position(30, 40), // Shared node
                new Position(70, 80)
            ]);

            circuitService.addElement(element1);
            circuitService.addElement(element2);
            circuitService.addElement(element3);

            circuitService.connectElements(element1, element2);
            circuitService.connectElements(element1, element3);

            const connections = circuitService.findConnections(element1);

            expect(connections).to.include(element2);
            expect(connections).to.include(element3);
        });

        it('should return an empty array for an element with no connections', () => {
            const element = new MockElement('E12', [
                new Position(10, 20),
                new Position(30, 40)
            ]);

            circuitService.addElement(element);

            const connections = circuitService.findConnections(element);

            expect(connections).to.be.an('array').that.is.empty;
        });
    });
});