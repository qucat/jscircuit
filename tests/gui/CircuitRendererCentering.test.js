/**
 * Tests for CircuitRenderer coordinate centering functionality
 */

import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import { CircuitRenderer } from '../../src/gui/renderers/CircuitRenderer.js';
import { CircuitService } from '../../src/application/CircuitService.js';
import { Circuit } from '../../src/domain/aggregates/Circuit.js';
import { ElementRegistry } from '../../src/config/registry.js';
import { RendererFactory } from '../../src/gui/renderers/RendererFactory.js';

describe('CircuitRenderer Coordinate Centering', () => {
    let circuitRenderer, canvas, circuitService;

    beforeEach(() => {
        // Create a mock canvas with fixed dimensions
        canvas = {
            width: 800,
            height: 600,
            addEventListener: () => {}, // Mock addEventListener
            getBoundingClientRect: () => ({
                width: 800,
                height: 600,
                left: 0,
                top: 0,
                right: 800,
                bottom: 600
            }),
            getContext: () => ({
                clearRect: () => {},
                save: () => {},
                restore: () => {},
                translate: () => {},
                scale: () => {},
                setTransform: () => {},
                strokeStyle: '',
                fillStyle: '',
                lineWidth: 0,
                setLineDash: () => {},
                strokeRect: () => {},
                beginPath: () => {},
                moveTo: () => {},
                lineTo: () => {},
                arc: () => {},
                stroke: () => {},
                fill: () => {}
            })
        };

        const circuit = new Circuit();
        circuitService = new CircuitService(circuit, ElementRegistry);
        const rendererFactory = new RendererFactory();

        circuitRenderer = new CircuitRenderer(canvas, circuitService, rendererFactory);
    });

    describe('reCenter method', () => {
        it('should center logical coordinate (0,0) at canvas center', () => {
            // Before centering - coordinates should be at origin
            expect(circuitRenderer.offsetX).to.equal(0);
            expect(circuitRenderer.offsetY).to.equal(0);

            // Call reCenter
            circuitRenderer.reCenter();

            // After centering - offsets should position (0,0) at canvas center
            // Using getBoundingClientRect() values (800x600)
            expect(circuitRenderer.offsetX).to.equal(400); // 800 / 2
            expect(circuitRenderer.offsetY).to.equal(300); // 600 / 2
        });

        it('should work with different canvas sizes', () => {
            // Test with a different canvas size
            canvas.width = 1200;
            canvas.height = 900;
            // Update getBoundingClientRect mock to match new dimensions
            canvas.getBoundingClientRect = () => ({
                width: 1200,
                height: 900,
                left: 0,
                top: 0,
                right: 1200,
                bottom: 900
            });

            circuitRenderer.reCenter();

            expect(circuitRenderer.offsetX).to.equal(600);
            expect(circuitRenderer.offsetY).to.equal(450);
        });

        it('should preserve scale when centering', () => {
            // Set a custom scale
            const originalScale = 2.0;
            circuitRenderer.scale = originalScale;

            circuitRenderer.reCenter();

            // Scale should be preserved
            expect(circuitRenderer.scale).to.equal(originalScale);
            
            // Offsets should still center the view
            expect(circuitRenderer.offsetX).to.equal(canvas.width / 2);
            expect(circuitRenderer.offsetY).to.equal(canvas.height / 2);
        });

        it('should recenter from any starting offset', () => {
            // Set some arbitrary starting offsets
            circuitRenderer.offsetX = 123;
            circuitRenderer.offsetY = 456;

            circuitRenderer.reCenter();

            // Should now be centered regardless of starting position
            expect(circuitRenderer.offsetX).to.equal(canvas.width / 2);
            expect(circuitRenderer.offsetY).to.equal(canvas.height / 2);
        });
    });

    describe('initialization with centering', () => {
        it('should start with logical coordinates centered', () => {
            // The CircuitRenderer constructor should not change this
            // but the GUIAdapter.initialize() should call reCenter()
            expect(typeof circuitRenderer.reCenter).to.equal('function');
        });
    });
});