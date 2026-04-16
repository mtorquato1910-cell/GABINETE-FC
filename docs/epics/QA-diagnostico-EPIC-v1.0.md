# DIAGNÓSTICO DE QA - EPIC Gabinete FC v1.0

**Agente:** @qa (Quality Assurance) - Synkra AIOS
**Data da Avaliação:** 2026-04-16
**Artefato Avaliado:** `docs/epics/EPIC-gabinete-fc-v1.0.md`
**Status Final:** ⚠️ APROVADO COM RESSALVAS

---

## 1. PONTUAÇÃO GERAL

**Nota: 8.2 / 10**

**Justificativa:** O EPIC é um documento de excelente nível técnico. A estrutura é consistente, as User Stories seguem o padrão correto, os critérios de aceitação são majoritariamente testáveis e as notas técnicas demonstram domínio da stack. A cobertura do PRD é alta (~87%). As ressalvas dizem respeito a: ausência de tabela crítica no schema (`order_history`), gaps em edge cases de negócio (parcelamento com 3+ camisas mal especificado), valores de cupom de avaliação deixados como `[A_CONFIGURAR]` sem critério mínimo, inconsistência no mapa de dependências, e ausência de stories para gestão de estoque físico especificada no PRD.

---

## 2. COBERTURA DO PRD (por seção)

| Seção PRD | Status | Observação |
|---|---|---|
| E-commerce dropshipping / Fornecedor JIN | ✅ Coberto | Sumário executivo correto |
| Stack Tecnológica | ✅ Coberto | Todas as tecnologias presentes |
| Páginas Públicas (Home, Catálogo, PDP, etc.) | ✅ Coberto | US-02.2 a US-02.8 |
| Área do Cliente | ✅ Coberto | US-03.1 a US-03.8 |
| Páginas Institucionais | ✅ Coberto | US-02.8 lista todas as 12 páginas |
| Bot de Suporte | ✅ Coberto | US-05.4 completo |
| Painel Admin | ⚠️ Parcial | **FALTA: Gestão de Estoque Físico** |
| Banco de Dados Supabase | ⚠️ Parcial | Campos e tabela ausentes no schema |
| Integrações | ✅ Coberto | Stripe, Correios, Claude, Resend OK |
| Regras de Negócio | ⚠️ Parcial | Contagem "3+ camisas" não especificada |
| SEO/Performance | ✅ Coberto | US-07.1, 07.2, 07.3 completos |
| Roadmap Fases | ✅ Coberto | MVP, Fase 2, Fase 3 corretos |

---

## 3. QUALIDADE DAS USER STORIES

### Estrutura "Como / Quero / Para"
**Status: BOM** — 100% das User Stories seguem a estrutura correta. Exceção: US-05.3 não tem abertura "Como/Quero/Para" — quebra consistência mas não é bloqueante.

### Critérios de Aceitação — Testabilidade
**Status: MUITO BOM**

Exemplos de bons critérios:
- "Paginação (10 pedidos por página)" ✅
- "Debounce de 300ms nas sugestões" ✅
- "LCP < 2.5 segundos" ✅
- "Uma avaliação por produto por usuário" ✅

**Critérios problemáticos:**
1. US-03.8: cupom de avaliação tem `[A_CONFIGURAR]%` — não testável
2. US-06.5: indicador VIP com `[A_CONFIGURAR]` — não testável
3. US-06.3: transições válidas de status não especificadas
4. US-04.4: timeout do polling de Pix não definido
5. US-02.2: "banner de urgência" — critério ambíguo com "ex:"

---

## 4. PROBLEMAS CRÍTICOS ❌
*(DEVEM ser corrigidos antes do desenvolvimento começar)*

### CRÍTICO-01: Tabela `order_history` ausente do schema
- **Local:** US-01.2 x US-06.3
- **Problema:** Mencionada nas notas técnicas de US-06.3 mas não criada em US-01.2. Causará erro de dependência entre EPICs.
- **Correção:** Adicionar ao schema de US-01.2 com campos: `order_id, admin_user_id, action, from_status, to_status, note, created_at`

