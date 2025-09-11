import { Element } from "./Element.js";

export class Capacitor extends Element  {
    constructor(id, nodes, label = null, properties) {
        super(id, nodes, label, properties);
        this.type = 'capacitor';
    }
}
