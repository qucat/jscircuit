/**
 * @file performance-benchmark.test.js
 * @description 
 * Performance benchmarks for spatial indexing and other optimizations
 */

import { SpatialIndex, BoundingBox, AdaptiveSpatialIndex } from '../../src/utils/SpatialIndex.js';
import { Circuit } from '../../src/domain/aggregates/Circuit.js';
import { CircuitService } from '../../src/application/CircuitService.js';
import { Position } from '../../src/domain/valueObjects/Position.js';
import { Properties } from '../../src/domain/valueObjects/Properties.js';
import { ElementRegistry } from '../../src/domain/factories/ElementRegistry.js';
import { Resistor } from '../../src/domain/entities/Resistor.js';
import { Logger } from '../../src/utils/Logger.js';

// Mock canvas for performance tests
class MockCanvas {
    constructor(width = 800, height = 600) {
        this.width = width;
        this.height = height;
    }
    
    getContext() {
        return {
            clearRect: () => {},
            save: () => {},
            restore: () => {},
            translate: () => {},
            scale: () => {},
        };
    }
}

// Register elements for testing only if not already registered
if (!ElementRegistry.get('resistor')) {
    ElementRegistry.register('resistor', (id, nodes, label, properties) => {
        return new Resistor(id, nodes, label, properties || new Properties({}));
    });
}