### CRÍTICO-02: Campos ausentes no schema de `products` e `orders`
- **Local:** US-01.2 x US-02.2, US-05.2
- **Campos ausentes:**
  - `is_featured` em `products` (mencionado em US-02.2)
  - `tracking_events_json` em `orders` (mencionado em US-05.2)
  - `tracking_updated_at` em `orders` (mencionado em US-03.4)
- **Correção:** Adicionar ao schema formal em US-01.2

### CRÍTICO-03: Módulo de Gestão de Estoque Físico ausente
- **Local:** PRD item 7 x EPIC inteiro
- **Problema:** PRD especifica gestão de estoque físico (entrada/saída, alertas de mínimo) como módulo do admin. O EPIC não tem nenhuma US dedicada.
- **Correção:** Criar **US-06.10** com: controle de quantidade por SKU (produto + tamanho), histórico de entrada/saída, alertas de estoque mínimo configurável.

### CRÍTICO-04: Valores `[A_CONFIGURAR]` em critérios de aceitação
- **Local:** US-03.8
- **Problema:** Os percentuais do cupom de avaliação estão como `[A_CONFIGURAR]` dentro dos critérios. Não é testável e o dev não tem como implementar corretamente.
- **Correção:** Definir ao menos um range (ex: "cupom com foto: entre 5-15%; cupom sem foto: entre 2-8%"). Valores exatos configuráveis no admin.

### CRÍTICO-05: Regra "3+ camisas" sem critério de contagem
- **Local:** US-04.3
- **Problema:** Não especifica como contar. 3 unidades do mesmo produto? 3 produtos diferentes? Tamanhos diferentes contam separado?
- **Correção:** Adicionar: "A contagem de 3+ camisas é baseada na **soma do campo `quantity`** de todos os `order_items` do carrinho".

### CRÍTICO-06: Bug de segurança — `user_metadata` vs `app_metadata`
- **Local:** US-01.2 e US-06.1
- **Problema:** US-06.1 verifica `user.app_metadata.role === 'admin'` mas US-01.2 define o role em `user_metadata` (que pode ser alterado pelo próprio usuário). Isso é uma vulnerabilidade de escalada de privilégios.
- **Correção:** O role de admin DEVE estar em `app_metadata` (setado apenas via service role key no servidor). Corrigir US-01.2 e garantir que o update é feito server-side.

### CRÍTICO-07: Mapa de dependências incorreto
- **Local:** Seção "Mapa de Dependências"
- **Problema:** Mapa mostra sequência linear impossibilitando paralelismo. EPIC-02 e EPIC-03 podem rodar em paralelo após EPIC-01.
- **Correção:** Atualizar para: EPIC-01 → [EPIC-02 || EPIC-03] → EPIC-04 → EPIC-05 → EPIC-06 → EPIC-07

---

## 5. PONTOS DE MELHORIA ⚠️
*(Não bloqueantes, mas recomendados)*

| # | Melhoria | Local |
|---|---|---|
| M-01 | US-05.3 sem abertura "Como/Quero/Para" | US-05.3 |
| M-02 | "Banner de urgência" com "ex:" torna critério ambíguo | US-02.2 |
| M-03 | Timeout do polling de Pix não especificado | US-04.4 |
| M-04 | Soft delete vs hard delete de conta (decisão LGPD pendente) | US-03.6 |
| M-05 | Carrinho sem tratamento de produto que fica indisponível | US-02.7 |
| M-06 | Conflito de conta Google OAuth vs email/senha sem critério | US-03.1 |
| M-07 | Email 7 (carrinho abandonado) marcado como Fase 2 dentro de story MVP | US-05.3 |
| M-08 | Placeholder /copa sem definição visual mínima | US-02.8 |
| M-09 | Histórico do bot entre navegações da mesma sessão não definido | US-05.4 |
| M-10 | Estimativas de sprint sem breakdown por US | Roadmap |

---

## 6. GAPS IDENTIFICADOS

