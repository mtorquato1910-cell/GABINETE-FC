Tenho contexto suficiente do EPIC-01 e do diagnóstico de QA. Vou agora gerar o EPIC-02 Complementar completo.

---

# EPIC-02 Complementar: Gabinete FC — Gaps, Fase 2 e Fase 3

**Versão:** 1.0
**Data:** 2026-04-16
**Autor:** @pm (Product Manager) — Synkra AIOS
**Status:** Draft para Revisão
**Contexto:** Documento complementar ao EPIC-gabinete-fc-v1.0.md. Cobre lacunas identificadas pelo QA, funcionalidades de Fase 2 e Fase 3 do roadmap PRD.

---

## Indice de Sub-EPICs

| Sub-EPIC | Titulo | Fase | Prioridade |
|---|---|---|---|
| EPIC-A | Correcoes e Gaps Criticos | MVP | Executar junto com EPIC-01 |
| EPIC-B | Avaliacoes e Engajamento | Fase 2 | Alta |
| EPIC-C | Marketing e Conversao | Fase 2 | Alta |
| EPIC-D | Operacoes Avancadas | Fase 2 | Media |
| EPIC-E | Expansao de Produto | Fase 3 | Baixa |
| EPIC-F | Retencao e Fidelidade | Fase 3 | Baixa |

---

## Mapa de Dependencias

```
EPIC-01 (base) → EPIC-A (correcoes MVP)
                       ↓
          [EPIC-B || EPIC-C || EPIC-D] (Fase 2 — paralelo)
                       ↓
          [EPIC-E || EPIC-F] (Fase 3 — paralelo)
```

---

---

# EPIC-A: Correcoes e Gaps Criticos

**Descricao:** Correcoes obrigatorias identificadas pelo QA que devem ser implementadas em paralelo com o EPIC-01, antes de qualquer desenvolvimento de feature. Inclui schema complementar de banco de dados, correco de vulnerabilidade de seguranca, edge cases de negocio e o modulo de gestao de estoque fisico ausente.

**Fase:** MVP
**Prioridade:** CRITICA — bloqueia o inicio do desenvolvimento seguro
**Dependencias:** EPIC-01 (US-01.1, US-01.2)

---

### US-A.1 — Schema Complementar de Banco de Dados

**Como** desenvolvedor,
**Quero** o schema do banco de dados completo com todos os campos e tabelas identificados como ausentes no diagnostico de QA,
**Para** que nenhum modulo de desenvolvimento seja bloqueado por dependencia de schema faltante.

**Prioridade:** MVP
**Dependencias:** US-01.2 (schema base)

**Criterios de Aceitacao:**
- [ ] Migration SQL criada em `supabase/migrations/` adicionando todos os campos ausentes
- [ ] Campo `is_featured` adicionado a tabela `products` (tipo `boolean`, default `false`)
- [ ] Campo `tracking_events_json` adicionado a tabela `orders` (tipo `jsonb`, nullable)
- [ ] Campo `tracking_updated_at` adicionado a tabela `orders` (tipo `timestamptz`, nullable)
- [ ] Tabela `order_history` criada com campos: `id uuid PK`, `order_id uuid FK`, `admin_user_id uuid FK nullable`, `action varchar(100)`, `from_status order_status_enum nullable`, `to_status order_status_enum`, `note text nullable`, `created_at timestamptz default now()`
- [ ] Tabela `stock_movements` criada com campos: `id uuid PK`, `product_id uuid FK`, `size varchar(10)`, `type varchar(10) CHECK (type IN ('in','out'))`, `quantity integer CHECK (quantity > 0)`, `reason text`, `admin_user_id uuid FK nullable`, `created_at timestamptz default now()`
- [ ] Tabela `loyalty_points` criada (fase 3, schema ja preparado) com campos: `id uuid PK`, `user_id uuid FK`, `points integer`, `action varchar(50)`, `order_id uuid FK nullable`, `expires_at timestamptz nullable`, `created_at timestamptz default now()`
- [ ] Tabela `stock_alerts` criada com campos: `id uuid PK`, `product_id uuid FK`, `size varchar(10)`, `email varchar(255)`, `user_id uuid FK nullable`, `notified_at timestamptz nullable`, `created_at timestamptz default now()`
- [ ] Tabela `banners` criada com campos: `id uuid PK`, `title varchar(200)`, `image_url text`, `link_url text nullable`, `starts_at timestamptz`, `ends_at timestamptz`, `is_active boolean default false`, `position integer default 0`, `created_at timestamptz default now()`
- [ ] Indices criados em `order_history (order_id)`, `stock_movements (product_id, size)`, `stock_alerts (product_id, size, notified_at)`
- [ ] Politicas RLS para `order_history`: apenas admins podem inserir/ler
- [ ] Politicas RLS para `stock_movements`: apenas admins podem inserir/ler
- [ ] Politicas RLS para `stock_alerts`: usuario ve apenas seus proprios alertas; admin ve todos
- [ ] Politicas RLS para `loyalty_points`: usuario ve apenas seus proprios pontos; admin ve todos
- [ ] Tipos TypeScript regenerados via `npm run db:types`
- [ ] Migration testada em ambiente local (supabase start + migration apply)

**Notas Tecnicas:**
- Criar migration separada nomeada `20260416000001_complementar_schema.sql` para rastreabilidade
- A tabela `loyalty_points` e criada agora para evitar migration futura disruptiva, mas nao precisa ter UI na Fase 2
- O campo `tracking_events_json` armazena array de objetos: `[{date, status, description, location}]`
- A tabela `order_history` deve ter trigger automatico disparado a cada UPDATE em `orders.status`

---

### US-A.2 — Correcao de Seguranca: Admin Role em app_metadata

**Como** administrador do sistema,
**Quero** que o role de administrador seja armazenado em `app_metadata` do Supabase Auth (e nao em `user_metadata`),
**Para** eliminar a vulnerabilidade de escalada de privilegios onde um usuario poderia se auto-promover a admin.

**Prioridade:** MVP
**Dependencias:** US-01.2, US-01.4

**Criterios de Aceitacao:**
- [ ] Funcao `setAdminRole(userId)` implementada em `lib/supabase/admin.ts` usando `supabase.auth.admin.updateUserById()` com `app_metadata: { role: 'admin' }`
- [ ] A funcao `setAdminRole` e chamada APENAS via `SUPABASE_SERVICE_ROLE_KEY` (nunca exposta ao cliente)
- [ ] Route Handler `POST /api/admin/setup` criado para uso unico de configuracao inicial, protegido por `ADMIN_SETUP_SECRET` [A_CONFIGURAR] no `.env`
- [ ] Middleware `requireAdmin()` em `lib/supabase/server.ts` verifica `session.user.app_metadata.role === 'admin'` (nao `user_metadata`)
- [ ] Todos os middlewares de rotas `/admin/**` usam `requireAdmin()` com verificacao em `app_metadata`
- [ ] Campo `role` na tabela `users` mantido sincronizado como cache de leitura, mas a fonte da verdade para acesso e o `app_metadata`
- [ ] Documentacao no README: "Como promover usuario a admin" via service role key
- [ ] Teste de seguranca: usuario comum tentando acessar `/admin` recebe redirect para `/` com status 403
- [ ] Teste de seguranca: nao e possivel modificar `app_metadata` via API publica do Supabase (apenas service role)

**Notas Tecnicas:**
- O `app_metadata` do Supabase Auth so pode ser modificado via service_role key (server-side)
- O `user_metadata` pode ser modificado pelo proprio usuario via `supabase.auth.updateUser()` — nao usar para roles
- Script de setup: `scripts/setup-admin.ts` a ser rodado manualmente uma unica vez com `npx ts-node scripts/setup-admin.ts`
- Remover qualquer referencia a `user_metadata.role` no codigo de autenticacao

---

### US-A.3 — Maquina de Estados de Pedido e Transicoes Validas

**Como** administrador,
**Quero** que o sistema enforce transicoes validas de status de pedido,
**Para** evitar estados inconsistentes (ex: pedido passar de "Aguardando Pagamento" direto para "Entregue") que causam erros operacionais e fiscais.

**Prioridade:** MVP
**Dependencias:** US-01.2, US-06.3 (EPIC-01)

