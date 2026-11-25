import { API_CONFIG, API_ENDPOINTS } from './apiConfig.js';
import { apiRequest } from './apiClient.js';
import { getDemoTeams, createDemoTeam, updateDemoTeam, deleteDemoTeam } from '../data/demoStore.js';

function extractTeams(payload) {
  if (Array.isArray(payload)) return payload;
  return payload?.equipes ?? payload?.teams ?? payload?.dados ?? [];
}

export async function getTeams() {
  if (API_CONFIG.DEMO_MODE) return getDemoTeams();
  return extractTeams(await apiRequest(API_ENDPOINTS.teams));
}

export async function getCompetitionTeams(idComp) {
  if (API_CONFIG.DEMO_MODE) return getDemoTeams();
  const payload = await apiRequest(`/api/competicoes/${idComp}/inscricoes`);
  const inscriptions = payload?.inscricoes ?? payload?.equipes ?? [];
  return inscriptions.filter((item) => !item.statusInscricao || String(item.statusInscricao).toLowerCase() === 'ativo');
}

export async function createTeam(data) {
  if (API_CONFIG.DEMO_MODE) return createDemoTeam(data);
  return apiRequest(API_ENDPOINTS.teams, { method: 'POST', body: data });
}

export async function updateTeam(idEquipe, data) {
  if (API_CONFIG.DEMO_MODE) return updateDemoTeam(idEquipe, data);
  return apiRequest(`${API_ENDPOINTS.teams}/${idEquipe}`, { method: 'PUT', body: data });
}

export async function deleteTeam(idEquipe) {
  if (API_CONFIG.DEMO_MODE) return deleteDemoTeam(idEquipe);
  return apiRequest(`${API_ENDPOINTS.teams}/${idEquipe}`, { method: 'DELETE' });
}
