# DIAGNÓSTICO DE QA — EPIC-02 Complementar: Gabinete FC v2.0

**Agente:** @qa (Quality Assurance) — Synkra AIOS
**Data:** 2026-04-16
**Artefato:** `docs/epics/EPIC-gabinete-fc-v2.0-complementar.md`
**Status Final:** ⚠️ APROVADO COM RESSALVAS

---

## 1. PONTUAÇÃO GERAL

**Nota: 8.6 / 10**

**Justificativa:** O documento é tecnicamente sólido, bem estruturado e cobre com profundidade os gaps identificados no QA-01. A qualidade das User Stories e dos critérios de aceitação é superior à média — especialmente no EPIC-A. Os Sub-EPICs de Fase 2 e 3 estão coerentes com o PRD. As ressalvas dizem respeito a: problema de arquitetura em US-C.2 (IDs de rastreamento via store_settings), campos da tabela `reviews` ausentes do Apêndice de schema, ausência de seed de `store_settings`, e o email de carrinho abandonado sem US em nenhum Sub-EPIC.

---

## 2. COBERTURA DOS GAPS DO EPIC-01 (os 6 Críticos do QA-01)

| Crítico | Descrição | Status |
|---|---|---|
| CRÍTICO-01 | Tabela `order_history` adicionada ao schema | ✅ CORRIGIDO — US-A.1 completa |
| CRÍTICO-02 | Campos `is_featured`, `tracking_events_json`, `tracking_updated_at` | ✅ CORRIGIDO — US-A.1 com tipos corretos |
| CRÍTICO-03 | Módulo de Gestão de Estoque Físico criado | ✅ CORRIGIDO — US-A.7 completo |
| CRÍTICO-04 | Valores dos cupons de avaliação definidos | ✅ CORRIGIDO COM RESSALVA — 10%/5% definidos, mas seed ausente |
| CRÍTICO-05 | Critério de contagem "3+ camisas" especificado | ✅ CORRIGIDO E MELHORADO — US-C.3 |
| CRÍTICO-06 | Bug de segurança app_metadata vs user_metadata | ✅ CORRIGIDO — US-A.2 exemplar |

**Pontuação Críticos: 6/6 corrigidos** (um com ressalva de seed de dados)

---

## 3. COBERTURA DAS FASES 2 E 3 DO PRD

### EPIC-A: Correções e Gaps Críticos (MVP)
**Veredicto: ✅ APROVADO**
Cobertura excelente. US-A.1 a US-A.7 cobrem schema, segurança, máquina de estados, edge cases e estoque físico.

**Pendências não resolvidas (vindas do QA-01):**
- Carrinho abandonado (M-07 do QA-01) — sem US em nenhum Sub-EPIC
- Soft delete vs hard delete de conta LGPD (M-04) — sem resolução
- Histórico do bot entre navegações (M-09) — não endereçado

### EPIC-B: Avaliações e Engajamento (Fase 2)
**Veredicto: ⚠️ APROVADO COM RESSALVA**
US-B.1 a US-B.4 cobrem formulário de avaliação com fotos, moderação admin, cupons automáticos e exibição na PDP.

**Ressalva:** Três campos críticos da tabela `reviews` mencionados nas US mas ausentes do Apêndice de schema:
- `photos` (jsonb — array de URLs)
- `admin_response` (text nullable)
- `coupon_generated_id` (uuid FK coupons nullable)

### EPIC-C: Marketing e Conversão (Fase 2)
**Veredicto: ⚠️ APROVADO COM RESSALVA CRÍTICA em US-C.2**
US-C.1, C.3, C.4 prontas. US-C.2 tem problema arquitetural.

### EPIC-D: Operações Avançadas (Fase 2)
**Veredicto: ✅ APROVADO**
US-D.1 a US-D.5 cobrem tracking automático, relatórios financeiros, busca com autocomplete e upsell.

### EPIC-E: Expansão de Produto (Fase 3)
**Veredicto: ✅ APROVADO** (com ressalva menor de RLS em `collections`)

### EPIC-F: Retenção e Fidelidade (Fase 3)
**Veredicto: ⚠️ APROVADO COM RESSALVA MENOR**
Tabela `push_subscriptions` ausente do Apêndice de schema.

---

## 4. PROBLEMAS CRÍTICOS ❌

### CRÍTICO-A: US-C.2 — Arquitetura de IDs de Rastreamento Incorreta
**Local:** US-C.2, critério de IDs do Pixel/GTM editáveis no admin

**Problema:** `NEXT_PUBLIC_*` no Next.js são injetadas em BUILD TIME, não em runtime. Se implementado como escrito, alterar os IDs no admin não terá efeito até o próximo deploy. O critério não é testável como está.

**Solução correta (escolher uma):**
1. Ler IDs de `store_settings` no servidor e injetá-los via `<Script strategy="afterInteractive">` — sem build necessário, editável no admin em tempo real.
2. Manter IDs em `.env` (sem UI de admin) — simples, mas sem feature de edição no painel.

**Ação:** Decidir com @architect e reescrever o critério antes do desenvolvimento de US-C.2.

---

### CRÍTICO-B: Campos novos em `reviews` ausentes do Apêndice de schema
**Local:** US-B.1, US-B.2, US-B.3 vs Apêndice "Campos Novos em Tabelas Existentes"