**Criterios de Aceitacao:**
- [ ] Arquivo `lib/orders/state-machine.ts` criado com as transicoes validas definidas como constante
- [ ] Funcao `isValidTransition(from: OrderStatus, to: OrderStatus): boolean` implementada e exportada
- [ ] Mapa de transicoes validas implementado conforme especificacao abaixo
- [ ] Route Handler de atualizacao de status (`PATCH /api/admin/orders/[id]/status`) usa `isValidTransition()` e retorna erro 422 com mensagem clara se transicao for invalida
- [ ] Ao mudar status com sucesso, registro e inserido automaticamente em `order_history`
- [ ] Criterio de transicao valida: `pending` -> `confirmed` ou `cancelled`
- [ ] Criterio de transicao valida: `confirmed` -> `processing` ou `cancelled`
- [ ] Criterio de transicao valida: `processing` -> `shipped` ou `cancelled`
- [ ] Criterio de transicao valida: `shipped` -> `delivered`
- [ ] Criterio de transicao valida: `delivered` -> `refunded`
- [ ] Criterio de transicao valida: `cancelled` -> nenhuma (estado terminal)
- [ ] Criterio de transicao valida: `refunded` -> nenhuma (estado terminal)
- [ ] Qualquer outra transicao retorna erro HTTP 422 com corpo `{ error: "Transicao invalida de 'X' para 'Y'" }`
- [ ] Testes unitarios para `isValidTransition()` cobrindo todos os pares validos e invalidos

**Notas Tecnicas:**
- Implementar como objeto constante: `const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]>`
- A maquina de estados deve ser usada tanto no admin manual quanto nos webhooks automaticos de rastreio e pagamento
- Transicao `paid` (payment_status) nao e a mesma coisa que `confirmed` (order status) — sao campos independentes

---

### US-A.4 — Edge Cases: Produto Indisponivel no Carrinho

**Como** cliente logado,
**Quero** ser notificado imediatamente quando um produto no meu carrinho ficar indisponivel,
**Para** nao ser surpreendido com erro no checkout apos preencher todos os dados de entrega e pagamento.

**Prioridade:** MVP
**Dependencias:** US-02.7 (carrinho — EPIC-01), US-01.2

**Criterios de Aceitacao:**
- [ ] Ao abrir o carrinho (pagina ou drawer), o sistema valida a disponibilidade de cada item via query ao Supabase
- [ ] Produto com `is_active = false` exibe badge vermelho "Indisponivel" no item do carrinho
- [ ] Item marcado como indisponivel e desabilitado no checkout (nao pode prosseguir com ele)
- [ ] Mensagem inline no item: "Este produto nao esta mais disponivel. Remova para continuar."
- [ ] Botao "Remover item indisponivel" remove o item sem confirmacao adicional
- [ ] Se o carrinho ficou completamente vazio apos remocao, exibe estado vazio com CTA para o catalogo
- [ ] A validacao tambem ocorre no server-side no Route Handler `POST /api/checkout/create` — carrinho invalido retorna erro 409 com lista de itens indisponiveis
- [ ] Teste: produto ativo no carrinho, admin desativa produto, cliente abre carrinho e ve aviso
- [ ] Teste: cliente tenta finalizar checkout com item indisponivel via curl — recebe 409

**Notas Tecnicas:**
- A verificacao no cliente usa `useEffect` ao montar o componente de carrinho
- A verificacao server-side e a fonte da verdade — a do cliente e apenas UX
- Nao remover automaticamente itens do carrinho sem acao do usuario (respeitar a escolha do cliente de manter para quando voltar ao estoque)

---

### US-A.5 — Edge Case: Conflito de Conta OAuth vs Email/Senha

**Como** visitante,
**Quero** que o sistema gerencie corretamente o conflito quando tento fazer login com Google usando um email que ja possui conta por email/senha,
**Para** nao perder acesso a minha conta nem criar duplicatas.

**Prioridade:** MVP
**Dependencias:** US-03.1 (autenticacao — EPIC-01)

**Criterios de Aceitacao:**
- [ ] Quando usuario tenta Google OAuth com email ja cadastrado por email/senha, Supabase lanca erro de conflito
- [ ] O sistema captura o erro `AuthApiError` com mensagem "User already registered"
- [ ] Usuario e redirecionado para `/auth/login?error=account_exists&method=password`
- [ ] Na pagina de login, exibe toast informativo: "Voce ja possui conta com este email. Faca login com email e senha ou vincule sua conta Google nas configuracoes."
- [ ] Na area do cliente (`/conta/seguranca`), existe opcao "Vincular conta Google" para usuarios com conta email/senha
- [ ] Ao clicar em "Vincular conta Google", o OAuth e executado com `linkIdentity()` do Supabase
- [ ] Apos vinculacao bem-sucedida, usuario pode logar com Google ou email/senha indistintamente
- [ ] Teste: usuario com conta email/senha tenta Google OAuth — recebe mensagem clara e nao perde dados
- [ ] Teste: usuario vincula Google com sucesso e consegue logar com ambos metodos

**Notas Tecnicas:**
- Usar `supabase.auth.linkIdentity({ provider: 'google' })` para vinculacao (requer usuario autenticado)
- O fluxo de vinculacao deve ser iniciado APOS o usuario fazer login por email/senha
- Referencia: Supabase Identity Linking docs

---

### US-A.6 — Edge Case: Timeout do Polling de Pix

**Como** sistema,
**Quero** encerrar automaticamente o polling de status de pagamento Pix apos 31 minutos,
**Para** nao manter conexoes abertas indefinidamente e liberar recursos do servidor.

**Prioridade:** MVP
**Dependencias:** US-04.4 (checkout Pix — EPIC-01)

**Criterios de Aceitacao:**
- [ ] O polling de status do Pix inicia apos geracao do QR Code e realiza verificacoes a cada 5 segundos
- [ ] O polling e encerrado automaticamente apos exatamente 31 minutos (1.860.000ms) sem confirmacao
- [ ] Apos timeout, a pagina exibe mensagem: "O tempo de pagamento expirou. Gere um novo Pix para continuar."
- [ ] Botao "Gerar novo Pix" realiza nova chamada ao backend para criar novo Payment Intent
- [ ] O pedido permanece em status `pending` por 24 horas antes de ser automaticamente cancelado por cron job
- [ ] O cron job `cancelExpiredOrders` roda diariamente (`0 3 * * *`) e cancela pedidos `pending` com `created_at < NOW() - INTERVAL '24 hours'`
- [ ] A cancellation do cron registra entrada em `order_history` com `action = 'auto_cancelled_pix_timeout'`
- [ ] Teste: simular polling apos 31 minutos — exibe mensagem de timeout e para as requisicoes
- [ ] Teste: verificar no Network tab que nao ha mais requisicoes apos timeout

**Notas Tecnicas:**
- Implementar usando `useRef` para o `setTimeout` de 31 minutos e `setInterval` para o polling de 5 segundos
- Limpar ambos com `clearTimeout` e `clearInterval` no `useEffect` cleanup
- O Pix no Stripe tem validade configuravel; definir expiracoes de 30 minutos na criacao do Payment Intent

---

### US-A.7 — Gestao de Estoque Fisico

**Como** administrador,
**Quero** um modulo dedicado no painel administrativo para controlar o estoque fisico de pecas mantidas para trocas rapidas,
**Para** saber exatamente quantas unidades de cada produto/tamanho estou fisicamente com o fornecedor e evitar prometer trocas que nao posso cumprir.

**Prioridade:** MVP
**Dependencias:** US-A.1 (tabelas `stock_movements`), US-06.1 (layout admin — EPIC-01)

**Criterios de Aceitacao:**
- [ ] Pagina `/admin/estoque` criada e acessivel pelo menu lateral do admin
- [ ] Tabela de estoque exibe: Produto, Tamanho, Quantidade Atual, Estoque Minimo, Status
- [ ] Status automatico por linha: "OK" (acima do minimo), "ALERTA" (igual ou abaixo do minimo), "ZERADO" (0 unidades)
- [ ] Linhas com status "ALERTA" ou "ZERADO" destacadas visualmente (amarelo/vermelho)
- [ ] Botao "Registrar Entrada" abre modal com campos: Produto (select), Tamanho (select), Quantidade (number, min 1), Motivo (texto livre), e salva novo registro em `stock_movements` com `type = 'in'`
- [ ] Botao "Registrar Saida" abre modal com campos: Produto (select), Tamanho (select), Quantidade (number, min 1), Motivo (texto livre), e salva registro com `type = 'out'`
- [ ] Sistema impede registrar saida maior que estoque atual — exibe erro: "Quantidade insuficiente. Estoque atual: X unidades."
- [ ] Historico de movimentacoes exibido em tabela com colunas: Data, Tipo, Produto, Tamanho, Qtd, Motivo, Admin
- [ ] Filtros no historico: por produto, por tipo (entrada/saida), por periodo (data inicial e final)
- [ ] Estoque minimo configuravel por produto+tamanho (campo editavel inline na tabela, default = 2)
- [ ] Email automatico enviado para o admin quando estoque cai abaixo do minimo configurado
- [ ] Relatorio de posicao atual: botao "Exportar CSV" gera arquivo com produto, tamanho, quantidade atual, estoque minimo
- [ ] Quantidade atual e calculada em tempo real: `SUM(in) - SUM(out)` por produto+tamanho via query Supabase

