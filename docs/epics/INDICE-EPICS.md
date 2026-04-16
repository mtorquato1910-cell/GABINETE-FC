# ÍNDICE GERAL DE EPICs — Gabinete FC

**Projeto:** Gabinete FC — E-commerce de Camisas de Futebol
**Atualizado em:** 2026-04-16
**Status do conjunto:** ⚠️ Aprovado com Ressalvas (correções menores antes da sprint)

---

## Documentos

| Arquivo | Versão | Descrição | QA | Nota |
|---|---|---|---|---|
| `EPIC-gabinete-fc-v1.0.md` | 1.0 | EPIC Principal — MVP (Infra, Frontend, Auth, Checkout, Integrações, Admin base, SEO) | `QA-diagnostico-EPIC-v1.0.md` | 8.2/10 |
| `EPIC-gabinete-fc-v2.0-complementar.md` | 1.0 | EPIC Complementar — Gaps + Fase 2 + Fase 3 | `QA-diagnostico-EPIC-v2.0.md` | 8.6/10 |
| `EPIC-gabinete-fc-v3.0-analytics-marketing.md` | 1.0 | EPIC Analytics — Meta/CAPI, Heatmap, VIP, LGPD, Carrinho Abandonado | `QA-diagnostico-EPIC-v3.0.md` | 8.8/10 |
| `EPIC-gabinete-fc-v4.0-financeiro-fidelidade-leads.md` | 1.0 | EPIC Financeiro — Dashboard Financeiro, Fidelidade Completa, Push Campaigns, Leads Meta, Pagamentos Avançados | `QA-diagnostico-EPIC-v4.0.md` | 8.4/10 ✅ |
| `EPIC-gabinete-fc-v5.0-operacoes.md` | 1.0 | EPIC Operações — Campos privados JIN (custo/código fornecedor), Trocas e Devoluções completo | — | Draft |

---

## Sub-EPICs por documento

### EPIC-01 (MVP Principal)
- EPIC-01: Infraestrutura e Setup
- EPIC-02: Frontend Público (Home, Catálogo, PDP, Busca, Carrinho, Checkout)
- EPIC-03: Autenticação e Área do Cliente
- EPIC-04: Checkout e Pagamentos (Stripe, Pix)
- EPIC-05: Integrações (Correios, Email, Bot Claude)
- EPIC-06: Painel Administrativo Base
- EPIC-07: SEO, Performance e Deploy

### EPIC-02 (Complementar)
- EPIC-A: Correções e Gaps Críticos (schema, segurança, edge cases, estoque físico)
- EPIC-B: Avaliações e Engajamento (fotos, cupons automáticos)
- EPIC-C: Marketing e Conversão (Landing Copa, Promoções avançadas)
- EPIC-D: Operações Avançadas (Tracking automático Correios, Relatórios financeiros, Busca com autocomplete)
- EPIC-E: Expansão de Produto (novas categorias, UX de conversão)
- EPIC-F: Retenção e Fidelidade (Programa de pontos, Notificação estoque, PWA)

### EPIC-03 (Analytics e Marketing)
- EPIC-G: Decisões de Produto (VIP, LGPD soft delete, Social proof, Carrinho Abandonado)
- EPIC-H: Meta Business Manager (Pixel + UTM MVP / CAPI + Dashboard Fase 2) — BM vinculado via `/admin/configuracoes`
- EPIC-I: Analytics de Comportamento Próprio (Supabase)
- EPIC-J: Heatmap Próprio Zero Custo (heatmap.js + heatmap-tracker.ts)
- EPIC-K: Arquitetura de Navegação do Admin (sidebar definitivo)
- EPIC-L: Schema SQL Complementar do EPIC-03

### EPIC-04 (Financeiro, Fidelidade e Leads)
- EPIC-M: Dashboard Financeiro `/admin/financeiro` (receita, pagamentos, produtos, lucratividade)
- EPIC-N: Programa de Fidelidade Completo (expiração, campanhas pontos duplos, gestão admin)
- EPIC-O: Campanhas de Push Notification (criar, segmentar, agendar, analisar)
- EPIC-P: Leads & Indicadores de Aquisição Meta (relatório de leads vindos de campanhas Meta, funil, CPL, ROAS)
- EPIC-R: Pagamentos Avançados (Pix expiração configurável, 3DS v2 para alto valor)
- EPIC-Q: Schema SQL Complementar do EPIC-04

### EPIC-05 (Operações — JIN + Pós-Venda)
- EPIC-S: Gestão de Produtos JIN — campos privados `cost_price`, `supplier_code`, dashboard de margem
- EPIC-T: Trocas e Devoluções — `return_requests`, fluxo completo, Stripe Refund, templates email
- EPIC-U: Schema SQL Complementar do EPIC-05

