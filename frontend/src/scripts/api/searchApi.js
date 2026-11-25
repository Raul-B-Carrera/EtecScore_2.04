import { API_CONFIG, API_ENDPOINTS } from './apiConfig.js';
import { apiRequest } from './apiClient.js';
import { getDemoTeams } from '../data/demoStore.js';
import { DEMO_ATHLETES } from '../data/demoData.js';

export async function searchGlobal(term) {
  const query = String(term ?? '').trim();
  if (query.length < 2) return [];
  if (API_CONFIG.DEMO_MODE) {
    const normalized = query.toLocaleLowerCase('pt-BR');
    const teams = getDemoTeams().filter((team) => team.nomeEquipe.toLocaleLowerCase('pt-BR').includes(normalized)).map((team) => ({ id: team.idEquipe, nome: team.nomeEquipe, tipo: 'equipe' }));
    const athletes = DEMO_ATHLETES.filter((athlete) => athlete.nome.toLocaleLowerCase('pt-BR').includes(normalized));
    return [...teams, ...athletes].slice(0, 8);
  }
  const payload = await apiRequest(`${API_ENDPOINTS.search}?q=${encodeURIComponent(query)}`);
  return payload?.resultados ?? [];
}
