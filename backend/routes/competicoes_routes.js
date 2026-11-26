
import { Router } from "express";
import pool from "../connection.js";

const router = Router();

function parseJson(value) {
  if (typeof value === "string") return JSON.parse(value);
  return value;
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

function roundName(matchCount) {
  if (matchCount === 1) return "Final";
  if (matchCount === 2) return "Semifinal";
  if (matchCount === 4) return "Quartas de final";
  if (matchCount === 8) return "Oitavas de final";

  return `Rodada de ${matchCount * 2}`;
}

function teamFromInscription(team) {
  return {
    idEquipe: Number(team.idEquipe),
    idInscricao: Number(team.idInscricao),
    nomeEquipe: team.nomeEquipe,
    identificacao: team.identificacao,
  };
}

function advanceWinner(bracket, roundIndex, matchIndex, winner) {
  const nextRound = bracket.rounds[roundIndex + 1];

  if (!nextRound || !winner) {
    if (!nextRound && winner) bracket.champion = winner;
    return;
  }

  const nextMatch = nextRound.matches[Math.floor(matchIndex / 2)];
  const slot = matchIndex % 2 === 0 ? "teamA" : "teamB";

  nextMatch[slot] = winner;

  nextMatch.status =
    nextMatch.teamA && nextMatch.teamB
      ? "AGENDADA"
      : "A_DEFINIR";
}

// LISTAR COMPETIÇÕES
router.get("/api/competicoes", async (req, res) => {
  try {
    const [competicoes] = await pool.query(`
      SELECT
        c.idComp,
        c.nomeComp,
        c.statusComp AS status,
        c.idModalidade,
        m.nomeModalidade
      FROM tbCompeticao c
      LEFT JOIN tbModalidade m
        ON m.idModalidade = c.idModalidade
      ORDER BY c.idComp
    `);

    res.json({ competicoes });
  } catch (error) {
    console.error("GET competicoes:", error);

    res.status(500).json({
      erro: "Não foi possível buscar as competições."
    });
  }
});

// LISTAR EQUIPES INSCRITAS
router.get("/api/competicoes/:idComp/inscricoes", async (req, res) => {
  try {
    const idComp = Number(req.params.idComp);

    if (!Number.isInteger(idComp) || idComp <= 0) {
      return res.status(400).json({
        erro: "ID da competição inválido."
      });
    }

    const [inscricoes] = await pool.query(`
      SELECT
        ie.idInscricao,
        ie.idComp,
        ie.idEquipe,
        ie.statusInscricao,
        e.nomeEquipe,
        e.identificacao
      FROM tbInscricaoEquipe ie
      INNER JOIN tbEquipe e
        ON e.idEquipe = ie.idEquipe
      WHERE ie.idComp = ?
        AND ie.statusInscricao = 'Ativo'
      ORDER BY e.nomeEquipe
    `, [idComp]);

    res.json({
      inscricoes,
      total: inscricoes.length
    });

  } catch (error) {
    console.error("GET inscricoes:", error);

    res.status(500).json({
      erro: "Não foi possível buscar as equipes inscritas."
    });
  }
});

// EQUIPES E ATLETAS DA COMPETIÇÃO
router.get("/api/competicoes/:idComp/equipes-e-atletas", async (req, res) => {
  try {
    const idComp = Number(req.params.idComp);

    if (!Number.isInteger(idComp) || idComp <= 0) {
      return res.status(400).json({
        erro: "ID da competição inválido."
      });
    }

    const [[competition]] = await pool.query(
      "SELECT nomeComp FROM tbCompeticao WHERE idComp = ?",
      [idComp]
    );

    if (!competition) {
      return res.status(404).json({
        erro: "Competição não encontrada."
      });
    }

    const [equipes] = await pool.query(`
      SELECT
        ie.idInscricao,
        ie.idEquipe,
        ie.statusInscricao,
        e.nomeEquipe,
        e.identificacao
      FROM tbInscricaoEquipe ie
      JOIN tbEquipe e ON e.idEquipe = ie.idEquipe
      WHERE ie.idComp = ?
      ORDER BY e.nomeEquipe
    `, [idComp]);

    const [atletas] = await pool.query(`
      SELECT
        ia.idInscricaoAtleta,
        ia.idInscricao,
        ia.numeroCamisa,
        a.idAtleta,
        a.nomeAtleta,
        a.numeroMatricula
      FROM tbInscricaoAtleta ia
      JOIN tbInscricaoEquipe ie
        ON ie.idInscricao = ia.idInscricao
      JOIN tbAtleta a
        ON a.idAtleta = ia.idAtleta
      WHERE ie.idComp = ?
      ORDER BY a.nomeAtleta
    `, [idComp]);

    res.json({
      idComp,
      nomeComp: competition.nomeComp,
      equipes,
      atletas
    });

  } catch (error) {
    console.error("GET equipes-e-atletas:", error);

    res.status(500).json({
      erro: "Não foi possível consultar os dados da competição."
    });
  }
});

// HOME
router.get("/api/home", async (req, res) => {
  try {
    const [jogos] = await pool.query(`
      SELECT
        p.idPartida,
        p.idComp,
        m.nomeModalidade,
        em.nomeEquipe AS equipeA,
        ev.nomeEquipe AS equipeB,
        p.placarMandante AS placarA,
        p.placarVisitante AS placarB,
        p.statusPartida AS status,
        p.dataHora,
        NULL AS local
      FROM tbPartida p
      JOIN tbCompeticao c ON c.idComp = p.idComp
      LEFT JOIN tbModalidade m ON m.idModalidade = c.idModalidade
      JOIN tbInscricaoEquipe im
        ON im.idInscricao = p.idInscricaoMandante
      JOIN tbEquipe em ON em.idEquipe = im.idEquipe
      JOIN tbInscricaoEquipe iv
        ON iv.idInscricao = p.idInscricaoVisitante
      JOIN tbEquipe ev ON ev.idEquipe = iv.idEquipe
      ORDER BY p.dataHora DESC
    `);

    res.json({ jogos });

  } catch (error) {
    console.error("GET home:", error);

    res.status(500).json({
      erro: "Não foi possível carregar as partidas."
    });
  }
});

// PESQUISA
router.get("/api/pesquisa", async (req, res) => {
  try {
    const q = String(req.query.q ?? "").trim();

    if (q.length < 2) {
      return res.json({ resultados: [] });
    }

    const like = `%${q}%`;

    const [equipes] = await pool.query(`
      SELECT
        idEquipe AS id,
        nomeEquipe AS nome,
        'equipe' AS tipo
      FROM tbEquipe
      WHERE nomeEquipe LIKE ?
      LIMIT 8
    `, [like]);

    const [atletas] = await pool.query(`
      SELECT
        idAtleta AS id,
        nomeAtleta AS nome,
        'atleta' AS tipo
      FROM tbAtleta
      WHERE nomeAtleta LIKE ?
      LIMIT 8
    `, [like]);

    res.json({
      resultados: [...equipes, ...atletas].slice(0, 8)
    });

  } catch (error) {
    console.error("GET pesquisa:", error);

    res.status(500).json({
      erro: "Não foi possível realizar a pesquisa."
    });
  }
});

// BUSCAR CHAVEAMENTO
router.get("/api/competicoes/:idComp/mata-mata", async (req, res) => {
  try {
    const idComp = Number(req.params.idComp);

    if (!Number.isInteger(idComp) || idComp <= 0) {
      return res.status(400).json({
        erro: "ID da competição inválido."
      });
    }

    const [rows] = await pool.query(
      "SELECT dadosChave FROM tbChaveamento WHERE idComp = ?",
      [idComp]
    );

    res.json({
      chave: rows.length
        ? parseJson(rows[0].dadosChave)
        : null
    });

  } catch (error) {
    console.error("GET mata-mata:", error);

    res.status(500).json({
      erro: "Não foi possível carregar o chaveamento."
    });
  }
});

// GERAR CHAVEAMENTO
router.post("/api/competicoes/:idComp/mata-mata", async (req, res) => {
  const conn = await pool.getConnection();

  try {
    const idComp = Number(req.params.idComp);

    const idsRecebidos = req.body?.idsInscricao;

    if (!Number.isInteger(idComp) || idComp <= 0) {
      return res.status(400).json({
        erro: "ID da competição inválido."
      });
    }

    if (!Array.isArray(idsRecebidos)) {
      return res.status(400).json({
        erro: "Envie uma lista de IDs de inscrição."
      });
    }

    const ids = [...new Set(
      idsRecebidos.map(Number)
    )];

    const substituir = req.body?.substituir === true;

    if (
      ids.length < 2 ||
      ids.some(id => !Number.isInteger(id) || id <= 0)
    ) {
      return res.status(400).json({
        erro: "Selecione pelo menos duas equipes válidas."
      });
    }

    await conn.beginTransaction();

    const [[competition]] = await conn.query(
      "SELECT idComp FROM tbCompeticao WHERE idComp = ?",
      [idComp]
    );

    if (!competition) {
      await conn.rollback();

      return res.status(404).json({
        erro: "Competição não encontrada."
      });
    }

    const [teams] = await conn.query(`
      SELECT
        ie.idInscricao,
        ie.idEquipe,
        ie.idComp,
        ie.statusInscricao,
        e.nomeEquipe,
        e.identificacao
      FROM tbInscricaoEquipe ie
      INNER JOIN tbEquipe e
        ON e.idEquipe = ie.idEquipe
      WHERE ie.idComp = ?
        AND ie.statusInscricao = 'Ativo'
        AND ie.idInscricao IN (?)
      FOR UPDATE
    `, [idComp, ids]);

    const [existing] = await conn.query(
      "SELECT idChaveamento FROM tbChaveamento WHERE idComp = ? FOR UPDATE",
      [idComp]
    );

    if (existing.length && !substituir) {
      await conn.rollback();

      return res.status(409).json({
        erro: "Já existe uma chave para esta competição. Confirme a substituição."
      });
    }

    const participants = shuffle(
      teams.map(teamFromInscription)
    );

    const slots = nextPowerOfTwo(participants.length);
    const byeCount = slots - participants.length;

    const seeded = Array(slots).fill(null);

    for (let i = 0; i < byeCount; i += 1) {
      seeded[i * 2] = participants[i];
    }

    for (let i = byeCount; i < participants.length; i += 1) {
      seeded[byeCount * 2 + (i - byeCount)] = participants[i];
    }

    const rounds = [];

    for (
      let count = slots / 2, index = 0;
      count >= 1;
      count /= 2, index += 1
    ) {
      rounds.push({
        id: index + 1,
        name: roundName(count),
        matches: Array.from(
          { length: count },
          (_, matchIndex) => ({
            idPartida: `mm-${idComp}-${index}-${matchIndex}`,
            roundIndex: index,
            matchIndex,
            teamA: null,
            teamB: null,
            placarA: null,
            placarB: null,
            status: "A_DEFINIR",
            winnerId: null,
            dataHora: null,
            local: null
          })
        )
      });
    }

    const bracket = {
      idComp,
      generatedAt: new Date().toISOString(),
      rounds,
      champion: null
    };

    rounds[0].matches.forEach((match, index) => {
      match.teamA = seeded[index * 2] ?? null;
      match.teamB = seeded[index * 2 + 1] ?? null;

      if (match.teamA && match.teamB) {
        match.status = "AGENDADA";
      } else if (match.teamA || match.teamB) {
        const winner = match.teamA ?? match.teamB;

        match.status = "W.O.";
        match.winnerId = winner.idEquipe;
        match.winner = winner;

        advanceWinner(bracket, 0, index, winner);
      }
    });

    await conn.query(`
      INSERT INTO tbChaveamento (idComp, dadosChave)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE
        dadosChave = VALUES(dadosChave),
        atualizadoEm = CURRENT_TIMESTAMP
    `, [idComp, JSON.stringify(bracket)]);

    await conn.commit();

    res.status(201).json(bracket);

  } catch (error) {
    await conn.rollback();

    console.error("POST mata-mata:", error);

    res.status(500).json({
      erro: "Não foi possível gerar o chaveamento."
    });

  } finally {
    conn.release();
  }
});

// SALVAR RESULTADO
router.patch("/api/partidas/:idPartida/resultado", async (req, res) => {
  const conn = await pool.getConnection();

  try {
    const matchId = String(req.params.idPartida);
    const parsed = /^mm-(\d+)-(\d+)-(\d+)$/.exec(matchId);

    if (!parsed) {
      return res.status(400).json({
        erro: "Identificador de partida inválido."
      });
    }

    const [, compText, roundText, matchText] = parsed;

    const idComp = Number(compText);
    const roundIndex = Number(roundText);
    const matchIndex = Number(matchText);

    const placarA = Number(req.body?.placarMandante);
    const placarB = Number(req.body?.placarVisitante);

    const winnerId =
      req.body?.idEquipeVencedora == null
        ? null
        : Number(req.body.idEquipeVencedora);

    if (
      !Number.isInteger(placarA) ||
      !Number.isInteger(placarB) ||
      placarA < 0 ||
      placarB < 0 ||
      placarA > 99 ||
      placarB > 99
    ) {
      return res.status(400).json({
        erro: "Informe placares inteiros entre 0 e 99."
      });
    }

    await conn.beginTransaction();

    const [rows] = await conn.query(
      "SELECT dadosChave FROM tbChaveamento WHERE idComp = ? FOR UPDATE",
      [idComp]
    );

    if (!rows.length) {
      await conn.rollback();

      return res.status(404).json({
        erro: "A chave ainda não foi gerada."
      });
    }

    const bracket = parseJson(rows[0].dadosChave);

    const match =
      bracket.rounds?.[roundIndex]?.matches?.[matchIndex];

    if (
      !match?.teamA ||
      !match?.teamB ||
      match.idPartida !== matchId
    ) {
      await conn.rollback();

      return res.status(404).json({
        erro: "Confronto não encontrado ou ainda sem participantes."
      });
    }

    if (match.status === "W.O.") {
      await conn.rollback();

      return res.status(409).json({
        erro: "Confrontos definidos por W.O. não precisam de placar."
      });
    }

    if (
      placarA === placarB &&
      ![match.teamA.idEquipe, match.teamB.idEquipe].includes(winnerId)
    ) {
      await conn.rollback();

      return res.status(400).json({
        erro: "Em caso de empate, selecione o vencedor do desempate."
      });
    }

    const nextMatch =
      bracket.rounds[roundIndex + 1]?.matches?.[
        Math.floor(matchIndex / 2)
      ];

    if (nextMatch?.status === "FINALIZADA") {
      await conn.rollback();

      return res.status(409).json({
        erro: "Não é possível alterar o resultado após a finalização do confronto seguinte."
      });
    }

    const winner =
      placarA > placarB
        ? match.teamA
        : placarB > placarA
          ? match.teamB
          : Number(winnerId) === Number(match.teamA.idEquipe)
            ? match.teamA
            : match.teamB;

    match.placarA = placarA;
    match.placarB = placarB;
    match.status = "FINALIZADA";
    match.winnerId = winner.idEquipe;
    match.winner = winner;

    if (nextMatch) {
      const slot =
        matchIndex % 2 === 0
          ? "teamA"
          : "teamB";

      nextMatch[slot] = winner;

      nextMatch.status =
        nextMatch.teamA && nextMatch.teamB
          ? "AGENDADA"
          : "A_DEFINIR";
    } else {
      bracket.champion = winner;
    }

    await conn.query(
      `UPDATE tbChaveamento
       SET dadosChave = ?,
           atualizadoEm = CURRENT_TIMESTAMP
       WHERE idComp = ?`,
      [JSON.stringify(bracket), idComp]
    );

    await conn.commit();

    res.json(bracket);

  } catch (error) {
    await conn.rollback();

    console.error("PATCH resultado:", error);

    res.status(500).json({
      erro: "Não foi possível salvar o resultado da partida."
    });

  } finally {
    conn.release();
  }
});

export default router;
