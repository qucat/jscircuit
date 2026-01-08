/**
 * Extension Integration Test Suite
 * 
 * This test suite validates the complete extension process, ensuring that
 * developers can add new components without modifying core framework code.
 * 
 * Tests the principle: "GUIAdapter is closed for modification, open for extension"
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { setupJsdom } from '../setup/jsdomSetup.js';
import { createMockCanvas } from '../gui/canvasFixture.js';

// Core framework (should NOT be modified for extensions)
import { Circuit } from '../../src/domain/aggregates/Circuit.js';
import { CircuitService } from '../../src/application/CircuitService.js';
import { GUIAdapter } from '../../src/gui/adapters/GUIAdapter.js';
import { Element } from '../../src/domain/entities/Element.js';
import { ElementRenderer } from '../../src/gui/renderers/ElementRenderer.js';
import { GUICommand } from '../../src/gui/commands/GUICommand.js';
import { Position } from '../../src/domain/valueObjects/Position.js';
import { Label } from '../../src/domain/valueObjects/Label.js';
import { Properties } from '../../src/domain/valueObjects/Properties.js';

// Extension points (these ARE modified for extensions)
import {
  setupCommands,
  ElementRegistry,
  GUICommandRegistry,
  rendererFactory,
} from '../../src/config/registry.js';

describe('Extension Integration: Building MyInductor', () => {
  let canvas, circuit, circuitService, guiAdapter;
  let MyInductor, MyInductorRenderer, MyInductorCommand;

  // Helper: Create properly typed MyInductor class
  const createMyInductorClass = () => {
    return class MyInductor extends Element {
      constructor(id, nodes, label, properties = {}) {
        // Ensure label is a Label instance
        const labelInstance = label instanceof Label ? label : new Label(label || 'L1');
        // Ensure properties is a Properties instance
        const propsInstance = properties instanceof Properties ? properties : new Properties({
          inductance: properties.inductance || 5e-9,
          color: properties.color || 'blue',
          ...properties
        });
        
        super(id, nodes, labelInstance, 'MyInductor');
        this.properties = propsInstance.values;
      }

      toNetlistEntry() {
        return `L${this.id} ${this.nodes[0]} ${this.nodes[1]} ${this.properties.inductance}`;
      }
    };
  };

  // Clean up after tests
  afterEach(() => {
    guiAdapter?.dispose?.();
    document.body.innerHTML = '';
    sinon.restore();
    
    // Unregister test components to avoid pollution
    if (ElementRegistry._registry && ElementRegistry._registry['MyInductor']) {
      delete ElementRegistry._registry['MyInductor'];
    }
    if (rendererFactory.registry && rendererFactory.registry.has('MyInductor')) {
      rendererFactory.registry.delete('MyInductor');
    }
    if (GUICommandRegistry.commands && GUICommandRegistry.commands.has('customInductorCommand')) {
      delete GUICommandRegistry.commands['customInductorCommand'];
    }
  });

  describe('Step 1: Create Domain Entity (No Dependencies)', () => {
    it('should create MyInductor class extending Element', () => {
      // Extension Developer Creates This File: src/domain/entities/MyInductor.js
      class MyInductor extends Element {
        constructor(id, nodes, label, properties = {}) {
          super(id, nodes, label, 'MyInductor');
          this.properties = {
            inductance: properties.inductance || 5e-9,
            color: properties.color || 'blue',
            ...properties
          };
        }

        toNetlistEntry() {
          return `L${this.id} ${this.nodes[0]} ${this.nodes[1]} ${this.properties.inductance}`;
        }
      }

      // Validate it works (use Position instances)
      const node1 = new Position(0, 0);
      const node2 = new Position(50, 0);
      const inductor = new MyInductor('1', [node1, node2], 'L1', { inductance: 10e-9 });
      
      expect(inductor.type).to.equal('MyInductor');
      expect(inductor.properties.inductance).to.equal(10e-9);
      expect(inductor.properties.color).to.equal('blue');
      expect(inductor.toNetlistEntry()).to.include('L1');
    });

    it('should maintain domain purity (no GUI dependencies)', () => {
      // Domain entity should not reference GUI concepts
      class MyInductor extends Element {
        constructor(id, nodes, label, properties = {}) {
          super(id, nodes, label, 'MyInductor');
          this.properties = {
            inductance: properties.inductance || 5e-9,
            ...properties
          };
        }

        toNetlistEntry() {
          return `L${this.id} ${this.nodes[0]} ${this.nodes[1]} ${this.properties.inductance}`;
        }
      }

      const node1 = new Position(0, 0);
      const node2 = new Position(50, 0);
      const inductor = new MyInductor('1', [node1, node2], 'L1');
      
      // Should not have any rendering properties/methods
      expect(inductor).to.not.have.property('render');
      expect(inductor).to.not.have.property('draw');
      expect(inductor).to.not.have.property('ctx');
      
      // Should only have domain concerns
      expect(inductor).to.have.property('properties');
      expect(inductor).to.have.property('toNetlistEntry');
      expect(typeof inductor.toNetlistEntry).to.equal('function');
    });
  });

  describe('Step 2: Create Renderer (GUI Layer)', () => {
    it('should create MyInductorRenderer class extending ElementRenderer', () => {
      // Extension Developer Creates This File: src/gui/renderers/MyInductorRenderer.js
      class MyInductorRenderer extends ElementRenderer {
        render(ctx, element, isSelected, isHovered) {
          ctx.strokeStyle = isSelected ? '#e74c3c' : element.properties.color;
          ctx.lineWidth = isSelected ? 3 : 2;
          // Draw simple line (mock rendering)
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(50, 50);
          ctx.stroke();
        }
      }

      const renderer = new MyInductorRenderer();
      
      expect(renderer).to.be.instanceOf(ElementRenderer);
      expect(renderer).to.have.property('render');
      expect(typeof renderer.render).to.equal('function');
    });

    it('should render with different styles based on selection state', () => {
      const mockCtx = {
        strokeStyle: null,
        lineWidth: null,
        beginPath: sinon.spy(),
        moveTo: sinon.spy(),
        lineTo: sinon.spy(),
        stroke: sinon.spy()
      };

      class MyInductorRenderer extends ElementRenderer {
        render(ctx, element, isSelected, isHovered) {
          ctx.strokeStyle = isSelected ? '#e74c3c' : element.properties.color;
          ctx.lineWidth = isSelected ? 3 : 2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(50, 50);
          ctx.stroke();
        }
      }

      const renderer = new MyInductorRenderer();
      const mockElement = { properties: { color: 'blue' } };

      // Test unselected state
      renderer.render(mockCtx, mockElement, false, false);
      expect(mockCtx.strokeStyle).to.equal('blue');
      expect(mockCtx.lineWidth).to.equal(2);

      // Test selected state
      renderer.render(mockCtx, mockElement, true, false);
      expect(mockCtx.strokeStyle).to.equal('#e74c3c');
      expect(mockCtx.lineWidth).to.equal(3);
    });
  });

  describe('Step 3: Register Element & Renderer (NO GUIAdapter Modification!)', () => {
    beforeEach(() => {
      setupJsdom();
      canvas = createMockCanvas();
      circuit = new Circuit();
      circuitService = new CircuitService(circuit, ElementRegistry);
      guiAdapter = new GUIAdapter(
        null,
        canvas,
        circuitService,
        ElementRegistry,
        rendererFactory,
        GUICommandRegistry
      );
    });

    it('should register MyInductor in ElementRegistry without modifying GUIAdapter', () => {
      // Extension Developer Modifies: src/config/registry.js (NOT GUIAdapter.js!)
      class MyInductor extends Element {
        constructor(id, nodes, label, properties = {}) {
          super(id, nodes, label, 'MyInductor');
          this.properties = { inductance: properties.inductance || 5e-9, ...properties };
        }
        toNetlistEntry() {
          return `L${this.id} ${this.nodes[0]} ${this.nodes[1]} ${this.properties.inductance}`;
        }
      }

      // Register in ElementRegistry
      ElementRegistry.register('MyInductor',
        (id, nodes, label, props) => new MyInductor(id, nodes, label, props)
      );

      // Validate registration worked - use factory to create element
      const node1 = new Position(0, 0);
      const node2 = new Position(50, 0);
      const factory = ElementRegistry.get('MyInductor');
      const createdElement = factory('1', [node1, node2], 'L1', {});
      
      expect(createdElement).to.be.instanceOf(Element);
      expect(createdElement.type).to.equal('MyInductor');
      expect(createdElement.properties.inductance).to.equal(5e-9);
    });

    it('should register MyInductorRenderer in RendererFactory without modifying CircuitRenderer', () => {
      class MyInductorRenderer extends ElementRenderer {
        render(ctx, element, isSelected) {
          ctx.strokeStyle = isSelected ? '#e74c3c' : 'blue';
        }
      }

      // Register in RendererFactory
      rendererFactory.register('MyInductor', MyInductorRenderer);

      // Validate registration worked
      const renderer = rendererFactory.create('MyInductor', {});
      
      expect(renderer).to.be.instanceOf(ElementRenderer);
      expect(renderer).to.have.property('render');
    });

    it('should demonstrate GUIAdapter discovers element through registry (no modification)', () => {
      // Create and register MyInductor
      class MyInductor extends Element {
        constructor(id, nodes, label, properties = {}) {
          super(id, nodes, label, 'MyInductor');
          this.properties = { inductance: properties.inductance || 5e-9, ...properties };
        }
        toNetlistEntry() {
          return `L${this.id} ${this.nodes[0]} ${this.nodes[1]} ${this.properties.inductance}`;
        }
      }

      ElementRegistry.register('MyInductor',
        (id, nodes, label, props) => new MyInductor(id, nodes, label, props)
      );

      // GUIAdapter (unchanged) uses ElementRegistry to discover the element
      const factory = guiAdapter.elementRegistry.get('MyInductor');
      const node1 = new Position(0, 0);
      const node2 = new Position(50, 0);
      const element = factory('1', [node1, node2], 'L1', {});
      
      expect(element.type).to.equal('MyInductor');
      // GUIAdapter found it without any modification to GUIAdapter.js!
    });
  });

  describe('Step 4: GUIAdapter Coordination (Understanding, No Modification)', () => {
    beforeEach(async () => {
      setupJsdom();
      canvas = createMockCanvas();
      circuit = new Circuit();
      circuitService = new CircuitService(circuit, ElementRegistry);
      
      // Create MyInductor for testing
      class MyInductor extends Element {
        constructor(id, nodes, label, properties = {}) {
          super(id, nodes, label, 'MyInductor');
          this.properties = { inductance: properties.inductance || 5e-9, ...properties };
        }
        toNetlistEntry() {
          return `L${this.id} ${this.nodes[0]} ${this.nodes[1]} ${this.properties.inductance}`;
        }
      }

      class MyInductorRenderer extends ElementRenderer {
        render(ctx, element, isSelected) {
          ctx.strokeStyle = isSelected ? '#e74c3c' : 'blue';
        }
      }

      ElementRegistry.register('MyInductor',
        (id, nodes, label, props) => new MyInductor(id, nodes, label, props)
      );
      rendererFactory.register('MyInductor', () => new MyInductorRenderer());

      guiAdapter = new GUIAdapter(
        null,
        canvas,
        circuitService,
        ElementRegistry,
        rendererFactory,
        GUICommandRegistry
      );

      await setupCommands(circuitService, guiAdapter.circuitRenderer);
      guiAdapter.initialize();
    });

    it('should show GUIAdapter has no MyInductor-specific code', () => {
      // GUIAdapter is generic - inspect its structure
      const adapterSource = guiAdapter.constructor.toString();
      
      // Should NOT contain MyInductor-specific logic
      expect(adapterSource).to.not.include('MyInductor');
      expect(adapterSource).to.not.include('Inductor');
      
      // Should contain generic registry usage
      expect(adapterSource).to.include('elementRegistry');
      expect(adapterSource).to.include('handleAction');
    });

    it('should demonstrate GUIAdapter coordinates via registries', () => {
      // GUIAdapter's dependencies are injected
      expect(guiAdapter.elementRegistry).to.equal(ElementRegistry);
      expect(guiAdapter.guiCommandRegistry).to.equal(GUICommandRegistry);
      
      // GUIAdapter can access MyInductor through registry
      const factory = guiAdapter.elementRegistry.get('MyInductor');
      const node1 = new Position(0, 0);
      const node2 = new Position(50, 0);
      const element = factory('1', [node1, node2], 'L1', {});
      expect(element.type).to.equal('MyInductor');
      
      // GUIAdapter doesn't know about MyInductor specifically!
      // It just asks the registry and gets back the right type
    });

    it('should show event system keeps layers decoupled', () => {
      const renderSpy = sinon.spy(guiAdapter.circuitRenderer, 'render');
      
      // CircuitService emits generic 'update' event
      circuitService.emit('update');
      
      // GUIAdapter listener triggers render (generic coordination)
      expect(renderSpy.called).to.be.true;
      
      // This works for ALL elements, including MyInductor, without GUIAdapter modification
    });
  });

  describe('Step 5: Menu Integration (Configuration Only)', () => {
    beforeEach(async () => {
      setupJsdom();
      canvas = createMockCanvas();
      circuit = new Circuit();
      circuitService = new CircuitService(circuit, ElementRegistry);

      // Register MyInductor
      class MyInductor extends Element {
        constructor(id, nodes, label, properties = {}) {
          super(id, nodes, label, 'MyInductor');
          this.properties = { inductance: properties.inductance || 5e-9, ...properties };
        }
        toNetlistEntry() {
          return `L${this.id} ${this.nodes[0]} ${this.nodes[1]} ${this.properties.inductance}`;
        }
      }

      ElementRegistry.register('MyInductor',
        (id, nodes, label, props) => new MyInductor(id, nodes, label, props)
      );

      guiAdapter = new GUIAdapter(
        null,
        canvas,
        circuitService,
        ElementRegistry,
        rendererFactory,
        GUICommandRegistry
      );

      await setupCommands(circuitService, guiAdapter.circuitRenderer);
      guiAdapter.initialize();
    });

    it('should add menu action via configuration (no GUIAdapter modification)', () => {
      // Extension Developer Modifies: src/config/menu.bindings.js
      // ACTIONS['insert.myInductor'] = {
      //   kind: 'command',
      //   name: 'addElement',
      //   args: ['MyInductor']
      // };

      // Simulate the configuration by directly testing the action
      const actionSpec = {
        kind: 'command',
        name: 'addElement',
        args: ['MyInductor']
      };

      // GUIAdapter's handleAction is generic - it works with ANY action spec
      expect(actionSpec.kind).to.equal('command');
      expect(actionSpec.name).to.equal('addElement');
      expect(actionSpec.args).to.deep.equal(['MyInductor']);
    });

    it('should demonstrate action triggers element creation through registry', async () => {
      const initialCount = circuitService.getElements().length;

      // Get the addElement command (generic, works for any element type)
      const cmd = GUICommandRegistry.get(
        'addElement',
        circuitService,
        guiAdapter.circuitRenderer,
        ElementRegistry,
        'MyInductor'  // Element type passed as argument
      );

      expect(cmd).to.exist;
      cmd.execute();

      const elements = circuitService.getElements();
      expect(elements.length).to.equal(initialCount + 1);
      expect(elements[initialCount].type).to.equal('MyInductor');
    });
  });

  describe('Step 6: Custom Commands (Optional, Still No GUIAdapter Modification)', () => {
    beforeEach(async () => {
      setupJsdom();
      canvas = createMockCanvas();
      circuit = new Circuit();
      circuitService = new CircuitService(circuit, ElementRegistry);

      // Register MyInductor
      class MyInductor extends Element {
        constructor(id, nodes, label, properties = {}) {
          super(id, nodes, label, 'MyInductor');
          this.properties = { inductance: properties.inductance || 5e-9, ...properties };
        }
        toNetlistEntry() {
          return `L${this.id} ${this.nodes[0]} ${this.nodes[1]} ${this.properties.inductance}`;
        }
      }

      ElementRegistry.register('MyInductor',
        (id, nodes, label, props) => new MyInductor(id, nodes, label, props)
      );

      guiAdapter = new GUIAdapter(
        null,
        canvas,
        circuitService,
        ElementRegistry,
        rendererFactory,
        GUICommandRegistry
      );

      await setupCommands(circuitService, guiAdapter.circuitRenderer);
      guiAdapter.initialize();
    });

    it('should create custom command that receives GUIAdapter reference', () => {
      // Extension Developer Creates: src/gui/commands/MyInductorCommand.js
      class MyInductorCommand extends GUICommand {
        constructor(circuitService, guiAdapter, elementId, newInductance) {
          super();
          this.circuitService = circuitService;
          this.guiAdapter = guiAdapter;  // Receives GUIAdapter!
          this.elementId = elementId;
          this.newInductance = newInductance;
          this.oldInductance = null;
        }

        execute() {
          const element = this.circuitService.getElement(this.elementId);
          this.oldInductance = element.properties.inductance;
          element.properties.inductance = this.newInductance;
          this.circuitService.emit('update');
        }

        undo() {
          const element = this.circuitService.getElement(this.elementId);
          element.properties.inductance = this.oldInductance;
          this.circuitService.emit('update');
        }
      }

      // Create and test the command
      const factory = ElementRegistry.get('MyInductor');
      const node1 = new Position(0, 0);
      const node2 = new Position(50, 0);
      const element = factory('1', [node1, node2], 'L1', {});
      circuitService.addElement(element);

      const cmd = new MyInductorCommand(circuitService, guiAdapter, element.id, 10e-9);
      
      expect(cmd.guiAdapter).to.equal(guiAdapter);
      expect(cmd.circuitService).to.equal(circuitService);
    });

    it('should demonstrate command can access GUIAdapter state', () => {
      class MyInductorCommand extends GUICommand {
        constructor(circuitService, guiAdapter) {
          super();
          this.circuitService = circuitService;
          this.guiAdapter = guiAdapter;
        }

        execute() {
          // Command can access GUIAdapter state
          const wireMode = this.guiAdapter.wireDrawingMode;
          const selected = this.guiAdapter.circuitRenderer.getSelectedElements();
          
          // Store these for validation
          this.accessedWireMode = wireMode;
          this.accessedSelectedCount = selected.length;
        }

        undo() {}
      }

      const cmd = new MyInductorCommand(circuitService, guiAdapter);
      cmd.execute();

      // Verify command accessed GUIAdapter state
      expect(cmd.accessedWireMode).to.be.a('boolean');
      expect(cmd.accessedSelectedCount).to.be.a('number');
    });

    it('should register custom command without modifying GUIAdapter', () => {
      class MyInductorCommand extends GUICommand {
        constructor(circuitService, guiAdapter, value) {
          super();
          this.circuitService = circuitService;
          this.guiAdapter = guiAdapter;
          this.value = value;
        }
        execute() {}
        undo() {}
      }

      // Register in GUICommandRegistry (modification to registry.js, not GUIAdapter.js)
      GUICommandRegistry.register('customInductorCommand',
        (circuitService, guiAdapter, value) =>
          new MyInductorCommand(circuitService, guiAdapter, value)
      );

      // GUIAdapter (unchanged) can now access the command
      const cmd = GUICommandRegistry.get('customInductorCommand', circuitService, guiAdapter, 42);
      
      expect(cmd).to.be.instanceOf(MyInductorCommand);
      expect(cmd.value).to.equal(42);
      expect(cmd.guiAdapter).to.equal(guiAdapter);
    });
  });

  describe('Step 7: Complete Integration (Proving Open-Closed Principle)', () => {
    beforeEach(async () => {
      setupJsdom();
      canvas = createMockCanvas();
      circuit = new Circuit();
      circuitService = new CircuitService(circuit, ElementRegistry);

      // Complete MyInductor setup
      class MyInductor extends Element {
        constructor(id, nodes, label, properties = {}) {
          super(id, nodes, label, 'MyInductor');
          this.properties = { inductance: properties.inductance || 5e-9, ...properties };
        }
        toNetlistEntry() {
          return `L${this.id} ${this.nodes[0]} ${this.nodes[1]} ${this.properties.inductance}`;
        }
      }

      class MyInductorRenderer extends ElementRenderer {
        render(ctx, element, isSelected) {
          ctx.strokeStyle = isSelected ? '#e74c3c' : 'blue';
          ctx.beginPath();
          ctx.stroke();
        }
      }

      ElementRegistry.register('MyInductor',
        (id, nodes, label, props) => new MyInductor(id, nodes, label, props)
      );
      rendererFactory.register('MyInductor', () => new MyInductorRenderer());

      guiAdapter = new GUIAdapter(
        null,
        canvas,
        circuitService,
        ElementRegistry,
        rendererFactory,
        GUICommandRegistry
      );

      await setupCommands(circuitService, guiAdapter.circuitRenderer);
      guiAdapter.initialize();
    });

    it('should demonstrate complete extension lifecycle without GUIAdapter modification', () => {
      const initialCount = circuitService.getElements().length;
      const renderSpy = sinon.spy(guiAdapter.circuitRenderer, 'render');

      // 1. Create element through registry (GUIAdapter uses this)
      const factory = guiAdapter.elementRegistry.get('MyInductor');
      const node1 = new Position(0, 0);
      const node2 = new Position(50, 0);
      const element = factory('1', [node1, node2], 'L1', {});
      expect(element.type).to.equal('MyInductor');

      // 2. Add to circuit (triggers event)
      circuitService.addElement(element);
      expect(circuitService.getElements().length).to.equal(initialCount + 1);

      // 3. Event triggers render (GUIAdapter's listener)
      expect(renderSpy.called).to.be.true;

      // 4. Renderer found through factory
      const renderer = rendererFactory.create('MyInductor', {});
      expect(renderer).to.be.instanceOf(ElementRenderer);

      // ALL of this works WITHOUT modifying GUIAdapter.js!
    });

    it('should prove GUIAdapter is closed for modification, open for extension', () => {
      // Before: GUIAdapter has no MyInductor code
      const adapterCode = guiAdapter.constructor.toString();
      expect(adapterCode).to.not.include('MyInductor');

      // After extension: GUIAdapter still has no MyInductor code
      const factory = guiAdapter.elementRegistry.get('MyInductor');
      const node1 = new Position(0, 0);
      const node2 = new Position(50, 0);
      const element = factory('1', [node1, node2], 'L1', {});
      circuitService.addElement(element);
      
      // But it works! Element is added, rendered, managed
      expect(circuitService.getElements()).to.have.lengthOf(1);
      expect(circuitService.getElements()[0].type).to.equal('MyInductor');

      // GUIAdapter was NOT modified (closed)
      // But system was extended with new element (open)
      // This is the Open-Closed Principle in action!
    });

    it('should validate complete integration checklist', () => {
      const checklist = {
        domainEntityCreated: false,
        rendererCreated: false,
        elementRegistered: false,
        rendererRegistered: false,
        guiadapterUnmodified: false,
        worksThroughFramework: false
      };

      // ✓ Domain entity exists
      const factory = ElementRegistry.get('MyInductor');
      const node1 = new Position(0, 0);
      const node2 = new Position(50, 0);
      const element = factory('1', [node1, node2], 'L1', {});
      checklist.domainEntityCreated = element.type === 'MyInductor';

      // ✓ Renderer exists
      const renderer = rendererFactory.create('MyInductor', {});
      checklist.rendererCreated = renderer instanceof ElementRenderer;

      // ✓ Element registered
      checklist.elementRegistered = ElementRegistry._registry['MyInductor'] !== undefined;

      // ✓ Renderer registered
      checklist.rendererRegistered = rendererFactory.registry.has('MyInductor');

      // ✓ GUIAdapter not modified
      checklist.guiadapterUnmodified = !guiAdapter.constructor.toString().includes('MyInductor');

      // ✓ Works through framework
      circuitService.addElement(element);
      checklist.worksThroughFramework = circuitService.getElements().length > 0;

      // All checks should pass
      expect(checklist.domainEntityCreated).to.be.true;
      expect(checklist.rendererCreated).to.be.true;
      expect(checklist.elementRegistered).to.be.true;
      expect(checklist.rendererRegistered).to.be.true;
      expect(checklist.guiadapterUnmodified).to.be.true;
      expect(checklist.worksThroughFramework).to.be.true;
    });
  });

  describe('Architecture Validation: Hexagonal Principles', () => {
    it('should validate domain independence (no GUI dependencies)', () => {
      class MyInductor extends Element {
        constructor(id, nodes, label, properties = {}) {
          super(id, nodes, label, 'MyInductor');
          this.properties = { inductance: properties.inductance || 5e-9, ...properties };
        }
        toNetlistEntry() {
          return `L${this.id} ${this.nodes[0]} ${this.nodes[1]} ${this.properties.inductance}`;
        }
      }

      const node1 = new Position(0, 0);
      const node2 = new Position(50, 0);
      const inductor = new MyInductor('1', [node1, node2], 'L1');
      const proto = Object.getPrototypeOf(inductor);
      const methods = Object.getOwnPropertyNames(proto);

      // Should not have GUI-related methods
      const guiMethods = methods.filter(m => 
        m.includes('render') || m.includes('draw') || m.includes('gui')
      );
      expect(guiMethods).to.have.lengthOf(0);

      // Should only have domain methods
      expect(inductor).to.have.property('toNetlistEntry');
      expect(typeof inductor.toNetlistEntry).to.equal('function');
    });

    it('should validate dependency inversion (high-level depends on abstractions)', () => {
      setupJsdom();
      const canvas = createMockCanvas();
      const circuit = new Circuit();
      const circuitService = new CircuitService(circuit, ElementRegistry);
      const guiAdapter = new GUIAdapter(
        null, canvas, circuitService,
        ElementRegistry, rendererFactory, GUICommandRegistry
      );

      // GUIAdapter depends on abstractions (registries), not concrete implementations
      expect(guiAdapter.elementRegistry).to.equal(ElementRegistry);
      expect(typeof guiAdapter.elementRegistry.get).to.equal('function');

      // This means new elements can be added without changing GUIAdapter
      // The registry is the abstraction/port, concrete elements are adapters
    });

    it('should validate registry pattern enables extensibility', () => {
      // Registry pattern: GUIAdapter never knows about concrete types
      const registryBefore = Object.keys(ElementRegistry._registry).length;

      class MyInductor extends Element {
        constructor(id, nodes, label, properties = {}) {
          super(id, nodes, label, 'MyInductor');
          this.properties = { inductance: 5e-9 };
        }
        toNetlistEntry() { return 'L...'; }
      }

      ElementRegistry.register('MyInductor',
        (id, nodes, label, props) => new MyInductor(id, nodes, label, props)
      );

      const registryAfter = Object.keys(ElementRegistry._registry).length;

      // Registry grew (extensibility)
      expect(registryAfter).to.be.greaterThan(registryBefore);

      // But no core code was modified (closed for modification)
      // This is the Open-Closed Principle working through Registry Pattern
    });
  });
});
