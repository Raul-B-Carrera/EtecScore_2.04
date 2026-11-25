import conexao from "../../connection.js";

/**
 * Busca as equipes inscritas e ativas em uma competição para exibir na página de Equipes.
 */
export async function buscarEquipesPorCompeticao(idComp) {
  const sql = `
    SELECT 
      e.idEquipe,
      e.nomeEquipe,
      e.identificacao,
      c.nomeComp,
      ie.statusInscricao
    FROM tbInscricaoEquipe ie
    INNER JOIN tbEquipe e ON ie.idEquipe = e.idEquipe
    INNER JOIN tbCompeticao c ON ie.idComp = c.idComp
    WHERE ie.idComp = ? AND ie.statusInscricao = 'Ativo'
  `;

  const [equipes] = await conexao.query(sql, [idComp]);
  return equipes;
}


import conexao from "../../connection.js";

/**
 * Busca os atletas inscritos na competição, suas equipes e estatísticas acumuladas.
 */
export async function buscarAtletasPorCompeticao(idComp) {
  const sql = `
    SELECT 
      a.idAtleta,
      a.nomeAtleta,
      ia.numeroCamisa,
      e.nomeEquipe,
      COALESCE(SUM(ea.gols), 0) AS totalGols,
      COALESCE(SUM(ea.assistencias), 0) AS totalAssistencias,
      COALESCE(SUM(ea.cartoesAmarelos), 0) AS totalAmarelos,
      COALESCE(SUM(ea.cartoesVermelhos), 0) AS totalVermelhos
    FROM tbInscricaoAtleta ia
    INNER JOIN tbAtleta a ON ia.idAtleta = a.idAtleta
    INNER JOIN tbInscricaoEquipe ie ON ia.idInscricao = ie.idInscricao
    INNER JOIN tbEquipe e ON ie.idEquipe = e.idEquipe
    LEFT JOIN tbEstatisticaAtletaPartida ea ON ia.idInscricaoAtleta = ea.idInscricaoAtleta
    WHERE ie.idComp = ?
    GROUP BY a.idAtleta, a.nomeAtleta, ia.numeroCamisa, e.nomeEquipe
    ORDER BY totalGols DESC, totalAssistencias DESC;
  `;

  const [atletas] = await conexao.query(sql, [idComp]);
  return atletas;
}