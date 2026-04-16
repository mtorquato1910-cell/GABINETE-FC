# PLANO DE SPRINTS — Gabinete FC

**Projeto:** Gabinete FC — E-commerce de Camisas de Futebol
**Criado em:** 2026-04-16
**Metodologia:** Scrum / 2 semanas por sprint
**Stack:** Next.js 14 + Supabase + Stripe + Vercel
**Status:** Planejado ⏳

---

## Resumo Executivo

| Fase | Sprints | Semanas | EPICs cobertos | SP estimado |
|---|---|---|---|---|
| Fase 0 — Arquitetura | Sprint 0 | 1 sem | — | — |
| MVP | Sprints 1–6 | 12 sem | EPIC-01 a EPIC-07 | ~170 SP |
| Gaps + Deploy MVP | Sprint 7 | 2 sem | EPIC-A (parcial) | ~21 SP |
| Fase 2 — Complementar | Sprints 8–10 | 6 sem | EPIC-A a EPIC-F | ~65 SP |
| Fase 3 — Analytics + Marketing | Sprints 11–13 | 6 sem | EPIC-G a EPIC-L | ~80 SP |
| Fase 4 — Financeiro + Leads | Sprints 14–16 | 6 sem | EPIC-M a EPIC-R + EPIC-Q | 91 SP |
| **Total** | **17 sprints** | **~33 semanas** | **Todos os EPICs** | **~427 SP** |

---

## Agentes e Responsabilidades

| Agente | Papel | Quando atua |
|---|---|---|
| `@architect` | Decisões de arquitetura, ADRs, revisão de design técnico | Sprint 0 e decisões críticas |
| `@data-engineer` | Schema SQL, migrations, RLS, RPCs, functions Supabase | Todo sprint com tabelas/SQL |
| `@dev` | Implementação Next.js — componentes, Server Actions, APIs, integrações | Principal executor em todos os sprints |
| `@ux-design-expert` | UI/UX — componentes visuais, design system, responsividade | Frontend public + Admin UI |
| `@qa` | Testes, diagnóstico de qualidade, critérios de aceitação | Final de cada sprint + diagnóstico de EPIC |
| `@devops` | Deploy Vercel, variáveis de ambiente, Cron Jobs, domínios | Sprint 0 + Sprint 6 + Crons |
| `@sm` | Criação e refinamento de stories, gestão do backlog | Pré-sprint + grooming |
| `@pm` | Priorização, validação de requisitos de negócio | Decisões de produto |

---

## Convenções

- **SP** = Story Points (Fibonacci: 1, 2, 3, 5, 8, 13)
- **[bloq]** = bloqueia próximo sprint se não concluído
- **[paralelo]** = pode rodar em paralelo com outra story/sprint
- Stories com 🔴 são críticas para o MVP; 🟡 são importantes; 🟢 são melhorias

---

---

# SPRINT 0 — Arquitetura e Planejamento

**Duração:** 1 semana (pré-desenvolvimento)
**Objetivo:** Alinhar arquitetura, definir ADRs, configurar ambientes e ferramentas antes do código.
**Agentes:** `@architect` (lead), `@devops`, `@data-engineer`, `@sm`

| Atividade | Responsável | Entregável |
|---|---|---|
| Definir ADRs principais (App Router, Supabase Auth, Stripe webhooks) | `@architect` | `docs/architecture/ADR-001.md` |
| Setup repositório GitHub + branch strategy (main/dev/feature) | `@devops` | Repositório configurado |
| Configurar Vercel (preview + production environments) | `@devops` | Deploy pipeline ativo |
| Configurar Supabase (projeto dev + prod + staging) | `@devops` + `@data-engineer` | Projetos Supabase criados |
| Criar todas as stories do Sprint 1–3 refinadas | `@sm` | Stories em `docs/stories/` |
| Definir design tokens (cores, tipografia, espaçamento) | `@ux-design-expert` | `docs/design-tokens.md` |
| Revisão do PRD e EPICs — resolver dúvidas de produto | `@pm` | Q&A documentado |

**DoD Sprint 0:** Todos os ADRs aprovados, repositório pronto, Vercel + Supabase configurados, stories Sprint 1 refinadas.

---

---

