# EPIC-04: Financeiro, Fidelidade Completa e Leads Meta — Gabinete FC

**Versão:** 1.0
**Data:** 2026-04-16
**Autor:** @pm (Product Manager) — Synkra AIOS
**Status:** Draft para Revisão
**Contexto:** Quarto documento do roadmap Gabinete FC. Cobre as lacunas remanescentes do escopo (~8% de cobertura faltante após EPIC-01, 02 e 03): Dashboard Financeiro completo, Programa de Fidelidade finalizado, Campanhas de Push Notification e — nova decisão de produto confirmada pelo PO — o módulo de Leads & Indicadores de Aquisição Meta com relatório de visitantes vindos de campanhas e seus indicadores de conversão.

---

## Índice de Sub-EPICs

| Sub-EPIC | Título | Fase | Prioridade |
|---|---|---|---|
| EPIC-M | Dashboard Financeiro `/admin/financeiro` | MVP + Fase 2 | Alta |
| EPIC-N | Programa de Fidelidade Completo | Fase 2 | Média |
| EPIC-O | Campanhas de Push Notification | Fase 2 | Média |
| EPIC-P | Leads & Indicadores de Aquisição Meta | MVP + Fase 2 | Alta |
| EPIC-R | Pagamentos Avançados (Pix Configurável + 3DS v2) | MVP + Fase 2 | Alta |
| EPIC-Q | Schema SQL Complementar do EPIC-04 | MVP | Crítica |

---

## Mapa de Dependências

```
EPIC-01 + EPIC-A (base schema)
        ↓
   EPIC-Q (schema — bloqueia tudo neste epic)
        ↓
[EPIC-M || EPIC-P.1 || EPIC-R.1] (MVP — paralelo)
        ↓
[EPIC-N || EPIC-O || EPIC-P.2 || EPIC-R.2] (Fase 2 — paralelo)
```

**Dependências externas:**
- EPIC-H (EPIC-03): UTM tracking e Meta Pixel — pré-requisito para EPIC-P
- EPIC-I (EPIC-03): behavior_events — pré-requisito para EPIC-P e EPIC-M
- EPIC-F (EPIC-02): infraestrutura de pontos VIP — pré-requisito para EPIC-N
- EPIC-03 (push_subscriptions schema): pré-requisito para EPIC-O

---

---

# EPIC-M: Dashboard Financeiro Admin

**Descrição:** Dashboard financeiro completo no painel admin (`/admin/financeiro`) com visão de receita, volume de pedidos, métodos de pagamento, performance de produtos, análise de lucratividade estimada e exportação de relatórios. Resolve a lacuna crítica identificada no QA-03 onde o sidebar já tem a rota `/admin/financeiro` mas sem User Stories de implementação.

**Fase:** MVP (M.1, M.2) + Fase 2 (M.3, M.4)
**Prioridade:** Alta
**Dependências:** EPIC-Q (US-Q.1), EPIC-04 (orders com payment_status, total), EPIC-I.1 (behavior_events)

---

### US-M.1 — Visão Geral de Receita e Pedidos

**Como** administrador financeiro,
**Quero** um dashboard com métricas financeiras consolidadas por período,
**Para** tomar decisões de gestão baseadas em dados reais de receita e volume.

**Prioridade:** MVP
**Dependências:** US-Q.1 (schema), EPIC-01 (tabela orders completa)

**Critérios de Aceitação:**
- [ ] Rota `/admin/financeiro` implementada com layout de dashboard e tabs para sub-seções
- [ ] Filtro de período global persistente no topo: "Hoje", "Ontem", "Últimos 7 dias", "Últimos 30 dias", "Este mês", "Mês passado", "Personalizado" (date picker range)
- [ ] Card de métrica: **Receita Total** — `SUM(total) WHERE payment_status = 'paid'` no período
- [ ] Card de métrica: **Pedidos Pagos** — `COUNT(*) WHERE payment_status = 'paid'` no período
- [ ] Card de métrica: **Ticket Médio** — `Receita Total / Pedidos Pagos`
- [ ] Card de métrica: **Pedidos Cancelados** — `COUNT(*) WHERE payment_status IN ('cancelled', 'refunded')` no período
- [ ] Cada card exibe delta percentual vs período anterior: `▲ 12%` (verde) ou `▼ 8%` (vermelho)
- [ ] Gráfico de linha: receita diária no período (Recharts `<LineChart>`) — eixo X = data, eixo Y = R$
- [ ] Gráfico de barras: volume de pedidos por dia no período (Recharts `<BarChart>`)
- [ ] Tabela "Últimos Pedidos": order_id, cliente (email), data, total, status, método de pagamento — 20 registros mais recentes
- [ ] Botão "Ver todos os pedidos" redireciona para `/admin/pedidos` com o filtro de data pré-aplicado
- [ ] Dados atualizados com revalidação de 5 minutos (Server Component com `revalidate: 300`)

**Notas Técnicas:**
- Queries via `supabase.rpc('get_financial_summary', { start_date, end_date })` para evitar múltiplas round-trips
- Delta percentual: calcular período anterior automaticamente (ex: "Últimos 7 dias" compara com os 7 dias anteriores)
- Recharts já usado no projeto (definido em EPIC-03)

---

### US-M.2 — Breakdown por Método de Pagamento e Status

**Como** administrador financeiro,
**Quero** ver a receita e volume segmentados por método de pagamento e status de pedido,
**Para** entender a mix de meios de pagamento e taxa de conversão do checkout.

**Prioridade:** MVP
**Dependências:** US-M.1, US-Q.1

**Critérios de Aceitação:**
- [ ] Seção "Métodos de Pagamento" na aba `/admin/financeiro/pagamentos`
- [ ] Gráfico de pizza/donut (Recharts `<PieChart>`): % de receita por método — "Crédito", "Débito", "Pix"
- [ ] Tabela: método, pedidos, receita total, ticket médio, % do total
- [ ] Seção "Funil de Pedidos" — contagem por status:
  - `pending` — aguardando pagamento
  - `paid` — pago e confirmado
  - `processing` — em separação/envio
  - `shipped` — enviado
  - `delivered` — entregue
  - `cancelled` — cancelado (sem pagamento)
  - `refunded` — reembolsado
- [ ] Taxa de cancelamento: `(cancelled + refunded) / total_orders * 100` — exibido como % com alerta visual se > 5%
- [ ] Taxa de conversão checkout: `paid / (paid + pending + cancelled) * 100`
- [ ] Valor total reembolsado no período: `SUM(total) WHERE payment_status = 'refunded'`

**Notas Técnicas:**
- `payment_method` em `orders`: campo `varchar(20)` com valores `'credit'`, `'debit'`, `'pix'`
- Stripe webhooks já populam `payment_status` e `payment_method` na tabela orders

---

### US-M.3 — Performance de Produtos e Categorias

**Como** administrador financeiro,
**Quero** ver quais produtos e categorias geram mais receita e volume,
**Para** tomar decisões de curadoria de catálogo e estratégia de precificação.

**Prioridade:** Fase 2
**Dependências:** US-M.1, US-Q.1, EPIC-01 (tabelas products, order_items, categories)

**Critérios de Aceitação:**
- [ ] Aba `/admin/financeiro/produtos` implementada
- [ ] Tabela "Top 20 Produtos por Receita" no período:
  - Colunas: foto, nome, SKU, unidades vendidas, receita total, ticket médio por venda
  - Ordenação por receita desc (padrão) — clicável para ordenar por qualquer coluna
