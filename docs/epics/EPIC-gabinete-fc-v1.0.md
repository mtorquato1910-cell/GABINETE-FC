# EPIC: Gabinete FC - E-commerce de Camisas de Futebol

**Versão:** 1.0
**Data:** 2026-04-16
**Autor:** @pm (Product Manager) - Synkra AIOS
**Status:** Draft para Revisao

---

## Sumario Executivo

O Gabinete FC e um e-commerce brasileiro especializado em camisas de futebol autenticas importadas da Tailandia (fornecedor JIN), operando no modelo dropshipping. O projeto entrega uma experiencia de compra premium com bot de suporte inteligente (Claude API), pagamentos via Stripe (cartao e Pix), calculo de frete via Correios e painel administrativo completo.

O projeto parte de um frontend React/Vite existente que sera migrado e evoluido para a stack definitiva (Next.js + Supabase + Stripe), mantendo os componentes e logica de UI ja produzidos como base.

**Resultado Esperado:** Loja online totalmente operacional, com checkout funcional, area do cliente, painel admin e bot de suporte, pronta para receber trafego organico e pago no mercado brasileiro.

---

## Indice de Sub-Epics

| Sub-Epic | Titulo | Prioridade |
|---|---|---|
| EPIC-01 | Infraestrutura e Setup | MVP |
| EPIC-02 | Frontend Publico | MVP |
| EPIC-03 | Autenticacao e Area do Cliente | MVP |
| EPIC-04 | Checkout e Pagamentos | MVP |
| EPIC-05 | Integracoes (Correios, Email, Bot) | MVP |
| EPIC-06 | Painel Administrativo | MVP |
| EPIC-07 | SEO, Performance e Deploy | MVP / Fase 2 |

---

---

# EPIC-01: Infraestrutura e Setup

**Descricao:** Configuracao de toda a base tecnica do projeto - repositorio, banco de dados, autenticacao de base, variaveis de ambiente, estrutura de pastas e pipeline de deploy. Nenhuma feature de produto pode ser iniciada sem este epic concluido.

---

### US-01.1 - Migracao e Setup do Repositorio Next.js

**Como** desenvolvedor,
**Quero** um projeto Next.js 14 (App Router) configurado e pronto para desenvolvimento,
**Para** que toda a equipe parta de uma base tecnica padronizada e o frontend existente seja preservado como referencia.

**Criterios de Aceitacao:**
- [ ] Projeto Next.js 14 com App Router inicializado na raiz do repositorio
- [ ] Tailwind CSS configurado e funcional
- [ ] shadcn/ui instalado e configurado com o tema do Gabinete FC (cores: verde, preto, branco)
- [ ] TypeScript configurado com `strict: true` e paths aliases (`@/components`, `@/lib`, etc.)
- [ ] ESLint + Prettier configurados com regras do projeto
- [ ] Estrutura de pastas criada: `app/`, `components/`, `lib/`, `types/`, `hooks/`, `styles/`
- [ ] Os componentes existentes do `time-shirt-showcase-main` copiados para `_legacy/` como referencia
- [ ] `.env.example` criado com todas as variaveis necessarias (sem valores reais)
- [ ] `.gitignore` atualizado incluindo `.env.local`, `.next/`, `node_modules/`
- [ ] README.md atualizado com instrucoes de setup local
- [ ] `npm run dev`, `npm run build` e `npm run lint` funcionando sem erros

**Notas Tecnicas:**
- Usar `create-next-app` com template TypeScript
- App Router e obrigatorio (não Pages Router)
- Manter pasta `_legacy/` com o codigo React/Vite anterior para consulta de componentes
- Configurar `next.config.js` com `images.domains` para Supabase Storage desde o inicio

---

### US-01.2 - Setup do Banco de Dados Supabase

**Como** desenvolvedor,
**Quero** o banco de dados Supabase configurado com todas as tabelas, indices e politicas RLS,
**Para** que o backend tenha uma base de dados segura, performatica e com controle de acesso correto.

**Criterios de Aceitacao:**
- [ ] Projeto Supabase criado no ambiente de desenvolvimento [A_CONFIGURAR]
- [ ] Schema SQL com todas as tabelas criado e versionado em `supabase/migrations/`
- [ ] Tabela `users` (id, email, full_name, role, phone, cpf, created_at, updated_at)
- [ ] Tabela `products` (id, name, slug, description, price, images, category, team, type, sizes_available, stock_notes, meta_title, meta_description, is_active, created_at, updated_at)
- [ ] Tabela `orders` (id, user_id, status, total, subtotal, freight_cost, coupon_id, payment_method, payment_status, stripe_payment_intent_id, tracking_code, carrier, notes, created_at, updated_at)
- [ ] Tabela `order_items` (id, order_id, product_id, product_name, product_image, size, quantity, unit_price, total_price)
- [ ] Tabela `addresses` (id, user_id, label, recipient_name, street, number, complement, neighborhood, city, state, zip_code, is_default)
- [ ] Tabela `reviews` (id, user_id, product_id, order_id, rating, title, body, photos, status, admin_response, coupon_generated_id, created_at, updated_at)
- [ ] Tabela `coupons` (id, code, type, value, min_order_value, max_uses, used_count, user_id_restriction, expires_at, is_active)
- [ ] Tabela `wishlists` (id, user_id, product_id, created_at)
- [ ] Tabela `promotions` (id, name, type, rules_json, start_at, end_at, is_active)
- [ ] Tabela `store_settings` (id, key, value, category, updated_at)
- [ ] Indices criados para colunas de busca frequente (slug, email, order status, product category)
- [ ] Politicas RLS ativas: usuario ve apenas seus proprios dados, admin ve tudo
- [ ] Role `admin` configurada via `user_metadata` no Supabase Auth
- [ ] RPCs read-only para o bot de suporte documentadas
- [ ] Supabase CLI configurado localmente para rodar migrations

**Notas Tecnicas:**
- Usar `uuid` como tipo de ID em todas as tabelas
- Campo `role` na tabela `users` com valores enum: `'customer'`, `'admin'`
- Criar enum SQL para `order_status`: `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`, `refunded`
- Criar enum para `payment_status`: `pending`, `paid`, `failed`, `refunded`
- Criar enum para `review_status`: `pending`, `approved`, `rejected`
- Todas as tabelas devem ter `created_at` e `updated_at` com triggers de auto-update
- Seed file em `supabase/seed.sql` com os 6 produtos existentes do mock

---

### US-01.3 - Setup das Variaveis de Ambiente e Secrets

**Como** desenvolvedor,
**Quero** um sistema claro de gestao de variaveis de ambiente para todos os ambientes,
**Para** que credenciais nunca vazem no repositorio e o projeto seja facilmente configuravel.

**Criterios de Aceitacao:**
- [ ] `.env.example` com todas as variaveis listadas e comentadas (sem valores)
- [ ] Variaveis separadas por secao: Supabase, Stripe, Correios, Claude API, Resend, URLs
- [ ] `.env.local` no `.gitignore` (verificar que nunca foi commitado)
- [ ] Documentacao no README de como obter cada credencial
- [ ] Validacao de variaveis de ambiente em runtime com `zod` no arquivo `lib/env.ts`
- [ ] Erro claro no startup caso variavel obrigatoria esteja ausente
- [ ] Variaveis de ambiente configuradas no Vercel para producao e preview [A_CONFIGURAR]

**Variaveis necessarias (todas marcadas como [A_CONFIGURAR]):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `CORREIOS_API_USERNAME`
- `CORREIOS_API_PASSWORD`
- `ANTHROPIC_API_KEY`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- `NEXT_PUBLIC_GTM_ID`
- `NEXT_PUBLIC_PIXEL_ID`

**Notas Tecnicas:**
- Usar biblioteca `@t3-oss/env-nextjs` ou Zod manual para validar env vars
- Separar vars publicas (`NEXT_PUBLIC_`) de privadas com clareza
- Criar `lib/env.ts` que exporta objeto tipado com todas as variaveis

---

### US-01.4 - Configuracao do Supabase Client e Tipos TypeScript

**Como** desenvolvedor,
**Quero** o cliente Supabase configurado com tipos gerados automaticamente,
**Para** ter type-safety completo em todas as queries ao banco de dados.

**Criterios de Aceitacao:**
- [ ] `@supabase/supabase-js` e `@supabase/ssr` instalados
- [ ] Arquivo `lib/supabase/client.ts` com cliente browser-side
- [ ] Arquivo `lib/supabase/server.ts` com cliente server-side (para Server Components e Route Handlers)
- [ ] Arquivo `lib/supabase/middleware.ts` para refresh de sessao
- [ ] Tipos TypeScript gerados via `supabase gen types typescript` em `types/supabase.ts`
- [ ] Script `npm run db:types` configurado no `package.json`
- [ ] Middleware do Next.js configurado para refresh de sessao em todas as rotas
- [ ] Helper `getUser()` criado para Server Components
- [ ] Helper `requireAuth()` criado para rotas protegidas (redireciona para login)
- [ ] Helper `requireAdmin()` criado para rotas do admin

**Notas Tecnicas:**
- Seguir o guia oficial do Supabase para Next.js App Router
- Criar cliente separado para middleware (sem cookies de servidor)
- Usar `cookies()` do Next.js apenas em Server Components/Actions

