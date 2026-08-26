// e2e/auth.spec.js
const { test, expect } = require('@playwright/test');

test.describe('E2E: Fluxos de Autenticação & Proteção de Rotas', () => {

  test('Deve carregar a página de login com todos os elementos essenciais', async ({ page }) => {
    await page.goto('/index.html');
    
    // Validar título e formulário
    await expect(page).toHaveTitle(/Connect Senac/i);
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#senha')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('a[href="cadastro.html"]')).toBeVisible();
    await expect(page.locator('a[href="esqueci-senha.html"]')).toBeVisible();
  });

  test('Deve bloquear acesso direto às páginas protegidas sem token e redirecionar para login', async ({ page }) => {
    // Tentar acessar painel do modelo
    await page.goto('/painel.html');
    await expect(page).toHaveURL(/index\.html/);

    // Tentar acessar painel do admin
    await page.goto('/admin.html');
    await expect(page).toHaveURL(/index\.html/);

    // Tentar acessar painel do professor
    await page.goto('/profissional.html');
    await expect(page).toHaveURL(/index\.html/);
  });

  test('Deve validar divergência de senhas na tela de cadastro', async ({ page }) => {
    await page.goto('/cadastro.html');

    await page.fill('#nome', 'Candidato Teste');
    await page.fill('#email', 'candidato.teste@exemplo.com');
    await page.fill('#telefone', '75999999999');
    await page.fill('#senha', 'SenhaForte123');
    await page.fill('#confirmar_senha', 'SenhaDiferente999');
    
    // Aceitar termos LGPD
    await page.check('#consentimento_termos');

    await page.click('button[type="submit"]');

    // Mensagem de erro deve ser exibida
    const msgErro = page.locator('#msgErro, #msgCadastro');
    await expect(msgErro).toContainText(/não coincidem/i);
  });
});
