/**
 * modal.js — dialog modal sederhana (aria, Escape, fokus awal).
 * Render ke #modal-root.
 */

import { icon } from './icons.js';
import { escapeHtml } from '../format.js';

/**
 * @param {{title:string, body?:string, footer?:string, onClose?:Function, size?:'sm'|'md'|'lg'}} opts
 * @returns {{close:Function}}
 */
export function openModal(opts) {
  closeModal();

  const root = document.getElementById('modal-root');
  if (!root) return { close: () => {} };

  const prevFocus = document.activeElement;
  const id = `bodyfit-modal-${Math.random().toString(36).slice(2, 8)}`;
  const sizeClass = opts.size === 'lg' ? ' modal-lg' : opts.size === 'sm' ? ' modal-sm' : '';

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';

  const dialog = document.createElement('div');
  dialog.className = `modal${sizeClass}`;
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', `${id}-title`);

  const header = document.createElement('div');
  header.className = 'modal-header';
  header.innerHTML = `
    <h2 class="modal-title" id="${id}-title">${escapeHtml(opts.title)}</h2>
    <button type="button" class="modal-close" data-modal-close aria-label="Tutup dialog" title="Tutup">
      ${icon('x', { size: 18 })}
    </button>
  `;

  const body = document.createElement('div');
  body.className = 'modal-body';
  if (opts.body) body.innerHTML = opts.body;

  const footer = document.createElement('div');
  footer.className = 'modal-footer';
  if (opts.footer) footer.innerHTML = opts.footer;

  dialog.append(header, body, footer);
  root.append(backdrop, dialog);

  if (opts.size === 'lg') {
    dialog.style.width = 'min(720px, calc(100vw - 32px))';
  }

  const close = () => {
    root.innerHTML = '';
    backdrop.remove();
    dialog.remove();
    document.removeEventListener('keydown', onKey, true);
    if (prevFocus && prevFocus.focus) prevFocus.focus();
    if (opts.onClose) opts.onClose();
  };

  const onKey = (e) => {
    if (e.key === 'Escape') close();
  };
  document.addEventListener('keydown', onKey, true);

  dialog.querySelector('[data-modal-close]')?.addEventListener('click', close);
  dialog.querySelector('[data-modal-close], [data-modal-cancel]')?.focus();

  return { close };
}

export function closeModal() {
  const root = document.getElementById('modal-root');
  if (root) {
    root.innerHTML = '';
    document.querySelectorAll('.modal-backdrop').forEach((b) => b.remove());
  }
}

/**
 * Konfirmasi sederhana.
 * @returns {Promise<boolean>}
 */
export function confirmDialog({ title, body, confirmText = 'Ya, lanjutkan', danger = false }) {
  return new Promise((resolve) => {
    const { close } = openModal({
      title,
      body,
      footer: `
        <button type="button" class="btn btn-ghost" data-modal-cancel>Tutup</button>
        <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-modal-confirm>${escapeHtml(confirmText)}</button>
      `,
      onClose: () => resolve(false),
    });
    const dialog = document.querySelector('#modal-root .modal');
    dialog.addEventListener('click', (e) => {
      if (e.target.closest('[data-modal-confirm]')) {
        resolve(true);
        close();
      } else if (e.target.closest('[data-modal-cancel]')) {
        close();
      }
    });
  });
}

/**
 * Toast peringatan sederhana (temporer).
 */
export function toast(message, tone = 'info') {
  const existing = document.getElementById('bodyfit-toast');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.id = 'bodyfit-toast';
  el.setAttribute('role', 'status');
  el.innerHTML = `<div class="alert alert-${tone}"><span class="alert-icon">${icon('info', { size: 18 })}</span><div class="alert-body"><strong>${escapeHtml(message)}</strong></div></div>`;
  el.style.position = 'fixed';
  el.style.top = '76px';
  el.style.left = '50%';
  el.style.transform = 'translateX(-50%)';
  el.style.zIndex = '200';
  el.style.maxWidth = 'min(480px, calc(100vw - 32px))';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}
