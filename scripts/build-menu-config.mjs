import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";

const src = "src/config/gui.config.yaml";
const dstMenu = "dist/static/menu.config.json";  // Legacy menu config for backward compatibility
const dstGui = "dist/static/gui.config.json";    // Full GUI config

// Ensure the destination directory exists
fs.mkdirSync(path.dirname(dstGui), { recursive: true });

const yamlText = fs.readFileSync(src, "utf8");
const obj = parse(yamlText);

// Write full GUI config
fs.writeFileSync(dstGui, JSON.stringify(obj, null, 2));
console.log(`✓ Wrote ${dstGui}`);

// Write menu-only config for backward compatibility (if needed)
const menuOnly = { menus: obj.menus };
fs.writeFileSync(dstMenu, JSON.stringify(menuOnly, null, 2));
console.log(`✓ Wrote ${dstMenu} (legacy)`);