# SPRINT 1 — Infraestrutura + Schema Base

**Duração:** 2 semanas
**Objetivo:** Base técnica completa — projeto Next.js, banco de dados, autenticação e types TypeScript.
**EPICs:** EPIC-01 (completo) + EPIC-A (US-A.1 e US-A.2)
**Agentes:** `@dev` (lead), `@data-engineer`, `@devops`
**SP Total:** ~34 SP

### Stories

| ID | Story | SP | Agente | Criticidade |
|---|---|---|---|---|
| US-01.1 | Migração e Setup do Repositório Next.js | 5 | `@dev` | 🔴 [bloq] |
| US-01.2 | Setup do Banco de Dados Supabase (schema base) | 8 | `@data-engineer` | 🔴 [bloq] |
| US-01.3 | Setup Variáveis de Ambiente e Secrets | 3 | `@devops` + `@dev` | 🔴 |
| US-01.4 | Configuração do Supabase Client e Tipos TypeScript | 5 | `@dev` | 🔴 |
| US-A.1 | Schema Complementar (tabelas ausentes: order_history, stock_movements, loyalty_points, stock_alerts, banners) | 8 | `@data-engineer` | 🔴 [bloq] |
| US-A.2 | Correção de Segurança — app_metadata para role admin | 5 | `@dev` + `@data-engineer` | 🔴 |

**DoD Sprint 1:**
- `npm run dev`, `npm run build`, `npm run lint` passando
- Schema SQL completo com todas as migrations aplicadas
- RLS ativo em todas as tabelas
- Types TypeScript gerados e sem erros
- `requireAdmin()` usando `app_metadata` corretamente

---

# SPRINT 2 — Frontend Público: Home + Catálogo

**Duração:** 2 semanas
**Objetivo:** Páginas públicas principais — Home e Catálogo com dados reais do Supabase.
**EPICs:** EPIC-02 (US-02.1 a US-02.4)
**Agentes:** `@ux-design-expert` (lead UI), `@dev` (lead lógica), `@data-engineer` (queries)
**SP Total:** ~34 SP

### Stories

| ID | Story | SP | Agente | Criticidade |
|---|---|---|---|---|
| US-02.1 | Layout Base, Navbar e Footer | 8 | `@ux-design-expert` + `@dev` | 🔴 [bloq] |
| US-02.2 | Página Home (/) | 8 | `@ux-design-expert` + `@dev` | 🔴 |
| US-02.3 | Catálogo de Produtos (/loja) com filtros e busca | 8 | `@dev` + `@ux-design-expert` | 🔴 |
| US-02.4 | Página de Categoria (/loja/[categoria]) | 5 | `@dev` | 🟡 |
| — | Carrinho global (Context/Zustand store) | 5 | `@dev` | 🔴 [bloq sprint 3] |

**DoD Sprint 2:**
- Home com dados reais do Supabase (produtos em destaque)
- Catálogo com filtros funcionais e URL sync
- Carrinho persistido em localStorage
- Responsividade mobile validada

---

# SPRINT 3 — PDP + Área do Cliente + Auth

**Duração:** 2 semanas
**Objetivo:** Página de produto completa, autenticação e área do cliente.
**EPICs:** EPIC-02 (US-02.5 a US-02.9) + EPIC-03 (completo)
**Agentes:** `@ux-design-expert` (lead UI), `@dev` (lead lógica)
**SP Total:** ~42 SP

### Stories

| ID | Story | SP | Agente | Criticidade |
|---|---|---|---|---|
| US-02.5 | Página de Produto (/produto/[slug]) — galeria, tamanho, add-to-cart | 8 | `@ux-design-expert` + `@dev` | 🔴 |
| US-02.6 | Página do Carrinho (/carrinho) | 5 | `@ux-design-expert` + `@dev` | 🔴 [bloq sprint 4] |
| US-02.7 | Busca com resultados (/busca) | 5 | `@dev` | 🟡 |
| US-02.8 | Páginas institucionais (Sobre, Políticas, FAQ) | 3 | `@ux-design-expert` | 🟢 |
| US-02.9 | Página de Erro 404 e Loading States globais | 2 | `@ux-design-expert` | 🟡 |
| US-03.1 | Autenticação — Login/Register com Supabase Auth + Google OAuth | 8 | `@dev` | 🔴 [bloq sprint 4] |
| US-03.2 | Área do Cliente — Meu Perfil (/minha-conta) | 5 | `@dev` | 🟡 |
| US-03.3 | Área do Cliente — Meus Pedidos (/minha-conta/pedidos) | 5 | `@dev` | 🟡 |
| US-03.4 | Área do Cliente — Endereços + Lista de Desejos | 3 | `@dev` | 🟢 |

