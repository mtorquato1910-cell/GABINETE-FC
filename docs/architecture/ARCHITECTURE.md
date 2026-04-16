# Documento de Arquitetura — Gabinete FC

**Versão:** 1.0
**Data:** 2026-04-16
**Autor:** @architect — Synkra AIOS
**Status:** Aprovado ✅

---

## Visão Geral do Sistema

Gabinete FC é um e-commerce de camisas de futebol operando no modelo dropshipping (fornecedor JIN, Tailândia). A arquitetura é construída sobre Next.js 14 App Router + Supabase + Stripe, hospedado na Vercel.

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTE (Browser)                         │
│  Next.js 14 App Router — SSR/ISR/Client Components + Zustand    │
└──────────────────────┬───────────────────────┬──────────────────┘
                       │                       │
          ┌────────────▼──────────┐   ┌────────▼─────────────┐
          │   Supabase (anon key) │   │  Server Actions       │
          │   - Auth              │   │  - Stripe API         │
          │   - Produtos (leitura)│   │  - Supabase (service) │
          │   - Categorias        │   │  - CAPI Meta          │
          └────────────┬──────────┘   │  - Correios API       │
                       │              │  - Resend Email        │
          ┌────────────▼──────────────▼──────────────────────┐
          │              Supabase (PostgreSQL)                 │
          │  RLS ativo │ Storage │ Auth │ Realtime (opcional) │
          └──────────────────────────────────────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
      ┌───────▼──────┐  ┌─────────▼──────┐  ┌─────────▼──────┐
      │   Stripe      │  │  Correios API  │  │  Claude API     │
      │  Pagamentos   │  │  Frete/Rastreio│  │  Bot de Suporte │
      └──────────────┘  └────────────────┘  └────────────────┘
```

---

## ADRs — Architecture Decision Records

### ADR-001: Next.js App Router (não Pages Router)

**Status:** Aceito ✅
**Data:** 2026-04-16

**Contexto:** Next.js 14 oferece dois paradigmas de roteamento. Precisamos escolher um para o projeto inteiro.

**Decisão:** Usar App Router exclusivamente.

**Justificativa:**
- App Router é o padrão atual e futuro do Next.js (Pages Router está em modo manutenção)
- Server Components permitem queries ao Supabase sem JavaScript no cliente → performance
- Server Actions eliminam a necessidade de endpoints de API para mutações (checkout, formulários)
- `generateStaticParams` + ISR substituem `getStaticPaths` + `getStaticProps` com sintaxe mais limpa
- Layout aninhado (`layout.tsx`) resolve o problema de shell compartilhado (Navbar + Footer)

**Consequências:**
- Toda a equipe deve entender a distinção entre Server Components e Client Components
- `'use client'` deve ser adicionado apenas onde necessário (interatividade, hooks, eventos)
- Componentes de terceiros que usam `useState`/`useEffect` devem ser wrappados com `'use client'`

**Regra:** Nunca usar `pages/` directory. Todo código novo vai em `app/`.

---

### ADR-002: Zustand para Estado Global

**Status:** Aceito ✅
**Data:** 2026-04-16

**Contexto:** O carrinho de compras e o estado de sessão precisam ser compartilhados entre componentes sem prop drilling. Opções consideradas: React Context, Zustand, Jotai, Redux.

**Decisão:** Zustand para carrinho e estado de sessão.

**Justificativa:**
- Context API causa re-renders desnecessários em toda a árvore quando o carrinho muda
- Zustand usa subscriptions seletivas — apenas o componente que lê o dado afetado re-renderiza
- API simples: `create()` + `set()` + `get()` — zero boilerplate
- Persistência em `localStorage` via middleware `persist` do Zustand (carrinho sobrevive ao reload)
- Compatível com Server Components (store fica exclusivamente em Client Components)

**Stores a criar:**
```typescript
// stores/cart-store.ts
interface CartStore {
  items: CartItem[]
  addItem: (product: Product, size: string) => void
  removeItem: (id: string, size: string) => void
  updateQuantity: (id: string, size: string, qty: number) => void
  clearCart: () => void
  total: number
  itemCount: number
}

