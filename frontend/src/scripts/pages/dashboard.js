import { getHomeMatches } from '../api/matchesApi.js';
import { DEMO_MODALITIES } from '../data/demoData.js';
import { renderMatchCard } from '../components/matchCard.js';
import { openModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { escapeHTML, getInitials } from '../utils/dom.js';
import { formatDate, formatTime, formatStatus } from '../utils/formatters.js';

let matches = [];
let activeModality = 'Todas';

const modalityIcons = {
  futsal: '<svg viewBox="0 0 24 24"><path d="M5 5h14v4H5zM8 9v9a3 3 0 0 0 6 0V9"/></svg>',
  volleyball: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M7 4c3 3 5 8 5 17M17 5c-4 2-7 6-9 12M3 12c5-1 11 0 16 5"/></svg>',
  'table-tennis': '<svg viewBox="0 0 24 24"><path d="M14 3a7 7 0 0 0-5 12l2 2 7-7a7 7 0 0 0-4-7Z"/><path d="m11 17-4 4M16 13l4 4M5 5l3 3"/></svg>'
};

function renderModalities() {
  const container = document.getElementById('modality-list');
  const items = [{ name: 'Todas', icon: 'all' }, ...DEMO_MODALITIES];
  container.innerHTML = items.map((item) => `<button type="button" class="modality-item ${activeModality === item.name ? 'is-active' : ''}" data-modality="${escapeHTML(item.name)}"><span class="modality-icon">${item.icon === 'all' ? '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>' : modalityIcons[item.icon] ?? modalityIcons.futsal}</span><span>${escapeHTML(item.name)}</span></button>`).join('');
}

function filteredMatches() {
  return activeModality === 'Todas' ? matches : matches.filter((match) => match.nomeModalidade === activeModality);
}

function sectionMatches(list, targetId, countId = null) {
  const target = document.getElementById(targetId);
  const subset = filteredMatches().filter(list);
  target.innerHTML = subset.length ? subset.map(renderMatchCard).join('') : `<div class="empty-state"><span class="empty-icon">—</span><strong>Nenhuma partida nesta seção</strong><p>Quando houver jogos para esta modalidade, eles aparecerão aqui.</p></div>`;
  if (countId) document.getElementById(countId).textContent = `${subset.length} ${subset.length === 1 ? 'jogo' : 'jogos'}`;
}

function renderDashboard() {
  renderModalities();
  sectionMatches((match) => String(match.status).toLowerCase().includes('andamento'), 'live-matches', 'live-count');
  sectionMatches((match) => String(match.status).toLowerCase().includes('final') && match.dataHora && new Date(match.dataHora).toDateString() === new Date().toDateString(), 'today-matches');
  sectionMatches((match) => !String(match.status).toLowerCase().includes('final') && !String(match.status).toLowerCase().includes('andamento'), 'upcoming-matches', 'upcoming-count');
}

function openMatchDetails(match) {
  if (!match) return;
  const status = formatStatus(match.status);
  const hasScore = match.placarA !== null && match.placarA !== undefined;
  const body = `
    <div class="match-detail-head"><span class="badge ${status.className}">${status.label}</span><span class="form-hint">${escapeHTML(match.nomeModalidade)}</span></div>
    <div class="match-detail-score">
      <div><span class="team-mark team-mark-large">${escapeHTML(getInitials(match.equipeA))}</span><strong>${escapeHTML(match.equipeA)}</strong></div>
      <span class="detail-score">${hasScore ? `${escapeHTML(match.placarA)} <i>:</i> ${escapeHTML(match.placarB)}` : '— : —'}</span>
      <div><span class="team-mark team-mark-large">${escapeHTML(getInitials(match.equipeB))}</span><strong>${escapeHTML(match.equipeB)}</strong></div>
    </div>
    <div class="match-detail-meta"><span>Data e horário</span><strong>${match.dataHora ? `${formatDate(match.dataHora)} · ${formatTime(match.dataHora)}` : 'A definir'}</strong></div>
    <div class="match-detail-meta"><span>Local</span><strong>${escapeHTML(match.local || 'Não informado')}</strong></div>`;
  openModal({ eyebrow: 'Detalhes da partida', title: 'Confronto', description: 'Informações disponíveis para esta partida.', body, footer: '<button type="button" class="button button-dark" data-modal-close>Fechar</button>' });
}

export async function initDashboard() {
  try {
    matches = await getHomeMatches();
    renderDashboard();
  } catch (error) {
    showToast(error.message || 'Não foi possível carregar as partidas.', 'error');
    matches = [];
    renderDashboard();
  }

  document.getElementById('modality-list').addEventListener('click', (event) => {
    const button = event.target.closest('[data-modality]');
    if (!button) return;
    activeModality = button.dataset.modality;
    renderDashboard();
  });

  document.querySelector('.dashboard-content').addEventListener('click', (event) => {
    const button = event.target.closest('[data-match-detail]');
    if (!button) return;
    openMatchDetails(matches.find((match) => String(match.idPartida) === String(button.dataset.matchDetail)));
  });
}
