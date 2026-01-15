// static/MenuBar.js

/**
 * @fileoverview Config-driven menubar that renders File/Edit/… style menus
 * and dispatches semantic UI actions as CustomEvents (`ui:action`).
 * It is a thin UI adapter: **UI → GUIAdapter → State → Renderer**.
 *
 * CSS is injected once per document; no extra stylesheet needed.
 *
 * Example:
 *   import { MenuBar } from './MenuBar.js';
 *   const menu = new MenuBar(document.getElementById('menubar'));
 *   menu.renderFromConfig({
 *     brand: 'Python',
 *     menus: [{ label: 'File', items: [{ id: 'file.open', label: 'Open' }]}]
 *   });
 *   document.addEventListener('ui:action', e => console.log(e.detail.id));
 */

/**
 * @typedef {{
 *   id: string,
 *   label: string,
 *   shortcut?: string,
 *   disabled?: boolean,
 *   checked?: boolean,
 *   type?: undefined
 * }} MenuItem
 *
 * @typedef {{
 *   type: 'separator'
 * }} MenuSeparator
 *
 * @typedef {{
 *   label: string,
 *   items: Array<MenuItem|MenuSeparator>
 * }} MenuGroup
 *
 * @typedef {{
 *   brand?: string,
 *   menus: !Array<!MenuGroup>
 * }} MenuConfig
 */

const MENU_CSS = `
/* ---------- ALIGNMENT: one parent controls width ---------- */
.circuit-stage{
  width: min(100%, 1200px);   /* change/remove max as you like */
  margin: 0 auto;             /* center the block */
  display: flex;
  flex-direction: column;     /* menu on top, canvas below */
}
.circuit-stage > .menubar,
.circuit-stage > #circuitCanvas{
  width: 100%;
  box-sizing: border-box;     /* borders included in width */
}
#circuitCanvas{
  display:block;
  height:600px;               /* set your desired height */
  background:#fff;
  border:1px solid #d0d0d0;
  border-top:none;            /* seamless join with the menu */
  border-radius:0 0 10px 10px;
  position: relative; z-index: 1;  /* sits under open panels */
}

/* ---------- Menu (unchanged except: position RELATIVE, not sticky) ---------- */
/* Stacking: menu above canvas, but panels only hit-test when open */
.menubar { position: relative; z-index: 2; }
.menu-panel {
  position: absolute; top: 100%; left: 0;
  min-width: 240px;
  display: none; pointer-events: none; z-index: 10;
}
.menu-button[aria-expanded="true"] .menu-panel {
  display: block; pointer-events: auto;
}

/* Theme tokens */
:root{
  --mb-dark:#2b2b2b; --mb-fg:#f7f7f7;
  --mb-panel-bg: linear-gradient(#ecf3fb, #dbe6f4);
  --mb-panel-fg:#161616; --mb-sep:#c5d2e2;
  --mb-hover: rgba(0,0,0,.08);
  --mb-shadow: 0 14px 40px rgba(0,0,0,.28), 0 6px 16px rgba(0,0,0,.25);
  --mb-radius: 14px; --mb-item-h: 32px;
  --font: -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,"Apple Color Emoji","Segoe UI Emoji";
}

/* Menubar strip (relative, not sticky) */
.menubar{
  position: relative;
  display:flex; align-items:center; gap:8px;
  height:34px; padding:0 10px;
  background:var(--mb-dark); color:var(--mb-fg);
  font-family:var(--font); user-select:none;
  border:1px solid #d0d0d0; border-bottom:none; border-radius:10px 10px 0 0;
}
.menubar .app-name{ font-weight:600; margin-right:6px; opacity:.9; }

/* Top-level buttons */
.menu-button{
  position:relative; height:100%;
  display:flex; align-items:center; padding:0 10px;
  border-radius:8px; cursor:default; outline:none;
}
.menu-button[aria-expanded="true"], .menu-button:focus{ background:rgba(255,255,255,.1); }

/* Dropdown panel */
.menu-panel{
  background:var(--mb-panel-bg); color:var(--mb-panel-fg);
  border-radius:var(--mb-radius); box-shadow:var(--mb-shadow);
  padding:8px 0; transform: translateY(6px);
}

/* Items */
.menu-item{
  height:var(--mb-item-h); display:grid; grid-template-columns:1fr auto;
  align-items:center; gap:22px; padding:0 16px; font-size:14px;
}
.menu-item[aria-disabled="true"]{ opacity:.45; pointer-events:none; }
.menu-item[data-type="separator"]{ height:8px; padding:4px 0; }
.menu-item[data-type="separator"]::after{
  content:""; display:block; height:1px; background:var(--mb-sep); margin:0 12px;
}
.menu-item:hover, .menu-item[aria-selected="true"]{ background:var(--mb-hover); }
.menu-item .shortcut{ opacity:.7; font-variant-numeric: tabular-nums; }
.menu-item .label{ display:flex; align-items:center; gap:8px; }
.menu-item .check{ width:18px; display:inline-block; text-align:center; }
`;