**DoD Sprint 3:**
- PDP com galeria funcional e add-to-cart
- Auth via email/senha e Google OAuth
- Middleware de proteção de rotas ativo
- Área do cliente com dados reais

---

# SPRINT 4 — Checkout e Pagamentos

**Duração:** 2 semanas
**Objetivo:** Fluxo de checkout completo com Stripe (cartão, débito e Pix).
**EPICs:** EPIC-04 (completo)
**Agentes:** `@dev` (lead), `@data-engineer` (schema pagamentos)
**SP Total:** ~34 SP

### Stories

| ID | Story | SP | Agente | Criticidade |
|---|---|---|---|---|
| US-04.1 | Checkout — Step 1: Endereço de Entrega | 5 | `@dev` | 🔴 [bloq] |
| US-04.2 | Checkout — Step 2: Cálculo de Frete (Correios) | 5 | `@dev` | 🔴 |
| US-04.3 | Checkout — Step 3: Resumo + Cupom de Desconto | 5 | `@dev` | 🔴 |
| US-04.4 | Checkout — Pagamento Cartão de Crédito/Débito (Stripe) | 8 | `@dev` | 🔴 [bloq] |
| US-04.5 | Checkout — Pagamento Pix (Stripe + QR Code) | 5 | `@dev` | 🔴 |
| US-04.6 | Webhook Stripe — confirmação de pagamento e criação de pedido | 8 | `@dev` | 🔴 [bloq] |

**Notas críticas:**
- `constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET)` obrigatório no webhook
- `rawBody` via `request.text()`, nunca `request.json()`
- Pix: `expires_after_seconds` mínimo 600s (10min), máximo 86400s

**DoD Sprint 4:**
- Checkout end-to-end funcional em ambiente de teste (Stripe test mode)
- Webhook processando pagamentos confirmados
- Pedido criado no banco após pagamento
- Pix QR Code exibido e verificável

---

# SPRINT 5 — Integrações

**Duração:** 2 semanas
**Objetivo:** Correios para frete/rastreio, Resend para emails transacionais, Bot Claude.
**EPICs:** EPIC-05 (completo)
**Agentes:** `@dev` (lead), `@data-engineer` (RPCs para o bot)
**SP Total:** ~34 SP

### Stories

| ID | Story | SP | Agente | Criticidade |
|---|---|---|---|---|
| US-05.1 | Integração Correios API — cálculo de frete | 8 | `@dev` | 🔴 |
| US-05.2 | Rastreamento de pedidos via Correios | 5 | `@dev` | 🟡 |
| US-05.3 | Email transacional — confirmação de pedido (Resend + React Email) | 5 | `@dev` | 🔴 |
| US-05.4 | Emails transacionais — status do pedido (5 templates) | 5 | `@dev` | 🟡 |
| US-05.5 | Bot de Suporte Claude API — chat widget + contexto via RPCs | 8 | `@dev` + `@data-engineer` | 🟡 |
| US-05.6 | Bot — respostas sobre pedidos, produtos e políticas | 3 | `@dev` | 🟢 |

**DoD Sprint 5:**
- Cálculo de frete funcional para todos os CEPs do Brasil
- 6 templates de email renderizando corretamente
- Bot respondendo perguntas sobre produtos e pedidos do usuário logado

---

# SPRINT 6 — Painel Administrativo

**Duração:** 2 semanas
**Objetivo:** Admin completo — produtos, pedidos, cupons, configurações base.
**EPICs:** EPIC-06 (completo)
**Agentes:** `@dev` (lead), `@ux-design-expert` (Admin UI), `@data-engineer` (queries admin)
**SP Total:** ~42 SP

### Stories

