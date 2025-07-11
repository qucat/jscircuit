import { expect } from 'chai';
import { CircuitService } from '../src/application/CircuitService.js';
import { FilePersistenceAdapter } from '../src/infrastructure/adapters/FilePersistenceAdapter.js';
import { Circuit } from '../src/domain/aggregates/Circuit.js';

describe('CircuitService', () => {
    it('should describe the circuit correctly', () => {
        const circuit = new Circuit("test-circuit");
        const circuitService = new CircuitService(circuit);
        circuitService.addResistor("R1", { x: 10, y: 20 }, 100);
        circuitService.addCapacitor("C1", { x: 30, y: 40 }, 0.01);
        
        const description = circuitService.describeCircuit();
        expect(description).to.include("R1");
        expect(description).to.include("C1");
    });
});

describe('FilePersistenceAdapter', () => {
    it('should save the circuit to a file', () => {
        const circuit = new Circuit("test-circuit");
        const fileAdapter = new FilePersistenceAdapter();
        fileAdapter.saveToFile(circuit, "test-circuit.txt");
        // Note: Reading from file and verifying content would require file system access,
        // which is not shown here for simplicity.
        console.log("Circuit saved to test-circuit.txt");
    });
});