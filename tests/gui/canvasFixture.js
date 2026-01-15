import sinon from "sinon";

export function createMockCanvas() {
    return {
        width: 800,
        height: 600,
        getBoundingClientRect: sinon.stub().returns({
            width: 800,
            height: 600,
            left: 0,
            top: 0,
            right: 800,
            bottom: 600
        }),
        getContext: sinon.stub().returns({
            clearRect: sinon.spy(),
            beginPath: sinon.spy(),
            moveTo: sinon.spy(),
            lineTo: sinon.spy(),
            stroke: sinon.spy(),
            arc: sinon.spy(),
            fill: sinon.spy(),
            fillRect: sinon.spy(),
            strokeRect: sinon.spy(),
            fillText: sinon.spy(),
            drawImage: sinon.spy(),
            save: sinon.spy(),
            restore: sinon.spy(),
            translate: sinon.spy(),
            scale: sinon.spy(),
            rotate: sinon.spy(),
            resetTransform: sinon.spy(),
            setTransform: sinon.spy(),
            transform: sinon.spy(),
            isPointInPath: sinon.stub().returns(false),
            isPointInStroke: sinon.stub().returns(false),
            // Add properties that ResistorRenderer sets
            strokeStyle: '#000000',
            fillStyle: '#000000',
            lineWidth: 1,
        }),
        addEventListener: sinon.spy(),
        removeEventListener: sinon.spy(),
        style: {
            cursor: 'default'
        },

    };
}