- [ ] Tabela "Top 10 Categorias por Receita": categoria, unidades, receita, % do total
- [ ] Tabela "Produtos sem Venda": produtos cadastrados que não tiveram pedidos pagos no período
- [ ] Gráfico de barras horizontais: top 10 produtos por receita (Recharts)
- [ ] Exportar tabela de produtos como CSV (botão "Exportar CSV") — inclui todos os campos da tabela

---

### US-M.4 — Lucratividade Estimada e Exportação

**Como** administrador financeiro,
**Quero** inserir o custo dos produtos e ver uma estimativa de margem de lucro,
**Para** entender a lucratividade real das vendas e exportar relatórios para contabilidade.

**Prioridade:** Fase 2
**Dependências:** US-M.3, US-Q.1 (tabela `product_costs`)

**Critérios de Aceitação:**
- [ ] Campo `cost_brl` decimal(10,2) editável por produto em `/admin/produtos/[id]` — seção "Custo do Produto (R$)"
- [ ] Tabela `product_costs` (ou campo direto em `products`): armazena custo unitário histórico com data de vigência
- [ ] Aba `/admin/financeiro/lucratividade`:
  - Receita total do período
  - Custo total estimado: `SUM(order_items.quantity * product_costs.cost_brl)` por pedido pago
  - Margem bruta estimada: `Receita - Custo`
  - Margem percentual: `(Margem / Receita) * 100`
  - Aviso: "Cálculo estimado — não inclui frete pago ao fornecedor, taxas Stripe/banco nem impostos"
- [ ] Exportar relatório financeiro completo como CSV: botão "Exportar Relatório" na aba principal
  - Colunas do CSV: data, order_id, produto, qtd, valor unitário, custo unitário, margem unitária, método pagamento, utm_campaign
- [ ] Exportar como PDF: botão secundário "Exportar PDF" — layout simplificado com logo + tabela + totais
- [ ] Período do export: respeita o filtro de período global ativo

**Notas Técnicas:**
- PDF export: usar `@react-pdf/renderer` ou `jspdf` + `html2canvas` client-side
- CSV export: gerar string CSV no Server Action e retornar como `Response` com `Content-Disposition: attachment`

---

---

# EPIC-N: Programa de Fidelidade Completo

**Descrição:** Conclusão do Programa de Fidelidade (pontos/VIP) que está ~80% coberto no EPIC-02/EPIC-F. Este EPIC cobre os itens remanescentes: expiração de pontos, campanhas de pontos duplos criadas pelo admin, dashboard de performance do programa de fidelidade e funcionalidades administrativas de gestão manual de pontos.

**Fase:** Fase 2
**Prioridade:** Média
**Dependências:** EPIC-F (EPIC-02 — infraestrutura de pontos), EPIC-Q (US-Q.2), EPIC-06 (admin base)

---

### US-N.1 — Expiração e Ciclo de Vida dos Pontos

**Como** administrador,
**Quero** que os pontos expirem após período de inatividade configurável,
**Para** incentivar compras recorrentes e evitar acúmulo infinito de pontos sem conversão.

**Prioridade:** Fase 2
**Dependências:** EPIC-F (tabela `loyalty_points`), US-Q.2

**Critérios de Aceitação:**
- [ ] Configuração em `store_settings`: `loyalty_expiry_months` integer default 12 (pontos expiram após 12 meses sem compra), `category = 'loyalty'`
- [ ] Cron job mensal (`/api/cron/loyalty-expiry`) — `"schedule": "0 4 1 * *"` (dia 1 de cada mês às 04:00 UTC):
  - Busca usuários cuja última compra (`orders WHERE payment_status = 'paid' ORDER BY created_at DESC LIMIT 1`) foi há mais de `loyalty_expiry_months` meses
  - Para cada usuário: insere registro negativo em `loyalty_points` com `reason = 'expiry'` zerando o saldo
  - Log da operação em `loyalty_expiry_log` (user_id, points_expired, expired_at)
- [ ] Email automático enviado ao usuário 30 dias antes da expiração: "Seus X pontos vão expirar em 30 dias — faça uma compra para mantê-los"
- [ ] Email enviado quando pontos expiram: "Seus X pontos expiraram por inatividade"
- [ ] Na área do cliente (`/minha-conta/fidelidade`): exibir data prevista de expiração dos pontos se inativo
- [ ] Idempotência do cron: verificar `loyalty_expiry_log` para não expirar o mesmo usuário 2x no mesmo mês

**Notas Técnicas:**
- `loyalty_points` tabela do EPIC-F: (id, user_id, points, reason, order_id, created_at) — registros positivos e negativos
- Saldo atual: `SUM(points) WHERE user_id = X`
- Expiração insere `points = -saldo_atual` com `reason = 'expiry'`

---

### US-N.2 — Campanhas de Pontos Duplos (Admin)

**Como** administrador,
**Quero** criar campanhas temporárias de pontos duplos ou bônus para datas específicas,
**Para** aumentar vendas em períodos estratégicos (Copa do Mundo, aniversário da loja, etc.).

**Prioridade:** Fase 2
**Dependências:** US-Q.2, EPIC-F (infraestrutura de pontos)

**Critérios de Aceitação:**
- [ ] Rota `/admin/fidelidade/campanhas` com tabela de campanhas ativas e históricas
- [ ] Botão "Nova Campanha" abre formulário com campos:
  - Nome da campanha (varchar 100)
  - Multiplicador de pontos: dropdown `1x, 1.5x, 2x, 3x`
  - Data início e fim: date pickers
  - Produtos específicos: opcional — se vazio, aplica a todos os produtos
  - Descrição exibida para o cliente: texto curto opcional
- [ ] Salvo em tabela `loyalty_campaigns` (US-Q.2)
- [ ] No Server Action de confirmação de pedido: verificar se há campanha ativa no momento do pagamento — aplicar multiplicador aos pontos calculados
- [ ] Na PDP: badge "🔥 Pontos em dobro!" exibido quando há campanha ativa para o produto
- [ ] Na página `/minha-conta/fidelidade`: aviso de campanha ativa com data de término
- [ ] Sobreposição de campanhas: se múltiplas campanhas ativas, aplicar o maior multiplicador (não acumular)
- [ ] Admin pode desativar campanha antes do prazo: toggle "Ativo/Inativo" na tabela

---

### US-N.3 — Gestão Manual de Pontos e Dashboard Fidelidade

**Como** administrador,
**Quero** ajustar pontos de clientes manualmente e ver a performance do programa,
**Para** resolver situações de suporte e monitorar o engajamento do programa.

**Prioridade:** Fase 2
**Dependências:** US-N.1, US-N.2, US-Q.2

**Critérios de Aceitação:**

**[Gestão Manual]**
- [ ] Em `/admin/clientes/[id]`: seção "Pontos de Fidelidade" com saldo atual e histórico
- [ ] Botão "Ajustar pontos": modal com campo de quantidade (positivo ou negativo) + motivo obrigatório (textarea)
- [ ] Ajuste manual registrado em `loyalty_points` com `reason = 'admin_adjustment'` + `admin_note = motivo`
- [ ] Log de auditoria: user_id do admin que fez o ajuste registrado em campo `adjusted_by_admin_id`

**[Dashboard Fidelidade]**
- [ ] Rota `/admin/fidelidade` com métricas do programa:
  - Total de usuários participantes (com saldo > 0)
  - Total de pontos emitidos no período
  - Total de pontos resgatados no período (convertidos em cupons)
  - Taxa de engajamento: usuários VIP / total de usuários
  - Pontos próximos de expirar (30 dias): count de usuários e pontos em risco
