import { expect } from 'chai';
import { Circuit } from '../../src/domain/aggregates/Circuit.js';
import { CircuitService } from '../../src/application/CircuitService.js';
import { CopyElementsCommand } from '../../src/gui/commands/CopyElementsCommand.js';
import { PasteElementsCommand } from '../../src/gui/commands/PasteElementsCommand.js';
import { ElementFactory } from '../../src/domain/factories/ElementFactory.js';
import { Position } from '../../src/domain/valueObjects/Position.js';
import { Properties } from '../../src/domain/valueObjects/Properties.js';
import { Label } from '../../src/domain/valueObjects/Label.js';
import { ElementRegistry } from '../../src/config/registry.js';

describe('Copy-Paste Commands', () => {
  let circuit;
  let circuitService;
  let circuitRenderer;
  let copyCommand;
  let pasteCommand;

  beforeEach(() => {
    circuit = new Circuit();
    circuitService = new CircuitService(circuit, ElementRegistry);
    
    // Setup mock renderer with selection tracking
    circuitRenderer = {
      selectedElements: new Set(),
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
        this.renderCalled = true;
      },
      
      render() {
        this.renderCalled = true;
      }
    };
    
    copyCommand = new CopyElementsCommand(circuitService, circuitRenderer);
    pasteCommand = new PasteElementsCommand(circuitService, circuitRenderer);
  });

  afterEach(() => {
    // Clear clipboard between tests
    CopyElementsCommand.clearClipboard();
  });

  describe('CopyElementsCommand', () => {
    it('should copy selected elements to clipboard', () => {
      // Create and add test elements
      const resistor = ElementFactory.create('resistor', 'R1', 
        [new Position(100, 100), new Position(150, 100)], 
        new Properties({ resistance: 1000 }),
        new Label('Test Resistor')
      );
      const capacitor = ElementFactory.create('capacitor', 'C1',
        [new Position(200, 100), new Position(250, 100)],
        new Properties({ capacitance: 100e-6 }),
        new Label('Test Capacitor')
      );

      circuitService.addElement(resistor);
      circuitService.addElement(capacitor);

      // Select both elements
      circuitRenderer.setSelectedElements([resistor, capacitor]);

      // Execute copy command
      copyCommand.execute();

      // Verify clipboard content
      const clipboardContent = CopyElementsCommand.getClipboardContent();
      expect(clipboardContent).to.have.length(2);
      expect(clipboardContent[0].type).to.equal('resistor'); // Element.type is lowercase internally
      expect(clipboardContent[1].type).to.equal('capacitor');
      expect(clipboardContent[0].label.value).to.equal('Test Resistor');
      expect(clipboardContent[1].label.value).to.equal('Test Capacitor');
    });

    it('should handle copying with no selected elements', () => {
      // No elements selected
      circuitRenderer.setSelectedElements([]);

      // Execute copy command
      copyCommand.execute();

      // Verify clipboard is empty
      const clipboardContent = CopyElementsCommand.getClipboardContent();
      expect(clipboardContent).to.have.length(0);
    });

    it('should not be undoable (copy doesnt modify circuit)', () => {
      expect(copyCommand.canUndo()).to.be.false;
    });
  });

  describe('PasteElementsCommand', () => {
    it('should paste elements from clipboard with new IDs and offset positions', () => {
      // Create original element
      const originalResistor = ElementFactory.create('resistor', 'R1', 
        [new Position(100, 100), new Position(150, 100)], 
        new Properties({ resistance: 1000 }),
        new Label('Original')
      );

      circuitService.addElement(originalResistor);
      circuitRenderer.setSelectedElements([originalResistor]);

      // Copy the element
      copyCommand.execute();

      // Verify circuit has 1 element
      expect(circuitService.circuit.elements).to.have.length(1);

      // Paste the element
      pasteCommand.execute();

      // Verify circuit now has 2 elements
      expect(circuitService.circuit.elements).to.have.length(2);

      // Find the pasted element (should have different ID)
      const pastedElement = circuitService.circuit.elements.find(el => el.id !== 'R1');
      expect(pastedElement).to.exist;
      expect(pastedElement.type).to.equal('resistor'); // Element.type is lowercase internally
      expect(pastedElement.label.value).to.equal('Original');

      // Verify offset positioning
      const originalPos = originalResistor.nodes[0];
      const pastedPos = pastedElement.nodes[0];
      expect(pastedPos.x).to.equal(originalPos.x + 20); // PASTE_OFFSET_X
      expect(pastedPos.y).to.equal(originalPos.y + 20); // PASTE_OFFSET_Y

      // Verify properties are preserved
      expect(pastedElement.properties.values.resistance).to.equal(1000);
    });

    it('should paste multiple elements', () => {
      // Create and copy multiple elements
      const resistor = ElementFactory.create('resistor', 'R1', 
        [new Position(100, 100), new Position(150, 100)], 
        new Properties({ resistance: 1000 })
      );
      const capacitor = ElementFactory.create('capacitor', 'C1',
        [new Position(200, 100), new Position(250, 100)],
        new Properties({ capacitance: 100e-6 })
      );

      circuitService.addElement(resistor);
      circuitService.addElement(capacitor);
      circuitRenderer.setSelectedElements([resistor, capacitor]);

      // Copy both elements
      copyCommand.execute();

      // Initial circuit has 2 elements
      expect(circuitService.circuit.elements).to.have.length(2);

      // Paste elements
      pasteCommand.execute();

      // Circuit should now have 4 elements
      expect(circuitService.circuit.elements).to.have.length(4);

      // Verify pasted elements are selected
      const selectedElements = circuitRenderer.getSelectedElements();
      expect(selectedElements).to.have.length(2);
      expect(selectedElements.every(el => el.id !== 'R1' && el.id !== 'C1')).to.be.true;
    });

    it('should handle pasting with empty clipboard', () => {
      // Clear clipboard
      CopyElementsCommand.clearClipboard();

      // Try to paste
      pasteCommand.execute();

      // Circuit should remain empty
      expect(circuitService.circuit.elements).to.have.length(0);
    });

    it('should be undoable', () => {
      // Setup: copy an element
      const resistor = ElementFactory.create('resistor', 'R1', 
        [new Position(100, 100), new Position(150, 100)]
      );
      circuitService.addElement(resistor);
      circuitRenderer.setSelectedElements([resistor]);
      copyCommand.execute();

      // Paste the element
      pasteCommand.execute();
      expect(circuitService.circuit.elements).to.have.length(2);
      expect(pasteCommand.canUndo()).to.be.true;

      // Undo the paste
      pasteCommand.undo();
      expect(circuitService.circuit.elements).to.have.length(1);
      expect(circuitService.circuit.elements[0].id).to.equal('R1');
    });

    it('should preserve element properties and labels during paste', () => {
      // Create element with complex properties (use valid properties only)
      const inductor = ElementFactory.create('inductor', 'L1',
        [new Position(300, 200), new Position(350, 200)],
        new Properties({ 
          inductance: 1e-3, 
          orientation: 90
        }),
        new Label('Complex Inductor')
      );

      circuitService.addElement(inductor);
      circuitRenderer.setSelectedElements([inductor]);

      // Copy and paste
      copyCommand.execute();
      pasteCommand.execute();

      // Find pasted element
      const pastedElement = circuitService.circuit.elements.find(el => el.id !== 'L1');
      expect(pastedElement).to.exist;

      // Verify all properties preserved
      expect(pastedElement.properties.values.inductance).to.equal(1e-3);
      expect(pastedElement.properties.values.orientation).to.equal(90);
      expect(pastedElement.label.value).to.equal('Complex Inductor');
    });
  });

  describe('Copy-Paste Integration', () => {
    it('should support copy-paste workflow with undo/redo', () => {
      // Create original circuit
      const resistor = ElementFactory.create('resistor', 'R1', 
        [new Position(100, 100), new Position(150, 100)]
      );
      circuitService.addElement(resistor);
      circuitRenderer.setSelectedElements([resistor]);

      // Copy element
      copyCommand.execute();
      expect(CopyElementsCommand.hasClipboardContent()).to.be.true;

      // Initial state: 1 element
      expect(circuitService.circuit.elements).to.have.length(1);

      // Paste (should add 1 element)
      pasteCommand.execute();
      expect(circuitService.circuit.elements).to.have.length(2);

      // Undo paste (should remove pasted element)
      pasteCommand.undo();
      expect(circuitService.circuit.elements).to.have.length(1);
      expect(circuitService.circuit.elements[0].id).to.equal('R1');

      // Clipboard should still have content
      expect(CopyElementsCommand.hasClipboardContent()).to.be.true;

      // Can paste again
      const pasteCommand2 = new PasteElementsCommand(circuitService, circuitRenderer);
      pasteCommand2.execute();
      expect(circuitService.circuit.elements).to.have.length(2);
    });
  });
});