| # | Gap | PRD Origem | Gravidade |
|---|---|---|---|
| G-01 | Gestão de Estoque Físico (entrada/saída, alertas) | PRD item 7 | 🔴 CRÍTICO |
| G-02 | Campos ausentes no schema: `is_featured`, `tracking_events_json`, `tracking_updated_at` | PRD item 8 | 🔴 CRÍTICO |
| G-03 | Tabela `order_history` ausente do schema formal | PRD item 8 | 🔴 CRÍTICO |
| G-04 | Critério de contagem "3+ camisas" para parcelamento | PRD item 10 | 🔴 CRÍTICO |
| G-05 | Valores dos cupons de avaliação não definidos | PRD item 10 | 🔴 CRÍTICO |
| G-06 | Bug de segurança: role admin em user_metadata (deve ser app_metadata) | PRD item 7 | 🔴 CRÍTICO |
| G-07 | Conflito de conta Google OAuth vs email/senha | PRD item 4 | 🟡 MÉDIO |
| G-08 | Comportamento do carrinho com produto indisponível no checkout | PRD item 3/10 | 🟡 MÉDIO |
| G-09 | Timeout do polling de Pix | PRD item 9 | 🟡 MÉDIO |
| G-10 | Definição de soft delete vs hard delete (LGPD) | PRD item 4 | 🟡 MÉDIO |
| G-11 | Máquina de estados de transições válidas de pedido | PRD item 7 | 🟡 MÉDIO |
| G-12 | Histórico do bot entre navegações da mesma sessão | PRD item 6 | 🟢 BAIXO |
| G-13 | Critério visual mínimo para placeholder /copa | PRD item 5 | 🟢 BAIXO |

---

## 7. CONSISTÊNCIA TÉCNICA

**Status: EXCELENTE ✅**

| Item | Verificação | Resultado |
|---|---|---|
| Next.js 14 App Router | `create-next-app` com App Router obrigatório | ✅ CORRETO |
| Supabase SSR | Usa `@supabase/ssr` (não o deprecated `@supabase/auth-helpers`) | ✅ CORRETO |
| Stripe Payment Intent | Criado no servidor, `clientSecret` no cliente | ✅ CORRETO |
| Webhook Stripe com idempotência | Armazena `stripe_event_id` | ✅ CORRETO |
| Vercel Cron Job sintaxe | `0 */4 * * *` | ✅ CORRETO |
| React Email para templates | `react-email` | ✅ CORRETO |
| Claude streaming | `anthropic.messages.stream()` com `ReadableStream` | ✅ CORRETO |
| RLS no Supabase | Policies por role especificadas | ✅ CORRETO |
| ISR values | Home 3600s, produtos 1800s, sitemap 86400s | ✅ CORRETO |
| Supabase gen types | `supabase gen types typescript` | ✅ CORRETO |
| **role admin** | `user_metadata` usado mas deveria ser `app_metadata` | ❌ BUG SEGURANÇA |

---

## 8. RECOMENDAÇÕES FINAIS

### Decisão: **REVISAR PARCIALMENTE** (não reescrever)

O EPIC não precisa ser reescrito. A base é sólida. Estimativa de 2-4 horas de ajustes.

**Ações obrigatórias (@pm deve executar):**

- [ ] Corrigir schema em US-01.2: adicionar campos faltantes e tabela `order_history`
- [ ] Criar US-06.10 — Gestão de Estoque Físico
- [ ] Definir valores dos cupons de avaliação em US-03.8 (substituir `[A_CONFIGURAR]`)
- [ ] Especificar critério de contagem "3+ camisas" em US-04.3
- [ ] Corrigir bug de segurança: `app_metadata` vs `user_metadata` em US-01.2 e US-06.1
- [ ] Corrigir mapa de dependências para refletir paralelismo correto

**Ações recomendadas (alta prioridade):**

- [ ] Adicionar critério de conflito de conta OAuth em US-03.1
- [ ] Adicionar critério de produto indisponível no carrinho em US-02.7
- [ ] Definir timeout do polling de Pix em US-04.4
- [ ] Definir máquina de estados de pedido em US-06.3
- [ ] Padronizar US-05.3 com abertura "Como/Quero/Para"

---

*Diagnóstico gerado por @qa — Synkra AIOS | 2026-04-16*
*Versão avaliada: EPIC-gabinete-fc-v1.0.md*
