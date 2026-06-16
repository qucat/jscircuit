/**
 * Language selection dialog — follows PropertyPanel / paste-dialog patterns.
 */
import { getLocale, setLocale, tr, LOCALE_OPTIONS } from '../i18n/i18n.js';

export class LanguageDialog {
  /**
   * Open the language settings dialog.
   * @param {{ onSave?: (locale: string) => void, onCancel?: () => void }} [callbacks]
   */
  static show(callbacks = {}) {
    if (typeof document === 'undefined' || !document.body) return;
    if (document.querySelector('.language-dialog-overlay')) return;

    LanguageDialog._ensureStyles();

    let selected = getLocale();

    const overlay = document.createElement('div');
    overlay.className = 'language-dialog-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'language-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');

    const header = document.createElement('div');
    header.className = 'language-dialog-header';
    const title = document.createElement('h3');
    title.textContent = tr('languageDialog.title');
    header.appendChild(title);

    const content = document.createElement('div');
    content.className = 'language-dialog-content';

    const desc = document.createElement('p');
    desc.className = 'language-dialog-desc';
    desc.textContent = tr('languageDialog.description');
    content.appendChild(desc);

    const list = document.createElement('div');
    list.className = 'language-dialog-list';
    list.setAttribute('role', 'radiogroup');
    list.setAttribute('aria-label', tr('languageDialog.title'));

    const optionInputs = [];

    for (const opt of LOCALE_OPTIONS) {
      const row = document.createElement('label');
      row.className = 'language-dialog-option';

      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'jscircuit-locale';
      input.value = opt.code;
      input.checked = opt.code === selected;

      input.addEventListener('change', () => {
        if (input.checked) selected = opt.code;
      });

      const label = document.createElement('span');
      label.textContent = opt.label;

      row.append(input, label);
      list.appendChild(row);
      optionInputs.push(input);
    }

    content.appendChild(list);

    const actions = document.createElement('div');
    actions.className = 'language-dialog-actions';

    const btnCancel = document.createElement('button');
    btnCancel.type = 'button';
    btnCancel.className = 'language-dialog-cancel';
    btnCancel.textContent = tr('languageDialog.cancel');

    const btnSave = document.createElement('button');
    btnSave.type = 'button';
    btnSave.className = 'language-dialog-save';
    btnSave.textContent = tr('languageDialog.save');

    actions.append(btnCancel, btnSave);
    dialog.append(header, content, actions);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const close = () => {
      document.removeEventListener('keydown', onKeyDown, true);
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    };

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        callbacks.onCancel?.();
      }
    };

    btnCancel.addEventListener('click', () => {
      close();
      callbacks.onCancel?.();
    });

    btnSave.addEventListener('click', () => {
      close();
      setLocale(selected);
      callbacks.onSave?.(selected);
    });

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        close();
        callbacks.onCancel?.();
      }
    });

    document.addEventListener('keydown', onKeyDown, true);
    optionInputs.find((input) => input.checked)?.focus();
  }

  /** @private */
  static _ensureStyles() {
    if (document.getElementById('language-dialog-styles')) return;

    const style = document.createElement('style');
    style.id = 'language-dialog-styles';
    style.textContent = `
      .language-dialog-overlay {
        position: fixed;
        inset: 0;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 10002;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }

      .language-dialog {
        background: #fff;
        border-radius: 14px;
        box-shadow: 0 14px 40px rgba(0,0,0,.28), 0 6px 16px rgba(0,0,0,.25);
        width: 400px;
        max-width: 90vw;
        border: 1px solid #d0d0d0;
        overflow: hidden;
      }

      .language-dialog-header {
        background: linear-gradient(#ecf3fb, #dbe6f4);
        padding: 12px 20px;
        border-bottom: 1px solid #c5d2e2;
      }

      .language-dialog-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #161616;
      }

      .language-dialog-content {
        padding: 20px;
      }

      .language-dialog-desc {
        margin: 0 0 16px;
        font-size: 13px;
        color: #555;
        line-height: 1.4;
      }

      .language-dialog-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .language-dialog-option {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border: 1px solid #d0d0d0;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        color: #161616;
        transition: background 120ms ease;
      }

      .language-dialog-option:hover {
        background: rgba(0, 0, 0, 0.04);
      }

      .language-dialog-option input {
        margin: 0;
        accent-color: #3498db;
      }

      .language-dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding: 0 20px 20px;
      }

      .language-dialog-cancel,
      .language-dialog-save {
        padding: 8px 18px;
        border-radius: 6px;
        font-size: 13px;
        cursor: pointer;
      }

      .language-dialog-cancel {
        border: 1px solid #ccc;
        background: #fff;
        color: #161616;
      }

      .language-dialog-save {
        border: none;
        background: #3498db;
        color: #fff;
      }

      .language-dialog-cancel:hover {
        background: #f5f5f5;
      }

      .language-dialog-save:hover {
        background: #2980b9;
      }
    `;
    document.head.appendChild(style);
  }
}