---

---

# EPIC-02: Frontend Publico

**Descricao:** Implementacao de todas as paginas e componentes publicos da loja, migrando e evoluindo o frontend React/Vite existente para Next.js com dados reais do Supabase. O objetivo e entregar uma experiencia de compra moderna, rapida e otimizada para conversao.

**Dependencias:** EPIC-01 (banco de dados e setup)

---

### US-02.1 - Layout Base, Navbar e Footer

**Como** visitante,
**Quero** uma navegacao clara e um rodape completo em todas as paginas,
**Para** encontrar facilmente o que procuro e ter confianca na loja.

**Criterios de Aceitacao:**
- [ ] Layout raiz `app/layout.tsx` com fontes, metadata base e providers globais
- [ ] Navbar com logo Gabinete FC, menu de categorias, busca, icone de carrinho com contador, icone de usuario (login/avatar)
- [ ] Navbar responsiva: menu hamburger no mobile com drawer lateral
- [ ] Navbar com comportamento sticky e sombra ao rolar
- [ ] Mini carrinho sidebar abre ao clicar no icone do carrinho (sem navegar para /carrinho)
- [ ] Footer com logo, links institucionais, categorias rapidas, redes sociais, metodos de pagamento (icones), certificados de seguranca, copyright
- [ ] Footer com link para WhatsApp do suporte [A_CONFIGURAR]
- [ ] Breadcrumb componente reutilizavel para paginas internas
- [ ] MarqueeBanner migrado do legado e funcional
- [ ] Componentes migrados do legado: `Navbar.tsx`, `Footer.tsx`, `MarqueeBanner.tsx`

**Notas Tecnicas:**
- Navbar deve ser Server Component com ilhas de Client Component (carrinho, busca)
- Usar `usePathname()` para ativar item correto no menu
- Contador do carrinho via Context ou Zustand store
- Footer pode ser Server Component puro

---

### US-02.2 - Pagina Home (/)

**Como** visitante,
**Quero** uma home page atrativa com todos os elementos de conversao,
**Para** entender a proposta da loja e ser direcionado aos produtos de forma rapida.

**Criterios de Aceitacao:**
- [ ] Secao Hero com imagem de fundo, headline, subtitulo e CTA "Ver Camisas"
- [ ] Banner de urgencia/escassez (ex: "Ultimas unidades" ou countdown de oferta)
- [ ] Grade de categorias com icones/imagens (Selecoes, Clubes Europeus, Clubes Brasileiros, Retro)
- [ ] Secao "Produtos em Destaque" com grid de 4-8 produtos (dados reais do Supabase)
- [ ] Secao "Promocao do Dia" com produto destacado e timer regressivo
- [ ] Contador para Copa do Mundo (Fase 2 - placeholder na home inicialmente)
- [ ] Secao de depoimentos/avaliacoes com carrossel
- [ ] Secao "Como Funciona" (3-4 passos: escolha, pague, entregamos)
- [ ] Newsletter Section migrada do legado, integrada com Resend [A_CONFIGURAR]
- [ ] Banner de confianca: "Pagamento Seguro | Frete para todo Brasil | Troca em 7 dias"
- [ ] Metadata SEO: titulo, descricao, Open Graph para a home
- [ ] Pagina estatica com ISR (revalidate: 3600)

**Notas Tecnicas:**
- Produtos em destaque: query Supabase por `is_featured = true` ou os 8 mais recentes
- Usar `next/image` com `priority` para imagens above-the-fold
- Implementar Skeleton loading para a grade de produtos
- Timer de promocao deve ser Client Component isolado
- Migrar `HeroSection.tsx` e `NewsletterSection.tsx` do legado

---

### US-02.3 - Catalogo de Produtos (/loja)

**Como** visitante,
**Quero** navegar pelo catalogo com filtros e busca eficientes,
**Para** encontrar a camisa que procuro rapidamente entre todas as opcoes.

**Criterios de Aceitacao:**
- [ ] Grid responsivo de produtos (2 colunas mobile, 3 tablet, 4 desktop)
- [ ] Painel de filtros lateral (desktop) e drawer inferior (mobile)
- [ ] Filtro por Categoria (Selecao, Clube, Retro, Especial)
- [ ] Filtro por Time/Seleção (lista com busca)
- [ ] Filtro por Tipo (Titular, Reserva, Terceira, Goleiro)
- [ ] Filtro por Tamanho (P, M, G, GG, XG, 2XL, 3XL, 4XL)
- [ ] Filtro por Preco (slider de range min/max)
- [ ] Ordenacao: Relevancia, Menor Preco, Maior Preco, Mais Recentes, Mais Vendidos
- [ ] Busca por texto integrada com filtros
- [ ] Contagem de resultados ("X camisas encontradas")
- [ ] Chips de filtros ativos com botao de remover individual + "Limpar tudo"
- [ ] Paginacao com opcao de scroll infinito (configuravel)
- [ ] URLs amigaveis com query params preservados (ex: `/loja?categoria=selecoes&tamanho=G`)
- [ ] Sem resultados: estado vazio com sugestao de produtos
- [ ] Loading skeleton durante fetch
- [ ] SSR para a primeira carga, navegacao client-side com SWR/React Query

**Notas Tecnicas:**
- Filtros sincronizados com URL via `useSearchParams` e `useRouter`
- Query Supabase com filtros dinamicos e paginacao por cursor ou offset
- Criar `lib/products.ts` com funcoes reutilizaveis de query
- `ProductCard.tsx` migrado e evoluido do legado com lazy loading de imagem
- Debounce de 300ms na busca por texto

---

### US-02.4 - Pagina de Categoria (/loja/[categoria])

**Como** visitante,
**Quero** uma pagina dedicada para cada categoria de camisa,
**Para** ter uma experiencia de navegacao focada e encontrar produtos relevantes mais rapido.

**Criterios de Aceitacao:**
- [ ] Rota dinamica `/loja/[categoria]` para selecoes, clubes-europeus, clubes-brasileiros, retro
- [ ] Banner de categoria com imagem e titulo personalizados
- [ ] Breadcrumb: Home > Loja > [Categoria]
- [ ] Grid de produtos pre-filtrado pela categoria
- [ ] Filtros disponiveis restritos ao contexto da categoria
- [ ] Metadata SEO dinamica por categoria (titulo, descricao, OG)
- [ ] `generateStaticParams` para pre-renderizar as categorias existentes
- [ ] Pagina com ISR (revalidate: 3600)

**Notas Tecnicas:**
- Compartilhar componentes de filtro e grid com /loja
- Cada categoria deve ter configuracao em `lib/categories.ts` (slug, label, banner, descricao SEO)

---

### US-02.5 - Pagina de Produto (/produto/[slug])

**Como** visitante,
**Quero** uma pagina de produto completa e persuasiva,
**Para** ter todas as informacoes necessarias para decidir a compra com confianca.

**Criterios de Aceitacao:**
- [ ] Galeria de imagens: thumbnail vertical (desktop) + imagem principal + zoom ao hover
- [ ] Galeria responsiva com swipe no mobile
- [ ] Nome do produto, time, tipo (titular/reserva) exibidos com hierarquia visual clara
- [ ] Preco: valor normal, desconto Pix (ex: "R$ 199 no Pix" com badge verde), parcelado ("12x de R$ 19,90")
- [ ] Seletor de tamanho com indicacao visual de disponibilidade (sob encomenda vs estoque)
- [ ] Botao "Adicionar ao Carrinho" (desabilitado sem tamanho selecionado)
- [ ] Botao "Comprar Agora" (adiciona ao carrinho e vai para /checkout)
- [ ] Botao de Wishlist (coracao) - requer login
- [ ] Calculadora de frete por CEP com resultado em tempo real
- [ ] Guia de tamanhos (modal ou accordion)
- [ ] Informacoes de garantia e troca
- [ ] Secao de Avaliacoes: media com estrelas, lista de reviews, paginacao
- [ ] Secao "Produtos Relacionados" (mesmo time ou categoria)
- [ ] Breadcrumb: Home > Loja > [Categoria] > [Produto]
- [ ] Metadata SEO dinamica (titulo, descricao, OG com imagem do produto)
- [ ] Schema markup JSON-LD: `Product`, `AggregateRating`
- [ ] SSR para o conteudo principal, ISR com revalidate de 1800s
- [ ] Rota 404 personalizada se produto nao encontrado ou inativo

**Notas Tecnicas:**
- `generateStaticParams` para pre-renderizar slugs existentes
- Calculo de parcelamento em `lib/utils/installments.ts` com as regras de negocio
- Calculo de desconto Pix como porcentagem configuravel em `store_settings`
- Componente `FreightCalculator` e Client Component com chamada a Route Handler
- Reviews carregadas via React Query com infinite scroll

---

### US-02.6 - Pagina de Busca (/busca)

**Como** visitante,
**Quero** uma busca eficiente com autocomplete e resultados relevantes,
**Para** encontrar rapidamente a camisa de um time especifico sem precisar navegar pelos filtros.

