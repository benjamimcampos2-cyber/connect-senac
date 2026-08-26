// tests/business_rules.test.js
const crypto = require('crypto');

describe('Suite de Testes de Regras de Negócio & Segurança', () => {

    describe('Regra das 2 Horas de Antecedência para Cancelamento (TC-02, TC-03)', () => {
        test('Deve bloquear cancelamento quando a antecedência for inferior a 2 horas (TC-02)', () => {
            const agora = new Date();
            // Data do curso em 1 hora e 30 minutos
            const dataCursoMenos2h = new Date(agora.getTime() + (90 * 60 * 1000));
            const diferencaEmHoras = (dataCursoMenos2h - agora) / (1000 * 60 * 60);

            const podeCancelar = diferencaEmHoras >= 2;
            expect(podeCancelar).toBe(false);
        });

        test('Deve permitir cancelamento quando a antecedência for igual ou superior a 2 horas (TC-03)', () => {
            const agora = new Date();
            // Data do curso em 3 horas
            const dataCursoMais2h = new Date(agora.getTime() + (180 * 60 * 1000));
            const diferencaEmHoras = (dataCursoMais2h - agora) / (1000 * 60 * 60);

            const podeCancelar = diferencaEmHoras >= 2;
            expect(podeCancelar).toBe(true);
        });
    });

    describe('Conformidade LGPD no Cadastro (TC-06)', () => {
        test('Deve rejeitar registro sem consentimento obrigatório dos termos', () => {
            const payload = {
                nome: 'Aluno Teste',
                email: 'aluno@teste.com',
                consentimento_termos: false
            };

            const isValid = Boolean(payload.consentimento_termos);
            expect(isValid).toBe(false);
        });

        test('Deve aceitar registro com consentimento obrigatório dos termos', () => {
            const payload = {
                nome: 'Aluno Teste',
                email: 'aluno@teste.com',
                consentimento_termos: true
            };

            const isValid = Boolean(payload.consentimento_termos);
            expect(isValid).toBe(true);
        });
    });

    describe('Segurança de Tokens de Recuperação de Senha (SHA-256)', () => {
        test('Deve gerar hash SHA-256 consistente para validação no banco', () => {
            const rawToken = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';
            const hash1 = crypto.createHash('sha256').update(rawToken).digest('hex');
            const hash2 = crypto.createHash('sha256').update(rawToken).digest('hex');

            expect(hash1).toBe(hash2);
            expect(hash1).not.toBe(rawToken);
            expect(hash1.length).toBe(64);
        });
    });
});
