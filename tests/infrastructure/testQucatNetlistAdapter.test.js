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
import { generateId } from '../../src/utils/idGenerator.js';

const EXPORT_PATH = './roundtrip_test_output.txt';
const BAD_EXPORT_PATH = './bad_element_test.txt';

describe('QucatNetlistAdapter roundtrip test with CircuitService', () => {
    // Register required element types once before all tests
    // Uses lowercase keys to match adapter typeMap expectations
    before(() => {
        if (!ElementRegistry.get('resistor')) {
            ElementRegistry.register('resistor', (id, nodes, label = null, properties = new Properties({})) =>
                new Resistor(id, nodes, label, properties instanceof Properties ? properties : new Properties(properties || {}))
            );
        }
        if (!ElementRegistry.get('wire')) {
            ElementRegistry.register('wire', (id, nodes, label = null, properties = new Properties({})) =>
                new Wire(id, nodes, label, properties instanceof Properties ? properties : new Properties(properties || {}))
            );
        }
    });

    let originalElements;

    // Setup a fresh circuit and export it before each test
    beforeEach(() => {
        const circuit = new Circuit();
        const service = new CircuitService(circuit, ElementRegistry);

        // Create and add a mix of resistors and wires
        const r1 = new Resistor('R1', [new Position(0, 0), new Position(1, 0)], null, new Properties({ resistance: 1000 }));
        const r2 = new Resistor('R2', [new Position(2, 1), new Position(2, 2)], null, new Properties()); // intentionally empty properties
        const w1 = new Wire('W1', [new Position(1, 0), new Position(1, 1)]);
        const w2 = new Wire('W2', [new Position(1, 1), new Position(2, 1)]);

        [r1, w1, w2, r2].forEach(el => service.addElement(el));
        originalElements = service.getElements();

        // Export to .qucat format (short type netlist)
        QucatNetlistAdapter.exportToFile(circuit, EXPORT_PATH);
    });

    // Clean up files to keep tests isolated
    afterEach(() => {
        if (fs.existsSync(EXPORT_PATH)) fs.unlinkSync(EXPORT_PATH);
        if (fs.existsSync(BAD_EXPORT_PATH)) fs.unlinkSync(BAD_EXPORT_PATH);
    });

    it('Should export a netlist file and comply with the format', () => {
        const netlist = fs.readFileSync(EXPORT_PATH, 'utf-8');
        assert(netlist.includes('R'), 'Should contain resistor lines');
        assert(netlist.includes('W'), 'Should contain wire lines');
    });

    it('Should throw an error on unknown element short type', () => {
        // Create a manually malformed line using unknown type "Z"
        fs.writeFileSync(BAD_EXPORT_PATH, `Z;0,0;1,1;10;weird`);
        assert.throws(() => QucatNetlistAdapter.importFromFile(BAD_EXPORT_PATH), /Unknown element type/);
    });

    it('Should import a non-empty file', () => {
        const lines = fs.readFileSync(EXPORT_PATH, 'utf-8').trim().split('\n');
        assert(lines.length > 0, 'Netlist should not be empty');
    });

    it('Should recreate all original elements', () => {
        const imported = QucatNetlistAdapter.importFromFile(EXPORT_PATH);
        assert.strictEqual(imported.length, originalElements.length);
    });

    it('Should handle empty properties gracefully', () => {
        const imported = QucatNetlistAdapter.importFromFile(EXPORT_PATH);

        // Since IDs are not roundtripped, match by type and node positions
        const r2 = imported.find(el =>
            el.type === 'resistor' &&
            el.nodes[0].x === 2 && el.nodes[0].y === 1 &&
            el.nodes[1].x === 2 && el.nodes[1].y === 2
        );

        assert(r2, 'Expected resistor at (2,1)-(2,2)');
        assert('resistance' in r2.properties.values);
        assert.strictEqual(r2.properties.values.resistance, undefined);
    });

    it('Should preserve element type mappings', () => {
        const imported = QucatNetlistAdapter.importFromFile(EXPORT_PATH);

        const r1 = imported.find(el =>
            el.type === 'resistor' &&
            el.nodes[0].x === 0 && el.nodes[0].y === 0 &&
            el.nodes[1].x === 1 && el.nodes[1].y === 0
        );

        assert(r1, 'Expected resistor at (0,0)-(1,0)');
        assert.strictEqual(r1.type, 'resistor');
    });

    it('Should encode values in scientific notation when appropriate', () => {
        const netlist = fs.readFileSync(EXPORT_PATH, 'utf-8');
        assert(/1\.0+e\+3|1\.000000e\+03/.test(netlist), 'Scientific notation should be used for large values');
    });

    it('Should roundtrip the entire structure accurately', () => {
        const imported = QucatNetlistAdapter.importFromFile(EXPORT_PATH);
        assert.strictEqual(imported.length, originalElements.length);

        for (let i = 0; i < originalElements.length; i++) {
            const original = originalElements[i];

            // Match by type and exact node coordinates (ID is not preserved)
            const roundtripped = imported.find(el =>
                el.type === original.type &&
                el.nodes[0].x === original.nodes[0].x && el.nodes[0].y === original.nodes[0].y &&
                el.nodes[1].x === original.nodes[1].x && el.nodes[1].y === original.nodes[1].y
            );

            assert(roundtripped, `Missing roundtripped element: type ${original.type} with nodes (${original.nodes.map(n => `${n.x},${n.y}`).join(' - ')})`);
            assert.strictEqual(roundtripped.type, original.type, `Type mismatch for element`);

            assert.deepStrictEqual(
                roundtripped.nodes.map(n => [n.x, n.y]),
                original.nodes.map(n => [n.x, n.y]),
                `Node mismatch for element of type ${original.type}`
            );

            // Normalize and compare property keys and values
            const expected = { ...original.properties.values };
            const actual = { ...roundtripped.properties.values };

            for (const key of new Set([...Object.keys(expected), ...Object.keys(actual)])) {
                if (!(key in expected)) expected[key] = undefined;
                if (!(key in actual)) actual[key] = undefined;
            }

            assert.deepStrictEqual(actual, expected, `Property mismatch for element with nodes ${roundtripped.nodes.map(n => `(${n.x},${n.y})`).join(', ')}`);
        }
    });
});
