// e2e/admin_hub.spec.js
const { test, expect } = require('@playwright/test');
const jwt = require('jsonwebtoken');

test.describe('E2E: Central Administrativa (Admin Hub)', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'teste_jwt_super_secret_key_12345';

  test.beforeEach(async ({ page }) => {
    // Injeta token válido de Administrador no localStorage antes de carregar a página
    const adminToken = jwt.sign(
      { id: 'admin-e2e-1', email: 'admin.coordenacao@senac.br', perfil: 'admin' },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    await page.addInitScript((token) => {
      window.localStorage.setItem('token', token);
    }, adminToken);
  });

  test('Deve renderizar o Painel Admin sem erros no console e navegar entre todas as abas', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/admin.html');

    // Validação da identificação de usuário
    await expect(page.locator('#userPerfil')).toHaveText('ADMIN');
    await expect(page.locator('#userNome')).toBeVisible();

    // Validar presença do grid de métricas
    await expect(page.locator('#painelMetricas')).toBeVisible();

    // 1. Navegar para Aba de Catálogo de Cursos
    await page.click('#catalogo-tab');
    await expect(page.locator('#catalogo')).toHaveClass(/active/);
    await expect(page.locator('#tabelaCursosBody')).toBeVisible();

    // 2. Navegar para Aba de Utilizadores & Moderação
    await page.click('#usuarios-tab');
    await expect(page.locator('#usuarios')).toHaveClass(/active/);
    await expect(page.locator('#filtroTextoUser')).toBeVisible();

    // 3. Navegar para Aba de Pautas Globais
    await page.click('#pautas-tab');
    await expect(page.locator('#pautas')).toHaveClass(/active/);

    // 4. Navegar para Aba de Criar Colaborador
    await page.click('#equipa-tab');
    await expect(page.locator('#equipa')).toHaveClass(/active/);
    await expect(page.locator('#colabNome')).toBeVisible();

    // Certificar que não houve nenhum SyntaxError ou erro bloqueador de runtime
    const syntaxErrors = consoleErrors.filter(e => e.includes('SyntaxError') || e.includes('Unexpected'));
    expect(syntaxErrors).toHaveLength(0);
  });
});
