// frontend/js/painel.js

const FALLBACK_BASE_URL = 'http://localhost:3000/api';
const API_URL = window.location.protocol === 'file:' ? FALLBACK_BASE_URL : `${window.location.origin}/api`;

const token = localStorage.getItem('token');
if (!token) window.location.href = 'index.html';

document.getElementById('btnSair').addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
});

// Instâncias de Modais
const modalAgendamento = new bootstrap.Modal(document.getElementById('modalAgendamento'));
const modalFeedback = new bootstrap.Modal(document.getElementById('modalFeedback'));
const modalDetalhesCurso = new bootstrap.Modal(document.getElementById('modalDetalhesCurso'));

// ==========================================
// 1. CARREGAR A VITRINE DE CURSOS
// ==========================================
window.cursosMap = new Map();

async function carregarCursos(){
    const divCursos = document.getElementById('listaCursos');
    try {
        const response = await fetch(`${API_URL}/cursos/ativos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const cursos = await response.json();

        divCursos.innerHTML = '';
        window.cursosMap.clear();

        if (!Array.isArray(cursos) || cursos.length === 0) {
            divCursos.innerHTML = `
                <div class="col-span-full bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center">
                    <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 text-2xl mb-4">
                        ✨
                    </div>
                    <h3 class="text-base font-bold text-slate-800 mb-1">Nenhum serviço disponível no momento</h3>
                    <p class="text-xs text-slate-500 max-w-sm mx-auto">Novos cursos e horários práticos para modelos são abertos frequentemente pela coordenação.</p>
                </div>
            `;
            return;
        }

        cursos.forEach(curso => {
            window.cursosMap.set(String(curso.id), curso);

            const safeNome = window.escapeHTML ? window.escapeHTML(curso.nome) : curso.nome;
            const safeDescricao = window.escapeHTML ? window.escapeHTML(curso.descricao) : curso.descricao;
            const safeProfNome = window.escapeHTML ? window.escapeHTML(curso.usuarios ? curso.usuarios.nome : 'A definir') : 'A definir';
            const safeLocal = window.escapeHTML ? window.escapeHTML(curso.localizacao || 'SENAC') : 'SENAC';
            const safeImagem = curso.foto_url ? window.escapeHTML(curso.foto_url) : 'https://via.placeholder.com/600x400/004a8d/ffffff?text=Connect+Senac';

            const card = `
                <div class="group bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col cursor-pointer hover:-translate-y-1" onclick="abrirModalDetalhesCurso('${curso.id}')">
                    <div class="relative h-48 w-full bg-slate-100 overflow-hidden">
                        <img src="${safeImagem}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="${safeNome}">
                        <div class="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-lg border border-white/60 shadow-xs">
                            📍 ${safeLocal}
                        </div>
                    </div>
                    <div class="p-6 flex-1 flex flex-col justify-between">
                        <div>
                            <h3 class="font-bold text-slate-900 text-base mb-1.5 group-hover:text-brand-600 transition-colors">${safeNome}</h3>
                            <p class="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">${safeDescricao}</p>
                        </div>
                        <div class="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                            <span class="text-xs font-medium text-slate-500 truncate max-w-[140px]">Prof. ${safeProfNome}</span>
                            <span class="text-xs font-bold text-brand-600 group-hover:translate-x-1 transition-transform">Ver Detalhes →</span>
                        </div>
                    </div>
                </div>
            `;
            divCursos.innerHTML += card;
        });
    } catch (error) {
        divCursos.innerHTML = '<div class="col-span-full text-center py-10 text-rose-500 text-sm">Erro ao carregar os cursos.</div>';
    }
}

// ==========================================
// 1.5 MODAL DE DETALHES DO CURSO
// ==========================================
function abrirModalDetalhesCurso(cursoId){
    const curso = typeof cursoId === 'object' ? cursoId : window.cursosMap.get(String(cursoId));
    if (!curso) return;

    document.getElementById('detalheCursoNome').textContent = curso.nome;
    document.getElementById('detalheCursoProf').textContent = curso.usuarios ? curso.usuarios.nome : 'A definir';
    document.getElementById('detalheCursoLocal').textContent = curso.localizacao || 'SENAC';
    document.getElementById('detalheCursoDescricao').textContent = curso.descricao;
    document.getElementById('detalheCursoImagem').src = curso.foto_url || 'https://via.placeholder.com/800x400/004a8d/ffffff?text=Connect+Senac';

    const blocoRestricoes = document.getElementById('blocoRestricoes');
    if (curso.restricoes && curso.restricoes.trim() !== '') {
        blocoRestricoes.classList.remove('hidden');
        document.getElementById('detalheCursoRestricoes').textContent = curso.restricoes;
    } else {
        blocoRestricoes.classList.add('hidden');
    }

    const btnHorarios = document.getElementById('btnIrParaHorarios');
    btnHorarios.onclick = () => {
        modalDetalhesCurso.hide();
        setTimeout(() => {
            abrirModalAgendamento(curso.id, curso.nome, curso.descricao);
        }, 400);
    };

    const divAvaliacoes = document.getElementById('detalheCursoAvaliacoes');
    divAvaliacoes.innerHTML = '<div class="text-center text-slate-400 text-xs py-3">A carregar avaliações...</div>';

    fetch(`${API_URL}/feedbacks/curso/${curso.id}`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(feedbacks => {
            if (!Array.isArray(feedbacks) || feedbacks.length === 0) {
                divAvaliacoes.innerHTML = '<div class="text-slate-400 text-xs text-center py-3">Este curso ainda não possui avaliações. Seja o primeiro a avaliar!</div>';
                return;
            }

            const media = (feedbacks.reduce((acc, curr) => acc + curr.nota, 0) / feedbacks.length).toFixed(1);

            let html = `
                <div class="flex items-center gap-2 mb-3 bg-amber-50 rounded-xl p-2.5 border border-amber-100">
                    <span class="text-xs font-bold text-amber-800">Nota Média: ${media} / 5.0</span>
                    <span class="text-xs text-amber-600">(${feedbacks.length} avaliações)</span>
                </div>
            `;

            feedbacks.forEach(f => {
                const estrelas = '⭐'.repeat(Math.max(1, Math.min(5, f.nota || 5)));
                const dataFormatada = new Date(f.created_at).toLocaleDateString('pt-BR');
                const safeAvaliador = window.escapeHTML ? window.escapeHTML(f.avaliador_nome || 'Anônimo') : (f.avaliador_nome || 'Anônimo');
                const safeComentario = f.comentario ? `"${window.escapeHTML ? window.escapeHTML(f.comentario) : f.comentario}"` : '<span class="text-slate-400 italic">Sem comentário adicional.</span>';

                html += `
                    <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                        <div class="flex items-center justify-between mb-1">
                            <strong class="text-xs font-bold text-slate-800">${safeAvaliador}</strong>
                            <span class="text-[11px] text-slate-400">${dataFormatada}</span>
                        </div>
                        <div class="text-xs text-amber-500 mb-1">${estrelas}</div>
                        <div class="text-xs text-slate-600 leading-relaxed">${safeComentario}</div>
                    </div>
                `;
            });
            divAvaliacoes.innerHTML = html;
        });

    modalDetalhesCurso.show();
}

// ==========================================
// 2. FLUXO DE AGENDAMENTO (MODAL E HORÁRIOS)
// ==========================================
async function abrirModalAgendamento(cursoId, cursoNome, cursoDescricao){
    document.getElementById('modalCursoNome').textContent = cursoNome;
    document.getElementById('modalCursoDescricao').textContent = cursoDescricao;
    document.getElementById('msgAgendamento').innerHTML = '';

    const select = document.getElementById('selectHorarios');
    select.innerHTML = '<option value="" disabled selected>A procurar horários...</option>';

    const btnConfirmar = document.getElementById('btnConfirmarAgendamento');
    btnConfirmar.onclick = () => realizarAgendamento(select.value);

    modalAgendamento.show();

    try {
        const response = await fetch(`${API_URL}/disponibilidades/curso/${cursoId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const horarios = await response.json();

        select.innerHTML = '<option value="" disabled selected>Escolha um horário...</option>';

        if (!Array.isArray(horarios) || horarios.length === 0) {
            select.innerHTML = '<option value="" disabled selected>Sem vagas no momento.</option>';
            btnConfirmar.disabled = true;
            return;
        }

        btnConfirmar.disabled = false;
        horarios.forEach(h => {
            const dataFormatada = new Date(h.data_hora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
            const vagasLivres = h.vagas_totais - h.vagas_ocupadas;
            select.innerHTML += `<option value="${h.id}">${dataFormatada} (${vagasLivres} vagas livres)</option>`;
        });
    } catch (error) {
        select.innerHTML = '<option value="" disabled selected>Erro ao carregar horários.</option>';
    }
}

async function realizarAgendamento(disponibilidadeId){
    const msgDiv = document.getElementById('msgAgendamento');
    if (!disponibilidadeId) {
        msgDiv.innerHTML = '<span class="text-rose-600">Por favor, selecione um horário.</span>';
        if (window.showToast) window.showToast('Por favor, selecione um horário disponível.', 'warning');
        return;
    }

    msgDiv.innerHTML = '<span class="text-brand-600 font-medium">A confirmar presença...</span>';
    try {
        const response = await fetch(`${API_URL}/agendamentos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ disponibilidade_id: disponibilidadeId })
        });

        const data = await response.json();

        if (response.ok) {
            msgDiv.innerHTML = `<span class="text-emerald-600 font-bold">Agendamento concluído com sucesso!</span>`;
            if (window.showToast) window.showToast('Presença confirmada com sucesso! Consulte seus agendamentos.', 'success');
            carregarMeusAgendamentos();
            setTimeout(() => modalAgendamento.hide(), 1200);
        } else {
            msgDiv.innerHTML = `<span class="text-rose-600">${data.erro}</span>`;
            if (window.showToast) window.showToast(data.erro || 'Erro ao agendar horário.', 'error');
        }
    } catch (error) {
        msgDiv.innerHTML = '<span class="text-rose-600">Erro de conexão com o servidor.</span>';
        if (window.showToast) window.showToast('Erro de conexão com o servidor.', 'error');
    }
}

// ==========================================
// 3. CARREGAR E CANCELAR OS MEUS AGENDAMENTOS
// ==========================================
async function carregarMeusAgendamentos(){
    const divAgendamentos = document.getElementById('listaMeusAgendamentos');
    try {
        const response = await fetch(`${API_URL}/agendamentos/meus`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const agendamentos = await response.json();

        divAgendamentos.innerHTML = '';
        if (!Array.isArray(agendamentos) || agendamentos.length === 0) {
            divAgendamentos.innerHTML = `
                <div class="col-span-full bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center">
                    <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 text-2xl mb-4">
                        📅
                    </div>
                    <h3 class="text-base font-bold text-slate-800 mb-1">Você ainda não tem nenhum agendamento</h3>
                    <p class="text-xs text-slate-500 max-w-sm mx-auto mb-5">Escolha um dos cursos práticos disponíveis na vitrine abaixo e confirme sua participação como modelo.</p>
                    <a href="#vitrine" class="btn-brand text-xs sm:text-sm py-2.5 px-5">
                        Explorar Cursos Disponíveis
                    </a>
                </div>
            `;
            return;
        }

        agendamentos.forEach(ag => {
            const rawCursoNome = ag.disponibilidades?.cursos?.nome || 'Curso';
            const cursoNome = window.escapeHTML ? window.escapeHTML(rawCursoNome) : rawCursoNome;
            const dataHora = new Date(ag.disponibilidades?.data_hora).toLocaleString('pt-BR');
            let badge = '';
            let acoesHTML = '';

            if (ag.status === 'agendado') {
                badge = '<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-brand-100 text-brand-800">Confirmado</span>';
                acoesHTML = `<button class="w-full mt-3 inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100 py-2.5 px-3 text-xs font-bold text-rose-700 transition active:scale-98" onclick="cancelarAgendamento('${ag.id}')">Cancelar Inscrição</button>`;
            } else if (ag.status === 'cancelado') {
                badge = '<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">Cancelado</span>';
            } else if (ag.status === 'concluido') {
                badge = '<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Concluído</span>';
                acoesHTML = `<button class="w-full mt-3 inline-flex items-center justify-center rounded-xl bg-amber-500 hover:bg-amber-600 py-2.5 px-3 text-xs font-bold text-white shadow-xs transition active:scale-98" onclick="abrirModalFeedback('${ag.id}')">⭐ Avaliar Serviço</button>`;
            }

            const card = `
                <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
                    <div>
                        <div class="flex items-start justify-between gap-3 mb-3">
                            <h3 class="font-bold text-slate-900 text-sm">${cursoNome}</h3>
                            ${badge}
                        </div>
                        <p class="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                            <span>📅</span> ${dataHora}
                        </p>
                    </div>
                    <div>
                        ${acoesHTML}
                        <div id="msg-canc-${ag.id}" class="text-xs text-center font-bold mt-2"></div>
                    </div>
                </div>
            `;
            divAgendamentos.innerHTML += card;
        });
    } catch (error) {
        divAgendamentos.innerHTML = '<div class="col-span-full text-center py-10 text-rose-500 text-sm">Erro ao carregar histórico.</div>';
    }
}

async function cancelarAgendamento(agendamentoId){
    if(!confirm("Tem a certeza que deseja cancelar a sua inscrição neste horário?")) return;

    const msgDiv = document.getElementById(`msg-canc-${agendamentoId}`);
    try {
        const response = await fetch(`${API_URL}/agendamentos/${agendamentoId}/cancelar`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (response.ok) {
            if (window.showToast) window.showToast('Inscrição cancelada com sucesso.', 'info');
            carregarMeusAgendamentos();
        } else {
            msgDiv.innerHTML = `<span class="text-rose-600 font-bold">${data.erro}</span>`;
            if (window.showToast) window.showToast(data.erro || 'Erro ao cancelar inscrição.', 'error');
        }
    } catch (error) {
        msgDiv.innerHTML = '<span class="text-rose-600">Erro ao processar pedido.</span>';
        if (window.showToast) window.showToast('Erro ao processar cancelamento.', 'error');
    }
}

// ==========================================
// MÓDULO DE FEEDBACK
// ==========================================
function abrirModalFeedback(agendamentoId){
    document.getElementById('feedbackAgendamentoId').value = agendamentoId;
    document.getElementById('feedbackNota').value = '5';
    document.getElementById('feedbackComentario').value = '';
    document.getElementById('msgFeedback').innerHTML = '';
    modalFeedback.show();
}

const formFeedback = document.getElementById('formFeedback');
if (formFeedback) {
    formFeedback.addEventListener('submit', async (e) => {
        e.preventDefault();
        const msgDiv = document.getElementById('msgFeedback');
        msgDiv.innerHTML = '<span class="text-brand-600 font-medium">A processar avaliação...</span>';

        const payload = {
            agendamento_id: document.getElementById('feedbackAgendamentoId').value,
            nota: parseInt(document.getElementById('feedbackNota').value),
            comentario: document.getElementById('feedbackComentario').value
        };

        try {
            const response = await fetch(`${API_URL}/feedbacks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                msgDiv.innerHTML = `<span class="text-emerald-600 font-bold">${data.mensagem}</span>`;
                if (window.showToast) window.showToast('Obrigado pela sua avaliação!', 'success');
                setTimeout(() => {
                    modalFeedback.hide();
                    carregarMeusFeedbacks();
                }, 1200);
            } else {
                msgDiv.innerHTML = `<span class="text-rose-600 font-bold">${data.erro}</span>`;
                if (window.showToast) window.showToast(data.erro || 'Erro ao enviar avaliação.', 'error');
            }
        } catch (error) {
            msgDiv.innerHTML = '<span class="text-rose-600">Erro de ligação.</span>';
            if (window.showToast) window.showToast('Erro de conexão com o servidor.', 'error');
        }
    });
}

// ==========================================
// HISTÓRICO PESSOAL DE AVALIAÇÕES
// ==========================================
async function carregarMeusFeedbacks(){
    const divFeedbacks = document.getElementById('listaMeusFeedbacks');
    try {
        const response = await fetch(`${API_URL}/feedbacks/meus`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const feedbacks = await response.json();

        divFeedbacks.innerHTML = '';
        if (!Array.isArray(feedbacks) || feedbacks.length === 0) {
            divFeedbacks.innerHTML = `
                <div class="col-span-full bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center">
                    <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 text-2xl mb-4">
                        💬
                    </div>
                    <h3 class="text-base font-bold text-slate-800 mb-1">Nenhuma avaliação realizada ainda</h3>
                    <p class="text-xs text-slate-500 max-w-sm mx-auto">Após participar de um curso prático e o professor concluir o atendimento, você poderá avaliar a experiência aqui.</p>
                </div>
            `;
            return;
        }

        feedbacks.forEach(f => {
            const estrelas = '⭐'.repeat(Math.max(1, Math.min(5, f.nota || 5)));
            const dataFormatada = new Date(f.created_at).toLocaleDateString('pt-BR');
            const safeCursoNome = window.escapeHTML ? window.escapeHTML(f.curso_nome || 'Curso') : (f.curso_nome || 'Curso');
            const safeComentarioTexto = f.comentario ? `"${window.escapeHTML ? window.escapeHTML(f.comentario) : f.comentario}"` : '<span class="text-slate-400 italic">Apenas nota, sem texto.</span>';

            const card = `
                <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
                    <div>
                        <div class="flex items-center justify-between gap-2 mb-2">
                            <h3 class="font-bold text-slate-900 text-sm truncate">${safeCursoNome}</h3>
                            <span class="text-xs text-slate-400 font-medium">${dataFormatada}</span>
                        </div>
                        <div class="text-amber-500 text-sm mb-3">${estrelas}</div>
                        <p class="text-xs text-slate-600 leading-relaxed">${safeComentarioTexto}</p>
                    </div>
                </div>
            `;
            divFeedbacks.innerHTML += card;
        });
    } catch (error) {
        divFeedbacks.innerHTML = '<div class="col-span-full text-center py-10 text-rose-500 text-sm">Erro ao carregar o histórico de avaliações.</div>';
    }
}

// Navegação de Retorno
document.addEventListener('DOMContentLoaded', () => {
    if(token) {
        try {
            const payloadToken = JSON.parse(atob(token.split('.')[1]));
            const navbar = document.querySelector('.navbar-nav');
            if (navbar) {
                if (payloadToken.perfil === 'admin' || payloadToken.perfil === 'coordenador') {
                    navbar.innerHTML += `<a class="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-amber-300 hover:bg-white/10 transition" href="admin.html">⬅️ Voltar ao Backoffice</a>`;
                } else if (payloadToken.perfil === 'profissional') {
                    navbar.innerHTML += `<a class="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-amber-300 hover:bg-white/10 transition" href="profissional.html">⬅️ Voltar à Pauta</a>`;
                }
            }
        } catch (e) {}
    }
});

// Inicialização
carregarMeusFeedbacks();
carregarCursos();
carregarMeusAgendamentos();