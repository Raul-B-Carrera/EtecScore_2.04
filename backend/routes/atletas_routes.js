import { Router } from "express";
import pool from "../connection.js";
import { createAtletas } from "../DAO/Atletas/createAtletas.js";
import { deleteAtletas } from "../DAO/Atletas/deleteAtletas.js";

const router = Router();

function validarId(valor, campo = "id") {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) {
    const erro = new Error(`${campo} inválido.`);
    erro.status = 400;
    throw erro;
  }
  return id;
}

function validarNumeroCamisa(valor) {
  if (valor === null || valor === "") return null;
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero < 0 || numero > 99) {
    const erro = new Error("O número da camisa deve ser um inteiro entre 0 e 99, ou nulo.");
    erro.status = 400;
    throw erro;
  }
  return numero;
}

// Lista o cadastro geral de atletas (não apenas os inscritos em uma equipe).
router.get("/api/atletas", async (req, res) => {
  try {
    const [atletas] = await pool.query(
      `SELECT idAtleta, nomeAtleta, dataNascimento, numeroMatricula
       FROM tbAtleta ORDER BY nomeAtleta`
    );
    res.json({ atletas });
  } catch (error) {
    console.error("GET /api/atletas:", error.message);
    res.status(500).json({ erro: "Não foi possível buscar os atletas." });
  }
});

// Cadastra um atleta no cadastro geral.
router.post("/api/atletas", async (req, res) => {
  try {
    const atleta = await createAtletas(req.body ?? {});
    res.status(201).json(atleta);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ erro: error.message });
    if (error.code === "ER_DUP_ENTRY") return res.status(409).json({ erro: "Já existe um atleta cadastrado com essa matrícula." });
    console.error("POST /api/atletas:", error.message);
    res.status(500).json({ erro: "Erro interno ao cadastrar atleta." });
  }
});

// Atualiza os dados cadastrais do atleta; não altera suas inscrições.
router.put("/api/atletas/:idAtleta", async (req, res) => {
  try {
    const id = validarId(req.params.idAtleta, "ID do atleta");
    const nome = String(req.body?.nomeAtleta ?? "").trim();
    const matricula = String(req.body?.numeroMatricula ?? "").trim();
    const nascimento = req.body?.dataNascimento ? String(req.body.dataNascimento).trim() : null;

    if (!nome || nome.length > 100) return res.status(400).json({ erro: "Informe um nome com até 100 caracteres." });
    if (!matricula || matricula.length > 30) return res.status(400).json({ erro: "Informe uma matrícula com até 30 caracteres." });
    if (nascimento) {
      const data = new Date(nascimento);
      if (Number.isNaN(data.getTime()) || data.toISOString().slice(0, 10) !== nascimento) {
        return res.status(400).json({ erro: "A data de nascimento deve ser válida, no formato AAAA-MM-DD." });
      }
    }

    const [result] = await pool.query(
      `UPDATE tbAtleta SET nomeAtleta = ?, dataNascimento = ?, numeroMatricula = ? WHERE idAtleta = ?`,
      [nome, nascimento, matricula, id]
    );
    if (!result.affectedRows) {
      const [existente] = await pool.query("SELECT idAtleta FROM tbAtleta WHERE idAtleta = ?", [id]);
      if (!existente.length) return res.status(404).json({ erro: "Atleta não encontrado." });
    }
    res.json({ idAtleta: id, nomeAtleta: nome, dataNascimento: nascimento, numeroMatricula: matricula });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ erro: error.message });
    if (error.code === "ER_DUP_ENTRY") return res.status(409).json({ erro: "Já existe um atleta cadastrado com essa matrícula." });
    console.error("PUT /api/atletas/:idAtleta:", error.message);
    res.status(500).json({ erro: "Não foi possível atualizar o atleta." });
  }
});

// Exclui o cadastro geral. O banco impede a exclusão se ainda houver inscrições.
router.delete("/api/atletas/:idAtleta", async (req, res) => {
  try {
    const result = await deleteAtletas(req.params.idAtleta);
    res.json({ ...result, mensagem: "Atleta excluído com sucesso." });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ erro: error.message });
    console.error("DELETE /api/atletas/:idAtleta:", error.message);
    res.status(500).json({ erro: "Não foi possível excluir o atleta." });
  }
});

