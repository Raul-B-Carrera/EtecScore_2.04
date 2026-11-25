import { API_CONFIG, API_ENDPOINTS } from './apiConfig.js';
import { apiRequest } from './apiClient.js';
import { getDemoCompetitions, getDemoMatches, getDemoBracket, createDemoBracket, updateDemoMatchResult } from '../data/demoStore.js';
import { normalizeHomeMatch } from '../utils/formatters.js';

export async function getHomeMatches() {
  if (API_CONFIG.DEMO_MODE) return getDemoMatches();
  const payload = await apiRequest(API_ENDPOINTS.home);
  return (payload?.jogos ?? []).map(normalizeHomeMatch);
}

export async function getCompetitions() {
  if (API_CONFIG.DEMO_MODE) return getDemoCompetitions();
  const payload = await apiRequest(API_ENDPOINTS.competitions);
  return payload?.competicoes ?? payload?.competitions ?? [];
}

export async function getBracket(idComp) {
  if (API_CONFIG.DEMO_MODE) return getDemoBracket(idComp);
  const payload = await apiRequest(API_ENDPOINTS.bracket(idComp));
  return payload?.chave ?? payload?.bracket ?? null;
}

export async function generateBracket(idComp, teamIds, replaceExisting = false) {
  if (API_CONFIG.DEMO_MODE) return createDemoBracket(idComp, teamIds, replaceExisting);
  return apiRequest(API_ENDPOINTS.generateBracket(idComp), { method: 'POST', body: { idsInscricao: teamIds, criterio: 'sorteio', substituir: replaceExisting } });
}

export async function saveMatchResult(idComp, match, scoreA, scoreB, winnerId) {
  if (API_CONFIG.DEMO_MODE) return updateDemoMatchResult(idComp, match.idPartida, scoreA, scoreB, winnerId);
  return apiRequest(API_ENDPOINTS.matchResult(match.idPartida), {
    method: 'PATCH',
    body: {
      placarMandante: Number(scoreA),
      placarVisitante: Number(scoreB),
      idEquipeVencedora: Number(winnerId)
    }
  });
}
