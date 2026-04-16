# EPIC-03: Analytics, Marketing Avançado e Decisões de Produto — Gabinete FC

**Versão:** 1.0
**Data:** 2026-04-16
**Autor:** @pm (Product Manager) — Synkra AIOS
**Status:** Draft para Revisão
**Contexto:** Terceiro documento do roadmap Gabinete FC. Cobre decisões de produto confirmadas pelo PO, integração completa com Meta Business Manager (Pixel + CAPI), analytics de comportamento próprio no Supabase, heatmap zero custo, arquitetura definitiva de navegação do painel admin e schema SQL de suporte.

---

## Índice de Sub-EPICs

| Sub-EPIC | Título | Fase | Prioridade |
|---|---|---|---|
| EPIC-G | Decisões de Produto Confirmadas | MVP + Fase 2 | Alta |
| EPIC-H | Meta Business Manager (Pixel + CAPI) | MVP + Fase 2 | Alta |
| EPIC-I | Analytics de Comportamento Próprio | MVP + Fase 2 | Média |
| EPIC-J | Heatmap Próprio (Zero Custo) | Fase 2 | Média |
| EPIC-K | Arquitetura de Navegação do Admin | MVP | Alta |
| EPIC-L | Schema Complementar do EPIC-03 | MVP | Crítica |

---

## Mapa de Dependências

```
EPIC-01 + EPIC-A (base)
        ↓
   EPIC-L (schema — bloqueia tudo neste epic)
        ↓
   EPIC-K (sidebar/navegação)
        ↓
[EPIC-G || EPIC-H || EPIC-I] (MVP — paralelo)
        ↓
   [EPIC-J || EPIC-H Fase 2 || EPIC-I Fase 2] (paralelo)
```

---

---

# EPIC-G: Decisões de Produto Confirmadas (MVP + Fase 2)

**Descrição:** Implementações das decisões definitivas confirmadas pelo Product Owner. Cobre o sistema VIP completo, exclusão de conta via soft delete conforme LGPD/CDC, indicador de social proof "X pessoas viram este produto" e o fluxo de email de carrinho abandonado.

**Fase:** MVP (G.1, G.2, G.3) + Fase 2 (G.4)
**Prioridade:** Alta
**Dependências:** EPIC-L (US-L.1)

---

### US-G.1 — Sistema VIP Completo

**Como** gestor de marketing,
**Quero** um sistema de clientes VIP com critérios configuráveis, badge visual e cupons exclusivos,
**Para** recompensar clientes fiéis e aumentar a recorrência de compra.

**Prioridade:** MVP
**Dependências:** US-L.1, US-01.2 (tabela users), EPIC-04 (tabela orders)

**Critérios de Aceitação:**
- [ ] Campo `is_vip` boolean default false adicionado à tabela `users`
- [ ] Campo `vip_since` timestamptz nullable adicionado à tabela `users`
- [ ] Configurações em `store_settings`: `vip_min_orders` integer default 2, `vip_min_revenue` decimal default 500.00
- [ ] Cron job diário (Vercel Cron) executa a query: `UPDATE users SET is_vip = true, vip_since = now() WHERE id IN (SELECT user_id FROM orders WHERE status = 'delivered' GROUP BY user_id HAVING count(*) >= [vip_min_orders]) OR id IN (SELECT user_id FROM orders WHERE payment_status = 'paid' GROUP BY user_id HAVING sum(total) >= [vip_min_revenue])`
- [ ] Usuários que perderem o critério NÃO perdem o badge VIP (uma vez VIP, sempre VIP — campo `vip_since` é preservado)
- [ ] Na área do cliente (`/minha-conta`): badge dourado "VIP" visível quando `is_vip = true`
- [ ] Mensagem exibida ao VIP: "Você é um cliente VIP! Aproveite descontos exclusivos."
- [ ] Aba "Cupons VIP" na área do cliente exibindo apenas cupons onde `only_vip = true` e o cliente é VIP
- [ ] Campo `only_vip` boolean default false adicionado à tabela `coupons`
- [ ] No admin (`/admin/clientes`): filtro por "VIP" na lista de clientes
- [ ] No admin: badge "VIP" dourado na linha do cliente na tabela
- [ ] No admin (`/admin/promocoes`): ao criar/editar cupom, campo toggle "Restrito a clientes VIP" que seta `only_vip = true`
- [ ] Cupom com `only_vip = true` retorna erro 403 se aplicado por cliente não-VIP no checkout
- [ ] Threshold VIP editável em `/admin/configuracoes` sem necessidade de deploy
- [ ] Ao tornar-se VIP, cliente recebe email automático com assunto "Você é um cliente VIP do Gabinete FC!"

**Notas Técnicas:**
- Rota do cron: `/api/cron/vip-recalculate` — protegida com `Authorization: Bearer [CRON_SECRET]`
- Configuração no `vercel.json`: `"crons": [{"path": "/api/cron/vip-recalculate", "schedule": "0 2 * * *"}]` (todo dia às 02:00 UTC)
- Ler `vip_min_orders` e `vip_min_revenue` de `store_settings` dentro do cron, nunca hardcoded
- Validação do cupom VIP deve ocorrer no Server Action do checkout, não apenas no frontend

---

### US-G.2 — Soft Delete LGPD — Exclusão de Conta

**Como** cliente logado,
**Quero** poder solicitar a exclusão da minha conta com confirmação clara do tratamento legal dos meus dados,
**Para** exercer meu direito à exclusão conforme a LGPD.

**Prioridade:** MVP
**Dependências:** US-L.1, US-01.3 (autenticação), EPIC-03 (área do cliente)

**Critérios de Aceitação:**
- [ ] Campos adicionados à tabela `users`: `is_active` boolean default true, `deleted_at` timestamptz nullable, `deletion_requested_at` timestamptz nullable
- [ ] Botão "Excluir minha conta" visível em `/minha-conta/perfil`
- [ ] Ao clicar: modal de confirmação exibe o texto exato: "Sua conta será desativada. Seus dados serão mantidos por 5 anos conforme exigido pela legislação brasileira (CDC) e depois apagados definitivamente."
- [ ] Modal requer que o cliente digire sua senha atual para confirmar a exclusão
- [ ] Ao confirmar: campos `is_active = false`, `deleted_at = now()`, `deletion_requested_at = now()` são atualizados via Server Action
- [ ] Sessão invalidada imediatamente após confirmação (Supabase Auth: `signOut()`)
- [ ] Cliente é redirecionado para `/` com toast: "Sua conta foi desativada. Seus dados serão mantidos por 5 anos conforme exigido pela legislação brasileira."
- [ ] Email automático enviado ao cliente com confirmação da desativação e informação sobre retenção dos dados
- [ ] Middleware do Next.js verifica `is_active` ao autenticar: se `is_active = false`, bloqueia login com mensagem "Esta conta foi desativada."
- [ ] Cron job mensal (`/api/cron/lgpd-hard-delete`): busca `users WHERE deleted_at < now() - interval '5 years'` e executa hard delete em cascata
- [ ] Hard delete anonimiza dados de pedidos: `full_name = 'DADOS_REMOVIDOS'`, `email = 'removido@anonimizado.br'`, `phone = null`, `cpf = null`
- [ ] Hard delete remove o usuário do Supabase Auth via `supabase.auth.admin.deleteUser(id)`
- [ ] No admin (`/admin/clientes`): tab "Clientes Desativados" mostra usuários com `is_active = false` para histórico de pedidos
- [ ] Admin não pode reativar conta — operação é irreversível pelo sistema (apenas via suporte manual com evidência)

**Notas Técnicas:**
- RLS: usuário só pode executar o soft delete no próprio registro (`auth.uid() = id`)
- O cron de hard delete deve rodar com service role key (bypass RLS) — nunca com anon key
- Verificação de `is_active` no middleware: chamar `supabase.from('users').select('is_active').eq('id', user.id).single()` na edge middleware
- Cron job mensal configurado em `vercel.json`: `"schedule": "0 3 1 * *"` (dia 1 de cada mês às 03:00 UTC)

