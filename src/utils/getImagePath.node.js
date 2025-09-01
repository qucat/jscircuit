/**
 * Pure mock for Node/CI environment (no import.meta.url or URL class).
 */
export function getImagePath(type, variant = "default") {
  if (!type || typeof type !== "string") {
    throw new Error("Invalid or unknown type");
  }

  const base = type.charAt(0).toUpperCase();
  const suffix = variant === "default" ? "" : `_${variant}`;
  return `/assets/${base}${suffix}.png`;
}