// stores/session-store.ts
interface SessionStore {
  user: User | null
  setUser: (user: User | null) => void
  isAdmin: boolean
}
```

**Regra:** Context API pode ser usada apenas para providers de bibliotecas externas (shadcn, toast). Estado de negócio vai em Zustand.

---

### ADR-003: Server Actions para Operações Sensíveis

**Status:** Aceito ✅
**Data:** 2026-04-16

**Contexto:** O projeto lida com pagamentos (Stripe), dados de usuário (Supabase service role) e APIs de terceiros com chaves privadas. Precisamos garantir que essas chaves nunca apareçam no bundle do cliente.

**Decisão:** Todas as operações sensíveis são Server Actions (`'use server'`).

**Operações que OBRIGATORIAMENTE são Server Actions:**

| Operação | Motivo |
|---|---|
| Criar PaymentIntent no Stripe | `STRIPE_SECRET_KEY` nunca no cliente |
| Confirmar pagamento | Precisa validar webhook server-side |
| Disparar evento CAPI Meta | `META_ACCESS_TOKEN` nunca no cliente |
| Criar/atualizar pedido | `SUPABASE_SERVICE_ROLE_KEY` bypassa RLS |
| Cancelar pedido + reverter estoque | Transação atômica server-side |
| Enviar e-mail via Resend | `RESEND_API_KEY` nunca no cliente |
| Ler dados de admin (financeiro, relatórios) | Role check + service role |
| Verificar webhook Stripe | `STRIPE_WEBHOOK_SECRET` + `rawBody` |

**Operações que PODEM ser client-side:**

| Operação | Motivo |
|---|---|
| Login/Logout Supabase | `NEXT_PUBLIC_SUPABASE_ANON_KEY` é pública por design |
| Listar produtos/categorias | Dados públicos, RLS permite anon |
| Busca de produtos | Query pública |
| Calcular frete (somente leitura) | Pode ser Server Component ou SA |

**Regra:** Qualquer variável de ambiente SEM o prefixo `NEXT_PUBLIC_` nunca pode ser importada ou usada em `'use client'` components. O TypeScript vai errar em runtime — mas a revisão de código deve pegar antes.

---

### ADR-004: Estratégia de Clientes Supabase

**Status:** Aceito ✅
**Data:** 2026-04-16

**Contexto:** Supabase tem dois clientes distintos com escopos de permissão diferentes.

**Decisão:**

```
lib/supabase/
├── client.ts      → anon key (browser)
├── server.ts      → anon key + cookies (Server Components, SA com contexto de usuário)
└── admin.ts       → service role (Server Actions que precisam bypassar RLS)
```

**Regras de uso:**

| Arquivo | Chave | Onde usar | RLS |
|---|---|---|---|
| `client.ts` | anon | Client Components (auth, queries públicas) | Ativo |
| `server.ts` | anon + cookies | Server Components, SA de usuário | Ativo |
| `admin.ts` | service role | SA de admin, webhooks, crons | Bypassa |

**`admin.ts` só pode ser importado em:**
- `app/api/` (Route Handlers)
- `app/actions/` (Server Actions marcados como admin)
- `app/admin/` (layout com `requireAdmin()`)

**Nunca** importar `admin.ts` em qualquer arquivo que possa ser acessado por usuários anônimos.

---

### ADR-005: Rate Limiting via @vercel/kv + Middleware

**Status:** Aceito ✅
**Data:** 2026-04-16

**Contexto:** Rotas sensíveis precisam de proteção contra abuso, brute force e bots.

**Decisão:** Rate limiting no middleware Next.js usando `@vercel/kv` (Redis gerenciado na Vercel).

**Limites definidos:**

| Rota | Limite | Janela | Chave |
|---|---|---|---|
| `POST /api/checkout` | 5 req | 1 minuto | IP |
| `POST /api/auth/login` | 10 req | 15 minutos | IP |
| `POST /api/bot` | 20 req | 1 hora | session_id |
| `POST /api/stripe/webhook` | Whitelist IPs Stripe | — | IP |

**IPs do Stripe para whitelist:**
```
3.18.12.63, 3.130.192.231, 13.235.14.237, 13.235.122.149,
18.211.135.69, 35.154.171.200, 52.15.183.38, 54.187.174.169,
54.187.205.235, 54.187.216.72
```
> Verificar lista atualizada em: https://stripe.com/docs/ips

**Implementação:**
```typescript
// middleware.ts
import { kv } from '@vercel/kv'
import { Ratelimit } from '@upstash/ratelimit'

const checkoutLimiter = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
})

// Retornar 429 Too Many Requests se limite excedido
// Header: Retry-After com tempo restante
```

**Resposta ao cliente quando limite atingido:**
```json
{ "error": "Muitas tentativas. Aguarde antes de tentar novamente.", "retryAfter": 60 }
```

---

### ADR-006: Estratégia de Cache e ISR

**Status:** Aceito ✅
**Data:** 2026-04-16

**Decisão:** Usar ISR (Incremental Static Regeneration) para páginas públicas de alto tráfego.

| Página | Estratégia | Revalidar |
|---|---|---|
| Home (`/`) | ISR | 3600s (1h) |
| Catálogo (`/loja`) | ISR | 1800s (30min) |
| Categoria (`/loja/[cat]`) | ISR + `generateStaticParams` | 1800s |
| Produto (`/produto/[slug]`) | ISR + `generateStaticParams` | 3600s |
| Admin (todas) | Dynamic — `no-store` | Nunca cacheado |
| Checkout | Dynamic — `no-store` | Nunca cacheado |

**Invalidação manual:** Via `revalidatePath('/produto/[slug]')` em Server Actions de admin após editar produto.

---

## Acessibilidade (a11y) — Padrão Mínimo MVP

O projeto segue **WCAG 2.1 AA** como baseline. As regras abaixo são obrigatórias em todo código de UI:

### Regras obrigatórias

**1. Imagens**
```tsx
// ✅ Correto
<Image src={product.image} alt={`Camisa ${product.name}`} />