**Notas Tecnicas:**
- A quantidade atual nao e armazenada em campo — e sempre calculada pela soma dos movimentos
- Para performance, criar view ou funcao SQL `stock_current_position` que faz o calculo com GROUP BY
- O alerta de estoque minimo e verificado no backend sempre que uma saida e registrada
- Usar `store_settings` para o valor de estoque minimo padrao global (chave: `default_min_stock`, valor: `2`)

---

---

# EPIC-B: Avaliacoes e Engajamento

**Descricao:** Sistema completo de avaliacoes de produtos com upload de fotos, cupons automaticos por tipo de avaliacao, moderacao admin e resposta publica. Substitui a versao simplificada do EPIC-01 (US-03.8).

**Fase:** Fase 2
**Prioridade:** Alta — impacta conversao e prova social
**Dependencias:** EPIC-A (schema completo), EPIC-01 completo

---

### US-B.1 — Formulario de Avaliacao com Upload de Fotos

**Como** cliente logado com pedido entregue,
**Quero** avaliar um produto com nota, texto e ate 3 fotos do produto recebido,
**Para** compartilhar minha experiencia e ajudar outros compradores a tomar decisoes.

**Prioridade:** Fase 2
**Dependencias:** US-03.8 (EPIC-01 — avaliacao basica), US-A.1 (schema reviews)

**Criterios de Aceitacao:**
- [ ] Botao "Avaliar Produto" aparece em cada item do historico de pedidos apenas para pedidos com `status = 'delivered'`
- [ ] Formulario de avaliacao abre em modal ou pagina dedicada `/avaliar/[order_item_id]`
- [ ] Campo de nota: 5 estrelas clicaveis (1 a 5), obrigatorio, sem valor default
- [ ] Campo titulo: texto livre, maximo 100 caracteres, obrigatorio
- [ ] Campo texto: textarea, minimo 20 caracteres, maximo 1.000 caracteres, obrigatorio
- [ ] Campo de fotos: upload de ate 3 imagens (JPG, PNG, WEBP), tamanho maximo de 5MB por foto
- [ ] Preview das fotos selecionadas com botao de remocao individual
- [ ] Fotos enviadas para Supabase Storage no bucket `review-photos` com path `/{user_id}/{review_id}/{filename}`
- [ ] URLs publicas das fotos armazenadas no campo `photos` (array jsonb) da tabela `reviews`
- [ ] Regra de negocio: somente 1 avaliacao por `(user_id, product_id)` — botao some apos avaliacao enviada
- [ ] Avaliacao salva com `status = 'pending'` aguardando moderacao admin
- [ ] Mensagem de confirmacao: "Sua avaliacao foi enviada e sera revisada em ate 24 horas. Voce recebera um cupom por email apos aprovacao!"
- [ ] Teste: upload de 3 fotos validas — salvas no Storage e URLs no banco
- [ ] Teste: tentar enviar formulario sem nota — recebe erro de validacao

**Notas Tecnicas:**
- Usar `supabase.storage.from('review-photos').upload()` com caminho unico por review
- Validar mime type no servidor (Route Handler) alem do cliente
- Compressao de imagem no cliente antes do upload usando `browser-image-compression` (alvo: max 1MB)
- Bucket `review-photos` com politica: leitura publica, escrita apenas por usuarios autenticados no proprio path

---

### US-B.2 — Moderacao de Avaliacoes no Admin com Resposta Publica

**Como** administrador,
**Quero** revisar, aprovar ou rejeitar avaliacoes com visualizacao das fotos e deixar uma resposta publica,
**Para** manter a qualidade do conteudo na loja e interagir com os clientes publicamente.

**Prioridade:** Fase 2
**Dependencias:** US-B.1, US-06.7 (admin avaliacoes — EPIC-01)

**Criterios de Aceitacao:**
- [ ] Pagina `/admin/avaliacoes` exibe lista de avaliacoes filtradas por status: Pendente / Publicada / Rejeitada
- [ ] Cada avaliacao exibe: nome do cliente, produto, nota (estrelas), titulo, texto, fotos (clicaveis para ampliar), data
- [ ] Fotos em lightbox: clicar abre visualizacao em tamanho maior com navegacao entre fotos
- [ ] Botao "Aprovar": muda status para `approved`, dispara email de cupom ao cliente
- [ ] Botao "Rejeitar": abre modal para admin informar motivo (texto livre, obrigatorio), muda status para `rejected`
- [ ] Campo "Resposta Publica": textarea exibida abaixo do card da avaliacao, admin pode digitar e salvar
- [ ] Resposta publica salva em `reviews.admin_response` e exibida publicamente na PDP abaixo da avaliacao
- [ ] Badge de contagem: "X Pendentes" no menu lateral do admin com atualizacao em tempo real via Supabase Realtime
- [ ] Filtro por produto (select) e por nota (1 a 5 estrelas) na pagina
- [ ] Ordenacao: mais recentes primeiro (default), mais antigas primeiro
- [ ] Acao em lote: selecionar multiplas avaliacoes pendentes e aprovar/rejeitar de uma vez
- [ ] Teste: aprovar avaliacao — email com cupom enviado, status muda, avaliacao aparece na PDP
- [ ] Teste: rejeitar sem motivo — formulario nao permite envio

**Notas Tecnicas:**
- Usar Supabase Realtime no canal `reviews:status=eq.pending` para atualizar o badge em tempo real
- A resposta publica e opcional — campo pode ficar vazio
- O motivo de rejeicao e armazenado em `reviews.admin_response` (reutilizando o campo, com prefixo interno)

---

### US-B.3 — Cupons Automaticos por Tipo de Avaliacao

**Como** sistema,
**Quero** gerar e enviar automaticamente cupons de desconto ao cliente apos aprovacao de avaliacao, com valor diferenciado por tipo (com foto / sem foto),
**Para** incentivar avaliacoes de qualidade e recomprar dos clientes.

**Prioridade:** Fase 2
**Dependencias:** US-B.2, US-04.3 (cupons — EPIC-01)

**Criterios de Aceitacao:**
- [ ] Quando admin aprova uma avaliacao, o sistema verifica se `reviews.photos` tem ao menos 1 foto
- [ ] Avaliacao com ao menos 1 foto: gera cupom com desconto de 10% (configuravel em `store_settings`, chave `review_coupon_with_photo_pct`, default `10`)
- [ ] Avaliacao sem foto (apenas texto): gera cupom com desconto de 5% (configuravel em `store_settings`, chave `review_coupon_text_only_pct`, default `5`)
- [ ] Cupom gerado com codigo unico no formato `REVIEW-{8 chars aleatorios uppercase}` (ex: `REVIEW-K3PM9XQA`)
- [ ] Cupom criado na tabela `coupons` com: `type = 'percentage'`, `value = {percentual}`, `user_id_restriction = {user_id do avaliador}`, `max_uses = 1`, `expires_at = NOW() + 30 dias` (configuravel em `store_settings`, chave `review_coupon_validity_days`, default `30`)
- [ ] ID do cupom salvo em `reviews.coupon_generated_id`
- [ ] Email enviado ao cliente com: codigo do cupom, percentual de desconto, data de validade e instrucoes de uso
- [ ] Cupom aparece na area do cliente em `/conta/cupons` com status "Disponivel"
- [ ] Teste: aprovar avaliacao com foto — cupom de 10% criado, email enviado, aparece na area do cliente
- [ ] Teste: aprovar avaliacao sem foto — cupom de 5% criado
- [ ] Teste: alterar percentual no admin, aprovar nova avaliacao — novo percentual aplicado

**Notas Tecnicas:**
- A geracao do cupom e envio de email ocorrem no mesmo Route Handler de aprovacao, em transacao atomica
- Se o envio de email falhar, o cupom ja criado deve ser mantido — o admin pode reenviar manualmente
- Os valores default de 10% e 5% devem ser inseridos como seed na tabela `store_settings`

---

### US-B.4 — Exibicao de Avaliacoes na PDP com Distribuicao de Estrelas

**Como** visitante,
**Quero** ver a nota media, distribuicao de estrelas e todas as avaliacoes aprovadas (com fotos e respostas do admin) na pagina do produto,
**Para** tomar uma decisao de compra informada baseada na experiencia de outros compradores.

**Prioridade:** Fase 2
**Dependencias:** US-B.1, US-B.2, US-02.4 (PDP — EPIC-01)

