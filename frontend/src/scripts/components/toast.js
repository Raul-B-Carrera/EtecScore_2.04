import { escapeHTML } from '../utils/dom.js';

export function showToast(message, type = 'info', duration = 3400) {
  let region = document.getElementById('toast-region');
  if (!region) {
    region = document.createElement('div');
    region.id = 'toast-region';
    region.className = 'toast-region';
    region.setAttribute('aria-live', 'polite');
    document.body.append(region);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'success' ? 'is-success' : type === 'error' ? 'is-error' : ''}`;
  const text = document.createElement('p');
  text.textContent = message;
  toast.append(text);
  region.append(toast);
  window.setTimeout(() => toast.remove(), duration);
}
