# EtecScore — Front-End 1.0

Front-End Vanilla (HTML, JavaScript ES Modules, CSS e Tailwind CSS v4) para o EtecScore. A estrutura evita Web Components e mantém páginas, scripts, componentes, API e estilos separados.

## Escopo implementado

### Público
- Dashboard com partidas em andamento, resultados do dia e próximos jogos.
- Navegação por modalidade.
- Lista de equipes.
- Chave de mata-mata responsiva.
- Detalhes de partidas em modal.
- Busca global por equipes e atletas (sem páginas de perfil).

### Gestão demonstrativa
- Criar, editar e excluir equipes.
- Gerar chave a partir de equipes selecionadas.
- Registrar resultados e avançar vencedores automaticamente.
- Persistência local no `localStorage` quando o modo demonstração está ativo.

> **Importante:** a gestão local serve para validar os fluxos de interface. Ela não substitui autenticação, autorização ou persistência do servidor.

## Executar

Pré-requisitos: Node.js 18+ e npm.

```bash
npm install
npm run dev
```

Em outro terminal, sirva a pasta por HTTP. Com Python:

```bash
python3 -m http.server 5500
```

Acesse `http://localhost:5500`.

Para gerar o CSS final:

```bash
npm run build
```

Para executar os testes da lógica demonstrativa do chaveamento:

```bash
npm test
```

Não abra os HTMLs diretamente com `file://`, pois os módulos JavaScript usam ES Modules.

## Estrutura

```text
EtecScore-Front_End/
├── index.html
├── equipes.html
├── mata-mata.html
├── package.json
└── src/
    ├── assets/
    ├── styles/
    │   ├── input.css
    │   ├── output.css
    │   ├── tokens.css
    │   ├── globals.css
    │   ├── components.css
    │   └── pages.css
    └── scripts/
        ├── api/
        ├── components/
        ├── data/
        ├── pages/
        ├── utils/
        └── main.js
```

## Configuração da API

Edite `src/scripts/api/apiConfig.js`:

```js
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3000',
  DEMO_MODE: true
};
```

- `DEMO_MODE: true`: usa dados iniciais e persiste alterações no navegador.
- `DEMO_MODE: false`: usa `fetch` para a API configurada.

### Rotas existentes identificadas no repositório do Back-End

| Método | Rota | Contrato identificado |
|---|---|---|
| GET | `/api/home` | `{ sucesso: true, jogos: [...] }` |
| GET | `/api/pesquisa?q=termo` | `{ sucesso: true, resultados: [...] }` |

O `GET /api/home` atualmente retorna `idPartida`, `nomeModalidade`, `equipeA`, `placarA`, `equipeB`, `placarB` e `status`. A consulta ainda não retorna `dataHora`/local, então a interface não presume que esses campos existem.

### Rotas necessárias para integração completa

O repositório consultado contém funções DAO para buscar/criar/excluir equipes, mas ainda não expõe rotas HTTP de CRUD, inscrição de equipes, competições, partidas ou chave. O Front-End espera os seguintes contratos REST por padrão; ajuste `API_ENDPOINTS` em `apiConfig.js` se o Back-End adotar outros caminhos.

| Método | Rota esperada | Corpo / resposta esperada |
|---|---|---|
| GET | `/api/equipes` | `{ sucesso, equipes: [{ idEquipe, nomeEquipe, identificacao }] }` |
| POST | `/api/equipes` | `{ nomeEquipe, identificacao }` |
| PUT | `/api/equipes/:id` | `{ nomeEquipe, identificacao }` |
| DELETE | `/api/equipes/:id` | `{ sucesso, mensagem }` |
| GET | `/api/competicoes` | `{ sucesso, competicoes: [{ idComp, nomeComp, nomeModalidade }] }` |
| GET | `/api/competicoes/:id/inscricoes` | `{ sucesso, inscricoes: [{ idInscricao, idEquipe, nomeEquipe, identificacao, statusInscricao }] }` |
| GET | `/api/competicoes/:id/mata-mata` | `{ sucesso, chave: { rounds, champion } }` |
| POST | `/api/competicoes/:id/mata-mata` | `{ idsInscricao: [idInscricao], criterio: 'sorteio', substituir: false }` |
| PATCH | `/api/partidas/:id/resultado` | `{ placarMandante, placarVisitante, idEquipeVencedora }` |

**Atenção:** `tbPartida` referencia `idInscricao` nos dois lados, então para uma chave real o Back-End precisa retornar/aceitar os IDs de inscrição, não somente `idEquipe`. A camada de API está isolada para que essa adaptação seja feita em um único lugar. A seleção do mata-mata utiliza IDs de inscrição (`idInscricao`), não IDs globais de equipe (`idEquipe`), pois os confrontos precisam pertencer à competição selecionada.

## Pontos de integração a corrigir/confirmar no Back-End

Na versão `main` consultada em 24/11/2026:

1. `package.json` executa `nodemon server.js`, mas `server.js` não aparece no diretório raiz.
2. `js/homepage.js` declara `/api/home` e `/api/pesquisa`, mas o roteador ainda precisa ser montado em um servidor Express. Além disso, o import `./connection.js` aponta para dentro de `js/`, embora `connection.js` esteja na raiz (o caminho relativo esperado a partir de `js/` seria `../connection.js`).
3. `js/mata-mata.js` importa `../../connection.js`; a partir de `js/`, esse caminho também não aponta para o arquivo de conexão na raiz (o caminho esperado seria `../connection.js`).
4. `connection.js` aponta para o banco `etec_score`, enquanto `BD.sql` cria `db_etecscore`.
5. `BD.sql` declara a FK de `tbCompeticao` para `id_modalidade`, mas não declara essa coluna na definição apresentada.
6. Os DAOs de equipes/atletas consultam `Equipe` e `Atleta`, enquanto o SQL cria `tbEquipe` e `tbAtleta`.
7. Os DAOs disponíveis não são, por si só, endpoints HTTP. É necessário criar e registrar as rotas/controladores correspondentes.

Esses pontos não são corrigidos pelo Front-End. Até que a API esteja pronta, mantenha `DEMO_MODE: true`.

## Decisões de implementação

- Vanilla JS com ES Modules; sem framework e sem Web Components.
- Componentes são funções que geram HTML e módulos de comportamento.
- `textContent` é preferido para dados não confiáveis; templates dinâmicos usam `escapeHTML`.
- Sem tela de Profile, conforme solicitado.
- Os estados visuais de partida são: Agendada, Em andamento, Finalizada, Adiada, Suspensa, Cancelada e W.O.
- O MVP da chave usa eliminação simples. Regras oficiais de empate/desempate devem ser confirmadas no regulamento da modalidade.
