import fs from 'fs';
import assert from 'assert';
import { Circuit } from '../../src/domain/aggregates/Circuit.js';
import { CircuitService } from '../../src/application/CircuitService.js';
import { Resistor } from '../../src/domain/entities/Resistor.js';
import { Wire } from '../../src/domain/entities/Wire.js';
import { Ground } from '../../src/domain/entities/Ground.js';
import { NonLinearInductor } from '../../src/domain/entities/NonLinearInductor.js';
import { Position } from '../../src/domain/valueObjects/Position.js';
import { Properties } from '../../src/domain/valueObjects/Properties.js';
import { QucatNetlistAdapter } from '../../src/infrastructure/adapters/QucatNetlistAdapter.js';
import { ElementRegistry } from '../../src/domain/factories/ElementRegistry.js';
import { CoordinateAdapter } from '../../src/infrastructure/adapters/CoordinateAdapter.js';
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

        // Create and add a mix of resistors and wires using v1.0-aligned pixel coordinates
        // (multiples of 50px so roundtrip through v1.0 grid is lossless)
        const r1 = new Resistor('R1', [new Position(0, 0), new Position(50, 0)], null, new Properties({ resistance: 1000 }));
        const r2 = new Resistor('R2', [new Position(50, 50), new Position(100, 50)], null, new Properties()); // intentionally empty properties
        const w1 = new Wire('W1', [new Position(50, 0), new Position(50, 50)]);
        const w2 = new Wire('W2', [new Position(100, 50), new Position(0, 0)]);

        [r1, w1, w2, r2].forEach(el => service.addElement(el));
        originalElements = service.getElements();

        // Export to .qucat format string (browser-compatible)
        const netlistContent = QucatNetlistAdapter.exportToString(circuit);
        // Write to file for test compatibility
        fs.writeFileSync(EXPORT_PATH, netlistContent, 'utf-8');
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
        const badContent = fs.readFileSync(BAD_EXPORT_PATH, 'utf-8');
        assert.throws(() => QucatNetlistAdapter.importFromString(badContent), /Unknown element type/);
    });

    it('Should import a non-empty file', () => {
        const lines = fs.readFileSync(EXPORT_PATH, 'utf-8').trim().split('\n');
        assert(lines.length > 0, 'Netlist should not be empty');
    });

    it('Should recreate all original elements', () => {
        const netlistContent = fs.readFileSync(EXPORT_PATH, 'utf-8');
        const imported = QucatNetlistAdapter.importFromString(netlistContent);
        assert.strictEqual(imported.length, originalElements.length);
    });

    it('Should handle empty properties gracefully', () => {
        const netlistContent = fs.readFileSync(EXPORT_PATH, 'utf-8');
        const imported = QucatNetlistAdapter.importFromString(netlistContent);

        // Since IDs are not roundtripped, match by type and node positions
        // v1.0 coordinates (1,1)-(2,1) from export → v2.0 (5,5)-(10,5) → pixel (50,50)-(100,50)
        const r2 = imported.find(el =>
            el.type === 'resistor' &&
            el.nodes[0].x === 50 && el.nodes[0].y === 50 &&
            el.nodes[1].x === 100 && el.nodes[1].y === 50
        );

        assert(r2, 'Expected resistor at pixel coordinates (50,50)-(100,50)');
        assert('resistance' in r2.properties.values);
        assert.strictEqual(r2.properties.values.resistance, undefined);
    });

    it('Should preserve element type mappings', () => {
        const netlistContent = fs.readFileSync(EXPORT_PATH, 'utf-8');
        const imported = QucatNetlistAdapter.importFromString(netlistContent);

        // v1.0 coordinates (0,0)-(1,0) from export → v2.0 (0,0)-(5,0) → pixel (0,0)-(50,0)
        const r1 = imported.find(el =>
            el.type === 'resistor' &&
            el.nodes[0].x === 0 && el.nodes[0].y === 0 &&
            el.nodes[1].x === 50 && el.nodes[1].y === 0
        );

        assert(r1, 'Expected resistor at pixel coordinates (0,0)-(50,0)');
        assert.strictEqual(r1.type, 'resistor');
    });

    it('Should encode values in scientific notation when appropriate', () => {
        const netlist = fs.readFileSync(EXPORT_PATH, 'utf-8');
        assert(/1\.0+e\+3|1\.000000e\+03/.test(netlist), 'Scientific notation should be used for large values');
    });

    it('Should export in v1.0 format with component spans of 1', () => {
        const netlist = fs.readFileSync(EXPORT_PATH, 'utf-8');
        const lines = netlist.trim().split('\n');

        // Resistor lines should have a Manhattan span of 1 (v1.0 format)
        const resistorLines = lines.filter(l => l.startsWith('R;'));
        assert(resistorLines.length > 0, 'Should have resistor lines');

        for (const line of resistorLines) {
            const [, pos1, pos2] = line.split(';');
            const [x1, y1] = pos1.split(',').map(Number);
            const [x2, y2] = pos2.split(',').map(Number);
            const span = Math.abs(x2 - x1) + Math.abs(y2 - y1);
            assert.strictEqual(span, 1, `Resistor should have v1.0 span of 1, got ${span}: ${line}`);
        }
    });

    it('Should export ground with QuCat minus/plus convention', () => {
        const circuit = new Circuit();
        const service = new CircuitService(circuit, ElementRegistry);

        // JSCircuit ground representation:
        // nodes[0] = connection node, nodes[1] = phantom/body-side reference
        // Example mirrors alpha notebook geometry in v2 coordinates:
        // connection (-7,-5), phantom (-12,-5) => pixels (-70,-50), (-120,-50)
        const ground = new Ground(
            'G1',
            [new Position(-70, -50), new Position(-120, -50)],
            null,
            new Properties({})
        );
        service.addElement(ground);

        const netlist = QucatNetlistAdapter.exportToString(circuit);
        const [line] = netlist.trim().split('\n');

        // QuCat expects pos1=minus(body), pos2=plus(connection)
        // nodes[0] (connection) pixel(-70,-50) → v2(-7,-5) → v1(-1,-1)
        // nodes[1] (phantom/body) pixel(-120,-50) → v2(-12,-5) → v1(-2,-1)
        // Swap: pos1=body(-2,-1), pos2=connection(-1,-1)
        assert.strictEqual(line, 'G;-2,-1;-1,-1;;');
    });

    it('Should import ground with nodes[0]=connection, nodes[1]=body', () => {
        // QuCat netlist: G;pos1(body);pos2(connection);;
        // Reference from QuCat example notebook: G;-2,-1;-2,0;;
        const netlist = 'C;-2,-1;-1,-1;1.0e-13;\nL;-2,0;-1,0;1.0e-8;\nW;-2,0;-2,-1;;\nW;-1,-1;-1,0;;\nG;-2,-1;-2,0;;';
        const elements = QucatNetlistAdapter.importFromString(netlist);

        const ground = elements.find(el => el.type === 'ground');
        assert(ground, 'Should find a ground element');

        // QuCat pos2 (-2,0) = connection → should become nodes[0]
        // v1(-2,0) → v2(-10,0) → pixel(-100,0)
        assert.strictEqual(ground.nodes[0].x, -100, 'nodes[0].x should be connection x');
        assert.strictEqual(ground.nodes[0].y, 0, 'nodes[0].y should be connection y');

        // QuCat pos1 (-2,-1) = body → should become nodes[1]
        // v1(-2,-1) → v2(-10,-5) → pixel(-100,-50)
        assert.strictEqual(ground.nodes[1].x, -100, 'nodes[1].x should be body x');
        assert.strictEqual(ground.nodes[1].y, -50, 'nodes[1].y should be body y');

        // body→connection direction is (0,+50) = DOWN in canvas → atan2(50,0) = 90°
        // 90° rotation: body LEFT → body UP (matching QuCat)
        assert.strictEqual(ground.properties.values.orientation, 90,
            'Ground orientation should be 90° (body UP in canvas, matching QuCat)');
    });

    it('Should roundtrip the entire structure accurately', () => {
        const netlistContent = fs.readFileSync(EXPORT_PATH, 'utf-8');
        const imported = QucatNetlistAdapter.importFromString(netlistContent);
        assert.strictEqual(imported.length, originalElements.length);

        for (let i = 0; i < originalElements.length; i++) {
            const original = originalElements[i];
            
            // The roundtrip should preserve pixel coordinates (original -> logical -> pixel)
            // So we match by type and original pixel coordinates
            const roundtripped = imported.find(el =>
                el.type === original.type &&
                el.nodes[0].x === original.nodes[0].x && el.nodes[0].y === original.nodes[0].y &&
                el.nodes[1].x === original.nodes[1].x && el.nodes[1].y === original.nodes[1].y
            );

            assert(roundtripped, `Missing roundtripped element: type ${original.type} with nodes (${original.nodes[0].x},${original.nodes[0].y} - ${original.nodes[1].x},${original.nodes[1].y})`);
            assert.strictEqual(roundtripped.type, original.type, `Type mismatch for element`);

            assert.deepStrictEqual(
                roundtripped.nodes.map(n => [n.x, n.y]),
                original.nodes.map(n => [n.x, n.y]),
                `Node mismatch for element of type ${original.type}`
            );

            // Normalize and compare property keys and values
            const expected = { ...original.properties.values };
            const actual = { ...roundtripped.properties.values };

            // Handle properties that may have been added as defaults during roundtrip
            // If a property wasn't in the original but appears in the roundtrip with a default value,
            // and the original had it as undefined, treat them as equivalent
            for (const key of new Set([...Object.keys(expected), ...Object.keys(actual)])) {
                if (!(key in expected)) {
                    // Property was added during roundtrip, check if it's a known default
                    if (key === 'orientation' && actual[key] === 0) {
                        // Default orientation should be treated as equivalent to undefined
                        expected[key] = undefined;
                    } else {
                        expected[key] = undefined;
                    }
                }
                if (!(key in actual)) {
                    actual[key] = undefined;
                }
                
                // Normalize: treat orientation 0 and undefined as equivalent for testing
                if (key === 'orientation') {
                    if (expected[key] === undefined && actual[key] === 0) {
                        expected[key] = 0; // Accept the default
                    }
                    if (actual[key] === undefined && expected[key] === 0) {
                        actual[key] = 0; // Accept the default
                    }
                }
            }

            assert.deepStrictEqual(actual, expected, `Property mismatch for element with nodes ${roundtripped.nodes.map(n => `(${n.x},${n.y})`).join(', ')}`);
        }
    });
});

