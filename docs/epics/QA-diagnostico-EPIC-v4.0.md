# DIAGNÓSTICO QA — EPIC-04: Financeiro, Fidelidade Completa e Leads Meta

**Agente:** @qa (Quality Assurance) — Synkra AIOS
**Data:** 2026-04-16
**Artefato:** `docs/epics/EPIC-gabinete-fc-v4.0-financeiro-fidelidade-leads.md`
**Status Final:** ✅ APROVADO — bloqueantes corrigidos em 2026-04-16

---

## 1. PONTUAÇÃO GERAL

**Nota: 8.4 / 10**

O documento é bem estruturado, cobre 100% do escopo remanescente identificado no QA-03 e contém critérios de aceitação testáveis com notas técnicas de qualidade. Entretanto, foram identificados **3 problemas de segurança sérios** (2 bloqueantes), **1 problema crítico de lógica no funil de leads**, e múltiplas preocupações de performance com crescimento de tabelas sem política de TTL. O schema SQL (EPIC-Q) é robusto, mas a função `get_meta_leads_funnel` tem uma falha de lógica SQL que produziria contagens infladas — precisa de correção antes da sprint.

---

## 2. COBERTURA DOS MÓDULOS

### EPIC-M — Dashboard Financeiro: 95%

| US | Cobertura | Observação |
|---|---|---|
| M.1 Visão Geral de Receita | ✅ Completo | Filtros, cards, gráficos, delta percentual, revalidação 300s |
| M.2 Breakdown por Método e Status | ✅ Completo | Pizza/donut, funil de pedidos, taxas calculadas |
| M.3 Performance de Produtos | ✅ Completo | Top 20, categorias, CSV export, "sem venda" |
| M.4 Lucratividade + Exportação | ✅ Completo | PDF, CSV, custo histórico, aviso de estimativa |

**Edge cases ausentes:**
- M.1: Período "Personalizado" sem validação máxima — query de 5 anos de dados pode derrubar a função `get_financial_summary` por timeout
- M.2: Taxa de conversão checkout usa divisor `paid + pending + cancelled` — pedidos `processing`, `shipped`, `delivered` excluídos do denominador sem justificativa
- M.3: Exportação CSV via Server Action retorna `Response` com `Content-Disposition` — conflito com paradigma de Server Actions do Next.js 14 (Server Actions não retornam `Response` diretamente; deve ser Route Handler)
- M.4: Campo `cost_brl` em `products` é `NULL` por padrão — cálculo de lucratividade com produtos sem custo cadastrado produz resultado silenciosamente incorreto (margem inflada)

---

### EPIC-N — Programa de Fidelidade Completo: 92%

| US | Cobertura | Observação |
|---|---|---|
| N.1 Expiração de Pontos | ✅ Completo | Cron mensal, email 30d antes, idempotência via log |
| N.2 Campanhas de Pontos Duplos | ✅ Completo | Multiplicadores, sobreposição com maior wins, badge PDP |
| N.3 Gestão Manual + Dashboard | ✅ Completo | Ajuste admin, log auditoria, métricas, top 20 |

**Edge cases ausentes:**
- N.1: Email de aviso 30 dias antes da expiração precisa de cron separado ou subconsulta no cron mensal — não documentado como será disparado (cron mensal não verifica "em 30 dias", verifica "já expirou")
- N.1: Usuário sem nenhuma compra (saldo de pontos por bônus de cadastro) — "última compra" retornaria NULL, causando expiração imediata na primeira execução do cron
- N.2: `loyalty_campaigns.multiplier` usa `CHECK (multiplier IN (1.0, 1.5, 2.0, 3.0))` — valor `1.0` como multiplicador ativo é inócuo mas pode confundir; ausência de validação de sobreposição de datas no servidor
- N.3: `adjusted_by_admin_id` referencia `auth.users(id)` mas o campo em `loyalty_points` vem do EPIC-F — depende de ALTER TABLE não-destrutivo (OK), mas sem índice para auditoria

---

### EPIC-O — Campanhas de Push Notification: 88%

