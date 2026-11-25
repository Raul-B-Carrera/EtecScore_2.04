import { Router } from "express";
import pool from "../connection.js";
import { createAtletas } from "../DAO/Atletas/createAtletas.js";
import { deleteAtletas } from "../DAO/Atletas/deleteAtletas.js";

const router = Router();

router.get("/api/atletas", async (req, res) => {
  try {
    const [atletas] = await pool.query(
      "SELECT idAtleta, nomeAtleta, dataNascimento, numeroMatricula FROM tbAtleta ORDER BY nomeAtleta"
    );
    res.json({ atletas });
  } catch (error) {
    console.error("GET /api/atletas:", error.message);
    res.status(500).json({ erro: "Não foi possível buscar os atletas." });
  }
});

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

export default router;
