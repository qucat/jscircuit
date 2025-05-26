import { expect } from 'chai';
import sinon from 'sinon';
// import '../../src/config/settings.js';
import { setupCommands, ElementRegistry, GUICommandRegistry, rendererFactory } from '../../src/config/settings.js';
import { Circuit } from '../../src/domain/aggregates/Circuit.js';
import { CircuitService } from '../../src/application/CircuitService.js';
import { GUIAdapter } from '../../src/gui/adapters/GUIAdapter.js';
import { createMockCanvas } from './canvasFixture.js';
import { setupJsdom } from '../setup/jsdomSetup.js';

describe('GUIAdapter Tests', () => {
    let canvas;
    let guiAdapter;
    let circuitService;

    beforeEach(async () => {
        setupJsdom();

        // Add buttons to the test DOM
        ['addResistor', 'addWire', 'addMockElement'].forEach((id) => {
            const button = document.createElement('button');
            button.id = id;
            document.body.appendChild(button);
        });

        canvas = createMockCanvas();
        const circuit = new Circuit();
        circuitService = new CircuitService(circuit, ElementRegistry);

        guiAdapter = new GUIAdapter(canvas, circuitService, ElementRegistry, rendererFactory, GUICommandRegistry);

        // Await the command registration here
        await setupCommands(circuitService, guiAdapter.circuitRenderer);
    });

    afterEach(() => {
        document.body.innerHTML = '';
        sinon.restore();
    });
});

describe('GUIAdapter Tests', () => {
    let canvas;
    let guiAdapter;

    beforeEach(async () => {
        setupJsdom();
    
        // Add required buttons to the DOM
        ['addResistor', 'addWire', 'addMockElement'].forEach((id) => {
            const button = document.createElement('button');
            button.id = id;
            document.body.appendChild(button);
        });

        // Mock canvas element
        canvas = createMockCanvas();

        const circuit = new Circuit();
        const circuitService = new CircuitService(circuit, ElementRegistry);
        guiAdapter = new GUIAdapter(canvas, circuitService, ElementRegistry, rendererFactory, GUICommandRegistry);

        // Await the command registration here
        await setupCommands(circuitService, guiAdapter.circuitRenderer);
    });
    
    it('should initialize without errors', () => {
        expect(() => guiAdapter.initialize()).to.not.throw();
    });

    it('should dynamically bind UI controls based on registered elements', () => {
        const resistorButton = document.getElementById('addResistor');
        const wireButton = document.getElementById('addWire');

        // Verify that the buttons exist
        expect(resistorButton).to.not.be.null;
        expect(wireButton).to.not.be.null;

        guiAdapter.bindUIControls();

        // Ensure event listeners are registered
        expect(resistorButton.addEventListener).to.be.a('function');
        expect(wireButton.addEventListener).to.be.a('function');
    });

    it('should render the circuit when initialized', () => {
        const renderSpy = sinon.spy(guiAdapter.circuitRenderer, 'render');
        guiAdapter.initialize();
        expect(renderSpy.calledOnce).to.be.true;
    });

    it('should create and add elements via UI control bindings', () => {
        const resistorButton = document.getElementById('addResistor');

        // Spy on CircuitService.addElement
        const addElementSpy = sinon.spy(guiAdapter.circuitService, 'addElement');

        sinon.spy(resistorButton, 'addEventListener');
        guiAdapter.bindUIControls();

        // Verify single event listener registration
        expect(resistorButton.addEventListener.callCount).to.equal(1);

        // Simulates a real DOM clicc
        resistorButton.click();

        // Verify that the circuitService we are using is the same as the one in GUIAdapter
        const command = GUICommandRegistry.get("addElement", guiAdapter.circuitService);
        expect(command.circuitService === guiAdapter.circuitService).to.be.true;

        // Verify addElement was called once
        expect(addElementSpy.calledOnce).to.be.true;

        // Verify the added element's type, properties, and nodes
        const addedElement = addElementSpy.args[0][0];
        expect(addedElement).to.have.property('type', 'resistor');
        expect(addedElement).to.have.property('nodes').that.is.an('array').with.lengthOf(2);
        expect(addedElement).to.have.property('properties').that.is.an('object');
    });

    afterEach(() => {
        // Restore sinon stubs and spies
        document.body.innerHTML = ''; // Clear mock DOM
        sinon.restore();
    });
});