| US | Cobertura | Observação |
|---|---|---|
| O.1 Criação e Envio de Campanhas | ✅ Completo | Segmentos, agendamento, batches 500, rate limiting |
| O.2 Performance e Análise | ✅ Completo | UTM automático, fail_count, taxa de clique via behavior_events |

**Edge cases ausentes:**
- O.1: Envio imediato de campanha grande (ex: 50.000 assinantes = 100 batches de 500) em Server Action — timeout do Vercel (máximo 60s em hobby / 300s em pro) não é endereçado; envio deveria ser assíncrono ou via job queue
- O.1: Rate limiting de 2 campanhas/dia — implementado via Server Action mas sem mecanismo de atomicidade (race condition possível entre duas requisições simultâneas)
- O.1: `destination_url` validado para começar com `/` mas não sanitizado contra injeção de protocolo (`javascript:` bloqueado, mas `//evil.com` passaria)
- O.2: `fail_count >= 3` remove endpoint de `push_subscriptions` — critério de aceitação diz "após 3 falhas consecutivas" mas schema só tem `fail_count` (acumulado, não consecutivo)

---

### EPIC-P — Leads & Indicadores de Aquisição Meta: 87%

| US | Cobertura | Observação |
|---|---|---|
| P.1 Dashboard de Leads Meta | ✅ Completo | Definição de lead, CPL, ROAS, gráficos |
| P.2 Funil por Campanha | ⚠️ PROBLEMA | Função SQL com falha de lógica — ver Seção 5 |
| P.3 Relatório Individual + Exportação | ✅ Completo | Timeline, privacidade, email mascarado, retenção 13m |

**Edge cases ausentes:**
- P.1: CPL e ROAS dependem de gasto manual inserido pelo admin — sem validação de que o período de gasto coincide com o filtro de período do dashboard (usuário pode comparar gasto de março com leads de abril)
- P.1: Definição de lead inclui `utm_medium = 'cpc'` sem restrição de `utm_source` — tráfego Google Ads com `utm_medium=cpc` seria contabilizado como lead Meta incorretamente
- P.3: Email mascarado `jo***@gmail.com` — implementação do mascaramento não especificada (quantos chars? sempre 2 chars visíveis?) — risco de inconsistência

---

### EPIC-R — Pagamentos Avançados: 91%

| US | Cobertura | Observação |
|---|---|---|
| R.1 Pix com Expiração Configurável | ✅ Completo | Admin config, cron 5min, cancelamento, webhook |
| R.2 3DS v2 para Alto Valor | ✅ Completo | Threshold configurável, modos automatic/always, webhook confirma |

**Edge cases ausentes:**
- R.1: Stripe Pix tem mínimo de `expires_after_seconds = 600` (10 min) — EPIC menciona isso na Nota Técnica, mas o campo `store_settings` aceita de 5 min (300s), criando discrepância silenciosa; o "clamp" deve ser explicitamente documentado no critério de aceitação, não apenas em nota técnica
- R.1: Cron de cancelamento Pix usa `created_at < now() - (pix_expiry_minutes || ' minutes')::interval` — lê `pix_expiry_minutes` de onde? Do `store_settings` a cada execução? Se o admin alterar o timeout de 30min para 60min, pedidos antigos com 31-59min pendentes serão cancelados ou não na próxima execução?
- R.2: 3DS falhar retorna `payment_intent = 'requires_payment_method'` — status do pedido na tabela `orders` não é especificado nesse cenário (permanece `pending`? vai para `failed`?)

---

### EPIC-Q — Schema SQL Complementar: 93%

| US | Cobertura | Observação |
|---|---|---|
| Q.1 Schema Financeiro | ✅ Completo | Função, índices, RLS product_cost_history |
| Q.2 Schema Fidelidade | ✅ Completo | loyalty_campaigns, expiry_log, audit fields |
| Q.3 Schema Push Campaigns | ✅ Completo | push_campaigns, fail_count, VAPID em store_settings |
| Q.4 Schema Leads Meta | ⚠️ PROBLEMA | Função get_meta_leads_funnel com falha de lógica |
| Q.5 Schema Pagamentos Avançados | ✅ Completo | three_ds_triggered, three_ds_status, pix_expiry_log |

