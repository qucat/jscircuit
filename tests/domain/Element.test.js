// src/tests/domain/Element.test.js

import { expect } from 'chai';
import { Element } from '../../src/domain/entities/Element.js';

// Mock concrete implementation of Element for testing
class MockElement extends Element {
    constructor(id, position) {
        super(id, position);
        this.type = 'mock';
    }
}

describe('Element Class Tests', () => {
    it('An element should have a unique identifier', () => {
        const element = new MockElement('E1', { x: 10, y: 20 });
        expect(element.id).to.equal('E1');
    });

    it('An element should have a position', () => {
        const element = new MockElement('E2', { x: 30, y: 40 });
        expect(element.position.x).to.equal(30);
        expect(element.position.y).to.equal(40);
    });

    it('An element should support moving to a new position', () => {
        const element = new MockElement('E3', { x: 10, y: 20 });
        element.move({ x: 50, y: 60 });
        expect(element.position.x).to.equal(50);
        expect(element.position.y).to.equal(60);
    });

    it('An element should be abstract and not directly instantiable', () => {
        expect(() => new Element('E4', { x: 0, y: 0 })).to.throw('Cannot instantiate abstract class Element directly.');
    });

    it('An element should have a type defined by subclass', () => {
        const element = new MockElement('E5', { x: 10, y: 20 });
        expect(element.type).to.equal('mock');
    });

    it('An element should provide a description', () => {
        const element = new MockElement('E6', { x: 10, y: 20 });
        const description = element.describe();
        expect(description).to.include('E6');
        expect(description).to.include('mock');
        expect(description).to.include('10');
        expect(description).to.include('20');
    });
});
