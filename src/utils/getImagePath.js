/**
 * @file getImagePath.js
 * @description
 * Resolves image path for circuit element icons based on type and UI variant.
 * Compatible with browser (using import.meta.url), Node test environments (via `mock` flag),
 * and Jupyter Widget environments (using conditional imports).
 *
 * @example
 * getImagePath("resistor")                 // → file:///.../R.png (browser) or imported asset (jupyter)
 * getImagePath("resistor", "hover")       // → file:///.../R_hover.png or imported asset
 * getImagePath("resistor", "hover", { mock: true }) // → /assets/R_hover.png (tests)
 */

import { ElementRegistry } from '../domain/factories/ElementRegistry.js';

/**
 * Detects if we're running in Node.js environment
 */
function isNode() {
  return typeof process !== 'undefined' && process.versions && process.versions.node;
}

/**
 * Resolves image path based on circuit element type and optional UI variant.
 * Automatically detects environment and uses appropriate loading strategy.
 * Gets the image prefix from ElementRegistry to avoid hardcoded mappings.
 *
 * @param {string} type - Element type (e.g., "resistor", "capacitor").
 * @param {string} [variant="default"] - UI variant (e.g., "hover", "selected").
 * @param {Object} [options]
 * @param {boolean} [options.mock=false] - If true, returns a simplified mock path for test environments.
 * @returns {string|Promise<string>} Path to the asset.
 */
export async function getImagePath(type, variant = "default", { mock = false } = {}) {
  if (!type || typeof type !== "string") {
    throw new Error("Invalid or unknown type");
  }

  // Build mapping from ElementRegistry types to image prefixes
  const registeredTypes = ElementRegistry.getTypes();
  const typeMap = {};
  
  // Create mapping based on registered types
  registeredTypes.forEach(registeredType => {
    // Use a simple convention: first character uppercase for most types
    // Special cases can be handled as needed
    let prefix;
    switch (registeredType.toLowerCase()) {
      case 'inductor':
        prefix = 'L'; // Inductor uses L, not I
        break;
      default:
        prefix = registeredType.charAt(0).toUpperCase();
    }
    typeMap[registeredType.toLowerCase()] = prefix;
  });
  
  const base = typeMap[type.toLowerCase()] || type.charAt(0).toUpperCase();
  const suffix = variant === "default" ? "" : `_${variant}`;
  const filename = `${base}${suffix}.png`;

  // Mock path for test environments
  if (mock) {
    return `/assets/${filename}`;
  }

  // Node.js environment - use URL-based approach
  if (isNode()) {
    const path = `/assets/${filename}`;
    return new URL(path, import.meta.url).href;
  }

  // Browser environment - try dynamic import first (for bundlers like webpack/vite)
  // If that fails, fallback to URL-based approach
  try {
    const importedAsset = await import(`../../assets/${filename}`);
    return importedAsset.default || importedAsset;
  } catch (error) {
    // Fallback to URL-based approach if dynamic import fails
    const path = `/assets/${filename}`;
    return new URL(path, import.meta.url).href;
  }
}