**Criterios de Aceitacao:**
- [ ] Campo de busca na Navbar com autocomplete
- [ ] Autocomplete sugere nomes de produtos e times ao digitar (minimo 2 caracteres)
- [ ] Debounce de 300ms nas sugestoes
- [ ] Pagina `/busca?q=[termo]` com resultados filtrados
- [ ] Exibir termo buscado: "Resultados para 'Brasil'"
- [ ] Grid de resultados igual ao catalogo
- [ ] Estado vazio com sugestoes de categorias populares
- [ ] Historico de buscas recentes (localStorage)
- [ ] Metadata dinamica: titulo com o termo buscado

**Notas Tecnicas:**
- Busca full-text via Supabase `to_tsvector` ou `ilike` nas colunas `name`, `team`, `description`
- Autocomplete via API Route Handler com cache de 60s
- Sugestoes armazenadas no localStorage (max 5 itens)

---

### US-02.7 - Carrinho e Mini Carrinho

**Como** visitante,
**Quero** gerenciar meu carrinho facilmente sem sair da pagina atual,
**Para** continuar navegando e adicionar mais produtos antes de finalizar a compra.

**Criterios de Aceitacao:**
- [ ] CartContext migrado do legado (addItem, removeItem, updateQuantity, clearCart)
- [ ] Persistencia do carrinho no `localStorage` (sessao anonima)
- [ ] Mini carrinho: sidebar direita, abre ao adicionar produto ou clicar no icone
- [ ] Mini carrinho: lista de itens com imagem, nome, tamanho, quantidade, preco
- [ ] Mini carrinho: subtotal, CTA "Ver Carrinho" e CTA "Finalizar Compra"
- [ ] Mini carrinho: botao fechar (X) e overlay escuro no fundo
- [ ] Pagina `/carrinho`: versao expandida com mesmos itens
- [ ] Pagina carrinho: campo de cupom de desconto com validacao em tempo real
- [ ] Pagina carrinho: resumo do pedido (subtotal, desconto, frete, total)
- [ ] Pagina carrinho: calculo de frete pelo CEP
- [ ] Pagina carrinho: secao "Voce tambem pode gostar" (upsell - 4 produtos)
- [ ] Pagina carrinho: mensagem de progresso para frete gratis (ex: "Faltam R$ 50 para frete gratis!")
- [ ] Animacao suave ao adicionar item (badge do carrinho anima)
- [ ] Carrinho vazio: estado com CTA para voltar a loja

**Notas Tecnicas:**
- CartContext com `useReducer` para acoes complexas
- Sincronizar carrinho com Supabase quando usuario faz login (merge de carrinho anonimo)
- Validacao de cupom via API Route Handler (nao expor logica no cliente)
- Usar `zustand` ou Context API para estado global do carrinho

---

### US-02.8 - Paginas Institucionais

**Como** visitante,
**Quero** acessar informacoes completas sobre politicas e a empresa,
**Para** ter confianca e clareza sobre como a loja funciona antes de comprar.

**Criterios de Aceitacao:**
- [ ] `/sobre` - Historia e missao do Gabinete FC
- [ ] `/politica-de-entrega` - Prazos, Correios, processo de envio, dropshipping
- [ ] `/alfandega` - Explicacao clara sobre taxas alfandegarias, responsabilidade do cliente, o que fazer se retido
- [ ] `/politica-de-trocas` - Regras CDC 7 dias, como solicitar, prazos reembolso
- [ ] `/privacidade` - Politica de privacidade LGPD
- [ ] `/termos` - Termos de uso da plataforma
- [ ] `/faq` - Perguntas frequentes com accordion, cobrindo envio, pagamento, tamanhos, alfandega
- [ ] `/guia-de-tamanhos` - Tabela de medidas por tamanho com instrucoes de medicao
- [ ] `/contato` - Formulario de contato + WhatsApp + email + horario de atendimento
- [ ] `/copa` - Landing page Copa do Mundo (Fase 2, placeholder na Fase 1)
- [ ] `/promocoes` - Pagina de promocoes ativas (Fase 2, placeholder na Fase 1)
- [ ] Pagina 404 personalizada com CTA para home e busca
- [ ] Todas as paginas com metadata SEO adequada

**Notas Tecnicas:**
- Conteudo pode ser em MDX ou componentes React estaticos
- FAQ com `<details>` nativo ou componente de accordion do shadcn/ui
- Formulario de contato envia email via Resend (Route Handler)
- Checkbox de alfandega referenciado no checkout (US-04.2)

---

---

# EPIC-03: Autenticacao e Area do Cliente

**Descricao:** Implementacao do sistema de autenticacao com Supabase Auth e Google OAuth, e todas as paginas da area logada do cliente (pedidos, enderecos, perfil, wishlist, avaliacoes).

**Dependencias:** EPIC-01, EPIC-02 (Layout base)

---

### US-03.1 - Cadastro e Login

**Como** visitante,
**Quero** criar uma conta ou fazer login de forma simples,
**Para** acessar minha area do cliente e ter pedidos vinculados ao meu perfil.

**Criterios de Aceitacao:**
- [ ] Pagina `/cadastro`: nome completo, email, senha, confirmacao de senha, CPF (opcional), telefone (opcional)
- [ ] Validacao em tempo real com React Hook Form + Zod
- [ ] Checkbox de aceite dos Termos de Uso (obrigatorio)
- [ ] Apos cadastro: email de boas-vindas enviado via Resend
- [ ] Pagina `/login`: email + senha
- [ ] Login com Google OAuth ("Entrar com Google" button)
- [ ] "Esqueci minha senha" com envio de email de recuperacao
- [ ] Pagina de redefinicao de senha `/auth/redefinir-senha`
- [ ] Redirecionamento pos-login para pagina anterior ou `/minha-conta`
- [ ] Mensagens de erro claras (email ja cadastrado, senha incorreta, etc.)
- [ ] Protecao contra brute force (delegada ao Supabase Auth)
- [ ] Modal de login inline (para usuarios que tentam fazer wishlist ou checkout sem conta)

**Notas Tecnicas:**
- Usar `@supabase/ssr` para autenticacao SSR-safe
- Callback OAuth em `app/auth/callback/route.ts`
- Middleware protegendo rotas `/minha-conta/**` e `/checkout`
- Criar trigger Supabase para inserir registro em `users` apos `auth.users` insert

---

### US-03.2 - Dashboard da Conta (/minha-conta)

**Como** cliente logado,
**Quero** uma visao geral da minha conta em um dashboard,
**Para** ter acesso rapido aos principais recursos e ver um resumo das minhas atividades.

**Criterios de Aceitacao:**
- [ ] Saudacao personalizada: "Ola, [Nome]!"
- [ ] Cards de resumo: ultimo pedido, total de pedidos, favoritos salvos
- [ ] Link rapido para ultimos 3 pedidos com status visual (badge colorido)
- [ ] Link para gerenciar enderecos
- [ ] Link para editar perfil
- [ ] Menu lateral de navegacao da area do cliente (desktop) / tabs (mobile)
- [ ] Avatar do usuario (foto do Google ou inicial do nome)
- [ ] Botao de logout

**Notas Tecnicas:**
- Layout compartilhado `app/minha-conta/layout.tsx` com menu lateral
- Dados do dashboard em Server Component com query direta ao Supabase
- Menu lateral com `usePathname()` para ativar item correto

---

### US-03.3 - Lista e Detalhe de Pedidos

**Como** cliente logado,
**Quero** ver todos os meus pedidos com status atualizado e detalhe completo,
**Para** acompanhar minhas compras e saber o que esperar em cada etapa.

**Criterios de Aceitacao:**
- [ ] `/minha-conta/pedidos`: tabela/lista de todos os pedidos
- [ ] Cada pedido: numero, data, status (badge colorido), valor total, acoes
- [ ] Status com cores: Aguardando Pagamento (amarelo), Confirmado (azul), Em Processamento (laranja), Enviado (roxo), Entregue (verde), Cancelado (vermelho)
- [ ] Paginacao da lista (10 pedidos por pagina)
- [ ] `/minha-conta/pedidos/[id]`: detalhe do pedido
- [ ] Detalhe: itens comprados (imagem, nome, tamanho, qtd, preco)
- [ ] Detalhe: endereco de entrega
- [ ] Detalhe: metodo de pagamento
- [ ] Detalhe: resumo financeiro (subtotal, frete, desconto, total)
- [ ] Detalhe: timeline do pedido com historico de status
- [ ] Botao "Avaliar Produtos" visivel quando status = 'Entregue' e review nao feita
- [ ] Botao "Solicitar Troca" visivel quando dentro do prazo CDC (7 dias apos entrega)

**Notas Tecnicas:**
- Queries com RLS garantem que usuario ve apenas seus proprios pedidos
- Timeline construida com array de eventos armazenados em coluna JSONB em `orders`
- Criar tipo `OrderStatus` e `PaymentStatus` em `types/orders.ts`

---

### US-03.4 - Rastreamento de Pedido

**Como** cliente logado,
**Quero** rastrear meu pedido diretamente na plataforma,
**Para** saber onde minha camisa esta sem precisar acessar o site dos Correios.

