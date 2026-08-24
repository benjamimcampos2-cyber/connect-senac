// frontend/js/auth.js

const FALLBACK_BASE_URL = "http://localhost:3000/api/usuarios";
const API_URL =
  window.location.protocol === "file:"
    ? FALLBACK_BASE_URL
    : `${window.location.origin}/api/usuarios`;

// Lógica de Login
const formLogin = document.getElementById("formLogin");
if (formLogin) {
  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;
    const msgErro = document.getElementById("mensagemErro");

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);

        if (window.showToast) window.showToast("Login realizado com sucesso! Redirecionando...", "success");

        const perfil = data.utilizador.perfil;

        setTimeout(() => {
          if (perfil === "admin" || perfil === "coordenador") {
            window.location.href = "admin.html";
          } else if (perfil === "profissional") {
            window.location.href = "profissional.html";
          } else {
            window.location.href = "painel.html"; // Candidato/Modelo
          }
        }, 500);
      } else {
        const erroMsg = data.erro || "Credenciais inválidas.";
        if (msgErro) {
          msgErro.textContent = erroMsg;
          msgErro.classList.remove("hidden");
          msgErro.classList.remove("d-none");
        }
        if (window.showToast) window.showToast(erroMsg, "error");
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      if (msgErro) {
        msgErro.textContent = "Erro de conexão com o servidor.";
        msgErro.classList.remove("hidden");
        msgErro.classList.remove("d-none");
      }
      if (window.showToast) window.showToast("Erro de conexão com o servidor.", "error");
    }
  });
}

// Lógica de Registo
const formCadastro = document.getElementById("formCadastro");
if (formCadastro) {
  formCadastro.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("nome").value;
    const email = document.getElementById("email").value;
    const telefone = document.getElementById("telefone").value;
    const senha = document.getElementById("senha").value;
    const confirmar_senha = document.getElementById("confirmar_senha").value;

    const consentimento_termos = document.getElementById("termoUso").checked
      ? 1
      : 0;
    const consentimento_imagem = document.getElementById("termoImagem").checked
      ? 1
      : 0;

    const msgDiv = document.getElementById("mensagemCadastro");

    if (senha !== confirmar_senha) {
      msgDiv.innerHTML = `<span class="text-rose-600 font-bold">Erro: As palavras-passe não coincidem.</span>`;
      if (window.showToast) window.showToast("As palavras-passe não coincidem.", "warning");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/registrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          email,
          telefone,
          senha,
          confirmar_senha,
          consentimento_termos,
          consentimento_imagem,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        msgDiv.innerHTML = `<span class="text-emerald-600 font-bold">Conta criada com sucesso! A redirecionar para o login...</span>`;
        if (window.showToast) window.showToast("Conta criada com sucesso! Redirecionando para o login...", "success");
        setTimeout(() => {
          window.location.href = "index.html";
        }, 1500);
      } else {
        msgDiv.innerHTML = `<span class="text-rose-600 font-bold">${data.erro}</span>`;
        if (window.showToast) window.showToast(data.erro || "Erro ao criar conta.", "error");
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      msgDiv.innerHTML = `<span class="text-rose-600 font-bold">Erro de conexão com o servidor.</span>`;
      if (window.showToast) window.showToast("Erro de conexão com o servidor.", "error");
    }
  });
}

// Lógica de Solicitar Recuperação
const formEsqueci = document.getElementById("formEsqueci");
if (formEsqueci) {
  formEsqueci.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msgDiv = document.getElementById("msgRecuperacao");
    const email = document.getElementById("emailRecuperacao").value;

    msgDiv.innerHTML = '<span class="text-brand-600 font-medium">A processar...</span>';

    try {
      const response = await fetch(`${API_URL}/esqueci-senha`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      msgDiv.innerHTML = `<span class="text-emerald-600 font-bold">${data.mensagem}</span>`;
      if (window.showToast) window.showToast(data.mensagem || "Instruções enviadas com sucesso!", "success");
    } catch (error) {
      msgDiv.innerHTML = '<span class="text-rose-600">Erro de conexão.</span>';
      if (window.showToast) window.showToast("Erro de conexão com o servidor.", "error");
    }
  });
}

// Lógica de Redefinir Senha
const formRedefinir = document.getElementById("formRedefinir");
if (formRedefinir) {
  formRedefinir.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msgDiv = document.getElementById("msgRedefinir");
    const nova_senha = document.getElementById("novaSenha").value;
    const confirmar_senha = document.getElementById("confirmarNovaSenha").value;

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      msgDiv.innerHTML =
        '<span class="text-rose-600">Link de recuperação inválido (Token ausente).</span>';
      if (window.showToast) window.showToast("Link de recuperação inválido.", "error");
      return;
    }

    if (nova_senha !== confirmar_senha) {
      msgDiv.innerHTML =
        '<span class="text-rose-600">As palavras-passe não coincidem.</span>';
      if (window.showToast) window.showToast("As palavras-passe não coincidem.", "warning");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/redefinir-senha`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, nova_senha, confirmar_senha }),
      });

      const data = await response.json();

      if (response.ok) {
        msgDiv.innerHTML = `<span class="text-emerald-600 font-bold">${data.mensagem} A redirecionar...</span>`;
        if (window.showToast) window.showToast("Palavra-passe atualizada com sucesso!", "success");
        setTimeout(() => (window.location.href = "index.html"), 2000);
      } else {
        msgDiv.innerHTML = `<span class="text-rose-600 font-bold">${data.erro}</span>`;
        if (window.showToast) window.showToast(data.erro || "Erro ao redefinir palavra-passe.", "error");
      }
    } catch (error) {
      msgDiv.innerHTML = '<span class="text-rose-600">Erro de conexão.</span>';
      if (window.showToast) window.showToast("Erro de conexão com o servidor.", "error");
    }
  });
}
