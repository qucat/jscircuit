/**
 * @file getImagePath.browser.js
 * @description
 * Browser-specific implementation of getImagePath.
 * Uses import.meta.url to resolve relative paths at runtime in supported bundlers.
 */

/**
 * Resolves the path to a circuit element image (browser version).
 *
 * @param {string} type - The component type (e.g., "resistor").
 * @param {string} [variant="default"] - UI variant (e.g., "hover").
 * @returns {string} - Browser-safe image URL.
 */
export function getImagePath(type, variant = "default") {
  if (!type || typeof type !== "string") {
    throw new Error("Invalid or unknown type");
  }

  const base = type.charAt(0).toUpperCase();
  const suffix = variant === "default" ? "" : `_${variant}`;
  return new URL(`../../../assets/${base}${suffix}.png`, import.meta.url).href;
}