**Criterios de Aceitacao:**
- [ ] `/minha-conta/pedidos/[id]/rastreio`: pagina dedicada de rastreamento
- [ ] Exibir codigo de rastreio dos Correios
- [ ] Buscar e exibir historico de rastreamento via API Correios
- [ ] Timeline visual dos eventos de rastreamento (data, hora, local, descricao)
- [ ] Status atual destacado visualmente
- [ ] Link externo para o site dos Correios com o mesmo codigo
- [ ] Mensagem amigavel se rastreio ainda nao disponivel ("Aguardando postagem")
- [ ] Atualizar dados automaticamente (polling a cada 4 horas)

**Notas Tecnicas:**
- Integracao com Correios API detalhada em EPIC-05
- Cache do rastreamento no Supabase para evitar excesso de requisicoes
- Atualizar `orders.tracking_updated_at` a cada consulta

---

### US-03.5 - Gerenciamento de Enderecos

**Como** cliente logado,
**Quero** gerenciar meus enderecos de entrega,
**Para** agilizar futuras compras sem precisar digitar meu endereco novamente.

**Criterios de Aceitacao:**
- [ ] `/minha-conta/enderecos`: lista de enderecos cadastrados
- [ ] Card por endereco com label, nome destinatario, endereco completo
- [ ] Indicador de endereco padrao (estrela ou badge "Padrao")
- [ ] Botao "Adicionar Endereco" com formulario completo
- [ ] Formulario: label (Casa, Trabalho, etc.), nome destinatario, CEP (auto-completa via ViaCEP), numero, complemento
- [ ] Editar endereco existente
- [ ] Excluir endereco (com confirmacao)
- [ ] Definir como endereco padrao
- [ ] Maximo de 5 enderecos por conta

**Notas Tecnicas:**
- Auto-complete de CEP via API ViaCEP (gratuita, sem autenticacao)
- Validacao de CEP: apenas numeros, 8 digitos, CEP brasileiro valido
- RLS garante acesso apenas aos proprios enderecos

---

### US-03.6 - Perfil do Usuario

**Como** cliente logado,
**Quero** editar meus dados pessoais e preferencias,
**Para** manter minhas informacoes atualizadas e personalizar minha experiencia.

**Criterios de Aceitacao:**
- [ ] `/minha-conta/perfil`: formulario de edicao de dados pessoais
- [ ] Campos: nome completo, email (somente leitura se OAuth), telefone, CPF
- [ ] Alterar senha (apenas para contas nao-OAuth)
- [ ] Upload de foto de perfil via Supabase Storage
- [ ] Preferencias de comunicacao (email marketing opt-in/out)
- [ ] Botao de deletar conta (com confirmacao por digitacao de email)
- [ ] Feedback visual de sucesso/erro ao salvar

**Notas Tecnicas:**
- Email nao pode ser alterado diretamente (requer verificacao Supabase)
- Foto de perfil: bucket publico no Supabase Storage, redimensionar via `next/image`
- Deletar conta: soft delete (marcar como inativo) ou hard delete com limpeza de dados

---

### US-03.7 - Wishlist (Favoritos)

**Como** cliente logado,
**Quero** salvar produtos favoritos para comprar depois,
**Para** criar uma lista de desejos e nao perder os produtos que me interessam.

**Criterios de Aceitacao:**
- [ ] Botao de coracao em cada `ProductCard` e na pagina do produto
- [ ] Sem login: abre modal de login solicitando autenticacao
- [ ] Com login: toggle de adicionar/remover da wishlist com feedback visual imediato (optimistic update)
- [ ] `/minha-conta/favoritos`: grid de produtos favoritados
- [ ] Card do produto na wishlist: imagem, nome, preco atual, botao "Adicionar ao Carrinho", botao remover
- [ ] Indicador de quantidade de favoritos no menu da conta
- [ ] Estado vazio com CTA para explorar a loja

**Notas Tecnicas:**
- Tabela `wishlists` com `(user_id, product_id)` unique constraint
- Optimistic update: atualizar UI imediatamente, reverter em caso de erro
- Contador de wishlist em estado global (Context ou Zustand)

---

### US-03.8 - Avaliacoes do Cliente

**Como** cliente logado com pedido entregue,
**Quero** avaliar os produtos que comprei e ganhar um cupom de desconto,
**Para** ajudar outros compradores e ser recompensado pela minha contribuicao.

**Criterios de Aceitacao:**
- [ ] `/minha-conta/avaliacoes`: lista de produtos disponiveis para avaliar e avaliacoes ja feitas
- [ ] Formulario de avaliacao: rating (1-5 estrelas), titulo, texto, upload de fotos (max 5, 5MB cada)
- [ ] Restricoes: apenas produtos de pedidos com status 'Entregue', uma avaliacao por produto por usuario
- [ ] Apos submit: mensagem "Avaliacao enviada para aprovacao"
- [ ] Status da avaliacao visivel: Aguardando aprovacao, Aprovada, Rejeitada
- [ ] Cupom gerado automaticamente apos aprovacao:
  - Com foto: cupom de maior valor [A_CONFIGURAR]%
  - Apenas texto: cupom de menor valor [A_CONFIGURAR]%
- [ ] Notificacao por email quando avaliacao for aprovada (com o cupom)
- [ ] Lista de avaliacoes aprovadas com resposta do admin (se houver)

**Notas Tecnicas:**
- Upload de fotos: Supabase Storage bucket `reviews`, pasta `user_id/product_id/`
- Geracao de cupom: trigger Supabase ou API Route Handler apos mudanca de status para 'approved'
- Codigo do cupom unico: `REVIEW-[UUID curto]`

---

---

# EPIC-04: Checkout e Pagamentos

**Descricao:** Implementacao do fluxo completo de checkout em 3 etapas, integracao com Stripe para cartao de credito e Pix, calculo de frete, aplicacao de cupons e confirmacao de pedido.

**Dependencias:** EPIC-01, EPIC-02 (Carrinho), EPIC-03 (Autenticacao)

---

### US-04.1 - Fluxo de Checkout - Identificacao

**Como** comprador,
**Quero** me identificar no inicio do checkout de forma rapida,
**Para** que meu pedido seja vinculado a minha conta ou processado como convidado.

**Criterios de Aceitacao:**
- [ ] Rota `/checkout` protegida: requer login (redireciona para login com `redirect=/checkout`)
- [ ] Etapa 1: Identificacao - exibir dados da conta logada (nome, email) com opcao de usar outro email
- [ ] Indicador de progresso visual (Etapa 1 de 3: Identificacao > Entrega > Pagamento)
- [ ] Resumo do pedido sempre visivel na lateral (desktop) ou accordion (mobile)
- [ ] Resumo: lista de itens, subtotal, frete (a calcular), total
- [ ] Botao "Continuar para Entrega"

**Notas Tecnicas:**
- Middleware garante usuario logado antes de acessar /checkout
- Ao entrar no checkout, criar rascunho de pedido no Supabase com status 'draft'
- Armazenar `order_draft_id` na sessao para recuperar em caso de abandono

---

### US-04.2 - Fluxo de Checkout - Entrega

**Como** comprador,
**Quero** selecionar o endereco de entrega e o metodo de frete,
**Para** receber minha camisa no local e prazo desejados.

**Criterios de Aceitacao:**
- [ ] Etapa 2: Entrega
- [ ] Enderecos cadastrados exibidos como opcoes de selecao (se existirem)
- [ ] Opcao de adicionar novo endereco inline (sem sair do checkout)
- [ ] Formulario de novo endereco com auto-complete por CEP
- [ ] Calcular opcoes de frete ao confirmar o endereco (Correios API)
- [ ] Exibir opcoes de frete: PAC (mais barato, mais lento) e SEDEX (mais rapido, mais caro)
- [ ] Mostrar preco e prazo estimado para cada opcao
- [ ] Frete gratis automatico se regras atingidas (4+ pecas OU valor acima do minimo configurado)
- [ ] Checkbox obrigatorio: "Estou ciente que pedidos internacionais podem ser retidos na alfandega" com link para /alfandega
- [ ] Botao "Continuar para Pagamento"

**Notas Tecnicas:**
- Integracao com Correios API detalhada em EPIC-05
- Armazenar selecao de frete no rascunho do pedido
- Validar regras de frete gratis em `lib/shipping.ts`
- Checkbox de alfandega: bloquear botao continuar se nao marcado

---

### US-04.3 - Fluxo de Checkout - Pagamento com Cartao

**Como** comprador,
**Quero** pagar com cartao de credito de forma segura com opcao de parcelamento,
**Para** completar minha compra de forma conveniente.

**Criterios de Aceitacao:**
- [ ] Etapa 3: Pagamento - tabs "Cartao de Credito" e "Pix"
- [ ] Formulario de cartao com Stripe Elements (Card Element ou Payment Element)
- [ ] Campo de nome no cartao
- [ ] Opcoes de parcelamento exibidas dinamicamente baseadas no valor do pedido:
  - 1-3x sem juros
  - 4-12x com juros (taxa exibida)
  - 3+ camisas: 1-6x sem juros, 7-12x com juros
