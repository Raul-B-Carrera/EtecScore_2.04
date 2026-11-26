import { DEMO_TEAMS, DEMO_COMPETITIONS, DEMO_MATCHES } from './demoData.js';

const STORAGE_KEY = 'etecscore-demo-v1';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function initialState() {
  return {
    teams: clone(DEMO_TEAMS),
    competitions: clone(DEMO_COMPETITIONS),
    matches: clone(DEMO_MATCHES),
    brackets: {},
    nextTeamId: Math.max(...DEMO_TEAMS.map((team) => team.idEquipe)) + 1,
    nextMatchId: Math.max(...DEMO_MATCHES.map((match) => match.idPartida)) + 1
  };
}

function readState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return initialState();
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed.teams) || !Array.isArray(parsed.competitions)) return initialState();
    return parsed;
  } catch {
    return initialState();
  }
}

let state = readState();

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getDemoTeams() { return clone(state.teams); }
export function getDemoCompetitions() { return clone(state.competitions); }
export function getDemoMatches() { return clone(state.matches); }
export function getDemoBracket(idComp) { return clone(state.brackets[String(idComp)] ?? null); }

export function createDemoTeam(data) {
  const team = { idEquipe: state.nextTeamId++, nomeEquipe: data.nomeEquipe.trim(), identificacao: data.identificacao?.trim() || null };
  state.teams.unshift(team);
  persist();
  return clone(team);
}

export function updateDemoTeam(idEquipe, data) {
  const team = state.teams.find((item) => Number(item.idEquipe) === Number(idEquipe));
  if (!team) throw new Error('Equipe não encontrada.');
  team.nomeEquipe = data.nomeEquipe.trim();
  team.identificacao = data.identificacao?.trim() || null;
  persist();
  return clone(team);
}

export function deleteDemoTeam(idEquipe) {
  const isReferenced = Object.values(state.brackets).some((bracket) => bracket.rounds.some((round) => round.matches.some((match) => Number(match.teamA?.idEquipe) === Number(idEquipe) || Number(match.teamB?.idEquipe) === Number(idEquipe))));
  if (isReferenced) throw new Error('Não é possível excluir: a equipe já está vinculada a uma chave de competição.');
  const index = state.teams.findIndex((item) => Number(item.idEquipe) === Number(idEquipe));
  if (index < 0) throw new Error('Equipe não encontrada.');
  const [removed] = state.teams.splice(index, 1);
  persist();
  return clone(removed);
}

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function nextPowerOfTwo(value) {
  return 2 ** Math.ceil(Math.log2(Math.max(2, value)));
}

function resolveBye(bracket, roundIndex, matchIndex, team) {
  const nextRound = bracket.rounds[roundIndex + 1];
  if (!nextRound || !team) return;
  const nextMatch = nextRound.matches[Math.floor(matchIndex / 2)];
  const target = matchIndex % 2 === 0 ? 'teamA' : 'teamB';
  nextMatch[target] = clone(team);
  if (nextMatch.teamA && nextMatch.teamB) nextMatch.status = 'AGENDADA';
  else nextMatch.status = 'A_DEFINIR';
  if (roundIndex + 1 === bracket.rounds.length - 1 && nextMatch.teamA && nextMatch.teamB) nextMatch.status = 'AGENDADA';
}