**Problema:** Campos usados nas User Stories mas não documentados no schema — desenvolvedor criará migration incompleta.

**Correção:** Adicionar ao Apêndice:

| Tabela | Campo | Tipo | EPIC |
|---|---|---|---|
| `reviews` | `photos` | jsonb (array de URLs) | B |
| `reviews` | `admin_response` | text nullable | B |
| `reviews` | `coupon_generated_id` | uuid FK coupons nullable | B |

---

### CRÍTICO-C: Ausência de seed de dados para `store_settings`
**Local:** US-B.3, US-C.3, US-D.5, US-F.1 — todas dependem de chaves em `store_settings`

**Problema:** Ao menos 12 chaves de `store_settings` são definidas ao longo do EPIC-02. Nenhuma US define a migration de seed. Se a tabela for criada vazia, todas as features que dependem dessas chaves falharão silenciosamente.

**Correção:** Adicionar critério em US-A.1: "Migration de seed cria todos os registros padrão de `store_settings` listados no Apêndice antes de qualquer outra migration do EPIC-02."

---

## 5. PONTOS DE MELHORIA ⚠️

| # | Melhoria | Local |
|---|---|---|
| M-01 | RLS não definida para tabela `collections` | US-E.1 |
| M-02 | RLS não definida para `push_subscriptions` | US-F.3 |
| M-03 | `push_subscriptions` ausente do Apêndice de schema | US-F.3 |
| M-04 | Email de destino para alerta de estoque mínimo não especificado | US-A.7 |
| M-05 | Taxa Stripe hardcoded (2,9% + R$0,39) — considerar configurável | US-D.3 |
| M-06 | Migration do enum `product_category` com dados existentes não tratada | US-E.1 |
| M-07 | Email de carrinho abandonado (Fase 2 PRD) sem US em nenhum Sub-EPIC | EPIC-C ou D |
| M-08 | Soft delete vs hard delete de conta (LGPD) ainda sem resolução | Sem Sub-EPIC |
| M-09 | Indicador de "X pessoas viram este produto" é dark pattern — decisão da marca pendente | US-E.3 |
| M-10 | Service Worker cache offline inclui área do cliente com dados de pedido (privacidade) | US-F.3 |
| M-11 | Critério VIP em US-06.5 do EPIC-01 permanece indefinido no EPIC-02 | Sem Sub-EPIC |
| M-12 | Histórico do bot entre navegações da mesma sessão não endereçado | Sem Sub-EPIC |

---

## 6. CONSISTÊNCIA COM O EPIC-01

### Sobreposições identificadas (intencionais e corretas):
- **US-A.3 estende US-06.3:** Máquina de estados de pedido complementa o que estava vago no EPIC-01. Time de dev deve usar US-A.3 como autoritativa para transições de status.
- **US-B.1 estende US-03.8:** Avaliações com fotos (Fase 2) estendem a base do MVP. Recomendação: marcar US-03.8 como STUB (somente formulário básico sem fotos) para evitar refatoração.
- **US-D.1 depende de US-05.2:** Cron de tracking automático depende da integração manual de Correios — dependência declarada corretamente.

### Conflitos encontrados: NENHUM

---

## 7. VEREDICTO FINAL

### Cobertura EPIC-01 + EPIC-02 do PRD: **~91%**

| Área | Cobertura |
|---|---|
| Infraestrutura, Auth, Frontend Público, Checkout | 100% |
| Painel Admin completo | 98% (critério VIP indefinido) |
| Integrações (Correios, Email, Bot Claude) | 100% |
| SEO, Performance, Deploy | 100% |
| Avaliações com fotos, moderação, cupons | 100% |
| Landing Copa, Meta Pixel, GTM, Promoções | 95% (US-C.2 pendente) |
| Tracking automático, Relatórios financeiros, Busca | 100% |
| Expansão de catálogo, UX de conversão | 100% |
| Programa de pontos, PWA, Notificação de estoque | 100% |

### O que ainda falta (9%):
1. Email de carrinho abandonado (Fase 2 do PRD)
2. Critério VIP concreto (undefined em EPIC-01 e EPIC-02)
3. Decisão LGPD: soft delete vs hard delete de conta
4. Histórico do bot entre navegações da mesma sessão
5. Resolução arquitetural de US-C.2 (IDs de rastreamento)

---

## 8. AÇÕES ANTES DO DESENVOLVIMENTO

**Bloqueantes (obrigatórias):**
- [ ] Adicionar seed de `store_settings` em US-A.1 (CRÍTICO-C)
- [ ] Adicionar campos de `reviews` no Apêndice de schema (CRÍTICO-B)
- [ ] Reescrever US-C.2 após decisão de arquitetura com @architect (CRÍTICO-A)

**Recomendadas (alta prioridade):**
- [ ] Criar US para email de carrinho abandonado (M-07)
- [ ] Definir critério VIP concreto ou remover (M-11)
- [ ] Adicionar RLS para `collections` em US-E.1 (M-01)
- [ ] Adicionar `push_subscriptions` no Apêndice e sua RLS (M-02, M-03)

---

*Diagnóstico gerado por @qa — Synkra AIOS | 2026-04-16*
*Versão avaliada: EPIC-gabinete-fc-v2.0-complementar.md*