**Problemas:**
- Q.3: `vapid_private_key` inserida em `store_settings` com `value = ''` vazio — em produção, chave privada VAPID real ficará em `store_settings` acessível via Supabase; ver Seção 3
- Q.4: Função `get_meta_leads_funnel` — falha de lógica SQL confirmada; ver Seção 5 (CRÍTICO-02)

---

## 3. VERIFICAÇÕES DE SEGURANÇA

| Verificação | Status | Observação |
|---|---|---|
| Verificação de assinatura webhook Stripe | ⚠️ AUSENTE | Nenhum critério de aceitação em R.1 ou R.2 menciona `stripe.webhooks.constructEvent()` — assumido do EPIC-01 mas não confirmado como requisito |
| RLS habilitada em todas as novas tabelas | ✅ OK | `product_cost_history`, `loyalty_campaigns`, `loyalty_expiry_log`, `push_campaigns`, `meta_ad_spend`, `pix_expiry_log` — todas com `ENABLE ROW LEVEL SECURITY` |
| VAPID private key protegida contra anon key | ❌ CRÍTICO | `vapid_private_key` inserida em `store_settings` — se a policy RLS de `store_settings` permite SELECT para `anon` (como é common em key-value de configurações públicas), a chave privada VAPID fica exposta; deve estar em variável de ambiente, NÃO no banco |
| Cron jobs protegidos com Bearer token | ✅ OK | R.1 menciona explicitamente `Authorization: Bearer {CRON_SECRET}` — padrão verificado |
| 3DS v2: confirmação via webhook (não frontend) | ✅ OK | R.2 especifica: "Verificar `payment_intent.status` via webhook antes de marcar como pago" — fluxo correto |
| Exposição de dados financeiros via anon key | ⚠️ RESSALVA | `get_financial_summary` e `get_meta_leads_funnel` são `SECURITY DEFINER` — qualquer usuário autenticado pode chamar a RPC; falta verificação de role `admin` dentro da função |
| Endpoint `/admin/*` protegido por autenticação | ✅ OK | Assumido do EPIC-01/EPIC-06; não é escopo deste EPIC mas dependência válida |
| `meta_ad_spend`: dados de gasto expostos | ✅ OK | Policy `admin_manage_ad_spend` restringe a admin + service_role |
| Ajuste manual de pontos: log de auditoria | ✅ OK | `adjusted_by_admin_id` + `admin_note` registrados em `loyalty_points` |
| Rate limiting de campanhas push | ⚠️ RESSALVA | Limitação de 2 campanhas/dia em Server Action sem atomicidade — race condition possível com requests simultâneos |
| `destination_url` de push sem sanitização completa | ⚠️ RESSALVA | Validação apenas para começar com `/` — `//` relativo (protocol-relative URL) não bloqueado |

---

## 4. VERIFICAÇÕES DE PERFORMANCE

### Crescimento das Tabelas Sem TTL

**`pix_expiry_log`**: cada Pix expirado gera 1 registro. Com 100 pedidos Pix/dia com expiração média de 30%, são ~30 registros/dia = ~10.950/ano. Volume gerenciável, mas sem política de limpeza.

**`loyalty_expiry_log`**: executa uma vez por mês, registra usuários com pontos expirados. Volume baixo (~N usuários inativos/mês). Sem TTL definido.

**`push_campaigns`**: 1 registro por campanha enviada. Limite de 2/dia = max 730/ano. Não é problema de volume.

**Problema real de crescimento: `behavior_events` (herdado do EPIC-03)**
- Identificado no QA-03 como risco de 49 milhões de registros/ano
- EPIC-04 adiciona 3 índices adicionais em `behavior_events` (utm_source, utm_campaign + session_id) — esses índices aumentam o custo de INSERT e o espaço em disco
- Política de TTL de 13 meses foi recomendada no QA-03 (M-01) mas não há evidência de implementação obrigatória

### Função `get_meta_leads_funnel` com Múltiplos LEFT JOINs

