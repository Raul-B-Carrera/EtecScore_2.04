import { escapeHTML, getInitials } from '../utils/dom.js';
import { formatStatus } from '../utils/formatters.js';

function renderTeam(team, score, winner, placeholder) {
  if (!team) return `<div class="bracket-team-row"><span class="bracket-team-mark">?</span><span class="bracket-team-name">${placeholder}</span><span class="bracket-score">—</span></div>`;
  return `<div class="bracket-team-row ${winner ? 'is-winner' : ''}"><span class="bracket-team-mark">${escapeHTML(getInitials(team.nomeEquipe))}</span><span class="bracket-team-name">${escapeHTML(team.nomeEquipe)}</span><span class="bracket-score">${score ?? '—'}</span></div>`;
}

export function renderBracket(bracket, activeRoundIndex = 0) {
  if (!bracket?.rounds?.length) return '';
  return bracket.rounds.map((round, roundIndex) => `
    <section class="bracket-round ${roundIndex === activeRoundIndex ? 'is-mobile-active' : ''}" data-round-index="${roundIndex}" aria-label="${escapeHTML(round.name)}">
      <h3 class="bracket-round-title">${escapeHTML(round.name)}</h3>
      <div class="bracket-round-matches">
        ${round.matches.map((match) => {
          const status = formatStatus(match.status);
          const canRecord = match.teamA && match.teamB && match.status !== 'W.O.' && match.status !== 'FINALIZADA';
          const isFinal = roundIndex === bracket.rounds.length - 1;
          return `<article class="bracket-match">
            <div class="bracket-match-meta"><span>${isFinal ? 'Final' : `Confronto ${match.matchIndex + 1}`}</span><span class="badge ${status.className}">${status.label}</span></div>
            ${renderTeam(match.teamA, match.placarA, match.winnerId === match.teamA?.idEquipe, 'A definir')}
            ${renderTeam(match.teamB, match.placarB, match.winnerId === match.teamB?.idEquipe, 'A definir')}
            ${match.dataHora ? `<div class="bracket-match-meta"><span>${escapeHTML(new Date(match.dataHora).toLocaleDateString('pt-BR'))}</span><span>${escapeHTML(new Date(match.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))}</span></div>` : ''}
            ${canRecord ? `<div class="bracket-match-actions"><button type="button" data-record-result="${escapeHTML(match.idPartida)}">Registrar resultado ↗</button></div>` : match.status === 'FINALIZADA' ? `<div class="bracket-match-actions"><span class="form-hint">Vencedor: ${escapeHTML(match.winner?.nomeEquipe ?? '—')}</span></div>` : ''}
          </article>`;
        }).join('')}
      </div>
    </section>`).join('');
}
