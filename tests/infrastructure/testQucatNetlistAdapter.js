import fs from 'fs';
import assert from 'assert';
import { Circuit } from '../../src/domain/aggregates/Circuit.js';
import { CircuitService } from '../../src/application/CircuitService.js';
import { Resistor } from '../../src/domain/entities/Resistor.js';
import { Wire } from '../../src/domain/entities/Wire.js';
import { Position } from '../../src/domain/valueObjects/Position.js';
import { Properties } from '../../src/domain/valueObjects/Properties.js';
import { QucatNetlistAdapter } from '../../src/infrastructure/adapters/QucatNetlistAdapter.js';
import { ElementRegistry } from '../../src/domain/factories/ElementRegistry.js';

const EXPORT_PATH = './roundtrip_test_output.txt';

describe('QucatNetlistAdapter roundtrip test with CircuitService', () => {
    before(() => {
        ElementRegistry.register('resistor', (id, nodes, properties) => new Resistor(id, nodes, null, properties));
        ElementRegistry.register('wire', (id, nodes, properties) => new Wire(id, nodes, null, properties));
    });

    describe('Export and Import Netlist', () => {
        let originalElements;

        it('Should export a netlist file and comply with the format', () => {
            const circuit = new Circuit();
            const service = new CircuitService(circuit, ElementRegistry);

            const r1 = new Resistor('R1', [new Position(0, 0), new Position(1, 0)], null, new Properties({ resistance: 1000 }));
            const r2 = new Resistor('R2', [new Position(2, 1), new Position(2, 2)], null, new Properties({}));
            const w1 = new Wire('W1', [new Position(1, 0), new Position(1, 1)]);
            const w2 = new Wire('W2', [new Position(1, 1), new Position(2, 1)]);

            // Wrap the coming two lines into a try-catch block
            try {
            [r1, w1, w2, r2].forEach(el => service.addElement(el));
            originalElements = service.getElements();
            } catch (error) {
                console.error("Error adding elements to the circuit:", error);
                throw error; // Rethrow the error to fail the test
            }
            QucatNetlistAdapter.exportToFile(circuit, EXPORT_PATH);
        });

        it('(Serializing) Should export even if properties such as resistance are not defined', () => {
            const netlistText = fs.readFileSync(EXPORT_PATH, 'utf-8');
            assert(netlistText.includes('R'), 'Exported file should contain resistor lines');
            assert(netlistText.includes('W'), 'Exported file should contain wire lines');
        });

        it('Should import a file of netlist type', () => {
            const lines = fs.readFileSync(EXPORT_PATH, 'utf-8').trim().split('\n');
            assert(lines.length > 0, 'Netlist file should not be empty');
        });

        it('Should interpret each line and create an element', () => {
            const importedElements = QucatNetlistAdapter.importFromFile(EXPORT_PATH);
            assert(importedElements.length === originalElements.length, 'Imported elements count should match original');
        });

        it('(Deserializing) Should create an element with required property even if empty', () => {
            const importedElements = QucatNetlistAdapter.importFromFile(EXPORT_PATH);
            const resistorWithoutValue = importedElements.find(e => e.id.startsWith('R2'));
            assert('resistance' in resistorWithoutValue.properties.values, 'resistor must have a resistance key');
            assert.strictEqual(resistorWithoutValue.properties.values.resistance, undefined, 'resistance value must be undefined');
        });

        it('Should comply with type mappings (resistor, capacitor, etc)', () => {
            const importedElements = QucatNetlistAdapter.importFromFile(EXPORT_PATH);
            const resistor = importedElements.find(e => e.id.startsWith('R1'));
            assert.strictEqual(resistor.type, 'resistor', 'Type should be resistor');
        });

        it('Should convert scientific notation to numbers correctly', () => {
            const netlist = fs.readFileSync(EXPORT_PATH, 'utf-8');
            assert(netlist.includes('1.0e+3') || netlist.includes('1.000000e+03'), 'Scientific notation should be present in export');

            const importedElements = QucatNetlistAdapter.importFromFile(EXPORT_PATH);
            const r1 = importedElements.find(e => e.id.startsWith('R1'));
            assert.strictEqual(r1.properties.values.resistance, 1000);
        });

        it('Roundtrip: imported circuit should match the original structure', () => {
            const importedElements = QucatNetlistAdapter.importFromFile(EXPORT_PATH);

            for (let i = 0; i < originalElements.length; i++) {
                const o = originalElements[i];
                const r = importedElements[i];

                assert.strictEqual(r.type, o.type, `Type mismatch for element ${o.id}`);
                assert.deepStrictEqual(
                    r.nodes.map(n => [n.x, n.y]),
                    o.nodes.map(n => [n.x, n.y]),
                    `Node mismatch in element ${o.id}`
                );
                assert.deepStrictEqual(
                    r.properties.values,
                    o.properties.values,
                    `Property mismatch in element ${o.id}`
                );
            }
        });
    });
});
