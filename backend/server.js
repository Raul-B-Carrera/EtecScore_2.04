import express from "express";
import cors from "cors";
import equipesRoutes from "./routes/equipes_routes.js";
import atletasRoutes from "./routes/atletas_routes.js";
import competicoesRoutes from "./routes/competicoes_routes.js";
import { testarConexao } from "./connection.js";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());
app.use(equipesRoutes);
app.use(atletasRoutes);
app.use(competicoesRoutes);

app.get("/api/health", (req, res) => {
  res.json({ ok: true, mensagem: "Servidor EtecScore ativo" });
});

app.use((req, res) => res.status(404).json({ erro: `Rota não encontrada: ${req.method} ${req.originalUrl}` }));
app.use((error, req, res, next) => {
  console.error("Erro não tratado:", error);
  res.status(500).json({ erro: "Erro interno do servidor." });
});

app.listen(PORT, async () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  await testarConexao();
});