| ID | Story | SP | Agente | Criticidade |
|---|---|---|---|---|
| US-06.1 | Admin — Sidebar e layout base `/admin` | 5 | `@ux-design-expert` + `@dev` | 🔴 [bloq] |
| US-06.2 | Admin — Dashboard `/admin/dashboard` (KPIs) | 5 | `@dev` | 🟡 |
| US-06.3 | Admin — Gestão de Produtos CRUD `/admin/produtos` | 8 | `@dev` | 🔴 |
| US-06.4 | Admin — Gestão de Pedidos `/admin/pedidos` | 8 | `@dev` | 🔴 |
| US-06.5 | Admin — Gestão de Cupons `/admin/cupons` | 5 | `@dev` | 🟡 |
| US-06.6 | Admin — Configurações `/admin/configuracoes` (store_settings) | 5 | `@dev` | 🔴 |
| US-06.7 | Admin — Upload de imagens para Supabase Storage | 3 | `@dev` | 🔴 |
| US-06.8 | Admin — Gestão de Reviews `/admin/avaliacoes` | 5 | `@dev` | 🟡 |

**DoD Sprint 6:**
- Admin acessível apenas por usuários com `app_metadata.role = 'admin'`
- CRUD de produtos funcionando com upload de imagens
- Pedidos com mudança de status e histórico

---

# SPRINT 7 — SEO, Performance, Deploy MVP + Gaps Críticos

**Duração:** 2 semanas
**Objetivo:** MVP em produção, SEO técnico e correções de gaps identificados.
**EPICs:** EPIC-07 (completo) + EPIC-A (US-A.3 a US-A.5 — edge cases e estoque)
**Agentes:** `@devops` (lead deploy), `@dev`, `@qa` (validação MVP)
**SP Total:** ~21 SP

### Stories

| ID | Story | SP | Agente | Criticidade |
|---|---|---|---|---|
| US-07.1 | SEO técnico — sitemap, robots.txt, metadata dinâmica | 5 | `@dev` | 🔴 |
| US-07.2 | Performance — otimização de imagens, lazy loading, Core Web Vitals | 5 | `@dev` | 🟡 |
| US-07.3 | Deploy produção — domínio gabinetefc.com.br + admin.gabinetefc.com.br | 5 | `@devops` | 🔴 [bloq] |
| US-A.3 | Edge cases — cancelamento de pedido, estoque esgotado | 3 | `@dev` | 🔴 |
| US-A.4 | Gestão de Estoque Físico `/admin/estoque` | 5 | `@dev` + `@data-engineer` | 🟡 |
| — | QA geral do MVP — smoke tests, testes de regressão | — | `@qa` | 🔴 |

**DoD Sprint 7:**
- MVP ao vivo em produção com domínio configurado
- Lighthouse Score > 85 em todas as categorias
- Sitemap indexado no Google Search Console

> **Marco:** 🎯 **MVP lançado** — Loja operacional, checkout funcional, admin completo.

---

---

# SPRINT 8 — Avaliações, Cupons Automáticos + Marketing

**Duração:** 2 semanas
**Objetivo:** Sistema de avaliações com fotos, cupons automáticos e landing pages de conversão.
**EPICs:** EPIC-B (completo) + EPIC-C (parcial)
**Agentes:** `@dev` (lead), `@ux-design-expert`, `@data-engineer`
**SP Total:** ~34 SP

### Stories

| ID | Story | SP | Agente | Criticidade |
|---|---|---|---|---|
| US-B.1 | Sistema de Avaliações com upload de fotos | 8 | `@dev` + `@ux-design-expert` | 🔴 |
| US-B.2 | Moderação de reviews no Admin + resposta do admin | 5 | `@dev` | 🟡 |
| US-B.3 | Cupom automático pós-review aprovada | 3 | `@dev` | 🟢 |
| US-C.1 | Landing Page Copa do Mundo (countdown + produtos) | 5 | `@ux-design-expert` + `@dev` | 🟡 |
| US-C.2 | Promoções avançadas — compre X leve Y, bundle | 8 | `@dev` + `@data-engineer` | 🟡 |
| US-C.3 | Banners dinâmicos gerenciados pelo admin | 5 | `@dev` | 🟢 |

