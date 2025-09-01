/**
 * @file getImagePath.js
 * @description
 * Universal delegator that loads either the browser or Node implementation
 * of `getImagePath` dynamically, based on runtime environment.
 */

/**
 * Dynamically loads the correct implementation of getImagePath
 * depending on whether the code is running in the browser or Node.
 *
 * @param {string} type - Component type (e.g. "resistor").
 * @param {string} [variant="default"] - Variant ("hover", "selected", etc.)
 * @returns {Promise<string>} - The resolved asset path or mock path.
 */
export async function getImagePath(type, variant = "default") {
  const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";

  const module = isBrowser
    ? await import('./getImagePath.browser.js')
    : await import('./getImagePath.node.js');

  // Check which module was imported to see if its browser or Node version
  if (module.getImagePath.browser) {
    console.log("Using browser version");
  } else {
    console.log("Using Node version");
  }
  return module.getImagePath(type, variant);
}
