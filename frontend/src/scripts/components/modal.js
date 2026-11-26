import { escapeHTML } from '../utils/dom.js';

let activeBackdrop = null;

export function closeModal() {
  if (!activeBackdrop) return;
  activeBackdrop.remove();
  activeBackdrop = null;
  document.body.classList.remove('modal-open');
}

export function openModal({ eyebrow = 'EtecScore', title, description = '', body = '', footer = '', size = '' }) {
  closeModal();
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <section class="modal-panel ${size}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <header class="modal-header">
        <div><span class="eyebrow">${escapeHTML(eyebrow)}</span><h2 id="modal-title">${escapeHTML(title)}</h2>${description ? `<p>${escapeHTML(description)}</p>` : ''}</div>
        <button class="modal-close" type="button" aria-label="Fechar modal" data-modal-close>×</button>
      </header>
      <div class="modal-body">${body}</div>
      ${footer ? `<footer class="modal-footer">${footer}</footer>` : ''}
    </section>`;
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop || event.target.closest('[data-modal-close]')) closeModal();
  });
  document.addEventListener('keydown', handleEscape, { once: true });
  document.body.append(backdrop);
  document.body.classList.add('modal-open');
  activeBackdrop = backdrop;
  const firstInput = backdrop.querySelector('input:not([type="hidden"]), select, textarea, button');
  firstInput?.focus({ preventScroll: true });
  return backdrop;
}

function handleEscape(event) {
  if (event.key === 'Escape') closeModal();
  else if (activeBackdrop) document.addEventListener('keydown', handleEscape, { once: true });
}