---

### US-G.3 — Indicador Social Proof "X Pessoas Viram"

**Como** visitante navegando em uma PDP,
**Quero** ver um indicador discreto de quantas pessoas estão vendo o produto,
**Para** ter uma sensação de urgência e demanda que apoie minha decisão de compra.

**Prioridade:** MVP
**Dependências:** US-L.1, EPIC-02 (PDP — page de produto)

**Critérios de Aceitação:**
- [ ] Configurações em `store_settings`: `social_proof_enabled` boolean default true, `social_proof_min_views` integer default 12, `social_proof_max_views` integer default 47, `social_proof_min_product_age_days` integer default 30
- [ ] Indicador exibido APENAS se `social_proof_enabled = true`
- [ ] Indicador exibido APENAS em produtos com `created_at < now() - interval '[social_proof_min_product_age_days] days'`
- [ ] Número gerado server-side via Server Component: `Math.floor(Math.random() * (max - min + 1)) + min` usando os valores de `store_settings`
- [ ] Revalidação via ISR: `revalidate: 900` (15 minutos) — número muda a cada 15 minutos, não a cada request
- [ ] Texto exibido: "👁️ {N} pessoas estão vendo este produto agora"
- [ ] Posicionamento: badge discreto imediatamente abaixo do nome do produto na PDP
- [ ] Estilo: badge pequeno, fundo cinza claro, ícone de olho, texto em cinza escuro — não competir visualmente com o preço
- [ ] Configurações editáveis em `/admin/configuracoes` sem deploy
- [ ] Quando `social_proof_enabled = false` no admin, o badge desaparece imediatamente na próxima revalidação ISR (máximo 15 min)
- [ ] Produto com menos de 30 dias de criação não exibe o badge (nem placeholder)

**Notas Técnicas:**
- Implementar como Server Component separado `<SocialProofBadge productId={id} createdAt={createdAt} />`
- Buscar `store_settings` uma vez por revalidação (não por produto): usar `unstable_cache` do Next.js com tag `store-settings`
- O número é sintético — não há rastreamento real de usuários simultâneos

---

### US-G.4 — Email de Carrinho Abandonado

**Como** gestor de marketing,
**Quero** um sistema automatizado de recuperação de carrinhos abandonados com até 3 emails escalonados,
**Para** recuperar 5–15% dos carrinhos não concluídos e aumentar a receita.

**Prioridade:** Fase 2
**Dependências:** US-L.1, EPIC-04 (checkout), EPIC-05 (email transacional), US-H.2 (UTM capture)

**Critérios de Aceitação:**
- [ ] Tabela `abandoned_carts` criada conforme schema definido em US-L.1
- [ ] No checkout (etapa 1 — dados pessoais): quando cliente informa o email, fazer upsert em `abandoned_carts` com snapshot dos itens (`cart_items` jsonb), `cart_total`, `utm_campaign` do cookie `_gfc_utm`
- [ ] Se pedido for concluído (payment_status = 'paid'): atualizar `recovered_at = now()` no registro de `abandoned_carts` — nenhum email adicional é enviado
- [ ] Cron job a cada hora (`/api/cron/abandoned-carts`): buscar carrinhos onde `recovered_at IS NULL AND email_count < 3`
- [ ] Email 1: enviado quando `created_at < now() - interval '1 hour'` e `email_count = 0` — assunto: "Você esqueceu algo no Gabinete FC" — conteúdo: lista de itens do carrinho com imagens e botão "Finalizar compra"
- [ ] Email 2: enviado quando `last_email_sent_at < now() - interval '24 hours'` e `email_count = 1` — assunto: "Seu carrinho ainda está aqui — 5% de desconto para você" — gerar cupom único de 5% de desconto com validade de 48h e `max_uses = 1`, incluir código no email
- [ ] Email 3: enviado quando `last_email_sent_at < now() - interval '72 hours'` e `email_count = 2` — assunto: "Última chance: seu carrinho está esperando" — conteúdo de urgência sem novo cupom
- [ ] Após Email 3, campo `email_count = 3`: nenhum email adicional enviado para este carrinho
- [ ] Após 7 dias sem recuperação: status efetivo = "Expirado" (não há campo, calcular na query: `created_at < now() - interval '7 days' AND recovered_at IS NULL`)
- [ ] No admin (`/admin/carrinhos-abandonados`): tabela com colunas: Email, Itens (count), Valor, Data do Abandono, Emails Enviados, Status (Ativo/Recuperado/Expirado)
- [ ] Botão "Enviar email agora" na linha do carrinho: dispara o próximo email da sequência manualmente (respeitando `email_count`)
- [ ] Métricas no topo da página: "Total Abandonados", "Taxa de Recuperação (%)", "Receita Recuperada (R$)"
- [ ] Link de retorno ao carrinho no email usa parâmetro UTM: `?utm_source=email&utm_medium=abandoned_cart&utm_campaign=recover_[email_count+1]`
- [ ] Unsubscribe: cada email contém link "Não quero receber lembretes" que seta `email_count = 3` (cancela sequência sem deletar o registro)

**Notas Técnicas:**
- Cupom de 5% para Email 2: criar via inserção direta em `coupons` — `code = 'VOLTE-[uuid_curto]'`, `discount_type = 'percentage'`, `discount_value = 5`, `max_uses = 1`, `expires_at = now() + interval '48 hours'`, `only_vip = false`
- Cron protegido com Bearer token igual ao padrão dos outros crons
- Template de email: usar Resend com React Email template

---

---

# EPIC-H: Meta Business Manager — Integração Completa

**Descrição:** Integração de duas camadas com a plataforma Meta: Fase 1 com Meta Pixel client-side (5 eventos) e captura de UTMs persistida no pedido; Fase 2 com Meta Conversions API server-side para deduplicação e aumento de match rate, mais dashboard de performance de mídia no admin.

**Fase:** MVP (H.1, H.2) + Fase 2 (H.3, H.4)
**Prioridade:** Alta
**Dependências:** EPIC-L (US-L.1), EPIC-04 (checkout/pedidos), EPIC-06 (admin)

---

### US-H.1 — Configuração Meta no Admin + Pixel Client-side

**Como** gestor de marketing,
**Quero** vincular o Meta Business Manager e configurar o Pixel diretamente no painel admin,
**Para** ativar rastreamento e CAPI sem depender de deploy ou acesso ao código.

**Prioridade:** MVP
**Dependências:** US-L.1 (campos `meta_*` em store_settings), US-01.1 (Next.js setup)

**Critérios de Aceitação:**

**[Seção Meta no Admin — `/admin/configuracoes` tab "Integrações"]**
- [ ] Aba "Integrações" ou seção "Meta Business Manager" criada em `/admin/configuracoes`
- [ ] Campo **Business Manager ID** (`meta_bm_id` varchar(50)): onde o admin informa o ID do BM do Meta (encontrado em business.facebook.com → Configurações → Informações do negócio)
- [ ] Campo **Pixel ID** (`meta_pixel_id` varchar(50)): ID do Pixel vinculado ao BM
- [ ] Campo **Access Token** (`meta_access_token` text): token de acesso do usuário do sistema gerado no BM — exibido mascarado (apenas últimos 4 chars) após salvo
- [ ] Ao salvar: toast "Configurações do Meta salvas com sucesso"
- [ ] Botão "Testar conexão": faz chamada test event à Graph API com evento `Test` — exibe sucesso/falha inline
- [ ] Se qualquer campo obrigatório (BM ID ou Pixel ID) estiver vazio: botão "Salvar" desabilitado com mensagem de validação
- [ ] Instrução visível: texto de ajuda com link para o Meta Events Manager (`business.facebook.com/events_manager`) explicando onde encontrar cada ID
- [ ] O vínculo entre a loja e o Meta é feito EXCLUSIVAMENTE pelo painel admin — nenhuma configuração via arquivo `.env` ou variável de ambiente para esses campos

