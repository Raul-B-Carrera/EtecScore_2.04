import { getCompetitionTeams } from '../api/teamsApi.js';
import { getCompetitions, getBracket, generateBracket, saveMatchResult } from '../api/matchesApi.js';
import { renderBracket } from '../components/bracket.js';
import { openModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { escapeHTML, getInitials } from '../utils/dom.js';
import { formatStatus } from '../utils/formatters.js';

let competitions = [];
let teams = [];
let currentBracket = null;
let currentCompetitionId = null;
let activeRoundIndex = 0;

function getCompetition() {
  return competitions.find((competition) => String(competition.idComp) === String(currentCompetitionId));
}

function renderSummary() {
  const competition = getCompetition();
  const participants = currentBracket?.rounds?.[0]?.matches?.reduce((total, match) => total + Number(Boolean(match.teamA)) + Number(Boolean(match.teamB)), 0) ?? 0;
  document.getElementById('competition-summary').innerHTML = competition ? `
    <span class="summary-item"><strong>${escapeHTML(competition.nomeComp)}</strong></span><span class="summary-divider"></span>
    <span class="summary-item">Modalidade <strong>${escapeHTML(competition.nomeModalidade ?? 'Não informada')}</strong></span><span class="summary-divider"></span>
    <span class="summary-item">Participantes <strong>${participants || '—'}</strong></span><span class="summary-divider"></span>
    <span class="summary-item">Formato <strong>Eliminação simples</strong></span>` : '<span class="form-hint">Nenhuma competição disponível.</span>';
  document.getElementById('bracket-title').textContent = competition ? `Chave · ${competition.nomeModalidade ?? 'Competição'}` : 'Confrontos';
}

function renderPage() {
  const board = document.getElementById('bracket-board');
  const empty = document.getElementById('bracket-empty');
  const champion = document.getElementById('champion-section');
  renderSummary();
  if (!currentBracket?.rounds?.length) {
    board.innerHTML = '';
    board.hidden = true;
    empty.hidden = false;
    empty.innerHTML = `<div class="empty-state"><span class="empty-icon">＋</span><strong>Chave ainda não criada</strong><p>Selecione uma competição, escolha as equipes participantes e gere o chaveamento para começar.</p><button class="button button-dark button-small" type="button" data-empty-generate>Gerar chave ↗</button></div>`;
    champion.hidden = true;
    document.getElementById('mobile-round-navigation').hidden = true;
    return;
  }
  empty.hidden = true;
  board.hidden = false;
  activeRoundIndex = Math.min(activeRoundIndex, currentBracket.rounds.length - 1);
  board.innerHTML = renderBracket(currentBracket, activeRoundIndex);
  const mobileNavigation = document.getElementById('mobile-round-navigation');
  mobileNavigation.hidden = currentBracket.rounds.length < 2;
  mobileNavigation.innerHTML = currentBracket.rounds.map((round, index) => `<button type="button" class="mobile-round-tab ${index === activeRoundIndex ? 'is-active' : ''}" data-round-index="${index}">${escapeHTML(round.name)}</button>`).join('');
  if (currentBracket.champion) {
    champion.hidden = false;
    champion.innerHTML = `<div class="champion-copy"><span class="champion-icon">♛</span><div><small>Campeão do torneio</small><strong>${escapeHTML(currentBracket.champion.nomeEquipe)}</strong></div></div><span class="badge badge-finished">Competição concluída</span>`;
  } else champion.hidden = true;
}

function renderCompetitionOptions() {
  const select = document.getElementById('competition-select');
  select.innerHTML = competitions.map((competition) => `<option value="${escapeHTML(competition.idComp)}">${escapeHTML(competition.nomeModalidade ?? competition.nomeComp)}</option>`).join('');
  if (currentCompetitionId !== null) select.value = String(currentCompetitionId);
}

function findMatch(idPartida) {
  for (const round of currentBracket?.rounds ?? []) {
    const match = round.matches.find((item) => String(item.idPartida) === String(idPartida));
    if (match) return match;
  }
  return null;
}

function showGenerateModal() {
  const eligibleTeams = teams;
  if (eligibleTeams.length < 2) {
    showToast('Cadastre pelo menos duas equipes antes de gerar a chave.', 'error');
    return;
  }
  const competition = getCompetition();
  const body = `
    <form id="generate-bracket-form" class="form-stack">
      <div class="form-field"><label for="bracket-competition">Competição</label><input id="bracket-competition" type="text" value="${escapeHTML(competition?.nomeModalidade ?? 'Competição') }" disabled></div>
      <div class="form-field"><label>Equipes participantes *</label><span class="form-hint">Selecione pelo menos duas equipes. A ordem dos confrontos será definida por sorteio.</span></div>
      <div class="checkbox-list">${eligibleTeams.map((team) => `<label class="checkbox-option"><input type="checkbox" name="teamIds" value="${escapeHTML(team.idInscricao ?? team.idEquipe)}" checked><span><strong>${escapeHTML(team.nomeEquipe)}</strong><small>${escapeHTML(team.identificacao ?? 'Sem identificação')}</small></span></label>`).join('')}</div>
      ${currentBracket ? '<label class="checkbox-option replace-confirm"><input id="replace-bracket" type="checkbox"><span><strong>Substituir chave existente</strong><small>Os resultados e o progresso atuais serão descartados.</small></span></label>' : ''}
      <div class="form-error" id="bracket-form-error"></div>
      <div class="modal-form-actions"><button type="button" class="button button-light" data-modal-close>Cancelar</button><button type="submit" class="button button-dark">Sortear e gerar chave ↗</button></div>
    </form>`;
  const modal = openModal({ eyebrow: 'Organização do torneio', title: 'Gerar chave', description: 'A geração cria os confrontos da primeira rodada e as vagas das fases seguintes.', body });
  modal.querySelector('#generate-bracket-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const ids = [...modal.querySelectorAll('input[name="teamIds"]:checked')].map((input) => Number(input.value));
    if (ids.length < 2) { modal.querySelector('#bracket-form-error').textContent = 'Selecione pelo menos duas equipes.'; return; }
    const replaceExisting = Boolean(currentBracket);
    if (replaceExisting && !modal.querySelector('#replace-bracket')?.checked) { modal.querySelector('#bracket-form-error').textContent = 'Confirme a substituição da chave atual para continuar.'; return; }
    try {
      currentBracket = await generateBracket(currentCompetitionId, ids, replaceExisting);
      closeModal();
      renderPage();
      showToast('Chave gerada. Os confrontos foram organizados.', 'success');
    } catch (error) {
      modal.querySelector('#bracket-form-error').textContent = error.message;
    }
  });
}