**Criterios de Aceitacao:**
- [ ] Secao de avaliacoes posicionada abaixo da descricao do produto na PDP
- [ ] Nota media calculada (1 casa decimal, ex: "4.3") exibida em destaque com estrelas visuais
- [ ] Distribuicao de estrelas: barra de progresso horizontal para cada nivel (5★ a 1★) mostrando quantidade e percentual
- [ ] Lista de avaliacoes aprovadas (`status = 'approved'`) com: nome do cliente (primeiro nome + inicial do sobrenome), nota, titulo, texto, data, fotos, resposta do admin
- [ ] Fotos das avaliacoes em grid 3 colunas, clicaveis para lightbox
- [ ] Resposta do admin exibida em destaque abaixo do texto da avaliacao com label "Resposta da Loja"
- [ ] Paginacao: 5 avaliacoes por pagina, botao "Ver mais avaliacoes"
- [ ] Filtro de estrelas: clicar em "3★" filtra para ver apenas avaliacoes de 3 estrelas
- [ ] Ordenacao: mais recentes (default), mais uteis (futuro), maior nota, menor nota
- [ ] Se produto nao tem avaliacoes: exibe "Seja o primeiro a avaliar este produto"
- [ ] A nota media e total de avaliacoes exibidos tambem no breadcrumb/header do produto
- [ ] SEO: avaliacoes em markup `schema.org/Review` e `schema.org/AggregateRating`
- [ ] Teste: produto com 10 avaliacoes aprovadas — distribuicao e media calculados corretamente

**Notas Tecnicas:**
- A nota media e calculada via SQL: `AVG(rating) WHERE status = 'approved'`
- Usar ISR com `revalidate: 3600` para a secao de avaliacoes — nao precisa ser em tempo real
- O nome do cliente deve ser anonimizado: "Carlos S." — nunca exibir email ou sobrenome completo

---

---

# EPIC-C: Marketing e Conversao

**Descricao:** Ferramentas de marketing e conversao incluindo landing page da Copa, rastreamento com Meta Pixel e GTM, sistema de promocoes avancadas com banners e a pagina de promocoes.

**Fase:** Fase 2
**Prioridade:** Alta — impacto direto em receita
**Dependencias:** EPIC-A, EPIC-01 completo

---

### US-C.1 — Landing Page /copa Otimizada para Trafego Pago

**Como** gestor de marketing,
**Quero** uma landing page dedicada em `/copa` sem menu de navegacao completo, com foco total em conversao para trafego pago de campanha de Copa do Mundo,
**Para** maximizar a taxa de conversao de visitantes vindos de anuncios sem distracao de navegacao.

**Prioridade:** Fase 2
**Dependencias:** US-02.2 (home — EPIC-01), US-07.1 (SEO — EPIC-01)

**Criterios de Aceitacao:**
- [ ] Rota `/copa` criada como pagina Next.js sem o layout padrao (sem Navbar e Footer completos)
- [ ] Header minimalista: apenas logo Gabinete FC + numero de WhatsApp para suporte
- [ ] Secao Hero: imagem de fundo das selecionadas mais populares (Brasil, Argentina, Franca, Portugal), headline impactante, subtitulo e CTA principal "Ver Camisas da Copa"
- [ ] Grid de selecionadas participantes: cards com bandeira, nome da selecao e link direto para `/catalogo?selecao={slug}` — exibir ao menos 8 selecoes
- [ ] Secao de oferta especial com contador regressivo real em JavaScript ate data configuravel (data configuravel em `store_settings`, chave `copa_offer_end_date`)
- [ ] Secao de depoimentos: 3 a 5 avaliacoes aprovadas de produtos de selecoes nacionais
- [ ] Secao de prova social: "X clientes satisfeitos", "Entrega em Y dias", "Frete gratis acima de R$ Z"
- [ ] CTA repetido ao menos 3 vezes ao longo da pagina (hero, apos grid, apos depoimentos)
- [ ] Footer simplificado: links de politica de privacidade, termos, e redes sociais
- [ ] Meta tags especificas: `og:title`, `og:description`, `og:image` configurados para compartilhamento em redes sociais
- [ ] Twitter Card configurado: `twitter:card = 'summary_large_image'`
- [ ] Eventos Meta Pixel disparados: `PageView` ao carregar, `InitiateCheckout` ao clicar em CTA
- [ ] Google Ads conversion tag disparada ao clicar em CTA (via GTM)
- [ ] Pagina responsiva: mobile-first, botao CTA fixo no rodape em mobile
- [ ] Teste: abrir no mobile — CTA visivel sem scroll, imagens carregam em menos de 2s

**Notas Tecnicas:**
- Criar layout separado `app/copa/layout.tsx` que nao inclui o `RootLayout` com Navbar/Footer
- O contador regressivo deve parar em zero (nao ir negativo) e exibir "Oferta encerrada" apos a data
- Usar `next/image` com `priority` no hero para LCP otimizado
- A pagina nao deve aparecer no sitemap.xml principal

---

### US-C.2 — Integracao Meta Pixel e Google Tag Manager

**Como** gestor de marketing,
**Quero** que o Meta Pixel e o Google Tag Manager estejam configurados e disparando eventos corretos em toda a loja,
**Para** rastrear conversoes com precisao e otimizar campanhas pagas no Facebook Ads e Google Ads.

**Prioridade:** Fase 2
**Dependencias:** US-01.3 (variaveis de ambiente — EPIC-01)

**Criterios de Aceitacao:**
- [ ] Meta Pixel inicializado no `app/layout.tsx` com o ID lido de `NEXT_PUBLIC_PIXEL_ID` [A_CONFIGURAR]
- [ ] Evento `PageView` disparado automaticamente a cada navegacao (usando `usePathname`)
- [ ] Evento `ViewContent` disparado na PDP com: `content_ids: [product.id]`, `content_name: product.name`, `value: product.price`, `currency: 'BRL'`
- [ ] Evento `AddToCart` disparado ao adicionar item ao carrinho com: `content_ids`, `value`, `currency`
- [ ] Evento `InitiateCheckout` disparado ao acessar `/checkout` com: `num_items`, `value`
- [ ] Evento `Purchase` disparado na pagina de confirmacao com: `order_id`, `value` (total), `currency: 'BRL'`
- [ ] Google Tag Manager inicializado com ID lido de `NEXT_PUBLIC_GTM_ID` [A_CONFIGURAR]
- [ ] `dataLayer.push` implementado para eventos de: pageview, produto visualizado, adicionar ao carrinho, checkout iniciado, compra concluida
- [ ] Google Analytics 4 configurado via GTM com os mesmos eventos
- [ ] IDs do Pixel, GTM e GA4 editaveis no painel admin em `/admin/configuracoes` sem mexer no codigo
- [ ] Ao salvar no admin, os valores sao persistidos em `store_settings` e aplicados via `NEXT_PUBLIC` vars reconfiguradas (ou via variavel de ambiente injetada no build)
- [ ] Evento de Purchase nao deve disparar duplicado em reloads (verificar com `sessionStorage`)
- [ ] Teste: abrir a loja com Facebook Pixel Helper — `PageView` aparece em cada pagina
- [ ] Teste: completar uma compra de teste — evento `Purchase` aparece no Pixel Helper e no GTM Preview

**Notas Tecnicas:**
- Usar `react-facebook-pixel` ou implementacao manual via `useEffect` com `fbq()`
- O GTM deve ser carregado de forma assíncrona (`strategy='afterInteractive'` no `next/script`)
- Para evitar problemas com SSR, usar `typeof window !== 'undefined'` antes de chamar `fbq()`
- Os IDs do Pixel/GTM/GA4 armazenados em `store_settings` sao lidos no build ou injetados via middleware de headers — discutir abordagem com o arquiteto

---

### US-C.3 — Sistema de Promocoes Avancadas no Admin

**Como** administrador,
**Quero** configurar promocoes de volume (quantidade de itens), banners promocionais e cupons com regras avancadas,
**Para** executar campanhas de vendas flexiveis sem precisar de alteracoes no codigo.

**Prioridade:** Fase 2
**Dependencias:** US-06.5 (promocoes — EPIC-01), US-A.1 (tabela banners)

**Criterios de Aceitacao:**
- [ ] Pagina `/admin/promocoes` com tabs: "Regras de Volume", "Banners", "Cupons"
- [ ] **Tab Regras de Volume:**
- [ ] Listagem de regras de volume cadastradas com: quantidade minima, percentual de desconto, status ativo/inativo
- [ ] Formulario "Nova Regra de Volume": Quantidade minima de camisas (number, min 2), Desconto (%, max 50%), Descricao (texto livre), Ativo (toggle)
- [ ] Multiplas regras podem coexistir — o sistema aplica a mais favoravel ao cliente (maior desconto valido)
- [ ] Exemplo de regras pre-cadastradas: "2 camisas = 5% OFF", "3 camisas = 10% OFF", "5+ camisas = 15% OFF"
- [ ] A contagem de camisas e baseada na **soma do campo `quantity`** de todos os `order_items` do carrinho
- [ ] **Tab Banners:**
- [ ] Listagem de banners com preview de imagem, titulo, periodo, status
- [ ] Formulario "Novo Banner": Upload de imagem (JPG/PNG, max 2MB, proporcao 16:9 recomendada), Titulo interno, URL de destino (link ao clicar), Data inicio, Data fim, Posicao (numero de ordem), Ativo (toggle)
- [ ] Banners com `is_active = true` e dentro do periodo (`starts_at <= NOW() <= ends_at`) exibidos na home
- [ ] **Tab Cupons (melhorias):**
- [ ] Campo "Limite de uso por cliente (CPF)" adicionado ao formulario de cupons: numero inteiro, 0 = sem limite
- [ ] Campo "Valor minimo de pedido" adicionado: valor em R$, 0 = sem minimo
- [ ] Toggle "Cupom publico" (exibir na pagina /promocoes sem precisar de codigo)
- [ ] Listagem de cupons com colunas: Codigo, Tipo, Valor, Min. Pedido, Usos, Limite Usos, Validade, Status
- [ ] Teste: criar regra "3 camisas = 10%" — adicionar 3 itens ao carrinho — desconto aparece automaticamente
- [ ] Teste: criar banner com data futura — nao exibido na home; ao chegar a data, exibido

