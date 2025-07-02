import { expect } from 'chai';
import sinon from 'sinon';
import { setupCommands, ElementRegistry, GUICommandRegistry, rendererFactory } from '../../src/config/settings.js';
import { Circuit } from '../../src/domain/aggregates/Circuit.js';
import { CircuitService } from '../../src/application/CircuitService.js';
import { GUIAdapter } from '../../src/gui/adapters/GUIAdapter.js';
import { createMockControls } from './controlsFixture.js';
import { createMockCanvas } from './canvasFixture.js';
import { setupJsdom } from '../setup/jsdomSetup.js';

describe('GUIAdapter Tests', () => {
    let controls;
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

        controls = createMockControls();
        canvas = createMockCanvas();
        const circuit = new Circuit();
        circuitService = new CircuitService(circuit, ElementRegistry);

        guiAdapter = new GUIAdapter(controls, canvas, circuitService, ElementRegistry, rendererFactory, GUICommandRegistry);

        // Await the command registration here
        await setupCommands(circuitService, guiAdapter.circuitRenderer);
    });

    afterEach(() => {
        document.body.innerHTML = '';
        sinon.restore();
    });
});

describe('GUIAdapter Tests', () => {
    let controls;
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
        controls = createMockControls();
        canvas = createMockCanvas();

        const circuit = new Circuit();
        const circuitService = new CircuitService(circuit, ElementRegistry);
        guiAdapter = new GUIAdapter(controls, canvas, circuitService, ElementRegistry, rendererFactory, GUICommandRegistry);

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
        // Spy on addElement
        const addElementSpy = sinon.spy(guiAdapter.circuitService, 'addElement');

        // Re-bind controls (this replaces the button)
        guiAdapter.bindUIControls();

        // Get the *new* button after replacement
        const newButton = document.getElementById('addResistor');
        newButton.click();

        // Assert that an element was added
        expect(addElementSpy.calledOnce).to.be.true;

        // Check the properties of the added element
        const addedElement = addElementSpy.args[0][0]; // Get the first argument of the first call
        expect(addedElement).to.have.property('type', 'resistor'); // Assuming 'resistor' is the type for this button
        expect(addedElement).to.have.property('nodes').that.is.an('array').with.lengthOf(2);
        expect(addedElement).to.have.property('properties').that.is.an('object');
      });

    afterEach(() => {
        // Restore sinon stubs and spies
        document.body.innerHTML = ''; // Clear mock DOM
        sinon.restore();
    });
});
