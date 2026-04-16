# Guia de Setup e Contribuição — Gabinete FC

**Stack:** Next.js 14 + TypeScript + Supabase + Stripe + Vercel
**Atualizado em:** 2026-04-16

---

## Pré-requisitos

- Node.js 20+ ([download](https://nodejs.org))
- npm 10+
- Git
- Docker Desktop (para Supabase local)
- Supabase CLI: `npm install -g supabase`
- Vercel CLI (opcional): `npm install -g vercel`

---

## Setup Local

### 1. Clonar o repositório

```bash
git clone https://github.com/SEU_USUARIO/gabinete-fc.git
cd gabinete-fc
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Abrir `.env.local` e preencher os valores. Veja a seção [Variáveis de Ambiente](#variáveis-de-ambiente) abaixo.

### 4. Iniciar o Supabase local

```bash
supabase start
```

Isso inicia o banco PostgreSQL, Auth e Storage em Docker localmente. Na primeira vez, faz download das imagens (~600MB).

Ao final exibe as URLs e chaves locais — copiar para `.env.local`:
```
API URL: http://127.0.0.1:54321
anon key: eyJ...
service_role key: eyJ...
```

### 5. Aplicar migrations

```bash
supabase db reset
```

Isso aplica todas as migrations em `supabase/migrations/` e o seed inicial.

### 6. Gerar tipos TypeScript

```bash
npm run db:types
```

### 7. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:3000`.

---

## Variáveis de Ambiente

Todas listadas em `.env.example`. Nunca commitar valores reais.

### Supabase
```
NEXT_PUBLIC_SUPABASE_URL=          # URL do projeto Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Chave anon (pública)
SUPABASE_SERVICE_ROLE_KEY=         # Chave service role (NUNCA no frontend)
```

### Stripe
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=  # pk_test_... (cliente)
STRIPE_SECRET_KEY=                   # sk_test_... (servidor only)
STRIPE_WEBHOOK_SECRET=               # whsec_... (servidor only)
```

### Serviços externos
```
CORREIOS_API_USERNAME=   # Credenciais Correios
CORREIOS_API_PASSWORD=
ANTHROPIC_API_KEY=       # Claude API (bot de suporte)
RESEND_API_KEY=          # Serviço de e-mail
```

### URLs e IDs
```
NEXT_PUBLIC_SITE_URL=             # http://localhost:3000 (dev) | https://gabinetefc.com.br (prod)
NEXT_PUBLIC_GA_MEASUREMENT_ID=    # G-XXXXXXXXXX
NEXT_PUBLIC_GTM_ID=               # GTM-XXXXXXX
NEXT_PUBLIC_PIXEL_ID=             # ID do Meta Pixel
META_ACCESS_TOKEN=                # Token CAPI Meta (servidor only)
```

### Push Notifications (Vercel Secret em produção)
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=   # Chave pública VAPID
VAPID_PRIVATE_KEY=              # Chave privada (Vercel Secret em prod — nunca no banco)
```

---

## Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento (localhost:3000)
npm run build        # Build de produção
npm run start        # Iniciar build de produção local
npm run lint         # Verificar ESLint
npm run typecheck    # Verificar TypeScript (sem emitir arquivos)
npm run test         # Rodar testes unitários (Vitest, watch mode)
npm run test:run     # Rodar testes unitários uma vez
npm run e2e          # Rodar testes E2E (Playwright)
npm run e2e:ui       # Rodar E2E com interface visual
npm run db:types     # Gerar tipos TypeScript do Supabase
```

---

## Convenções de Código

### Commits

Seguir [Conventional Commits](https://conventionalcommits.org):

```
feat: adicionar filtro por tamanho no catálogo
fix: corrigir cálculo de frete para CEPs com hífen
chore: atualizar dependências do projeto
docs: adicionar guia de setup local
refactor: extrair lógica de cupom para lib/coupons.ts
test: adicionar testes unitários para calcularFrete
style: ajustar espaçamento do ProductCard no mobile
```

**Formato:** `tipo: descrição em minúsculas (imperativo)`

Tipos aceitos: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`, `perf`, `ci`

### Branches

```
main         → produção (deploy automático na Vercel)
dev          → staging / integração
feature/xyz  → novas funcionalidades (abre PR para dev)
fix/xyz      → correções de bug
```

### Nomenclatura

- **Componentes:** PascalCase — `ProductCard.tsx`, `CheckoutForm.tsx`
- **Hooks:** camelCase com prefixo `use` — `useCart.ts`, `useProduct.ts`
- **Funções e variáveis:** camelCase — `calcularFrete`, `totalCarrinho`
- **Arquivos de teste:** mesmo nome + `.test.ts` — `cart.test.ts`
- **Constantes:** SCREAMING_SNAKE_CASE — `MAX_CART_ITEMS`, `STRIPE_CURRENCY`

### TypeScript

- `strict: true` obrigatório — sem `any` implícito
- Preferir `type` a `interface` para tipos de negócio
- Usar `z.infer<typeof Schema>` do Zod para tipos derivados de schemas

---

## Fluxo de Deploy

```
Commit na feature/xyz
        ↓
Push → Vercel gera preview da branch (URL única para teste)
        ↓
PR para dev → CI roda (lint + typecheck + Vitest)
        ↓
Merge em dev → Deploy automático no staging
        ↓
PR para main → CI roda tudo (+ Playwright E2E)
        ↓
Merge em main → Deploy automático em produção 🚀
```

**Produção:** Push na `main` = deploy automático na Vercel. Sem passo manual.

---

## Supabase — Comandos Úteis

```bash
supabase start          # Iniciar ambiente local
supabase stop           # Parar ambiente local
supabase db reset       # Resetar banco + aplicar migrations + seed
supabase migration new  # Criar nova migration
supabase gen types typescript --local > types/supabase.ts  # Regenerar tipos
supabase status         # Ver URLs e chaves do ambiente local
```

---

## Testando Pagamentos

### Cartões de teste Stripe

| Cenário | Número | Resultado |
|---|---|---|
| Aprovado | `4242 4242 4242 4242` | Sucesso |
| Recusado | `4000 0000 0000 0002` | Falha |
| 3DS | `4000 0025 0000 3155` | Autenticação 3D Secure |

CVC: qualquer 3 dígitos | Validade: qualquer data futura

### Testando webhooks localmente

```bash
# Instalar Stripe CLI
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Isso replica os eventos do Stripe para o servidor local.

---

## Estrutura do Projeto

```
gabinete-fc/
├── app/              # Rotas Next.js (App Router)
├── components/       # Componentes React
├── lib/              # Funções e utilitários
├── stores/           # Estado global (Zustand)
├── actions/          # Server Actions
├── hooks/            # Custom hooks
├── types/            # Tipos TypeScript
├── emails/           # Templates React Email
├── e2e/              # Testes Playwright
├── supabase/         # Migrations e seed SQL
└── docs/             # Documentação do projeto
    ├── epics/        # EPICs e requisitos
    ├── architecture/ # Decisões arquiteturais
    ├── qa/           # Estratégia de testes
    ├── sprints/      # Plano de sprints
    └── operations/   # Guias operacionais
```

---

## Dúvidas

- Arquitetura e decisões técnicas: consultar `docs/architecture/ARCHITECTURE.md`
- Requisitos e stories: consultar `docs/epics/`
- Plano de sprints: consultar `docs/sprints/SPRINT-PLAN-gabinete-fc.md`