**Notas Tecnicas:**
- As regras de volume substituem o hardcode atual de "3+ camisas" que sera removido
- A aplicacao de desconto de volume ocorre no calculo do total no `POST /api/checkout/calculate`
- Os banners da home substituem o carousel atual estatico

---

### US-C.4 — Pagina /promocoes

**Como** visitante,
**Quero** uma pagina dedicada de promocoes com todos os produtos em oferta, banners e cupons publicos disponiveis,
**Para** descobrir facilmente as melhores oportunidades de compra sem precisar navegar pelo catalogo inteiro.

**Prioridade:** Fase 2
**Dependencias:** US-C.3, US-02.3 (catalogo — EPIC-01)

**Criterios de Aceitacao:**
- [ ] Rota `/promocoes` criada e linkada no menu de navegacao principal
- [ ] Secao de banners: exibe banners ativos da tabela `banners` com imagem, titulo e link
- [ ] Grid de produtos em promocao: produtos onde `promotional_price IS NOT NULL AND promotional_price < price`
- [ ] Card de produto exibe: preco original riscado, preco promocional em destaque, percentual de economia calculado (ex: "15% OFF")
- [ ] Contador regressivo nas promocoes com data de fim configurada (se `ends_at` definido no banner)
- [ ] Secao "Cupons Disponiveis": lista de cupons com `is_public = true` e dentro da validade
- [ ] Cada cupom publico exibe: codigo em destaque (ou "Aplicar automaticamente" se sem codigo), descricao, desconto, validade
- [ ] Botao "Copiar Codigo" copia o codigo para clipboard com feedback visual "Copiado!"
- [ ] Se nao ha promocoes ativas: mensagem "Em breve novas promocoes. Cadastre seu email para ser avisado." com input de email (newsletter)
- [ ] Meta tags SEO: title "Promocoes | Gabinete FC", description com lista de descontos ativos
- [ ] Pagina com ISR `revalidate: 300` (5 minutos)
- [ ] Teste: criar produto com preco promocional — aparece em /promocoes com percentual correto

**Notas Tecnicas:**
- Adicionar campo `promotional_price` na tabela `products` se ainda nao existir (migration)
- Os cupons publicos nao precisam de codigo para serem aplicados — sao auto-aplicados no checkout via query por `is_public = true`

---

---

# EPIC-D: Operacoes Avancadas

**Descricao:** Automacao operacional incluindo tracking automatico via Correios com cron job, relatorios financeiros completos com exportacao, e sistema de busca avancada com autocomplete.

**Fase:** Fase 2
**Prioridade:** Media
**Dependencias:** EPIC-A, EPIC-01 completo

---

### US-D.1 — Tracking Automatico via Cron Job Correios

**Como** sistema,
**Quero** um cron job que atualize automaticamente o status de rastreio de todos os pedidos em transito a cada 4 horas,
**Para** manter os clientes informados sem que o administrador precise verificar manualmente cada pedido.

**Prioridade:** Fase 2
**Dependencias:** US-05.2 (rastreio — EPIC-01), US-A.1 (campos tracking_events_json), US-A.3 (maquina de estados)

**Criterios de Aceitacao:**
- [ ] Vercel Cron Job configurado em `vercel.json` com agendamento `0 */4 * * *` (a cada 4 horas)
- [ ] Route Handler `GET /api/cron/tracking` autenticado com `CRON_SECRET` [A_CONFIGURAR] no header `Authorization`
- [ ] O cron busca todos os pedidos com `status IN ('processing', 'shipped')` e `tracking_code IS NOT NULL`
- [ ] Para cada pedido, consulta a API dos Correios com o codigo de rastreio
- [ ] Eventos retornados salvos no campo `tracking_events_json` (array de `{date, status, description, location}`)
- [ ] Campo `tracking_updated_at` atualizado com `NOW()` a cada atualizacao
- [ ] Se status retornado for "Objeto entregue ao destinatario": atualiza `orders.status` para `delivered`
- [ ] Ao mudar para `delivered`: envia email "Seu pedido chegou! Avalie o produto" com link para formulario de avaliacao
- [ ] Se status retornado indicar "Em transito": se `orders.status` ainda for `processing`, muda para `shipped` e envia email com link de rastreio
- [ ] Deteccao de retencao alfandegaria: se eventos contem "Aguardando pagamento de impostos" ou similar, envia email automatico com instrucoes de desembaraco
- [ ] Codigo de rastreio invalido ou expirado na API dos Correios: log do erro em `order_history` com `action = 'tracking_error'`, sem alterar o status do pedido
- [ ] Tratamento de rate limiting da API Correios: delay de 200ms entre requisicoes, retry com backoff exponencial em erros 429
- [ ] Log de execucao do cron em `order_history` com `action = 'cron_tracking_run'` e nota com quantos pedidos processados
- [ ] Teste: simular pedido shipped — cron atualiza eventos, status muda para delivered, email enviado

**Notas Tecnicas:**
- O endpoint deve retornar `{ processed: N, updated: M, errors: [...] }` para monitoring
- Usar `Promise.allSettled` para processar pedidos em paralelo com limite de 10 concorrentes (p-limit)
- A autenticacao do cron usa `Authorization: Bearer {CRON_SECRET}` verificado no inicio do handler

---

### US-D.2 — Timeline de Rastreio na Area do Cliente

**Como** cliente logado,
**Quero** ver uma timeline visual com todos os eventos do meu pedido (desde confirmacao ate entrega),
**Para** acompanhar exatamente onde minha encomenda esta sem sair do site.

**Prioridade:** Fase 2
**Dependencias:** US-D.1, US-03.4 (acompanhamento pedido — EPIC-01)

**Criterios de Aceitacao:**
- [ ] Na pagina de detalhe do pedido `/conta/pedidos/[id]`, secao de rastreio exibida se `tracking_code IS NOT NULL`
- [ ] Timeline vertical com eventos em ordem cronologica inversa (mais recente no topo)
- [ ] Cada evento exibe: icone de status, data/hora formatada em pt-BR, descricao, localizacao (cidade/UF)
- [ ] Ultimo evento (mais recente) destacado visualmente (cor de destaque, icone maior)
- [ ] Indicador de ultimo update: "Atualizado em {tracking_updated_at} (atualiza automaticamente a cada 4 horas)"
- [ ] Botao "Rastrear no site dos Correios" (link externo para rastreamento.correios.com.br com o codigo)
- [ ] Se nenhum evento disponivel ainda: "Seu pedido sera enviado em breve. O codigo de rastreio chegara por email."
- [ ] Se rastreio expirado ou com erro: "Nao foi possivel obter atualizacoes de rastreio. Acesse o site dos Correios com o codigo: {tracking_code}"
- [ ] Teste: pedido com 5 eventos de rastreio — timeline exibe todos em ordem, mais recente no topo

**Notas Tecnicas:**
- Os dados de rastreio sao lidos diretamente de `orders.tracking_events_json` (sem nova chamada a API dos Correios no carregamento da pagina)
- Parsear o JSON e ordenar por data no servidor (Server Component)

---

### US-D.3 — Relatorios Financeiros Completos no Admin

**Como** administrador,
**Quero** relatorios financeiros detalhados com extrato Stripe, receita por forma de pagamento, parcelamentos e exportacao em CSV,
**Para** ter visibilidade completa da saude financeira do negocio e preparar declaracoes fiscais.

**Prioridade:** Fase 2
**Dependencias:** US-06.8 (financeiro — EPIC-01), US-04.1 (Stripe — EPIC-01)

