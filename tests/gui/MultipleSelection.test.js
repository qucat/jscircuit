import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import { Circuit } from '../../src/domain/aggregates/Circuit.js';
import { CircuitService } from '../../src/application/CircuitService.js';
import { MultiSelectElementCommand } from '../../src/gui/commands/MultiSelectElementCommand.js';
import { ElementRegistry } from '../../src/config/settings.js';

describe('Multiple Selection State and Commands', () => {
    let circuitService;
    let multiSelectCommand;
    let testElements;
    let mockRenderer;

    beforeEach(() => {
        // Setup mock renderer with selection tracking
        mockRenderer = {
            selectedElements: new Set(),
            selectedElement: null,
            renderCalled: false,
            
            addToSelection(element) {
                if (element) {
                    this.selectedElements.add(element);
                    this.renderCalled = true;
                }
            },
            
            removeFromSelection(element) {
                if (this.selectedElements.has(element)) {
                    this.selectedElements.delete(element);
                    this.renderCalled = true;
                }
            },
            
            setSelectedElements(elements) {
                this.selectedElements.clear();
                if (Array.isArray(elements)) {
                    elements.forEach(element => this.selectedElements.add(element));
                } else if (elements instanceof Set) {
                    this.selectedElements = new Set(elements);
                }
                this.renderCalled = true;
            },
            
            getSelectedElements() {
                return Array.from(this.selectedElements);
            },
            
            clearSelection() {
                this.selectedElements.clear();
                this.selectedElement = null;
                this.renderCalled = true;
            },
            
            isElementSelected(element) {
                return this.selectedElements.has(element) || this.selectedElement === element;
            },
            
            render() {
                this.renderCalled = true;
            }
        };
        
        // Setup services
        const elementRegistry = ElementRegistry;
        const circuit = new Circuit();
        circuitService = new CircuitService(circuit, elementRegistry);
        
        // Setup command
        multiSelectCommand = new MultiSelectElementCommand(circuitService, mockRenderer);
        
        // Create test elements
        testElements = [
            { id: 'test1', type: 'Wire', nodes: [{ x: 10, y: 10 }, { x: 50, y: 10 }] },
            { id: 'test2', type: 'Wire', nodes: [{ x: 100, y: 10 }, { x: 140, y: 10 }] },
            { id: 'test3', type: 'Wire', nodes: [{ x: 200, y: 10 }, { x: 240, y: 10 }] }
        ];
        
        // Add elements to circuit
        testElements.forEach(element => {
            circuitService.addElement(element);
        });
    });

    describe('Mock Renderer Selection Support', () => {
        it('should initialize with empty selection', () => {
            expect(mockRenderer.getSelectedElements()).to.be.an('array').that.is.empty;
            expect(mockRenderer.selectedElements).to.be.an.instanceof(Set);
            expect(mockRenderer.selectedElements.size).to.equal(0);
        });

        it('should add single element to selection', () => {
            const element = testElements[0];
            mockRenderer.addToSelection(element);
            
            expect(mockRenderer.getSelectedElements()).to.have.length(1);
            expect(mockRenderer.getSelectedElements()[0]).to.equal(element);
            expect(mockRenderer.isElementSelected(element)).to.be.true;
            expect(mockRenderer.renderCalled).to.be.true;
        });

        it('should add multiple elements to selection', () => {
            const elements = [testElements[0], testElements[1]];
            
            elements.forEach(element => {
                mockRenderer.addToSelection(element);
            });
            
            expect(mockRenderer.getSelectedElements()).to.have.length(2);
            expect(mockRenderer.isElementSelected(testElements[0])).to.be.true;
            expect(mockRenderer.isElementSelected(testElements[1])).to.be.true;
            expect(mockRenderer.isElementSelected(testElements[2])).to.be.false;
        });

        it('should remove element from selection', () => {
            const elements = [testElements[0], testElements[1]];
            
            // Add elements
            elements.forEach(element => {
                mockRenderer.addToSelection(element);
            });
            
            // Remove one element
            mockRenderer.removeFromSelection(testElements[0]);
            
            expect(mockRenderer.getSelectedElements()).to.have.length(1);
            expect(mockRenderer.isElementSelected(testElements[0])).to.be.false;
            expect(mockRenderer.isElementSelected(testElements[1])).to.be.true;
        });

        it('should set multiple selected elements at once', () => {
            const elements = [testElements[0], testElements[2]];
            
            mockRenderer.setSelectedElements(elements);
            
            expect(mockRenderer.getSelectedElements()).to.have.length(2);
            expect(mockRenderer.isElementSelected(testElements[0])).to.be.true;
            expect(mockRenderer.isElementSelected(testElements[1])).to.be.false;
            expect(mockRenderer.isElementSelected(testElements[2])).to.be.true;
        });

        it('should clear all selections', () => {
            // Add multiple elements
            testElements.forEach(element => {
                mockRenderer.addToSelection(element);
            });
            
            expect(mockRenderer.getSelectedElements()).to.have.length(3);
            
            // Clear all
            mockRenderer.clearSelection();
            
            expect(mockRenderer.getSelectedElements()).to.be.empty;
            testElements.forEach(element => {
                expect(mockRenderer.isElementSelected(element)).to.be.false;
            });
        });
    });

    describe('MultiSelectElementCommand', () => {
        it('should execute multi-selection with array of elements', () => {
            const elements = [testElements[0], testElements[1]];
            
            multiSelectCommand.execute(elements);
            
            expect(mockRenderer.getSelectedElements()).to.have.length(2);
            expect(mockRenderer.isElementSelected(testElements[0])).to.be.true;
            expect(mockRenderer.isElementSelected(testElements[1])).to.be.true;
        });

        it('should execute multi-selection with single element', () => {
            const element = testElements[0];
            
            multiSelectCommand.execute(element);
            
            expect(mockRenderer.getSelectedElements()).to.have.length(1);
            expect(mockRenderer.isElementSelected(element)).to.be.true;
        });

        it('should replace existing selection by default', () => {
            // First select one element
            mockRenderer.addToSelection(testElements[2]);
            expect(mockRenderer.getSelectedElements()).to.have.length(1);
            
            // Execute command with different elements
            const newElements = [testElements[0], testElements[1]];
            multiSelectCommand.execute(newElements);
            
            expect(mockRenderer.getSelectedElements()).to.have.length(2);
            expect(mockRenderer.isElementSelected(testElements[0])).to.be.true;
            expect(mockRenderer.isElementSelected(testElements[1])).to.be.true;
            expect(mockRenderer.isElementSelected(testElements[2])).to.be.false;
        });

        it('should add to existing selection when additive flag is true', () => {
            // First select one element
            mockRenderer.addToSelection(testElements[2]);
            expect(mockRenderer.getSelectedElements()).to.have.length(1);
            
            // Execute command with additive flag
            const newElements = [testElements[0], testElements[1]];
            multiSelectCommand.execute(newElements, true);
            
            expect(mockRenderer.getSelectedElements()).to.have.length(3);
            testElements.forEach(element => {
                expect(mockRenderer.isElementSelected(element)).to.be.true;
            });
        });

        it('should store previous selection for undo', () => {
            // First select one element
            mockRenderer.addToSelection(testElements[2]);
            
            // Execute command
            const newElements = [testElements[0], testElements[1]];
            multiSelectCommand.execute(newElements);
            
            // Check that previous selection is stored
            expect(multiSelectCommand.previousSelection).to.be.an.instanceof(Set);
            expect(multiSelectCommand.previousSelection.has(testElements[2])).to.be.true;
        });
    });

    describe('Selection Box Integration Logic', () => {
        it('should identify elements within selection box coordinates', () => {
            // This tests the logic that would be used by GUIAdapter.finalizeSelection()
            const selectionBox = { 
                startX: 0, 
                startY: 0, 
                endX: 150, 
                endY: 50 
            };
            
            // Normalize box coordinates (same logic as in GUIAdapter)
            const left = Math.min(selectionBox.startX, selectionBox.endX);
            const right = Math.max(selectionBox.startX, selectionBox.endX);
            const top = Math.min(selectionBox.startY, selectionBox.endY);
            const bottom = Math.max(selectionBox.startY, selectionBox.endY);
            
            // Mock the isElementInBox logic (simplified version)
            const elementsInBox = testElements.filter(element => {
                return element.nodes.some(node => {
                    return node.x >= left && node.x <= right && 
                           node.y >= top && node.y <= bottom;
                });
            });
            
            expect(elementsInBox).to.have.length(2); // First two elements should be in box
            expect(elementsInBox).to.include(testElements[0]);
            expect(elementsInBox).to.include(testElements[1]);
            expect(elementsInBox).to.not.include(testElements[2]); // Third element is outside
        });

        it('should handle empty selection box', () => {
            const selectionBox = { 
                startX: 300, 
                startY: 300, 
                endX: 350, 
                endY: 350 
            };
            
            const left = Math.min(selectionBox.startX, selectionBox.endX);
            const right = Math.max(selectionBox.startX, selectionBox.endX);
            const top = Math.min(selectionBox.startY, selectionBox.endY);
            const bottom = Math.max(selectionBox.startY, selectionBox.endY);
            
            const elementsInBox = testElements.filter(element => {
                return element.nodes.some(node => {
                    return node.x >= left && node.x <= right && 
                           node.y >= top && node.y <= bottom;
                });
            });
            
            expect(elementsInBox).to.be.empty;
        });
    });
});