- [ ] Exibir valor total com juros calculado em tempo real ao mudar parcelamento
- [ ] Campo de cupom de desconto com validacao
- [ ] Resumo final completo antes de confirmar
- [ ] Botao "Confirmar e Pagar" com loading state
- [ ] Tratamento de erros do Stripe (cartao recusado, fondos insuficientes, etc.) com mensagem amigavel
- [ ] Apos pagamento aprovado: redirecionar para `/pedido/confirmacao/[id]`

**Notas Tecnicas:**
- Criar Payment Intent no servidor (Route Handler) ao entrar na etapa de pagamento
- Nunca expor `STRIPE_SECRET_KEY` no cliente
- Usar `stripe.confirmCardPayment()` no cliente com `clientSecret`
- Parcelamento: criar `PaymentIntent` com metadata de installments; logica de juros em `lib/installments.ts`
- Webhook Stripe em `app/api/webhooks/stripe/route.ts` para confirmar pagamento

---

### US-04.4 - Fluxo de Checkout - Pagamento com Pix

**Como** comprador,
**Quero** pagar com Pix para ter desconto e confirmacao instantanea,
**Para** economizar e ter meu pedido confirmado imediatamente.

**Criterios de Aceitacao:**
- [ ] Aba "Pix" na etapa de pagamento
- [ ] Exibir desconto Pix aplicado (ex: "5% de desconto no Pix")
- [ ] Botao "Gerar QR Code Pix"
- [ ] QR Code gerado via Stripe (Pix como metodo de pagamento)
- [ ] Exibir QR Code + codigo Pix copia-e-cola
- [ ] Timer de expiacao do QR Code (30 minutos)
- [ ] Polling automatico a cada 5 segundos verificando se pagamento foi realizado
- [ ] Apos confirmacao: redirecionar para `/pedido/confirmacao/[id]`
- [ ] Se QR Code expirar: botao para gerar novo
- [ ] Instrucoes visuais de como pagar via Pix

**Notas Tecnicas:**
- Stripe suporta Pix como payment method para contas brasileiras [A_CONFIGURAR]
- Polling via `setInterval` no cliente consultando status do PaymentIntent
- Webhook Stripe tambem confirma Pix (backup do polling)
- QR Code: usar biblioteca `qrcode.react` para renderizar o codigo gerado pelo Stripe

---

### US-04.5 - Pagina de Confirmacao do Pedido

**Como** comprador,
**Quero** uma pagina de confirmacao completa apos finalizar a compra,
**Para** ter a certeza de que meu pedido foi recebido e saber os proximos passos.

**Criterios de Aceitacao:**
- [ ] `/pedido/confirmacao/[id]`: pagina de sucesso
- [ ] Icone/animacao de sucesso
- [ ] Numero do pedido exibido com destaque
- [ ] Resumo do pedido (itens, valores, endereco de entrega)
- [ ] Informacao de prazo estimado de entrega
- [ ] Informacao sobre email de confirmacao enviado
- [ ] CTA: "Ver Meus Pedidos" e "Continuar Comprando"
- [ ] Disparo do evento de conversao (GA4, Meta Pixel) via componente client
- [ ] Pedido criado no Supabase com status correto apos webhook do Stripe
- [ ] Email de confirmacao do pedido enviado via Resend

**Notas Tecnicas:**
- Pagina acessivel apenas para o dono do pedido (validar via RLS)
- Webhook do Stripe atualiza status do pedido de 'draft' para 'confirmed'
- Limpar carrinho (localStorage e Context) apos confirmacao
- Disparar evento `purchase` para GA4 e Meta Pixel

---

### US-04.6 - Gestao de Webhooks do Stripe

**Como** sistema,
**Quero** processar de forma confiavel todos os eventos do Stripe,
**Para** manter os status de pedidos e pagamentos sempre sincronizados.

**Criterios de Aceitacao:**
- [ ] Route Handler `app/api/webhooks/stripe/route.ts`
- [ ] Verificacao de assinatura do webhook com `STRIPE_WEBHOOK_SECRET`
- [ ] Processar evento `payment_intent.succeeded`: confirmar pedido, enviar email
- [ ] Processar evento `payment_intent.payment_failed`: marcar como falha, notificar cliente
- [ ] Processar evento `charge.refunded`: atualizar status para 'refunded'
- [ ] Idempotencia: verificar se evento ja foi processado antes de agir
- [ ] Logging de todos os eventos recebidos para auditoria
- [ ] Retorno de 200 imediato ao Stripe (processar em background se necessario)

**Notas Tecnicas:**
- Usar `stripe.webhooks.constructEvent()` para validar assinatura
- Armazenar `stripe_event_id` para garantir idempotencia
- Usar `edge runtime` ou route handler padrao com timeout adequado

---

---

# EPIC-05: Integracoes

**Descricao:** Implementacao de todas as integracoes externas: Correios para frete e rastreamento, Resend para emails transacionais, e Claude API para o bot de suporte ao cliente.

**Dependencias:** EPIC-01, EPIC-02, EPIC-03, EPIC-04

---

### US-05.1 - Integracao com Correios API (Frete)

**Como** sistema,
**Quero** calcular o frete em tempo real via API dos Correios,
**Para** exibir opcoes de entrega precisas para cada CEP de destino.

**Criterios de Aceitacao:**
- [ ] Servico `lib/correios.ts` encapsulando todas as chamadas a API dos Correios [A_CONFIGURAR]
- [ ] Calculo de frete por CEP com dados do pacote (peso estimado por camisa)
- [ ] Retornar opcoes PAC e SEDEX com preco e prazo em dias uteis
- [ ] Cache de calculos por CEP + itens (Redis ou cache Next.js) por 1 hora
- [ ] Tratamento de CEPs invalidos ou nao atendidos
- [ ] Tratamento de falha na API (fallback com mensagem ao usuario)
- [ ] Parametros do pacote configurados em `store_settings`: peso por camisa, dimensoes
- [ ] Regra de frete gratis aplicada antes de exibir opcoes
- [ ] Route Handler `app/api/freight/calculate/route.ts`

**Notas Tecnicas:**
- API dos Correios 2.0 (REST) requer autenticacao [A_CONFIGURAR]
- Peso estimado: 300g por camisa (configuravel)
- Dimensoes padrao: caixa envelope 30x21x1cm (configuravel)
- Adicionar margem de seguranca no preco (configuravel em %) para cobrir variacao

---

### US-05.2 - Integracao com Correios API (Rastreamento)

**Como** sistema,
**Quero** consultar o rastreamento de pedidos via API dos Correios,
**Para** exibir o historico de movimentacao para o cliente sem sair da plataforma.

**Criterios de Aceitacao:**
- [ ] Funcao `getTracking(codigoRastreio)` em `lib/correios.ts`
- [ ] Retornar array de eventos: data, hora, local (cidade/UF), descricao, status normalizado
- [ ] Armazenar ultimo rastreamento em cache no Supabase (coluna `tracking_events_json` em `orders`)
- [ ] Polling automatico: Job que atualiza rastreamentos de pedidos com status 'Enviado' a cada 4 horas
- [ ] Polling implementado como Vercel Cron Job `vercel.json`
- [ ] Webhook dos Correios (se disponivel na versao atual da API) para atualizacao em tempo real
- [ ] Notificacao por email quando status muda para 'Entregue'
- [ ] Normalizar status dos Correios para o enum interno do sistema

**Notas Tecnicas:**
- Vercel Cron Job configurado em `vercel.json` com schedule `0 */4 * * *`
- Rota do cron protegida com `CRON_SECRET` no header
- Evento 'Entregue' deve atualizar `orders.status` para 'delivered' e disparar email

---

### US-05.3 - Sistema de Email Transacional (Resend)

**Como** sistema,
**Quero** enviar emails transacionais automaticos e com belo design em momentos-chave,
**Para** manter o cliente informado e profissionalizar a comunicacao da marca.

**Criterios de Aceitacao:**
Templates a implementar (todos com logo Gabinete FC, design consistente):
- [ ] **Email 1 - Boas-vindas**: enviado apos cadastro, com beneficios e CTA para a loja
- [ ] **Email 2 - Confirmacao de Pedido**: numero do pedido, itens, valores, endereco, prazo estimado
- [ ] **Email 3 - Pagamento Confirmado**: confirmacao de que o pagamento foi aprovado
- [ ] **Email 4 - Pedido Enviado**: codigo de rastreio, link de rastreamento, prazo
- [ ] **Email 5 - Pedido Entregue**: confirmacao de entrega, CTA para avaliar produtos (com link)
- [ ] **Email 6 - Avaliacao Aprovada**: agradecimento + codigo do cupom gerado
- [ ] **Email 7 - Recuperacao de Carrinho Abandonado**: lembrete com itens do carrinho (Fase 2)
- [ ] **Email 8 - Retencao Alfandega**: alerta de retencao, instrucoes, contato do suporte
- [ ] Servico `lib/email.ts` com funcao generica `sendEmail(template, to, data)`
- [ ] Templates em React Email (`email/` folder) para preview e type-safety
- [ ] Remetente configurado: `noreply@gabinetefc.com.br` [A_CONFIGURAR]
- [ ] Dominio de envio verificado no Resend [A_CONFIGURAR]

**Notas Tecnicas:**
- Usar `react-email` + `@react-email/components` para templates
- Resend SDK: `resend.emails.send()`
- Todos os envios em try/catch com logging - falha de email nao deve quebrar o fluxo principal
- Testar templates com `email-dev` (preview local)