A função realiza 4 LEFT JOINs em `behavior_events` sobre o mesmo conjunto de sessões (`meta_sessions`):

```sql
LEFT JOIN behavior_events be_pv ON be_pv.session_id = ms.session_id AND be_pv.event_type = 'product_view'
LEFT JOIN behavior_events be_atc ON be_atc.session_id = ms.session_id AND be_atc.event_type = 'add_to_cart'
LEFT JOIN behavior_events be_cs ON be_cs.session_id = ms.session_id AND be_cs.event_type = 'checkout_started'
LEFT JOIN orders o ON o.utm_campaign = ms.utm_campaign ...
```

Com 1 milhão de registros em `behavior_events` e filtro de 30 dias:
- O CTE `meta_sessions` pode retornar dezenas de milhares de sessões
- Cada LEFT JOIN percorre novamente a tabela inteira filtrada por `event_type`
- **Estimativa**: com índice em `(session_id, event_type)` a query é O(N log N); sem ele, O(N²)

**O índice `idx_behavior_events_utm_source ON behavior_events(utm_source)` foi criado (Q.4.2), mas NÃO há índice em `(session_id, event_type)` que é a condição dos JOINs.** Esse índice é crítico para performance da função.

### Cron Jobs Simultâneos a Cada 5 Minutos

O EPIC-04 adiciona um segundo cron de 5 minutos (`/api/cron/pix-expiry`) ao projeto. O EPIC-03 já tem o cron de campanhas push agendadas também a cada 5 minutos (`/api/cron/push-scheduler`). Na Vercel, crons simultâneos disputam instâncias serverless. Se `pix-expiry` for lento (muitos pedidos expirados), pode bloquear instâncias disponíveis para o `push-scheduler`. Recomendado usar schedules intercalados (`*/5 * * * *` vs `2-57/5 * * * *`).

### Query de Lucratividade (M.4)

`SUM(order_items.quantity * product_costs.cost_brl)` — se `cost_brl` for NULL para alguns produtos, o `SUM` retornará NULL para todo o pedido, não apenas para os itens sem custo. Necessário `COALESCE(product_costs.cost_brl, 0)` com aviso explícito ao usuário sobre produtos sem custo.

---

## 5. PROBLEMAS CRÍTICOS ❌

### CRÍTICO-01: VAPID Private Key Armazenada no Banco de Dados
**Status: ✅ CORRIGIDO em 2026-04-16**
`vapid_private_key` removida de `store_settings`. Apenas `vapid_public_key` permanece no banco. `VAPID_PRIVATE_KEY` deve ser armazenada como variável de ambiente no Vercel Secrets / `.env.local`. Nota técnica e comentário SQL adicionados ao EPIC-04.

<!-- original -->

**Localização:** US-Q.3, linha:
```sql
INSERT INTO store_settings (key, value, category) VALUES
  ('vapid_private_key', '', 'push') ON CONFLICT (key) DO NOTHING;
```

**Problema:** A VAPID private key é uma credencial criptográfica usada para assinar notificações push. Armazená-la em `store_settings` (banco de dados Supabase) a expõe a:
1. Qualquer vazamento de backup do banco
2. Qualquer falha de RLS em `store_settings` (tabela usada por múltiplos contextos)
3. Logs de queries do Supabase

**Solução correta:** Armazenar `VAPID_PRIVATE_KEY` como variável de ambiente no servidor (`.env` / Vercel Secrets). Apenas a `vapid_public_key` (pública por definição) pode ficar em `store_settings` para ser lida pelo frontend.

**Impacto:** BLOQUEANTE — não pode ir para produção com chave privada no banco.

---

### CRÍTICO-02: Falha de Lógica SQL em `get_meta_leads_funnel`
**Status: ✅ CORRIGIDO em 2026-04-16**
Função reescrita com CTEs independentes por etapa do funil — sem produto cartesiano. Receita calculada via CTE `rev` separado sem JOIN em `behavior_events`. Verificação de role `admin` adicionada internamente. Índice `(session_id, event_type)` adicionado em Q.4.6.

<!-- original -->

**Localização:** US-Q.4, função `get_meta_leads_funnel`