// ❌ Proibido
<Image src={product.image} alt="" />
<Image src={product.image} /> // sem alt
```

**2. Botões e Links**
```tsx
// ✅ Correto — botão com ícone apenas
<button aria-label="Remover do carrinho">
  <TrashIcon />
</button>

// ✅ Correto — link sem texto descritivo
<a href="/produto/camisa-brasil" aria-label="Ver detalhes da Camisa Brasil">
  <Image ... />
</a>

// ❌ Proibido
<button><TrashIcon /></button> // sem aria-label
```

**3. Formulários**
```tsx
// ✅ Correto
<label htmlFor="email">E-mail</label>
<input id="email" type="email" />

// ❌ Proibido
<p>E-mail</p>
<input type="email" /> // label não associado
```

**4. Contraste de cores**
- Texto sobre fundo: mínimo **4.5:1** (WCAG AA)
- Botões CTA (verde Gabinete FC): verificar contraste do texto branco/preto sobre o verde definido
- Ferramenta de verificação: https://webaim.org/resources/contrastchecker/

**5. Navegação por teclado**
- `Tab` deve navegar todos os elementos interativos em ordem lógica
- `focus-visible` estilizado em todos os elementos (`outline` nunca removido sem alternativa)
- Modais e drawers devem ter `focus trap` (foco não sai do modal enquanto aberto)
- Checkout é o fluxo mais crítico — deve ser 100% navegável por teclado

**6. Semântica HTML**
```tsx
// ✅ Usar elementos semânticos
<main>, <nav>, <header>, <footer>, <article>, <section>

// ❌ Não usar div para tudo
<div class="nav">...</div> // usar <nav>
```

**7. Skip link (obrigatório no layout raiz)**
```tsx
// app/layout.tsx
<a href="#main-content" className="sr-only focus:not-sr-only">
  Pular para o conteúdo principal
</a>
<main id="main-content">...</main>
```

### Validação
- Extensão axe DevTools no Chrome durante desenvolvimento
- `@axe-core/react` pode ser adicionado em desenvolvimento
- Não há obrigação de audit formal no MVP, mas violações óbvias devem ser corrigidas

---

## Estrutura de Pastas

```
gabinete-fc/
├── app/
│   ├── (public)/           # Rotas públicas (sem auth)
│   │   ├── page.tsx        # Home
│   │   ├── loja/
│   │   ├── produto/[slug]/
│   │   └── busca/
│   ├── (auth)/             # Rotas de autenticação
│   │   ├── login/
│   │   └── cadastro/
│   ├── minha-conta/        # Área do cliente (requer auth)
│   ├── admin/              # Painel admin (requer role admin)
│   ├── api/                # Route Handlers (webhooks, etc.)
│   └── layout.tsx          # Layout raiz
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── layout/             # Navbar, Footer, Sidebar
│   ├── product/            # ProductCard, ProductGallery, etc.
│   ├── cart/               # CartDrawer, CartItem, etc.
│   ├── checkout/           # CheckoutSteps, PaymentForm, etc.
│   └── admin/              # Tabelas, formulários do admin
├── lib/
│   ├── supabase/
│   │   ├── client.ts       # anon key browser
│   │   ├── server.ts       # anon key + cookies
│   │   └── admin.ts        # service role (somente Server Actions)
│   ├── stripe/
│   │   ├── client.ts       # Stripe.js (client)
│   │   └── server.ts       # Stripe SDK (server only)
│   ├── env.ts              # Zod validation de env vars
│   ├── products.ts         # Helpers de query de produtos
│   ├── cart.ts             # Lógica de carrinho
│   └── utils.ts            # Formatadores (moeda, data, CEP)
├── stores/
│   ├── cart-store.ts       # Zustand cart
│   └── session-store.ts    # Zustand session
├── actions/                # Server Actions
│   ├── checkout.ts
│   ├── orders.ts
│   ├── returns.ts
│   └── admin/
├── hooks/                  # Custom React hooks
├── types/
│   ├── supabase.ts         # Gerado por `supabase gen types`
│   └── index.ts            # Tipos de negócio
└── supabase/
    ├── migrations/         # SQL migrations versionadas
    └── seed.sql            # Dados iniciais
```

---

## Segurança — Regras Gerais

| Regra | Descrição |
|---|---|
| `STRIPE_SECRET_KEY` | Apenas em Server Actions / Route Handlers |
| `SUPABASE_SERVICE_ROLE_KEY` | Apenas em `lib/supabase/admin.ts` |
| `META_ACCESS_TOKEN` | Apenas em Server Actions de CAPI |
| `RESEND_API_KEY` | Apenas em Server Actions de email |
| `VAPID_PRIVATE_KEY` | Vercel Secret, **nunca** no banco de dados |
| Webhook Stripe | `constructEvent(rawBody, sig, secret)` + `request.text()` |
| Input do usuário | Sanitizar com Zod antes de qualquer query |
| SQL | Usar apenas Supabase SDK (parameterized) — nunca string concat |
| CORS | Route Handlers com `Access-Control-Allow-Origin` restrito |

---

*Documento gerado por @architect — Synkra AIOS*
*Atualizado em: 2026-04-16*
