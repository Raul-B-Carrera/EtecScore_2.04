import { Router } from "express";
import pool from "../connection.js";

const router = Router();


router.get("/api/equipes", async (req, res) => {
  try {
    const [equipes] = await pool.query(`
      SELECT
        idEquipe,
        nomeEquipe,
        identificacao
      FROM tbEquipe
      ORDER BY idEquipe ASC
    `);

    console.log("Equipes encontradas:", equipes.length);

    res.status(200).json({
      equipes,
      total: equipes.length
    });

  } catch (error) {
    console.error("Erro ao buscar equipes:", error);

    res.status(500).json({
      erro: "Não foi possível buscar as equipes."
    });
  }
});


router.post("/api/equipes", async (req, res) => {
  try {
    const nome = String(req.body?.nomeEquipe ?? "").trim();
    const identificacao = String(req.body?.identificacao ?? "").trim() || null;
    if (!nome) return res.status(400).json({ erro: "O nome da equipe é obrigatório." });
    if (nome.length > 100 || (identificacao && identificacao.length > 100)) {
      return res.status(400).json({ erro: "Os campos devem ter no máximo 100 caracteres." });
    }
    const [result] = await pool.query(
      "INSERT INTO tbEquipe (nomeEquipe, identificacao) VALUES (?, ?)",
      [nome, identificacao]
    );
    res.status(201).json({ idEquipe: result.insertId, nomeEquipe: nome, identificacao });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") return res.status(409).json({ erro: "Já existe uma equipe com esses dados." });
    console.error("POST /api/equipes:", error.message);
    res.status(500).json({ erro: "Erro interno ao cadastrar equipe." });
  }
});

router.put("/api/equipes/:idEquipe", async (req, res) => {
  try {
    const id = Number(req.params.idEquipe);
    const nome = String(req.body?.nomeEquipe ?? "").trim();
    const identificacao = String(req.body?.identificacao ?? "").trim() || null;
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ erro: "ID da equipe inválido." });
    if (!nome) return res.status(400).json({ erro: "O nome da equipe é obrigatório." });
    if (nome.length > 100 || (identificacao && identificacao.length > 100)) return res.status(400).json({ erro: "Os campos devem ter no máximo 100 caracteres." });
    const [result] = await pool.query(
      "UPDATE tbEquipe SET nomeEquipe = ?, identificacao = ? WHERE idEquipe = ?",
      [nome, identificacao, id]
    );
    if (!result.affectedRows) {
      const [rows] = await pool.query("SELECT idEquipe FROM tbEquipe WHERE idEquipe = ?", [id]);
      if (!rows.length) return res.status(404).json({ erro: "Equipe não encontrada." });
    }
    res.json({ idEquipe: id, nomeEquipe: nome, identificacao });
  } catch (error) {
    console.error("PUT /api/equipes/:idEquipe:", error.message);
    res.status(500).json({ erro: "Não foi possível atualizar a equipe." });
  }
});

router.delete("/api/equipes/:idEquipe", async (req, res) => {
  try {
    const id = Number(req.params.idEquipe);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ erro: "ID da equipe inválido." });
    const [result] = await pool.query("DELETE FROM tbEquipe WHERE idEquipe = ?", [id]);
    if (!result.affectedRows) return res.status(404).json({ erro: "Equipe não encontrada." });
    res.json({ idEquipe: id, mensagem: "Equipe excluída com sucesso." });
  } catch (error) {
    if (error.code === "ER_ROW_IS_REFERENCED_2") return res.status(409).json({ erro: "Não é possível excluir uma equipe vinculada a uma competição ou partida." });
    console.error("DELETE /api/equipes/:idEquipe:", error.message);
    res.status(500).json({ erro: "Não foi possível excluir a equipe." });
  }
});

export default router;
