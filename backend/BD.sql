DROP DATABASE IF EXISTS db_etecscore;
CREATE DATABASE db_etecscore CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE db_etecscore;

CREATE TABLE tbUsuario (
  idUsuario INT PRIMARY KEY AUTO_INCREMENT,
  nomeUsuario VARCHAR(100) NOT NULL,
  emailUsuario VARCHAR(150) NOT NULL UNIQUE,
  senhaHash VARCHAR(255) NOT NULL,
  perfilAcesso VARCHAR(50) NOT NULL DEFAULT 'Comum'
);

CREATE TABLE tbModalidade (
  idModalidade INT PRIMARY KEY AUTO_INCREMENT,
  nomeModalidade VARCHAR(100) NOT NULL UNIQUE,
  descricao VARCHAR(200)
);

CREATE TABLE tbCompeticao (
  idComp INT PRIMARY KEY AUTO_INCREMENT,
  nomeComp VARCHAR(100) NOT NULL,
  statusComp VARCHAR(30) NOT NULL DEFAULT 'Planejada',
  idModalidade INT NOT NULL,
  CONSTRAINT fk_comp_modalidade FOREIGN KEY (idModalidade) REFERENCES tbModalidade(idModalidade)
);

CREATE TABLE tbEquipe (
  idEquipe INT PRIMARY KEY AUTO_INCREMENT,
  nomeEquipe VARCHAR(100) NOT NULL,
  identificacao VARCHAR(100)
);

CREATE TABLE tbInscricaoEquipe (
  idInscricao INT PRIMARY KEY AUTO_INCREMENT,
  idComp INT NOT NULL,
  idEquipe INT NOT NULL,
  statusInscricao VARCHAR(30) NOT NULL DEFAULT 'Ativo',
  CONSTRAINT fk_inscricao_comp FOREIGN KEY (idComp) REFERENCES tbCompeticao(idComp),
  CONSTRAINT fk_inscricao_equipe FOREIGN KEY (idEquipe) REFERENCES tbEquipe(idEquipe),
  CONSTRAINT uq_comp_equipe UNIQUE (idComp, idEquipe)
);