/** Ensures the component CSS is present once in the document. */
function ensureStyleInjected() {
  if (document.getElementById('qucat-menubar-style')) return;
  const style = document.createElement('style');
  style.id = 'qucat-menubar-style';
  style.textContent = MENU_CSS;
  document.head.appendChild(style);
}

export class MenuBar {
  /**
   * @param {!HTMLElement} mount Root element where the menubar is rendered.
   */
  constructor(mount){
    /** @private @const {!HTMLElement} */
    this.mount = mount;
    /** @private @type {!Array<!HTMLElement>} */
    this.buttons = [];
    /** @private @type {number} */
    this.openIndex = -1;

    ensureStyleInjected();
    this._bindGlobalClosers();
  }

  /**
   * Renders the menubar using a config object.
   * Safe to call multiple times; it re-renders from scratch.
   * @param {!MenuConfig} cfg
   * @return {void}
   */
  renderFromConfig(cfg){
    this.mount.classList.add('menubar'); // in case the host element didn't have it
    this.mount.innerHTML = '';
    this.buttons = [];

    if (cfg.brand){
      const b = document.createElement('div');
      b.className = 'app-name';
      b.textContent = cfg.brand;
      this.mount.appendChild(b);
    }

    this.buttons = cfg.menus.map((menu, i) => this._addMenu(menu, i));
  }

  /**
   * @param {!MenuGroup} menu
   * @param {number} idx
   * @return {!HTMLElement} The menu button element.
   * @private
   */
  _addMenu(menu, idx){
    const btn = document.createElement('div');
    btn.className = 'menu-button';
    btn.tabIndex = 0;
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('role', 'menuitem');
    btn.textContent = menu.label;

    const panel = document.createElement('div');
    panel.className = 'menu-panel';
    panel.setAttribute('role', 'menu');
    panel.innerHTML = menu.items.map((it) => this.itemHTML(it)).join('');
    btn.appendChild(panel);

    // Toggle when clicking the button label area.
    btn.addEventListener('click', (e) => { if (e.target === btn) this.toggle(idx); });

    // Hover to switch when another menu is already open.
    btn.addEventListener('mouseenter', () => {
      if (this.openIndex !== -1 && this.openIndex !== idx) this.open(idx);
    });

    // Click on an item → emit `ui:action`.
    panel.addEventListener('click', (ev) => {
      const el = ev.target.closest('.menu-item');
      if (!el || el.dataset.type === 'separator') return;
      if (el.getAttribute('aria-disabled') === 'true') return;
      this.closeAll();
      document.dispatchEvent(new CustomEvent('ui:action', { detail: { id: el.dataset.id }}));
    });

    // Keyboard navigation within the panel.
    panel.addEventListener('keydown', (ev) => this._panelKeyNav(ev, panel));

    this.mount.appendChild(btn);
    return btn;
  }

  /**
   * Returns the HTML string for a menu item or separator.
   * @param {MenuItem|MenuSeparator} it
   * @return {string}
   */
  itemHTML(it){
    if (/** @type {MenuSeparator} */ (it).type === 'separator') {
      return `<div class="menu-item" role="separator" data-type="separator"></div>`;
    }
    const item = /** @type {MenuItem} */ (it);
    const disabled = !!item.disabled;
    const shortcut = item.shortcut ? `<span class="shortcut">${item.shortcut}</span>` : '';
    const check = item.checked ? `<span class="check">•</span>` : `<span class="check"></span>`;
    return `<div class="menu-item" role="menuitem" tabindex="0" data-id="${item.id}" data-type="item" aria-disabled="${disabled}">
              <div class="label">${check}<span>${item.label}</span></div>${shortcut}
            </div>`;
  }

