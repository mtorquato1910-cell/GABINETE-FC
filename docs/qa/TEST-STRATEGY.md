# Estratégia de Testes — Gabinete FC

**Versão:** 1.0
**Data:** 2026-04-16
**Autor:** @qa — Synkra AIOS
**Status:** Aprovado ✅

---

## Filosofia de Testes para MVP

> **Foco nos fluxos de dinheiro.** No MVP, priorizamos cobertura de testes onde um bug tem impacto financeiro direto: checkout, pagamentos, cupons, frete. Funcionalidades visuais e secundárias não requerem testes automatizados nesta fase.

Princípio guia: **"Testar o que quebra a loja, não o que quebra a estética."**

---

## Stack de Testes

| Camada | Ferramenta | Uso |
|---|---|---|
| Unit / Integration | **Vitest** | Funções de negócio (cálculos, validações, transformações) |
| E2E (End-to-End) | **Playwright** | Fluxos críticos do usuário no browser |
| Tipagem | **TypeScript** (strict) | Erros em tempo de compilação |
| Lint | **ESLint** | Erros de padrão e boas práticas |

### Por que Vitest e não Jest?
- Vitest é nativo do ecossistema Vite/Next.js — zero configuração
- Suporte a ES Modules sem config extra
- Watch mode mais rápido
- API 100% compatível com Jest (migração trivial)

---

## Testes Unitários com Vitest

### O que testar com Vitest

Funções puras de lógica de negócio — aquelas que recebem input e retornam output, sem side effects de rede ou banco:

```
lib/
├── cart.ts              ✅ calcularTotal, aplicarCupom, calcularParcelamento
├── freight.ts           ✅ calcularFrete, validarCEP, selecionarModalidade
├── coupons.ts           ✅ validarCupom, calcularDesconto, verificarElegibilidade
├── pricing.ts           ✅ calcularDescontoPix, calcularParcelas, formatarPreco
├── orders.ts            ✅ calcularTotal, validarEstoque, montarPayload
└── utils.ts             ✅ formatCurrency, formatDate, formatCEP, slugify
```

### O que NÃO testar com Vitest

- Componentes React (use Playwright para fluxo E2E)
- Chamadas ao Supabase (mock seria falso — use E2E)
- Webhooks do Stripe (difícil mockar corretamente)
- Server Actions (testar via E2E)

### Estrutura dos arquivos de teste

```
lib/
├── cart.ts
├── cart.test.ts         # Colocalizado com o arquivo
└── freight/
    ├── calculate.ts
    └── calculate.test.ts
```

### Exemplos de testes unitários

```typescript
// lib/cart.test.ts
import { describe, it, expect } from 'vitest'
import { calcularTotal, aplicarCupom } from './cart'

describe('calcularTotal', () => {
  it('soma corretamente itens do carrinho', () => {
    const items = [
      { quantity: 2, unitPrice: 199.90 },
      { quantity: 1, unitPrice: 149.90 },
    ]
    expect(calcularTotal(items)).toBe(549.70)
  })

  it('retorna 0 para carrinho vazio', () => {
    expect(calcularTotal([])).toBe(0)
  })
})

describe('aplicarCupom', () => {
  it('aplica desconto percentual corretamente', () => {
    const result = aplicarCupom(500, { type: 'percent', value: 10 })
    expect(result).toBe(450)
  })

  it('aplica desconto fixo corretamente', () => {
    const result = aplicarCupom(500, { type: 'fixed', value: 50 })
    expect(result).toBe(450)
  })

  it('não deixa total negativo', () => {
    const result = aplicarCupom(30, { type: 'fixed', value: 100 })
    expect(result).toBe(0)
  })
})
```

```typescript
// lib/freight.test.ts
import { describe, it, expect } from 'vitest'
import { calcularParcelamento, calcularDescontoPix } from './pricing'

describe('calcularParcelamento', () => {
  it('calcula 12x sem juros corretamente', () => {
    const parcelas = calcularParcelamento(599.90, 12)
    expect(parcelas.value).toBeCloseTo(49.99, 1)
    expect(parcelas.installments).toBe(12)
  })
})

describe('calcularDescontoPix', () => {
  it('aplica 5% de desconto no Pix', () => {
    expect(calcularDescontoPix(200, 5)).toBe(190)
  })
})
```

### Configuração Vitest

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

### Scripts no package.json

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## Testes E2E com Playwright

### Fluxos críticos a testar (MVP)

**Prioridade 1 — Fluxos de dinheiro (obrigatório antes do deploy):**

| Fluxo | Arquivo | Criticidade |
|---|---|---|
| Produto → Carrinho → Checkout → Pagamento Cartão | `checkout-card.spec.ts` | 🔴 Crítico |
| Produto → Carrinho → Checkout → Pagamento Pix | `checkout-pix.spec.ts` | 🔴 Crítico |
| Aplicação de cupom de desconto no checkout | `coupon.spec.ts` | 🔴 Crítico |
| Cadastro e login de usuário | `auth.spec.ts` | 🔴 Crítico |
| Cálculo de frete por CEP | `freight.spec.ts` | 🔴 Crítico |