**Criterios de Aceitacao:**
- [ ] Pagina `/admin/financeiro` com tabs: "Extrato", "Receita", "Parcelamentos", "Chargebacks"
- [ ] **Tab Extrato Stripe:**
- [ ] Lista de transacoes com colunas: Data, Cliente, Descricao, Valor Bruto, Taxa Stripe (calculada: 2,9% + R$0,39), Valor Liquido
- [ ] Filtros: periodo (data inicial e data final com date picker), forma de pagamento (Pix / Debito / Credito)
- [ ] Resumo no topo: Total Bruto, Total Taxas, Total Liquido para o periodo selecionado
- [ ] Botao "Exportar CSV" gera arquivo com todas as colunas do extrato para o periodo selecionado
- [ ] **Tab Receita:**
- [ ] Grafico de barras: receita por dia nos ultimos 30 dias
- [ ] Comparativo de periodo: "Esta semana: R$ X | Semana passada: R$ Y | Variacao: +Z%"
- [ ] Receita por forma de pagamento: pizza chart (Pix, Debito, Credito 1x, Credito 2x+)
- [ ] **Tab Parcelamentos:**
- [ ] Listagem de pagamentos parcelados com: pedido, cliente, valor total, numero de parcelas, datas previstas de recebimento por parcela
- [ ] Projecao de recebimento: quanto sera recebido nos proximos 30, 60, 90 dias de parcelamentos em aberto
- [ ] **Tab Chargebacks:**
- [ ] Lista de disputas abertas no Stripe com: pedido, cliente, valor, motivo da disputa, prazo para resposta, status
- [ ] Itens com prazo de resposta em menos de 3 dias destacados em vermelho
- [ ] Link direto para o dashboard do Stripe para cada disputa
- [ ] Teste: filtrar por periodo — totais e lista atualizam corretamente
- [ ] Teste: exportar CSV — arquivo gerado com todos os campos e encoding UTF-8

**Notas Tecnicas:**
- Usar Stripe API (`stripe.charges.list`, `stripe.disputes.list`, `stripe.paymentIntents.list`) no servidor
- As taxas Stripe sao estimadas (2,9% + R$0,39 por transacao para cartao; 0,99% para Pix) — exibir como estimativa
- Para parcelamentos, consultar `stripe.paymentIntents.retrieve` com expand `['latest_charge.payment_method_details']`
- O CSV deve ter BOM UTF-8 para compatibilidade com Excel

---

### US-D.4 — Busca com Autocomplete

**Como** visitante,
**Quero** busca com sugestoes enquanto digito no campo de busca do header,
**Para** encontrar produtos mais rapidamente sem precisar pressionar Enter e navegar pela pagina de resultados.

**Prioridade:** Fase 2
**Dependencias:** US-02.9 (busca — EPIC-01 se existente)

**Criterios de Aceitacao:**
- [ ] Campo de busca no header exibe dropdown de sugestoes ao digitar (minimo 2 caracteres)
- [ ] Debounce de 300ms antes de disparar a requisicao de busca
- [ ] Sugestoes retornadas em ate 500ms (timeout configuravel)
- [ ] Dropdown exibe ate 5 produtos e ate 3 categorias correspondentes
- [ ] Cada sugestao de produto exibe: imagem thumbnail (40x40px), nome do produto, preco
- [ ] Cada sugestao de categoria exibe: icone de categoria, nome da categoria
- [ ] Busca por: nome do produto, nome da selecao/time, tipo de produto (camisa, agasalho, etc.)
- [ ] Navegacao por teclado: setas cima/baixo para navegar sugestoes, Enter para selecionar, Escape para fechar
- [ ] Clicar em sugestao de produto navega para a PDP do produto
- [ ] Clicar em sugestao de categoria navega para `/catalogo?categoria={slug}`
- [ ] Historico das ultimas 5 buscas armazenado em `localStorage` (chave: `gfc_search_history`)
- [ ] Ao focar o campo vazio, exibe historico de buscas recentes com titulo "Buscas recentes"
- [ ] Se nenhum resultado encontrado: exibe "Nenhum resultado para '{termo}'" + sugestao de 3 categorias populares
- [ ] Dropdown fecha ao clicar fora ou perder foco (com delay de 150ms para evitar fechar antes do clique)
- [ ] Teste: digitar "brasil" — produtos da selecao brasileira aparecem como sugestao em menos de 500ms

**Notas Tecnicas:**
- Route Handler `GET /api/search/suggestions?q={termo}&limit=8` com busca `ilike '%{termo}%'` no Supabase
- Usar `useCombobox` do Downshift ou implementacao custom com `useReducer`
- A busca full-text pode usar `to_tsvector` do PostgreSQL para melhor performance em producao

---

### US-D.5 — Upsell e Produtos Relacionados

**Como** visitante e cliente logado,
**Quero** ver sugestoes de produtos relacionados na pagina do produto e no carrinho,
**Para** descobrir itens complementares e ser lembrado de aproveitar o frete para levar mais itens.

**Prioridade:** Fase 2
**Dependencias:** US-02.4 (PDP — EPIC-01), US-02.7 (carrinho — EPIC-01)

**Criterios de Aceitacao:**
- [ ] Na PDP: secao "Produtos Relacionados" exibida abaixo das avaliacoes com grid de 4 produtos
- [ ] Algoritmo de relacionados: produtos da mesma `category` (selecao) excluindo o produto atual, ordenados por `is_featured DESC, created_at DESC`
- [ ] Na pagina de carrinho: secao "Clientes que compraram isso tambem levaram" com 3 a 4 sugestoes
- [ ] Algoritmo do carrinho: buscar os produtos mais comprados em conjunto com os itens do carrinho atual (via query em `order_items` — co-purchases); fallback para mesma categoria se sem dados suficientes
- [ ] Mini carrinho (drawer): barra de progresso "Faltam R$ X para frete gratis!" se total < R$300 (configuravel em `store_settings`, chave `free_shipping_threshold`)
- [ ] Barra de progresso atualiza em tempo real ao adicionar/remover itens
- [ ] Ao atingir o limiar de frete gratis: mensagem "Voce ganhou frete gratis!" com animacao
- [ ] Sugestoes nao exibem produtos fora de estoque (`is_active = false`)
- [ ] Teste: PDP com produto da selecao brasileira — 4 outros produtos brasileiros aparecem como relacionados

**Notas Tecnicas:**
- A query de co-purchases: `SELECT product_id, COUNT(*) FROM order_items WHERE order_id IN (SELECT order_id FROM order_items WHERE product_id = ANY({ids_do_carrinho})) GROUP BY product_id ORDER BY COUNT DESC LIMIT 4`
- Cache da query de co-purchases com `unstable_cache` do Next.js, revalidar a cada 1 hora

---

---

# EPIC-E: Expansao de Produto

**Descricao:** Expansao do catalogo com novas categorias (clubes brasileiros, europeus, NBA, NFL, F1), sistema de colecoes/temporadas, filtros expandidos e UX de conversao avancada.

**Fase:** Fase 3
**Prioridade:** Baixa
**Dependencias:** EPIC-A, EPIC-B, EPIC-C, EPIC-D completos

---

### US-E.1 — Novas Categorias e Sistema de Colecoes

**Como** administrador,
**Quero** cadastrar produtos em novas categorias (Clubes Brasileiros, Clubes Europeus, NBA, NFL, Formula 1) e organiza-los em colecoes/temporadas,
**Para** expandir o catalogo e facilitar a navegacao de clientes com interesses em diferentes esportes.

**Prioridade:** Fase 3
**Dependencias:** US-06.4 (admin produtos — EPIC-01)

**Criterios de Aceitacao:**
- [ ] Enum `product_category` expandido com novos valores: `'clube_brasileiro'`, `'clube_europeu'`, `'nba'`, `'nfl'`, `'formula1'`
- [ ] Tabela `collections` criada: `id uuid PK`, `name varchar(100)`, `slug varchar(100) UNIQUE`, `description text`, `season varchar(20)` (ex: "2026"), `starts_at date`, `ends_at date nullable`, `is_active boolean`, `created_at timestamptz`
- [ ] Tabela de relacionamento `product_collections`: `product_id uuid FK`, `collection_id uuid FK`, PK composta
- [ ] No admin de produtos (`/admin/produtos`): campo "Categoria" expandido com as novas opcoes
- [ ] No admin de produtos: campo "Colecao" (multi-select) para vincular produto a uma ou mais colecoes
- [ ] Pagina `/admin/colecoes` para gerenciar colecoes: criar, editar, ativar/desativar, listar produtos
- [ ] Campo "Atributos extras" no produto: campo JSON livre para atributos por tipo (ex: `{numero: '10', nome: 'Neymar'}` para camisas de clube)
- [ ] Interface de atributos extras no admin: pares chave-valor adicionaveis dinamicamente
- [ ] Teste: criar colecao "Temporada 2026", vincular 3 produtos — colecao aparece no filtro do catalogo

**Notas Tecnicas:**
- Migration separada para expandir o enum de categorias e criar tabelas de colecoes
- O campo `extra_attributes` em `products` e do tipo `jsonb` — sem schema rigido para flexibilidade

