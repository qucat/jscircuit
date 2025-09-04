import menuConfig from "../../dist/static/menu.config.json" assert { type: "json" };

/** id -> action spec (from YAML/JSON) */
export const ACTIONS = Object.fromEntries(
  menuConfig.menus.flatMap(m =>
    (m.items ?? [])
      .filter(i => i && i.id)
      .map(i => [i.id, i.action ?? { kind: "todo", note: "no action in config" }])
  )
);

/** shortcut -> id (for keyboard) */
export const KEYMAP = Object.fromEntries(
  menuConfig.menus.flatMap(m =>
    (m.items ?? [])
      .filter(i => i && i.shortcut && i.id && !i.disabled)
      .map(i => [i.shortcut, i.id])
  )
);
