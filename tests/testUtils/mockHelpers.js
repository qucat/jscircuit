// Fix mock service to include exportState and importState methods
// This ensures tests pass with the new command pattern

// Add these methods to any mock circuitService objects in tests:
const mockCircuitServiceMethods = {
  exportState: () => JSON.stringify({ elements: [] }),
  importState: (state) => {},
  addElement: (element) => {},
  getElements: () => [],
  on: () => {},
  emit: () => {}
};