---

### US-05.4 - Bot de Suporte com Claude API

**Como** visitante ou cliente logado,
**Quero** um bot de suporte inteligente disponivel na loja,
**Para** tirar duvidas rapidamente sem precisar aguardar atendimento humano.

**Criterios de Aceitacao:**
- [ ] Widget flutuante no canto inferior direito em todas as paginas
- [ ] Botao de abrir/fechar com icone de chat e badge de mensagem nao lida
- [ ] Interface de chat: historico de mensagens, campo de input, botao enviar
- [ ] Indicador de digitacao ("Bot esta digitando...")
- [ ] Streaming de resposta (exibir texto sendo gerado em tempo real)

**Para visitante nao logado:**
- [ ] Responder duvidas gerais: frete, tamanhos, politicas, alfandega, pagamento
- [ ] Sugerir produtos baseado em descricao do cliente (ex: "quero a camisa do Brasil azul")
- [ ] Nao ter acesso a dados de pedidos

**Para cliente logado:**
- [ ] Consultar status e detalhes de pedidos do cliente
- [ ] Consultar status de rastreamento
- [ ] Auxiliar na abertura de solicitacao de troca
- [ ] Responder com dados contextuais do cliente

**Funcionalidades gerais:**
- [ ] Prompt do sistema configuravel via `store_settings` no admin
- [ ] Limitacao de rate: maximo de 20 mensagens por sessao
- [ ] Botao "Falar com Humano" que redireciona para WhatsApp
- [ ] Historico da conversa mantido durante a sessao (nao persiste entre sessoes)
- [ ] Detectar intencao de compra e sugerir produto com link

**Notas Tecnicas:**
- Route Handler `app/api/chat/route.ts` com streaming
- Usar `anthropic.messages.stream()` com `ReadableStream`
- Para clientes logados: funcao RPC Supabase read-only para buscar dados do usuario
- Contexto do sistema inclui: catalogo de produtos, politicas da loja, dados do cliente (se logado)
- Prompt base armazenado em `store_settings` com chave `bot_system_prompt`
- Nunca expor dados de outros usuarios
- Implementar sanitizacao de input do usuario

---

---

# EPIC-06: Painel Administrativo

**Descricao:** Implementacao do painel administrativo completo em `admin.gabinetefc.com.br`, com autenticacao restrita, gestao completa de produtos, pedidos, clientes, promocoes e configuracoes da loja.

**Dependencias:** EPIC-01, EPIC-03 (Auth base), EPIC-04 (Pedidos), EPIC-05 (Emails)

---

### US-06.1 - Setup e Autenticacao do Admin

**Como** administrador,
**Quero** um painel admin com acesso restrito e seguro,
**Para** gerenciar a loja sem risco de acesso nao autorizado.

**Criterios de Aceitacao:**
- [ ] Subdominio `admin.gabinetefc.com.br` configurado no Vercel [A_CONFIGURAR]
- [ ] Projeto Next.js separado OU pasta `app/admin/` com middleware de protecao
- [ ] Pagina de login do admin com email + senha (nao Google OAuth por seguranca)
- [ ] Middleware verificando role `admin` em `user_metadata` do Supabase Auth
- [ ] Qualquer rota `/admin/**` sem role admin: redireciona para login do admin
- [ ] Layout do admin: sidebar com navegacao, header com usuario logado e logout
- [ ] Sidebar colapsavel no mobile
- [ ] Breadcrumb em todas as paginas do admin
- [ ] Timeout de sessao de 8 horas

**Notas Tecnicas:**
- Middleware `middleware.ts` verificando role antes de qualquer render
- Nao reutilizar o layout do frontend publico
- Usar `supabase.auth.getSession()` e verificar `user.app_metadata.role === 'admin'`

---

### US-06.2 - Dashboard do Admin

**Como** administrador,
**Quero** um dashboard com os principais KPIs e alertas da loja,
**Para** ter uma visao executiva rapida da saude do negocio ao acessar o admin.

**Criterios de Aceitacao:**
- [ ] KPIs do dia: faturamento, numero de pedidos, ticket medio, novos clientes
- [ ] KPIs do mes: comparativo com mes anterior com variacao percentual
- [ ] Grafico de vendas (linhas): ultimos 30 dias
- [ ] Grafico de produtos mais vendidos (barras): top 10
- [ ] Tabela de ultimos 10 pedidos com link para detalhes
- [ ] Alertas: pedidos aguardando processamento, avaliacoes pendentes de aprovacao, estoque baixo (se configurado)
- [ ] Cards de status: total de produtos ativos, clientes cadastrados, avaliacoes pendentes
- [ ] Filtro de periodo: hoje, 7 dias, 30 dias, 90 dias
- [ ] Botao de refresh manual
- [ ] Dados atualizados a cada 5 minutos (auto-refresh)

**Notas Tecnicas:**
- Queries agregadas no Supabase via RPCs ou views materializadas
- Graficos com `recharts` ou `tremor`
- Dados do dashboard em Server Component com cache de curta duracao

---

### US-06.3 - Gestao de Pedidos (Admin)

**Como** administrador,
**Quero** visualizar, filtrar e gerenciar todos os pedidos da loja,
**Para** processar envios, atualizar status e resolver problemas dos clientes de forma eficiente.

**Criterios de Aceitacao:**
- [ ] Tabela de pedidos com colunas: numero, data, cliente, status, pagamento, valor, acoes
- [ ] Filtros: status, periodo, metodo de pagamento, busca por numero/cliente
- [ ] Ordenacao por qualquer coluna
- [ ] Paginacao (25 pedidos por pagina)
- [ ] Exportar pedidos para CSV (periodo selecionado)
- [ ] Detalhe do pedido: todos os dados do cliente, itens, pagamento, endereco
- [ ] Atualizar status do pedido (dropdown com todos os status possiveis)
- [ ] Inserir codigo de rastreio e transportadora
- [ ] Adicionar notas internas (nao visiveis ao cliente)
- [ ] Historico de alteracoes do pedido (log de quem alterou e quando)
- [ ] Reenviar email de confirmacao/envio manualmente
- [ ] Botao "Solicitar reembolso" com integracao Stripe

**Notas Tecnicas:**
- Inserir codigo de rastreio dispara automaticamente Email 4 (Pedido Enviado)
- Atualizar status para 'delivered' dispara Email 5 e inicia polling de rastreio final
- Log de alteracoes em tabela `order_history` (order_id, user_id, action, from_status, to_status, note, created_at)

---

### US-06.4 - Gestao de Produtos (Admin)

**Como** administrador,
**Quero** um CRUD completo de produtos com gestao de imagens e SEO,
**Para** manter o catalogo sempre atualizado com as camisas disponiveis do fornecedor JIN.

**Criterios de Aceitacao:**
- [ ] Tabela de produtos: imagem thumb, nome, categoria, preco, status (ativo/inativo), acoes
- [ ] Busca e filtros por categoria, status
- [ ] Formulario de criacao/edicao de produto:
  - Nome, slug (auto-gerado e editavel), descricao rica (editor WYSIWYG)
  - Categoria, time/selecao, tipo (titular/reserva/terceira/goleiro/retro)
  - Preco base (em centavos internamente)
  - Tamanhos disponiveis (checkboxes com notas de estoque por tamanho)
  - Notas de estoque (campo texto livre)
  - Status ativo/inativo
  - Destaque na home (toggle)
- [ ] Upload de multiplas imagens (max 10 por produto, max 5MB cada)
  - Drag and drop ou selecao multipla
  - Preview das imagens
  - Reordenacao por arrastar (primeira = imagem principal)
  - Remocao individual
- [ ] Campos SEO: meta title, meta description, keywords
- [ ] Preview da pagina do produto (link para abrir em nova aba)
- [ ] Duplicar produto existente
- [ ] Desativar produto (soft delete - nao excluir do banco)

**Notas Tecnicas:**
- Imagens enviadas para Supabase Storage bucket `products`, pasta `product_id/`
- Slug gerado com `slugify` em lowercase sem caracteres especiais
- Editor WYSIWYG: usar `@tiptap/react` (leve e customizavel)
- Tamanhos como array de objetos: `[{size: 'G', note: 'Disponivel', extra_cost: 0}]`
- Tamanhos 2XL/3XL/4XL podem ter custo adicional configuravel

---

### US-06.5 - Gestao de Clientes (Admin)

**Como** administrador,
**Quero** visualizar e gerenciar os clientes cadastrados,
**Para** oferecer suporte personalizado e gerenciar contas quando necessario.

**Criterios de Aceitacao:**
- [ ] Tabela de clientes: nome, email, data de cadastro, total de pedidos, valor total gasto
- [ ] Busca por nome, email, CPF
- [ ] Perfil detalhado do cliente: dados pessoais, historico de pedidos, enderecos, avaliacoes, wishlist
- [ ] Indicador de cliente VIP (acima de X pedidos ou Y valor total) [A_CONFIGURAR]
- [ ] Opcao de bloquear conta (impede login)
- [ ] Opcao de adicionar nota interna ao cliente
- [ ] Historico de todas as interacoes do bot de suporte
- [ ] Enviar cupom manual para o cliente

