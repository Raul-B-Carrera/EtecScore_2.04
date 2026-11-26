import { searchGlobal } from '../api/searchApi.js';
import { escapeHTML, getInitials } from '../utils/dom.js';
import { showToast } from './toast.js';

let searchBackdrop = null;
let debounceId = null;

function closeSearch() {
  searchBackdrop?.remove();
  searchBackdrop = null;
}

function renderResults(container, results, query) {
  if (query.trim().length < 2) {
    container.innerHTML = '<p class="search-empty">Digite pelo menos 2 caracteres para pesquisar.</p>';
    return;
  }
  if (!results.length) {
    container.innerHTML = '<p class="search-empty">Nenhum resultado encontrado.</p>';
    return;
  }
  container.innerHTML = `<div class="search-results-label">Resultados encontrados</div>${results.map((item) => {
    const isTeam = item.tipo === 'equipe' || item.tipo === 'team';
    return `<button type="button" class="search-result" data-search-type="${isTeam ? 'team' : 'athlete'}" data-search-id="${escapeHTML(item.id)}">
      <span class="team-mark">${escapeHTML(getInitials(item.nome))}</span>
      <span class="search-result-copy"><strong>${escapeHTML(item.nome)}</strong><small>${isTeam ? 'Equipe' : 'Atleta'}</small></span>
      <span class="search-result-arrow">↗</span>
    </button>`;
  }).join('')}`;
}

export function openSearch() {
  closeSearch();
  searchBackdrop = document.createElement('div');
  searchBackdrop.className = 'search-backdrop';
  searchBackdrop.innerHTML = `
    <section class="search-panel" role="dialog" aria-modal="true" aria-label="Pesquisa global">
      <div class="search-panel-top">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"></circle><path d="m16 16 5 5"></path></svg>
        <input id="global-search-input" type="search" placeholder="Pesquisar equipes e atletas..." autocomplete="off">
        <kbd>ESC</kbd>
      </div>
      <div class="search-results" id="global-search-results"><p class="search-empty">Digite um nome para começar a pesquisa.</p></div>
    </section>`;
  searchBackdrop.addEventListener('click', (event) => { if (event.target === searchBackdrop) closeSearch(); });
  document.body.append(searchBackdrop);
  const input = searchBackdrop.querySelector('#global-search-input');
  const resultsContainer = searchBackdrop.querySelector('#global-search-results');
  input.focus();
  input.addEventListener('input', () => {
    window.clearTimeout(debounceId);
    const query = input.value;
    if (query.trim().length < 2) { renderResults(resultsContainer, [], query); return; }
    resultsContainer.innerHTML = '<p class="search-empty">Pesquisando...</p>';
    debounceId = window.setTimeout(async () => {
      try { renderResults(resultsContainer, await searchGlobal(query), query); }
      catch (error) { resultsContainer.innerHTML = `<p class="search-empty">${escapeHTML(error.message || 'Não foi possível pesquisar.')}</p>`; }
    }, 240);
  });
  resultsContainer.addEventListener('click', (event) => {
    const button = event.target.closest('[data-search-type]');
    if (!button) return;
    const type = button.dataset.searchType;
    const id = button.dataset.searchId;
    closeSearch();
    if (type === 'team') window.location.href = `./equipes.html?team=${encodeURIComponent(id)}`;
    else window.dispatchEvent(new CustomEvent('etecscore:athlete-search', { detail: { id } }));
  });
}

export function initGlobalSearch() {
  document.querySelectorAll('[data-open-search]').forEach((button) => button.addEventListener('click', openSearch));
  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      openSearch();
    }
    if (event.key === 'Escape') closeSearch();
  });
  window.addEventListener('etecscore:athlete-search', () => {
    showToast('A consulta de perfis de atletas ficará para uma versão posterior.', 'info');
  });
}