- [ ] Tabela "Top 20 Clientes por Pontos": nome, email, saldo atual, total acumulado histórico, última compra
- [ ] Gráfico de linha: emissão de pontos diária nos últimos 30 dias

---

---

# EPIC-O: Campanhas de Push Notification

**Descrição:** Interface administrativa para criar e enviar campanhas de notificação push para os usuários que aceitaram receber notificações. A infraestrutura de push (service worker, `push_subscriptions` tabela) já foi definida no EPIC-02/EPIC-F e EPIC-03. Este EPIC cobre exclusivamente a criação e gestão de campanhas pelo admin.

**Fase:** Fase 2
**Prioridade:** Média
**Dependências:** EPIC-F (EPIC-02 — service worker, push_subscriptions), EPIC-03 (schema push_subscriptions), EPIC-Q (US-Q.3)

---

### US-O.1 — Criação e Envio de Campanhas Push

**Como** administrador de marketing,
**Quero** criar e enviar campanhas de notificação push segmentadas,
**Para** reengajar clientes com promoções, lançamentos e lembretes sem custo de SMS/email.

**Prioridade:** Fase 2
**Dependências:** US-Q.3 (tabela push_campaigns), EPIC-F (push_subscriptions + service worker funcionais)

**Critérios de Aceitação:**
- [ ] Rota `/admin/push` com tabela de campanhas (status: rascunho, enviada, agendada)
- [ ] Botão "Nova Campanha" abre formulário com:
  - **Título** (varchar 50 — limite do web push): contador de caracteres visível
  - **Corpo** (varchar 120): contador de caracteres visível
  - **URL de destino**: rota interna do site (ex: `/colecao/copa-2026`) — validado para começar com `/`
  - **Ícone**: upload de imagem 192x192px ou usar logo padrão da loja
  - **Segmento**: dropdown "Todos os inscritos" | "Apenas VIP" | "Compradores dos últimos 30 dias" | "Não compraram nos últimos 60 dias"
  - **Agendamento**: "Enviar agora" ou "Agendar para" (datetime picker)
- [ ] Preview ao vivo da notificação: mockup visual mostra como ficará no browser (Windows/Mac/Android)
- [ ] Validação antes de enviar: mínimo 1 assinante no segmento selecionado — alertar se 0 assinantes
- [ ] Envio imediato: Server Action itera em batches de 500 assinantes usando Web Push API
- [ ] Agendamento: salvo em `push_campaigns` com `scheduled_at` — Vercel Cron a cada 5 minutos verifica campanhas pendentes
- [ ] Após envio: status atualizado para "Enviada", campos `sent_at`, `total_sent`, `total_failed` preenchidos
- [ ] Rate limiting: máximo 2 campanhas push por dia (validação no Server Action)

**Notas Técnicas:**
- Web Push API: usar biblioteca `web-push` (npm) com VAPID keys
- `vapid_public_key` armazenada em `store_settings` (`category = 'push'`) — lida pelo frontend para registrar o service worker
- `VAPID_PRIVATE_KEY` armazenada EXCLUSIVAMENTE como variável de ambiente no servidor (`VAPID_PRIVATE_KEY` no `.env` / Vercel Secrets) — NUNCA no banco de dados (chave criptográfica privada)
- Geração de VAPID keys: `web-push generateVAPIDKeys()` — executado uma vez no setup, privada vai para `.env`, pública para `store_settings`
- Segmento "VIP": query em `users WHERE is_vip = true`
- Segmento "Compradores 30 dias": query em `orders WHERE payment_status = 'paid' AND created_at > now() - interval '30 days'` — JOIN com `push_subscriptions`
- Batch de 500: usar `Promise.allSettled()` por batch — não usar `Promise.all()` para não falhar tudo se um falhar

---

### US-O.2 — Performance e Análise de Campanhas Push

**Como** administrador de marketing,
**Quero** ver a taxa de entrega e clique de cada campanha push,
**Para** avaliar a efetividade das notificações e otimizar futuras campanhas.

**Prioridade:** Fase 2
**Dependências:** US-O.1, US-Q.3

**Critérios de Aceitação:**
- [ ] Ao clicar em uma campanha na tabela: drawer lateral com detalhes da campanha
- [ ] Métricas da campanha:
  - Total de assinantes no segmento no momento do envio
  - Total enviado com sucesso (`total_sent`)
  - Total falhou (`total_failed`) — endpoints inválidos ou expirados
  - Taxa de entrega: `total_sent / (total_sent + total_failed) * 100`
  - Cliques: contagem de usuários que clicaram na notificação e chegaram ao site (via UTM `utm_medium=push&utm_campaign=[campaign_id]`)
  - Taxa de clique: `cliques / total_sent * 100`
- [ ] URL de destino automaticamente adicionada com UTM: `?utm_source=push&utm_medium=push_notification&utm_campaign=[campaign_slug]`
- [ ] Cliques rastreados via behavior_events (`event_type = 'pageview'` com `utm_medium = 'push_notification'`)
- [ ] Endpoints falhos removidos automaticamente de `push_subscriptions` após 3 falhas consecutivas (coluna `fail_count`)

---

---

# EPIC-P: Leads & Indicadores de Aquisição Meta

**Descrição:** Módulo de relatório de leads no painel admin focado em visitantes que chegam ao e-commerce via campanhas Meta (Facebook/Instagram Ads). "Lead" no contexto do Gabinete FC = visitante proveniente de campanha paga Meta que entra no site com intenção de compra. O admin visualiza quantos leads entraram, por qual campanha, em qual etapa do funil cada um está e quais converteram em compra — com indicadores de performance organizados por campanha.

**Decisão de produto:** Vínculo com Meta Business Manager feito exclusivamente no painel admin (`/admin/configuracoes` → seção "Meta Business Manager"). Relatório de leads centralizado em `/admin/leads`.

**Fase:** MVP (P.1) + Fase 2 (P.2, P.3)
**Prioridade:** Alta
**Dependências:** EPIC-H.1 (Pixel + BM config no admin), EPIC-H.2 (UTM capture em orders), EPIC-I.1 (behavior_events), EPIC-Q (US-Q.4)

---

### US-P.1 — Dashboard de Leads Meta — Visão Geral

**Como** gestor de marketing,
**Quero** ver quantos leads chegaram pelo Meta Ads e como se comportaram no site,
**Para** entender o retorno das campanhas pagas e otimizar o investimento.

**Prioridade:** MVP
**Dependências:** EPIC-H.2 (UTM em orders), EPIC-I.1 (behavior_events com utm_source), US-Q.4

**Critérios de Aceitação:**
- [ ] Rota `/admin/leads` com dashboard de leads e filtro de período global (igual ao `/admin/financeiro`)
- [ ] **Definição de Lead**: qualquer sessão em `behavior_events` onde `utm_source IN ('facebook', 'instagram', 'meta')` OU `utm_medium = 'cpc'` com `utm_source` da Meta — identificado por `session_id` único
- [ ] Card de métrica: **Leads Hoje** — sessões únicas (`COUNT(DISTINCT session_id)`) com UTM Meta no dia
- [ ] Card de métrica: **Leads no Período** — sessões únicas com UTM Meta no período selecionado
- [ ] Card de métrica: **Taxa de Conversão de Lead** — `pedidos pagos com utm_source Meta / total leads * 100`
- [ ] Card de métrica: **Receita de Leads Meta** — `SUM(orders.total) WHERE utm_source IN ('facebook', 'instagram', 'meta') AND payment_status = 'paid'`
- [ ] Card de métrica: **Custo por Lead (CPL)** — campo manual editável no admin: "Gasto total na Meta (R$)" ÷ total de leads; se não informado: exibir "Informe o gasto para calcular"
- [ ] Card de métrica: **ROAS** — `Receita Meta / Gasto Meta`; exibe "N/A" se gasto não informado
- [ ] Gráfico de barras: leads por dia no período (Recharts)
- [ ] Gráfico de linha sobreposto: compras de leads no mesmo período