**DoD Sprint 8:**
- Reviews com fotos publicadas no PDP
- Cupons automáticos sendo enviados por email
- Landing Copa indexável e com metadata SEO

---

# SPRINT 9 — Operações Avançadas + Expansão

**Duração:** 2 semanas
**Objetivo:** Rastreamento automático Correios, busca com autocomplete e relatórios operacionais.
**EPICs:** EPIC-D (completo) + EPIC-E (parcial)
**Agentes:** `@dev` (lead), `@devops` (Cron Vercel), `@data-engineer`
**SP Total:** ~26 SP

### Stories

| ID | Story | SP | Agente | Criticidade |
|---|---|---|---|---|
| US-D.1 | Tracking automático Correios — Cron Job Vercel (a cada 6h) | 8 | `@dev` + `@devops` | 🟡 |
| US-D.2 | Busca com autocomplete (sugestões em tempo real) | 5 | `@dev` | 🟡 |
| US-D.3 | Relatório Financeiro básico no Admin | 5 | `@dev` + `@data-engineer` | 🟡 |
| US-E.1 | Novas categorias de produto (Retrô, Especiais) | 3 | `@dev` | 🟢 |
| US-E.2 | Página "Lançamentos" e "Promoções" dedicadas | 5 | `@ux-design-expert` + `@dev` | 🟢 |

**DoD Sprint 9:**
- Cron de rastreio rodando em produção
- Autocomplete funcional com debounce
- Dashboard financeiro básico exibindo receita por período

---

# SPRINT 10 — Retenção, Fidelidade Base + PWA

**Duração:** 2 semanas
**Objetivo:** Programa de pontos básico, notificação de estoque e PWA.
**EPICs:** EPIC-F (completo)
**Agentes:** `@dev` (lead), `@data-engineer`, `@devops`
**SP Total:** ~26 SP

### Stories

| ID | Story | SP | Agente | Criticidade |
|---|---|---|---|---|
| US-F.1 | Programa de Pontos — acúmulo por compra | 8 | `@dev` + `@data-engineer` | 🟡 |
| US-F.2 | Notificação de Estoque — "Me avise quando chegar" | 5 | `@dev` | 🟡 |
| US-F.3 | PWA — manifest.json + service worker básico | 5 | `@dev` + `@devops` | 🟢 |
| US-F.4 | Push Notifications básico (opt-in + VAPID) | 8 | `@dev` | 🟢 |

> **Marco:** 🎯 **Fase 2 completa** — Operações avançadas e retenção básica ativas.

---

---

# SPRINT 11 — Meta Pixel + CAPI + Admin BM

**Duração:** 2 semanas
**Objetivo:** Integração Meta Ads completa — Pixel client-side, CAPI server-side e configuração do BM no Admin.
**EPICs:** EPIC-H (completo) + EPIC-K (sidebar Admin definitivo)
**Agentes:** `@dev` (lead), `@data-engineer` (store_settings Meta)
**SP Total:** ~26 SP

### Stories

| ID | Story | SP | Agente | Criticidade |
|---|---|---|---|---|
| US-H.1 | Admin — Configuração Meta BM `/admin/configuracoes` → tab Integrações | 5 | `@dev` | 🔴 |
| US-H.2 | Meta Pixel client-side — 5 eventos + eventID deduplicação | 8 | `@dev` | 🔴 |
| US-H.3 | CAPI server-side — 4 eventos (Purchase, AddToCart, InitiateCheckout, Lead) | 8 | `@dev` | 🔴 |
| US-K.1 | Sidebar Admin definitivo — estrutura final com todos os módulos | 5 | `@ux-design-expert` + `@dev` | 🟡 |

**Notas críticas:**
- `meta_bm_id`, `meta_pixel_id`, `meta_access_token` em `store_settings` com `category = 'meta'`
- RLS bloqueia anon key de ler `category = 'meta'`
- CAPI: SHA-256 em todos os dados de usuário antes de enviar
- EventID gerado no client, replicado no Server Action (deduplicação)
- CAPI **não** dispara PageView (apenas 4 eventos listados)

**DoD Sprint 11:**
- Pixel enviando eventos verificáveis no Meta Events Manager
- CAPI deduplicando corretamente com eventID
- Admin salvando e lendo `meta_pixel_id` + `meta_access_token` de forma segura

