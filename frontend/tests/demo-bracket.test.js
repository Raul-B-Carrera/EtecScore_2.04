import test from 'node:test';
import assert from 'node:assert/strict';

const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.delete(key)
};

const demoStore = await import('../src/scripts/data/demoStore.js');

test('gera chave com 8 equipes em quartas, semifinal e final', () => {
  const bracket = demoStore.createDemoBracket(101, [1, 2, 3, 4, 5, 6, 7, 8]);

  assert.deepEqual(bracket.rounds.map((round) => round.matches.length), [4, 2, 1]);
  assert.deepEqual(bracket.rounds.map((round) => round.name), ['Quartas de final', 'Semifinal', 'Final']);
  assert.ok(bracket.rounds[0].matches.every((match) => match.teamA && match.teamB));
});

test('avança vencedores automaticamente até definir o campeão', () => {
  let bracket = demoStore.createDemoBracket(102, [1, 2, 3, 4, 5, 6, 7, 8]);

  for (const match of [...bracket.rounds[0].matches]) {
    bracket = demoStore.updateDemoMatchResult(102, match.idPartida, 2, 1);
  }
  assert.ok(bracket.rounds[1].matches.every((match) => match.teamA && match.teamB));

  for (const match of [...bracket.rounds[1].matches]) {
    bracket = demoStore.updateDemoMatchResult(102, match.idPartida, 1, 0);
  }
  const final = bracket.rounds[2].matches[0];
  assert.ok(final.teamA && final.teamB);

  bracket = demoStore.updateDemoMatchResult(102, final.idPartida, 3, 0);
  assert.ok(bracket.champion?.nomeEquipe);
});

test('distribui BYEs quando a quantidade de equipes não é potência de dois', () => {
  const bracket = demoStore.createDemoBracket(103, [1, 2, 3, 4, 5]);
  const firstRound = bracket.rounds[0].matches;

  assert.equal(firstRound.filter((match) => match.status === 'W.O.').length, 3);
  assert.equal(firstRound.filter((match) => match.status === 'AGENDADA').length, 1);
  assert.ok(firstRound.every((match) => match.teamA || match.teamB));
});

test('não permite excluir equipe já usada em uma chave', () => {
  demoStore.createDemoBracket(104, [1, 2, 3, 4]);
  assert.throws(() => demoStore.deleteDemoTeam(1), /vinculada a uma chave/);
});

test('exige vencedor explícito em caso de empate', () => {
  const bracket = demoStore.createDemoBracket(105, [1, 2]);
  const final = bracket.rounds[0].matches[0];
  assert.throws(() => demoStore.updateDemoMatchResult(105, final.idPartida, 1, 1), /critério de desempate/);
  const updated = demoStore.updateDemoMatchResult(105, final.idPartida, 1, 1, final.teamB.idEquipe);
  assert.equal(updated.champion.idEquipe, final.teamB.idEquipe);
});