**Notas Técnicas:**
- Lead identificado via `behavior_events WHERE utm_source ILIKE '%facebook%' OR utm_source ILIKE '%instagram%' OR utm_source ILIKE '%meta%' OR utm_medium = 'cpc'`
- `session_id` do behavior_events = sessão única do visitante (gerado por `crypto.randomUUID()` no sessionStorage — EPIC-I.1)
- Gasto Meta: campo editável em tabela `meta_ad_spend` (US-Q.4) — período + valor

---

### US-P.2 — Funil de Conversão de Leads por Campanha

**Como** gestor de marketing,
**Quero** ver o funil de conversão de cada campanha Meta com etapas detalhadas,
**Para** identificar em qual etapa os leads estão abandonando e ajustar criativos/landing pages.

**Prioridade:** Fase 2
**Dependências:** US-P.1, EPIC-I.1, EPIC-H.2

**Critérios de Aceitação:**
- [ ] Tabela "Leads por Campanha" na rota `/admin/leads`:
  - Colunas: `utm_campaign`, Leads (sessões únicas), Visualizações de Produto, Adições ao Carrinho, Checkouts Iniciados, Compras, Taxa de Conversão (Leads→Compras), Receita
  - Ordenação padrão por Leads desc
  - Clique em linha: expande o funil detalhado desta campanha
- [ ] Funil detalhado por campanha (barras horizontais decrescentes):
  1. **Chegada** — `COUNT(DISTINCT session_id)` com `event_type = 'pageview'` e UTM da campanha
  2. **Visualizou Produto** — `COUNT(DISTINCT session_id)` com `event_type = 'product_view'` na mesma sessão
  3. **Adicionou ao Carrinho** — `COUNT(DISTINCT session_id)` com `event_type = 'add_to_cart'`
  4. **Iniciou Checkout** — `COUNT(DISTINCT session_id)` com `event_type = 'checkout_started'`
  5. **Comprou** — `COUNT(DISTINCT orders.id)` com `utm_campaign = X AND payment_status = 'paid'`
- [ ] Taxa entre cada etapa exibida: "Etapa 1→2: 45% | Etapa 2→3: 32% | ..."
- [ ] Ponto de maior abandono destacado com ícone de alerta ⚠️ (etapa com maior queda percentual)
- [ ] Filtro por período aplica a todas as campanhas da tabela

**Notas Técnicas:**
- Join entre `behavior_events` (sessões com UTM) e `orders` (utm_campaign) pelo campo `utm_campaign`
- Sessões de behavior_events não têm user_id garantido (visitantes anônimos) — usar session_id como chave
- Orders têm utm_campaign mas não session_id — a ligação é pela campanha, não pela sessão individual

---

### US-P.3 — Relatório Individual de Lead e Exportação

**Como** gestor de marketing,
**Quero** ver o histórico detalhado de cada sessão de lead e exportar relatórios,
**Para** analisar padrões de comportamento e compartilhar dados com a agência de mídia.

**Prioridade:** Fase 2
**Dependências:** US-P.2, US-Q.4

**Critérios de Aceitação:**
- [ ] Aba `/admin/leads/sessoes`: tabela de sessões individuais de leads Meta
  - Colunas: data/hora, utm_campaign, utm_source, página de entrada, páginas visitadas (count), evento mais avançado no funil, converteu (sim/não), valor da compra
  - Paginação: 50 por página
  - Filtros: por campanha, por data, por "converteu sim/não"
- [ ] Clique em sessão: drawer lateral com timeline de eventos da sessão:
  - Lista cronológica: `pageview /home` → `product_view /produto/camisa-x` → `add_to_cart` → `checkout_started` → (abandonou OU `purchase R$ 289,90`)
  - Duração total da sessão estimada: `MAX(created_at) - MIN(created_at)`
- [ ] Exportar tabela de leads como CSV: botão "Exportar Leads CSV"
  - Colunas: session_id, data_entrada, utm_campaign, utm_source, utm_medium, paginas_visitadas, evento_max_funil, converteu, valor_compra
- [ ] Privacidade: sessões anônimas sem identificação de usuário — se usuário logou, exibir email mascarado (`jo***@gmail.com`)
- [ ] Período de retenção exibido no rodapé: "Dados de sessões retidos por 13 meses (conforme política de behavior_events)"

---

---

# EPIC-R: Pagamentos Avançados

**Descrição:** Cobre os dois itens de pagamento que permaneciam sem User Stories dedicadas: (1) configuração do tempo de expiração do QR Code Pix diretamente no painel admin, sem depender de valores fixos no código; (2) ativação de 3DS v2 (autenticação extra) para transações de alto valor via Stripe, reduzindo chargebacks em pedidos acima de valor configurável.

**Fase:** MVP (R.1) + Fase 2 (R.2)
**Prioridade:** Alta
**Dependências:** EPIC-04 (Stripe + Pix integração), EPIC-Q (US-Q.5), EPIC-06 (admin base)

---

### US-R.1 — Pix com Expiração de QR Code Configurável

**Como** administrador,
**Quero** configurar o tempo de expiração do QR Code Pix no painel admin,
**Para** controlar quanto tempo o cliente tem para pagar sem precisar alterar código ou fazer deploy.

**Prioridade:** MVP
**Dependências:** US-Q.5 (campo `pix_expiry_minutes` em store_settings), EPIC-04 (Stripe Pix integration)

**Critérios de Aceitação:**

**[Admin — Configuração]**
- [ ] Campo `pix_expiry_minutes` integer adicionado a `store_settings` com `category = 'payments'` — padrão: `30` (30 minutos)
- [ ] Editável em `/admin/configuracoes` → seção "Pagamentos" → campo "Expiração do Pix (minutos)"
- [ ] Campo aceita valores entre 5 e 1440 (5 min até 24h) — validação client e server-side
- [ ] Dropdown com sugestões rápidas: "15 min", "30 min" (padrão), "1 hora", "2 horas", "24 horas"
- [ ] Aviso exibido: "O cliente tem esse tempo para pagar após visualizar o QR Code. Após expirar, o pedido é cancelado automaticamente."
- [ ] Ao salvar: alteração refletida no próximo pedido Pix criado (lida no Server Action de checkout)

**[Checkout — Geração do QR Code]**
- [ ] No Server Action de criação de pagamento Pix (`/api/checkout/pix`): ler `pix_expiry_minutes` de `store_settings`
- [ ] Passar `expires_in_seconds = pix_expiry_minutes * 60` ao criar o PaymentIntent Stripe com método `customer_balance` (Pix): parâmetro `payment_method_options.customer_balance.bank_transfer.request_three_d_secure` substituído por `expires_after_seconds` no objeto de criação
- [ ] Exibir countdown no frontend da página de confirmação Pix: timer regressivo mostrando "Pague em MM:SS"
- [ ] Quando timer expirar: mensagem "QR Code expirado. Gere um novo pedido." + botão "Tentar novamente"

