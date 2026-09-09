import { expect } from 'chai';
import { ElementRegistry } from '../../src/config/registry.js';
import { NonLinearInductor } from '../../src/domain/entities/NonLinearInductor.js';
import { Position } from '../../src/domain/valueObjects/Position.js';
import { Properties } from '../../src/domain/valueObjects/Properties.js';

describe('NonLinearInductor', () => {
    const nodes = [new Position(0, 0), new Position(50, 0)];

    it('is registered under the "nonlinearinductor" type', () => {
        expect(ElementRegistry.getTypes()).to.include('nonlinearinductor');
    });

    it('is created via the registry with a default orientation and no default energy terms', () => {
        const factory = ElementRegistry.get('nonlinearinductor');
        const element = factory('N1', nodes, null, new Properties({}));

        expect(element).to.be.instanceOf(NonLinearInductor);
        expect(element.type).to.equal('nonlinearinductor');
        expect(element.properties.values.orientation).to.equal(0);
        expect(element.properties.values.e2).to.equal(undefined);
        expect(element.properties.values.e2Label).to.equal(undefined);
    });

    it('accepts per-term string labels as valid properties', () => {
        const properties = new Properties({ e2Label: 'E2', e3Label: 'E3', e4Label: 'E4', orientation: 0 });

        expect(properties.values.e2Label).to.equal('E2');
        expect(properties.values.e3Label).to.equal('E3');
        expect(properties.values.e4Label).to.equal('E4');
    });

    it('has no single overall label - it is null even when energy term labels are set', () => {
        const factory = ElementRegistry.get('nonlinearinductor');
        const element = factory('N2', nodes, null, new Properties({ e2Label: 'E2' }));

        expect(element.label).to.equal(null);
    });
});