// Lista os atletas vinculados a uma inscrição de equipe em uma competição.
router.get("/api/inscricoes-equipes/:idInscricao/atletas", async (req, res) => {
  try {
    const idInscricao = validarId(req.params.idInscricao, "ID da inscrição da equipe");
    const [inscricoes] = await pool.query(
      `SELECT ie.idInscricao, ie.idEquipe, ie.idComp, e.nomeEquipe, c.nomeComp
       FROM tbInscricaoEquipe ie
       JOIN tbEquipe e ON e.idEquipe = ie.idEquipe
       JOIN tbCompeticao c ON c.idComp = ie.idComp
       WHERE ie.idInscricao = ?`, [idInscricao]
    );
    if (!inscricoes.length) return res.status(404).json({ erro: "Inscrição da equipe não encontrada." });

    const [atletas] = await pool.query(
      `SELECT ia.idInscricaoAtleta, ia.idInscricao, ia.idAtleta, ia.numeroCamisa,
              a.nomeAtleta, a.dataNascimento, a.numeroMatricula
       FROM tbInscricaoAtleta ia
       JOIN tbAtleta a ON a.idAtleta = ia.idAtleta
       WHERE ia.idInscricao = ?
       ORDER BY a.nomeAtleta`, [idInscricao]
    );
    res.json({ inscricao: inscricoes[0], atletas });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ erro: error.message });
    console.error("GET atletas da inscrição:", error.message);
    res.status(500).json({ erro: "Não foi possível buscar os atletas desta equipe." });
  }
});

// Vincula um atleta já cadastrado a uma inscrição de equipe.
router.post("/api/inscricoes-equipes/:idInscricao/atletas", async (req, res) => {
  try {
    const idInscricao = validarId(req.params.idInscricao, "ID da inscrição da equipe");
    const idAtleta = validarId(req.body?.idAtleta, "ID do atleta");
    const numeroCamisa = validarNumeroCamisa(req.body?.numeroCamisa);

    const [inscricao] = await pool.query("SELECT idInscricao FROM tbInscricaoEquipe WHERE idInscricao = ?", [idInscricao]);
    if (!inscricao.length) return res.status(404).json({ erro: "Inscrição da equipe não encontrada." });
    const [atleta] = await pool.query("SELECT idAtleta FROM tbAtleta WHERE idAtleta = ?", [idAtleta]);
    if (!atleta.length) return res.status(404).json({ erro: "Atleta não encontrado." });

    const [result] = await pool.query(
      "INSERT INTO tbInscricaoAtleta (idInscricao, idAtleta, numeroCamisa) VALUES (?, ?, ?)",
      [idInscricao, idAtleta, numeroCamisa]
    );
    res.status(201).json({ idInscricaoAtleta: result.insertId, idInscricao, idAtleta, numeroCamisa });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ erro: error.message });
    if (error.code === "ER_DUP_ENTRY") return res.status(409).json({ erro: "Este atleta já está vinculado a esta inscrição de equipe." });
    console.error("POST atletas da inscrição:", error.message);
    res.status(500).json({ erro: "Não foi possível vincular o atleta à equipe." });
  }
});

// Altera o número da camisa de um vínculo atleta/equipe.
router.put("/api/inscricoes-atletas/:idInscricaoAtleta", async (req, res) => {
  try {
    const id = validarId(req.params.idInscricaoAtleta, "ID da inscrição do atleta");
    const numeroCamisa = validarNumeroCamisa(req.body?.numeroCamisa);
    const [result] = await pool.query(
      "UPDATE tbInscricaoAtleta SET numeroCamisa = ? WHERE idInscricaoAtleta = ?",
      [numeroCamisa, id]
    );
    if (!result.affectedRows) {
      const [existente] = await pool.query("SELECT idInscricaoAtleta FROM tbInscricaoAtleta WHERE idInscricaoAtleta = ?", [id]);
      if (!existente.length) return res.status(404).json({ erro: "Inscrição do atleta não encontrada." });
    }
    res.json({ idInscricaoAtleta: id, numeroCamisa, mensagem: "Número da camisa atualizado com sucesso." });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ erro: error.message });
    console.error("PUT /api/inscricoes-atletas/:idInscricaoAtleta:", error.message);
    res.status(500).json({ erro: "Não foi possível atualizar o número da camisa." });
  }
});

// Remove somente o vínculo com a equipe; mantém o atleta no cadastro geral.
router.delete("/api/inscricoes-atletas/:idInscricaoAtleta", async (req, res) => {
  try {
    const id = validarId(req.params.idInscricaoAtleta, "ID da inscrição do atleta");
    const [result] = await pool.query("DELETE FROM tbInscricaoAtleta WHERE idInscricaoAtleta = ?", [id]);
    if (!result.affectedRows) return res.status(404).json({ erro: "Inscrição do atleta não encontrada." });
    res.json({ idInscricaoAtleta: id, mensagem: "Atleta removido da equipe. O cadastro geral foi mantido." });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ erro: error.message });
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({ erro: "Não é possível remover este vínculo porque ele já possui eventos ou estatísticas registrados." });
    }
    console.error("DELETE /api/inscricoes-atletas/:idInscricaoAtleta:", error.message);
    res.status(500).json({ erro: "Não foi possível remover o atleta da equipe." });
  }
});

export default router;
