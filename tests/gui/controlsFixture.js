import sinon from "sinon";

export function createMockControls() {
    return {
        querySelector: (selector) => {
            // Remove leading '#' if present
            const id = selector.startsWith('#') ? selector.slice(1) : selector;
            return document.getElementById(id);
        }
    };
}