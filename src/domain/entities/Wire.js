import { Element } from './Element.js';
import { Properties } from '../valueObjects/Properties.js';

export class Wire extends Element {
    constructor(id, nodes, label = null, properties = new Properties()) {
        super(id, nodes, label, properties);
        this.type = 'wire';
    }
}
