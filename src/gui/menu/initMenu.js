// static/initMenu.js
import { MenuBar } from "./MenuBar.js";
import guiConfig from "../../config/gui.config.js";
import { localizeGuiConfig } from "../i18n/i18n.js";

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

function buildMenuConfig() {
  const localized = localizeGuiConfig(guiConfig);
  return expandComponentReferences(localized);
}

/** @type {MenuBar|null} */
let menuInstance = null;

function renderMenu() {
  const config = buildMenuConfig();
  if (!menuInstance) {
    menuInstance = new MenuBar(document.getElementById("menubar"));
  }
  menuInstance.renderFromConfig(config);
}

export function initMenu() {
  renderMenu();
  document.addEventListener("locale:change", renderMenu);

  // Note: Keyboard shortcuts are handled by GUIAdapter.bindShortcuts()
  // to avoid double-binding. The menu only handles click events.

  return menuInstance; // so you can enable/disable items later: menu.update("edit.copy",{disabled:false})
}
