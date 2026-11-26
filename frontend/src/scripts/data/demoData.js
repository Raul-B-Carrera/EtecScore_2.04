export const DEMO_MODALITIES = [
  { id: 1, name: 'Futsal Masculino', icon: 'futsal' },
  { id: 2, name: 'Futsal Feminino', icon: 'futsal' },
  { id: 3, name: 'Vôlei Misto', icon: 'volleyball' },
  { id: 4, name: 'Ping-Pong Geral', icon: 'table-tennis' }
];

export const DEMO_TEAMS = [
  { idEquipe: 1, nomeEquipe: '2º DS Matutino', identificacao: 'Desenvolvimento de Sistemas' },
  { idEquipe: 2, nomeEquipe: '3º Informática', identificacao: 'Informática para Internet' },
  { idEquipe: 3, nomeEquipe: '1º Administração', identificacao: 'Administração' },
  { idEquipe: 4, nomeEquipe: '2º Administração', identificacao: 'Administração' },
  { idEquipe: 5, nomeEquipe: '3º DS', identificacao: 'Desenvolvimento de Sistemas' },
  { idEquipe: 6, nomeEquipe: '1º Desenvolvimento', identificacao: 'Desenvolvimento de Sistemas' },
  { idEquipe: 7, nomeEquipe: '2º Marketing', identificacao: 'Marketing' },
  { idEquipe: 8, nomeEquipe: '3º Logística', identificacao: 'Logística' }
];

export const DEMO_COMPETITIONS = [
  { idComp: 1, nomeComp: 'Intercurso 2026', nomeModalidade: 'Futsal Masculino', status: 'Em andamento' },
  { idComp: 2, nomeComp: 'Intercurso 2026', nomeModalidade: 'Futsal Feminino', status: 'Inscrições abertas' },
  { idComp: 3, nomeComp: 'Intercurso 2026', nomeModalidade: 'Vôlei Misto', status: 'Em andamento' },
  { idComp: 4, nomeComp: 'Intercurso 2026', nomeModalidade: 'Ping-Pong Geral', status: 'Em andamento' }
];

export const DEMO_MATCHES = [
  { idPartida: 1, idComp: 1, nomeModalidade: 'Futsal Masculino', equipeA: '2º DS Matutino', equipeB: '3º Informática', placarA: 2, placarB: 1, status: 'Em andamento', dataHora: '2026-11-24T10:30:00', local: 'Quadra principal' },
  { idPartida: 2, idComp: 1, nomeModalidade: 'Futsal Masculino', equipeA: '1º Administração', equipeB: '2º Administração', placarA: 3, placarB: 2, status: 'Finalizado', dataHora: '2026-11-24T08:30:00', local: 'Quadra principal' },
  { idPartida: 3, idComp: 1, nomeModalidade: 'Futsal Masculino', equipeA: '3º DS', equipeB: '1º Desenvolvimento', placarA: null, placarB: null, status: 'Agendado', dataHora: '2026-11-25T14:00:00', local: 'Quadra principal' },
  { idPartida: 4, idComp: 3, nomeModalidade: 'Vôlei Misto', equipeA: '2º Marketing', equipeB: '3º Logística', placarA: 2, placarB: 0, status: 'Finalizado', dataHora: '2026-11-24T09:00:00', local: 'Ginásio' },
  { idPartida: 5, idComp: 2, nomeModalidade: 'Futsal Feminino', equipeA: 'Equipe Alfa', equipeB: 'Equipe Beta', placarA: null, placarB: null, status: 'Agendado', dataHora: '2026-11-26T13:30:00', local: 'Quadra principal' },
  { idPartida: 6, idComp: 4, nomeModalidade: 'Ping-Pong Geral', equipeA: '2º DS Matutino', equipeB: '1º Administração', placarA: 3, placarB: 1, status: 'Finalizado', dataHora: '2026-11-24T11:00:00', local: 'Sala de jogos' }
];

export const DEMO_ATHLETES = [
  { id: 1, nome: 'Roberth Leite', tipo: 'atleta' },
  { id: 2, nome: 'Carlos Silva', tipo: 'atleta' }
];
