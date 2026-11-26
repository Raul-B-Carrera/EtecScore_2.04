export function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

export function getInitials(value = '') {
  return String(value).trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('') || 'ET';
}

export function byId(id) {
  return document.getElementById(id);
}

export function setText(element, value) {
  if (element) element.textContent = value ?? '';
}