---

## Cobertura do PRD

**Cobertura total: 100%** ✅ (após EPIC-04 com EPIC-R)

| Área | Coberto por | Status |
|---|---|---|
| Infraestrutura + Setup | EPIC-01 | ✅ 100% |
| Frontend Público (todas as páginas) | EPIC-01 + EPIC-02 | ✅ 95% |
| Autenticação + Área do Cliente | EPIC-01 + EPIC-02 + EPIC-03 | ✅ 95% |
| Checkout + Pagamentos Stripe | EPIC-01 | ✅ 90% |
| Integrações (Correios, Email, Claude) | EPIC-01 + EPIC-02 | ✅ 100% |
| Admin completo (todas as seções) | EPIC-01 + EPIC-02 + EPIC-03 | ✅ 95% |
| SEO + Performance + Deploy | EPIC-01 | ✅ 100% |
| Sistema de Avaliações | EPIC-02 | ✅ 100% |
| Estoque Físico | EPIC-02 | ✅ 90% |
| Programa de Fidelidade / Pontos | EPIC-02 | ⚠️ 80% |
| PWA + Push Notifications | EPIC-02 + EPIC-03 | ⚠️ 80% |
| Meta Pixel + CAPI + UTM | EPIC-03 | ✅ 100% |
| Analytics de comportamento próprio | EPIC-03 | ✅ 95% |
| Heatmap próprio | EPIC-03 | ✅ 90% |
| VIP + Soft Delete LGPD | EPIC-03 | ✅ 97% |
| Email carrinho abandonado | EPIC-03 | ✅ 95% |
| Relatório financeiro /admin/financeiro | Sidebar definido, sem US | ⚠️ 20% |

---

## Ações Obrigatórias Antes do Desenvolvimento

### Do QA-01 (EPIC-01):
- [ ] Verificar `app_metadata` vs `user_metadata` no middleware de admin (já corrigido no EPIC-A)
- [ ] Corrigir mapa de dependências (EPIC-02 e EPIC-03 podem rodar em paralelo após EPIC-01)

### Do QA-02 (EPIC-02):
- [ ] Adicionar campos de `reviews` (`photos`, `admin_response`, `coupon_generated_id`) no schema
- [ ] Reescrever US-C.2 após decisão de arquitetura — IDs via server-side leitura de store_settings (RESOLVIDO no EPIC-03: usar Script afterInteractive lendo de store_settings)
- [ ] Seed de store_settings com todos os defaults (EPIC-L cobre parcialmente)

### Do QA-03 (EPIC-03) — Bloqueantes:
- [x] ~~Verificar schema real de `store_settings` no EPIC-01~~ **RESOLVIDO 2026-04-16** — key-value confirmado ; coluna `category` adicionada a todos os INSERTs
- [x] ~~Adicionar tabela `push_subscriptions` à migration do EPIC-03~~ **RESOLVIDO 2026-04-16** — Seção 8 adicionada com campos completos, índices e RLS

### Do QA-03 (EPIC-03) — Antes da produção:
- [ ] Cron de TTL para heatmap_events (90 dias) e behavior_events (13 meses)
- [ ] Token HMAC no link de unsubscribe do carrinho abandonado
- [ ] CSP frame-ancestors 'self' para o iframe do heatmap
- [ ] Documentar fluxo de eventID Purchase entre cliente e Server Action CAPI

---

## Stack Tecnológica Confirmada

| Componente | Tecnologia | Decisão |
|---|---|---|
| Frontend | Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui | Migrar do React/Vite existente |
| Banco de Dados | Supabase (PostgreSQL) | Definido no PRD |
| Autenticação | Supabase Auth + Google OAuth | app_metadata para role admin |
| Storage | Supabase Storage | Imagens de produto e avaliações |
| Pagamentos | Stripe (crédito, débito, Pix) | Server-side apenas |
| Frete + Rastreio | Correios API | Polling via Vercel Cron |
| Bot de Suporte | Claude API (Anthropic) | Contexto via Supabase RPC |
| Email | Resend + React Email | 8 templates transacionais + 3 carrinho abandonado |
| Meta Ads | Meta Pixel (client) + CAPI (server) | Fase 1: Pixel+UTM / Fase 2: CAPI+Dashboard |
| Analytics Próprio | Supabase behavior_events | Funil + páginas + buscas |
| Heatmap | heatmap.js (CDN) + Supabase heatmap_events | Zero custo, 100% próprio |
| Deploy | Vercel (Next.js SSR + Edge Cache + Cron Jobs) | Definido no PRD |
| Domínios | gabinetefc.com.br + admin.gabinetefc.com.br | Subdomínios separados |