**[Cancelamento Automático]**
- [ ] Cron job a cada 5 minutos (`/api/cron/pix-expiry`): busca pedidos com `payment_status = 'pending'` e `payment_method = 'pix'` onde `created_at < now() - (pix_expiry_minutes || ' minutes')::interval`
- [ ] Para cada pedido expirado: atualizar `payment_status = 'cancelled'`, enviar email automático "Seu pedido expirou — realize um novo pedido para comprar"
- [ ] Estoque devolvido automaticamente ao cancelar (reverter reserva feita na criação do pedido)
- [ ] Log de cancelamentos Pix em tabela `pix_expiry_log` (order_id, expired_at, pix_expiry_minutes_used)
- [ ] Admin pode ver pedidos cancelados por expiração Pix em `/admin/pedidos` com filtro "Cancelados por Pix Expirado"

**[Webhook Stripe — R.1]**
- [ ] Handler do webhook `/api/webhooks/stripe` verifica assinatura HMAC antes de processar qualquer evento: `stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)` — retorna HTTP 400 imediatamente se assinatura inválida (sem processar payload)
- [ ] Evento `payment_intent.canceled`: sincronizar cancelamento de pedido Pix automaticamente se Stripe cancelar antes do cron — atualizar `orders.payment_status = 'cancelled'`
- [ ] Idempotência: verificar `orders.payment_status` antes de aplicar cancelamento — não processar evento duplicado se pedido já estiver cancelado
- [ ] `rawBody` deve ser preservado como Buffer antes de qualquer parsing JSON (usar `request.text()` no Route Handler — não `request.json()`)

**Notas Técnicas:**
- Stripe Pix: `payment_intent.create({ payment_method_types: ['pix'], pix: { expires_after_seconds: N } })`
- `expires_after_seconds` no Stripe: mínimo 600 (10 min), máximo 86400 (24h) — validar e clamp o valor de `store_settings` antes de enviar
- Cron protegido com Bearer token padrão: `Authorization: Bearer {CRON_SECRET}`
- Verificar `vercel.json`: `"schedule": "*/5 * * * *"` (a cada 5 minutos)

---

### US-R.2 — 3DS v2 para Transações de Alto Valor

**Como** administrador,
**Quero** ativar autenticação 3D Secure v2 automaticamente para pedidos acima de um valor configurável,
**Para** reduzir chargebacks e fraudes em compras de alto valor sem adicionar atrito em compras menores.

**Prioridade:** Fase 2
**Dependências:** US-Q.5 (campos `stripe_3ds_threshold_brl`, `stripe_3ds_mode` em store_settings), EPIC-04 (Stripe Cards integration)

**Critérios de Aceitação:**

**[Admin — Configuração]**
- [ ] Campos em `store_settings` (`category = 'payments'`):
  - `stripe_3ds_enabled` boolean default true
  - `stripe_3ds_threshold_brl` decimal default 500.00 — pedidos acima desse valor acionam 3DS
  - `stripe_3ds_mode` varchar(20) default `'automatic'` — valores: `'automatic'` (Stripe decide) | `'always'` (sempre acima do threshold) | `'disabled'`
- [ ] Editável em `/admin/configuracoes` → seção "Pagamentos" → sub-seção "Segurança 3DS"
- [ ] Campos: toggle "Ativar 3DS", campo de valor "Acionar 3DS acima de R$", dropdown de modo
- [ ] Explicação contextual: "O 3DS solicita autenticação extra do banco do cliente (ex: senha ou código SMS) antes de aprovar o pagamento. Reduz chargebacks, mas pode aumentar o abandono de checkout."

**[Checkout — Cartão de Crédito/Débito]**
- [ ] No Server Action de criação do PaymentIntent para cartão: ler `stripe_3ds_*` de `store_settings`
- [ ] Se `stripe_3ds_enabled = false`: criar PaymentIntent normalmente sem parâmetros 3DS
- [ ] Se `stripe_3ds_enabled = true` e `order_total >= stripe_3ds_threshold_brl`:
  - Modo `'automatic'`: `payment_intent.create({ payment_method_options: { card: { request_three_d_secure: 'automatic' } } })`
  - Modo `'always'`: `payment_intent.create({ payment_method_options: { card: { request_three_d_secure: 'any' } } })`
- [ ] Se pedido abaixo do threshold: criar sem parâmetros 3DS (fluxo normal)
- [ ] Frontend (Stripe Elements/Payment Element): o componente Stripe já lida com o redirect 3DS automaticamente — sem código adicional no client além do tratamento do retorno
- [ ] Página de retorno após 3DS: `/checkout/confirmacao/[orderId]` — verificar `payment_intent.status` via webhook antes de marcar como pago
- [ ] Se 3DS falhar (cliente cancela ou banco recusa): status `payment_intent = 'requires_payment_method'` → redirecionar para checkout com mensagem "Autenticação 3DS não concluída. Tente novamente ou use outro cartão."

**[Métricas no Admin]**
- [ ] Em `/admin/financeiro/pagamentos`: coluna adicional "3DS Acionado" — percentual de pedidos de cartão que passaram por 3DS no período
- [ ] Card: "Taxa de falha 3DS" — pedidos onde 3DS foi acionado mas falhou / total 3DS acionados
- [ ] Esses dados extraídos de `orders`: campo `three_ds_triggered` boolean (US-Q.5)

**Notas Técnicas:**
- Stripe 3DS v2: `request_three_d_secure: 'automatic'` = Stripe decide baseado no risco; `'any'` = força para todos
- Stripe Payment Element (se usado): lida com 3DS automaticamente via `confirmPayment()` — retorna URL de redirect
- Se usar CardElement: usar `stripe.confirmCardPayment()` que retorna `next_action.redirect_to_url` para o 3DS
- Webhook `payment_intent.succeeded` confirma pagamento após 3DS bem-sucedido — assinatura Stripe verificada via `constructEvent()` antes de processar (mesmo handler do R.1, reutilizar implementação do EPIC-01)
- Campo `three_ds_triggered` em orders: preenchido pelo webhook baseado em `payment_intent.latest_charge.payment_method_details.card.three_d_secure`
- Status do pedido quando 3DS falha (`payment_intent.payment_failed` com `last_payment_error.code = 'payment_intent_authentication_failure'`): atualizar `orders.payment_status = 'pending'` (aguarda nova tentativa) — NÃO cancelar automaticamente, pois o cliente pode tentar novamente com outro cartão
- [ ] Critério de aceitação: "Webhook handler verifica `stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET)` e retorna 400 se assinatura inválida — nenhum processamento de negócio ocorre sem verificação"

---

---

**Descrição:** Migrations e seed data necessários para suportar EPIC-M, N, O e P. Inclui novas tabelas, campos adicionais e policies RLS.

**Fase:** MVP
**Prioridade:** Crítica
**Dependências:** EPIC-A (EPIC-02 — schema base corrigido), EPIC-L (EPIC-03 — schema complementar)

---

### US-Q.1 — Schema Financeiro

**Prioridade:** MVP