---

### US-E.2 — Filtros Expandidos e Paginas de Categoria para SEO

**Como** visitante,
**Quero** filtrar o catalogo pelas novas categorias e acessar paginas dedicadas por categoria com URL otimizada para SEO,
**Para** encontrar rapidamente os produtos do meu esporte/time favorito e para que o Google indexe as paginas de categoria.

**Prioridade:** Fase 3
**Dependencias:** US-E.1, US-02.3 (catalogo — EPIC-01)

**Criterios de Aceitacao:**
- [ ] Menu de navegacao atualizado com novos links: "Times Brasileiros", "Times Europeus", "NBA", "NFL", "Formula 1"
- [ ] Rotas `/catalogo/[categoria]` criadas com SSG para cada categoria (ex: `/catalogo/nba`)
- [ ] Pagina de categoria com: H1 com nome da categoria, descricao da categoria, grid de produtos filtrados
- [ ] Filtros laterais atualizados para incluir as novas categorias no filtro "Tipo"
- [ ] Filtro "Colecao" adicionado ao catalogo: lista de colecoes ativas
- [ ] Filtro "Temporada" adicionado: ano da colecao (ex: "2026", "2025")
- [ ] Para camisas de clubes: filtro de "Tipo de Camisa" (uniforme 1, uniforme 2, goleiro, treino)
- [ ] Meta tags SEO por pagina de categoria: `title = '{Categoria} | Gabinete FC'`, `description` personalizada
- [ ] Schema.org `ItemList` com os produtos da categoria para rich snippets
- [ ] Sitemap.xml atualizado automaticamente para incluir novas paginas de categoria
- [ ] Breadcrumb nas paginas de categoria: Home > Catalogo > {Categoria}
- [ ] Teste: acessar `/catalogo/nba` — apenas produtos da categoria NBA exibidos, meta tags corretas

**Notas Tecnicas:**
- Usar `generateStaticParams` para pre-gerar as paginas de categoria no build
- ISR com `revalidate: 3600` para regenerar quando novos produtos forem adicionados

---

### US-E.3 — UX de Conversao Avancada

**Como** visitante,
**Quero** uma experiencia de compra com microinteracoes que transmitam urgencia e facilitem decisoes de compra,
**Para** que eu seja estimulado a comprar mais rapidamente sem me sentir pressionado de forma negativa.

**Prioridade:** Fase 3
**Dependencias:** US-02.4 (PDP — EPIC-01), US-A.7 (estoque fisico)

**Criterios de Aceitacao:**
- [ ] Badge "Ultimas unidades" exibido automaticamente na PDP e nos cards de produto quando estoque fisico do tamanho for menor que 3 unidades (configuravel em `store_settings`, chave `low_stock_badge_threshold`, default `3`)
- [ ] O badge usa dados da view `stock_current_position` (calculada em US-A.7)
- [ ] Zoom de imagem na PDP: hover no desktop ativa zoom 2x via CSS `transform: scale(2)` com `overflow: hidden` no container
- [ ] Botao de compartilhamento na PDP: "Compartilhar" abre menu com opcoes: WhatsApp (link `wa.me` com texto pre-formatado), Copiar link
- [ ] Texto para WhatsApp: "Vi essa camisa no Gabinete FC e acho que voce vai gostar: {product.name} por R${price} — {url}"
- [ ] Contador regressivo em banners de oferta (baseado em `banners.ends_at`) — componente reutilizavel de US-C.1
- [ ] Animacao de adicionar ao carrinho: icone do produto voa em direcao ao icone do carrinho (animacao CSS/Framer Motion)
- [ ] Indicador de "X pessoas viram este produto hoje" — dado sintetico configuravel por produto no admin (campo `views_today_display` na tabela `products`, nullable, exibido apenas se preenchido)
- [ ] Teste: produto com estoque = 2 — badge "Ultimas unidades" aparece na PDP e no card
- [ ] Teste: hover na imagem do produto no desktop — zoom 2x funcional

**Notas Tecnicas:**
- O campo `views_today_display` e intencional como dado de marketing configuravel — nao e rastreamento real
- O zoom de imagem deve ser desabilitado em mobile (media query) para nao interferir com o toque
- O botao de compartilhar usa a Web Share API onde disponivel (`navigator.share`), com fallback para o menu custom

---

### US-E.4 — Personalizacao de Camisas de Clubes

**Como** cliente logado,
**Quero** personalizar a camisa de clube com nome e numero antes de adicionar ao carrinho,
**Para** receber uma camisa unica com a identidade do meu jogador favorito.

**Prioridade:** Fase 3
**Dependencias:** US-E.1, US-02.4 (PDP — EPIC-01)

**Criterios de Aceitacao:**
- [ ] Na PDP de produtos da categoria `clube_brasileiro` ou `clube_europeu`: secao "Personalizar" aparece se produto tem atributo `allows_customization = true`
- [ ] Campo "Nome" (texto, max 15 caracteres, uppercase automatico, apenas letras e espacos)
- [ ] Campo "Numero" (numero, 1 a 99)
- [ ] Preview visual: imagem da camisa com nome e numero sobrepostos (CSS overlay com fonte adequada)
- [ ] Adicionar ao carrinho com personalizacao: os dados sao armazenados em `order_items.customization_json` (`{name: 'RONALDO', number: 7}`)
- [ ] Preco adicional de personalizacao: R$ 20,00 (configuravel em `store_settings`, chave `customization_price`, default `20.00`)
- [ ] Confirmacao ao adicionar: "Camisa personalizada com RONALDO #7 adicionada ao carrinho. Adicional de R$20,00."
- [ ] Na pagina de pedido (admin e cliente): exibe os dados de personalizacao junto ao item
- [ ] Campo `customization_json` adicionado a tabela `order_items` (jsonb, nullable)
- [ ] Teste: adicionar camisa personalizada ao carrinho — preco correto, personalizacao exibida no pedido

**Notas Tecnicas:**
- O preview de personalizacao e uma sobreposicao CSS na imagem do produto — nao gera imagem real
- O campo `allows_customization` e armazenado em `products.extra_attributes` como `{allows_customization: true}`

---

---

# EPIC-F: Retencao e Fidelidade

**Descricao:** Programa de fidelidade com pontos, notificacao de volta ao estoque e Progressive Web App (PWA) para maior retencao e engajamento de longo prazo.

**Fase:** Fase 3
**Prioridade:** Baixa
**Dependencias:** EPIC-A, EPIC-B, EPIC-C, EPIC-D completos

---

### US-F.1 — Programa de Fidelidade com Pontos

**Como** cliente logado,
**Quero** acumular pontos a cada compra e resga-los como desconto em pedidos futuros,
**Para** ser recompensado pela minha fidelidade a loja e ter incentivo para voltar a comprar.

**Prioridade:** Fase 3
**Dependencias:** US-A.1 (tabela loyalty_points), US-04.1 (checkout — EPIC-01)

**Criterios de Aceitacao:**
- [ ] Regra de acumulo: 1 ponto por R$1,00 gasto (configuravel em `store_settings`, chave `loyalty_points_per_real`, default `1`)
- [ ] Pontos acumulados automaticamente apos pedido com `payment_status = 'paid'`
- [ ] Regra de resgate: 100 pontos = R$5,00 de desconto (configuravel em `store_settings`, chave `loyalty_points_to_reais_ratio`: `{points: 100, reais: 5}`)
- [ ] Expiracao de pontos: 365 dias apos acumulo (configuravel em `store_settings`, chave `loyalty_points_expiry_days`, default `365`)
- [ ] Area do cliente: pagina `/conta/fidelidade` com saldo atual, historico de acumulos/resgates, pontos a expirar nos proximos 30 dias
- [ ] No checkout: secao "Usar pontos" exibe saldo disponivel e permite aplicar desconto
- [ ] Ao aplicar pontos: desconto calculado, pontos sao bloqueados (nao deduzidos ate confirmacao de pagamento)
- [ ] Pontos deduzidos do saldo apenas apos `payment_status = 'paid'` — nunca antes
- [ ] Em caso de cancelamento/reembolso: pontos resgatados sao estornados, pontos acumulados do pedido sao removidos
- [ ] Dashboard admin `/admin/fidelidade`: total de pontos emitidos, total resgatados, total expirados, custo estimado do programa em R$
- [ ] Email automatico 30 dias antes de pontos expirarem: "Seus X pontos expiram em 30 dias!"
- [ ] Teste: fazer pedido de R$150 — 150 pontos creditados; resgatar 100 pontos — R$5 de desconto aplicado