**[Meta Pixel Client-side]**
- [ ] Meta Pixel ID lido de `store_settings` via Server Component no layout raiz (`app/layout.tsx`) — NÃO usar variável `NEXT_PUBLIC_*`
- [ ] Script do Meta Pixel injetado via `<Script strategy="afterInteractive">` no `<head>` somente quando `meta_pixel_id` não for nulo/vazio
- [ ] Evento `PageView`: disparado automaticamente pelo script base do Pixel em toda página
- [ ] Evento `ViewContent`: disparado na PDP ao montar o componente — payload: `{ content_ids: [product_id], content_type: 'product', value: price, currency: 'BRL', content_name: product_name }`
- [ ] Evento `AddToCart`: disparado ao adicionar item ao carrinho — payload: `{ content_ids: [product_id], content_type: 'product', value: price, currency: 'BRL' }`
- [ ] Evento `InitiateCheckout`: disparado ao entrar em `/checkout` — payload: `{ value: cart_total, currency: 'BRL', num_items: cart_items_count }`
- [ ] Evento `Purchase`: disparado na página `/checkout/confirmacao/[orderId]` — payload: `{ value: order_total, currency: 'BRL', content_ids: [product_ids], content_type: 'product', order_id: order_id }`
- [ ] Deduplicação preparada: cada evento recebe `eventID` gerado com `crypto.randomUUID()` no frontend — passado como `fbq('track', 'EventName', data, { eventID: uuid })`
- [ ] O `eventID` do evento `Purchase` é passado como parâmetro ao Server Action de CAPI para garantir deduplicação (resolve M-07 do QA)
- [ ] O `eventID` dos demais eventos (ViewContent, AddToCart, InitiateCheckout) fica disponível via contexto React para ser consumido pelo Server Action espelhado
- [ ] Se `meta_pixel_id` estiver vazio/nulo no `store_settings`, nenhum script do Pixel é injetado
- [ ] Ao atualizar `meta_pixel_id` no admin, a mudança é refletida no próximo request (sem cache agressivo no server component de layout)

**Notas Técnicas:**
- `store_settings` é key-value: campos `meta_bm_id`, `meta_pixel_id`, `meta_access_token` inseridos com `category = 'meta'`
- Server Component no layout lê `store_settings` via `supabase.from('store_settings').select('key, value').eq('category', 'meta')` com `cache: 'no-store'`
- `meta_access_token` NUNCA retornado ao frontend — lido somente em Server Actions
- Criar hook `useMetaPixel()` com funções: `trackViewContent(product)`, `trackAddToCart(product)`, `trackInitiateCheckout(cart)`, `trackPurchase(order)` — cada função gera o `eventID` e retorna o UUID gerado
- Botão "Testar conexão": Server Action chama `POST https://graph.facebook.com/v19.0/{pixel_id}/events` com evento de teste `{ data: [{ event_name: 'TestEvent', event_time: ..., action_source: 'website' }], test_event_code: 'TEST...' }`

---

### US-H.2 — UTM Capture + Persistência no Pedido

**Como** gestor de marketing,
**Quero** que os parâmetros UTM da URL sejam capturados e associados ao pedido final,
**Para** atribuir corretamente cada venda à campanha de marketing que trouxe o cliente.

**Prioridade:** MVP
**Dependências:** US-01.1, US-L.1 (campos UTM em orders), EPIC-04 (criação de pedido)

**Critérios de Aceitação:**
- [ ] Campos adicionados à tabela `orders`: `utm_source varchar(100)`, `utm_medium varchar(100)`, `utm_campaign varchar(100)`, `utm_content varchar(100)`, `utm_term varchar(100)`
- [ ] Componente/hook `useUTMCapture` executado no layout raiz: lê `window.location.search` e extrai os 5 parâmetros UTM
- [ ] Se UTMs presentes na URL: salvar em cookie `_gfc_utm` com JSON `{source, medium, campaign, content, term}` e Max-Age de 30 dias (2592000 segundos), SameSite=Lax
- [ ] Se UTMs NÃO presentes na URL: não apagar cookie existente (preservar último toque)
- [ ] Se nova visita com UTMs diferentes: sobrescrever o cookie (modelo last-touch)
- [ ] Ao criar pedido no Server Action do checkout: ler cookie `_gfc_utm`, parsear JSON e salvar os valores nos campos UTM da tabela `orders`
- [ ] Se cookie não existir ou for inválido: salvar `null` nos campos UTM (pedido orgânico/direto)
- [ ] No admin (`/admin/pedidos`): coluna "Origem" exibindo `utm_campaign` do pedido (truncado a 30 chars com tooltip)
- [ ] Ao clicar na coluna "Origem": exibir todos os 5 campos UTM em tooltip ou drawer lateral
- [ ] Cookie `_gfc_utm` é httpOnly: false (precisa ser lido pelo JavaScript client-side e enviado ao Server Action)

**Notas Técnicas:**
- Leitura do cookie no Server Action: `cookies().get('_gfc_utm')?.value`
- O cookie deve ser setado via JavaScript (client-side): `document.cookie = '_gfc_utm=...; max-age=2592000; path=/; SameSite=Lax'`
- Validar JSON no Server Action antes de salvar — usar try/catch em `JSON.parse()`
- Índice criado em `orders(utm_campaign)` e `orders(utm_source)` para queries de performance (ver US-L.1)

---

### US-H.3 — Meta Conversions API (CAPI) Server-side com Deduplicação

**Como** gestor de marketing,
**Quero** que os mesmos 5 eventos do Pixel sejam enviados também server-side via CAPI com o mesmo eventID,
**Para** recuperar eventos bloqueados por ad blockers e melhorar o match rate com dados hasheados de clientes.

**Prioridade:** Fase 2
**Dependências:** US-H.1 (seção Meta no admin + eventIDs), US-L.1 (campos `meta_access_token`, `meta_pixel_id`, `meta_bm_id` em store_settings)

**Critérios de Aceitação:**
- [ ] CAPI implementado via Server Actions do Next.js — nunca exposto no bundle do cliente
- [ ] CAPI envia **4 eventos** server-side (NÃO inclui PageView — evento inviável server-side): `ViewContent`, `AddToCart`, `InitiateCheckout`, `Purchase`
- [ ] Para cada evento CAPI, existe um Server Action espelhado que envia ao endpoint: `https://graph.facebook.com/v19.0/{pixel_id}/events`
- [ ] Payload CAPI inclui o mesmo `eventID` gerado no frontend (passado como parâmetro do Server Action) — garantindo deduplicação Meta
- [ ] Fluxo `eventID` do Purchase: gerado no Client Component → armazenado em estado → passado explicitamente como parâmetro ao Server Action de confirmação de pedido
- [ ] Para clientes autenticados: payload inclui `em` (SHA-256 do email) e `ph` (SHA-256 do telefone sem formatação) no objeto `user_data`
- [ ] Email e telefone NUNCA enviados em texto plano — apenas hash SHA-256
- [ ] Hash calculado server-side: `crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex')`
- [ ] Campos opcionais no `user_data` CAPI: `client_ip_address` (extraído do header `x-forwarded-for`), `client_user_agent` (header `user-agent`), `fbc` (cookie `_fbc`), `fbp` (cookie `_fbp`)
- [ ] `meta_access_token` lido exclusivamente via Server Action — RLS na tabela `store_settings` garante que anon key NÃO consegue ler campos `category = 'meta'`
- [ ] RLS policy em `store_settings`: `SELECT WHERE category != 'meta' OR auth.role() = 'authenticated'` para a anon key; service_role bypassa
- [ ] Evento `Purchase` CAPI: disparado no Server Action de confirmação de pedido com `value`, `currency: 'BRL'`, `order_id`
- [ ] Falha no CAPI não bloqueia o fluxo principal (try/catch com log de erro, não throw)
- [ ] Log de erros CAPI em tabela `capi_error_log` (id, event_type, error_message, payload_hash, created_at) para diagnóstico
- [ ] Meta BM ID, Pixel ID e Access Token: todos configuráveis no painel admin em `/admin/configuracoes` (US-H.1) sem deploy