```sql
-- Q.1.1 Função SQL para dashboard financeiro
CREATE OR REPLACE FUNCTION get_financial_summary(
  start_date timestamptz,
  end_date timestamptz
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_revenue', COALESCE(SUM(total) FILTER (WHERE payment_status = 'paid'), 0),
    'total_orders_paid', COUNT(*) FILTER (WHERE payment_status = 'paid'),
    'total_orders_cancelled', COUNT(*) FILTER (WHERE payment_status IN ('cancelled', 'refunded')),
    'avg_ticket', COALESCE(AVG(total) FILTER (WHERE payment_status = 'paid'), 0),
    'total_refunded', COALESCE(SUM(total) FILTER (WHERE payment_status = 'refunded'), 0),
    'revenue_by_method', json_build_object(
      'credit', COALESCE(SUM(total) FILTER (WHERE payment_status = 'paid' AND payment_method = 'credit'), 0),
      'debit', COALESCE(SUM(total) FILTER (WHERE payment_status = 'paid' AND payment_method = 'debit'), 0),
      'pix', COALESCE(SUM(total) FILTER (WHERE payment_status = 'paid' AND payment_method = 'pix'), 0)
    )
  ) INTO result
  FROM orders
  WHERE created_at BETWEEN start_date AND end_date;

  RETURN result;
END;
$$;

-- Q.1.2 Campo payment_method em orders
-- NOTA QA: payment_method já existe no EPIC-01. ADD COLUMN IF NOT EXISTS com CHECK
-- não adiciona a constraint se a coluna já existe. Usar abordagem segura:
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method varchar(20) DEFAULT 'credit';
-- Adicionar constraint separadamente (só falha se constraint já existe — usar IF NOT EXISTS no Postgres 15+)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_orders_payment_method' AND conrelid = 'orders'::regclass
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT chk_orders_payment_method
      CHECK (payment_method IN ('credit', 'debit', 'pix'));
  END IF;
END
$$;

-- Q.1.3 Custo dos produtos para lucratividade estimada
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS cost_brl decimal(10,2) DEFAULT NULL;

-- Histórico de custos (para produtos com custo variável)
CREATE TABLE IF NOT EXISTS product_cost_history (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id    uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  cost_brl      decimal(10,2) NOT NULL,
  valid_from    date NOT NULL DEFAULT CURRENT_DATE,
  created_by    uuid REFERENCES auth.users(id),
  created_at    timestamptz DEFAULT now()
);

-- Q.1.4 RLS product_cost_history
ALTER TABLE product_cost_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_only_cost_history" ON product_cost_history
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin' OR current_role = 'service_role');

-- Q.1.5 Índices financeiros
CREATE INDEX IF NOT EXISTS idx_orders_payment_status_created ON orders(payment_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
```

---

### US-Q.2 — Schema Fidelidade

**Prioridade:** Fase 2

```sql
-- Q.2.1 Campanhas de pontos duplos
CREATE TABLE IF NOT EXISTS loyalty_campaigns (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name            varchar(100) NOT NULL,
  multiplier      decimal(3,1) NOT NULL DEFAULT 2.0
    CHECK (multiplier IN (1.0, 1.5, 2.0, 3.0)),
  starts_at       timestamptz NOT NULL,
  ends_at         timestamptz NOT NULL,
  is_active       boolean DEFAULT true,
  product_ids     uuid[] DEFAULT NULL,   -- NULL = todos os produtos
  description     varchar(200),
  created_at      timestamptz DEFAULT now(),
  CONSTRAINT valid_campaign_period CHECK (ends_at > starts_at)
);

-- Q.2.2 Log de expirações de pontos
CREATE TABLE IF NOT EXISTS loyalty_expiry_log (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid NOT NULL REFERENCES users(id),
  points_expired  integer NOT NULL,
  expired_at      timestamptz DEFAULT now(),
  cron_run_at     timestamptz DEFAULT now()
);

-- Q.2.3 Campo audit em loyalty_points para ajustes manuais
ALTER TABLE loyalty_points
  ADD COLUMN IF NOT EXISTS adjusted_by_admin_id uuid REFERENCES auth.users(id) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS admin_note text DEFAULT NULL;

-- Q.2.4 RLS
ALTER TABLE loyalty_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_manage_campaigns" ON loyalty_campaigns
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin' OR current_role = 'service_role');
CREATE POLICY "public_read_active_campaigns" ON loyalty_campaigns
  FOR SELECT USING (is_active = true AND now() BETWEEN starts_at AND ends_at);

ALTER TABLE loyalty_expiry_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_read_expiry_log" ON loyalty_expiry_log
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin' OR current_role = 'service_role');

-- Q.2.5 Índices
CREATE INDEX IF NOT EXISTS idx_loyalty_campaigns_active ON loyalty_campaigns(is_active, starts_at, ends_at)
  WHERE is_active = true;
```

---

### US-Q.3 — Schema Push Campaigns

**Prioridade:** Fase 2

```sql
-- Q.3.1 Campanhas de push notification
CREATE TABLE IF NOT EXISTS push_campaigns (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title           varchar(50) NOT NULL,
  body            varchar(120) NOT NULL,
  destination_url varchar(500) NOT NULL,
  icon_url        varchar(500),
  segment         varchar(50) NOT NULL DEFAULT 'all'
    CHECK (segment IN ('all', 'vip', 'recent_buyers', 'inactive')),
  status          varchar(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  scheduled_at    timestamptz DEFAULT NULL,
  sent_at         timestamptz DEFAULT NULL,
  total_recipients integer DEFAULT 0,
  total_sent      integer DEFAULT 0,
  total_failed    integer DEFAULT 0,
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz DEFAULT now()
);

-- Q.3.2 Controle de falhas em push_subscriptions
ALTER TABLE push_subscriptions
  ADD COLUMN IF NOT EXISTS fail_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_fail_at timestamptz DEFAULT NULL;

-- Q.3.3 Configurações VAPID em store_settings
INSERT INTO store_settings (key, value, category) VALUES
  ('vapid_public_key', '', 'push')  ON CONFLICT (key) DO NOTHING;
-- ATENÇÃO: vapid_private_key NÃO deve ficar no banco.
-- Armazenar como variável de ambiente: VAPID_PRIVATE_KEY=<valor> no Vercel Secrets / .env.local
-- Apenas a vapid_public_key vai para store_settings (é pública por definição)

-- Q.3.4 RLS push_campaigns
ALTER TABLE push_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_manage_push_campaigns" ON push_campaigns
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin' OR current_role = 'service_role');

-- Q.3.5 Índices
CREATE INDEX IF NOT EXISTS idx_push_campaigns_status ON push_campaigns(status, scheduled_at)
  WHERE status IN ('scheduled', 'sending');
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_fail ON push_subscriptions(fail_count)
  WHERE fail_count > 0;
```

---

### US-Q.4 — Schema Leads Meta

**Prioridade:** MVP