CREATE TABLE tbAtleta (
  idAtleta INT PRIMARY KEY AUTO_INCREMENT,
  nomeAtleta VARCHAR(100) NOT NULL,
  dataNascimento DATE,
  numeroMatricula VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE tbInscricaoAtleta (
  idInscricaoAtleta INT PRIMARY KEY AUTO_INCREMENT,
  idInscricao INT NOT NULL,
  idAtleta INT NOT NULL,
  numeroCamisa INT,
  CONSTRAINT fk_inscricao_atleta_equipe FOREIGN KEY (idInscricao) REFERENCES tbInscricaoEquipe(idInscricao),
  CONSTRAINT fk_inscricao_atleta FOREIGN KEY (idAtleta) REFERENCES tbAtleta(idAtleta),
  CONSTRAINT uq_inscricao_atleta UNIQUE (idInscricao, idAtleta)
);

CREATE TABLE tbPartida (
  idPartida INT PRIMARY KEY AUTO_INCREMENT,
  idComp INT NOT NULL,
  idInscricaoMandante INT NOT NULL,
  idInscricaoVisitante INT NOT NULL,
  dataHora DATETIME NOT NULL,
  statusPartida VARCHAR(30) NOT NULL DEFAULT 'Agendada',
  placarMandante INT NOT NULL DEFAULT 0,
  placarVisitante INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_partida_comp FOREIGN KEY (idComp) REFERENCES tbCompeticao(idComp),
  CONSTRAINT fk_partida_mandante FOREIGN KEY (idInscricaoMandante) REFERENCES tbInscricaoEquipe(idInscricao),
  CONSTRAINT fk_partida_visitante FOREIGN KEY (idInscricaoVisitante) REFERENCES tbInscricaoEquipe(idInscricao),
  CONSTRAINT chk_equipes_diferentes CHECK (idInscricaoMandante <> idInscricaoVisitante)
);

CREATE TABLE tbEventoPartida (
  idEvento INT PRIMARY KEY AUTO_INCREMENT,
  idPartida INT NOT NULL,
  idInscricao INT NOT NULL,
  idInscricaoAtleta INT,
  tipoEvento VARCHAR(50) NOT NULL,
  minuto INT,
  descricao VARCHAR(255),
  CONSTRAINT fk_evento_partida FOREIGN KEY (idPartida) REFERENCES tbPartida(idPartida),
  CONSTRAINT fk_evento_equipe FOREIGN KEY (idInscricao) REFERENCES tbInscricaoEquipe(idInscricao),
  CONSTRAINT fk_evento_atleta FOREIGN KEY (idInscricaoAtleta) REFERENCES tbInscricaoAtleta(idInscricaoAtleta)
);

CREATE TABLE tbEstatisticaEquipePartida (
  idEstatistica INT PRIMARY KEY AUTO_INCREMENT,
  idPartida INT NOT NULL,
  idInscricao INT NOT NULL,
  finalizacoes INT DEFAULT 0,
  faltas INT DEFAULT 0,
  CONSTRAINT fk_estatistica_equipe_partida FOREIGN KEY (idPartida) REFERENCES tbPartida(idPartida),
  CONSTRAINT fk_estatistica_equipe FOREIGN KEY (idInscricao) REFERENCES tbInscricaoEquipe(idInscricao),
  CONSTRAINT uq_estatistica_equipe_partida UNIQUE (idPartida, idInscricao)
);

CREATE TABLE tbEstatisticaAtletaPartida (
  idEstatistica INT PRIMARY KEY AUTO_INCREMENT,
  idPartida INT NOT NULL,
  idInscricaoAtleta INT NOT NULL,
  gols INT DEFAULT 0,
  assistencias INT DEFAULT 0,
  cartoesAmarelos INT DEFAULT 0,
  cartoesVermelhos INT DEFAULT 0,
  CONSTRAINT fk_estatistica_atleta_partida FOREIGN KEY (idPartida) REFERENCES tbPartida(idPartida),
  CONSTRAINT fk_estatistica_atleta FOREIGN KEY (idInscricaoAtleta) REFERENCES tbInscricaoAtleta(idInscricaoAtleta),
  CONSTRAINT uq_estatistica_atleta_partida UNIQUE (idPartida, idInscricaoAtleta)
);

CREATE TABLE tbChaveamento (
  idChaveamento INT PRIMARY KEY AUTO_INCREMENT,
  idComp INT NOT NULL UNIQUE,
  dadosChave JSON NOT NULL,
  criadoEm TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizadoEm TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_chaveamento_comp FOREIGN KEY (idComp) REFERENCES tbCompeticao(idComp)
);

-- Dados iniciais para desenvolvimento (sem forçar IDs manuais)
INSERT INTO tbModalidade (nomeModalidade, descricao) VALUES
('Futsal', 'Campeonato interno de futsal da escola');

INSERT INTO tbCompeticao (nomeComp, statusComp, idModalidade) VALUES
('Torneio Interclasse 2026', 'Em Andamento', 1);

INSERT INTO tbEquipe (nomeEquipe, identificacao) VALUES
('2º DS Matutino', 'Turma de Desenvolvimento de Sistemas'),
('3º Informática', 'Turma de Informática para Internet'),
('1º Administração', 'Turma de ADM');

INSERT INTO tbInscricaoEquipe (idComp, idEquipe, statusInscricao) VALUES
(1, 1, 'Ativo'),
(1, 2, 'Ativo'),
(1, 3, 'Ativo');

INSERT INTO tbAtleta (nomeAtleta, dataNascimento, numeroMatricula) VALUES
('Roberth Leite', '2008-05-15', 'MAT202601'),
('Carlos Silva', '2008-08-20', 'MAT202602');

INSERT INTO tbInscricaoAtleta (idInscricao, idAtleta, numeroCamisa) VALUES
(1, 1, 10),
(2, 2, 9);

INSERT INTO tbPartida (idComp, idInscricaoMandante, idInscricaoVisitante, dataHora, statusPartida, placarMandante, placarVisitante) VALUES
(1, 1, 2, '2026-11-10 14:00:00', 'Finalizado', 3, 2),
(1, 1, 3, '2026-11-11 15:00:00', 'Finalizado', 4, 1);

INSERT INTO tbEstatisticaAtletaPartida (idPartida, idInscricaoAtleta, gols, assistencias, cartoesAmarelos, cartoesVermelhos) VALUES
(1, 1, 2, 1, 0, 0),
(2, 1, 1, 2, 1, 0);