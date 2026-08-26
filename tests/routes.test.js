// tests/routes.test.js
const request = require('supertest');
const jwt = require('jsonwebtoken');

// Configura o ambiente de teste
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'teste_jwt_super_secret_key_12345';

const app = require('../server');

describe('Suite de Testes de Integração HTTP: Rotas & Segurança (Supertest)', () => {

    test('GET /api/status - Deve responder com 200 OK e status de saúde da API', async () => {
        const res = await request(app).get('/api/status');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('OK');
        expect(res.body.mensagem).toMatch(/Connect Senac/i);
    });

    describe('Segurança de Autenticação & Headers HTTP (Helmet & Auth)', () => {
        test('Headers de Segurança HTTP do Helmet devem estar presentes', async () => {
            const res = await request(app).get('/api/status');
            expect(res.headers['x-content-type-options']).toBe('nosniff');
            expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
        });

        test('GET /api/agendamentos/meus - Deve rejeitar acesso sem token (401)', async () => {
            const res = await request(app).get('/api/agendamentos/meus');
            expect(res.status).toBe(401);
            expect(res.body.erro).toMatch(/acesso negado/i);
        });

        test('GET /api/admin/usuarios - Deve rejeitar acesso sem token (401)', async () => {
            const res = await request(app).get('/api/admin/usuarios');
            expect(res.status).toBe(401);
            expect(res.body.erro).toMatch(/acesso negado/i);
        });

        test('GET /api/profissional/minhas-turmas - Deve rejeitar acesso sem token (401)', async () => {
            const res = await request(app).get('/api/profissional/minhas-turmas');
            expect(res.status).toBe(401);
            expect(res.body.erro).toMatch(/acesso negado/i);
        });

        test('GET /api/admin/usuarios - Deve rejeitar token com assinatura inválida (401)', async () => {
            const tokenFalso = jwt.sign({ id: 'fake', perfil: 'admin' }, 'chave_errada_qualquer');
            const res = await request(app)
                .get('/api/admin/usuarios')
                .set('Authorization', `Bearer ${tokenFalso}`);
            expect(res.status).toBe(401);
            expect(res.body.erro).toMatch(/sessão expirada ou inválida/i);
        });
    });

    describe('Validações de Entrada nos Controladores (Defensive Payloads)', () => {
        test('POST /api/usuarios/registrar - Deve rejeitar e-mail em formato inválido (400)', async () => {
            const res = await request(app)
                .post('/api/usuarios/registrar')
                .send({
                    nome: 'João Teste',
                    email: 'email_invalido_sem_arroba',
                    senha: '12345678password',
                    confirmar_senha: '12345678password',
                    consentimento_termos: true
                });
            expect(res.status).toBe(400);
            expect(res.body.erro).toMatch(/formato de e-mail inválido/i);
        });

        test('POST /api/usuarios/registrar - Deve rejeitar senha com menos de 6 caracteres (400)', async () => {
            const res = await request(app)
                .post('/api/usuarios/registrar')
                .send({
                    nome: 'João Teste',
                    email: 'joao@teste.com',
                    senha: '123',
                    confirmar_senha: '123',
                    consentimento_termos: true
                });
            expect(res.status).toBe(400);
            expect(res.body.erro).toMatch(/mínimo 6 caracteres/i);
        });

        test('POST /api/usuarios/login - Deve rejeitar payload sem credenciais (400)', async () => {
            const res = await request(app)
                .post('/api/usuarios/login')
                .send({});
            expect(res.status).toBe(400);
            expect(res.body.erro).toMatch(/obrigatórios/i);
        });
    });
});
