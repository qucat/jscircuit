import { Position } from "../domain/valueObjects/Position.js";

/**
 * @class WireSplitService
 * @description
 * Handles wire splitting logic for cases where:
 * - A node touches the body of an existing wire
 * - A wire’s body overlaps with an existing node
 *
 * Public API:
 * - trySplitAtNode(position): checks all wires
 * - splitWireAtPointIfTouching(wire, position): checks a specific wire
 */
export class WireSplitService {
  /**
   * @param {CircuitService} circuitService - Service managing the circuit elements.
   * @param {ElementRegistry} elementRegistry - Registry for creating new wire elements.
   */
  constructor(circuitService, elementRegistry) {
    this.circuitService = circuitService;
    this.elementRegistry = elementRegistry;
  }

  /**
   * Attempts to split any wire in the circuit if the given position lies on a wire segment.
   * Skips the endnodes.
   *
   * @param {Position} node - The node potentially touching a wire body.
   * @returns {boolean} True if a wire was split; otherwise false.
   */
  trySplitAtNode(node) {
    for (const element of this.circuitService.getElements()) {
      if (element.type !== "wire") continue;
      if (!Array.isArray(element.nodes) || element.nodes.length !== 2) continue;

      const [start, end] = element.nodes;

      // Check if node is on the body (not terminal)
      if (
        this._isOnSegment(node, start, end) &&
        !node.equals(start) &&
        !node.equals(end)
      ) {
        this._splitWire(element, node);
        return true;
      }
    }
    return false;
  }

  /**
   * Attempts to split the provided wire at the given node, if the node lies on its body.
   * Used when a wire is actively being moved toward an existing node.
   *
   * @param {Element} wire - The wire being dragged.
   * @param {Position} node - The position possibly intersecting the wire's body.
   * @returns {boolean} True if the wire was split; otherwise false.
   */
  splitWireAtPointIfTouching(wire, node) {
    if (!Array.isArray(wire.nodes) || wire.nodes.length !== 2) return false;

    const [start, end] = wire.nodes;

    if (
      this._isOnSegment(node, start, end) &&
      !node.equals(start) &&
      !node.equals(end)
    ) {
      this._splitWire(wire, node);
      return true;
    }

    return false;
  }

  /**
   * Determines whether node `p` lies on the segment from `a` to `b`.
   * Uses a cross product for collinearity and dot product for bounds.
   * Ignores floating node noise with a tolerance.
   *
   * @private
   * @param {Position} p - The node to test.
   * @param {Position} a - Start of the segment.
   * @param {Position} b - End of the segment.
   * @returns {boolean} True if node lies on segment a→b (excluding endnodes).
   */
  _isOnSegment(p, a, b) {
    // Collinearity check (cross product)
    const cross = (b.y - a.y) * (p.x - a.x) - (b.x - a.x) * (p.y - a.y);
    if (Math.abs(cross) > 1e-6) return false;

    // Bounds check (dot product)
    const dot = (p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y);
    const lenSq = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;

    return dot > 0 && dot < lenSq;
  }

  /**
   * Splits a wire into two segments at the given node. The original wire is deleted.
   *
   * @private
   * @param {Element} wire - The original wire to split.
   * @param {Position} splitPoint - The node where the wire is split.
   */
  _splitWire(wire, splitPoint) {

    // Delete the original wire before creating new ones to avoid ID conflicts.
    this.circuitService.deleteElement(wire.id);

    const wireFactory = this.elementRegistry.get("wire");

    // Create two new wires split at `splitPoint`
    const wire1 = wireFactory(undefined, [wire.nodes[0], splitPoint], null, {});
    const wire2 = wireFactory(undefined, [splitPoint, wire.nodes[1]], null, {});

    this.circuitService.addElement(wire1);
    this.circuitService.addElement(wire2);
  }
}