```sql
-- Q.4.1 Gasto em Meta Ads por período (para cálculo de CPL e ROAS)
CREATE TABLE IF NOT EXISTS meta_ad_spend (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_name   varchar(200),       -- NULL = gasto total sem campanha específica
  spend_brl       decimal(10,2) NOT NULL,
  period_start    date NOT NULL,
  period_end      date NOT NULL,
  notes           varchar(500),
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz DEFAULT now(),
  CONSTRAINT valid_spend_period CHECK (period_end >= period_start)
);

-- Q.4.2 Índices para queries de leads (behavior_events já tem índices no EPIC-L)
-- Índice específico para filtrar UTM Meta em behavior_events
CREATE INDEX IF NOT EXISTS idx_behavior_events_utm_source ON behavior_events(utm_source)
  WHERE utm_source IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_behavior_events_utm_campaign ON behavior_events(utm_campaign)
  WHERE utm_campaign IS NOT NULL;

-- Índice em orders para queries de leads Meta
CREATE INDEX IF NOT EXISTS idx_orders_utm_source ON orders(utm_source)
  WHERE utm_source IS NOT NULL;

-- Q.4.3 Função SQL para funil de leads por campanha
-- CORREÇÃO QA-CRÍTICO-02: versão anterior usava LEFT JOINs diretos em behavior_events
-- gerando produto cartesiano que inflava SUM(revenue). Versão corrigida usa CTEs
-- independentes por etapa — sem produto cartesiano, sem inflação de receita.
CREATE OR REPLACE FUNCTION get_meta_leads_funnel(
  start_date timestamptz,
  end_date timestamptz,
  campaign_filter varchar DEFAULT NULL
)
RETURNS TABLE(
  campaign_name varchar,
  leads_count bigint,
  product_views bigint,
  add_to_cart bigint,
  checkout_started bigint,
  purchases bigint,
  revenue decimal
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Apenas admins podem executar esta função
  IF auth.jwt() ->> 'role' != 'admin' AND current_role != 'service_role' THEN
    RAISE EXCEPTION 'Acesso negado: apenas admins podem consultar o funil de leads';
  END IF;

  RETURN QUERY
  WITH
  -- Etapa 0: Sessões Meta — cada session_id único por campanha
  meta_sessions AS (
    SELECT DISTINCT session_id, COALESCE(utm_campaign, 'sem_campanha') AS campaign
    FROM behavior_events
    WHERE created_at BETWEEN start_date AND end_date
      AND utm_source ILIKE ANY(ARRAY['%facebook%', '%instagram%', '%meta%'])
      AND (campaign_filter IS NULL OR utm_campaign ILIKE campaign_filter)
  ),
  -- Etapa 1: Contagem de leads por campanha
  leads AS (
    SELECT campaign, COUNT(DISTINCT session_id) AS cnt
    FROM meta_sessions GROUP BY campaign
  ),
  -- Etapa 2: Sessões com product_view (independente, sem JOIN em leads)
  pv AS (
    SELECT COALESCE(be.utm_campaign, 'sem_campanha') AS campaign,
           COUNT(DISTINCT be.session_id) AS cnt
    FROM behavior_events be
    INNER JOIN meta_sessions ms ON ms.session_id = be.session_id
    WHERE be.event_type = 'product_view'
      AND be.created_at BETWEEN start_date AND end_date
    GROUP BY COALESCE(be.utm_campaign, 'sem_campanha')
  ),
  -- Etapa 3: Sessões com add_to_cart
  atc AS (
    SELECT COALESCE(be.utm_campaign, 'sem_campanha') AS campaign,
           COUNT(DISTINCT be.session_id) AS cnt
    FROM behavior_events be
    INNER JOIN meta_sessions ms ON ms.session_id = be.session_id
    WHERE be.event_type = 'add_to_cart'
      AND be.created_at BETWEEN start_date AND end_date
    GROUP BY COALESCE(be.utm_campaign, 'sem_campanha')
  ),
  -- Etapa 4: Sessões com checkout_started
  cs AS (
    SELECT COALESCE(be.utm_campaign, 'sem_campanha') AS campaign,
           COUNT(DISTINCT be.session_id) AS cnt
    FROM behavior_events be
    INNER JOIN meta_sessions ms ON ms.session_id = be.session_id
    WHERE be.event_type = 'checkout_started'
      AND be.created_at BETWEEN start_date AND end_date
    GROUP BY COALESCE(be.utm_campaign, 'sem_campanha')
  ),
  -- Etapa 5: Compras por campanha — agregado separadamente, sem JOIN em behavior_events
  rev AS (
    SELECT COALESCE(utm_campaign, 'sem_campanha') AS campaign,
           COUNT(DISTINCT id)       AS purchase_count,
           COALESCE(SUM(total), 0)  AS total_revenue
    FROM orders
    WHERE payment_status = 'paid'
      AND created_at BETWEEN start_date AND end_date
      AND utm_source ILIKE ANY(ARRAY['%facebook%', '%instagram%', '%meta%'])
      AND (campaign_filter IS NULL OR utm_campaign ILIKE campaign_filter)
    GROUP BY COALESCE(utm_campaign, 'sem_campanha')
  )
  SELECT
    l.campaign::varchar,
    l.cnt,
    COALESCE(pv.cnt, 0),
    COALESCE(atc.cnt, 0),
    COALESCE(cs.cnt, 0),
    COALESCE(rev.purchase_count, 0),
    COALESCE(rev.total_revenue, 0)
  FROM leads l
  LEFT JOIN pv  ON pv.campaign  = l.campaign
  LEFT JOIN atc ON atc.campaign = l.campaign
  LEFT JOIN cs  ON cs.campaign  = l.campaign
  LEFT JOIN rev ON rev.campaign = l.campaign
  ORDER BY l.cnt DESC;
END;
$$;

-- Q.4.4 RLS meta_ad_spend
ALTER TABLE meta_ad_spend ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_manage_ad_spend" ON meta_ad_spend
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin' OR current_role = 'service_role');

-- Q.4.5 Índices
CREATE INDEX IF NOT EXISTS idx_meta_ad_spend_period ON meta_ad_spend(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_meta_ad_spend_campaign ON meta_ad_spend(campaign_name)
  WHERE campaign_name IS NOT NULL;

-- Q.4.6 Índice crítico para performance da função get_meta_leads_funnel
-- CORREÇÃO QA-M-01: sem este índice a função tem performance O(N²) em produção
CREATE INDEX IF NOT EXISTS idx_behavior_events_session_event
  ON behavior_events(session_id, event_type);

-- Q.4.7 Restringir RPCs financeiras — verificação de role inside SECURITY DEFINER
-- CORREÇÃO QA-M-02: get_financial_summary também deve verificar role admin
-- (já aplicado inline na função get_meta_leads_funnel acima; aplicar o mesmo em get_financial_summary)
CREATE OR REPLACE FUNCTION get_financial_summary(
  start_date timestamptz,
  end_date timestamptz
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Apenas admins
  IF auth.jwt() ->> 'role' != 'admin' AND current_role != 'service_role' THEN
    RAISE EXCEPTION 'Acesso negado: apenas admins podem consultar o resumo financeiro';
  END IF;
  -- Limite de período: máximo 366 dias para evitar timeout
  IF end_date - start_date > interval '366 days' THEN
    RAISE EXCEPTION 'Período máximo permitido: 366 dias';
  END IF;

  SELECT json_build_object(
    'total_revenue', COALESCE(SUM(total) FILTER (WHERE payment_status = 'paid'), 0),
    'total_orders_paid', COUNT(*) FILTER (WHERE payment_status = 'paid'),
    'total_orders_cancelled', COUNT(*) FILTER (WHERE payment_status IN ('cancelled', 'refunded')),
    'avg_ticket', COALESCE(AVG(total) FILTER (WHERE payment_status = 'paid'), 0),
    'total_refunded', COALESCE(SUM(total) FILTER (WHERE payment_status = 'refunded'), 0),
    'revenue_by_method', json_build_object(
      'credit', COALESCE(SUM(total) FILTER (WHERE payment_status = 'paid' AND payment_method = 'credit'), 0),
      'debit',  COALESCE(SUM(total) FILTER (WHERE payment_status = 'paid' AND payment_method = 'debit'),  0),
      'pix',    COALESCE(SUM(total) FILTER (WHERE payment_status = 'paid' AND payment_method = 'pix'),    0)
    )
  ) INTO result
  FROM orders
  WHERE created_at BETWEEN start_date AND end_date;

  RETURN result;
END;
$$;
```

---

---

### US-Q.5 — Schema Pagamentos Avançados (EPIC-R)

**Prioridade:** MVP

