# EtecScore — Back-End

## Requisitos
- Node.js 20 ou superior
- MySQL 8 ou superior

## Configuração

1. Abra o MySQL Workbench (ou outro cliente MySQL).
2. Execute o arquivo `BD.sql` em um banco de dados vazio. Ele cria o banco `db_etecscore`, as tabelas e alguns dados de demonstração.
3. No terminal, entre na pasta `backend` e execute:

   ```bash
   npm install
   npm run dev
   ```

4. Por padrão, a conexão usa `127.0.0.1:3306`, usuário `root`, senha `root` e banco `db_etecscore`. Se suas credenciais forem diferentes, defina `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME` como variáveis de ambiente.
5. Acesse `http://localhost:3000/api/health`. A resposta esperada é um JSON com `ok: true`.

## Integração com o Front-End

O Front-End atualizado usa `http://localhost:3000` e está configurado para consumir a API por padrão (`DEMO_MODE: false`). Abra a pasta `frontend` com Live Server ou outro servidor estático. Para voltar aos dados demonstrativos, defina `window.ETEC_SCORE_CONFIG = { DEMO_MODE: true }` antes dos módulos do aplicativo.

## Rotas implementadas

| Método | Rota | Uso |
|---|---|---|
| GET | `/api/health` | Verificar se o servidor está ativo |
| GET | `/api/equipes` | Listar equipes |
| POST | `/api/equipes` | Cadastrar equipe |
| PUT | `/api/equipes/:idEquipe` | Editar equipe |
| DELETE | `/api/equipes/:idEquipe` | Excluir equipe |
| GET | `/api/atletas` | Listar atletas |
| POST | `/api/atletas` | Cadastrar atleta |
| DELETE | `/api/atletas/:idAtleta` | Excluir atleta |
| GET | `/api/competicoes` | Listar competições |
| GET | `/api/competicoes/:idComp/inscricoes` | Listar equipes inscritas |
| GET | `/api/competicoes/:idComp/equipes-e-atletas` | Consultar equipes e atletas da competição |
| GET | `/api/home` | Listar partidas do painel inicial |
| GET | `/api/pesquisa?q=termo` | Pesquisar equipes e atletas |
| GET | `/api/competicoes/:idComp/mata-mata` | Consultar chave da competição |
| POST | `/api/competicoes/:idComp/mata-mata` | Gerar/substituir chave |
| PATCH | `/api/partidas/:idPartida/resultado` | Registrar resultado e avançar vencedor |

O chaveamento é persistido em `tbChaveamento` (coluna JSON), pois o esquema original não possuía tabelas/campos para guardar rodadas, BYEs e vencedores do mata-mata.