**Problema:** A função usa múltiplos LEFT JOINs em `behavior_events` sem agregação adequada, produzindo um produto cartesiano implícito que inflará os contadores:

```sql
-- PROBLEMA: cada sessão com múltiplos product_views gera múltiplas linhas antes do COUNT
LEFT JOIN behavior_events be_pv ON be_pv.session_id = ms.session_id AND be_pv.event_type = 'product_view'
LEFT JOIN behavior_events be_atc ON be_atc.session_id = ms.session_id AND be_atc.event_type = 'add_to_cart'
```

Se uma sessão tem 3 `product_view` e 2 `add_to_cart`, o JOIN gera 6 linhas (3×2) antes do `COUNT(DISTINCT)`. O `COUNT(DISTINCT session_id)` corrige o problema nas colunas de contagem de sessões, **mas a coluna `revenue` usa `SUM(o.total)` sem DISTINCT**, multiplicando a receita pelo número de combinações do produto cartesiano.

**Resultado:** Dashboard de leads mostrará receita inflada (potencialmente 3-6x o valor real).

**Solução:** Reestruturar usando subqueries independentes por etapa ou `COUNT(DISTINCT)` consistente com `SUM` agregado via subquery:

```sql
-- Correto: cada etapa como subquery independente
WITH meta_sessions AS (...),
pv_counts AS (SELECT session_id, COUNT(*) > 0 as has_pv FROM behavior_events WHERE event_type = 'product_view' GROUP BY session_id),
revenue_per_campaign AS (SELECT utm_campaign, SUM(total) as rev FROM orders WHERE payment_status = 'paid' ... GROUP BY utm_campaign)
SELECT ms.utm_campaign, COUNT(DISTINCT ms.session_id), ..., r.rev
FROM meta_sessions ms
LEFT JOIN pv_counts pvc ON pvc.session_id = ms.session_id
LEFT JOIN revenue_per_campaign r ON r.utm_campaign = ms.utm_campaign
GROUP BY ms.utm_campaign, r.rev;
```

**Impacto:** BLOQUEANTE — dados financeiros incorretos em produção são inaceitáveis.

---

### CRÍTICO-03: Verificação de Assinatura do Webhook Stripe Não Documentada
**Status: ✅ CORRIGIDO em 2026-04-16**
Critérios explícitos adicionados em US-R.1 ([Webhook Stripe — R.1]) e US-R.2: `constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET)`, retorno 400 se inválida, uso de `request.text()` para preservar rawBody. Status do pedido quando 3DS falha também documentado (`payment_status = 'pending'`).

<!-- original -->

**Localização:** US-R.1 e US-R.2 (webhooks `payment_intent.canceled` e `payment_intent.succeeded`)

**Problema:** Nenhum critério de aceitação dos novos webhooks menciona a verificação de assinatura HMAC via `stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)`. Embora assumido do EPIC-01, os novos endpoints de webhook devem ter este critério explícito para garantir que novos desenvolvedores não criem handlers sem verificação.

**Impacto:** BLOQUEANTE se o EPIC-01 não implementou os handlers de forma reutilizável — endpoints de webhook sem verificação de assinatura permitem que qualquer atacante dispare cancelamentos de pedidos ou confirmações falsas de pagamento.

**Ação:** Adicionar critério explícito: "Webhook handler verifica assinatura Stripe via `constructEvent()` antes de processar qualquer evento — retorna 400 se inválida."

---

## 6. PONTOS DE MELHORIA ⚠️

