// gridSnapping.test.js

import { expect } from 'chai';
import { Circuit } from '../../src/domain/aggregates/Circuit.js';
import { CircuitService } from '../../src/application/CircuitService.js';
import { ElementRegistry } from '../../src/config/registry.js';
import { AddElementCommand } from '../../src/gui/commands/AddElementCommand.js';

describe('Grid & Snapping (UI/Command layer)', function() {
  let circuit;
  let circuitService;

  // The command under test:
  let addElementCommand;


  beforeEach(function() {
    circuit = new Circuit();
    circuitService = new CircuitService(circuit, ElementRegistry);

    // We'll create an instance of the command with a "snappingEnabled" switch
    // so we can test both scenarios (on/off).
    addElementCommand = new AddElementCommand(
      circuitService,
      /* circuitRenderer = */ null, 
      ElementRegistry, 
      /* elementType = */ 'resistor'
    );
  });

  it('should not snap if snapping is disabled', function() {
    // Turn snapping OFF
    addElementCommand.enableSnapping = false; 
    addElementCommand.gridSpacing = 10;       // just for demonstration

    // Execute the command with custom node positions
    addElementCommand.execute([
      { x: 13, y: 27 },
      { x: 75, y: 82 }
    ]);

    const elements = circuitService.getElements();
    expect(elements).to.have.lengthOf(1);

    const [added] = elements;
    expect(added.nodes[0].x).to.equal(13);
    expect(added.nodes[0].y).to.equal(27);
    expect(added.nodes[1].x).to.equal(75);
    expect(added.nodes[1].y).to.equal(82);
  });

  it('should snap positions to the nearest grid if snapping is enabled', function() {
    // Turn snapping ON
    addElementCommand.enableSnapping = true;
    addElementCommand.gridSpacing = 10;

    addElementCommand.execute([
      { x: 13, y: 27 },
      { x: 75, y: 82 }
    ]);

    const elements = circuitService.getElements();
    expect(elements).to.have.lengthOf(1);

    const [added] = elements;
    // With grid=10, (13,27) => (10,30) and (75,82) => (80,80)
    expect(added.nodes[0].x).to.equal(10);
    expect(added.nodes[0].y).to.equal(30);
    expect(added.nodes[1].x).to.equal(80);
    expect(added.nodes[1].y).to.equal(80);
  });
});
