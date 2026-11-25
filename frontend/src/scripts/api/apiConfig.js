// Altere estas opções quando o servidor Express estiver pronto.
export const API_CONFIG = Object.freeze({
  BASE_URL: window.ETEC_SCORE_CONFIG?.API_BASE_URL ?? 'http://localhost:3000',
  DEMO_MODE: window.ETEC_SCORE_CONFIG?.DEMO_MODE ?? false
});

export const API_ENDPOINTS = Object.freeze({
  home: '/api/home',
  search: '/api/pesquisa',
  teams: '/api/equipes',
  competitions: '/api/competicoes',
  bracket: (idComp) => `/api/competicoes/${idComp}/mata-mata`,
  generateBracket: (idComp) => `/api/competicoes/${idComp}/mata-mata`,
  matchResult: (idPartida) => `/api/partidas/${idPartida}/resultado`
});
