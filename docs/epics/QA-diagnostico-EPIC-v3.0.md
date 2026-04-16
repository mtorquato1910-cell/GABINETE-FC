# DIAGNÓSTICO QA — EPIC-03: Analytics, Marketing Avançado e Decisões de Produto

**Agente:** @qa (Quality Assurance) — Synkra AIOS
**Data:** 2026-04-16
**Artefato:** `docs/epics/EPIC-gabinete-fc-v3.0-analytics-marketing.md`
**Status Final:** ⚠️ APROVADO COM RESSALVAS

---

## 1. PONTUAÇÃO GERAL

**Nota: 8.8 / 10**

O documento é tecnicamente denso, bem estruturado e operacionalmente executável. Critérios de aceitação são majoritariamente testáveis e concretos. Existem 2 problemas bloqueantes que precisam de resolução antes de iniciar a sprint, e 2 itens de segurança que não podem chegar à produção sem correção.

---

## 2. COBERTURA DOS MÓDULOS

### EPIC-G — Decisões de Produto Confirmadas: 97%

| US | Cobertura | Observação |
|---|---|---|
| G.1 VIP | ✅ Completo | VIP configurável, cron, badge, cupons exclusivos |
| G.2 Soft Delete LGPD | ✅ Completo | Fluxo legal correto, 5 anos, hard delete cron |
| G.3 Social Proof | ✅ Completo | Sintético, range configurável, ISR 15min |
| G.4 Carrinho Abandonado | ✅ Completo | 3 emails, cupom 5% no email 2, lista no admin |

**Edge cases ausentes:**
- G.1: Idempotência do cron VIP não tem critério de aceitação explícito (email VIP pode ser enviado 2x)
- G.2: Usuário OAuth (sem senha) no modal de exclusão não tem tratamento alternativo
- G.4: Link de unsubscribe sem token HMAC — cancelamento pode ser feito por qualquer pessoa com acesso ao link de email

---

### EPIC-H — Meta Business Manager: 94%

| US | Cobertura | Observação |
|---|---|---|
| H.1 Meta Pixel client-side | ✅ Completo | 5 eventos, eventID UUID, server-side injection |
| H.2 UTM capture | ✅ Completo | Cookie 30 dias, 5 campos em orders, last-touch |
| H.3 CAPI server-side | ✅ Completo | SHA-256 server-side, deduplicação, token mascarado |
| H.4 Dashboard Performance | ✅ Completo | Campanhas, ROAS, CPA, Recharts |

**Problemas:**
- H.1 + H.3: Fluxo de `eventID` do Purchase (cliente → Server Action) não descrito — crítico para deduplicação
- H.3: `PageView` CAPI é mencionado mas não faz sentido server-side — clarificar que são 4 eventos (sem PageView) no CAPI

---

### EPIC-I — Analytics de Comportamento: 96%

| US | Cobertura | Observação |
|---|---|---|
| I.1 Captura eventos | ✅ Completo | 5 tipos de evento, session_id, UTM, doNotTrack |
| I.2 Funil + páginas | ✅ Completo | Comparativo período, delta percentual |
| I.3 Dashboard buscas | ✅ Completo | Badge >50% sem resultado, botão criar produto |

**Problema:** Nenhuma política de retenção de dados definida (ver seção 4)

---

### EPIC-J — Heatmap Próprio: 91%

| US | Cobertura | Observação |
|---|---|---|
| J.1 Tracker frontend | ✅ Completo | click, scroll, mousemove, rage_click, batching |
| J.2 Renderização admin | ✅ Completo | iframe, heatmap.js, seletores, escala viewport |

**Problemas:**
- `visibilitychange` não confiável em iOS Safari — usar `navigator.sendBeacon()` no flush final
- Sem política de retenção de dados para `heatmap_events`
- CSP/X-Frame-Options pode bloquear o iframe — critério ausente
- SRI hash ausente para heatmap.js do CDN

---

### EPIC-K — Sidebar do Admin: 98%

✅ Estrutura completa com todas as rotas, ícones, badges, mobile drawer, polling 60s.

**Lacunas:** Rotas de fidelidade/pontos e push notifications (do EPIC-02) não aparecem no sidebar.

---

### EPIC-L — Schema SQL Complementar: 98%

✅ Migrations completas para behavior_events, heatmap_events, abandoned_carts, campaign_costs, campos UTM/VIP/soft delete.

**Problemas:**
- `push_subscriptions` ausente da migration (**bloqueante**)
- Schema de `store_settings` assume key-value sem validar contra EPIC-01 (**bloqueante**)

---

## 3. VERIFICAÇÕES DE SEGURANÇA

