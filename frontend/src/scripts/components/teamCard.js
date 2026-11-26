import { escapeHTML, getInitials } from '../utils/dom.js';

export function renderTeamCard(team, index = 0) {
  return `
    <article class="team-card" data-team-id="${escapeHTML(team.idEquipe)}">
      <div class="team-card-top"><span class="team-card-index">TEAM / ${String(index + 1).padStart(2, '0')}</span><span class="badge badge-pending">Cadastrada</span></div>
      <div class="team-card-main">
        <span class="team-mark team-mark-large">${escapeHTML(getInitials(team.nomeEquipe))}</span>
        <div><h3>${escapeHTML(team.nomeEquipe)}</h3><p class="team-card-description">${escapeHTML(team.identificacao || 'Sem identificação adicional')}</p></div>
      </div>
      <div class="team-card-actions">
        <button class="button button-light button-small" type="button" data-edit-team="${escapeHTML(team.idEquipe)}">Editar</button>
        <button class="button button-light button-small" type="button" data-delete-team="${escapeHTML(team.idEquipe)}">Excluir</button>
      </div>
    </article>`;
}
