import sinon from "sinon";

export function createMockCanvas() {
    return {
        width: 800,
        height: 600,
        getContext: sinon.stub().returns({
            clearRect: sinon.spy(),
            beginPath: sinon.spy(),
            moveTo: sinon.spy(),
            lineTo: sinon.spy(),
            stroke: sinon.spy(),
            arc: sinon.spy(),
            fill: sinon.spy(),
            fillRect: sinon.spy(),
            fillText: sinon.spy(),
            save: sinon.spy(),
            restore: sinon.spy(),
            translate: sinon.spy(),
            scale: sinon.spy(),
        }),
        addEventListener: sinon.spy(),
        removeEventListener: sinon.spy(),

    };
}
