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

window.toggleCollapse = function(targetId, btn) {
  const el = document.getElementById(targetId);
  if (!el) return;
  const isShown = el.classList.contains("show");
  if (isShown) {
    el.classList.remove("show");
    if (btn) {
      const badge = btn.querySelector(".collapse-badge");
      if (badge) badge.textContent = "Ver Pauta ↓";
    }
  } else {
    el.classList.add("show");
    if (btn) {
      const badge = btn.querySelector(".collapse-badge");
      if (badge) badge.textContent = "Ocultar Pauta ↑";
    }
  }
};

async function carregarMinhasTurmas() {
  const accordion = document.getElementById("accordionTurmas");
  try {
    const response = await fetch(`${API_URL}/profissional/minhas-turmas`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401 || response.status === 403) {
      if (window.showToast) window.showToast("Sessão expirada ou acesso não autorizado.", "error");
      localStorage.removeItem("token");
      setTimeout(() => (window.location.href = "index.html"), 1000);
      return;
    }

    const cursos = await response.json();
    accordion.innerHTML = "";

    if (!Array.isArray(cursos) || cursos.length === 0) {
      accordion.innerHTML = `
        <div class="p-8 sm:p-12 text-center bg-white rounded-3xl border border-slate-200">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 text-2xl mb-4">
            👨‍🏫
          </div>
          <h3 class="text-base font-bold text-slate-800 mb-1">Nenhuma turma ativa vinculada ao seu perfil</h3>
          <p class="text-xs text-slate-500 max-w-md mx-auto">Assim que a coordenação vincular novos cursos ou abrir horários para as suas turmas, eles serão exibidos aqui.</p>
        </div>
      `;
      return;
    }

    cursos.forEach((curso, index) => {
      let horariosHTML = "";

      if (curso.disponibilidades && curso.disponibilidades.length > 0) {
        curso.disponibilidades.sort(
          (a, b) => new Date(a.data_hora) - new Date(b.data_hora)
        );

        curso.disponibilidades.forEach((disp) => {
          const dataFormatada = new Date(disp.data_hora).toLocaleString(
            "pt-BR",
            { dateStyle: "short", timeStyle: "short" }
          );

          const agendamentosAtivos = (disp.agendamentos || []).filter(
            (a) => a.status !== "cancelado"
          );

          let tabelaModelos = "";
          if (agendamentosAtivos.length === 0) {
            tabelaModelos = `<p class="text-slate-400 text-xs py-3 text-center">Nenhum modelo agendado para este horário ainda.</p>`;
          } else {
            let linhas = agendamentosAtivos
              .map((ag) => {
                let acoesHTML = "";
                if (ag.status === "agendado") {
                  acoesHTML = `
                    <div class="flex items-center gap-1.5 justify-center">
                      <button class="inline-flex items-center gap-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 text-xs font-bold text-emerald-700 transition active:scale-95" onclick="concluirServico('${ag.id}')" title="Confirmar Presença">✅ Presença</button>
                      <button class="inline-flex items-center gap-1 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1.5 text-xs font-bold text-rose-700 transition active:scale-95" onclick="cancelarAluno('${ag.id}', '${ag.usuarios ? ag.usuarios.nome : "Modelo"}')" title="Cancelar / Falta">❌ Falta</button>
                    </div>
                  `;
                } else if (ag.status === "concluido") {
                  acoesHTML = `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">CONCLUÍDO</span>`;
                } else {
                  acoesHTML = `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">${ag.status.toUpperCase()}</span>`;
                }

                const nomeModelo = ag.usuarios ? ag.usuarios.nome : "Não informado";
                const emailModelo = ag.usuarios ? ag.usuarios.email : "-";
                const telRaw = ag.usuarios ? ag.usuarios.telefone || "" : "";
                const telLimpo = telRaw.replace(/\D/g, "");

                const msgProf = encodeURIComponent(
                  `Olá, ${nomeModelo}! Aqui é o(a) professor(a) do SENAC referente ao curso ${curso.nome}.`
                );

                const linkZap = telLimpo
                  ? `<a href="https://wa.me/55${telLimpo}?text=${msgProf}" target="_blank" class="inline-flex items-center gap-1 font-semibold text-emerald-600 hover:text-emerald-800 transition">📱 WhatsApp</a>`
                  : `<span class="text-slate-400">Sem telefone</span>`;

                return `
                  <tr class="hover:bg-slate-50/70 transition-colors">
                    <td class="py-3 px-4 font-semibold text-slate-900">${nomeModelo}</td>
                    <td class="py-3 px-4 text-slate-600">${emailModelo}</td>
                    <td class="py-3 px-4">${linkZap}</td>
                    <td class="py-3 px-4 text-center">${acoesHTML}</td>
                  </tr>
                `;
              })
              .join("");

            tabelaModelos = `
              <div class="overflow-x-auto rounded-xl border border-slate-100 mt-3">
                <table class="min-w-full divide-y divide-slate-100 text-left text-xs">
                  <thead class="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th class="py-2.5 px-4">Modelo</th>
                      <th class="py-2.5 px-4">E-mail</th>
                      <th class="py-2.5 px-4">Contato</th>
                      <th class="py-2.5 px-4 text-center">Status / Ação</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 bg-white">${linhas}</tbody>
                </table>
              </div>`;
          }

          horariosHTML += `
            <div class="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
              <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-2">
                <div class="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <span>📅</span> Aula: ${dataFormatada}
                </div>
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                  Ocupação: ${disp.vagas_ocupadas} / ${disp.vagas_totais}
                </span>
              </div>
              ${tabelaModelos}
            </div>
          `;
        });
      }

      const itemOpen = index === 0 ? "show" : "";
      const badgeText = index === 0 ? "Ocultar Pauta ↑" : "Ver Pauta ↓";

      accordion.innerHTML += `
        <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all">
          <h2>
            <button class="w-full flex items-center justify-between p-5 text-left font-bold text-slate-900 hover:bg-slate-50 transition cursor-pointer" type="button" onclick="toggleCollapse('collapse${curso.id}', this)">
              <div class="flex items-center gap-3">
                <span class="text-xl">📘</span>
                <span class="text-base">${curso.nome}</span>
              </div>
              <span class="collapse-badge text-xs text-brand-600 font-semibold bg-brand-50 px-3 py-1 rounded-lg">${badgeText}</span>
            </button>
          </h2>
          <div id="collapse${curso.id}" class="collapse ${itemOpen} border-t border-slate-100">
            <div class="p-5 sm:p-6 bg-slate-50/50 space-y-5">
              ${horariosHTML || '<p class="text-xs text-slate-400 text-center py-4">Sem horários abertos para este curso.</p>'}
            </div>
          </div>
        </div>
      `;
    });
  } catch (error) {
    console.error("Erro ao carregar turmas:", error);
    accordion.innerHTML =
      '<div class="p-8 text-center text-rose-600 text-sm bg-white rounded-3xl border border-slate-200">Erro ao carregar os dados. Verifique a conexão com o servidor.</div>';
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
      if (window.showToast) window.showToast("Presença registrada e atendimento concluído!", "success");
      carregarMinhasTurmas();
    } else {
      const data = await response.json();
      if (window.showToast) window.showToast(data.erro || "Erro ao concluir agendamento.", "error");
    }
  } catch (error) {
    if (window.showToast) window.showToast("Erro ao conectar com o servidor.", "error");
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
      if (window.showToast) window.showToast(`Inscrição de ${nome} cancelada. A vaga foi reaberta.`, "info");
      carregarMinhasTurmas();
    } else {
      const data = await response.json();
      if (window.showToast) window.showToast(data.erro || "Erro ao cancelar inscrição.", "error");
    }
  } catch (error) {
    if (window.showToast) window.showToast("Erro na conexão com o servidor.", "error");
  }
}

// Carregar turmas ao iniciar
carregarMinhasTurmas();
