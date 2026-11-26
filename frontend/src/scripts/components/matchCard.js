import { escapeHTML, getInitials } from '../utils/dom.js';
import { formatDate, formatTime, formatStatus } from '../utils/formatters.js';

export function renderMatchCard(match) {
  const status = formatStatus(match.status);
  const hasScore = match.placarA !== null && match.placarA !== undefined && match.placarB !== null && match.placarB !== undefined;
  const context = `${match.nomeModalidade ?? 'Partida'}`;
  const date = match.dataHora ? `${formatDate(match.dataHora)}<br><strong>às ${formatTime(match.dataHora)}</strong>` : 'Data a definir';
  return `
    <article class="match-card" data-match-id="${escapeHTML(match.idPartida ?? '')}">
      <div class="match-context"><strong>${escapeHTML(context)}</strong><span class="badge ${status.className}">${status.label}</span></div>
      <button class="match-open-button match-teams" type="button" data-match-detail="${escapeHTML(match.idPartida ?? '')}" aria-label="Ver detalhes de ${escapeHTML(match.equipeA)} e ${escapeHTML(match.equipeB)}">
        <span class="match-team-row"><span class="team-mark">${escapeHTML(getInitials(match.equipeA))}</span><span class="match-team-name">${escapeHTML(match.equipeA)}</span><span class="match-score">${hasScore ? escapeHTML(match.placarA) : '—'}</span></span>
        <span class="match-team-row"><span class="team-mark">${escapeHTML(getInitials(match.equipeB))}</span><span class="match-team-name">${escapeHTML(match.equipeB)}</span><span class="match-score">${hasScore ? escapeHTML(match.placarB) : '—'}</span></span>
      </button>
      <time class="match-date">${date}${match.local ? `<span>${escapeHTML(match.local)}</span>` : ''}</time>
    </article>`;
}