function showResultModal(match) {
  if (!match?.teamA || !match?.teamB) return;
  const body = `
    <form id="result-form" class="form-stack">
      <div class="result-team-grid">
        <div class="result-team"><span class="team-mark team-mark-large">${escapeHTML(getInitials(match.teamA.nomeEquipe))}</span><strong>${escapeHTML(match.teamA.nomeEquipe)}</strong><input type="number" name="scoreA" min="0" max="99" value="${match.placarA ?? 0}" required aria-label="Placar de ${escapeHTML(match.teamA.nomeEquipe)}"></div>
        <span class="result-separator">×</span>
        <div class="result-team"><span class="team-mark team-mark-large">${escapeHTML(getInitials(match.teamB.nomeEquipe))}</span><strong>${escapeHTML(match.teamB.nomeEquipe)}</strong><input type="number" name="scoreB" min="0" max="99" value="${match.placarB ?? 0}" required aria-label="Placar de ${escapeHTML(match.teamB.nomeEquipe)}"></div>
      </div>
      <div class="form-field" id="tie-break-field" hidden><label for="winner-select">Vencedor do desempate *</label><select name="winnerId" id="winner-select"><option value="">Selecione o vencedor</option><option value="${escapeHTML(match.teamA.idEquipe)}">${escapeHTML(match.teamA.nomeEquipe)}</option><option value="${escapeHTML(match.teamB.idEquipe)}">${escapeHTML(match.teamB.nomeEquipe)}</option></select><span class="form-hint">Em caso de empate no placar, selecione o vencedor conforme o regulamento.</span></div>
      <div class="form-error" id="result-form-error"></div>
      <div class="modal-form-actions"><button type="button" class="button button-light" data-modal-close>Cancelar</button><button type="submit" class="button button-dark">Confirmar resultado ↗</button></div>
    </form>`;
  const modal = openModal({ eyebrow: 'Atualização de partida', title: 'Registrar resultado', description: 'O vencedor será encaminhado automaticamente para a próxima rodada.', body });
  const form = modal.querySelector('#result-form');
  const scoreA = form.elements.scoreA;
  const scoreB = form.elements.scoreB;
  const tieField = form.querySelector('#tie-break-field');
  const toggleTieBreak = () => { tieField.hidden = scoreA.value !== scoreB.value; };
  scoreA.addEventListener('input', toggleTieBreak);
  scoreB.addEventListener('input', toggleTieBreak);
  toggleTieBreak();
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const a = Number(scoreA.value);
    const b = Number(scoreB.value);
    const winnerId = a === b ? Number(form.elements.winnerId.value) : null;
    try {
      currentBracket = await saveMatchResult(currentCompetitionId, match, a, b, winnerId);
      closeModal();
      renderPage();
      showToast('Resultado registrado e chave atualizada.', 'success');
    } catch (error) {
      form.querySelector('#result-form-error').textContent = error.message;
    }
  });
}

async function loadBracket() {
  currentBracket = await getBracket(currentCompetitionId);
  renderPage();
}

export async function initBracket() {
  try {
    competitions = await getCompetitions();
    renderCompetitionOptions();
    currentCompetitionId = competitions[0]?.idComp ?? null;
    if (!currentCompetitionId) {
      document.getElementById('competition-summary').textContent = 'Nenhuma competição cadastrada.';
      renderPage();
      document.getElementById('generate-bracket-button').disabled = true;
      return;
    }
    document.getElementById('competition-select').value = String(currentCompetitionId);
    teams = await getCompetitionTeams(currentCompetitionId);
    await loadBracket();
  } catch (error) {
    showToast(error.message || 'Não foi possível carregar o mata-mata.', 'error');
  }

  document.getElementById('competition-select').addEventListener('change', async (event) => {
    currentCompetitionId = event.target.value;
    activeRoundIndex = 0;
    try { teams = await getCompetitionTeams(currentCompetitionId); await loadBracket(); }
    catch (error) { showToast(error.message || 'Não foi possível carregar a chave.', 'error'); }
  });
  document.getElementById('generate-bracket-button').addEventListener('click', showGenerateModal);
  document.getElementById('bracket-empty').addEventListener('click', (event) => {
    if (event.target.closest('[data-empty-generate]')) showGenerateModal();
  });
  document.getElementById('mobile-round-navigation').addEventListener('click', (event) => {
    const button = event.target.closest('[data-round-index]');
    if (!button) return;
    activeRoundIndex = Number(button.dataset.roundIndex);
    renderPage();
  });
  document.getElementById('bracket-board').addEventListener('click', (event) => {
    const button = event.target.closest('[data-record-result]');
    if (!button) return;
    showResultModal(findMatch(button.dataset.recordResult));
  });
}