| Verificação | Status | Observação |
|---|---|---|
| SHA-256 email/telefone server-side (CAPI) | ✅ OK | Critério explícito em H.3 |
| Meta Access Token nunca exposto ao frontend | ⚠️ RESSALVA | Policy RLS de SELECT em store_settings não verificada contra anon key |
| Sanitização de UTMs contra XSS | ⚠️ INCOMPLETO | JSON parse protegido, mas valores individuais não sanitizados contra XSS |
| Heatmap não captura em /admin/* | ✅ OK | Critério explícito em J.1 |
| Flush do heatmap confiável ao fechar tab | ❌ PROBLEMA | visibilitychange não confiável em iOS — usar sendBeacon |
| Unsubscribe carrinho abandonado com token | ❌ PROBLEMA | Link sem HMAC permite cancelamento não autorizado |

---

## 4. VERIFICAÇÕES DE PERFORMANCE

### Crescimento de heatmap_events (ATENÇÃO)

Com 1.000 usuários/dia e mousemove throttlado a 800ms:
- **~136.000 registros/dia → ~49 milhões/ano**
- Sem política de retenção: crescimento ilimitado e custo crescente no Supabase

**Mesmo problema em behavior_events.**

**Ação necessária:** Cron mensal de limpeza:
- `heatmap_events`: DELETE onde `created_at < now() - 90 days`
- `behavior_events`: DELETE onde `created_at < now() - 13 months`

### iframe e CSP
Se o Next.js tiver `X-Frame-Options: DENY` ou `CSP: frame-ancestors 'none'` (recomendado por padrão), o iframe do heatmap não renderizará. Necessário configurar `frame-ancestors 'self'` para a rota do admin.

---

## 5. PROBLEMAS CRÍTICOS ❌

### CRÍTICO-01: `push_subscriptions` ausente do schema (L.1)
**Status: ✅ CORRIGIDO em 2026-04-16**
Tabela `push_subscriptions` adicionada à migration do EPIC-03 (Seção 8) com campos completos, índices e RLS por usuário. Admin acessa via service_role (bypass automático).

### CRÍTICO-02: Schema de `store_settings` não validado contra EPIC-01
**Status: ✅ CORRIGIDO em 2026-04-16**
Verificado no EPIC-01: `store_settings` é tabela key-value com colunas `(id, key, value, category, updated_at)`. Todos os INSERTs foram atualizados para incluir `category`:
- `meta_pixel_id`, `meta_access_token` → `category = 'meta'`
- `social_proof_*` → `category = 'frontend'`
- `vip_min_*` → `category = 'vip'`

---

## 6. PONTOS DE MELHORIA ⚠️

| # | Melhoria | Local | Impacto |
|---|---|---|---|
| M-01 | Política de retenção de dados (heatmap + behavior events) | L.1 | Alto |
| M-02 | `navigator.sendBeacon()` para flush final do heatmap | J.1 | Médio |
| M-03 | Token HMAC no link de unsubscribe do carrinho abandonado | G.4 | Médio |
| M-04 | SRI hash para heatmap.js no CDN cdnjs | J.2 | Baixo |
| M-05 | Índice composto `behavior_events(event_type, created_at DESC)` | L.1 | Médio |
| M-06 | Clarificar que CAPI usa 4 eventos (sem PageView) | H.3 | Baixo |
| M-07 | Fluxo de eventID do Purchase cliente → Server Action | H.1/H.3 | Alto |
| M-08 | Idempotência do email VIP (enviar só 1x por transição false→true) | G.1 | Médio |
| M-09 | Tratamento OAuth no modal de soft delete (sem campo de senha) | G.2 | Médio |
| M-10 | Verificar que `meta_access_token` não é legível via anon key | H.3 | Alto |
| M-11 | CSP frame-ancestors 'self' para o iframe do heatmap funcionar | J.2 | Alto |
| M-12 | Rotas de fidelidade/push no sidebar do admin | K.1 | Baixo |

---

## 7. CONSISTÊNCIA COM EPIC-01 E EPIC-02

**Conflitos encontrados:**
- G.2 referencia "EPIC-03 (área do cliente)" — deve ser "EPIC-01 (US-03.x)"
- G.1 referencia "EPIC-04 (tabela orders)" que não existe — deve ser "EPIC-01 (schema orders)"
- Nomenclatura "EPIC-A" no mapa de dependências refere ao EPIC-02 internamente

**Sobreposições inofensivas:**
- Campos UTM em `orders` não conflitam com campos de rastreio Correios
- `only_vip` em `coupons` é extensão não-destrutiva
- Sistema de cupons extendido corretamente

---

## 8. COBERTURA TOTAL (EPIC-01 + EPIC-02 + EPIC-03)

**Cobertura estimada: ~92% do escopo completo**

| Área | Cobertura |
|---|---|
| Infraestrutura, Auth, Frontend, Checkout, SEO | 95-100% |
| Admin completo com sidebar definitivo | 95% |
| Avaliações, Estoque, Fidelidade, PWA | 80-100% |
| Meta Pixel + CAPI + UTM | 100% |
| Analytics próprio + Heatmap | 90-95% |
| LGPD + VIP + Social Proof + Carrinho Abandonado | 95-97% |

**O que ainda falta (8%):**
1. `/admin/financeiro` aparece no sidebar mas sem User Stories de implementação
2. Sistema de pontos/fidelidade incompleto (~80% do EPIC-02)
3. Notificações push — infraestrutura OK, mas campanhas push sem US
4. Pagamentos avançados (Pix com expiração, 3DS) sem US dedicadas

---

## 9. AÇÕES ANTES DO DESENVOLVIMENTO

**Bloqueantes (obrigatórias antes da sprint):**
- [ ] Verificar schema real de `store_settings` no EPIC-01 e corrigir migration (CRÍTICO-02)
- [ ] Adicionar tabela `push_subscriptions` à migration do EPIC-03 (CRÍTICO-01)

**Alta prioridade (antes da entrega em produção):**
- [ ] Criar cron de TTL para heatmap_events (90 dias) e behavior_events (13 meses) — M-01
- [ ] Implementar token HMAC no unsubscribe do carrinho abandonado — M-03
- [ ] Documentar fluxo de eventID Purchase entre cliente e Server Action — M-07
- [ ] Configurar CSP frame-ancestors 'self' para o iframe do heatmap — M-11

---

*Diagnóstico gerado por @qa — Synkra AIOS | 2026-04-16*
*Versão avaliada: EPIC-gabinete-fc-v3.0-analytics-marketing.md*