**Notas Técnicas:**
- Usar `fetch` nativo do Node.js 18+ para chamar o endpoint da Meta Graph API
- Estrutura do payload: `{ data: [{ event_name, event_time, event_id, action_source: 'website', event_source_url, user_data: { em, ph, client_ip_address, client_user_agent, fbc, fbp } }], access_token }`
- `event_time`: timestamp Unix em segundos — `Math.floor(Date.now() / 1000)`
- Versão da API: `v19.0` — atualizar conforme depreciações da Meta

---

### US-H.4 — Dashboard "Performance de Mídia"

**Como** gestor de marketing,
**Quero** um dashboard consolidado no admin com métricas de campanhas UTM, funil Meta e ROAS estimado,
**Para** tomar decisões de investimento em mídia baseadas em dados reais de atribuição.

**Prioridade:** Fase 2
**Dependências:** US-H.2 (dados UTM em orders), US-H.3 (funil CAPI), US-I.1 (behavior_events)

**Critérios de Aceitação:**
- [ ] Rota `/admin/midia` com layout de dashboard e tabs para sub-seções
- [ ] Filtro de período global: "Hoje", "Últimos 7 dias", "Últimos 30 dias", "Personalizado" (date picker)
- [ ] Card de métrica: "Pedidos por Campanha" — query agrupada por `utm_campaign`, ordenada por count desc
- [ ] Card de métrica: "Receita por Campanha" — `SUM(total) GROUP BY utm_campaign`
- [ ] Campo "Custo da Campanha (R$)": campo editável no admin por `utm_campaign` salvo em tabela `campaign_costs` (utm_campaign varchar PK, cost decimal, period_start date, period_end date)
- [ ] Card de métrica: "CPA por Campanha" — `campaign_cost / order_count`
- [ ] Card de métrica: "ROAS Estimado" — `campaign_revenue / campaign_cost` (exibir "N/A" se custo não informado)
- [ ] Tabela "Produtos Mais Vendidos por Origem": cruzar `order_items` com `utm_source` dos pedidos — top 5 produtos por utm_source
- [ ] Funil de conversão Meta (dados do Supabase): pageviews → add_to_cart → checkout_started → purchase — taxa entre cada etapa
- [ ] Gráfico de barras: receita por campanha no período (usar Recharts — já usado no projeto)
- [ ] Tabela de pedidos na aba `/admin/midia/campanhas`: colunas order_id, data, valor, utm_campaign, utm_source, utm_medium
- [ ] Aba `/admin/midia/roas`: tabela de campanhas com custo inserido manualmente e ROAS calculado
- [ ] Dados atualizados a cada 5 minutos (revalidação do Server Component) ou botão "Atualizar" manual

**Notas Técnicas:**
- Todas as queries de analytics devem usar `supabase.rpc()` com funções SQL para performance — evitar múltiplas round-trips
- Tabela `campaign_costs` deve ser criada em US-L.1
- Recharts: componente `<BarChart>` para receita por campanha, `<FunnelChart>` ou barras horizontais para o funil

---

---

# EPIC-I: Analytics de Comportamento Próprio

**Descrição:** Sistema proprietário de captura de eventos de comportamento no Supabase, com dashboard de funil de conversão, páginas mais visitadas e análise de buscas. Zero dependência de ferramentas externas pagas.

**Fase:** MVP (I.1) + Fase 2 (I.2, I.3)
**Prioridade:** Média
**Dependências:** EPIC-L (US-L.1), EPIC-K (admin navigation)

---

### US-I.1 — Captura de Eventos de Comportamento no Supabase

**Como** sistema,
**Quero** registrar automaticamente os eventos de comportamento dos visitantes em uma tabela própria do Supabase,
**Para** ter dados de analytics independentes de ferramentas externas e baseados na realidade do nosso funil.

**Prioridade:** MVP
**Dependências:** US-L.1 (tabela behavior_events)

**Critérios de Aceitação:**
- [ ] Tabela `behavior_events` criada conforme schema definido em US-L.1
- [ ] `session_id` gerado com `crypto.randomUUID()` ao iniciar sessão — persistido em `sessionStorage` (não sobrevive a fechamento de aba)
- [ ] Evento `pageview`: capturado via `usePathname()` + `useEffect` no layout raiz — disparado em toda troca de rota, incluindo navegações client-side
- [ ] Evento `product_view`: capturado no componente PDP ao montar — `event_data: { product_id, product_name, price }`
- [ ] Evento `add_to_cart`: capturado na função de adicionar ao carrinho — `event_data: { product_id, size, price, quantity }`
- [ ] Evento `checkout_started`: capturado ao entrar em `/checkout` — `event_data: { cart_total, item_count }`
- [ ] Evento `search`: capturado ao realizar busca — `event_data: { query, results_count, has_results: boolean }`
- [ ] Campos `utm_source` e `utm_medium` preenchidos no evento a partir do cookie `_gfc_utm` (se existir)
- [ ] Campo `referrer` preenchido com `document.referrer` no evento `pageview`
- [ ] Campos `viewport_w` e `viewport_h` preenchidos com `window.innerWidth` e `window.innerHeight`
- [ ] Envio assíncrono via Supabase client com anon key — falha no envio não bloqueia UX
- [ ] RLS: política `INSERT` pública (anon key pode inserir) — política `SELECT` apenas para admins
- [ ] Não capturar eventos em rotas `/admin/*`
- [ ] Não capturar eventos se `navigator.doNotTrack === '1'`

**Notas Técnicas:**
- Criar hook `useBehaviorTracker()` que encapsula toda a lógica de captura
- O hook deve ser instanciado uma única vez no layout raiz como Client Component
- Usar `supabase.from('behavior_events').insert(event)` — sem await na cadeia principal (fire-and-forget)
- `user_id` preenchido se `supabase.auth.getUser()` retornar usuário autenticado — caso contrário `null`

---

### US-I.2 — Funil de Conversão e Páginas Mais Vistas no Admin

**Como** administrador,
**Quero** visualizar o funil de conversão completo e as páginas mais visitadas no painel admin,
**Para** identificar onde os usuários abandonam o fluxo de compra e quais páginas geram mais engajamento.

**Prioridade:** Fase 2
**Dependências:** US-I.1 (dados em behavior_events), US-K.1 (sidebar navigation)

**Critérios de Aceitação:**
- [ ] Rota `/admin/comportamento/funil` implementada
- [ ] Funil de conversão exibido como gráfico de barras horizontais decrescentes: pageviews → product_views → add_to_cart → checkout_started → purchase
- [ ] Dados do funil calculados via query no `behavior_events` (exceto `purchase` que vem de `orders`)
- [ ] Taxa de conversão exibida entre cada etapa: "(etapa_n / etapa_n-1) * 100%"
- [ ] Filtro de período: "Últimos 7 dias", "Últimos 30 dias", "Personalizado"
- [ ] Rota `/admin/comportamento/paginas` implementada
- [ ] Top 10 páginas por pageviews no período — query: `SELECT page_path, count(*) FROM behavior_events WHERE event_type = 'pageview' AND created_at >= [inicio] GROUP BY page_path ORDER BY count DESC LIMIT 10`
- [ ] Comparativo com período anterior: exibir delta percentual (▲ 12% ou ▼ 5%) ao lado de cada página
- [ ] Tabela com colunas: Página, Visualizações (período atual), Visualizações (período anterior), Delta
- [ ] Visualização de sessões únicas por página: `COUNT(DISTINCT session_id)`
- [ ] Dados atualizados com revalidação de 5 minutos

**Notas Técnicas:**
- Usar `supabase.rpc('get_funnel_data', { start_date, end_date })` para evitar múltiplas queries — definir função SQL em US-L.1
- O passo `purchase` do funil deve vir de `COUNT(*) FROM orders WHERE payment_status = 'paid'` — não do behavior_events

---

### US-I.3 — Dashboard de Buscas com e sem Resultado

