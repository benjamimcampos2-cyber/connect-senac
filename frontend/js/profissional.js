// frontend/js/profissional.js

const FALLBACK_BASE_URL = "http://localhost:3000/api";
const API_URL =
  window.location.protocol === "file:"
    ? FALLBACK_BASE_URL
    : `${window.location.origin}/api`;

const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "index.html";
}

try {
  const payloadToken = JSON.parse(atob(token.split(".")[1]));
  const nomeExibicao = payloadToken.nome || payloadToken.email.split("@")[0];
  document.getElementById("nomeProf").textContent = nomeExibicao;
} catch (e) {
  localStorage.removeItem("token");
  window.location.href = "index.html";
}

document.getElementById("btnSair").addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "index.html";
});

async function carregarMinhasTurmas() {
  const accordion = document.getElementById("accordionTurmas");
  try {
    const response = await fetch(`${API_URL}/profissional/minhas-turmas`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401 || response.status === 403) {
      alert("Sessão expirada ou acesso não autorizado.");
      localStorage.removeItem("token");
      window.location.href = "index.html";
      return;
    }

    const cursos = await response.json();
    accordion.innerHTML = "";

    if (!Array.isArray(cursos) || cursos.length === 0) {
      accordion.innerHTML =
        '<div class="alert alert-info border-0 shadow-sm">Nenhum curso ativo vinculado ao seu perfil de momento.</div>';
      return;
    }

    cursos.forEach((curso, index) => {
      let horariosHTML = "";

      if (curso.disponibilidades && curso.disponibilidades.length > 0) {
        // Ordenar as disponibilidades por data
        curso.disponibilidades.sort(
          (a, b) => new Date(a.data_hora) - new Date(b.data_hora)
        );

        curso.disponibilidades.forEach((disp) => {
          const dataFormatada = new Date(disp.data_hora).toLocaleString(
            "pt-BR",
            { dateStyle: "short", timeStyle: "short" }
          );

          // Filtrar agendamentos que não foram cancelados
          const agendamentosAtivos = (disp.agendamentos || []).filter(
            (a) => a.status !== "cancelado"
          );

          let tabelaModelos = "";
          if (agendamentosAtivos.length === 0) {
            tabelaModelos = `<p class="text-muted small mb-0 mt-2">Nenhum modelo agendado para este horário ainda.</p>`;
          } else {
            let linhas = agendamentosAtivos
              .map((ag) => {
                let acoesHTML = "";
                if (ag.status === "agendado") {
                  acoesHTML = `
                    <div class="d-flex gap-1">
                      <button class="btn btn-sm btn-outline-success fw-bold w-100" onclick="concluirServico('${ag.id}')" title="Confirmar Presença">✅ Concluir</button>
                      <button class="btn btn-sm btn-outline-danger fw-bold w-100" onclick="cancelarAluno('${ag.id}', '${ag.usuarios ? ag.usuarios.nome : "Modelo"}')" title="Cancelar / Falta">❌ Falta</button>
                    </div>
                  `;
                } else {
                  acoesHTML = `<span class="badge w-100 py-2 ${
                    ag.status === "concluido" ? "bg-success" : "bg-secondary"
                  }">${ag.status.toUpperCase()}</span>`;
                }

                const nomeModelo = ag.usuarios ? ag.usuarios.nome : "Não informado";
                const emailModelo = ag.usuarios ? ag.usuarios.email : "-";
                const telRaw = ag.usuarios ? ag.usuarios.telefone || "" : "";
                const telLimpo = telRaw.replace(/\D/g, "");

                // Mensagem personalizada para contato com o modelo via WhatsApp
                const msgProf = encodeURIComponent(
                  `Olá, ${nomeModelo}! Aqui é o(a) professor(a) do SENAC referente ao curso ${curso.nome}.`
                );

                const linkZap = telLimpo
                  ? `<a href="https://wa.me/55${telLimpo}?text=${msgProf}" target="_blank" class="btn btn-sm btn-outline-success border-0">📱 WhatsApp</a>`
                  : `<span class="text-muted small">Sem telefone</span>`;

                return `
                  <tr>
                    <td class="align-middle fw-semibold">${nomeModelo}</td>
                    <td class="align-middle">${emailModelo}</td>
                    <td class="align-middle">${linkZap}</td>
                    <td class="align-middle" style="width: 170px;">${acoesHTML}</td>
                  </tr>
                `;
              })
              .join("");

            tabelaModelos = `
              <table class="table table-sm mt-3 border">
                <thead class="table-light">
                  <tr>
                    <th>Modelo</th>
                    <th>Email</th>
                    <th>Contato</th>
                    <th class="text-center">Status / Ação</th>
                  </tr>
                </thead>
                <tbody>${linhas}</tbody>
              </table>`;
          }

          horariosHTML += `
            <div class="mb-4 p-3 bg-white border rounded shadow-sm">
              <div class="fw-bold text-dark border-bottom pb-2">
                📅 Aula: ${dataFormatada} 
                <span class="badge bg-secondary float-end">Ocupação: ${disp.vagas_ocupadas} / ${disp.vagas_totais}</span>
              </div>
              ${tabelaModelos}
            </div>
          `;
        });
      }

      const itemOpen = index === 0 ? "show" : "";
      const btnCollapsed = index === 0 ? "" : "collapsed";

      accordion.innerHTML += `
        <div class="accordion-item border-0 border-bottom">
          <h2 class="accordion-header">
            <button class="accordion-button ${btnCollapsed}" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${curso.id}">
              📘 ${curso.nome}
            </button>
          </h2>
          <div id="collapse${curso.id}" class="accordion-collapse collapse ${itemOpen}" data-bs-parent="#accordionTurmas">
            <div class="accordion-body bg-light">
              ${horariosHTML || '<p class="text-muted">Sem horários abertos para este curso.</p>'}
            </div>
          </div>
        </div>
      `;
    });
  } catch (error) {
    console.error("Erro ao carregar turmas:", error);
    accordion.innerHTML =
      '<div class="text-danger p-4">Erro ao carregar os dados. Verifique a conexão com o servidor.</div>';
  }
}

// Concluir atendimento / Confirmar presença
async function concluirServico(agendamentoId) {
  if (!confirm("O modelo compareceu e o serviço foi realizado com sucesso?")) {
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/profissional/agendamentos/${agendamentoId}/concluir`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (response.ok) {
      carregarMinhasTurmas();
    } else {
      const data = await response.json();
      alert(data.erro || "Erro ao concluir agendamento.");
    }
  } catch (error) {
    alert("Erro ao conectar com o servidor.");
  }
}

// Cancelar / Registrar falta do modelo
async function cancelarAluno(agendamentoId, nome) {
  if (
    !confirm(
      `Deseja remover ${nome} da pauta? A vaga será reaberta para outro modelo.`
    )
  ) {
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/profissional/agendamentos/${agendamentoId}/cancelar`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (response.ok) {
      carregarMinhasTurmas();
    } else {
      const data = await response.json();
      alert(data.erro || "Erro ao cancelar inscrição.");
    }
  } catch (error) {
    alert("Erro na conexão com o servidor.");
  }
}

// Carregar turmas ao iniciar
carregarMinhasTurmas();
