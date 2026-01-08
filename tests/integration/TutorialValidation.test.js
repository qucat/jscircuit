/**
 * Tutorial Validation Tests
 * 
 * These tests validate each step of the extension tutorial to ensure
 * the documentation accurately reflects what actually works.
 */

import { expect } from 'chai';
import { MyInductor } from '../../src/domain/entities/MyInductor.js';
import { Position } from '../../src/domain/valueObjects/Position.js';
import { Label } from '../../src/domain/valueObjects/Label.js';
import { Properties } from '../../src/domain/valueObjects/Properties.js';
import { Element } from '../../src/domain/entities/Element.js';
// Import ElementRegistry from registry.js to get the configured instance
import { ElementRegistry, rendererFactory } from '../../src/config/registry.js';

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
      
      expect(inductor.type).to.equal('MyInductor');
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
      const module = await import('../../src/gui/renderers/MyInductorRenderer.js');
      MyInductorRenderer = module.MyInductorRenderer;
    });
    
    it('should extend ElementRenderer', async () => {
      const { ElementRenderer } = await import('../../src/gui/renderers/ElementRenderer.js');
      const renderer = new MyInductorRenderer();
      
      expect(renderer).to.be.instanceOf(ElementRenderer);
    });
    
    it('should have a render method', () => {
      const renderer = new MyInductorRenderer();
      
      expect(renderer.render).to.be.a('function');
    });
    
    it('should change stroke style based on selection state', () => {
      const renderer = new MyInductorRenderer();
      
      // Create mock canvas context
      const mockCtx = {
        strokeStyle: null,
        lineWidth: null,
        fillStyle: null,
        font: null,
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        fillText: () => {}
      };
      
      // Create mock element
      const node1 = new Position(0, 0);
      const node2 = new Position(100, 0);
      const mockElement = new MyInductor('test', [node1, node2], 'L1');
      
      // Test unselected state
      renderer.render(mockCtx, mockElement, false, false);
      expect(mockCtx.strokeStyle).to.equal('#3498db');
      expect(mockCtx.lineWidth).to.equal(2);
      
      // Test selected state
      renderer.render(mockCtx, mockElement, true, false);
      expect(mockCtx.strokeStyle).to.equal('#e74c3c');
      expect(mockCtx.lineWidth).to.equal(3);
    });
    
    it('should draw line between element nodes', () => {
      const renderer = new MyInductorRenderer();
      
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
      
      const node1 = new Position(10, 20);
      const node2 = new Position(110, 120);
      const mockElement = new MyInductor('test', [node1, node2], 'L1');
      
      renderer.render(mockCtx, mockElement, false, false);
      
      // Should draw from start node to end node
      expect(moveToX).to.equal(10);
      expect(moveToY).to.equal(20);
      expect(lineToX).to.equal(110);
      expect(lineToY).to.equal(120);
    });
    
    it('should draw label at midpoint if present', () => {
      const renderer = new MyInductorRenderer();
      
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
      
      const node1 = new Position(0, 0);
      const node2 = new Position(100, 100);
      const mockElement = new MyInductor('test', [node1, node2], 'L5');
      
      renderer.render(mockCtx, mockElement, false, false);
      
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
    
    it('should register MyInductor in ElementRegistry', () => {
      // Verify MyInductor is registered
      const factory = ElementRegistry.get('MyInductor');
      expect(factory).to.be.a('function');
    });
    
    it('should create MyInductor instances via ElementRegistry', () => {
      // Get factory and create an element
      const factory = ElementRegistry.get('MyInductor');
      const node1 = new Position(0, 0);
      const node2 = new Position(50, 0);
      const inductor = factory('test-id', [node1, node2], 'L1', { inductance: 10e-9 });
      
      // Should create a proper MyInductor instance
      expect(inductor).to.be.instanceOf(MyInductor);
      expect(inductor.type).to.equal('MyInductor');
      expect(inductor.properties.values.inductance).to.equal(10e-9);
    });
    
    it('should register MyInductorRenderer in RendererFactory', async () => {
      const { rendererFactory } = await import('../../src/config/registry.js');
      
      // Verify renderer is registered (lowercase 'myinductor')
      const renderer = rendererFactory.create('myinductor');
      expect(renderer).to.be.an('object');
    });
    
    it('should create MyInductorRenderer instances via RendererFactory', async () => {
      const { rendererFactory } = await import('../../src/config/registry.js');
      const { MyInductorRenderer } = await import('../../src/gui/renderers/MyInductorRenderer.js');
      
      // Create renderer via factory
      const renderer = rendererFactory.create('myinductor');
      
      // Should be correct type
      expect(renderer).to.be.instanceOf(MyInductorRenderer);
      expect(renderer.render).to.be.a('function');
    });
    
    it('should integrate element and renderer through registries', async () => {
      const { rendererFactory } = await import('../../src/config/registry.js');
      
      // Create element via registry
      const factory = ElementRegistry.get('MyInductor');
      const node1 = new Position(0, 0);
      const node2 = new Position(100, 0);
      const element = factory('id-1', [node1, node2], 'L1');
      
      // Get renderer via registry (using lowercase element type)
      const renderer = rendererFactory.create('myinductor');
      
      // Verify they work together
      expect(element.type).to.equal('MyInductor');
      expect(renderer.render).to.be.a('function');
      
      // Mock canvas context
      const mockCtx = {
        strokeStyle: null,
        lineWidth: null,
        fillStyle: null,
        font: null,
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        fillText: () => {}
      };
      
      // Should render without errors
      expect(() => renderer.render(mockCtx, element, false, false)).to.not.throw();
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
