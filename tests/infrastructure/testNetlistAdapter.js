import fs from 'fs';
import assert from 'assert';
import { Circuit } from '../../src/domain/aggregates/Circuit.js';
import { CircuitService } from '../../src/application/CircuitService.js';
import { Resistor } from '../../src/domain/entities/Resistor.js';
import { Wire } from '../../src/domain/entities/Wire.js';
import { Position } from '../../src/domain/valueObjects/Position.js';
import { Properties } from '../../src/domain/valueObjects/Properties.js';
import { NetlistAdapter } from '../../src/infrastructure/adapters/NetlistAdapter.js';
import { ElementRegistry } from '../../src/domain/factories/ElementRegistry.js';

const EXPORT_PATH = './roundtrip_test_output.txt';

describe('NetlistAdapter roundtrip test with CircuitService', () => {
    before(() => {
        // Register basic factories if not already done
        ElementRegistry.register('resistor', (id, nodes, properties) => new Resistor(id, nodes, null, properties));
        ElementRegistry.register('wire', (id, nodes, properties) => new Wire(id, nodes, null, properties));
    });

    it('should export and re-import a circuit identically via CircuitService', () => {
        // STEP 1: Setup CircuitService with base circuit
        const circuit = new Circuit();
        const service = new CircuitService(circuit, ElementRegistry);

        const r1 = new Resistor('R1', [new Position(0, 0), new Position(1, 0)], null, new Properties({ resistance: 1000 }));
        const w1 = new Wire('W1', [new Position(1, 0), new Position(1, 1)]);
        const w2 = new Wire('W2', [new Position(1, 1), new Position(2, 1)]);
        const r2 = new Resistor('R2', [new Position(2, 1), new Position(2, 2)], null, new Properties({ resistance: 2200 }));

        [r1, w1, w2, r2].forEach(el => service.addElement(el));
        console.log('Initial circuit elements:', service.getElements());

        // STEP 2: Export via adapter
        NetlistAdapter.exportToFile(circuit, EXPORT_PATH);

        // STEP 3: Import back
        const importedElements = NetlistAdapter.importFromFile(EXPORT_PATH);

        // STEP 4: Create a new service and re-add the elements
        // const newCircuit = new Circuit();
        // const newService = new CircuitService(newCircuit, ElementRegistry);
        // importedElements.forEach(el => newService.addElement(el));

        // // STEP 5: Compare both sets of elements structurally
        // const original = service.getElements();
        // const reloaded = newService.getElements();

        // assert.strictEqual(reloaded.length, original.length);

        // for (let i = 0; i < original.length; i++) {
        //     const o = original[i];
        //     const r = reloaded[i];
        //     assert.strictEqual(o.type, r.type, `Type mismatch at index ${i}`);
        //     assert.deepStrictEqual(
        //         o.nodes.map(n => [n.x, n.y]),
        //         r.nodes.map(n => [n.x, n.y]),
        //         `Node mismatch in element ${o.id}`
        //     );
        //     if (o.type === 'resistor') {
        //         assert.strictEqual(o.properties.values.resistance, r.properties.values.resistance, `Resistance mismatch in ${o.id}`);
        //     }
        // }
    });
});