**Notas Tecnicas:**
- Bloquear conta: atualizar `user_metadata.status = 'blocked'` no Supabase Auth
- Dados financeiros do cliente calculados via view ou RPC no Supabase

---

### US-06.6 - Gestao de Cupons e Promocoes (Admin)

**Como** administrador,
**Quero** criar e gerenciar cupons de desconto e regras de promocao,
**Para** executar campanhas de vendas e recompensar clientes de forma controlada.

**Criterios de Aceitacao:**
**Cupons:**
- [ ] Tabela de cupons: codigo, tipo, valor, usos, validade, status
- [ ] Criar cupom: codigo (manual ou gerado), tipo (percentual/valor fixo/frete gratis)
- [ ] Valor do desconto, valor minimo do pedido, limite de usos, data de expiracao
- [ ] Restricao por usuario (cupom personalizado para um cliente especifico)
- [ ] Ativar/desativar cupom
- [ ] Ver quais pedidos usaram o cupom

**Promocoes:**
- [ ] Criar regras de desconto por volume (ex: "3+ camisas = 10% off")
- [ ] Criar regras de frete gratis (por valor ou quantidade)
- [ ] Configurar banners promocionais para a home
- [ ] Agendar inicio e fim de promocoes

**Notas Tecnicas:**
- Validacao de cupom sempre no servidor (Route Handler ou Server Action)
- Regras de promocao armazenadas em `promotions.rules_json` como JSONB
- Motor de aplicacao de promocoes em `lib/promotions.ts`

---

### US-06.7 - Gestao de Avaliacoes (Admin)

**Como** administrador,
**Quero** moderar as avaliacoes dos clientes antes de publicar,
**Para** garantir conteudo genuino e de qualidade no site.

**Criterios de Aceitacao:**
- [ ] Tabela de avaliacoes pendentes com filtros por status
- [ ] Visualizar avaliacao completa: texto, fotos, produto, cliente, pedido
- [ ] Aprovar avaliacao (publica no produto e gera cupom automatico)
- [ ] Rejeitar avaliacao (com motivo, notifica cliente por email)
- [ ] Responder avaliacao aprovada (resposta do vendedor exibida publicamente)
- [ ] Filtrar por produto, periodo, rating
- [ ] Indicador de quantas avaliacoes pendentes no menu do admin

**Notas Tecnicas:**
- Aprovacao dispara: mudanca de status, geracao de cupom, envio de Email 6
- Rejeicao dispara: notificacao por email ao cliente com motivo

---

### US-06.8 - Gestao Financeira (Admin)

**Como** administrador,
**Quero** visibilidade financeira sobre os pagamentos processados,
**Para** conciliar vendas, acompanhar chargebacks e entender a saude financeira da loja.

**Criterios de Aceitacao:**
- [ ] Extrato de pagamentos Stripe (via API Stripe): data, pedido, valor, status, metodo
- [ ] Filtro por periodo e metodo de pagamento
- [ ] Total recebido no periodo, total parcelado pendente, total em disputas
- [ ] Lista de chargebacks abertos com acoes
- [ ] Exportar extrato em CSV
- [ ] Relatorio de parcelamentos: quais parcelas venceram ou vencem

**Notas Tecnicas:**
- Dados via Stripe API (nao armazenados no Supabase para evitar duplicidade)
- Paginacao usando cursor do Stripe
- Cache de 15 minutos para nao sobrecarregar a API do Stripe

---

### US-06.9 - Configuracoes da Loja (Admin)

**Como** administrador,
**Quero** configurar todos os parametros da loja por uma interface grafica,
**Para** ajustar comportamentos da plataforma sem precisar alterar codigo.

**Criterios de Aceitacao:**
**Dados da Empresa:**
- [ ] Nome, CNPJ, endereco, WhatsApp, email de suporte

**Frete e Entrega:**
- [ ] Peso estimado por produto (gramas), dimensoes da embalagem
- [ ] Margem de seguranca no frete (%)
- [ ] Valor minimo para frete gratis, quantidade minima para frete gratis
- [ ] CEP de origem do remetente [A_CONFIGURAR]

**Pagamentos:**
- [ ] Percentual de desconto Pix
- [ ] Taxas de juros de parcelamento por numero de parcelas
- [ ] Numero maximo de parcelas sem juros (padrao e para 3+ camisas)

**Integracoes:**
- [ ] Tokens de API (campos mascarados, apenas alterar) [A_CONFIGURAR]
- [ ] Templates de email (editar conteudo sem alterar codigo)
- [ ] Prompt do bot de suporte (textarea longa com preview)

**SEO e Tracking:**
- [ ] Google Analytics ID [A_CONFIGURAR]
- [ ] Google Tag Manager ID [A_CONFIGURAR]
- [ ] Meta Pixel ID [A_CONFIGURAR]
- [ ] Scripts customizados de head/body

**Notas Tecnicas:**
- Todas as configuracoes em `store_settings` como key-value
- Criar `lib/settings.ts` com funcao `getSetting(key)` com tipagem
- Cache de settings em memoria (revalidar a cada 5 minutos)
- Nao armazenar secrets no banco - apenas em variaveis de ambiente

---

---

# EPIC-07: SEO, Performance e Deploy

**Descricao:** Otimizacoes de performance, SEO tecnico, configuracao de deploy na Vercel e monitoramento. Parte essencial do MVP para que a loja seja encontrada organicamente e oferea uma experiencia rapida.

**Dependencias:** Todos os EPICs anteriores

---

### US-07.1 - SEO Tecnico e Metadata

**Como** gestor de marketing,
**Quero** que a loja tenha SEO tecnico impecavel desde o lancamento,
**Para** que o Gabinete FC seja encontrado no Google por quem busca camisas de futebol.

**Criterios de Aceitacao:**
- [ ] Metadata dinamica com `generateMetadata` em todas as paginas de produto e categoria
- [ ] Open Graph tags (titulo, descricao, imagem) para compartilhamento em redes sociais
- [ ] Twitter Card metadata
- [ ] Schema markup JSON-LD implementado:
  - `Organization` na home
  - `Product` + `AggregateRating` em cada produto
  - `BreadcrumbList` em paginas internas
  - `FAQPage` na pagina de FAQ
  - `WebSite` com `SearchAction`
- [ ] `sitemap.xml` dinamico gerado via `app/sitemap.ts` (produtos + categorias + paginas)
- [ ] `robots.txt` configurado (bloquear /admin, /checkout, /minha-conta)
- [ ] Canonical URLs em todas as paginas (evitar conteudo duplicado)
- [ ] URLs slugificadas e amigaveis em portugues
- [ ] Hreflang nao necessario (apenas pt-BR)
- [ ] Imagens com `alt` text descritivo e relevante

**Notas Tecnicas:**
- Usar Metadata API do Next.js 14 (nao `<Head>`)
- Sitemap regenerado a cada 24h (ISR)
- JSON-LD inserido via `<script type="application/ld+json">` em Server Components

---

### US-07.2 - Performance e Core Web Vitals

**Como** visitante,
**Quero** que a loja carregue rapido em qualquer dispositivo,
**Para** ter uma experiencia agradavel e nao abandonar a pagina por lentidao.

**Metas (Core Web Vitals):**
- LCP < 2.5 segundos
- FID < 100ms (INP < 200ms)
- CLS < 0.1

**Criterios de Aceitacao:**
- [ ] Todas as imagens via `next/image` com `sizes` e `priority` corretos
- [ ] Imagens de produtos em WebP ou AVIF (Supabase Image Transformation ou Vercel)
- [ ] Fontes carregadas via `next/font` (sem layout shift)
- [ ] Lighthouse Score >= 90 em Performance, Acessibilidade, SEO em producao
- [ ] Code splitting automatico do Next.js + dynamic imports para componentes pesados
- [ ] Bot e mini carrinho carregados com `dynamic()` (lazy)
- [ ] SSR nas paginas de produto e catalogo
- [ ] ISR configurado: home (3600s), categorias (3600s), produtos (1800s), sitemap (86400s)
- [ ] Nenhum `layout shift` visivel em scrolls e carregamentos
- [ ] Prefetch de links do Next.js habilitado (padrao)

**Notas Tecnicas:**
- Rodar Lighthouse CI no pipeline de CI/CD (Fase 2)
- Monitorar Web Vitals com `web-vitals` library reportando para GA4
- Usar `Suspense` e Skeleton components em todas as secoes com dados async
- Bundle analyzer configurado: `ANALYZE=true npm run build`

---

### US-07.3 - Acessibilidade

**Como** pessoa com deficiencia,
**Quero** que a loja seja acessivel com tecnologias assistivas,
**Para** poder comprar camisas como qualquer outro cliente.

**Criterios de Aceitacao:**
- [ ] Todos os botoes e links com aria-labels descritivos
- [ ] Imagens com alt text relevante (produtos: "Camisa [Time] [Tipo] [Temporada]")
- [ ] Contraste de cor minimo WCAG AA (4.5:1 para texto normal)
- [ ] Navegacao completa por teclado (Tab, Enter, Escape)
- [ ] Focus visible em todos os elementos interativos
- [ ] Modais e drawers com focus trap e fechamento por Escape
- [ ] Skip to content link
- [ ] Formularios com labels associados via `htmlFor`
- [ ] Mensagens de erro em formularios associadas ao campo via `aria-describedby`
- [ ] Axe DevTools ou similar rodando sem erros criticos

