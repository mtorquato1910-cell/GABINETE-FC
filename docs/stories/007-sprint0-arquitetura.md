# Story 007 — Sprint 0: Arquitetura e Planejamento

**Epic:** Infraestrutura / Arquitetura
**Sprint:** Sprint 0
**Agente:** @architect + @devops
**Status:** [x] Concluído — 2026-04-16

---

## Objetivo

Definir ADRs principais, design tokens, e documentação de arquitetura antes do desenvolvimento.

---

## Tarefas

- [x] ADR-001: App Router (Next.js 16 App Router vs Pages Router)
- [x] ADR-002: Railway + Prisma (substituindo Supabase)
- [x] ADR-003: NextAuth v5 (autenticação)
- [x] ADR-004: Stripe (gateway de pagamentos com suporte a Pix)
- [x] Design Tokens (cores, tipografia, espaçamento, breakpoints)

---

## Arquivos criados

- [x] `docs/architecture/ADR-001-app-router.md`
- [x] `docs/architecture/ADR-002-railway-prisma.md`
- [x] `docs/architecture/ADR-003-nextauth.md`
- [x] `docs/architecture/ADR-004-stripe-webhooks.md`
- [x] `docs/design-tokens.md`

---

## Decisões de Arquitetura (resumo)

| Decisão | Escolha | Alternativa descartada |
|---|---|---|
| Framework | Next.js 16 App Router | Pages Router |
| Banco dev | SQLite via Prisma 5 | Supabase |
| Banco prod | PostgreSQL Railway | PlanetScale |
| Auth | NextAuth v5 beta.31 | Clerk, Lucia |
| Pagamentos | Stripe (card + pix) | Mercado Pago |
| Deploy | Vercel + Railway | Supabase, Render |

---

*Story 007 | Sprint 0 | Gabinete FC*