| # | Melhoria | Local | Impacto |
|---|---|---|---|
| M-01 | Adicionar índice `behavior_events(session_id, event_type)` para performance da função de funil | Q.4 | Alto |
| M-02 | Restringir execução de RPCs financeiras a role `admin` dentro da função SECURITY DEFINER | Q.1, Q.4 | Alto |
| M-03 | CSV export do M.3/M.4 deve usar Route Handler (`app/api/`) em vez de Server Action | M.3, M.4 | Alto |
| M-04 | Email de aviso de expiração 30 dias antes precisa de cron separado ou subconsulta no cron mensal | N.1 | Médio |
| M-05 | Tratar usuário sem histórico de compras no cron de expiração (última compra = NULL → não expirar) | N.1 | Médio |
| M-06 | Definição de lead (P.1) inclui `utm_medium = 'cpc'` sem restrição de `utm_source` — Google Ads contaminaria dados Meta | P.1 | Médio |
| M-07 | COALESCE no cálculo de lucratividade para produtos sem custo cadastrado + aviso explícito no UI | M.4 | Médio |
| M-08 | Período "Personalizado" no dashboard financeiro deve ter limite máximo (ex: 12 meses) para evitar timeout | M.1 | Médio |
| M-09 | `destination_url` de push deve bloquear URLs protocol-relative (`//`) além de verificar início com `/` | O.1 | Médio |
| M-10 | Rate limiting de campanhas push deve usar transação atômica ou verificação com lock (evitar race condition) | O.1 | Médio |
| M-11 | Envio de campanhas push grandes (>5.000 assinantes) deve ser assíncrono — Server Action tem timeout Vercel | O.1 | Alto |
| M-12 | `fail_count` em `push_subscriptions` é acumulado — renomear para `consecutive_fail_count` e resetar em envio bem-sucedido | O.2, Q.3 | Baixo |
| M-13 | Documentar comportamento do cron pix-expiry quando admin altera `pix_expiry_minutes` mid-day | R.1 | Baixo |
| M-14 | Status do pedido quando 3DS falha deve ser explicitamente definido no critério de aceitação | R.2 | Médio |
| M-15 | Intercalar schedules dos crons de 5 min para evitar disputa de instâncias Vercel | R.1, O.1 | Baixo |
| M-16 | Política de TTL para `pix_expiry_log` e `loyalty_expiry_log` (sem TTL, crescimento ilimitado) | Q.5, Q.2 | Baixo |
| M-17 | `loyalty_campaigns` sem índice em `(starts_at, ends_at)` para consulta no checkout — índice existente só filtra `is_active = true` | Q.2 | Baixo |

---

## 7. CONSISTÊNCIA COM EPICS ANTERIORES

### Campos Adicionados em `orders` vs Schema EPIC-01

O EPIC-01 (US-01.2) define a tabela `orders` com as colunas:
```
id, user_id, status, total, subtotal, freight_cost, coupon_id,
payment_method, payment_status, stripe_payment_intent_id,
tracking_code, carrier, notes, created_at, updated_at
```

O EPIC-04 adiciona via `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`:
- `payment_method varchar(20)` — **CONFLITO**: `payment_method` já existe no EPIC-01 como campo da tabela `orders`. O EPIC-04 tenta criar o campo novamente com `ADD COLUMN IF NOT EXISTS` e adiciona um `CHECK (payment_method IN ('credit', 'debit', 'pix'))`. Se o campo já existe sem a constraint, a migration deve usar `ALTER COLUMN ... ADD CONSTRAINT` — `ADD COLUMN IF NOT EXISTS` com `CHECK` só adiciona a constraint se a coluna for criada; se a coluna já existe, a constraint NÃO será adicionada silenciosamente.
- `three_ds_triggered boolean DEFAULT false` — campo novo, não-destrutivo ✅
- `three_ds_status varchar(20)` — campo novo, não-destrutivo ✅

**Ação obrigatória:** Verificar se `payment_method` em `orders` já tem `CHECK constraint` do EPIC-01. Se não, adicionar via `ALTER TABLE orders ADD CONSTRAINT chk_payment_method CHECK (payment_method IN ('credit', 'debit', 'pix'))` separadamente.

**Campos UTM em `orders` (EPIC-03/EPIC-H.2):** EPIC-04 referencia `orders.utm_source`, `orders.utm_campaign` — esses campos foram adicionados no EPIC-03 (EPIC-L). Dependência correta documentada. ✅

### `store_settings` key-value: Verificação de `category`

Todos os novos campos em `store_settings` no EPIC-04:

