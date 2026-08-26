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
            tabelaModelos = `<p class="text-slate-400 text-xs py-4 text-center font-medium bg-slate-50/50 rounded-xl">Nenhum modelo agendado para este horário ainda.</p>`;
          } else {
            let linhas = agendamentosAtivos
              .map((ag) => {
                let acoesHTML = "";
                if (ag.status === "agendado") {
                  acoesHTML = `
                    <div class="flex items-center gap-2 justify-center">
                      <button class="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-soft-sm transition active:scale-95" onclick="concluirServico('${ag.id}')" title="Confirmar Presença">
                        <span>✓</span> Presença
                      </button>
                      <button class="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-700 shadow-soft-sm transition active:scale-95" onclick="cancelarAluno('${ag.id}', '${ag.usuarios ? ag.usuarios.nome : "Modelo"}')" title="Cancelar / Falta">
                        <span>✕</span> Falta
                      </button>
                    </div>
                  `;
                } else if (ag.status === "concluido") {
                  acoesHTML = `<span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>Concluído</span>`;
                } else {
                  acoesHTML = `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">${ag.status.toUpperCase()}</span>`;
                }

                const rawNomeModelo = ag.usuarios ? ag.usuarios.nome : "Não informado";
                const safeNomeModelo = window.escapeHTML ? window.escapeHTML(rawNomeModelo) : rawNomeModelo;
                const safeEmailModelo = window.escapeHTML ? window.escapeHTML(ag.usuarios ? ag.usuarios.email : "-") : "-";
                const telRaw = ag.usuarios ? ag.usuarios.telefone || "" : "";
                const safeTel = window.escapeHTML ? window.escapeHTML(telRaw || "-") : (telRaw || "-");
                const telLimpo = telRaw.replace(/\D/g, "");

                const msgProf = encodeURIComponent(
                  `Olá, ${rawNomeModelo}! Aqui é o(a) instrutor(a) do Senac referente ao curso de ${curso.nome}.`
                );

                const linkZap = telLimpo
                  ? `<a href="https://wa.me/55${telLimpo}?text=${msgProf}" target="_blank" class="inline-flex items-center gap-1.5 font-bold text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors">
                      <span>📱</span> WhatsApp
                    </a>`
                  : `<span class="text-slate-400 text-xs">Sem telefone</span>`;

                return `
                  <tr class="hover:bg-slate-50/80 transition-colors">
                    <td class="py-3 px-4 font-bold text-slate-900">${safeNomeModelo}</td>
                    <td class="py-3 px-4 text-slate-600">${safeEmailModelo}</td>
                    <td class="py-3 px-4">${linkZap}</td>
                    <td class="py-3 px-4 text-center">${acoesHTML}</td>
                  </tr>
                `;
              })
              .join("");

            tabelaModelos = `
              <div class="overflow-x-auto rounded-2xl border border-slate-200/80 mt-3">
                <table class="min-w-full divide-y divide-slate-200 text-left text-xs">
                  <thead class="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th class="py-3 px-4">Modelo Voluntário(a)</th>
                      <th class="py-3 px-4">E-mail</th>
                      <th class="py-3 px-4">Contato Direto</th>
                      <th class="py-3 px-4 text-center">Status / Frequência</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 bg-white">${linhas}</tbody>
                </table>
              </div>`;
          }

          horariosHTML += `
            <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft-sm">
              <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-2">
                <div class="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <span class="text-brand-600">📅</span> Aula Prática: ${dataFormatada}
                </div>
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200">
                  <span class="w-1.5 h-1.5 rounded-full bg-senac-orange"></span>
                  Vagas: ${disp.vagas_ocupadas} / ${disp.vagas_totais}
                </span>
              </div>
              ${tabelaModelos}
            </div>
          `;
        });
      }

      const itemOpen = index === 0 ? "show" : "";
      const badgeText = index === 0 ? "Ocultar Pauta ↑" : "Ver Pauta ↓";
      const safeCursoNome = window.escapeHTML ? window.escapeHTML(curso.nome || '') : (curso.nome || '');

      accordion.innerHTML += `
        <div class="bg-white rounded-3xl border border-slate-200/80 shadow-soft-sm hover:shadow-soft-md overflow-hidden transition-all">
          <h2>
            <button class="w-full flex items-center justify-between p-6 text-left font-extrabold text-slate-900 hover:bg-slate-50 transition cursor-pointer" type="button" onclick="toggleCollapse('collapse${curso.id}', this)">
              <div class="flex items-center gap-3">
                <span class="p-2 rounded-xl bg-brand-50 text-brand-600 text-lg shadow-soft-sm">📘</span>
                <span class="text-base sm:text-lg">${safeCursoNome}</span>
              </div>
              <span class="collapse-badge text-xs text-brand-600 font-bold bg-brand-50 hover:bg-brand-100 px-3.5 py-1.5 rounded-xl border border-brand-200 transition-colors">${badgeText}</span>
            </button>
          </h2>
          <div id="collapse${curso.id}" class="collapse ${itemOpen} border-t border-slate-100">
            <div class="p-5 sm:p-6 bg-slate-50/40 space-y-5">
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