  /**
   * Toggles a specific menu by index.
   * @param {number} i
   * @return {void}
   */
  toggle(i){ this.openIndex === i ? this.closeAll() : this.open(i); }

  /**
   * Opens a specific menu by index and focuses its first item.
   * @param {number} i
   * @return {void}
   */
  open(i){
    this.closeAll();
    this.openIndex = i;
    const btn = this.buttons[i];
    if (!btn) return;
    btn.setAttribute('aria-expanded', 'true');
    this._focusFirst(btn.querySelector('.menu-panel'));
  }

  /**
   * Closes any open menu.
   * @return {void}
   */
  closeAll(){
    this.openIndex = -1;
    this.buttons.forEach(b => b.setAttribute('aria-expanded', 'false'));
  }

  /**
   * Enables/disables and/or checks/unchecks a specific item at runtime.
   * @param {string} id
   * @param {{disabled?: boolean, checked?: boolean}} patch
   * @return {void}
   */
  update(id, patch){
    const el = this.mount.querySelector(`.menu-item[data-id="${id}"]`);
    if (!el) return;
    if ('disabled' in patch) el.setAttribute('aria-disabled', String(!!patch.disabled));
    if ('checked' in patch) {
      const dot = el.querySelector('.check');
      if (patch.checked && dot && !dot.textContent) dot.textContent = '•';
      if (!patch.checked && dot && dot.textContent) dot.textContent = '';
    }
  }

  /**
   * Focus helpers & keyboard navigation
   * @param {!Element} panel
   * @return {void}
   * @private
   */
  _focusFirst(panel){
    const first = panel?.querySelector('.menu-item[data-type="item"]');
    if (/** @type {?HTMLElement} */ (first)) first.focus();
  }

  /**
   * @param {!Element} panel
   * @param {number} dir +1 next, -1 prev
   * @private
   */
  _focusNext(panel, dir){
    const items = [...panel.querySelectorAll('.menu-item[data-type="item"]')];
    const idx = items.indexOf(document.activeElement);
    const next = items[(idx + (dir > 0 ? 1 : items.length - 1)) % items.length];
    if (/** @type {?HTMLElement} */ (next)) next.focus();
  }

  /**
   * Handles keyboard navigation within an open menu panel.
   * - ArrowUp/ArrowDown: move through items
   * - ArrowLeft/ArrowRight: switch menus
   * - Enter: activate focused item
   * - Esc: close menus
   * - Type-ahead: jump to first item starting with typed letter
   * @param {!KeyboardEvent} ev
   * @param {!Element} panel
   * @private
   */
  _panelKeyNav(ev, panel){
    switch (ev.key) {
      case 'ArrowDown': ev.preventDefault(); this._focusNext(panel, +1); break;
      case 'ArrowUp':   ev.preventDefault(); this._focusNext(panel, -1); break;
      case 'Enter':     ev.preventDefault(); (/** @type {?HTMLElement} */ (document.activeElement))?.click(); break;
      case 'Escape':    this.closeAll(); break;
      case 'ArrowLeft': this.open(Math.max(0, this.openIndex - 1)); break;
      case 'ArrowRight':this.open(Math.min(this.buttons.length - 1, this.openIndex + 1)); break;
      default:
        if (ev.key.length === 1){
          const k = ev.key.toLowerCase();
          const items = [...panel.querySelectorAll('.menu-item[data-type="item"]')];
          const found = items.find((it) => it.textContent.trim().toLowerCase().startsWith(k));
          if (/** @type {?HTMLElement} */ (found)) found.focus();
        }
    }
  }

  /** @private */
  _bindGlobalClosers(){
    document.addEventListener('click', (e) => {
      if (!this.mount.contains(e.target)) this.closeAll();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeAll();
    });
  }
}
