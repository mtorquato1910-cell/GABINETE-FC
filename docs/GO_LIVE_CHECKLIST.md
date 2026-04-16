# Checklist de Go-Live — Gabinete FC

**Responsável:** @devops + dono do projeto
**Usar em:** Sprint 7 (Deploy MVP)
**Atualizado em:** 2026-04-16

> Todos os itens devem estar marcados `[x]` antes de anunciar a abertura da loja ao público.

---

## 1. DOMÍNIO & DNS

- [ ] Domínio `gabinetefc.com.br` apontando para Vercel (A Record ou CNAME)
- [ ] Subdomínio `admin.gabinetefc.com.br` configurado no Vercel
- [ ] SSL ativo em ambos os domínios (certificado Let's Encrypt via Vercel)
- [ ] Redirect `www.gabinetefc.com.br` → `gabinetefc.com.br` (sem www)
- [ ] Redirect `http://` → `https://` ativo
- [ ] Verificar propagação DNS: `nslookup gabinetefc.com.br`

---

## 2. VERCEL — CONFIGURAÇÃO DE PRODUÇÃO

- [ ] Projeto Vercel apontando para branch `main`
- [ ] Todas as variáveis de ambiente de produção configuradas (sem nenhuma vazia ou com valor de teste)
- [ ] Build de produção executando sem erros: `npm run build`
- [ ] Deploy automático ao push na `main` funcionando
- [ ] Domínio customizado vinculado ao projeto Vercel
- [ ] Vercel Analytics habilitado
- [ ] Cron Jobs configurados (rastreamento Correios, carrinho abandonado, TTL heatmap)

---

## 3. STRIPE — MODO LIVE

- [ ] Conta Stripe Brasil com Pix habilitado (verificar painel Stripe → Configurações → Métodos de pagamento)
- [ ] Chave publicável de **produção** em `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (começa com `pk_live_`)
- [ ] Chave secreta de **produção** em `STRIPE_SECRET_KEY` (começa com `sk_live_`)
- [ ] Webhook endpoint cadastrado no Stripe Dashboard: `https://gabinetefc.com.br/api/stripe/webhook`
- [ ] `STRIPE_WEBHOOK_SECRET` de produção configurado (começa com `whsec_`)
- [ ] Eventos do webhook selecionados: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
- [ ] Teste de compra real com cartão físico feito (R$ 1,00) antes de divulgar
- [ ] Teste de pagamento Pix real feito antes de divulgar
- [ ] Conta bancária vinculada ao Stripe para recebimento dos repasses

---

## 4. SUPABASE — CONFIGURAÇÃO DE PRODUÇÃO

- [ ] Projeto Supabase de **produção** criado (separado do projeto de dev/staging)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` apontando para o projeto de produção
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` do projeto de produção
- [ ] `SUPABASE_SERVICE_ROLE_KEY` do projeto de produção (**nunca exposta no frontend**)
- [ ] Todas as migrations aplicadas no banco de produção
- [ ] Seed de `store_settings` com todos os defaults aplicado
- [ ] RLS ativo e verificado em **todas as tabelas** (rodar query: `SELECT tablename FROM pg_tables WHERE schemaname = 'public'` e verificar cada uma)
- [ ] Backups automáticos habilitados (Supabase Dashboard → Settings → Database → Backups)
- [ ] Point-in-time recovery habilitado (plano Supabase Pro ou superior)
- [ ] Google OAuth configurado com domínio de produção no Supabase Auth (Providers → Google → Authorized Redirect URIs)

---

## 5. META & ANALYTICS

- [ ] Meta Pixel disparando em produção (verificar no Meta Pixel Helper do Chrome)
- [ ] `NEXT_PUBLIC_PIXEL_ID` com ID do Pixel de produção
- [ ] CAPI com `META_ACCESS_TOKEN` de produção (gerar novo token de sistema no BM)
- [ ] Eventos CAPI verificados no Meta Events Manager (Purchase, AddToCart, etc.)
- [ ] Deduplicação de eventos Pixel+CAPI funcionando (verificar eventID no Events Manager)
- [ ] Google Analytics 4 com ID de produção em `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- [ ] GTM publicado com versão de produção
- [ ] Google Search Console — domínio verificado e sitemap enviado

---

## 6. CORREIOS

- [ ] Credenciais de **produção** configuradas (não sandbox): `CORREIOS_API_USERNAME` e `CORREIOS_API_PASSWORD`
- [ ] Teste de cálculo de frete real com CEP de outra cidade funcionando
- [ ] Contrato Correios ativo — verificar se o contrato cadastrado tem as modalidades PAC e SEDEX habilitadas
- [ ] Endereço de origem cadastrado corretamente (CEP do remetente)

---

## 7. E-MAIL (RESEND)

- [ ] Domínio `gabinetefc.com.br` verificado no Resend (DNS TXT + MX records)
- [ ] Endereço remetente configurado: `noreply@gabinetefc.com.br` ou `pedidos@gabinetefc.com.br`
- [ ] Todos os 8 templates de e-mail testados com envio real:
  - [ ] Confirmação de pedido
  - [ ] Pagamento confirmado
  - [ ] Pedido enviado (com tracking)
  - [ ] Pedido entregue
  - [ ] Pedido cancelado
  - [ ] Reembolso processado
  - [ ] Avaliação solicitada (pós-entrega)
  - [ ] Newsletter (confirmação de inscrição)
- [ ] E-mail de novo pedido chegando para o admin (`ADMIN_EMAIL` configurado)
- [ ] Testar que e-mails não caem em spam (verificar SPF, DKIM, DMARC)

---

## 8. SEGURANÇA

- [ ] `robots.txt` bloqueando `/admin/*` e `/api/*`
- [ ] `sitemap.xml` gerado e acessível em `https://gabinetefc.com.br/sitemap.xml`
- [ ] Rate limiting ativo em produção (`@vercel/kv` com KV store da Vercel configurado)
- [ ] Headers de segurança configurados no `next.config.js`:
  - [ ] `X-Frame-Options: DENY`
  - [ ] `X-Content-Type-Options: nosniff`
  - [ ] `Referrer-Policy: strict-origin-when-cross-origin`
  - [ ] `Permissions-Policy`
- [ ] Sentry configurado com `SENTRY_DSN` de produção
- [ ] Alertas Sentry configurados para: erros críticos, falhas de pagamento, erros de webhook
- [ ] Nenhuma variável de ambiente sem prefixo `NEXT_PUBLIC_` aparece no bundle do cliente (verificar nas DevTools → Network → JS files)
- [ ] `VAPID_PRIVATE_KEY` configurada como Vercel Secret (não como env var comum)

---

## 9. SEO & PERFORMANCE

- [ ] Lighthouse Score em produção: Performance ≥85, Accessibility ≥90, Best Practices ≥90, SEO ≥95
- [ ] Core Web Vitals: LCP <2.5s, CLS <0.1, FID/INP <100ms
- [ ] Open Graph images configuradas para Home, Catálogo e PDPs
- [ ] Favicon e apple-touch-icon configurados
- [ ] Schema.org markup em PDPs (Product schema com price, availability, reviews)
- [ ] Canonical URLs corretas em todas as páginas
- [ ] Nenhuma página importante retornando 404 (testar URLs do PRD)

---

## 10. LEGAL & COMPLIANCE (Brasil)

- [ ] CNPJ visível no rodapé
- [ ] Razão social da empresa no rodapé
- [ ] Endereço físico ou de correspondência no rodapé (exigido pelo CDC)
- [ ] Política de Privacidade publicada e linkada no rodapé
- [ ] Política de Trocas e Devoluções publicada (7 dias, CDC Art. 49)
- [ ] Termos de Uso publicados
- [ ] Política de Cookies publicada
- [ ] Checkbox de aceite dos Termos de Uso no checkout (salvar timestamp + versão aceita)
- [ ] Banner de cookies (LGPD) funcionando com aceite/recusa
- [ ] Página sobre alfândega/importação publicada (produto importado da Tailândia)
- [ ] Prazo de entrega real informado nas páginas de produto e checkout (20-30 dias úteis dropshipping)

---

## 11. OPERAÇÃO — ANTES DE ABRIR

- [ ] Ao menos 6 produtos cadastrados com fotos, preço e tamanhos corretos
- [ ] Produto de teste removido ou desativado
- [ ] Cupom de inauguração criado (opcional) e testado
- [ ] Admin notificado por e-mail em novos pedidos (`ADMIN_NOTIFICATION_EMAIL` configurado)
- [ ] Processo de pedido JIN documentado — sabe como fazer o pedido ao fornecedor quando o primeiro pedido chegar
- [ ] WhatsApp Business configurado para suporte (link no rodapé testado)
- [ ] Conta Instagram da loja com pelo menos 3 posts publicados (social proof)

---

## 12. SMOKE TEST FINAL (fazer no dia do lançamento)

Executar manualmente antes de anunciar ao público:

- [ ] Acessar `https://gabinetefc.com.br` — home carrega corretamente
- [ ] Navegar até um produto e adicionar ao carrinho
- [ ] Fazer checkout completo com cartão Stripe em modo live (compra real de R$ 1)
- [ ] Verificar se e-mail de confirmação chegou
- [ ] Acessar `https://admin.gabinetefc.com.br` com credenciais de admin
- [ ] Verificar se o pedido apareceu no admin
- [ ] Mudar status do pedido para "Confirmado" e verificar e-mail ao cliente
- [ ] Testar busca de produto na loja

---

## Aprovação Final

| Responsável | Função | Aprovado em |
|---|---|---|
| | Dono do projeto | ___/___/___ |
| | @devops | ___/___/___ |

> **Somente após todos os itens marcados e aprovação acima, a loja está autorizada a ir ao ar.**

---

*Checklist gerado por @devops — Synkra AIOS*
*Atualizado em: 2026-04-16*
