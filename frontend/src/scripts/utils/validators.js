export function validateTeam(data) {
  const errors = {};
  const nomeEquipe = String(data.nomeEquipe ?? '').trim();
  const identificacao = String(data.identificacao ?? '').trim();
  if (!nomeEquipe) errors.nomeEquipe = 'Informe o nome da equipe.';
  else if (nomeEquipe.length > 100) errors.nomeEquipe = 'O nome deve ter no máximo 100 caracteres.';
  if (identificacao.length > 100) errors.identificacao = 'A identificação deve ter no máximo 100 caracteres.';
  return errors;
}