**Como** administrador,
**Quero** visualizar todas as buscas realizadas no site, separando as que retornaram resultados das que não retornaram,
**Para** identificar termos populares sem cobertura de produtos e oportunidades de catálogo.

**Prioridade:** Fase 2
**Dependências:** US-I.1 (eventos search em behavior_events), US-K.1

**Critérios de Aceitação:**
- [ ] Rota `/admin/comportamento/buscas` implementada
- [ ] Tabela principal: Query de busca, Total de buscas, % sem resultado, Última vez buscada
- [ ] Ordenação padrão: por total de buscas (decrescente)
- [ ] Filtro: "Com resultado" / "Sem resultado" / "Todos"
- [ ] Buscas sem resultado destacadas com badge vermelho na coluna "% sem resultado" quando acima de 50%
- [ ] Query SQL: `SELECT event_data->>'query' as query, count(*) as total, SUM(CASE WHEN (event_data->>'has_results')::boolean = false THEN 1 ELSE 0 END) * 100.0 / count(*) as pct_sem_resultado FROM behavior_events WHERE event_type = 'search' AND created_at >= [inicio] GROUP BY query ORDER BY total DESC`
- [ ] Filtro de período: "Últimos 7 dias", "Últimos 30 dias", "Personalizado"
- [ ] Card de destaque: "Top 5 buscas sem nenhum resultado" no topo da página
- [ ] Botão "Criar produto para esta busca" ao lado de cada term sem resultado — redireciona para `/admin/produtos/novo?nome=[query]`

**Notas Técnicas:**
- O campo `event_data` é jsonb — usar operador `->>` para extrair strings
- Criar índice GIN em `behavior_events(event_data)` para performance das queries jsonb (ver US-L.1)

---

---

# EPIC-J: Heatmap Próprio (Zero Custo)

**Descrição:** Sistema de captura de eventos de mouse (click, mousemove, scroll_depth, rage_click) no frontend com renderização de heatmap no admin usando heatmap.js via CDN. Sem custo de ferramenta externa, dados proprietários no Supabase.

**Fase:** Fase 2
**Prioridade:** Média
**Dependências:** EPIC-L (US-L.1), US-K.1 (sidebar navigation), EPIC-I.1 (session_id pattern)

---

### US-J.1 — heatmap-tracker.ts — Captura de Eventos no Frontend

**Como** sistema,
**Quero** capturar cliques, movimentos de mouse, profundidade de scroll e rage clicks no frontend com batching para o Supabase,
**Para** ter dados de comportamento visual que permitam entender como os usuários interagem com cada página.

**Prioridade:** Fase 2
**Dependências:** US-L.1 (tabela heatmap_events)

**Critérios de Aceitação:**
- [ ] Tabela `heatmap_events` criada conforme schema definido em US-L.1
- [ ] Arquivo `lib/heatmap-tracker.ts` criado com classe `HeatmapTracker`
- [ ] Evento `click`: capturado em `document.addEventListener('click', handler)` — `x_pct = (event.pageX / document.body.scrollWidth) * 100`, `y_pct = (event.pageY / document.body.scrollHeight) * 100`
- [ ] Evento `scroll_depth`: capturado em `window.addEventListener('scroll', handler)` — marcos: 25, 50, 75 e 100% — calculado como `(window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100` — cada marco capturado no máximo UMA vez por sessão (Set de marcos já disparados)
- [ ] Evento `mousemove`: capturado com throttle de 800ms (setTimeout) — NÃO capturar se `window.matchMedia('(prefers-reduced-motion: reduce)').matches` for true
- [ ] Evento `rage_click`: detectado quando o mesmo `event.target` recebe 3+ cliques em menos de 2000ms — salvo como `event_type: 'rage_click'` — contador zerado após 2000ms sem clique no mesmo target
- [ ] Batching: eventos acumulados em array local, flush a cada 5000ms via `setInterval` — `supabase.from('heatmap_events').insert(batch)`
- [ ] Flush também executado no evento `visibilitychange` quando `document.visibilityState === 'hidden'` (usuário fecha aba)
- [ ] `session_id`: reutilizar o mesmo session_id do `useBehaviorTracker()` (compartilhado via sessionStorage key `_gfc_session`)
- [ ] `page_path`: `window.location.pathname` no momento do evento
- [ ] `viewport_w` e `viewport_h`: `window.innerWidth` e `window.innerHeight` no momento do evento
- [ ] NÃO capturar eventos em páginas `/admin/*` — verificar `window.location.pathname.startsWith('/admin')`
- [ ] RLS: política INSERT pública (anon key) — política SELECT apenas para service role/admins
- [ ] Tracker inicializado apenas uma vez via `useEffect` no layout raiz (Client Component)
- [ ] Cleanup: `removeEventListener` em todos os handlers no return do `useEffect`

**Notas Técnicas:**
- `HeatmapTracker` deve ser uma classe com métodos: `init(supabaseClient, sessionId)`, `destroy()`, `flush()`
- Rage click: usar `Map<Element, {count: number, timer: ReturnType<typeof setTimeout>}>` para rastrear por elemento
- O batching não deve exceder 100 eventos por flush para evitar payload excessivo

---

### US-J.2 — Renderização do Heatmap no Admin com heatmap.js

**Como** administrador,
**Quero** visualizar o heatmap de cliques, movimentos e scroll de qualquer página do site filtrado por período, tipo de evento e dispositivo,
**Para** identificar padrões de interação visual e otimizar o layout das páginas.

**Prioridade:** Fase 2
**Dependências:** US-J.1 (dados em heatmap_events), US-K.1 (sidebar)

**Critérios de Aceitação:**
- [ ] Rota `/admin/comportamento/heatmap` implementada
- [ ] Seletor de página: dropdown populado com `SELECT DISTINCT page_path FROM heatmap_events ORDER BY page_path` — exibir apenas páginas com dados
- [ ] Seletor de tipo de evento: radio/tabs — Click, Mousemove, Rage Click, Scroll Depth
- [ ] Seletor de período: "Últimos 7 dias", "Últimos 30 dias", "Personalizado"
- [ ] Seletor de dispositivo: "Todos", "Mobile (< 768px)", "Desktop (>= 768px)" — filtro por `viewport_w`
- [ ] Contador: "X eventos no período" exibido acima do heatmap
- [ ] Renderização: `<iframe>` da página selecionada com `pointer-events: none` e `scrolling: no` — somente leitura
- [ ] heatmap.js carregado via `<Script src="https://cdnjs.cloudflare.com/ajax/libs/heatmap.js/2.0.5/heatmap.min.js" strategy="beforeInteractive">` apenas nesta rota
- [ ] Canvas do heatmap sobreposto ao iframe com `position: absolute, top: 0, left: 0` e mesmas dimensões
- [ ] Escalonamento de coordenadas: `x_render = (x_pct / 100) * iframe_current_width`, `y_render = (y_pct / 100) * iframe_current_height` — onde `iframe_current_width/height` são as dimensões atuais do iframe no admin
- [ ] Rage clicks: renderizados com cor vermelha especial — usar configuração customizada do heatmap.js: `{ gradient: { 0: 'yellow', 0.5: 'orange', 1: 'red' }, radius: 25 }` — container separado sobreposto ao canvas principal
- [ ] Scroll depth: exibido como linha horizontal amarela tracejada na posição Y correspondente ao percentual selecionado — NÃO usar pontos de calor para scroll depth
- [ ] Botão "Exportar PNG": usar `html2canvas` ou `canvas.toBlob()` para exportar o heatmap atual
- [ ] Loading state: skeleton enquanto dados são carregados do Supabase
- [ ] Mensagem "Nenhum dado para esta seleção" quando query retorna 0 registros

**Notas Técnicas:**
- Dados carregados via Server Action que faz query direta no Supabase com service role key (contornar RLS SELECT)
- Máximo de 10.000 pontos por query para performance do heatmap.js — paginar se necessário
- O iframe deve carregar a versão pública da página: `src={window.location.origin + selectedPage}`
- Redimensionamento do iframe: escutar `window.resize` e recalcular posições do canvas

