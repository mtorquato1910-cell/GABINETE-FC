# EPIC-UI-LUXURY-001 — Redesign Visual Premium Gabinete FC
**Status:** Em Execução
**PM:** @pm | **UX:** @ux-design-expert | **QA:** @qa
**Criado:** 2026-04-17

---

## Visão Geral

O e-commerce Gabinete FC precisa elevar seu padrão visual para um nível "Luxury Tech / Editorial" — semelhante a Nike Lab, Apple Store e revistas de moda premium. O design atual está funcional mas sem identidade visual forte.

**Referência:** https://time-shirt-showcase.lovable.app/
**Padrão alvo:** Apple × Nike Lab × Revista de moda de luxo

---

## Problemas Identificados (Análise Técnica UX)

| # | Problema | Impacto | Prioridade |
|---|----------|---------|------------|
| 1 | Tipografia sem peso editorial (letter-spacing positivo, line-height errado) | Alto | P0 |
| 2 | Hero image com transição brusca — sem gradient mask | Alto | P0 |
| 3 | Cards de produto com bordas pesadas, sem profundidade | Alto | P0 |
| 4 | Verde Volt usado em excesso — perde exclusividade | Médio | P1 |
| 5 | Background não é "True Black" (#000) — perde profundidade | Médio | P1 |
| 6 | Admin panel sem hierarquia visual profissional | Alto | P1 |
| 7 | Hover states fracos sem micro-interações | Médio | P2 |
| 8 | Subtextos sem hierarquia de opacidade | Baixo | P2 |

---

## Stories por Sprint

### Sprint 1 — Design System Tokens & Tipografia (P0)
- **Story 1.1** — Atualizar globals.css: True Black background (#000000), cards em #0A0A0A
- **Story 1.2** — Corrigir hero-title: `letter-spacing: -0.05em`, `line-height: 0.9`, `font-weight: 800`
- **Story 1.3** — Definir hierarquia de opacidade: texto primário 100%, secundário 60%, terciário 40%
- **Story 1.4** — Product card hover: `scale(1.05)` + `brightness(1.02)`

### Sprint 2 — Hero Section Premium (P0)
- **Story 2.1** — Gradient mask na imagem do estádio: `from-black via-black/30 to-transparent` (fade esquerda)
- **Story 2.2** — Aumentar contraste da imagem: `brightness-110 contrast-110`
- **Story 2.3** — Botão CTA com transição suave e seta animada no hover
- **Story 2.4** — Label "STATUS: LIVE" com dot pulsante animado

### Sprint 3 — Product Cards Boutique (P0)
- **Story 3.1** — Remover bordas visíveis dos cards, usar separação por espaçamento
- **Story 3.2** — Aspecto 4:5 com padding interno generoso (camisa "flutuando")
- **Story 3.3** — Hover: fundo clareia 2% + image scale 1.05 com transition suave
- **Story 3.4** — Badge refinado: menor, mais elegante
- **Story 3.5** — Preço com hierarquia tipográfica clara

### Sprint 4 — Admin Panel Profissional (P1)
- **Story 4.1** — Dashboard KPI cards: números grandes, hierarquia clara, ícone de tendência
- **Story 4.2** — Tabela de pedidos: zebra stripes, status badges coloridos e estilizados
- **Story 4.3** — Sidebar: active state com volt green left border + background sutil
- **Story 4.4** — Header do admin com breadcrumb e nome da seção em Barlow Condensed

### Sprint 5 — Polimento Final (P2)
- **Story 5.1** — Loja: header com número de produtos e filtro refinado
- **Story 5.2** — Newsletter: fundo com noise texture sutil
- **Story 5.3** — Footer: bottom bar com linha de acento verde
- **Story 5.4** — Marquee banner: reduzir tamanho, mais elegante

---

## Critérios de Aceitação (QA Checklist)

### Visual
- [ ] Background é True Black (#000000) em todas as páginas
- [ ] Hero title tem letter-spacing negativo visível
- [ ] Imagem do estádio tem fade suave para preto na borda esquerda
- [ ] Cards de produto sem bordas visíveis e com depth visual
- [ ] Verde Volt aparece máximo em 3 elementos por página
- [ ] Hover dos cards tem animação suave (300ms ease)

### Tipografia
- [ ] Barlow Condensed 900 nos títulos (hero, seções)
- [ ] Subtextos com opacidade 60% (não cor diferente)
- [ ] Todos os CTA em uppercase tracking-widest

### Performance
- [ ] Build passa sem erros
- [ ] Nenhuma imagem nova adicionada (apenas CSS/Tailwind)
- [ ] Animações usam CSS transform (GPU-accelerated)

### Admin
- [ ] KPI cards com números legíveis e hierarquia clara
- [ ] Tabela de pedidos com status coloridos
- [ ] Sidebar com indicação visual do item ativo

---

## Design Tokens de Referência

```css
/* Paleta */
--true-black: #000000;
--card-bg: #0A0A0A;
--card-hover: #121212;
--border-subtle: #1A1A1A;
--volt-green: #A3E635;  /* usar com parcimônia */
--text-primary: rgba(255,255,255,1.0);
--text-secondary: rgba(255,255,255,0.6);
--text-tertiary: rgba(255,255,255,0.4);

/* Tipografia Hero */
--hero-tracking: -0.05em;
--hero-leading: 0.9;
--hero-weight: 800;
```
