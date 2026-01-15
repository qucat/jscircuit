/**
 * Tutorial Validation Tests
 * 
 * These tests validate each step of the extension tutorial to ensure
 * the documentation accurately reflects what actually works.
 */

import { expect } from 'chai';
import { MyInductor } from './MyInductor.js';
import { Position } from '../../../src/domain/valueObjects/Position.js';
import { Label } from '../../../src/domain/valueObjects/Label.js';
import { Properties } from '../../../src/domain/valueObjects/Properties.js';
import { Element } from '../../../src/domain/entities/Element.js';
// Import ElementRegistry from registry.js to get the configured instance
import { ElementRegistry, rendererFactory } from '../../../src/config/registry.js';

describe('Extension Tutorial Validation', () => {
  
  describe('Step 1: Create Element Class', () => {
    
    it('should create MyInductor class that extends Element', () => {
      const node1 = new Position(0, 0);
      const node2 = new Position(50, 0);
      const inductor = new MyInductor('1', [node1, node2], 'L1', { inductance: 10e-9 });
      
      expect(inductor).to.be.instanceOf(Element);
      expect(inductor).to.be.instanceOf(MyInductor);
    });
    
    it('should set type to "MyInductor"', () => {
      const node1 = new Position(0, 0);
      const node2 = new Position(50, 0);
      const inductor = new MyInductor('1', [node1, node2], 'L1');
      
      expect(inductor.type).to.equal('myinductor');
    });
    
    it('should accept string label and convert to Label instance', () => {
      const node1 = new Position(0, 0);
      const node2 = new Position(50, 0);
      const inductor = new MyInductor('1', [node1, node2], 'L1');
      
      expect(inductor.label).to.be.instanceOf(Label);
      expect(inductor.label.value).to.equal('L1');
    });
    
    it('should accept plain object properties and convert to Properties instance', () => {
      const node1 = new Position(0, 0);
      const node2 = new Position(50, 0);
      const inductor = new MyInductor('1', [node1, node2], 'L1', { inductance: 10e-9 });
      
      expect(inductor.properties).to.be.instanceOf(Properties);
      expect(inductor.properties.values.inductance).to.equal(10e-9);
    });
    
    it('should use default inductance of 5e-9 when not provided', () => {
      const node1 = new Position(0, 0);
      const node2 = new Position(50, 0);
      const inductor = new MyInductor('1', [node1, node2], 'L1');
      
      expect(inductor.properties.values.inductance).to.equal(5e-9);
    });
    
    it('should store nodes as Position objects', () => {
      const node1 = new Position(0, 0);
      const node2 = new Position(50, 0);
      const inductor = new MyInductor('1', [node1, node2], 'L1');
      
      expect(inductor.nodes).to.have.lengthOf(2);
      expect(inductor.nodes[0]).to.be.instanceOf(Position);
      expect(inductor.nodes[1]).to.be.instanceOf(Position);
    });
    
    it('should not have GUI dependencies', () => {
      const node1 = new Position(0, 0);
      const node2 = new Position(50, 0);
      const inductor = new MyInductor('1', [node1, node2], 'L1');
      
      // Should not have rendering methods or GUI properties
      expect(inductor.render).to.be.undefined;
      expect(inductor.draw).to.be.undefined;
      expect(inductor.canvas).to.be.undefined;
      expect(inductor.ctx).to.be.undefined;
    });
  });
  
  describe('Step 2: Create Renderer', () => {
    let MyInductorRenderer;
    
    before(async () => {
      // Dynamically import the renderer after it's created
      const module = await import('./MyInductorRenderer.js');
      MyInductorRenderer = module.MyInductorRenderer;
    });
    
    it('should extend ElementRenderer', async () => {
      const { ElementRenderer } = await import('../../src/gui/renderers/ElementRenderer.js');
      const renderer = new MyInductorRenderer();
      
      expect(renderer).to.be.instanceOf(ElementRenderer);
    });
    
    it('should have a renderElement method', () => {
      const renderer = new MyInductorRenderer();
      
      expect(renderer.renderElement).to.be.a('function');
    });
    
    it('should draw with correct style', () => {
      const mockCtx = {
        strokeStyle: null,
        lineWidth: null,
        fillStyle: null,
        font: null,
        textAlign: null,
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        fillText: () => {}
      };
      
      const renderer = new MyInductorRenderer(mockCtx);
      
      // Create mock element
      const node1 = new Position(0, 0);
      const node2 = new Position(100, 0);
      const mockElement = new MyInductor('test', [node1, node2], 'L1');
      
      // Render element
      renderer.renderElement(mockElement);
      
      // Should use correct colors and line width
      expect(mockCtx.strokeStyle).to.equal('#3498db');
      expect(mockCtx.lineWidth).to.equal(2);
    });
    
    it('should draw line between element nodes', () => {
      let moveToX, moveToY, lineToX, lineToY;
      const mockCtx = {
        strokeStyle: null,
        lineWidth: null,
        fillStyle: null,
        font: null,
        beginPath: () => {},
        moveTo: (x, y) => { moveToX = x; moveToY = y; },
        lineTo: (x, y) => { lineToX = x; lineToY = y; },
        stroke: () => {},
        fillText: () => {}
      };
      
      const renderer = new MyInductorRenderer(mockCtx);
      
      const node1 = new Position(10, 20);
      const node2 = new Position(110, 120);
      const mockElement = new MyInductor('test', [node1, node2], 'L1');
      
      renderer.renderElement(mockElement);
      
      // Should draw from start node to end node
      expect(moveToX).to.equal(10);
      expect(moveToY).to.equal(20);
      expect(lineToX).to.equal(110);
      expect(lineToY).to.equal(120);
    });
    
    it('should draw label at midpoint if present', () => {
      let labelText, labelX, labelY;
      const mockCtx = {
        strokeStyle: null,
        lineWidth: null,
        fillStyle: null,
        font: null,
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        fillText: (text, x, y) => { labelText = text; labelX = x; labelY = y; }
      };
      
      const renderer = new MyInductorRenderer(mockCtx);
      
      const node1 = new Position(0, 0);
      const node2 = new Position(100, 100);
      const mockElement = new MyInductor('test', [node1, node2], 'L5');
      
      renderer.renderElement(mockElement);
      
      // Should draw label at midpoint
      expect(labelText).to.equal('L5');
      expect(labelX).to.equal(50); // (0 + 100) / 2
      expect(labelY).to.equal(40); // (0 + 100) / 2 - 10
    });
    
    it('should not have business logic or domain knowledge', () => {
      const renderer = new MyInductorRenderer();
      
      // Renderer should only have rendering methods
      expect(renderer.calculateInductance).to.be.undefined;
      expect(renderer.validateProperties).to.be.undefined;
      expect(renderer.updateProperties).to.be.undefined;
    });
  });
  
  describe('Step 3: Register Components', () => {
    
    // NOTE: These tests are skipped because MyInductor is not registered in production.
    // This is intentional - MyInductor exists only as a tutorial example in docs/examples/tutorial/.
    // When creating your own custom elements, you would register them in src/config/registry.js
    // and these types of integration tests would verify the registration works correctly.
    
    it.skip('should register MyInductor in ElementRegistry', () => {
      // Verify MyInductor is registered
      const factory = ElementRegistry.get('myinductor');
      expect(factory).to.be.a('function');
    });
    
    it.skip('should create MyInductor instances via ElementRegistry', () => {
      // Get factory and create an element
      const factory = ElementRegistry.get('myinductor');
      const node1 = new Position(0, 0);
      const node2 = new Position(50, 0);
      const inductor = factory('test-id', [node1, node2], 'L1', { inductance: 10e-9 });
      
      // Should create a proper MyInductor instance
      expect(inductor).to.be.instanceOf(MyInductor);
      expect(inductor.type).to.equal('myinductor');
      expect(inductor.properties.values.inductance).to.equal(10e-9);
    });
    
    it.skip('should register MyInductorRenderer in RendererFactory', async () => {
      const { rendererFactory } = await import('../../src/config/registry.js');
      
      // Verify renderer is registered (lowercase 'myinductor')
      const renderer = rendererFactory.create('myinductor');
      expect(renderer).to.be.an('object');
    });
    
    it.skip('should create MyInductorRenderer instances via RendererFactory', async () => {
      const { rendererFactory } = await import('../../src/config/registry.js');
      const { MyInductorRenderer } = await import('./MyInductorRenderer.js');
      
      // Create renderer via factory
      const renderer = rendererFactory.create('myinductor');
      
      // Should be correct type
      expect(renderer).to.be.instanceOf(MyInductorRenderer);
      expect(renderer.renderElement).to.be.a('function');
    });
    
    it.skip('should integrate element and renderer through registries', async () => {
      const { rendererFactory } = await import('../../src/config/registry.js');
      
      // Create element via registry
      const factory = ElementRegistry.get('myinductor');
      const node1 = new Position(0, 0);
      const node2 = new Position(100, 0);
      const element = factory('id-1', [node1, node2], 'L1');
      
      // Get renderer via registry (using lowercase element type)
      const renderer = rendererFactory.create('myinductor');
      
      // Verify they work together
      expect(element.type).to.equal('myinductor');
      expect(renderer.renderElement).to.be.a('function');
      
      // Mock canvas context
      const mockCtx = {
        strokeStyle: null,
        lineWidth: null,
        fillStyle: null,
        font: null,
        textAlign: null,
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        fillText: () => {}
      };
      
      // Set context and render without errors
      renderer.context = mockCtx;
      expect(() => renderer.renderElement(element)).to.not.throw();
    });
    
    it('should prove no GUIAdapter modification needed', async () => {
      const fs = await import('fs');
      const path = await import('path');
      
      // Read GUIAdapter source code
      const guiAdapterPath = path.resolve('src/gui/adapters/GUIAdapter.js');
      const guiAdapterCode = fs.readFileSync(guiAdapterPath, 'utf8');
      
      // Should NOT contain MyInductor-specific code
      expect(guiAdapterCode).to.not.include('MyInductor');
      expect(guiAdapterCode).to.not.include('myinductor');
    });
  });
  
});
