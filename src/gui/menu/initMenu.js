// static/initMenu.js
import { MenuBar } from "./MenuBar.js";

async function loadJSON(url){ const r = await fetch(url); if(!r.ok) throw new Error(url); return r.json(); }

/**
 * Expands component references in menu items to full menu item definitions
 * @param {Object} guiConfig - Full GUI configuration with components and menus
 * @returns {Object} Config with expanded menu items
 */
function expandComponentReferences(guiConfig) {
  const { components, menus } = guiConfig;
  
  const expandedMenus = menus.map(menu => ({
    ...menu,
    items: menu.items.map(item => {
      // If item has a component reference, expand it
      if (item.component) {
        const componentDef = components[item.component];
        if (!componentDef) {
          console.warn(`[initMenu] Component "${item.component}" not found`);
          return item;
        }
        
        // Use menuArg if specified (for Wire), otherwise use component key
        const elementArg = componentDef.menuArg || item.component;
        
        return {
          id: item.id,
          label: componentDef.menuLabel,
          shortcut: componentDef.shortcut,
          action: { kind: 'command', name: 'addElement', args: [elementArg] }
        };
      }
      return item;
    })
  }));
  
  return { ...guiConfig, menus: expandedMenus };
}

export async function initMenu(configUrl = "./static/gui.config.json") {
  const cfg = await loadJSON(configUrl);
  
  // Expand component references to full menu items
  const expandedConfig = expandComponentReferences(cfg);
  
  const menu = new MenuBar(document.getElementById("menubar"));
  menu.renderFromConfig(expandedConfig);

  // Note: Keyboard shortcuts are handled by GUIAdapter.bindShortcuts()
  // to avoid double-binding. The menu only handles click events.

  return menu; // so you can enable/disable items later: menu.update("edit.copy",{disabled:false})
}

