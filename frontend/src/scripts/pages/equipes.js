import { getTeams, createTeam, updateTeam, deleteTeam } from '../api/teamsApi.js';
import { renderTeamCard } from '../components/teamCard.js';
import { openModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { validateTeam } from '../utils/validators.js';
import { escapeHTML } from '../utils/dom.js';
import { isDemoMode } from '../api/apiClient.js';

let teams = [];
let filter = '';

function renderTeams() {
  const grid = document.getElementById('teams-grid');
  const filtered = teams.filter((team) => `${team.nomeEquipe} ${team.identificacao ?? ''}`.toLocaleLowerCase('pt-BR').includes(filter.toLocaleLowerCase('pt-BR')));
  document.getElementById('team-total').textContent = `${filtered.length} ${filtered.length === 1 ? 'equipe' : 'equipes'}`;
  document.getElementById('data-mode-indicator').textContent = isDemoMode() ? 'Modo demonstração' : 'API conectada';
  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state teams-empty"><span class="empty-icon">+</span><strong>${filter ? 'Nenhuma equipe encontrada' : 'Nenhuma equipe cadastrada'}</strong><p>${filter ? 'Tente outro termo de pesquisa.' : 'Cadastre o primeiro time para começar a organizar o Intercurso.'}</p>${!filter ? '<button class="button button-dark button-small" type="button" data-empty-create>Nova equipe ↗</button>' : ''}</div>`;
    return;
  }
  grid.innerHTML = filtered.map((team, index) => renderTeamCard(team, index)).join('');
}

function showTeamForm(team = null) {
  const isEditing = Boolean(team);
  const body = `
    <form id="team-form" class="form-stack" novalidate>
      <div class="form-field"><label for="team-name">Nome da equipe *</label><input id="team-name" name="nomeEquipe" type="text" maxlength="100" required value="${escapeHTML(team?.nomeEquipe ?? '')}" placeholder="Ex.: 2º DS Matutino"><span class="form-hint">Até 100 caracteres.</span><span class="form-error" data-error="nomeEquipe"></span></div>
      <div class="form-field"><label for="team-identification">Identificação</label><input id="team-identification" name="identificacao" type="text" maxlength="100" value="${escapeHTML(team?.identificacao ?? '')}" placeholder="Ex.: Desenvolvimento de Sistemas"><span class="form-hint">Informação complementar opcional, até 100 caracteres.</span><span class="form-error" data-error="identificacao"></span></div>
      <div class="form-hint">Os campos seguem a estrutura atual da tabela tbEquipe: nomeEquipe e identificacao.</div>
      <div class="modal-form-actions"><button type="button" class="button button-light" data-modal-close>Cancelar</button><button class="button button-dark" type="submit">${isEditing ? 'Salvar alterações' : 'Cadastrar equipe'} <span aria-hidden="true">↗</span></button></div>
    </form>`;
  const modal = openModal({ eyebrow: isEditing ? 'Gestão de equipes' : 'Novo cadastro', title: isEditing ? 'Editar equipe' : 'Nova equipe', description: isEditing ? 'Atualize as informações do time.' : 'Adicione um time à base do EtecScore.', body });
  modal.querySelector('#team-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const data = { nomeEquipe: form.get('nomeEquipe'), identificacao: form.get('identificacao') };
    const errors = validateTeam(data);
    modal.querySelectorAll('[data-error]').forEach((element) => { element.textContent = errors[element.dataset.error] ?? ''; });
    if (Object.keys(errors).length) return;
    const submit = modal.querySelector('button[type="submit"]');
    submit.disabled = true;
    submit.textContent = 'Salvando...';
    try {
      if (isEditing) await updateTeam(team.idEquipe, data);
      else await createTeam(data);
      closeModal();
      await loadTeams();
      showToast(isEditing ? 'Equipe atualizada.' : 'Equipe cadastrada.', 'success');
    } catch (error) {
      submit.disabled = false;
      submit.textContent = isEditing ? 'Salvar alterações' : 'Cadastrar equipe';
      showToast(error.message || 'Não foi possível salvar a equipe.', 'error');
    }
  });
}

function confirmDelete(team) {
  const body = `<p class="confirm-copy">Tem certeza de que deseja excluir <strong>${escapeHTML(team.nomeEquipe)}</strong>? Essa ação não poderá ser desfeita.</p><div class="modal-form-actions"><button type="button" class="button button-light" data-modal-close>Cancelar</button><button type="button" class="button button-danger" id="confirm-delete-team">Excluir equipe</button></div>`;
  const modal = openModal({ eyebrow: 'Atenção', title: 'Excluir equipe?', description: 'Verifique se o time não está vinculado a uma competição.', body });
  modal.querySelector('#confirm-delete-team').addEventListener('click', async () => {
    try {
      await deleteTeam(team.idEquipe);
      closeModal();
      await loadTeams();
      showToast('Equipe excluída.', 'success');
    } catch (error) {
      showToast(error.message || 'Não foi possível excluir. A equipe pode estar vinculada a partidas ou competições.', 'error');
    }
  });
}

async function loadTeams() {
  teams = await getTeams();
  renderTeams();
}

export async function initTeams() {
  try { await loadTeams(); }
  catch (error) { showToast(error.message || 'Não foi possível carregar as equipes.', 'error'); }

  document.getElementById('new-team-button').addEventListener('click', () => showTeamForm());
  document.getElementById('team-filter').addEventListener('input', (event) => { filter = event.target.value; renderTeams(); });
  document.getElementById('teams-grid').addEventListener('click', (event) => {
    if (event.target.closest('[data-empty-create]')) { showTeamForm(); return; }
    const editButton = event.target.closest('[data-edit-team]');
    const deleteButton = event.target.closest('[data-delete-team]');
    if (editButton) {
      const team = teams.find((item) => String(item.idEquipe) === editButton.dataset.editTeam);
      if (team) showTeamForm(team);
    }
    if (deleteButton) {
      const team = teams.find((item) => String(item.idEquipe) === deleteButton.dataset.deleteTeam);
      if (team) confirmDelete(team);
    }
  });

  const selectedTeam = new URLSearchParams(window.location.search).get('team');
  if (selectedTeam) {
    window.setTimeout(() => {
      const card = document.querySelector(`[data-team-id="${CSS.escape(selectedTeam)}"]`);
      card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card?.classList.add('team-card-highlight');
    }, 100);
  }
}
