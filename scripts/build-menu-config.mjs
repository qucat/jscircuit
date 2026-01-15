import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";

const src = "src/config/gui.config.yaml";
const dstJs = "src/config/gui.config.js";        // Generated as source for static import in bundle
const dstMenu = "dist/static/menu.config.json";  // Legacy menu config for backward compatibility

// Ensure directories exist
fs.mkdirSync(path.dirname(dstJs), { recursive: true });
fs.mkdirSync(path.dirname(dstMenu), { recursive: true });

const yamlText = fs.readFileSync(src, "utf8");
const obj = parse(yamlText);

// Write as JavaScript module for static import (no external file dependency)
// Generate in src/ so it's part of the source tree and can be bundled
const jsContent = `// Auto-generated from src/config/gui.config.yaml\n// Do not edit manually - rebuild with: npm run menu:build\n\nexport default ${JSON.stringify(obj, null, 2)};\n`;
fs.writeFileSync(dstJs, jsContent);
console.log(`✓ Wrote ${dstJs} (auto-generated, not in git)`);

// Write menu-only config for backward compatibility (if needed)
const menuOnly = { menus: obj.menus };
fs.writeFileSync(dstMenu, JSON.stringify(menuOnly, null, 2));
console.log(`✓ Wrote ${dstMenu} (legacy)`);