---

### US-07.4 - Configuracao de Deploy na Vercel

**Como** desenvolvedor,
**Quero** o pipeline de deploy automatizado na Vercel para todos os ambientes,
**Para** que novas versoes cheguem a producao de forma segura e previsivel.

**Criterios de Aceitacao:**
- [ ] Projeto configurado na Vercel [A_CONFIGURAR]
- [ ] Deploy automatico para `preview` em todo pull request
- [ ] Deploy automatico para `producao` ao fazer merge na branch `main`
- [ ] Variaveis de ambiente configuradas por ambiente (preview, producao) [A_CONFIGURAR]
- [ ] Dominio `gabinetefc.com.br` apontado para Vercel [A_CONFIGURAR]
- [ ] Dominio `admin.gabinetefc.com.br` configurado [A_CONFIGURAR]
- [ ] HTTPS automatico (Let's Encrypt via Vercel)
- [ ] Vercel Analytics habilitado
- [ ] Vercel Speed Insights habilitado
- [ ] Headers de seguranca configurados em `next.config.js`:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Content-Security-Policy` (configurar gradualmente)
- [ ] Cron Jobs configurados em `vercel.json` (rastreamento Correios)
- [ ] Redirect de `www.gabinetefc.com.br` para `gabinetefc.com.br`

**Notas Tecnicas:**
- Usar `vercel.json` para configuracoes de redirects, rewrites e crons
- Configurar `VERCEL_URL` nas funcoes que precisam da URL base
- Webhook URL do Stripe deve usar URL de producao [A_CONFIGURAR]

---

### US-07.5 - Monitoramento e Analytics

**Como** administrador,
**Quero** monitoramento em tempo real da loja e analytics de comportamento,
**Para** identificar problemas rapidamente e tomar decisoes baseadas em dados.

**Criterios de Aceitacao:**
- [ ] Google Analytics 4 configurado com eventos principais: `view_item`, `add_to_cart`, `begin_checkout`, `purchase`
- [ ] Google Tag Manager configurado para facilitar adicao de tags futuras [A_CONFIGURAR]
- [ ] Meta Pixel configurado para retargeting [A_CONFIGURAR]
- [ ] Eventos de conversao configurados no GA4 e Meta Ads [A_CONFIGURAR]
- [ ] Error tracking: Sentry ou similar configurado (Fase 2)
- [ ] Uptime monitoring: Vercel ou servico externo para alertas de downtime
- [ ] Alertas de erro critico configurados (webhook Slack ou email) [A_CONFIGURAR]
- [ ] Dashboard do Supabase configurado para monitorar queries lentas

**Notas Tecnicas:**
- GA4 e Pixel carregados via GTM (melhor para performance e manutencao)
- Eventos do lado servidor via Measurement Protocol para conversoes (nao bloqueadas por ad blockers)
- Web Vitals reportados para GA4 via `reportWebVitals` em `app/layout.tsx`

---

---

## Resumo de Prioridades e Roadmap

### MVP - Fase 1 (Lancamento)

| Epic | Stories Incluidas | Estimativa |
|---|---|---|
| EPIC-01 | US-01.1 a US-01.4 | 1 semana |
| EPIC-02 | US-02.1 a US-02.8 (sem /copa e /promocoes) | 3 semanas |
| EPIC-03 | US-03.1 a US-03.8 | 2 semanas |
| EPIC-04 | US-04.1 a US-04.6 | 2 semanas |
| EPIC-05 | US-05.1 a US-05.4 | 2 semanas |
| EPIC-06 | US-06.1 a US-06.9 | 3 semanas |
| EPIC-07 | US-07.1 a US-07.5 (basico) | 1 semana |

**Total estimado MVP:** 14 semanas com 1 desenvolvedor senior (pode ser paralelizado com mais devs)

---

### Fase 2 (Pos-Lancamento)

- US-02.2 (contador Copa completo)
- US-02.8 (/copa e /promocoes completos)
- US-03.8 (upload de fotos nas avaliacoes avancado)
- US-05.3 (Email 7 - recuperacao de carrinho abandonado)
- US-05.2 (webhook dos Correios se disponivel)
- US-07.2 (Lighthouse CI no pipeline)
- US-07.5 (Sentry e alertas avancados)
- US-06.8 (relatorios financeiros avancados)

---

### Fase 3 (Expansao)

- Expansao do catalogo (multiplos fornecedores)
- Programa de fidelidade e pontos
- PWA e experiencia mobile aprimorada
- App mobile (React Native)
- Integracao com marketplaces (Mercado Livre, Shopee)
- Multi-idioma (se expansao internacional)

---

## Mapa de Dependencias

```
EPIC-01 (Base)
    └── EPIC-02 (Frontend)
    └── EPIC-03 (Auth)
            └── EPIC-04 (Checkout)
                    └── EPIC-05 (Integracoes)
                            └── EPIC-06 (Admin)
                                    └── EPIC-07 (SEO/Deploy)
```

---

## Decisoes Tecnicas e Riscos

### Decisoes Confirmadas
- **Next.js App Router** sobre Pages Router: melhor DX, SSR nativo, Server Components
- **Supabase** sobre Firebase: SQL estruturado, RLS nativo, melhor para relacional
- **Stripe** sobre PagSeguro/Mercado Pago: melhor API, suporte a Pix via API
- **Vercel** sobre AWS/Railway: zero-config para Next.js, ISR nativo

### Riscos Identificados

| Risco | Probabilidade | Impacto | Mitigacao |
|---|---|---|---|
| API dos Correios instavel | Alta | Alto | Cache agressivo + retry + valor de frete manual como fallback |
| Retencao alfandegaria alta | Media | Alto | Pagina /alfandega clara + checkbox no checkout + email automatico |
| Pix via Stripe indisponivel no Brasil | Baixa | Alto | Validar disponibilidade antes do dev; backup: Mercado Pago para Pix |
| Custo Claude API em escala | Media | Medio | Rate limiting por sessao + cache de respostas comuns |
| Migracao React → Next.js mais longa | Media | Medio | Manter componentes legados como referencia, nao reescrever tudo |

---

## Convencoes do Projeto

### Nomenclatura de Arquivos
- Paginas: `app/[rota]/page.tsx`
- Componentes: `components/[categoria]/NomeComponente.tsx` (PascalCase)
- Hooks: `hooks/useNomeHook.ts`
- Utilitarios: `lib/nome-util.ts` (kebab-case)
- Tipos: `types/nome-dominio.ts`
- Emails: `emails/NomeTemplate.tsx`

### Estrutura de Pastas Proposta

```
app/
├── (public)/           # Grupo de rotas publicas
│   ├── page.tsx        # Home
│   ├── loja/
│   ├── produto/[slug]/
│   ├── carrinho/
│   ├── busca/
│   └── [institucionais]/
├── (auth)/             # Login, cadastro
├── checkout/
├── minha-conta/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── pedidos/
│   ├── enderecos/
│   ├── perfil/
│   ├── favoritos/
│   └── avaliacoes/
├── admin/
│   ├── layout.tsx
│   └── [modulos]/
├── api/
│   ├── webhooks/stripe/
│   ├── freight/
│   ├── chat/
│   └── auth/callback/
└── auth/
    └── callback/

components/
├── ui/                 # shadcn/ui + componentes base
├── layout/             # Navbar, Footer, etc.
├── product/            # Cards, galeria, etc.
├── cart/               # Mini carrinho, página carrinho
├── checkout/           # Steps do checkout
├── account/            # Área do cliente
├── admin/              # Componentes do admin
└── shared/             # Componentes reutilizaveis

lib/
├── supabase/
├── stripe.ts
├── correios.ts
├── email.ts
├── env.ts
├── settings.ts
├── installments.ts
├── shipping.ts
└── promotions.ts
```

---

*EPIC criado por @pm (Synkra AIOS) | Versao 1.0 | 2026-04-16*
*Proximo passo: Revisar com @architect para validacao tecnica, depois @po para priorizacao do backlog*

---

### Critical Files for Implementation

- `/time-shirt-showcase-main/src/data/products.ts` - Dados mock existentes a migrar para seed do Supabase
- `/time-shirt-showcase-main/src/context/CartContext.tsx` - Logica de carrinho a migrar e evoluir para o Next.js
- `/time-shirt-showcase-main/src/components/` - Componentes legados (Navbar, Footer, HeroSection, ProductCard, ProductGrid) a portar para Next.js como referencia
- `/time-shirt-showcase-main/src/pages/` - Paginas existentes (Index, Produtos, ProductDetail, Carrinho, Cadastro) a servir como base para as rotas do App Router
- `/.env.example` - Arquivo de configuracao de ambiente a expandir com todas as variaveis listadas no EPICagentId: a15f6b1c7778641e7 (for resuming to continue this agent's work if needed)
<usage>total_tokens: 32941
tool_uses: 0
duration_ms: 362493</usage>