export function createDemoBracket(idComp, teamIds, replaceExisting = false) {
  const selected = teamIds.map((id) => state.teams.find((team) => Number(team.idEquipe) === Number(id))).filter(Boolean);
  if (selected.length < 2) throw new Error('Selecione pelo menos duas equipes.');
  if (state.brackets[String(idComp)] && !replaceExisting) throw new Error('Já existe uma chave para esta competição. Confirme a substituição antes de gerar novamente.');

  const participants = shuffle(selected);
  const slots = nextPowerOfTwo(participants.length);
  const byeCount = slots - participants.length;
  const seededParticipants = Array(slots).fill(null);
  // Distribui os BYEs como avanços diretos, evitando confrontos entre duas vagas vazias.
  for (let index = 0; index < byeCount; index += 1) seededParticipants[index * 2] = participants[index];
  for (let index = byeCount; index < participants.length; index += 1) {
    const slotIndex = byeCount * 2 + (index - byeCount);
    seededParticipants[slotIndex] = participants[index];
  }

  const roundNames = [];
  let matchCount = slots / 2;
  while (matchCount >= 1) {
    roundNames.push(matchCount === 1 ? 'Final' : matchCount === 2 ? 'Semifinal' : matchCount === 4 ? 'Quartas de final' : matchCount === 8 ? 'Oitavas de final' : `Rodada de ${matchCount * 2}`);
    matchCount /= 2;
  }

  const bracket = {
    idComp: Number(idComp),
    generatedAt: new Date().toISOString(),
    rounds: roundNames.map((name, index) => ({
      id: index + 1,
      name,
      matches: Array.from({ length: slots / (2 ** (index + 1)) }, (_, matchIndex) => ({
        idPartida: `demo-${idComp}-${index + 1}-${matchIndex + 1}`,
        roundIndex: index,
        matchIndex,
        teamA: null,
        teamB: null,
        placarA: null,
        placarB: null,
        status: 'A_DEFINIR',
        winnerId: null,
        dataHora: null,
        local: null
      }))
    })),
    champion: null
  };

  const firstRound = bracket.rounds[0];
  for (let index = 0; index < firstRound.matches.length; index += 1) {
    const teamA = seededParticipants[index * 2] ?? null;
    const teamB = seededParticipants[index * 2 + 1] ?? null;
    const match = firstRound.matches[index];
    match.teamA = clone(teamA);
    match.teamB = clone(teamB);
    if (teamA && teamB) match.status = 'AGENDADA';
    else if (teamA || teamB) {
      const advancing = teamA ?? teamB;
      match.status = 'W.O.';
      match.winnerId = advancing.idEquipe;
      match.winner = clone(advancing);
      resolveBye(bracket, 0, index, advancing);
    }
  }

  state.brackets[String(idComp)] = bracket;
  persist();
  return clone(bracket);
}

export function updateDemoMatchResult(idComp, idPartida, placarA, placarB, winnerId = null) {
  const bracket = state.brackets[String(idComp)];
  if (!bracket) throw new Error('A chave ainda não foi gerada.');
  let match = null;
  for (const round of bracket.rounds) {
    match = round.matches.find((item) => String(item.idPartida) === String(idPartida));
    if (match) break;
  }
  if (!match || !match.teamA || !match.teamB) throw new Error('Confronto não encontrado ou ainda sem participantes.');
  if (match.status === 'W.O.') throw new Error('Confrontos definidos por W.O. não precisam de placar.');

  const scoreA = Number(placarA);
  const scoreB = Number(placarB);
  if (!Number.isInteger(scoreA) || !Number.isInteger(scoreB) || scoreA < 0 || scoreB < 0) throw new Error('Informe placares inteiros e não negativos.');
  if (scoreA === scoreB && ![match.teamA.idEquipe, match.teamB.idEquipe].includes(Number(winnerId))) {
    throw new Error('Em caso de empate, selecione o vencedor conforme o critério de desempate da modalidade.');
  }

  const round = bracket.rounds[match.roundIndex];
  const nextRound = bracket.rounds[match.roundIndex + 1];
  const nextMatch = nextRound?.matches[Math.floor(match.matchIndex / 2)];
  if (nextMatch?.status === 'FINALIZADA') {
    throw new Error('Não é possível alterar este resultado depois que o confronto seguinte foi finalizado.');
  }

  const winner = scoreA > scoreB ? match.teamA : scoreB > scoreA ? match.teamB : (Number(winnerId) === Number(match.teamA.idEquipe) ? match.teamA : match.teamB);
  match.placarA = scoreA;
  match.placarB = scoreB;
  match.status = 'FINALIZADA';
  match.winnerId = winner.idEquipe;
  match.winner = clone(winner);

  if (nextMatch) {
    const target = match.matchIndex % 2 === 0 ? 'teamA' : 'teamB';
    nextMatch[target] = clone(winner);
    nextMatch.status = nextMatch.teamA && nextMatch.teamB ? 'AGENDADA' : 'A_DEFINIR';
  } else {
    bracket.champion = clone(winner);
  }

  persist();
  return clone(bracket);
}

export function resetDemoData() {
  state = initialState();
  persist();
}