---

# SPRINT 12 — Analytics Próprio + Heatmap + VIP/LGPD

**Duração:** 2 semanas
**Objetivo:** Sistema de analytics de comportamento próprio via Supabase, heatmap zero custo e features de retenção VIP/LGPD.
**EPICs:** EPIC-G (parcial) + EPIC-I + EPIC-J + EPIC-L (schema)
**Agentes:** `@dev` (lead), `@data-engineer` (schema behavior_events + heatmap_events)
**SP Total:** ~26 SP

### Stories

| ID | Story | SP | Agente | Criticidade |
|---|---|---|---|---|
| US-I.1 | Analytics Próprio — tracker de comportamento (behavior_events) | 8 | `@dev` + `@data-engineer` | 🟡 |
| US-I.2 | Dashboard Analytics Admin — funil de conversão e páginas mais visitadas | 5 | `@dev` | 🟡 |
| US-J.1 | Heatmap próprio — heatmap.js + heatmap-tracker.ts + Supabase | 8 | `@dev` | 🟢 |
| US-G.1 | Soft Delete LGPD — deleção de conta preservando dados fiscais | 3 | `@dev` + `@data-engineer` | 🟡 |
| US-G.2 | VIP — tag de cliente especial com benefícios | 3 | `@dev` | 🟢 |
| US-L.1 | Schema SQL EPIC-03 — migrations push_subscriptions e complementos | 5 | `@data-engineer` | 🔴 |

**Notas:**
- Index obrigatório: `CREATE INDEX idx_behavior_events_session_event ON behavior_events(session_id, event_type)`
- Cron de TTL para `heatmap_events` (90 dias) e `behavior_events` (13 meses) — via `@devops`
- CSP `frame-ancestors 'self'` para iframe do heatmap

**DoD Sprint 12:**
- Eventos de comportamento sendo registrados em produção
- Heatmap visualizável no admin
- Schema push_subscriptions migrado

---

# SPRINT 13 — Carrinho Abandonado + Social Proof + Leads Meta Fase 1

**Duração:** 2 semanas
**Objetivo:** Email de carrinho abandonado, social proof no PDP e painel de leads Meta (relatório de aquisição).
**EPICs:** EPIC-G (completo) + EPIC-P (parcial)
**Agentes:** `@dev` (lead), `@devops` (Cron carrinho abandonado)
**SP Total:** ~26 SP

### Stories

| ID | Story | SP | Agente | Criticidade |
|---|---|---|---|---|
| US-G.3 | Carrinho Abandonado — sequência de 3 emails (1h, 24h, 72h) | 8 | `@dev` + `@devops` | 🟡 |
| US-G.4 | Social Proof — contador de visitantes, "X pessoas estão vendo isto" | 3 | `@dev` | 🟢 |
| US-P.1 | Painel Leads Meta `/admin/marketing/leads` — funil de campanhas | 8 | `@dev` + `@data-engineer` | 🟡 |
| US-P.2 | Indicadores Meta — CPL, ROAS, sessões por campanha | 5 | `@dev` | 🟡 |

**Notas:**
- Link de unsubscribe do carrinho abandonado deve ter token HMAC
- `get_meta_leads_funnel` usa 7 CTEs independentes (evitar produto cartesiano)
- Cron carrinho abandonado via Vercel Cron Jobs

> **Marco:** 🎯 **Fase 3 completa** — Analytics, Meta Ads e carrinho abandonado operacionais.

---

---

# SPRINT 14 — Dashboard Financeiro + Fidelidade Completa

**Duração:** 2 semanas
**Objetivo:** Dashboard financeiro completo e programa de fidelidade com expiração de pontos e campanhas.
**EPICs:** EPIC-M (completo) + EPIC-N (completo)
**Agentes:** `@dev` (lead), `@data-engineer`, `@ux-design-expert`
**SP Total:** ~29 SP

### Stories

