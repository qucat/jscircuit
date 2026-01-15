/**
 * RotateElementCommand: Handles element rotation using CircuitService
 */
export class RotateElementCommand {
    constructor(circuitService, circuitRenderer, targetAngle = null) {
        this.circuitService = circuitService;
        this.circuitRenderer = circuitRenderer;
        this.targetAngle = targetAngle;
        this.previousStates = new Map();
    }

    execute() {
        const selectedElements = this.circuitRenderer.getSelectedElements();
        
        if (selectedElements.length === 0) {
            return false;
        }

        // Store previous states for undo
        this.previousStates.clear();
        selectedElements.forEach(element => {
            this.previousStates.set(element.id, {
                nodes: element.nodes.map(node => ({ x: node.x, y: node.y }))
            });
            
            // Perform rotation
            this.circuitService.rotateElement(element.id, this.targetAngle || 90);
        });

        return true;
    }

    undo() {
        // Restore previous positions
        this.previousStates.forEach((previousState, elementId) => {
            const element = this.circuitService.circuit.elements.find(el => el.id === elementId);
            if (element) {
                previousState.nodes.forEach((originalNode, index) => {
                    if (element.nodes[index]) {
                        element.nodes[index].x = originalNode.x;
                        element.nodes[index].y = originalNode.y;
                    }
                });
            }
        });
        
        this.circuitRenderer.render();
    }
}
