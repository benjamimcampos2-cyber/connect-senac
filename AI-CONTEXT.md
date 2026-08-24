# [CONTEXTO TÉCNICO] Connect Senac - Documentação da Aplicação

## 1. Visão Geral do Projeto
* **Nome:** Connect Senac
* **Status:** Concluído / Pronto para Produção e Uso Pedagógico
* **Objetivo:** Sistema web de agendamento e gestão de modelos para cursos e atendimentos práticos do SENAC. Otimiza o preenchimento de vagas, automatiza lembretes e centraliza o controle de presença e avaliações de satisfação.

---

## 2. Stack Tecnológica
* **Back-end:** Node.js (v20 LTS), Express.js (v5.x), `node-cron` (motor de notificações automáticas).
* **Banco de Dados:** Supabase (PostgreSQL) integrado via `@supabase/supabase-js`.
* **Front-end:** HTML5, CSS3, JavaScript Vanilla (ES6+), Bootstrap 5 (CDN).
* **Segurança:** JSON Web Tokens (JWT) com RBAC (`candidato`, `profissional`, `coordenador`, `admin`), `bcrypt` para hash seguro de senhas, validações de integridade e conformidade com a LGPD.

---

## 3. Estrutura de Diretórios (Padrão MVC)
```text
connect-senac/
├── server.js                        # Ponto de entrada do Express e roteador mestre
├── package.json                     # Metadados e dependências
├── AI-CONTEXT.md                    # Documentação técnica e regras de negócio
├── backend/
│   ├── config/
│   │   └── database.js              # Conexão e cliente Supabase (PostgreSQL)
│   ├── cron/
│   │   └── notificador.js           # Cron Job para varredura e disparo de avisos (24h/3h)
│   ├── middlewares/
│   │   ├── authMiddleware.js        # Validação de Bearer Token e verificação de bloqueio
│   │   └── rbacMiddleware.js        # Controle de acesso baseado em perfis (RBAC)
│   ├── controllers/
│   │   ├── adminController.js       # Gestão de usuários, moderação, colaboradores e pautas
│   │   ├── agendamentoController.js # Inscrições, concorrência de vagas e cancelamentos
│   │   ├── cursoController.js       # Vitrine e CRUD completo de cursos
│   │   ├── dashboardController.js   # Métricas agregadas e taxa de cancelamento
│   │   ├── disponibilidadeController.js # Grade de horários e controle de vagas
│   │   ├── feedbackController.js    # Avaliações de serviços concluídos
│   │   ├── profissionalController.js# Visão do professor, pautas e controle de presença
│   │   └── usuarioController.js     # Cadastro LGPD, login e recuperação de senha
│   └── routes/
│       ├── adminRoutes.js
│       ├── agendamentoRoutes.js
│       ├── cursoRoutes.js
│       ├── dashboardRoutes.js
│       ├── disponibilidadeRoutes.js
│       ├── feedbackRoutes.js
│       ├── profissionalRoutes.js
│       └── usuarioRoutes.js
└── frontend/
    ├── index.html                   # Login
    ├── cadastro.html                # Registro com termos LGPD
    ├── esqueci-senha.html           # Solicitação de recuperação
    ├── redefinir-senha.html         # Redefinição com token
    ├── painel.html                  # Área do Aluno / Modelo
    ├── profissional.html            # Área do Professor / Instrutor
    ├── admin.html                   # Central Administrativa / Coordenação
    └── js/
        ├── auth.js                  # Lógica de autenticação e recuperação
        ├── painel.js                # Lógica do painel do aluno e agendamentos
        ├── profissional.js          # Lógica da pauta docente e WhatsApp
        └── admin.js                 # Lógica de métricas, moderação e CRUD
```

---

## 4. Regras de Negócio Fundamentais
1. **LGPD no Cadastro:** Registro exige consentimento obrigatório dos Termos de Uso e opcional para uso acadêmico de imagem.
2. **Prevenção de Overbooking:** Controle de `vagas_ocupadas < vagas_totais` e trava UNIQUE no banco para impedir múltiplos agendamentos do mesmo usuário na mesma vaga.
3. **Restrição Temporal de Cancelamento:** O candidato só pode cancelar agendamentos com no mínimo 2 horas de antecedência.
4. **Validação de Horários Futuros:** O sistema não permite abrir disponibilidades com datas/horários passados.
5. **Ciclo de Vida do Agendamento:** `agendado` ➔ `concluido` (confirmado pelo professor) ou `cancelado` (por desistência ou falta).
6. **Feedbacks:** Somente agendamentos `concluido` podem receber nota e avaliação (1 por agendamento).
7. **Lembretes Automáticos:** O serviço de background (`notificador.js`) verifica agendamentos ativos a ocorrer em 24h e 3h para emissão de avisos.

---

## 5. Perfis de Usuário (RBAC)
* **`candidato`**: Inscreve-se em vagas, visualiza detalhes e avaliações dos cursos, gerencia seus agendamentos e envia avaliações.
* **`profissional`**: Visualiza suas turmas, acessa contato direto com modelos (WhatsApp), confirma presença e registra faltas.
* **`coordenador`**: Acessa visão gerencial, pautas globais, métricas e cadastro de cursos/vagas.
* **`admin`**: Acesso irrestrito (criação de colaboradores, exclusão/bloqueio de contas, alteração de cargos).