| ID | Story | SP | Agente | Criticidade |
|---|---|---|---|---|
| US-M.1 | Dashboard Financeiro `/admin/financeiro` — receita, pagamentos, produtos | 8 | `@dev` + `@data-engineer` | 🔴 |
| US-M.2 | Financeiro — gráficos de receita por período e produto mais vendido | 5 | `@ux-design-expert` + `@dev` | 🟡 |
| US-M.3 | Financeiro — lucratividade estimada (receita − custo operacional) | 5 | `@dev` | 🟡 |
| US-N.1 | Fidelidade — expiração de pontos + regras configuráveis | 5 | `@dev` + `@data-engineer` | 🟡 |
| US-N.2 | Fidelidade — campanhas de pontos duplos (admin) | 3 | `@dev` | 🟢 |
| US-N.3 | Fidelidade — gestão admin `/admin/fidelidade` | 3 | `@dev` | 🟢 |

**DoD Sprint 14:**
- `get_financial_summary` retornando dados corretos (com check de role admin)
- Pontos expirando conforme configuração
- Dashboard financeiro com gráficos interativos

---

# SPRINT 15 — Push Campaigns + Leads Meta Fase 2

**Duração:** 2 semanas
**Objetivo:** Push campaigns completas (segmentação, agendamento, análise) e painel completo de leads Meta com CAPI.
**EPICs:** EPIC-O (completo) + EPIC-P (completo)
**Agentes:** `@dev` (lead), `@devops` (VAPID env vars), `@data-engineer`
**SP Total:** ~29 SP

### Stories

| ID | Story | SP | Agente | Criticidade |
|---|---|---|---|---|
| US-O.1 | Push Campaigns — criar e segmentar campanhas no admin | 8 | `@dev` | 🟡 |
| US-O.2 | Push Campaigns — agendar envio e envio imediato | 5 | `@dev` + `@devops` | 🟡 |
| US-O.3 | Push Campaigns — análise de entrega e CTR | 3 | `@dev` | 🟢 |
| US-O.4 | VAPID keys — configuração segura via Vercel Secrets | 3 | `@devops` | 🔴 |
| US-P.3 | CAPI Dashboard Fase 2 — relatório de conversões Meta vs receita | 5 | `@dev` + `@data-engineer` | 🟡 |
| US-P.4 | Leads Meta — exportação de relatório CSV | 3 | `@dev` | 🟢 |

**Notas críticas:**
- `vapid_private_key` **nunca** em `store_settings` — deve estar em `VAPID_PRIVATE_KEY` (Vercel Secret)
- Só `vapid_public_key` vai no banco (leitura pelo client)

---

# SPRINT 16 — Pagamentos Avançados + Hardening Final

**Duração:** 2 semanas
**Objetivo:** Pix com expiração configurável, 3DS v2 para alto valor e hardening de segurança geral.
**EPICs:** EPIC-R (completo) + EPIC-Q (schema) + hardening geral
**Agentes:** `@dev` (lead), `@data-engineer` (schema EPIC-Q), `@qa` (validação final), `@devops`
**SP Total:** ~33 SP

### Stories

| ID | Story | SP | Agente | Criticidade |
|---|---|---|---|---|
| US-R.1 | Pix Expiração Configurável — admin define minutos (10–1440) + cron auto-cancelamento | 8 | `@dev` + `@devops` | 🟡 |
| US-R.2 | 3DS v2 — threshold configurável (padrão R$500), modo automatic/always | 8 | `@dev` | 🟡 |
| US-Q.1 | Schema EPIC-04 — migrations: pix_expiry_minutes, stripe_3ds_*, three_ds_triggered, pix_expiry_log | 5 | `@data-engineer` | 🔴 |
| — | Hardening — CSP headers, token HMAC unsubscribe, frame-ancestors | 5 | `@dev` | 🟡 |
| — | Crons TTL — heatmap_events (90d) e behavior_events (13m) | 3 | `@devops` | 🟡 |
| — | QA Final — regressão completa, smoke tests em produção | — | `@qa` | 🔴 |
| — | Documentação — fluxo eventID Purchase CAPI, guia de operação | 4 | `@dev` | 🟢 |

**Notas críticas:**
- Webhook Stripe: `constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET)` + `request.text()` + retorna 400 se inválido
- Pix: `expires_after_seconds` min=600 (10min), max=86400 (24h)
- 3DS: `request_three_d_secure: 'automatic'` | se falhar → `payment_status = 'pending'`
- Schema idempotente: CHECK constraint via `DO $$ BEGIN IF NOT EXISTS... END $$;`

