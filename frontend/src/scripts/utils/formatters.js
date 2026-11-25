export function formatDate(value, options = {}) {
  if (!value) return 'Data a definir';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data a definir';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', ...options }).format(date);
}

export function formatTime(value) {
  if (!value) return 'Horário a definir';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Horário a definir';
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(date);
}

export function formatStatus(status = '') {
  const normalized = String(status).toLowerCase();
  if (normalized.includes('final') || normalized.includes('encerr')) return { label: 'Finalizada', className: 'badge-finished' };
  if (normalized.includes('andamento')) return { label: 'Em andamento', className: 'badge-warning' };
  if (normalized.includes('adiad')) return { label: 'Adiada', className: 'badge-warning' };
  if (normalized.includes('suspens')) return { label: 'Suspensa', className: 'badge-warning' };
  if (normalized.includes('cancel')) return { label: 'Cancelada', className: 'badge-pending' };
  if (normalized.includes('w.o') || normalized.includes('wo')) return { label: 'W.O.', className: 'badge-pending' };
  if (normalized.includes('a_definir') || normalized.includes('definir')) return { label: 'A definir', className: 'badge-pending' };
  return { label: 'Agendada', className: 'badge-scheduled' };
}

export function normalizeHomeMatch(match) {
  return {
    idPartida: match.idPartida,
    idComp: match.idComp ?? null,
    nomeModalidade: match.nomeModalidade ?? 'Modalidade',
    equipeA: match.equipeA ?? match.nomeMandante ?? 'Equipe a definir',
    equipeB: match.equipeB ?? match.nomeVisitante ?? 'Equipe a definir',
    placarA: match.placarA ?? match.placarMandante ?? null,
    placarB: match.placarB ?? match.placarVisitante ?? null,
    status: match.status ?? match.statusPartida ?? 'Agendado',
    dataHora: match.dataHora ?? null,
    local: match.local ?? null
  };
}
