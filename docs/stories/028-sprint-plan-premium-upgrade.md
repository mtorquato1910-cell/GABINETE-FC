# 028 — SPRINT PLAN: Premium Upgrade (Gabinete FC)

**Status:** ✅ TODAS AS 5 SPRINTS CONCLUÍDAS · pendente migration manual + commit
**Owner:** @aios-master (Orion) — orquestrando
**Início:** 2026-05-14
**Conclusão:** 2026-05-14 (mesmo dia · build passando)
**Estimativa original:** 12–14 dias

## Status final por sprint
- ✅ SPRINT 1 — Schema & Personalização
- ✅ SPRINT 2 — Header & Navegação Premium
- ✅ SPRINT 3 — Página de Produto Pro
- ✅ SPRINT 4 — Cupom COPA5 + Parcelamento
- ✅ SPRINT 5 — Perfil & Imagens Placeholder

## Validações finais
- `npx tsc --noEmit` ✅ verde
- `npm run lint` ✅ 0 errors (2 warnings em código pré-existente, não tocado)
- `npm run build` ✅ Next 16 production build OK
- Migration **NÃO** foi aplicada — usuário deve rodar `npm run db:migrate` manualmente

## Contexto

Upgrade premium do e-commerce mantendo a identidade brutalist editorial
(preto + verde neon #CAFF00 + Geist Mono bold condensed). Decisões aprovadas:

- Ordem de execução: **Fase 2 → 1 → 3 → 4 → 5** (Schema primeiro)
- Preço: P1 (Brasil/Argentina/França/Portugal) mantém premium; P3 (catálogo geral) = R$ 249,90
- Imagens reais das camisas: decisão adiada (cliente avalia opção fornecedor JIN / IA generativa)
- Skills disponíveis: `/frontend-design` ✅ · `/web-design-guidelines` ✅
- Substituições (skills não instaladas): `@ux-design-expert` (no lugar de `/bencium-controlled-ux-designer`) · `@architect` (no lugar de `/architecture-designer`)

---

## SPRINT 1 — Schema & Personalização (Fundação) 🟡

**Owners:** @data-engineer + @dev · **Validação:** @architect · **QA:** @qa
**Duração:** 2–3 dias

### Entregáveis
- [ ] `prisma/schema.prisma`: adicionar em `OrderItem` → `customName String?`, `customNumber String?`, `hasCustomization Boolean @default(false)`
- [ ] `src/types/index.ts`: refletir os 3 campos em `CartItem` e `OrderItem` (todos opcionais)
- [ ] `src/lib/actions/checkout.ts`: `orderSchema` aceita e `createOrder` persiste customização
- [ ] Migration aplicada (rodar manualmente: `npm run db:migrate`)
- [ ] Email pro fornecedor JIN (quando existir) lê os novos campos

### DoD
- Migration não quebra Orders existentes
- `npm run build` passa (prisma generate + next build)
- Type-check sem erros
- Order criada antiga continua funcionando sem custom

---

## SPRINT 2 — Header & Navegação Premium 🟢

**Owners:** @ux-design-expert + @dev · **Skills:** `/frontend-design` + `/web-design-guidelines`
**Duração:** 2 dias

### Entregáveis
- [ ] `NavbarClient.tsx`: ícone de usuário no canto superior direito
  - Deslogado: ícone → `/auth/login`
  - Logado: avatar/iniciais → dropdown com `Minha Conta · Pedidos · Rastreio · Lista de Desejos · Sair`
- [ ] Item de menu `LOJA ▾` com dropdown: `Seleções › Clubes (Em Breve) › Drops › Ver Todas`
- [ ] Versão mobile (drawer) atualizada
- [ ] Microinterações verde neon + focus ring acessível

### DoD
- WCAG AA contraste + foco
- Dropdown fecha com ESC e clique fora
- DNA brutalist preservado

---

## SPRINT 3 — Página de Produto Pro 🟡

**Owners:** @ux-design-expert + @architect + @dev · **Skills:** `/frontend-design` + `/web-design-guidelines`
**Duração:** 3–4 dias

### Entregáveis
- [ ] Toggle `PERSONALIZAR CAMISA?` (Sim, quero única / Não, deixar lisa)
- [ ] Se Sim: inputs `NOME (max 12 chars uppercase)` + `NÚMERO (1-99)` com preview ao vivo
- [ ] Validação do botão "ADICIONAR AO CARRINHO":
      `disabled = !sizeSelected || customizationChoice === null || (customizationChoice === 'yes' && (!name || !number))`
- [ ] Refatorar `cart-store.ts` (Zustand): chave única por item passa a ser `lineId` (uuid)
- [ ] Componente `<RelatedJerseys>` (Server Component) embaixo: 4 cards mesma confederação ou featured
- [ ] `<SocialProof>` ajustado: range 4–12, refresh a cada 30s

### DoD
- Não dá pra adicionar sem decidir personalização
- Preview respeita limite de chars
- Related Jerseys nunca repete a camisa da página
- Mobile UX testado

---

## SPRINT 4 — Cupom COPA5 + Parcelamento 🟠

**Owners:** @po + @dev + @architect · **Skills:** `/frontend-design` + `/web-design-guidelines`
**Duração:** 3 dias

### Entregáveis
- [ ] Seed `Coupon`: `code:'COPA5', type:'percent', value:5, firstOrderOnly:true, isActive:true`
- [ ] Sticky bar topo: `PRIMEIRA COMPRA? CUPOM COPA5 → 5% OFF`
- [ ] `validateCoupon()`: bloquear quando `cart.totalItems >= 3` para COPA5 (msg amigável)
- [ ] Util `lib/pricing/installments.ts` (testável isolado):
  ```
  • 1x à vista (Pix 5% off extra)
  • 2-3x sem juros (sempre)
  • cart.totalItems >= 3 → libera 4x e 5x SEM juros
  • acima: taxa 2.99% a.m.
  ```
- [ ] UI checkout step 3: tabela dinâmica de parcelas
- [ ] Atualizar preço base P3 → R$ 249,90 (seed)

### DoD
- 3+ camisas + COPA5 → erro amigável
- 2 camisas + COPA5 → desconto OK
- Tabela parcelas atualiza ao add/remove item
- Webhook Stripe processa installments OK
- P1 mantém preço premium

---

## SPRINT 5 — Perfil & Imagens Placeholder 🟢

**Owners:** @ux-design-expert + @dev · **Skills:** `/frontend-design` + `/web-design-guidelines`
**Duração:** 2 dias

### Entregáveis
- [ ] `/minha-conta` polido: cards Minhas Compras · Carrinho Abandonado · Rastrear Pedido · Endereços · Fidelidade · Lista de Desejos
- [ ] Nova rota `/minha-conta/rastreio/[orderId]` com `trackingCode` + deeplink Correios
- [ ] Nova rota `/minha-conta/carrinho-abandonado` recuperando dados do cron
- [ ] Pasta `/public/images/products/copa2026/` com `placeholder-jersey.svg` brutal
- [ ] Helper `getProductImage(slug)` com fallback automático + badge "FOTO EM BREVE"
- [ ] Validar slugs no seed das 48 seleções

### DoD
- Cliente vê pedido com tracking em tempo real
- Carrinho abandonado restaurável em 1 clique
- Todas 48 seleções acessíveis em `/produto/camisa-{slug}-2026`
- Placeholder respeita identidade brutal

---

## Decisões Arquiteturais

1. Migration de OrderItem só roda quando cliente disparar `npm run db:migrate` — não automatizar (risco prod/Supabase).
2. Lógica de juros vai em util puro `lib/pricing/installments.ts` (testável).
3. `<RelatedJerseys>` é Server Component (fetch Prisma direto, sem client overhead).
4. Header usa primitives já no projeto (`@base-ui/react`) pra dropdown acessível.
5. Carrinho Zustand ganha `lineId` em Sprint 3 (item único = produto + tamanho + custom).