**DoD Sprint 16:**
- Pix expirando e cancelando pedidos automaticamente
- 3DS ativando em pagamentos acima do threshold
- QA sign-off em produção
- Documentação de operação entregue

> **Marco:** 🎯 **Fase 4 completa** — Produto 100% do PRD entregue.

---

---

## Resumo de Story Points por Agente

| Agente | Sprints de atuação | SP estimado | % do total |
|---|---|---|---|
| `@dev` | 1–16 (todos) | ~280 SP | ~65% |
| `@ux-design-expert` | 2, 3, 6, 8, 11, 14 | ~60 SP | ~14% |
| `@data-engineer` | 1, 4, 5, 9, 11, 12, 13, 14, 15, 16 | ~55 SP | ~13% |
| `@devops` | 0, 7, 9, 10, 13, 15, 16 | ~20 SP | ~5% |
| `@qa` | 7, 16 + revisões | ~12 SP | ~3% |
| `@architect` | 0 | — | — |
| `@sm` / `@pm` | 0 + grooming contínuo | — | — |

---

## Mapa de Dependências entre Sprints

```
Sprint 0 (Setup)
    ↓
Sprint 1 (Infra + Schema)
    ↓
Sprint 2 (Home + Catálogo)   ← depende Sprint 1
    ↓
Sprint 3 (PDP + Auth + Área Cliente)
    ↓
Sprint 4 (Checkout + Pagamentos)
    ↓
Sprint 5 (Integrações)         Sprint 6 (Admin)    ← paralelos após Sprint 4
    ↓                               ↓
Sprint 7 (SEO + Deploy MVP) ← aguarda Sprints 5 e 6
    ↓
    🎯 MVP LANÇADO
    ↓
Sprint 8 (Avaliações + Marketing)
    ↓
Sprint 9 (Ops Avançadas + Expansão)   Sprint 10 (Fidelidade + PWA) ← paralelos
    ↓                                         ↓
Sprint 11 (Meta Pixel + CAPI) ← aguarda Sprints 9 e 10
    ↓
Sprint 12 (Analytics + Heatmap)   Sprint 13 (Carrinho Abandonado) ← paralelos
    ↓                                      ↓
    🎯 FASE 3 COMPLETA
    ↓
Sprint 14 (Dashboard Financeiro + Fidelidade)
    ↓
Sprint 15 (Push Campaigns + Leads Meta)
    ↓
Sprint 16 (Pagamentos Avançados + Hardening)
    ↓
    🎯 FASE 4 — 100% PRD ENTREGUE
```

---

## Critérios Globais de DoD (Definition of Done)

Todo item concluído deve atender:

- [ ] Critérios de aceitação da story 100% implementados
- [ ] `npm run lint` e `npm run typecheck` passando sem erros
- [ ] Testado em ambiente de staging (Vercel preview)
- [ ] RLS correto — anon não acessa dados privados
- [ ] Sem `console.log` em produção
- [ ] Variáveis sensíveis apenas em `.env` / Vercel Secrets — nunca em código
- [ ] Story atualizada com checkboxes `[x]` e seção File List preenchida

---

## Ações Bloqueantes Antes do Sprint 1

Derivadas dos QAs de todos os EPICs:

- [ ] `app_metadata` vs `user_metadata` — usar `app_metadata` para role admin (US-A.2)
- [ ] Campos `reviews.photos`, `reviews.admin_response`, `reviews.coupon_generated_id` no schema (US-A.1)
- [ ] Seed de `store_settings` com todos os defaults — incluir `meta_bm_id`, `pix_expiry_minutes`, `stripe_3ds_*`
- [ ] VAPID Private Key configurada em Vercel Secrets antes do Sprint 15 (`@devops`)
- [ ] Cron de TTL para `heatmap_events` e `behavior_events` agendado no Sprint 16

---

*Documento gerado por @aios-master — Synkra AIOS*
*Baseado nos EPICs: v1.0 (MVP), v2.0 (Complementar), v3.0 (Analytics), v4.0 (Financeiro)*
*Cobertura PRD: 100% ✅*
