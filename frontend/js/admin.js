// frontend/js/admin.js

const FALLBACK_BASE_URL = 'http://localhost:3000/api';
const API_URL = window.location.protocol === 'file:' ? FALLBACK_BASE_URL : `${window.location.origin}/api`;

const token = localStorage.getItem('token');
if (!token) window.location.href = 'index.html';

// Descodificar o JWT para saber o nome e perfil do Admin conectado
let payloadToken = {};
try {
    payloadToken = JSON.parse(atob(token.split('.')[1]));
    document.getElementById('userNome').textContent = payloadToken.email.split('@')[0];
    document.getElementById('userPerfil').textContent = (payloadToken.perfil || 'ADMIN').toUpperCase();
} catch (e) {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
}

// Se o utilizador for Coordenador, ocultamos a Tab de criar novos colaboradores (RBAC)
if (payloadToken.perfil === 'coordenador') {
    const equipaTab = document.getElementById('equipa-tab');
    if(equipaTab) equipaTab.style.display = 'none';
}

document.getElementById('btnSair').addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
});

// Suporte a troca de Abas com estilização ativa dinâmica
document.querySelectorAll('#adminTabs button').forEach(tabBtn => {
    tabBtn.addEventListener('click', () => {
        document.querySelectorAll('#adminTabs button').forEach(btn => {
            btn.classList.remove('text-brand-600', 'border-brand-600', 'font-bold');
            btn.classList.add('text-slate-500', 'border-transparent', 'font-semibold');
        });
        tabBtn.classList.remove('text-slate-500', 'border-transparent', 'font-semibold');
        tabBtn.classList.add('text-brand-600', 'border-brand-600', 'font-bold');

        const targetId = tabBtn.getAttribute('data-bs-target');
        if (targetId) {
            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
            const targetPane = document.querySelector(targetId);
            if (targetPane) targetPane.classList.add('active');
        }
    });
});

// ============================================================================
// 1. CARREGAR MÉTRICAS DO DASHBOARD
// ============================================================================
async function carregarMetricas(){
    try {
        const response = await fetch(`${API_URL}/dashboard/metricas`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('token');
            if (window.showToast) window.showToast('Sessão expirada. Redirecionando para login...', 'error');
            setTimeout(() => window.location.href = 'index.html', 1000);
            return;
        }
        if (response.ok) {
            const data = await response.json();
            document.getElementById('metricUsuarios').textContent = data.totalUsuarios;
            document.getElementById('metricAgendados').textContent = data.agendamentos.agendados;
            document.getElementById('metricConcluidos').textContent = data.agendamentos.concluidos;
            document.getElementById('metricCancelamento').textContent = data.taxaCancelamento;
        }
    } catch (error) {
        console.error("Erro ao carregar dados do dashboard.");
    }
}

// ============================================================================
// 2. GESTÃO DE UTILIZADORES & HISTÓRICO (MODERAÇÃO)
// ============================================================================
let baseUtilizadores = [];

async function carregarUtilizadores(){
    try {
        const response = await fetch(`${API_URL}/admin/usuarios`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('token');
            if (window.showToast) window.showToast('Sessão expirada. Redirecionando para login...', 'error');
            setTimeout(() => window.location.href = 'index.html', 1000);
            return;
        }
        baseUtilizadores = await response.json();
        renderizarTabelaUtilizadores(baseUtilizadores);
    } catch (error) {
        document.getElementById('tabelaUsuariosBody').innerHTML = '<tr><td colspan="8" class="text-rose-500 text-center py-6">Erro ao ligar ao servidor.</td></tr>';
    }
}

