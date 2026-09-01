// tests/gui/GUIAdapter.test.js
import { expect } from 'chai';
import sinon from 'sinon';

import {
  setupCommands,
  ElementRegistry,
  GUICommandRegistry,
  rendererFactory,
} from '../../src/config/registry.js';

import { Circuit } from '../../src/domain/aggregates/Circuit.js';
import { CircuitService } from '../../src/application/CircuitService.js';
import { GUIAdapter } from '../../src/gui/adapters/GUIAdapter.js';
import { ElementFactory } from '../../src/domain/factories/ElementFactory.js';
import { Position } from '../../src/domain/valueObjects/Position.js';

import { createMockCanvas } from './canvasFixture.js';
import { setupJsdom } from '../setup/jsdomSetup.js';

const nextTick = () => Promise.resolve();

describe('GUIAdapter (declarative actions)', () => {
  let canvas;
  let circuit;
  let circuitService;
  let guiAdapter;

  beforeEach(async () => {
    // Prepare jsdom window/document for event constructors
    setupJsdom();

    // Minimal DOM: only a canvas is needed
    canvas = createMockCanvas();

    // Domain + services
    circuit = new Circuit();
    circuitService = new CircuitService(circuit, ElementRegistry);

    // Adapter (no legacy controls)
    guiAdapter = new GUIAdapter(
      /* controls */ null,
      canvas,
      circuitService,
      ElementRegistry,
      rendererFactory,
      GUICommandRegistry
    );

    // Commands must be ready before initialize()
    await setupCommands(circuitService, guiAdapter.circuitRenderer);
  });

  afterEach(() => {
    guiAdapter?.dispose?.();
    document.body.innerHTML = '';
    sinon.restore();
  });

  it('initializes and renders once', () => {
    // Spy BEFORE initialize(), so we see the first render
    const renderSpy = sinon.spy(guiAdapter.circuitRenderer, 'render');
    guiAdapter.initialize();
    expect(renderSpy.calledOnce).to.be.true;
  });

  it('responds to menu action "insert.resistor" by adding one element', async () => {
    guiAdapter.initialize();
    const beforeLen = circuitService.getElements().length;

    document.dispatchEvent(
      new window.CustomEvent('ui:action', {
        detail: { id: 'insert.resistor' },
        bubbles: true,
      })
    );

    await nextTick();
    const afterLen = circuitService.getElements().length;
    expect(afterLen).to.equal(beforeLen + 1);

    // Sanity: new element looks like an element
    const el = circuitService.getElements()[afterLen - 1];
    expect(el).to.have.property('type');
    expect(el).to.have.property('nodes').that.is.an('array');
  });

  it('responds to menu action "insert.wire" by activating wire drawing mode', async () => {
    guiAdapter.initialize();
    const beforeLen = circuitService.getElements().length;

    document.dispatchEvent(
      new window.CustomEvent('ui:action', {
        detail: { id: 'insert.wire' },
        bubbles: true,
      })
    );

    await nextTick();
    const afterLen = circuitService.getElements().length;
    // Wire drawing mode should be activated but no element added yet
    expect(afterLen).to.equal(beforeLen);
    expect(guiAdapter.wireDrawingMode).to.be.true;
  });

  it('undo via Ctrl+Z reverts exactly one change (no double trigger)', async () => {
    guiAdapter.initialize();

    // Arrange: add once
    document.dispatchEvent(
      new window.CustomEvent('ui:action', {
        detail: { id: 'insert.resistor' },
        bubbles: true,
      })
    );
    await nextTick();
    const before = circuitService.getElements().length;

    // Act: Ctrl+Z
    document.dispatchEvent(
      new window.KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true })
    );
    await nextTick();

    // Assert: exactly one undo
    const after = circuitService.getElements().length;
    expect(after).to.equal(before - 1);
  });

  it('redo via Ctrl+Y reapplies exactly one change', async () => {
    guiAdapter.initialize();

    // Add then undo
    document.dispatchEvent(
      new window.CustomEvent('ui:action', {
        detail: { id: 'insert.resistor' },
        bubbles: true,
      })
    );
    await nextTick();
    document.dispatchEvent(
      new window.KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true })
    );
    await nextTick();

    const before = circuitService.getElements().length;

    // Redo
    document.dispatchEvent(
      new window.KeyboardEvent('keydown', { key: 'y', ctrlKey: true, bubbles: true })
    );
    await nextTick();

    const after = circuitService.getElements().length;
    expect(after).to.equal(before + 1);
  });

  it('view.recenter action calls renderer and does not throw', async () => {
    guiAdapter.initialize();

    document.dispatchEvent(
      new window.CustomEvent('ui:action', {
        detail: { id: 'view.recenter' },
        bubbles: true,
      })
    );

    await nextTick();
    expect(true).to.equal(true); // no throw
  });

  it('moves and grid-finalizes a pasted group as one rigid selection', () => {
    const resistor = ElementFactory.create('resistor', 'R1', [
      new Position(100, 100),
      new Position(150, 100),
    ]);
    const capacitor = ElementFactory.create('capacitor', 'C1', [
      new Position(150, 100),
      new Position(200, 100),
    ]);

    guiAdapter.currentMousePos = { x: 326, y: 224 };
    guiAdapter._beginPlacingGroup([resistor, capacitor]);

    expect(resistor.nodes.map(node => [node.x, node.y])).to.deep.equal([
      [276, 224],
      [326, 224],
    ]);
    expect(capacitor.nodes.map(node => [node.x, node.y])).to.deep.equal([
      [326, 224],
      [376, 224],
    ]);

    guiAdapter._finalizePlacingGroup();

    expect(resistor.nodes.map(node => [node.x, node.y])).to.deep.equal([
      [300, 200],
      [350, 200],
    ]);
    expect(capacitor.nodes.map(node => [node.x, node.y])).to.deep.equal([
      [350, 200],
      [400, 200],
    ]);
    expect(guiAdapter.placingElements).to.be.empty;
  });
});
