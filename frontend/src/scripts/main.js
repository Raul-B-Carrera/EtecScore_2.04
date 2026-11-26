import { initHeader } from './components/header.js';
import { initGlobalSearch } from './components/search.js';
import { initDashboard } from './pages/dashboard.js';
import { initTeams } from './pages/equipes.js';
import { initBracket } from './pages/mataMata.js';

const page = document.body.dataset.page;

initHeader(page);
initGlobalSearch();

const pageInitializers = {
  dashboard: initDashboard,
  teams: initTeams,
  bracket: initBracket
};

const initialize = pageInitializers[page];
if (initialize) {
  initialize().catch((error) => console.error(`Erro ao iniciar a página ${page}:`, error));
}
