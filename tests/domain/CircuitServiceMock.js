// tests/domain/CircuitServiceMock.js
// Mock CircuitService for testing purposes
import { Circuit } from '../../src/domain/aggregates/Circuit.js';
import { CircuitService } from '../../src/application/CircuitService.js';
import { ElementRegistry } from '../../src/config/registry.js';

/**
 * Creates a fully functional CircuitService instance for use in tests.
 * 
 * @returns {CircuitService}
 */
export function createCircuitServiceFixture() {
  const circuit = new Circuit();
  return new CircuitService(circuit, ElementRegistry);
}