```sql
-- Q.5.1 Configurações de pagamento em store_settings
INSERT INTO store_settings (key, value, category) VALUES
  ('pix_expiry_minutes', '30', 'payments')         ON CONFLICT (key) DO NOTHING;
INSERT INTO store_settings (key, value, category) VALUES
  ('stripe_3ds_enabled', 'true', 'payments')        ON CONFLICT (key) DO NOTHING;
INSERT INTO store_settings (key, value, category) VALUES
  ('stripe_3ds_threshold_brl', '500.00', 'payments') ON CONFLICT (key) DO NOTHING;
INSERT INTO store_settings (key, value, category) VALUES
  ('stripe_3ds_mode', 'automatic', 'payments')      ON CONFLICT (key) DO NOTHING;

-- Q.5.2 Campo 3DS em orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS three_ds_triggered boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS three_ds_status varchar(20) DEFAULT NULL
    CHECK (three_ds_status IN ('success', 'failed', 'attempted', 'not_supported', NULL));

-- Q.5.3 Log de expirações Pix
CREATE TABLE IF NOT EXISTS pix_expiry_log (
  id                      uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id                uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  expired_at              timestamptz DEFAULT now(),
  pix_expiry_minutes_used integer NOT NULL,
  cron_run_at             timestamptz DEFAULT now()
);

-- Q.5.4 RLS pix_expiry_log
ALTER TABLE pix_expiry_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_read_pix_log" ON pix_expiry_log
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin' OR current_role = 'service_role');
CREATE POLICY "service_insert_pix_log" ON pix_expiry_log
  FOR INSERT WITH CHECK (current_role = 'service_role');

-- Q.5.5 Índices
CREATE INDEX IF NOT EXISTS idx_orders_pix_pending ON orders(payment_method, payment_status, created_at)
  WHERE payment_method = 'pix' AND payment_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_orders_three_ds ON orders(three_ds_triggered)
  WHERE three_ds_triggered = true;
```

---

## Integração com Admin Sidebar

As rotas deste EPIC devem ser adicionadas ao sidebar do admin (US-K.1 do EPIC-03):

```
/admin/financeiro              → Financeiro (ícone: DollarSign)
  /admin/financeiro/pagamentos     → Métodos de Pagamento + 3DS
  /admin/financeiro/produtos       → Performance de Produtos
  /admin/financeiro/lucratividade  → Lucratividade (Fase 2)

/admin/leads                   → Leads Meta (ícone: Users)
  /admin/leads/sessoes         → Sessões Individuais (Fase 2)

/admin/fidelidade              → Fidelidade (ícone: Star)
  /admin/fidelidade/campanhas  → Campanhas de Pontos

/admin/push                    → Push Notifications (ícone: Bell)

/admin/configuracoes           → Configurações (já existente)
  → seção "Pagamentos": Pix expiração + 3DS threshold (EPIC-R)
  → seção "Meta Business Manager": BM ID + Pixel + Token (EPIC-H)
```

---

## Mapa Completo de Dependências (User Stories)

| User Story | Depende de | Bloqueia |
|---|---|---|
| EPIC-Q.1 (Schema Financeiro) | EPIC-A (schema base) | EPIC-M.1, M.2 |
| EPIC-Q.2 (Schema Fidelidade) | EPIC-F (loyalty_points), EPIC-A | EPIC-N.1, N.2, N.3 |
| EPIC-Q.3 (Schema Push) | EPIC-03 (push_subscriptions) | EPIC-O.1, O.2 |
| EPIC-Q.4 (Schema Leads) | EPIC-L (behavior_events), EPIC-H.2 (utm em orders) | EPIC-P.1, P.2, P.3 |
| EPIC-M.1 (Dashboard Receita) | EPIC-Q.1 | EPIC-M.2, M.3 |
| EPIC-M.2 (Breakdown Pagamentos) | EPIC-M.1 | EPIC-M.4 |
| EPIC-M.3 (Performance Produtos) | EPIC-M.1 | EPIC-M.4 |
| EPIC-M.4 (Lucratividade) | EPIC-M.3 | — |
| EPIC-N.1 (Expiração Pontos) | EPIC-Q.2, EPIC-F | EPIC-N.3 |
| EPIC-N.2 (Campanhas Pontos) | EPIC-Q.2 | EPIC-N.3 |
| EPIC-N.3 (Gestão + Dashboard) | EPIC-N.1, N.2 | — |
| EPIC-O.1 (Criar Campanhas Push) | EPIC-Q.3, EPIC-F | EPIC-O.2 |
| EPIC-O.2 (Performance Push) | EPIC-O.1 | — |
| EPIC-P.1 (Dashboard Leads) | EPIC-Q.4, EPIC-H.2, EPIC-I.1 | EPIC-P.2, P.3 |
| EPIC-P.2 (Funil por Campanha) | EPIC-P.1 | EPIC-P.3 |
| EPIC-P.3 (Relatório Individual) | EPIC-P.2 | — |
| EPIC-R.1 (Pix Expiração Config) | EPIC-Q.5, EPIC-04 (Stripe Pix) | — |
| EPIC-R.2 (3DS v2) | EPIC-Q.5, EPIC-04 (Stripe Cards) | — |

---

## Estimativa de Esforço

| Sub-EPIC | Fase | Story Points | Complexidade |
|---|---|---|---|
| EPIC-Q — Schema SQL | MVP | 5 SP | Média (SQL + funções) |
| EPIC-M.1 — Receita Overview | MVP | 5 SP | Média |
| EPIC-M.2 — Breakdown Pagamentos | MVP | 3 SP | Baixa |
| EPIC-M.3 — Performance Produtos | Fase 2 | 5 SP | Média |
| EPIC-M.4 — Lucratividade + Export | Fase 2 | 8 SP | Alta |
| EPIC-N.1 — Expiração Pontos | Fase 2 | 5 SP | Média |
| EPIC-N.2 — Campanhas Pontos | Fase 2 | 5 SP | Média |
| EPIC-N.3 — Gestão + Dashboard | Fase 2 | 5 SP | Média |
| EPIC-O.1 — Criar Campanhas Push | Fase 2 | 8 SP | Alta |
| EPIC-O.2 — Performance Push | Fase 2 | 5 SP | Média |
| EPIC-P.1 — Dashboard Leads Meta | MVP | 8 SP | Alta |
| EPIC-P.2 — Funil por Campanha | Fase 2 | 8 SP | Alta |
| EPIC-P.3 — Relatório Individual | Fase 2 | 5 SP | Média |
| EPIC-R.1 — Pix Expiração Config | MVP | 8 SP | Alta |
| EPIC-R.2 — 3DS v2 Cartão | Fase 2 | 8 SP | Alta |
| **TOTAL** | | **91 SP** | |

---

## Cobertura Pós EPIC-04

Com este documento (incluindo EPIC-R), a cobertura total do escopo sobe de **~92% para 100%**:

| Área anteriormente incompleta | Cobertura após EPIC-04 |
|---|---|
| `/admin/financeiro` | ✅ 100% (EPIC-M) |
| Programa de pontos/fidelidade | ✅ 100% (EPIC-F + EPIC-N) |
| Campanhas push notification | ✅ 100% (EPIC-O) |
| Leads Meta + indicadores de aquisição | ✅ 100% (EPIC-P — nova feature confirmada PO) |
| Pix com expiração configurável | ✅ 100% (EPIC-R.1) |
| 3DS v2 para transações de alto valor | ✅ 100% (EPIC-R.2) |

**Cobertura total acumulada (EPIC-01 + 02 + 03 + 04): 100%**

Todos os módulos do escopo do PRD Gabinete FC estão documentados com User Stories, critérios de aceitação e schema SQL. O roadmap está completo para sprint planning.

---

*Documento gerado por @pm (Product Manager) — Synkra AIOS v2.0*
*Data: 2026-04-16*
*Atualizado: 2026-04-16 — EPIC-R adicionado (Pagamentos Avançados). Cobertura: 100%.*
*Próximo passo: QA-diagnóstico-EPIC-v4.0 ou Stories individuais para sprint MVP*
