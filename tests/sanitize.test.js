// tests/sanitize.test.js
const fs = require('fs');
const path = require('path');

describe('Suite de Testes Unitários: Prevenção de XSS (TC-08)', () => {
    let escapeHTML;

    beforeAll(() => {
        // Carrega o utilitário frontend
        const sanitizeCode = fs.readFileSync(
            path.join(__dirname, '../frontend/js/utils/sanitize.js'),
            'utf8'
        );
        const domContext = { window: {} };
        const fn = new Function('window', sanitizeCode);
        fn(domContext.window);
        escapeHTML = domContext.window.escapeHTML;
    });

    test('Deve escapar tags HTML perigosas contra XSS', () => {
        const payload = '<script>alert("xss")</script>';
        const sanitized = escapeHTML(payload);
        expect(sanitized).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
        expect(sanitized).not.toContain('<script>');
    });

    test('Deve escapar aspas e atributos injetados em tags', () => {
        const payload = '"><img src=x onerror=alert(1)>';
        const sanitized = escapeHTML(payload);
        expect(sanitized).toBe('&quot;&gt;&lt;img src=x onerror=alert(1)&gt;');
    });

    test('Deve retornar string vazia para valores nulos ou indefinidos', () => {
        expect(escapeHTML(null)).toBe('');
        expect(escapeHTML(undefined)).toBe('');
    });

    test('Deve manter texto seguro inalterado', () => {
        const textoSeguro = 'Curso de Culinaria e Panificacao';
        expect(escapeHTML(textoSeguro)).toBe(textoSeguro);
    });
});