function renderizarTabelaUtilizadores(lista){
    const tbody = document.getElementById('tabelaUsuariosBody');
    tbody.innerHTML = '';

    if (!Array.isArray(lista) || lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-slate-400 py-8">Nenhum utilizador encontrado com estes filtros.</td></tr>';
        return;
    }

    lista.forEach(user => {
        const safeNome = window.escapeHTML ? window.escapeHTML(user.nome || '') : (user.nome || '');
        const safeEmail = window.escapeHTML ? window.escapeHTML(user.email || '') : (user.email || '');
        const safeTelefone = window.escapeHTML ? window.escapeHTML(user.telefone || '-') : (user.telefone || '-');
        const safeCursosAtivos = window.escapeHTML ? window.escapeHTML(user.cursos_ativos || '-') : (user.cursos_ativos || '-');

        const statusBadge = user.is_bloqueado
            ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">Bloqueado</span>'
            : '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Ativo</span>';

        const telLimpo = (user.telefone || '').replace(/\D/g, '');
        const msgZap = encodeURIComponent(`Olá, ${user.nome}! Aqui é a Coordenação do Connect Senac.`);
        const btnZap = telLimpo
            ? `<a href="https://wa.me/55${telLimpo}?text=${msgZap}" target="_blank" class="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition" title="Enviar WhatsApp">💬</a>`
            : '';

        let seletorPerfil = `<span class="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">${(user.perfil || '').toUpperCase()}</span>`;
        if (payloadToken.perfil === 'admin') {
            seletorPerfil = `
                <select class="rounded-xl border border-slate-200 text-xs py-1.5 px-2.5 bg-white text-slate-700 focus:ring-2 focus:ring-brand-600/20" onchange="alterarPerfil('${user.id}', this.value)">
                    <option value="candidato" ${user.perfil === 'candidato' ? 'selected' : ''}>Candidato</option>
                    <option value="profissional" ${user.perfil === 'profissional' ? 'selected' : ''}>Professor</option>
                    <option value="coordenador" ${user.perfil === 'coordenador' ? 'selected' : ''}>Coord.</option>
                    <option value="admin" ${user.perfil === 'admin' ? 'selected' : ''}>Admin</option>
                </select>
            `;
        }

        const btnBloqueio = payloadToken.perfil === 'admin'
            ? `<button class="inline-flex items-center justify-center w-8 h-8 rounded-xl ${user.is_bloqueado ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'} transition ml-1" onclick="toggleBloqueio('${user.id}', ${user.is_bloqueado})" title="${user.is_bloqueado ? 'Desbloquear' : 'Bloquear'}">🔒</button>` : '';

        const podeExcluir = payloadToken.perfil === 'admin' || (payloadToken.perfil === 'coordenador' && user.perfil === 'candidato');
        const btnExcluir = podeExcluir
            ? `<button class="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition ml-1" onclick="excluirUsuario('${user.id}', '${user.nome ? user.nome.replace(/'/g, "\\'") : ''}')" title="Excluir Conta">🗑️</button>` : '';

        const row = `
            <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="py-3 px-4">
                    <div class="font-bold text-slate-900">${safeNome}</div>
                    <div class="text-[11px] text-slate-400 sm:hidden">${safeEmail}</div>
                </td>
                <td class="py-3 px-4">
                    <div class="text-xs text-slate-700">${safeEmail}</div>
                    <div class="text-xs text-slate-400">${safeTelefone}</div>
                </td>
                <td class="py-3 px-4">${seletorPerfil}</td>
                <td class="py-3 px-4"><span class="text-xs text-slate-500">${safeCursosAtivos}</span></td>
                <td class="py-3 px-4 text-center font-bold text-brand-600">${user.total_agendados || 0}</td>
                <td class="py-3 px-4 text-center font-bold text-emerald-600">${user.total_concluidos || 0}</td>
                <td class="py-3 px-4 text-center font-bold text-rose-600">${user.total_cancelados || 0}</td>
                <td class="py-3 px-4 text-right whitespace-nowrap">
                    ${btnZap}
                    ${btnBloqueio}
                    ${btnExcluir}
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function aplicarFiltrosUsuarios(){
    const termo = document.getElementById('filtroTextoUser').value.toLowerCase();
    const perfil = document.getElementById('filtroPerfilUser').value;

    const listaFiltrada = baseUtilizadores.filter(user => {
        const matchTexto = (user.nome || '').toLowerCase().includes(termo) || (user.email || '').toLowerCase().includes(termo);
        const matchPerfil = perfil === "" || user.perfil === perfil;
        return matchTexto && matchPerfil;
    });

    renderizarTabelaUtilizadores(listaFiltrada);
}

const inputBusca = document.getElementById('filtroTextoUser');
const selectPerfil = document.getElementById('filtroPerfilUser');
const btnLimpar = document.getElementById('btnLimparFiltros');

if(inputBusca) inputBusca.addEventListener('input', aplicarFiltrosUsuarios);
if(selectPerfil) selectPerfil.addEventListener('change', aplicarFiltrosUsuarios);
if(btnLimpar) {
    btnLimpar.addEventListener('click', () => {
        inputBusca.value = '';
        selectPerfil.value = '';
        renderizarTabelaUtilizadores(baseUtilizadores);
    });
}

async function alterarPerfil(idUsuario, novoPerfil){
    if (!confirm(`Deseja alterar o perfil deste utilizador para ${novoPerfil.toUpperCase()}?`)) {
        carregarUtilizadores();
        return;
    }

    try {
        const response = await fetch(`${API_URL}/admin/usuarios/${idUsuario}/perfil`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ perfil: novoPerfil })
        });

        if (response.ok) {
            if (window.showToast) window.showToast(`Perfil atualizado para ${novoPerfil.toUpperCase()}`, 'success');
            carregarUtilizadores();
        } else {
            const data = await response.json();
            if (window.showToast) window.showToast(data.erro || 'Erro ao alterar perfil.', 'error');
            carregarUtilizadores();
        }
    } catch (error) {
        if (window.showToast) window.showToast("Erro ao alterar o perfil.", "error");
        carregarUtilizadores();
    }
}

async function toggleBloqueio(id, statusAtual){
    const acao = statusAtual ? 'desbloquear' : 'bloquear';
    if (!confirm(`Tem a certeza que deseja ${acao} este utilizador?`)) return;

    try {
        const response = await fetch(`${API_URL}/admin/usuarios/${id}/bloquear`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ is_bloqueado: !statusAtual })
        });

        if (response.ok) {
            if (window.showToast) window.showToast(`Utilizador ${statusAtual ? 'desbloqueado' : 'bloqueado'} com sucesso.`, 'info');
            carregarUtilizadores();
            carregarMetricas();
        } else {
            const err = await response.json();
            if (window.showToast) window.showToast(err.erro || 'Erro na operação.', 'error');
        }
    } catch (error) {
        if (window.showToast) window.showToast("Erro de ligação.", "error");
    }
}

// ============================================================================
// 3. CRIAR NOVO COLABORADOR (APENAS ADMIN)
// ============================================================================
const formColaborador = document.getElementById('formColaborador');
if(formColaborador) {
    formColaborador.addEventListener('submit', async (e) => {
        e.preventDefault();
        const msgDiv = document.getElementById('msgColab');
        msgDiv.innerHTML = '<span class="text-brand-600 font-medium">A registar colaborador...</span>';

        const payload = {
            nome: document.getElementById('colabNome').value,
            email: document.getElementById('colabEmail').value,
            telefone: document.getElementById('colabTelefone').value,
            senha: document.getElementById('colabSenha').value,
            perfil: document.getElementById('colabPerfil').value
        };

        try {
            const response = await fetch(`${API_URL}/admin/colaboradores`, {
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
                if (window.showToast) window.showToast('Colaborador cadastrado com sucesso!', 'success');
                formColaborador.reset();
                carregarUtilizadores();
            } else {
                msgDiv.innerHTML = `<span class="text-rose-600 font-bold">${data.erro}</span>`;
                if (window.showToast) window.showToast(data.erro || 'Erro ao criar colaborador.', 'error');
            }
        } catch (error) {
            msgDiv.innerHTML = '<span class="text-rose-600">Erro de ligação com o servidor.</span>';
            if (window.showToast) window.showToast('Erro de conexão.', 'error');
        }
    });
}

// ============================================================================
// LÓGICA DE CADASTRO DE CURSO & VAGAS
// ============================================================================
const formCurso = document.getElementById('formCurso');
if (formCurso) {
    formCurso.addEventListener('submit', async (e) => {
        e.preventDefault();
        const msgDiv = document.getElementById('msgCurso');
        msgDiv.innerHTML = '<span class="text-brand-600 font-medium">A guardar curso...</span>';

        const payload = {
            nome: document.getElementById('nomeCurso').value,
            descricao: document.getElementById('descricaoCurso').value,
            motivo_modelo: document.getElementById('motivoCurso').value,
            restricoes: document.getElementById('restricoesCurso').value,
            foto_url: document.getElementById('fotoCurso') ? document.getElementById('fotoCurso').value : '',
            localizacao: document.getElementById('localCurso') ? document.getElementById('localCurso').value : 'SENAC',
            profissional_id: document.getElementById('selectProfissional').value
        };

        try {
            const response = await fetch(`${API_URL}/cursos`, {
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
                if (window.showToast) window.showToast('Curso cadastrado com sucesso!', 'success');
                formCurso.reset();
                carregarCursosNoSelect();
                carregarCursosAdmin();
                carregarMetricas();
            } else {
                msgDiv.innerHTML = `<span class="text-rose-600 font-bold">${data.erro}</span>`;
                if (window.showToast) window.showToast(data.erro || 'Erro ao cadastrar curso.', 'error');
            }
        } catch (error) {
            msgDiv.innerHTML = '<span class="text-rose-600">Erro de ligação.</span>';
            if (window.showToast) window.showToast('Erro de conexão com o servidor.', 'error');
        }
    });
}

async function carregarCursosNoSelect(){
    const select = document.getElementById('selectCurso');
    if (!select) return;
    try {
        const response = await fetch(`${API_URL}/cursos/ativos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const cursos = await response.json();

        select.innerHTML = '<option value="" disabled selected>Selecione o curso...</option>';
        cursos.forEach(curso => {
            const option = document.createElement('option');
            option.value = curso.id;
            option.textContent = curso.nome;
            select.appendChild(option);
        });
    } catch (error) {
        select.innerHTML = '<option value="" disabled>Erro ao carregar cursos</option>';
    }
}

const formVagas = document.getElementById('formVagas');
if (formVagas) {
    formVagas.addEventListener('submit', async (e) => {
        e.preventDefault();
        const msgDiv = document.getElementById('msgVaga');
        msgDiv.innerHTML = '<span class="text-brand-600 font-medium">A abrir vagas...</span>';

        const payload = {
            curso_id: document.getElementById('selectCurso').value,
            data_hora: document.getElementById('dataHora').value,
            vagas_totais: parseInt(document.getElementById('vagasTotais').value)
        };

        try {
            const response = await fetch(`${API_URL}/disponibilidades`, {
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
                if (window.showToast) window.showToast('Horário e vagas disponibilizados com sucesso!', 'success');
                formVagas.reset();
                carregarMetricas();
            } else {
                msgDiv.innerHTML = `<span class="text-rose-600 font-bold">${data.erro}</span>`;
                if (window.showToast) window.showToast(data.erro || 'Erro ao abrir vagas.', 'error');
            }
        } catch (error) {
            msgDiv.innerHTML = '<span class="text-rose-600">Erro de ligação.</span>';
            if (window.showToast) window.showToast('Erro de conexão.', 'error');
        }
    });
}

async function carregarProfissionaisNoSelect(){
    const select = document.getElementById('selectProfissional');
    if (!select) return;
    try {
        const response = await fetch(`${API_URL}/admin/profissionais`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const profissionais = await response.json();
        select.innerHTML = '<option value="" disabled selected>Selecione o professor...</option>';
        profissionais.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = p.nome;
            select.appendChild(option);
        });
    } catch (error) {
        select.innerHTML = '<option value="" disabled>Erro ao carregar professores</option>';
    }
}

async function excluirUsuario(id, nome){
    if (!confirm(`ATENÇÃO: Tem certeza absoluta que deseja remover a conta de ${nome}? Todos os seus agendamentos serão excluídos.`)) return;

    try {
        const response = await fetch(`${API_URL}/admin/usuarios/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            if (window.showToast) window.showToast(`Conta de ${nome} excluída com sucesso.`, 'info');
            carregarUtilizadores();
            carregarMetricas();
        } else {
            const err = await response.json();
            if (window.showToast) window.showToast(err.erro || 'Erro ao excluir usuário.', 'error');
        }
    } catch (error) {
        if (window.showToast) window.showToast("Erro na conexão com o servidor.", "error");
    }
}

// Instância do Modal de Edição
let modalEditarCursoInstance = null;

document.addEventListener("DOMContentLoaded", () => {
    const modalEl = document.getElementById('modalEditarCurso');
    if (modalEl) modalEditarCursoInstance = new bootstrap.Modal(modalEl);

    const inputDataHora = document.getElementById('dataHora');
    if (inputDataHora) {
        const agora = new Date();
        agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
        inputDataHora.min = agora.toISOString().slice(0, 16);
    }

    carregarCursosAdmin();
});

// ==========================================
// 2. LISTAR CURSOS NA TABELA DE GESTÃO
// ==========================================
async function carregarCursosAdmin(){
    const tbody = document.getElementById('tabelaCursosBody');
    if (!tbody) return;

    try {
        const response = await fetch(`${API_URL}/cursos/admin`, {
            headers: { 'Authorization': `Bearer ${token}` }
window.cursosAdminMap = new Map();

async function carregarCursosAdmin(){
    const tbody = document.getElementById('tabelaCursosBody');
    try {
        const response = await fetch(`${API_URL}/cursos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const cursos = await response.json();

        tbody.innerHTML = '';
        window.cursosAdminMap.clear();

        if (!Array.isArray(cursos) || cursos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-slate-400 py-6">Nenhum curso cadastrado ainda.</td></tr>';
            return;
        }

        cursos.forEach(curso => {
            window.cursosAdminMap.set(String(curso.id), curso);

            const safeNome = window.escapeHTML ? window.escapeHTML(curso.nome || '') : (curso.nome || '');
            const safeDescricao = window.escapeHTML ? window.escapeHTML(curso.descricao || '') : (curso.descricao || '');
            const safeProfNome = window.escapeHTML ? window.escapeHTML(curso.usuarios ? curso.usuarios.nome : 'Sem Professor') : 'Sem Professor';
            const safeLocal = window.escapeHTML ? window.escapeHTML(curso.localizacao || '-') : '-';

            const statusBadge = curso.status === 'ativo'
                ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Ativo</span>'
                : '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">Arquivado</span>';

            const btnArquivar = curso.status === 'ativo'
                ? `<button class="inline-flex items-center rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs px-3 py-1.5 transition ml-1" onclick="arquivarCurso('${curso.id}', '${curso.nome ? curso.nome.replace(/'/g, "\\'") : ''}')">Arquivar</button>`
                : '';

            const row = `
                <tr class="hover:bg-slate-50/80 transition-colors">
                    <td class="py-3 px-4">
                        <div class="font-bold text-slate-900">${safeNome}</div>
                        <div class="text-xs text-slate-400 truncate max-w-xs">${safeDescricao}</div>
                    </td>
                    <td class="py-3 px-4 text-slate-700">${safeProfNome}</td>
                    <td class="py-3 px-4 text-slate-500">${safeLocal}</td>
                    <td class="py-3 px-4">${statusBadge}</td>
                    <td class="py-3 px-4 text-right whitespace-nowrap">
                        <button class="inline-flex items-center rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs px-3 py-1.5 transition" onclick="abrirModalEdicao('${curso.id}')">Editar</button>
                        ${btnArquivar}
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-rose-500 text-center py-6">Erro ao carregar catálogo.</td></tr>';
    }
}

// ==========================================
// 3. EDITAR E ARQUIVAR CURSOS
// ==========================================
async function arquivarCurso(id, nome){
    if(!confirm(`Deseja arquivar o curso "${nome}"? Ele sairá da vitrine dos alunos, mas o histórico será mantido.`)) return;

    try {
        const response = await fetch(`${API_URL}/cursos/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            if (window.showToast) window.showToast(`Curso "${nome}" arquivado com sucesso.`, 'info');
            carregarCursosAdmin();
            carregarCursosNoSelect();
        } else {
            if (window.showToast) window.showToast('Erro ao arquivar curso.', 'error');
        }
    } catch (error) {
        if (window.showToast) window.showToast('Erro de conexão.', 'error');
    }
}

function abrirModalEdicao(cursoId){
    const curso = typeof cursoId === 'object' ? cursoId : window.cursosAdminMap.get(String(cursoId));
    if (!curso) return;

    document.getElementById('editCursoId').value = curso.id;
    document.getElementById('editNome').value = curso.nome;
    document.getElementById('editDescricao').value = curso.descricao;
    document.getElementById('editLocal').value = curso.localizacao;
    document.getElementById('editFoto').value = curso.foto_url || '';

    const selectPrincipal = document.getElementById('selectProfissional');
    const selectEdit = document.getElementById('editProfissional');
    selectEdit.innerHTML = selectPrincipal.innerHTML;
    selectEdit.value = curso.profissional_id;

    document.getElementById('msgEditCurso').innerHTML = '';
    modalEditarCursoInstance.show();
}

const formEditarCurso = document.getElementById('formEditarCurso');
if (formEditarCurso) {
    formEditarCurso.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editCursoId').value;
        const msgDiv = document.getElementById('msgEditCurso');
        msgDiv.innerHTML = '<span class="text-brand-600 font-medium">A atualizar...</span>';

        const payload = {
            nome: document.getElementById('editNome').value,
            descricao: document.getElementById('editDescricao').value,
            localizacao: document.getElementById('editLocal').value,
            foto_url: document.getElementById('editFoto').value,
            profissional_id: document.getElementById('editProfissional').value
        };

        try {
            const response = await fetch(`${API_URL}/cursos/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                msgDiv.innerHTML = '<span class="text-emerald-600 font-bold">Atualizado com sucesso!</span>';
                if (window.showToast) window.showToast('Curso atualizado com sucesso!', 'success');
                carregarCursosAdmin();
                carregarCursosNoSelect();
                setTimeout(() => modalEditarCursoInstance.hide(), 1200);
            } else {
                msgDiv.innerHTML = '<span class="text-rose-600 font-bold">Erro ao atualizar.</span>';
                if (window.showToast) window.showToast('Erro ao atualizar curso.', 'error');
            }
        } catch (error) {
            msgDiv.innerHTML = '<span class="text-rose-600">Erro de conexão.</span>';
            if (window.showToast) window.showToast('Erro de conexão.', 'error');
        }
    });
}

window.toggleCollapse = function(targetId, btn) {
    const el = document.getElementById(targetId);
    if (!el) return;
    const isShown = el.classList.contains('show');
    if (isShown) {
        el.classList.remove('show');
        if (btn) {
            const badge = btn.querySelector('.collapse-badge');
            if (badge) badge.textContent = 'Ver Horários ↓';
        }
    } else {
        el.classList.add('show');
        if (btn) {
            const badge = btn.querySelector('.collapse-badge');
            if (badge) badge.textContent = 'Ocultar Horários ↑';
        }
    }
};

// ==========================================
// MÓDULO DE PAUTAS GLOBAIS (VISÃO COORDENAÇÃO)
// ==========================================
async function carregarPautasGlobais(){
    const accordion = document.getElementById('accordionPautasGlobais');
    if (!accordion) return;

    try {
        const response = await fetch(`${API_URL}/admin/pautas`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const cursos = await response.json();

        accordion.innerHTML = '';

        if (!Array.isArray(cursos) || cursos.length === 0) {
            accordion.innerHTML = `
                <div class="p-8 sm:p-12 text-center text-slate-400 text-sm bg-slate-50 rounded-3xl border border-slate-200/80">
                    <div class="text-2xl mb-2">📅</div>
                    <div class="font-bold text-slate-700">Nenhuma pauta ativa no momento</div>
                    <p class="text-xs text-slate-400 mt-1">Crie cursos e abra horários para visualizar as listas de presença globais.</p>
                </div>
            `;
            return;
        }

        cursos.forEach((curso, index) => {
            let horariosHTML = '';
            const rawProfessor = curso.usuarios ? curso.usuarios.nome : 'Sem Professor Vinculado';
            const nomeProfessor = window.escapeHTML ? window.escapeHTML(rawProfessor) : rawProfessor;
            const safeCursoNome = window.escapeHTML ? window.escapeHTML(curso.nome || '') : (curso.nome || '');

            if (curso.disponibilidades && curso.disponibilidades.length > 0) {
                curso.disponibilidades.sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora));

                curso.disponibilidades.forEach(disp => {
                    const dataFormatada = new Date(disp.data_hora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
                    const agendamentosAtivos = disp.agendamentos ? disp.agendamentos.filter(a => a.status !== 'cancelado') : [];

                    let tabelaModelos = '';
                    if (agendamentosAtivos.length === 0) {
                        tabelaModelos = `<p class="text-slate-400 text-xs py-3 text-center">Nenhum modelo agendado.</p>`;
                    } else {
                        let linhas = agendamentosAtivos.map(ag => {
                            const rawNomeModelo = ag.usuarios?.nome || 'Modelo';
                            const safeNomeModelo = window.escapeHTML ? window.escapeHTML(rawNomeModelo) : rawNomeModelo;
                            const telRaw = ag.usuarios?.telefone || '-';
                            const safeTelefone = window.escapeHTML ? window.escapeHTML(telRaw) : telRaw;
                            const telLimpo = (ag.usuarios?.telefone || '').replace(/\D/g, '');
                            const msgZap = encodeURIComponent(`Olá, ${rawNomeModelo}! Aqui é a Coordenação do SENAC referente ao curso ${curso.nome}.`);
                            return `
                                <tr class="hover:bg-slate-50/70 transition-colors">
                                    <td class="py-2.5 px-4 font-semibold text-slate-900">${safeNomeModelo}</td>
                                    <td class="py-2.5 px-4">
                                        <a href="https://wa.me/55${telLimpo}?text=${msgZap}" target="_blank" class="inline-flex items-center gap-1 font-semibold text-emerald-600 hover:text-emerald-800 transition">📱 ${safeTelefone}</a>
                                    </td>
                                    <td class="py-2.5 px-4 text-center">
                                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${ag.status === 'concluido' ? 'bg-emerald-100 text-emerald-800' : 'bg-brand-100 text-brand-800'}">${(ag.status || '').toUpperCase()}</span>
                                    </td>
                                </tr>
                            `;
                        }).join('');

                        tabelaModelos = `
                            <div class="overflow-x-auto rounded-xl border border-slate-100 mt-3">
                                <table class="min-w-full divide-y divide-slate-100 text-left text-xs">
                                    <thead class="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                                        <tr>
                                            <th class="py-2.5 px-4">Modelo</th>
                                            <th class="py-2.5 px-4">Contato</th>
                                            <th class="py-2.5 px-4 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-slate-100 bg-white">${linhas}</tbody>
                                </table>
                            </div>`;
                    }

                    horariosHTML += `
                        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                            <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-2">
                                <div class="flex items-center gap-2 font-bold text-slate-900 text-sm">
                                    <span>📅</span> Data: ${dataFormatada}
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

            const itemOpen = index === 0 ? 'show' : '';
            const badgeText = index === 0 ? 'Ocultar Horários ↑' : 'Ver Horários ↓';

            accordion.innerHTML += `
                <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all">
                    <h2>
                        <button class="w-full flex items-center justify-between p-5 text-left font-bold text-slate-900 hover:bg-slate-50 transition cursor-pointer" type="button" onclick="toggleCollapse('collapsePauta${curso.id}', this)">
                            <div class="flex items-center gap-3">
                                <span class="text-xl">📘</span>
                                <div>
                                    <span class="text-base text-slate-900">${safeCursoNome}</span>
                                    <span class="ml-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700">Prof: ${nomeProfessor}</span>
                                </div>
                            </div>
                            <span class="collapse-badge text-xs text-brand-600 font-semibold bg-brand-50 px-3 py-1 rounded-lg transition">${badgeText}</span>
                        </button>
                    </h2>
                    <div id="collapsePauta${curso.id}" class="collapse ${itemOpen} border-t border-slate-100">
                        <div class="p-5 sm:p-6 bg-slate-50/50 space-y-5">
                            ${horariosHTML || '<p class="text-xs text-slate-400 text-center py-4">Sem horários abertos para este curso.</p>'}
                        </div>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        console.error("Erro ao carregar as pautas globais:", error);
        accordion.innerHTML = '<div class="p-8 text-center text-rose-600 text-sm bg-white rounded-3xl border border-slate-200">Erro ao carregar os dados. Verifique a conexão com o servidor.</div>';
    }
}

// Inicializações
carregarPautasGlobais();
carregarProfissionaisNoSelect();
carregarMetricas();
carregarCursosNoSelect();
carregarUtilizadores();