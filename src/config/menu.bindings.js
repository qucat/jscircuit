import guiConfig from "./gui.config.js";

/**
 * Expands component references in menu items
 * @param {Object} config - GUI configuration
 * @returns {Array} Expanded menu items
 */
function expandMenuItems(config) {
  const { components, menus } = config;
  
  return menus.flatMap(m =>
    (m.items ?? [])
      .filter(i => i && (i.id || i.component))
      .map(i => {
        if (i.component) {
          const componentDef = components[i.component];
          if (!componentDef) return null;
          
          const elementArg = componentDef.menuArg || i.component;
          return {
            id: i.id,
            label: componentDef.menuLabel,
            shortcut: componentDef.shortcut,
            action: { kind: 'command', name: 'addElement', args: [elementArg] }
          };
        }
        return i;
      })
      .filter(Boolean)
  );
}

const expandedItems = expandMenuItems(guiConfig);

/** id -> action spec (from YAML/JSON) */
export const ACTIONS = Object.fromEntries(
  expandedItems
    .filter(i => i.id)
    .map(i => [i.id, i.action ?? { kind: "todo", note: "no action in config" }])
);

/** shortcut -> id (for keyboard) */
export const KEYMAP = Object.fromEntries(
  expandedItems
    .filter(i => i.shortcut && i.id && !i.disabled)
    .map(i => [i.shortcut, i.id])
);