---

---

# EPIC-K: Arquitetura de Navegação do Admin

**Descrição:** Definição e implementação da estrutura completa e definitiva do sidebar do painel administrativo com todas as rotas, ícones, badges de alerta e grupos de navegação.

**Fase:** MVP
**Prioridade:** Alta
**Dependências:** US-01.1 (Next.js App Router), EPIC-06 (admin base)

---

### US-K.1 — Sidebar Completo com Todas as Seções e Rotas Definitivas

**Como** administrador,
**Quero** uma navegação lateral completa e organizada no painel admin com todas as seções do sistema,
**Para** acessar qualquer funcionalidade administrativa de forma rápida e intuitiva.

**Prioridade:** MVP
**Dependências:** US-01.1

**Critérios de Aceitação:**

**Estrutura de navegação implementada:**

```
VISÃO GERAL
├── Dashboard               /admin               ícone: LayoutDashboard
├── COMPORTAMENTO (grupo colapsável)
│   ├── Funil de Conversão  /admin/comportamento/funil    ícone: TrendingUp
│   ├── Páginas Mais Vistas /admin/comportamento/paginas  ícone: Eye
│   ├── Buscas              /admin/comportamento/buscas   ícone: Search
│   └── Heatmap             /admin/comportamento/heatmap  ícone: Map
└── PERFORMANCE DE MÍDIA (grupo colapsável)
    ├── Campanhas UTM       /admin/midia/campanhas        ícone: Target
    ├── Funil Meta (CAPI)   /admin/midia/funil-meta       ícone: Filter
    └── ROAS / CPA          /admin/midia/roas             ícone: BarChart2

OPERAÇÃO
├── Pedidos                 /admin/pedidos        ícone: ShoppingBag    badge: novos pedidos
├── Produtos                /admin/produtos       ícone: Package
├── Clientes                /admin/clientes       ícone: Users
└── Estoque Físico          /admin/estoque        ícone: Warehouse

MARKETING
├── Carrinhos Abandonados   /admin/carrinhos-abandonados  ícone: ShoppingCart  badge: ativos
├── Promoções & Cupons      /admin/promocoes      ícone: Tag
└── Avaliações              /admin/avaliacoes     ícone: Star           badge: pendentes

FINANCEIRO
└── Receita & Extrato       /admin/financeiro     ícone: DollarSign

CONFIGURAÇÕES
└── Configurações           /admin/configuracoes  ícone: Settings
```

- [ ] Sidebar implementado como Server Component com Client Component interno para estado de collapse/expand
- [ ] Grupos colapsáveis com estado persistido em localStorage (`_gfc_admin_sidebar_state`)
- [ ] Item ativo destacado com `bg-primary/10 text-primary font-semibold` usando `usePathname()` para comparação
- [ ] Badge de "Novos Pedidos" em Pedidos: query `COUNT(*) FROM orders WHERE status = 'pending' AND created_at > [last_seen]` — número exibido em badge vermelho
- [ ] Badge de "Avaliações Pendentes" em Avaliações: query `COUNT(*) FROM reviews WHERE status = 'pending'`
- [ ] Badge de "Carrinhos Ativos" em Carrinhos Abandonados: query `COUNT(*) FROM abandoned_carts WHERE recovered_at IS NULL AND email_count < 3 AND created_at > now() - interval '7 days'`
- [ ] Badges atualizados a cada 60 segundos via polling (`useEffect` com `setInterval`)
- [ ] Sidebar responsivo: oculto em mobile com botão hamburger no header do admin — abrir como drawer lateral
- [ ] Todos os ícones importados de `lucide-react`
- [ ] Logo do Gabinete FC no topo do sidebar
- [ ] Informações do admin logado (nome, foto/avatar) no rodapé do sidebar com botão "Sair"

**Notas Técnicas:**
- Arquivo principal: `components/admin/sidebar.tsx`
- Configuração de navegação: `lib/admin-nav.ts` — exportar array de `NavItem` com type definido
- Type `NavItem`: `{ label: string; href: string; icon: LucideIcon; badge?: () => Promise<number>; children?: NavItem[] }`
- Rotas de comportamento e mídia: renderizar com estado "Em breve" se dados insuficientes (< 100 eventos)

---

---

# EPIC-L: Schema Complementar do EPIC-03

**Descrição:** Migration SQL completa com todas as novas tabelas, campos, índices e políticas RLS necessários para suportar todos os módulos do EPIC-03. Esta US deve ser implementada ANTES de qualquer outra US deste epic.

**Fase:** MVP
**Prioridade:** CRÍTICA — bloqueia todas as outras US do EPIC-03
**Dependências:** US-01.2 (schema base), US-A.1 (schema EPIC-02)

---

### US-L.1 — Migrations SQL Completas do EPIC-03

**Como** desenvolvedor,
**Quero** todas as novas tabelas, campos, índices e políticas RLS do EPIC-03 criados via migration versionada,
**Para** que o desenvolvimento de todos os módulos possa prosseguir com dependências de schema resolvidas.

**Prioridade:** MVP (CRÍTICA)
**Dependências:** US-01.2, US-A.1

**Critérios de Aceitação:**
- [ ] Migration criada em `supabase/migrations/20260416000002_epic03_schema.sql`
- [ ] Todos os campos, tabelas, índices e policies definidos neste documento estão presentes na migration
- [ ] Migration executada com sucesso em `supabase db reset` local sem erros
- [ ] Tipos TypeScript regenerados via `npm run db:types` após aplicar a migration
- [ ] Schema versionado no Git antes de qualquer desenvolvimento de feature do EPIC-03

**Notas Técnicas:**
- Ver Apêndice de Schema ao final deste documento com o SQL completo
- A migration deve ser idempotente onde possível (usar `IF NOT EXISTS`, `DO $$ ... IF NOT EXISTS ... $$`)

---

---

# Apêndice de Schema — Migration SQL Completa

**Arquivo:** `supabase/migrations/20260416000002_epic03_schema.sql`