**Prioridade 2 — Fluxos de navegação (rodar semanalmente):**

| Fluxo | Arquivo | Criticidade |
|---|---|---|
| Busca de produto por nome | `search.spec.ts` | 🟡 Importante |
| Filtros no catálogo | `catalog-filters.spec.ts` | 🟡 Importante |
| Área do cliente — meus pedidos | `my-orders.spec.ts` | 🟡 Importante |

**Prioridade 3 — Admin (rodar em QA manual):**
- Admin: criar/editar produto
- Admin: mudar status de pedido
- Admin: aprovar review

### Exemplo de teste E2E crítico

```typescript
// e2e/checkout-card.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Checkout com Cartão de Crédito', () => {
  test('usuário consegue comprar produto com cartão Stripe (modo teste)', async ({ page }) => {
    // 1. Navegar para produto
    await page.goto('/produto/camisa-brasil-2024-titular')
    await page.getByLabel('Selecionar tamanho G').click()
    await page.getByRole('button', { name: 'Adicionar ao Carrinho' }).click()

    // 2. Ir para carrinho
    await page.getByRole('link', { name: 'Ver Carrinho' }).click()
    await expect(page).toHaveURL('/carrinho')
    await expect(page.getByText('Camisa Brasil')).toBeVisible()

    // 3. Iniciar checkout
    await page.getByRole('button', { name: 'Finalizar Compra' }).click()

    // 4. Preencher endereço
    await page.fill('[name="cep"]', '01310-100')
    await page.waitForResponse('**/api/cep/**')
    await page.fill('[name="number"]', '123')
    await page.getByRole('button', { name: 'Continuar' }).click()

    // 5. Selecionar frete
    await page.getByLabel('PAC').click()
    await page.getByRole('button', { name: 'Continuar' }).click()

    // 6. Preencher dados do cartão (Stripe test card)
    const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first()
    await stripeFrame.locator('[placeholder="Número do cartão"]').fill('4242424242424242')
    await stripeFrame.locator('[placeholder="MM / AA"]').fill('12/30')
    await stripeFrame.locator('[placeholder="CVC"]').fill('123')

    // 7. Confirmar pedido
    await page.getByRole('button', { name: 'Pagar' }).click()
    await page.waitForURL('**/pedido/confirmado/**', { timeout: 15000 })

    // 8. Verificar confirmação
    await expect(page.getByText('Pedido confirmado')).toBeVisible()
    await expect(page.getByText('Você receberá um e-mail')).toBeVisible()
  })
})
```

### Configuração Playwright

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### Scripts adicionais

```json
{
  "scripts": {
    "e2e": "playwright test",
    "e2e:ui": "playwright test --ui",
    "e2e:headed": "playwright test --headed"
  }
}
```

---

## CI/CD — Pipeline de Testes

### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test:run   # Vitest

  e2e-tests:
    runs-on: ubuntu-latest
    needs: unit-tests           # Só roda se unit passar
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run build
      - run: npm run e2e        # Playwright
        env:
          PLAYWRIGHT_BASE_URL: http://localhost:3000
          # Variáveis de ambiente de staging
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.STAGING_SUPABASE_URL }}
          # ... demais secrets
```

### Quando cada teste roda

| Evento | Vitest | Playwright | Deploy Vercel |
|---|---|---|---|
| Push em `feature/*` | ✅ | ❌ | Preview |
| Push em `dev` | ✅ | ✅ | Preview (staging) |
| PR para `main` | ✅ | ✅ | Bloqueado até passar |
| Push em `main` | ✅ | ✅ | Produção |

---

## Coverage — Definição MVP

**Não há coverage mínimo obrigatório no MVP.**

Foco é nos testes de fluxo crítico (E2E) e nas funções de negócio com maior risco.

Após MVP lançado, metas para Fase 2:
- Funções em `lib/`: 70% de coverage
- Fluxos E2E críticos: 100% cobertos
- Sem regression de checkout em nenhum deploy

---

## Dados de Teste

### Cartões Stripe (modo teste)

| Cenário | Número | Resultado |
|---|---|---|
| Pagamento aprovado | `4242 4242 4242 4242` | ✅ Sucesso |
| Pagamento recusado | `4000 0000 0000 0002` | ❌ Falha |
| 3DS requerido | `4000 0025 0000 3155` | 🔐 3DS prompt |
| Fundos insuficientes | `4000 0000 0000 9995` | ❌ Falha específica |

CVC: qualquer 3 dígitos | Validade: qualquer data futura

### Usuário de teste
```
email: teste@gabinetefc.com (seed no banco de dev)
password: TesteSenha123!
role: customer
```

### CEPs de teste
```
01310-100 → São Paulo, SP (Paulista)
30112-000 → Belo Horizonte, MG
20040-020 → Rio de Janeiro, RJ
```

---

*Documento gerado por @qa — Synkra AIOS*
*Atualizado em: 2026-04-16*
