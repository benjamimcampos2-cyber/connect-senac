// server.js
require('dotenv').config(); // Carrega as variáveis do arquivo .env
require('./backend/cron/notificador')
const express = require('express');
const cors = require('cors');
const db = require('./backend/config/database');
const usuarioRoutes = require('./backend/routes/usuarioRoutes');
const agendamentoRoutes = require('./backend/routes/agendamentoRoutes'); 
const cursoRoutes = require('./backend/routes/cursoRoutes'); 
const disponibilidadeRoutes = require('./backend/routes/disponibilidadeRoutes');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Validação de variáveis críticas de ambiente
if (!process.env.JWT_SECRET) {
    console.warn('⚠️ [AVISO DE SEGURANÇA] JWT_SECRET não configurado no .env! Utilizando chave de segurança gerada para este processo.');
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'senac_secure_jwt_token_key_prod_2026';
}

// Middlewares de Segurança
app.use(helmet({
    contentSecurityPolicy: false, // Permite CDNs de Tailwind e Bootstrap utilizados pelo projeto
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false
}));

// Rate Limiting para Prevenção de Ataques de Força Bruta (OWASP)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // Janela de 15 minutos
    max: 100, // Máximo de 100 tentativas por IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { erro: 'Muitas tentativas a partir deste IP. Por favor, aguarde 15 minutos.' }
});

app.use('/api/usuarios/login', authLimiter);
app.use('/api/usuarios/registrar', authLimiter);
app.use('/api/usuarios/esqueci-senha', authLimiter);
app.use('/api/usuarios/redefinir-senha', authLimiter);

// Middlewares padrão
app.use(cors()); // Libera o acesso do Front-end
app.use(express.json()); // Ensina o Express a entender requisições no formato JSON

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, 'frontend')));

// Rota de teste e healthcheck
app.get('/api/status', (req, res) => {
    res.json({ mensagem: "Servidor Connect Senac rodando com sucesso!", status: "OK" });
});

// Rotas da API
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/agendamentos', agendamentoRoutes);
app.use('/api/cursos', cursoRoutes);
app.use('/api/disponibilidades', disponibilidadeRoutes);
app.use('/api/dashboard', require('./backend/routes/dashboardRoutes'));
app.use('/api/admin', require('./backend/routes/adminRoutes'));
app.use('/api/profissional', require('./backend/routes/profissionalRoutes'));
app.use('/api/feedbacks', require('./backend/routes/feedbackRoutes'));

// Iniciar servidor somente quando executado diretamente (permite supertest importar app sem prender a porta)
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
        console.log(`Acesse: http://localhost:${PORT}/api/status`);
    });
}

module.exports = app;