describe('QucatNetlistAdapter NonLinearInductor support', () => {
    before(() => {
        if (!ElementRegistry.get('nonlinearinductor')) {
            ElementRegistry.register('nonlinearinductor', (id, nodes, label = null, properties = new Properties({})) =>
                new NonLinearInductor(id, nodes, label, properties instanceof Properties ? properties : new Properties(properties || {}))
            );
        }
    });

    it('Should import a fully-symbolic NonLinearInductor line (SNAIL tutorial style)', () => {
        const netlist = 'NonLinearInductor;-1,-2;0,-2;,,;E2,E3,E4';
        const [element] = QucatNetlistAdapter.importFromString(netlist);

        assert.strictEqual(element.type, 'nonlinearinductor');
        assert.strictEqual(element.properties.values.e2Label, 'E2');
        assert.strictEqual(element.properties.values.e3Label, 'E3');
        assert.strictEqual(element.properties.values.e4Label, 'E4');
        assert.strictEqual(element.properties.values.e2, undefined);
        assert.strictEqual(element.properties.values.e3, undefined);
        assert.strictEqual(element.properties.values.e4, undefined);
        assert.strictEqual(element.label, null, 'NonLinearInductor has no single overall label');
    });

    it('Should import a fully-numeric NonLinearInductor line for round-trip fidelity', () => {
        const netlist = 'NonLinearInductor;-1,-1;0,-1;1.0e+00,2.0e+00,3.0e+00;,,';
        const [element] = QucatNetlistAdapter.importFromString(netlist);

        assert.strictEqual(element.properties.values.e2, 1);
        assert.strictEqual(element.properties.values.e3, 2);
        assert.strictEqual(element.properties.values.e4, 3);
        assert.strictEqual(element.properties.values.e2Label, undefined);
    });

    it('Should export a NonLinearInductor with only labels set', () => {
        const circuit = new Circuit();
        const service = new CircuitService(circuit, ElementRegistry);

        const nli = new NonLinearInductor(
            'N1',
            [new Position(0, 0), new Position(50, 0)],
            null,
            new Properties({ e2Label: 'E2', e3Label: 'E3', e4Label: 'E4' })
        );
        service.addElement(nli);

        const netlist = QucatNetlistAdapter.exportToString(circuit);
        const [line] = netlist.trim().split('\n');

        assert.strictEqual(line, 'NonLinearInductor;0,0;1,0;,,;E2,E3,E4');
    });

    it('Should round-trip a labels-only NonLinearInductor through export and re-import', () => {
        const circuit = new Circuit();
        const service = new CircuitService(circuit, ElementRegistry);

        const nli = new NonLinearInductor(
            'N1',
            [new Position(0, 0), new Position(50, 0)],
            null,
            new Properties({ e2Label: 'E2', e3Label: 'E3', e4Label: 'E4' })
        );
        service.addElement(nli);

        const exported = QucatNetlistAdapter.exportToString(circuit);
        const [reimported] = QucatNetlistAdapter.importFromString(exported);

        assert.strictEqual(reimported.properties.values.e2Label, 'E2');
        assert.strictEqual(reimported.properties.values.e3Label, 'E3');
        assert.strictEqual(reimported.properties.values.e4Label, 'E4');
        assert.deepStrictEqual(
            reimported.nodes.map(n => [n.x, n.y]),
            nli.nodes.map(n => [n.x, n.y])
        );
    });
});