**Notas Tecnicas:**
- Pontos sao operacoes em `loyalty_points` com `action` enum: `'earned'`, `'redeemed'`, `'expired'`, `'reversed'`
- O saldo atual e calculado: `SUM(points) WHERE action = 'earned' AND NOT expired - SUM(points) WHERE action = 'redeemed'`
- Cron job diario `0 6 * * *` para marcar pontos expirados (`expires_at < NOW()`) com insercao de registro `action = 'expired'`

---

### US-F.2 — Notificacao de Volta ao Estoque

**Como** visitante ou cliente logado,
**Quero** me cadastrar para receber um aviso por email quando um produto esgotado voltar ao estoque,
**Para** nao precisar verificar manualmente a disponibilidade repetidas vezes.

**Prioridade:** Fase 3
**Dependencias:** US-A.1 (tabela stock_alerts), US-A.7 (gestao de estoque)

**Criterios de Aceitacao:**
- [ ] Na PDP, para cada tamanho esgotado (sem quantidade em `stock_current_position`): botao "Avise-me" aparece no lugar do seletor de tamanho
- [ ] Clicar em "Avise-me": modal com campo de email (pre-preenchido se logado, editavel)
- [ ] Ao confirmar: registro criado em `stock_alerts` com `{product_id, size, email, user_id (se logado), notified_at: null}`
- [ ] Mensagem de confirmacao: "Iremos te avisar quando o tamanho M do {produto} chegar!"
- [ ] Se usuario ja cadastrou alerta para o mesmo produto+tamanho: mensagem "Voce ja esta na lista de espera para este produto."
- [ ] Quando admin registra entrada de estoque em `/admin/estoque`: sistema verifica `stock_alerts` para o produto+tamanho
- [ ] Se ha alertas pendentes (`notified_at IS NULL`): envia email para cada cadastrado e atualiza `notified_at = NOW()`
- [ ] Email de notificacao: assunto "Chegou! {produto} tamanho {size} esta disponivel", CTA direto para a PDP
- [ ] Gerenciar alertas na area do cliente (`/conta/alertas`): listar alertas ativos, botao "Cancelar aviso" para remover
- [ ] Teste: cadastrar alerta para tamanho M esgotado; admin registra entrada de 5 unidades do tamanho M — email enviado, `notified_at` preenchido

**Notas Tecnicas:**
- O envio de emails de notificacao e disparado no mesmo Route Handler de entrada de estoque (US-A.7), de forma assincrona
- Limitar a 1 email por alerta — uma vez notificado, o alerta nao dispara novamente (usuario pode se re-cadastrar)
- Para visitantes sem conta: apenas email salvo; sem restricao de duplicatas por email (usuario pode ter se esquecido)

---

### US-F.3 — Progressive Web App (PWA)

**Como** cliente mobile,
**Quero** instalar o Gabinete FC como um app no meu celular e receber notificacoes de atualizacao do meu pedido,
**Para** ter uma experiencia mais rapida e conveniente sem precisar abrir o navegador toda vez.

**Prioridade:** Fase 3
**Dependencias:** US-07.3 (performance — EPIC-01)

**Criterios de Aceitacao:**
- [ ] Arquivo `public/manifest.json` criado com: `name: "Gabinete FC"`, `short_name: "Gabinete FC"`, `theme_color: "#1a472a"` (verde do tema), `background_color: "#000000"`, `display: "standalone"`, `start_url: "/"`
- [ ] Icones PWA gerados em resolucoes: 192x192, 512x512 (com fundo verde e logo branco)
- [ ] Service Worker implementado via `next-pwa` ou `serwist` para cache offline de paginas ja visitadas
- [ ] Estrategia de cache: `StaleWhileRevalidate` para paginas de produto, `NetworkFirst` para dados de pedido
- [ ] Botao "Instalar App" exibido na home em mobile quando o browser suporta `beforeinstallprompt` (Desktop Chrome e Android)
- [ ] Botao some apos instalacao ou apos usuario dispensar 2 vezes (armazenar em `localStorage`)
- [ ] Notificacoes push: ao fazer pedido, usuario e perguntado se deseja receber notificacoes de atualizacao
- [ ] Ao aceitar notificacoes: `PushSubscription` salva na tabela `push_subscriptions` (`id, user_id, endpoint, keys_json, created_at`)
- [ ] Notificacao push enviada quando status do pedido mudar (integrada com maquina de estados de US-A.3)
- [ ] Gerenciamento de notificacoes no admin: ativar/desativar envio de push por tipo de evento
- [ ] Pagina `/conta/notificacoes` na area do cliente: toggle para ativar/desativar cada tipo de notificacao
- [ ] Teste: instalar PWA no Android Chrome — abre como app standalone, sem barra de endereco
- [ ] Teste: pedido muda para "shipped" — notificacao push recebida no dispositivo

**Notas Tecnicas:**
- Usar `web-push` (Node.js library) para envio das notificacoes push via VAPID
- As chaves VAPID (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`) sao geradas uma unica vez e armazenadas em `.env`
- O cache offline deve excluir: paginas de checkout, paginas de admin, e requests autenticadas com dados sensiveis

---

---

## Apendice: Sumario de Novas Tabelas e Campos

### Tabelas Novas

| Tabela | EPIC | Descricao |
|---|---|---|
| `order_history` | A | Log de todas as alteracoes de status de pedido |
| `stock_movements` | A | Entradas e saidas do estoque fisico |
| `stock_alerts` | A / F | Alertas de volta ao estoque |
| `loyalty_points` | A / F | Programa de fidelidade - transacoes de pontos |
| `banners` | A / C | Banners promocionais da home e pagina /promocoes |
| `collections` | E | Colecoes e temporadas de produtos |
| `product_collections` | E | Relacionamento produto-colecao (N:N) |
| `push_subscriptions` | F | Assinaturas de notificacoes push PWA |

### Campos Novos em Tabelas Existentes

| Tabela | Campo | Tipo | EPIC |
|---|---|---|---|
| `products` | `is_featured` | boolean | A |
| `products` | `promotional_price` | numeric(10,2) | C |
| `products` | `views_today_display` | integer nullable | E |
| `products` | `extra_attributes` | jsonb | E |
| `orders` | `tracking_events_json` | jsonb | A |
| `orders` | `tracking_updated_at` | timestamptz | A |
| `order_items` | `customization_json` | jsonb | E |
| `coupons` | `is_public` | boolean | C |
| `coupons` | `max_uses_per_customer` | integer | C |

---

## Apendice: Variaveis de Ambiente Adicionais

Variaveis que devem ser adicionadas ao `.env.example` alem das do EPIC-01:

```
# Cron Job Security
CRON_SECRET=[A_CONFIGURAR]

# Admin Setup (uso unico)
ADMIN_SETUP_SECRET=[A_CONFIGURAR]

# PWA Push Notifications
VAPID_PUBLIC_KEY=[A_CONFIGURAR]
VAPID_PRIVATE_KEY=[A_CONFIGURAR]

# Copa Landing Page
NEXT_PUBLIC_COPA_OFFER_END_DATE=2026-07-15T23:59:59-03:00
```

---

## Apendice: Mapa de Dependencias Corrigido (EPIC-01 + EPIC-02 Complementar)

```
EPIC-01 Setup
     ↓
EPIC-A Correcoes (MVP — paralelo com EPIC-01 a partir de US-01.2)
     ↓
[EPIC-01 EPIC-02..07] + [EPIC-A todos] concluidos
     ↓
[EPIC-B || EPIC-C || EPIC-D] — Fase 2, paralelo entre si
     ↓
[EPIC-E || EPIC-F] — Fase 3, paralelo entre si
```

---

*Documento gerado por @pm (Product Manager) — Synkra AIOS*
*Versao: 1.0 | Data: 2026-04-16 | Projeto: Gabinete FC*
*Complementar a: EPIC-gabinete-fc-v1.0.md*

---

### Critical Files for Implementation

- `C:\Users\mathe\OneDrive\Área de Trabalho\GABINETE FC\GABINETE-FC\docs\epics\EPIC-gabinete-fc-v1.0.md` — EPIC base a ser complementado; todas as dependencias referenciadas (US-01.2, US-06.x, etc.) estao neste arquivo
- `C:\Users\mathe\OneDrive\Área de Trabalho\GABINETE FC\GABINETE-FC\docs\epics\QA-diagnostico-EPIC-v1.0.md` — Fonte primaria dos gaps criticos (CRITICO-01 a 07) que fundamentam o EPIC-A; deve ser consultado para validar que todas as correcoes foram adressadas
- `C:\Users\mathe\OneDrive\Área de Trabalho\GABINETE FC\GABINETE-FC\.env.example` — Arquivo de variaveis de ambiente que precisara receber as novas entradas do EPIC-02 Complementar (CRON_SECRET, VAPID keys, ADMIN_SETUP_SECRET)agentId: aa8c8774e41666ce3 (for resuming to continue this agent's work if needed)
<usage>total_tokens: 44748
tool_uses: 6
duration_ms: 336905</usage>