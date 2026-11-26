const form = document.getElementById("form-cadastro-equipe");
const inputNome = document.getElementById("nomeEquipe");
const inputIdent = document.getElementById("identificacao");
const feedback = document.getElementById("mensagem-feedback");
const btnSubmit = document.getElementById("btn-salvar-equipe");

function mostrarMensagem(texto) {
  if (!feedback) return;
  feedback.hidden = false;
  feedback.textContent = texto;
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (feedback) {
    feedback.hidden = true;
    feedback.textContent = "";
  }

  const payload = {
    nomeEquipe: inputNome?.value ?? "",
    identificacao: inputIdent?.value ?? "",
  };

  if (btnSubmit) btnSubmit.disabled = true;

  try {
    const resposta = await fetch("http://localhost:3000/api/equipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      mostrarMensagem(dados.erro || "Não foi possível cadastrar a equipe.");
      return;
    }

    mostrarMensagem(`Equipe "${dados.nomeEquipe}" cadastrada com sucesso (ID: ${dados.idEquipe}).`);
    form.reset();
  } catch {
    mostrarMensagem("Falha ao comunicar com o servidor em http://localhost:3000.");
  } finally {
    if (btnSubmit) btnSubmit.disabled = false;
  }
});