```sql
-- =============================================================================
-- EPIC-03: Analytics, Marketing Avançado e Decisões de Produto
-- Migration: 20260416000002_epic03_schema.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- SEÇÃO 1: Campos em tabelas existentes
-- -----------------------------------------------------------------------------

-- 1.1 Tabela USERS — campos VIP e soft delete LGPD
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS vip_since TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ NULL;

-- 1.2 Tabela ORDERS — campos UTM
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS utm_source VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS utm_content VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS utm_term VARCHAR(100) NULL;

-- 1.3 Tabela COUPONS — campo VIP exclusivo
ALTER TABLE coupons
  ADD COLUMN IF NOT EXISTS only_vip BOOLEAN DEFAULT FALSE;

-- 1.4 Tabela STORE_SETTINGS — campos de integrações e configurações
-- (assumir que store_settings é key-value ou tabela de configuração única)
-- Inserir configurações padrão se não existirem
INSERT INTO store_settings (key, value, category) VALUES
  ('meta_bm_id', '', 'meta')          ON CONFLICT (key) DO NOTHING;
INSERT INTO store_settings (key, value, category) VALUES
  ('meta_pixel_id', '', 'meta')       ON CONFLICT (key) DO NOTHING;
INSERT INTO store_settings (key, value, category) VALUES
  ('meta_access_token', '', 'meta')   ON CONFLICT (key) DO NOTHING;
INSERT INTO store_settings (key, value, category) VALUES
  ('social_proof_enabled', 'true', 'frontend')       ON CONFLICT (key) DO NOTHING;
INSERT INTO store_settings (key, value, category) VALUES
  ('social_proof_min_views', '12', 'frontend')       ON CONFLICT (key) DO NOTHING;
INSERT INTO store_settings (key, value, category) VALUES
  ('social_proof_max_views', '47', 'frontend')       ON CONFLICT (key) DO NOTHING;
INSERT INTO store_settings (key, value, category) VALUES
  ('social_proof_min_product_age_days', '30', 'frontend')       ON CONFLICT (key) DO NOTHING;
INSERT INTO store_settings (key, value, category) VALUES
  ('vip_min_orders', '2', 'vip')       ON CONFLICT (key) DO NOTHING;
INSERT INTO store_settings (key, value, category) VALUES
  ('vip_min_revenue', '500.00', 'vip')       ON CONFLICT (key) DO NOTHING;

-- -----------------------------------------------------------------------------
-- SEÇÃO 2: Nova tabela BEHAVIOR_EVENTS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS behavior_events (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   VARCHAR(36)  NOT NULL,
  user_id      UUID         REFERENCES users(id) ON DELETE SET NULL NULL,
  page_path    VARCHAR(500) NOT NULL,
  event_type   VARCHAR(50)  NOT NULL CHECK (event_type IN (
                              'pageview','product_view','add_to_cart',
                              'checkout_started','search')),
  event_data   JSONB        NULL,
  utm_source   VARCHAR(100) NULL,
  utm_medium   VARCHAR(100) NULL,
  utm_campaign VARCHAR(100) NULL,
  referrer     VARCHAR(500) NULL,
  viewport_w   SMALLINT     NULL,
  viewport_h   SMALLINT     NULL,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Índices behavior_events
CREATE INDEX IF NOT EXISTS idx_behavior_events_session_id
  ON behavior_events (session_id);
CREATE INDEX IF NOT EXISTS idx_behavior_events_event_type
  ON behavior_events (event_type);
CREATE INDEX IF NOT EXISTS idx_behavior_events_created_at
  ON behavior_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_behavior_events_page_path
  ON behavior_events (page_path);
CREATE INDEX IF NOT EXISTS idx_behavior_events_utm_campaign
  ON behavior_events (utm_campaign);
CREATE INDEX IF NOT EXISTS idx_behavior_events_user_id
  ON behavior_events (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_behavior_events_event_data_gin
  ON behavior_events USING GIN (event_data);

-- RLS behavior_events
ALTER TABLE behavior_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "behavior_events_insert_anon"
  ON behavior_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "behavior_events_select_admin"
  ON behavior_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );

-- -----------------------------------------------------------------------------
-- SEÇÃO 3: Nova tabela HEATMAP_EVENTS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS heatmap_events (
  id           BIGSERIAL    PRIMARY KEY,
  session_id   VARCHAR(36)  NOT NULL,
  page_path    VARCHAR(500) NOT NULL,
  event_type   VARCHAR(20)  NOT NULL CHECK (event_type IN (
                              'click','mousemove','scroll_depth','rage_click')),
  x_pct        DECIMAL(5,2) NOT NULL,
  y_pct        DECIMAL(5,2) NOT NULL,
  viewport_w   SMALLINT     NOT NULL,
  viewport_h   SMALLINT     NOT NULL,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Índices heatmap_events
CREATE INDEX IF NOT EXISTS idx_heatmap_events_page_path
  ON heatmap_events (page_path);
CREATE INDEX IF NOT EXISTS idx_heatmap_events_event_type
  ON heatmap_events (event_type);
CREATE INDEX IF NOT EXISTS idx_heatmap_events_created_at
  ON heatmap_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_heatmap_events_page_type_date
  ON heatmap_events (page_path, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_heatmap_events_viewport_w
  ON heatmap_events (viewport_w);

-- RLS heatmap_events
ALTER TABLE heatmap_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "heatmap_events_insert_anon"
  ON heatmap_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "heatmap_events_select_admin"
  ON heatmap_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );

-- -----------------------------------------------------------------------------
-- SEÇÃO 4: Nova tabela ABANDONED_CARTS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS abandoned_carts (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID         REFERENCES users(id) ON DELETE SET NULL NULL,
  email             VARCHAR(255) NOT NULL,
  cart_items        JSONB        NOT NULL,
  cart_total        DECIMAL(10,2) NOT NULL,
  utm_campaign      VARCHAR(100) NULL,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  last_email_sent_at TIMESTAMPTZ NULL,
  email_count       SMALLINT     NOT NULL DEFAULT 0,
  recovered_at      TIMESTAMPTZ  NULL
);

-- Índices abandoned_carts
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_email
  ON abandoned_carts (email);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_created_at
  ON abandoned_carts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_recovered_at
  ON abandoned_carts (recovered_at) WHERE recovered_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_email_count
  ON abandoned_carts (email_count) WHERE email_count < 3;
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_user_id
  ON abandoned_carts (user_id) WHERE user_id IS NOT NULL;

-- RLS abandoned_carts
ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "abandoned_carts_insert_authenticated_or_anon"
  ON abandoned_carts FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "abandoned_carts_select_admin"
  ON abandoned_carts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );

CREATE POLICY "abandoned_carts_update_system"
  ON abandoned_carts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );

-- -----------------------------------------------------------------------------
-- SEÇÃO 5: Nova tabela CAMPAIGN_COSTS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS campaign_costs (
  utm_campaign  VARCHAR(100) NOT NULL,
  cost          DECIMAL(10,2) NOT NULL DEFAULT 0,
  period_start  DATE         NOT NULL,
  period_end    DATE         NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  PRIMARY KEY (utm_campaign, period_start, period_end)
);

-- Índices campaign_costs
CREATE INDEX IF NOT EXISTS idx_campaign_costs_period
  ON campaign_costs (period_start, period_end);

-- RLS campaign_costs
ALTER TABLE campaign_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaign_costs_admin_all"
  ON campaign_costs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );

-- -----------------------------------------------------------------------------
-- SEÇÃO 6: Nova tabela CAPI_ERROR_LOG
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS capi_error_log (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type    VARCHAR(50)  NOT NULL,
  error_message TEXT         NOT NULL,
  payload_hash  VARCHAR(64)  NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Índices capi_error_log
CREATE INDEX IF NOT EXISTS idx_capi_error_log_created_at
  ON capi_error_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_capi_error_log_event_type
  ON capi_error_log (event_type);

-- RLS capi_error_log
ALTER TABLE capi_error_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "capi_error_log_insert_service"
  ON capi_error_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "capi_error_log_select_admin"
  ON capi_error_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );

-- -----------------------------------------------------------------------------
-- SEÇÃO 7: Índices adicionais em tabelas existentes
-- -----------------------------------------------------------------------------

-- Índices UTM em orders (para queries de performance no dashboard de mídia)
CREATE INDEX IF NOT EXISTS idx_orders_utm_campaign
  ON orders (utm_campaign) WHERE utm_campaign IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_utm_source
  ON orders (utm_source) WHERE utm_source IS NOT NULL;

-- Índice is_vip em users (para filtros de clientes VIP)
CREATE INDEX IF NOT EXISTS idx_users_is_vip
  ON users (is_vip) WHERE is_vip = TRUE;

-- Índice is_active em users (para middleware de autenticação)
CREATE INDEX IF NOT EXISTS idx_users_is_active
  ON users (is_active) WHERE is_active = FALSE;

-- Índice deleted_at em users (para cron de hard delete LGPD)
CREATE INDEX IF NOT EXISTS idx_users_deleted_at
  ON users (deleted_at) WHERE deleted_at IS NOT NULL;

-- Índice only_vip em coupons (para validação no checkout)
CREATE INDEX IF NOT EXISTS idx_coupons_only_vip
  ON coupons (only_vip) WHERE only_vip = TRUE;

-- -----------------------------------------------------------------------------
-- SEÇÃO 8: Função SQL para funil de conversão (Analytics)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_funnel_data(
  start_date TIMESTAMPTZ,
  end_date   TIMESTAMPTZ
)
RETURNS TABLE (
  step        TEXT,
  step_order  INTEGER,
  event_count BIGINT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT 'pageview'::TEXT as step, 1 as step_order,
    COUNT(*) FILTER (WHERE event_type = 'pageview') as event_count
  FROM behavior_events
  WHERE created_at BETWEEN start_date AND end_date

  UNION ALL

  SELECT 'product_view'::TEXT, 2,
    COUNT(*) FILTER (WHERE event_type = 'product_view')
  FROM behavior_events
  WHERE created_at BETWEEN start_date AND end_date

  UNION ALL

  SELECT 'add_to_cart'::TEXT, 3,
    COUNT(*) FILTER (WHERE event_type = 'add_to_cart')
  FROM behavior_events
  WHERE created_at BETWEEN start_date AND end_date

  UNION ALL

  SELECT 'checkout_started'::TEXT, 4,
    COUNT(*) FILTER (WHERE event_type = 'checkout_started')
  FROM behavior_events
  WHERE created_at BETWEEN start_date AND end_date

  UNION ALL

  SELECT 'purchase'::TEXT, 5,
    COUNT(*)
  FROM orders
  WHERE payment_status = 'paid'
    AND created_at BETWEEN start_date AND end_date

  ORDER BY step_order;
$$;

-- Conceder execução ao role authenticated (admin verifica dentro da função via SECURITY DEFINER)
GRANT EXECUTE ON FUNCTION get_funnel_data(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

-- -----------------------------------------------------------------------------
-- SEÇÃO 9: Comentários de documentação
-- -----------------------------------------------------------------------------

COMMENT ON TABLE behavior_events IS
  'Eventos de comportamento próprios: pageview, product_view, add_to_cart, checkout_started, search. Alimenta o funil de conversão e analytics de páginas no admin.';

COMMENT ON TABLE heatmap_events IS
  'Eventos de interação visual: click, mousemove, scroll_depth, rage_click. Renderizados como heatmap no admin via heatmap.js.';

COMMENT ON TABLE abandoned_carts IS
  'Carrinhos abandonados capturados no checkout (etapa 1 — email). Alimenta a sequência de 3 emails de recuperação.';

COMMENT ON TABLE campaign_costs IS
  'Custos de campanha inseridos manualmente por utm_campaign e período. Usados para cálculo de CPA e ROAS no dashboard de mídia.';

COMMENT ON TABLE capi_error_log IS
  'Log de erros da Meta Conversions API (CAPI). Não bloqueia fluxo de compra — apenas para diagnóstico.';

COMMENT ON COLUMN users.is_vip IS
  'Cliente VIP: >= 2 pedidos entregues OU >= R$500 gastos. Recalculado diariamente. Nunca revertido.';

COMMENT ON COLUMN users.is_active IS
  'Soft delete LGPD. FALSE = conta desativada pelo próprio cliente. Dados retidos por 5 anos (CDC).';

COMMENT ON COLUMN orders.utm_campaign IS
  'Campanha UTM do cookie _gfc_utm no momento do checkout. Usado para atribuição de receita por campanha.';

COMMENT ON COLUMN coupons.only_vip IS
  'Cupom restrito a clientes VIP (is_vip = true). Validado no Server Action do checkout.';
-- -----------------------------------------------------------------------------
-- SEÇÃO 8: push_subscriptions (PWA Push Notifications — EPIC-02 F.3)
-- Adicionado: QA CRÍTICO-01 — tabela ausente identificada no diagnóstico v3.0
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint     text          NOT NULL,
  keys         jsonb         NOT NULL,   -- { p256dh: string, auth: string }
  user_agent   text,                     -- browser/device para debug
  is_active    boolean       NOT NULL DEFAULT true,
  created_at   timestamptz   NOT NULL DEFAULT now(),
  updated_at   timestamptz   NOT NULL DEFAULT now()
);

COMMENT ON TABLE push_subscriptions IS
  'Subscriptions de Web Push (PWA). Armazena endpoint e chaves VAPID por usuário.    Usada para envio de notificações de pedido e campanhas de marketing push.';

-- Índices
CREATE INDEX idx_push_subscriptions_user_id
  ON push_subscriptions(user_id);

CREATE INDEX idx_push_subscriptions_active
  ON push_subscriptions(user_id, is_active)
  WHERE is_active = true;

-- Trigger de atualização de updated_at
CREATE TRIGGER set_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Usuário autenticado vê apenas suas próprias subscriptions
CREATE POLICY push_subscriptions_select_own
  ON push_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Usuário autenticado pode inserir apenas para si mesmo
CREATE POLICY push_subscriptions_insert_own
  ON push_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Usuário autenticado pode atualizar apenas as suas (ex: is_active = false para cancelar)
CREATE POLICY push_subscriptions_update_own
  ON push_subscriptions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Usuário autenticado pode deletar apenas as suas
CREATE POLICY push_subscriptions_delete_own
  ON push_subscriptions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Admin tem acesso total (service_role bypassa RLS automaticamente)
-- Não é necessário policy adicional para admin com service_role key.

```

