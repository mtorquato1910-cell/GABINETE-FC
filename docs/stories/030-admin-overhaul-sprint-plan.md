# Sprint Plan — Admin Overhaul (Stories 030–034)

**Criado em**: 2026-05-26
**Orquestração**: Orion (aios-master)
**Architect**: Cole · **PM**: Pria · **QA**: Quinn
**Status**: 🟡 Aguardando aprovação do dono + ajustes pré-execução

---

## Contexto do pedido

Dono solicitou 5 mudanças no painel admin:

1. **Auth segregado** — admin e cliente não podem compartilhar login (estratégia C escolhida: tabela única + URLs separadas)
2. **Listagem de clientes** — admin não tem hoje
3. **Heatmap** está com erro
4. **Analytics clicável** — clicar em página listada → ver quem visitou (logado/anônimo)
5. **PromoBar verde** — remover do admin (continua na loja)

---

## Stories

### Story 030 — Remover PromoBar do admin
- **Sprint** 1 · **Estimativa** 0.5 dia · **P1** · **Risco baixo** · **QA: ⚠️ amarelo**
- **DoD**: criar route group `src/app/(shop)/layout.tsx`, mover `<PromoBar />` pra lá, remover do `src/app/layout.tsx:84`
- **QA exige**: grep por `usePromoBar`/`PromoBarContext` antes do merge

### Story 031 — Fix Heatmap
- **Sprint** 1 · **Estimativa** 1 dia · **P0** · **Risco baixo** · **QA: ✅ verde**
- **DoD**: try/catch em `src/app/api/analytics/heatmap/route.ts`, migrar raw SQL → Prisma `groupBy`, empty state UI distinguível de erro

### Story 032 — Auth segregado (Opção C)
- **Sprint** 2–3 · **Estimativa** 4 dias · **P0** · **Risco ALTO** · **QA: 🚫 vermelho (bloqueada)**
- **Bloqueios QA antes de codar**:
  1. **Feature flag** `AUTH_SEGREGATION_ENABLED` + conta admin break-glass
  2. **Rotacionar secrets** vazados no commit `eacde0d`: `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, senha do admin único
- **Desenho**:
  - Nova rota `/painel/login`
  - JWT ganha claim `loginSource: 'admin' | 'customer'`
  - Middleware bloqueia admin de `/checkout/*`, customer de `/painel/*`
  - `requireAdminContext()` exige `loginSource === 'admin'`
- **Migration**: invalidar sessões ativas → exige janela de manutenção

### Story 033 — Listagem de clientes
- **Sprint** 4 · **Estimativa** 3 dias · **P1** · **Risco médio** · **QA: ⚠️ amarelo** · **Depende de 032**
- **DoD**: `/admin/clientes` (cursor-based, busca nome/email/cpf, filtros isVip/deletados) + `/admin/clientes/[id]` (tabs Perfil, Pedidos, Endereços, Reviews, Eventos)
- **LGPD obrigatório**:
  - Mascarar CPF na lista (`***.***.***-XX`), reveal só no drill-down + audit log
  - `AdminAuditLog` (adminId, customerId, ação, timestamp) — retenção 6-12 meses
  - Endpoint `DELETE /admin/clientes/:id` (direito de exclusão LGPD)

### Story 034 — Analytics drill-down
- **Sprint** 5 · **Estimativa** 3 dias · **P2** · **Risco médio** · **QA: ⚠️ amarelo** · **Depende de 031 + 032**
- **DoD**: novo endpoint `GET /api/admin/analytics/page-detail?pageUrl=&from=&to=&cursor=`, drawer lateral direito (tabs Resumo, Sessões, Eventos), DTO sem PII bruto, anônimos como "Anônimo #hash", multi-userId com label "mudou de conta"

---

## Roadmap

| Sprint | Stories | Duração | Risco | Status |
|---|---|---|---|---|
| 1 | 030 + 031 | 2 dias | Baixo | ✅ Pronto pra começar |
| 2 | 032 (backend) | 2.5 dias | Alto | 🚫 Bloqueado |
| 3 | 032 (UI + deploy) | 1.5 dia | Alto | 🚫 Bloqueado |
| 4 | 033 | 3 dias | Médio | ⏳ Aguarda 032 |
| 5 | 034 | 3 dias | Médio | ⏳ Aguarda 031 + 032 |

**Total**: ~12 dias úteis (≈2.5 semanas corridas)

---

## Riscos críticos

1. **Lockout do admin único** durante Story 032 — mitigar com feature flag + break-glass
2. **Secrets vazados** no commit `eacde0d` (repo público) — rotacionar ANTES do 032
3. **Sessões Supabase ativas** — comunicar clientes 24h antes do deploy 032 (perdem carrinho se não persistido em localStorage)
4. **LGPD** — `AdminAuditLog` + política de retenção obrigatórios antes de 033 ir pra prod
5. **Regressão na loja** ao mover páginas pra route group `(shop)` — smoke test mandatório

---

## Decisões pendentes do dono

1. **PromoBar**: confirmar — remover só do admin (assumido) ou também do site?
2. **Story 032**: aprovar **rotação de secrets** (admin precisa fazer login de novo após)?
3. **Janela de manutenção**: confirmar madrugada terça/quarta pra deploy 032
4. **Ordem**: manter (PromoBar → Heatmap → Auth → Clientes → Drill-down) ou priorizar Clientes?
5. **CPF**: aceita mascarar na lista + revelar só no drill-down com log (padrão LGPD)?

---

## Definition of Done global

Toda story passa por:
1. `npm run typecheck` limpo
2. `npm run lint` sem warnings novos
3. `npm run build` local OK
4. Testes E2E (Playwright) verdes
5. Screenshots before/after no PR (desktop + mobile 375px)
6. Migration Prisma com plano de rollback (se houver)
7. `.env.example` atualizado
8. Checklist LGPD/segurança preenchido (032, 033, 034)
