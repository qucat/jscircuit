import { Element } from '../../../src/domain/entities/Element.js';
import { Label } from '../../../src/domain/valueObjects/Label.js';
import { Properties } from '../../../src/domain/valueObjects/Properties.js';

/**
 * MyInductor - A custom inductor element
 */
export class MyInductor extends Element {
  /**
   * Creates a MyInductor instance
   * 
   * @param {string} id - Unique identifier
   * @param {Position[]} nodes - Connection points (array of Position objects)
   * @param {string|Label} label - Display label
   * @param {Object|Properties} properties - Element properties
   */
  constructor(id, nodes, label, properties = {}) {
    // Convert label to Label object if needed
    const labelInstance = label instanceof Label ? label : new Label(label || 'L1');
    
    // Convert properties to Properties object
    // Note: Properties only accepts numbers, "variable", or undefined
    const validProps = {};
    if (properties.inductance !== undefined) {
      validProps.inductance = properties.inductance;
    } else {
      validProps.inductance = 5e-9; // default: 5 nanohenries
    }
    const propsInstance = properties instanceof Properties 
      ? properties 
      : new Properties(validProps);
    
    // Call parent constructor
    super(id, nodes, labelInstance, propsInstance);
    
    // Set the type (lowercase to match registry registration key)
    this.type = 'myinductor';
  }
}
