import { Circuit } from '../src/domain/aggregates/Circuit.js';
import { CircuitService } from '../src/application/CircuitService.js';
import { MultiSelectElementCommand } from '../src/gui/commands/MultiSelectElementCommand.js';
import { Wire } from '../src/domain/entities/Wire.js';
import { Position } from '../src/domain/valueObjects/Position.js';
import { Properties } from '../src/domain/valueObjects/Properties.js';
import { generateId } from '../src/utils/idGenerator.js';

/**
 * Test suite for multiple selection functionality (commands and state only)
 */
describe('Multiple Selection Command Tests', () => {

    let circuitService;
    let mockRenderer;

    beforeEach(() => {
        // Create circuit service
        const circuit = new Circuit([]);
        circuitService = new CircuitService(circuit);

        // Create mock renderer with multiple selection support
        mockRenderer = {
            selectedElements: new Set(),
            clearSelection: function() { 
                this.selectedElements.clear(); 
            },
            addToSelection: function(element) { 
                this.selectedElements.add(element); 
            },
            setSelectedElements: function(elements) { 
                this.selectedElements.clear();
                if (Array.isArray(elements)) {
                    elements.forEach(el => this.selectedElements.add(el));
                }
            },
            getSelectedElements: function() { 
                return Array.from(this.selectedElements); 
            },
            render: function() { /* mock render */ }
        };
    });

    test('MultiSelectElementCommand should select multiple elements', () => {
        // Create test elements
        const element1 = new Wire(
            generateId(),
            [new Position(0, 0), new Position(10, 0)],
            new Properties({ resistance: 0 })
        );
        
        const element2 = new Wire(
            generateId(),
            [new Position(20, 0), new Position(30, 0)],
            new Properties({ resistance: 0 })
        );

        // Add elements to circuit
        circuitService.addElement(element1);
        circuitService.addElement(element2);

        // Create command
        const command = new MultiSelectElementCommand(circuitService, mockRenderer);

        // Execute multi-selection
        command.execute([element1, element2]);

        // Verify both elements are selected
        const selectedElements = mockRenderer.getSelectedElements();
        expect(selectedElements).toHaveLength(2);
        expect(selectedElements).toContain(element1);
        expect(selectedElements).toContain(element2);
    });

    test('MultiSelectElementCommand should clear previous selection when not additive', () => {
        // Create test elements
        const element1 = new Wire(
            generateId(),
            [new Position(0, 0), new Position(10, 0)],
            new Properties({ resistance: 0 })
        );
        
        const element2 = new Wire(
            generateId(),
            [new Position(20, 0), new Position(30, 0)],
            new Properties({ resistance: 0 })
        );

        const element3 = new Wire(
            generateId(),
            [new Position(40, 0), new Position(50, 0)],
            new Properties({ resistance: 0 })
        );

        // Add elements to circuit
        circuitService.addElement(element1);
        circuitService.addElement(element2);
        circuitService.addElement(element3);

        // Pre-select element1
        mockRenderer.addToSelection(element1);
        expect(mockRenderer.getSelectedElements()).toContain(element1);

        // Create command and select element2 and element3 (should clear element1)
        const command = new MultiSelectElementCommand(circuitService, mockRenderer);
        command.execute([element2, element3], false); // Not additive

        // Verify only element2 and element3 are selected
        const selectedElements = mockRenderer.getSelectedElements();
        expect(selectedElements).toHaveLength(2);
        expect(selectedElements).not.toContain(element1);
        expect(selectedElements).toContain(element2);
        expect(selectedElements).toContain(element3);
    });

    test('MockRenderer should support multiple selection operations', () => {
        // Create test elements
        const element1 = new Wire(
            generateId(),
            [new Position(0, 0), new Position(10, 0)],
            new Properties({ resistance: 0 })
        );
        
        const element2 = new Wire(
            generateId(),
            [new Position(20, 0), new Position(30, 0)],
            new Properties({ resistance: 0 })
        );

        // Test adding to selection
        mockRenderer.addToSelection(element1);
        expect(mockRenderer.getSelectedElements()).toHaveLength(1);
        expect(mockRenderer.getSelectedElements()).toContain(element1);

        // Test adding another element
        mockRenderer.addToSelection(element2);
        expect(mockRenderer.getSelectedElements()).toHaveLength(2);
        expect(mockRenderer.getSelectedElements()).toContain(element2);

        // Test setting selection (should replace)
        mockRenderer.setSelectedElements([element1]);
        expect(mockRenderer.getSelectedElements()).toHaveLength(1);
        expect(mockRenderer.getSelectedElements()).toContain(element1);
        expect(mockRenderer.getSelectedElements()).not.toContain(element2);

        // Test clearing selection
        mockRenderer.clearSelection();
        expect(mockRenderer.getSelectedElements()).toHaveLength(0);
    });

    test('MultiSelectElementCommand should handle empty selection', () => {
        const command = new MultiSelectElementCommand(circuitService, mockRenderer);

        // Execute with empty array
        command.execute([]);

        // Should have no selected elements
        expect(mockRenderer.getSelectedElements()).toHaveLength(0);
    });

    test('MultiSelectElementCommand should handle null elements', () => {
        const element1 = new Wire(
            generateId(),
            [new Position(0, 0), new Position(10, 0)],
            new Properties({ resistance: 0 })
        );

        circuitService.addElement(element1);

        const command = new MultiSelectElementCommand(circuitService, mockRenderer);

        // Execute with mix of valid and null elements
        command.execute([element1, null, undefined]);

        // Should only select the valid element
        const selectedElements = mockRenderer.getSelectedElements();
        expect(selectedElements).toHaveLength(1);
        expect(selectedElements).toContain(element1);
    });
});