| Key | Category | Status |
|---|---|---|
| `loyalty_expiry_months` | `'loyalty'` | ✅ Correto |
| `pix_expiry_minutes` | `'payments'` | ✅ Correto |
| `stripe_3ds_enabled` | `'payments'` | ✅ Correto |
| `stripe_3ds_threshold_brl` | `'payments'` | ✅ Correto |
| `stripe_3ds_mode` | `'payments'` | ✅ Correto |
| `vapid_public_key` | `'push'` | ✅ Correto (mas deve ficar aqui) |
| `vapid_private_key` | `'push'` | ❌ CRÍTICO — deve ser variável de ambiente |

Schema `store_settings` verificado contra EPIC-01 (US-01.2): `(id, key, value, category, updated_at)` — todos os INSERTs estão corretos. ✅

### Tabela `loyalty_points` — Campos Adicionados

```sql
ALTER TABLE loyalty_points
  ADD COLUMN IF NOT EXISTS adjusted_by_admin_id uuid REFERENCES auth.users(id) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS admin_note text DEFAULT NULL;
```

- Ambos os campos são `DEFAULT NULL` — não-destrutivos, não quebram registros existentes ✅
- `adjusted_by_admin_id` referencia `auth.users(id)` — correto para Supabase Auth ✅
- Tabela `loyalty_points` criada no EPIC-F (EPIC-02) com schema `(id, user_id, points, reason, order_id, created_at)` — extensão compatível ✅

### Referências de Dependência

- EPIC-04 referencia "EPIC-04 (Stripe Pix integration)" como dependência de EPIC-R.1 — autorreferência incorreta; deve ser "EPIC-01/EPIC-04 (checkout e pagamentos)" do EPIC-01 original
- EPIC-Q.2 referencia `users(id)` na `loyalty_expiry_log` — tabela correta conforme EPIC-01 ✅
- EPIC-Q.4 adiciona índices em `behavior_events` e `orders` — tabelas criadas no EPIC-03 e EPIC-01 respectivamente ✅

---

## 8. AÇÕES ANTES DO DESENVOLVIMENTO

### Bloqueantes (obrigatórias antes da sprint)

- [x] **CRÍTICO-01**: Remover `vapid_private_key` de `store_settings` — **RESOLVIDO 2026-04-16**
- [x] **CRÍTICO-02**: Corrigir função `get_meta_leads_funnel` (produto cartesiano) — **RESOLVIDO 2026-04-16**
- [x] **CRÍTICO-03**: Critério de verificação de assinatura Stripe documentado em R.1 e R.2 — **RESOLVIDO 2026-04-16**
- [x] **Schema**: `payment_method` CHECK constraint corrigido com bloco `DO $$` para idempotência — **RESOLVIDO 2026-04-16**

### Alta Prioridade (antes da entrega em produção)

- [ ] Adicionar índice `behavior_events(session_id, event_type)` em Q.4 para viabilizar performance da função de funil em produção — M-01
- [ ] Restringir RPCs `get_financial_summary` e `get_meta_leads_funnel` a role `admin` dentro da função SECURITY DEFINER — M-02
- [ ] Substituir Server Action por Route Handler para exportação CSV nos módulos M.3 e M.4 — M-03
- [ ] Tratar `NULL` na busca de "última compra" no cron de expiração de pontos (N.1) para não expirar usuários sem histórico de compras — M-05
- [ ] Refinar definição de lead Meta para incluir `utm_source IN ('facebook', 'instagram', 'meta')` como condição obrigatória quando `utm_medium = 'cpc'` — M-06
- [ ] Implementar `COALESCE(cost_brl, 0)` no cálculo de lucratividade e exibir aviso no UI quando produtos sem custo estiverem no período — M-07
- [ ] Implementar envio assíncrono para campanhas push com mais de 5.000 assinantes (job queue ou Vercel Background Function) — M-11

---

*Diagnóstico gerado por @qa — Synkra AIOS | 2026-04-16*
*Versão avaliada: EPIC-gabinete-fc-v4.0-financeiro-fidelidade-leads.md*
*EPICs anteriores: QA-v1.0 (8.2/10) | QA-v2.0 (8.6/10) | QA-v3.0 (8.8/10)*
