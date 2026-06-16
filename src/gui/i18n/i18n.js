/**
 * Lightweight i18n for JSCircuit GUI (English / Simplified Chinese).
 */
import zh from './locales/zh.js';

const STORAGE_KEY = 'jscircuit.locale';
const SUPPORTED = ['en', 'zh'];

/** Available languages shown in the settings dialog. */
export const LOCALE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
];

/** @type {Record<string, object>} */
const CATALOGS = { zh };

/** @type {'en'|'zh'} */
let currentLocale = 'en';

/**
 * Read a nested value by dot-separated path.
 * @param {object} obj
 * @param {string} path
 * @returns {string|undefined}
 */
function getByPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

/**
 * Replace `{name}` placeholders in a template string.
 * @param {string} template
 * @param {Record<string, string|number>} [vars]
 */
function interpolate(template, vars = {}) {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}

/**
 * Look up a menu-item label by id (ids may contain dots, e.g. view.zoomIn).
 * @param {string} id
 * @param {string} fallback
 */
function lookupMenuItemTranslation(id, fallback) {
  if (currentLocale === 'en') return fallback;
  const items = CATALOGS[currentLocale]?.menuItem;
  if (items && typeof items[id] === 'string') return items[id];
  return fallback;
}

/**
 * Initialize locale from localStorage or browser language.
 */
export function initI18n() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && SUPPORTED.includes(stored)) {
    currentLocale = /** @type {'en'|'zh'} */ (stored);
  } else {
    const browserLang = (navigator.language || 'en').toLowerCase();
    currentLocale = browserLang.startsWith('zh') ? 'zh' : 'en';
  }
  applyDocumentLocale();
}

/** @returns {'en'|'zh'} */
export function getLocale() {
  return currentLocale;
}

/**
 * Switch UI language and notify listeners.
 * @param {'en'|'zh'} locale
 */
export function setLocale(locale) {
  if (!SUPPORTED.includes(locale) || locale === currentLocale) return;
  currentLocale = /** @type {'en'|'zh'} */ (locale);
  localStorage.setItem(STORAGE_KEY, currentLocale);
  applyDocumentLocale();
  document.dispatchEvent(new CustomEvent('locale:change', { detail: { locale: currentLocale } }));
}

function applyDocumentLocale() {
  document.documentElement.lang = currentLocale === 'zh' ? 'zh-CN' : 'en';
  document.title = tr('app.title');
}

/**
 * Translate a dot-path key. Falls back to English default or the key itself.
 * @param {string} key
 * @param {Record<string, string|number>} [vars]
 * @param {string} [fallback]
 */
export function t(key, vars, fallback) {
  const fb = fallback ?? key;
  if (currentLocale === 'en') {
    return typeof vars === 'object' && vars !== null ? interpolate(fb, vars) : fb;
  }
  const value = getByPath(CATALOGS[currentLocale], key);
  if (typeof value !== 'string') return fb;
  return typeof vars === 'object' && vars !== null ? interpolate(value, vars) : value;
}

/** English defaults used when locale is `en`. */
const EN_DEFAULTS = {
  'app.title': 'Circuit Designer',
  'propertyPanel.header': 'Circuit Editor',
  'propertyPanel.cancel': 'Cancel',
  'propertyPanel.ok': 'OK',
  'propertyPanel.fallbackTitle': 'Configure {type} properties',
  'propertyPanel.labelField': 'Label',
  'propertyPanel.labelPlaceholder': 'Enter element label',
  'propertyPanel.warning.title': '⚠️ Incomplete Properties',
  'propertyPanel.warning.intro': 'Please specify at least one of the following:',
  'propertyPanel.warning.labelItem': 'A label for the component',
  'propertyPanel.warning.propertyItem': 'A property value (resistance, capacitance, etc.)',
  'propertyPanel.warning.footer':
    'This ensures the component can be properly identified and used in the circuit.',
  'propertyPanel.warning.ok': 'OK',
  'pasteDialog.title': 'Paste Netlist',
  'pasteDialog.description':
    'Paste a QuCat netlist below (e.g. from a Jupyter cell) and click Import.',
  'pasteDialog.cancel': 'Cancel',
  'pasteDialog.import': 'Import',
  'languageDialog.title': 'Language',
  'languageDialog.description': 'Select the display language for menus and dialogs.',
  'languageDialog.cancel': 'Cancel',
  'languageDialog.save': 'Save',
  'command.noElementsToCopy': 'No circuit elements to copy. Please add some components first.',
  'command.copyError': 'Error copying netlist to clipboard: {message}',
  'command.netlistCopied': 'Netlist copied to clipboard',
  'command.copyFailed': 'Failed to copy to clipboard',
  'command.noElementsToSave': 'No circuit elements to save. Please add some components first.',
  'command.saveError': 'Error saving netlist: {message}',
  'command.noValidElementsInFile': 'No valid circuit elements found in the selected file.',
  'command.loadError': 'Error loading netlist file: {message}',
  'command.noValidElementsInPaste': 'No valid circuit elements found in the pasted text.',
  'command.importSuccess': 'Imported {count} element(s) from netlist.',
  'command.invalidNetlist': 'Invalid netlist: {message}',
};

/**
 * Translate with built-in English default.
 * @param {string} key
 * @param {Record<string, string|number>} [vars]
 */
export function tr(key, vars) {
  return t(key, vars, EN_DEFAULTS[key] ?? key);
}

/**
 * Return a deep-cloned, localized copy of gui.config.
 * @param {object} config
 */
export function localizeGuiConfig(config) {
  const c = JSON.parse(JSON.stringify(config));

  if (currentLocale === 'en') return c;

  for (const menu of c.menus) {
    const menuLabel = t(`menu.${menu.label}`, undefined, menu.label);
    menu.label = menuLabel;
    for (const item of menu.items) {
      if (item.id && item.label) {
        item.label = lookupMenuItemTranslation(item.id, item.label);
      }
    }
  }

  for (const [key, comp] of Object.entries(c.components)) {
    if (comp.menuLabel) {
      comp.menuLabel = t(`component.${key}.menuLabel`, undefined, comp.menuLabel);
    }
    const pp = comp.propertyPanel;
    if (!pp) continue;
    if (pp.title) pp.title = t(`component.${key}.propertyPanel.title`, undefined, pp.title);
    if (pp.description) {
      pp.description = t(`component.${key}.propertyPanel.description`, undefined, pp.description);
    }
    if (pp.helpText) {
      pp.helpText = t(`component.${key}.propertyPanel.helpText`, undefined, pp.helpText);
    }
    for (const field of pp.fields || []) {
      const fieldKey = `component.${key}.propertyPanel.field.${field.key}`;
      field.label = t(fieldKey, undefined, field.label);
    }
  }

  return c;
}