---

## Resumo de Dependências por Sub-EPIC

| Sub-EPIC | Depende de | Bloqueia |
|---|---|---|
| EPIC-L (US-L.1) | US-01.2, US-A.1 | TODOS os outros |
| EPIC-K (US-K.1) | US-01.1, EPIC-L | EPIC-G, H, I, J (navegação) |
| EPIC-G.1 (VIP) | EPIC-L, EPIC-04 | — |
| EPIC-G.2 (LGPD) | EPIC-L, US-01.3 | — |
| EPIC-G.3 (Social Proof) | EPIC-L, EPIC-02 | — |
| EPIC-G.4 (Carrinhos Email) | EPIC-L, EPIC-04, EPIC-05, US-H.2 | — |
| EPIC-H.1 (Meta Pixel) | EPIC-L, US-01.1 | EPIC-H.3 |
| EPIC-H.2 (UTM Capture) | EPIC-L, EPIC-04 | EPIC-G.4, EPIC-H.4 |
| EPIC-H.3 (CAPI) | EPIC-H.1 | EPIC-H.4 |
| EPIC-H.4 (Dashboard Mídia) | EPIC-H.2, EPIC-H.3, EPIC-I.1 | — |
| EPIC-I.1 (Behavior Events) | EPIC-L | EPIC-I.2, EPIC-I.3, EPIC-H.4 |
| EPIC-I.2 (Funil/Páginas) | EPIC-I.1, EPIC-K.1 | — |
| EPIC-I.3 (Buscas) | EPIC-I.1, EPIC-K.1 | — |
| EPIC-J.1 (Heatmap Tracker) | EPIC-L | EPIC-J.2 |
| EPIC-J.2 (Heatmap Admin) | EPIC-J.1, EPIC-K.1 | — |

---

## Estimativa de Esforço por Sub-EPIC

| Sub-EPIC | Fase | Story Points (estimativa) | Complexidade |
|---|---|---|---|
| EPIC-L — Schema SQL | MVP | 3 SP | Baixa (SQL) |
| EPIC-K — Sidebar Admin | MVP | 5 SP | Média |
| EPIC-G.1 — Sistema VIP | MVP | 8 SP | Alta |
| EPIC-G.2 — Soft Delete LGPD | MVP | 5 SP | Média |
| EPIC-G.3 — Social Proof | MVP | 3 SP | Baixa |
| EPIC-G.4 — Carrinhos Abandonados | Fase 2 | 13 SP | Alta |
| EPIC-H.1 — Meta Pixel | MVP | 5 SP | Média |
| EPIC-H.2 — UTM Capture | MVP | 5 SP | Média |
| EPIC-H.3 — CAPI Server-side | Fase 2 | 8 SP | Alta |
| EPIC-H.4 — Dashboard Mídia | Fase 2 | 13 SP | Alta |
| EPIC-I.1 — Behavior Events | MVP | 5 SP | Média |
| EPIC-I.2 — Funil/Páginas Admin | Fase 2 | 8 SP | Alta |
| EPIC-I.3 — Dashboard Buscas | Fase 2 | 5 SP | Média |
| EPIC-J.1 — Heatmap Tracker | Fase 2 | 8 SP | Alta |
| EPIC-J.2 — Heatmap Admin | Fase 2 | 13 SP | Alta |
| **TOTAL** | | **107 SP** | |

---

*Documento gerado por @pm (Product Manager) — Synkra AIOS v2.0*
*Data: 2026-04-16*
*Próximo documento: EPIC-04 ou Stories individuais para sprint planning*

---