describe('Performance Benchmarks', function() {
    this.timeout(10000); // 10 second timeout for performance tests

    let circuit, circuitService, spatialIndex;

    beforeEach(() => {
        circuit = new Circuit();
        circuitService = new CircuitService(circuit, ElementRegistry);
        
        // Use more efficient parameters for testing
        const bounds = new BoundingBox(-1000, -1000, 2000, 2000);
        spatialIndex = new AdaptiveSpatialIndex(bounds, 20, 8); // More elements per node, deeper tree
    });

    describe('Spatial Index Performance', () => {
        it('should handle large numbers of elements efficiently', () => {
            const elementCount = 500; // Reduced from 1000 for more reasonable test time
            const elements = [];

            const createStart = performance.now();

            // Create elements in a grid pattern
            const gridSize = Math.ceil(Math.sqrt(elementCount));
            for (let i = 0; i < elementCount; i++) {
                const x = (i % gridSize) * 50;
                const y = Math.floor(i / gridSize) * 50;
                
                const element = {
                    id: `R${i}`,
                    type: 'resistor',
                    nodes: [
                        new Position(x, y),
                        new Position(x + 20, y)
                    ]
                };
                elements.push(element);
            }

            const createTime = performance.now() - createStart;

            // Benchmark spatial index building
            const buildStart = performance.now();
            spatialIndex.rebuild(elements);
            const buildTime = performance.now() - buildStart;

            expect(buildTime).to.be.lessThan(1000); // More reasonable expectation: under 1 second

            // Benchmark point queries
            const queryCount = 1000;
            const queryStart = performance.now();

            for (let i = 0; i < queryCount; i++) {
                const x = Math.random() * gridSize * 50;
                const y = Math.random() * gridSize * 50;
                const results = spatialIndex.findElementsAtPoint(x, y);
                // Results check is just to prevent optimization
                expect(results).to.be.an('array');
            }

            const queryTime = performance.now() - queryStart;
            const avgQueryTime = queryTime / queryCount;

            expect(avgQueryTime).to.be.lessThan(1); // Each query should be under 1ms
        });

        it('should outperform linear search for hover detection', () => {
            const elementCount = 500;
            const elements = [];
            const queryCount = 100;

            // Create test elements
            for (let i = 0; i < elementCount; i++) {
                const x = Math.random() * 1000;
                const y = Math.random() * 1000;
                elements.push({
                    id: `E${i}`,
                    type: 'resistor',
                    nodes: [
                        new Position(x, y),
                        new Position(x + 30, y)
                    ]
                });
            }

            // Build spatial index
            spatialIndex.rebuild(elements);

            // Benchmark linear search
            const linearStart = performance.now();
            for (let i = 0; i < queryCount; i++) {
                const queryX = Math.random() * 1000;
                const queryY = Math.random() * 1000;
                
                // Simulate linear hover detection
                let found = null;
                for (const element of elements) {
                    const [start, end] = element.nodes;
                    const midX = (start.x + end.x) / 2;
                    const midY = (start.y + end.y) / 2;
                    const distance = Math.sqrt((queryX - midX) ** 2 + (queryY - midY) ** 2);
                    if (distance < 20) {
                        found = element;
                        break;
                    }
                }
            }
            const linearTime = performance.now() - linearStart;

            // Benchmark spatial index search
            const spatialStart = performance.now();
            for (let i = 0; i < queryCount; i++) {
                const queryX = Math.random() * 1000;
                const queryY = Math.random() * 1000;
                const candidates = spatialIndex.findElementsAtPoint(queryX, queryY);
                
                // Simulate precise detection on candidates
                let found = null;
                for (const element of candidates) {
                    const [start, end] = element.nodes;
                    const midX = (start.x + end.x) / 2;
                    const midY = (start.y + end.y) / 2;
                    const distance = Math.sqrt((queryX - midX) ** 2 + (queryY - midY) ** 2);
                    if (distance < 20) {
                        found = element;
                        break;
                    }
                }
            }
            const spatialTime = performance.now() - spatialStart;

            const speedup = linearTime / spatialTime;

            // Spatial index should be significantly faster for large element counts
            expect(speedup).to.be.greaterThan(2); // At least 2x faster
        });

        it('should handle viewport updates efficiently', () => {
            const elements = [];
            const elementCount = 200;

            // Create elements
            for (let i = 0; i < elementCount; i++) {
                elements.push({
                    id: `E${i}`,
                    type: 'resistor',
                    nodes: [
                        new Position(Math.random() * 2000 - 1000, Math.random() * 2000 - 1000),
                        new Position(Math.random() * 2000 - 1000, Math.random() * 2000 - 1000)
                    ]
                });
            }

            spatialIndex.rebuild(elements);

            // Benchmark viewport updates
            const updateCount = 50;
            const updateStart = performance.now();

            for (let i = 0; i < updateCount; i++) {
                const offsetX = Math.random() * 400 - 200;
                const offsetY = Math.random() * 400 - 200;
                const scale = 0.5 + Math.random() * 2; // 0.5x to 2.5x zoom
                
                spatialIndex.updateViewport(offsetX, offsetY, scale, 800, 600);
            }

            const updateTime = performance.now() - updateStart;
            const avgUpdateTime = updateTime / updateCount;

            expect(avgUpdateTime).to.be.lessThan(5); // Each update under 5ms
        });
    });

    describe('CircuitService Performance', () => {
        it('should handle large circuit operations efficiently', () => {
            const elementCount = 100;
            
            // Benchmark element addition
            const addStart = performance.now();
            for (let i = 0; i < elementCount; i++) {
                const element = new Resistor(
                    `R${i}`,
                    [new Position(i * 10, 0), new Position(i * 10 + 20, 0)],
                    null,
                    new Properties({})
                );
                circuitService.addElement(element);
            }
            const addTime = performance.now() - addStart;
            const avgAddTime = addTime / elementCount;

            expect(avgAddTime).to.be.lessThan(1); // Each addition under 1ms

            // Benchmark element retrieval
            const retrieveStart = performance.now();
            const retrieveCount = 1000;
            for (let i = 0; i < retrieveCount; i++) {
                const elements = circuitService.getElements();
                expect(elements.length).to.equal(elementCount);
            }
            const retrieveTime = performance.now() - retrieveStart;
            const avgRetrieveTime = retrieveTime / retrieveCount;

            expect(avgRetrieveTime).to.be.lessThan(0.1); // Each retrieval under 0.1ms

            // Benchmark element deletion
            const deleteStart = performance.now();
            const elementsToDelete = circuitService.getElements().slice(0, 50);
            elementsToDelete.forEach(element => {
                circuitService.deleteElement(element.id);
            });
            const deleteTime = performance.now() - deleteStart;
            const avgDeleteTime = deleteTime / elementsToDelete.length;

            expect(avgDeleteTime).to.be.lessThan(1); // Each deletion under 1ms
        });
    });

    describe('Memory Usage', () => {
        it('should not leak memory during spatial index operations', () => {
            const iterations = 100;
            const elementsPerIteration = 50;
            
            let initialMemory = 0;
            if (typeof global.gc === 'function') {
                global.gc(); // Force garbage collection if available
            }

            for (let iter = 0; iter < iterations; iter++) {
                const elements = [];
                
                // Create elements
                for (let i = 0; i < elementsPerIteration; i++) {
                    elements.push({
                        id: `E${iter}-${i}`,
                        type: 'resistor',
                        nodes: [
                            new Position(Math.random() * 1000, Math.random() * 1000),
                            new Position(Math.random() * 1000, Math.random() * 1000)
                        ]
                    });
                }

                // Build and query spatial index
                spatialIndex.rebuild(elements);
                
                for (let q = 0; q < 10; q++) {
                    spatialIndex.findElementsAtPoint(Math.random() * 1000, Math.random() * 1000);
                }

                // Clear for next iteration
                spatialIndex.clear();

                // Check memory usage periodically
                if (iter % 20 === 0 && typeof process !== 'undefined' && process.memoryUsage) {
                    const memUsage = process.memoryUsage();
                    
                    if (iter === 0) {
                        initialMemory = memUsage.heapUsed;
                    }
                }
            }

            // Memory usage shouldn't grow significantly
            if (typeof process !== 'undefined' && process.memoryUsage && initialMemory > 0) {
                const finalMemory = process.memoryUsage().heapUsed;
                const memoryGrowth = (finalMemory - initialMemory) / 1024 / 1024;
                
                // Memory growth should be reasonable (less than 50MB for this test)
                expect(memoryGrowth).to.be.lessThan(50);
            }
        });
    });

    describe('Performance Regression Tests', () => {
        it('should maintain performance baselines', () => {
            const testCases = [
                { name: 'Small circuit (20 elements)', count: 20, queryCount: 100 },
                { name: 'Medium circuit (100 elements)', count: 100, queryCount: 100 },
                { name: 'Large circuit (500 elements)', count: 500, queryCount: 100 }
            ];

            testCases.forEach(testCase => {
                const elements = [];
                
                // Create elements
                for (let i = 0; i < testCase.count; i++) {
                    elements.push({
                        id: `E${i}`,
                        type: 'resistor',
                        nodes: [
                            new Position(Math.random() * 1000, Math.random() * 1000),
                            new Position(Math.random() * 1000, Math.random() * 1000)
                        ]
                    });
                }

                // Build spatial index
                const buildStart = performance.now();
                spatialIndex.rebuild(elements);
                const buildTime = performance.now() - buildStart;

                // Query performance
                const queryStart = performance.now();
                for (let i = 0; i < testCase.queryCount; i++) {
                    spatialIndex.findElementsAtPoint(Math.random() * 1000, Math.random() * 1000);
                }
                const queryTime = performance.now() - queryStart;
                const avgQueryTime = queryTime / testCase.queryCount;


                // Performance baselines
                expect(buildTime).to.be.lessThan(testCase.count * 0.2); // Linear in element count
                expect(avgQueryTime).to.be.lessThan(2); // Queries should be fast regardless of size
            });
        });
    });
});