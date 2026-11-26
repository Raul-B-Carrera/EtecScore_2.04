# API de atletas — EtecScore

Base URL local: `http://localhost:3000`
Todas as respostas e requisições usam JSON. Os IDs devem ser inteiros positivos.

## Cadastro geral de atletas

- `GET /api/atletas` — retorna `{ "atletas": [...] }` com `idAtleta`, `nomeAtleta`, `dataNascimento` e `numeroMatricula`.
- `POST /api/atletas` — cadastra atleta. Corpo:
  ```json
  { "nomeAtleta": "Ana Souza", "dataNascimento": "2008-05-15", "numeroMatricula": "MAT2026001" }
  ```
  `dataNascimento` pode ser `null` ou omitida. Retorna HTTP 201 e o atleta criado.
- `PUT /api/atletas/:idAtleta` — atualiza os mesmos três campos do cadastro. Envie o objeto completo; `dataNascimento` pode ser `null`.
- `DELETE /api/atletas/:idAtleta` — exclui o cadastro geral. Se o atleta ainda estiver inscrito em alguma equipe, retorna HTTP 409; remova os vínculos primeiro.

## Atletas de uma inscrição de equipe

**Importante:** use `idInscricao`, e não `idEquipe`. A inscrição identifica a participação de uma equipe em uma competição (`tbInscricaoEquipe`). Assim, uma mesma equipe pode ter atletas diferentes em competições diferentes.

- `GET /api/inscricoes-equipes/:idInscricao/atletas` — retorna `{ "inscricao": {...}, "atletas": [...] }`. Cada atleta inclui `idInscricaoAtleta`, `idAtleta`, `numeroCamisa` e os dados cadastrais.
- `POST /api/inscricoes-equipes/:idInscricao/atletas` — vincula um atleta já cadastrado. Corpo:
  ```json
  { "idAtleta": 1, "numeroCamisa": 10 }
  ```
  `numeroCamisa` pode ser `null` ou um inteiro de 0 a 99. Retorna HTTP 201 com `idInscricaoAtleta`.
- `PUT /api/inscricoes-atletas/:idInscricaoAtleta` — altera o número da camisa. Corpo: `{ "numeroCamisa": 7 }` (ou `null`).
- `DELETE /api/inscricoes-atletas/:idInscricaoAtleta` — remove apenas o vínculo com a equipe/competição; não apaga o cadastro do atleta. Se houver eventos/estatísticas relacionados, o banco impede a remoção e a API retorna HTTP 409.

## Fluxo sugerido para a tela

1. Carregar o cadastro para selecionar atletas com `GET /api/atletas`.
2. Carregar os atletas já inscritos com `GET /api/inscricoes-equipes/:idInscricao/atletas`.
3. Vincular com `POST` nessa mesma rota, atualizar camisa com `PUT` e remover da inscrição com `DELETE`.
4. Para cadastrar um atleta novo, usar primeiro `POST /api/atletas` e depois vincular o `idAtleta` retornado.

## Respostas de erro

A API retorna JSON no formato `{ "erro": "mensagem" }`. Códigos mais comuns: `400` dados/IDs inválidos, `404` registro não encontrado, `409` matrícula duplicada, vínculo duplicado ou conflito com registros relacionados, `500` erro interno.
