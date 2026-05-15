# Story 029 — Jersey Cover AI Generation

> **Status:** in progress
> **Owner:** @aios-master (Orion)
> **Sprint:** Premium Upgrade — extensão
> **Criado:** 2026-05-15

## Resumo

Substituir as imagens-capa de cada camisa do catálogo por uma **arte gerada por IA** padronizada (estilo Lovable showcase: floating product shot, dark charcoal background, dramatic studio lighting), com:

- **Dois estados visuais**: cinza dessaturada (default) → colorida (hover).
- **Crossfade** suave entre os dois estados no desktop.
- **Sempre colorida** no mobile (sem hover).
- **Capa compartilhada** entre versão Jogador e Torcedor da mesma seleção.
- **Lupa (zoom)** desabilitada apenas na capa AI (img[0]); ativa em imagens subsequentes (img[1+], que serão fotos reais).
- Geração feita **1 a 1 via admin**, com preview, refazer ilimitado, e salvar após aprovação.

Piloto: 6 destaques (Brasil I, Brasil II, Argentina, França, Espanha, Alemanha). Após validação visual, replicar para as 42 seleções restantes.

## Contexto / Motivação

A pasta `public/images/products/copa2026/` tem fotos reais usadas como `images[0]` dos produtos. O usuário identificou que essas capas "ficaram ruins" no card de produto (radial glow + foto crua sem padrão). A inspiração é o protótipo Lovable (`Print do site que a lovable fez/`) que tem renders 3D padronizados em tom dark com efeito hover acende-cor.

Decisão de produto (sessão 2026-05-15): adotar capa AI padronizada como `images[0]`, e capa colorida como `images[1]`, mantendo galeria abaixo. Quando fotos reais do fornecedor chegarem, entram em `images[2..n]`.

## Acceptance Criteria

### A. Painel admin — geração

1. Página `/admin/produtos/[id]/capa` acessível apenas para `role=admin`.
2. Form com campos: cor primária (hex), cor(es) secundária(s) (hex), marca esportiva (Nike/Adidas/Puma/Jako/Outro), nome do escudo (texto), descrição do uniforme (textarea), upload do brasão (jpg/png/svg, opcional).
3. Botão "Gerar capa colorida" chama a API Gemini com prompt baseado no template + dados do form + brasão como imagem de referência (quando enviado).
4. Botão "Gerar capa cinza" gera versão dessaturada com mesma seed/composição.
5. Preview lado a lado: cinza + colorida, ambas em 1024×1280, fundo dark charcoal.
6. Botão "Refazer" descarta a versão atual e permite gerar de novo (sem custo de validação prévia).
7. Botão "Aprovar e salvar":
   - Otimiza para `.webp` (sharp, qualidade 88).
   - Salva em `public/images/products/copa2026/covers/{slug}-cover-color.webp` e `{slug}-cover-gray.webp`.
   - Atualiza `Product.images` do **par Jogador + Torcedor** simultaneamente (mesma capa).
   - Coloca em `images[0]` o cinza e em `images[1]` o colorido. As fotos reais (se já existirem) deslocam para `images[2..n]`.

### B. API route

8. `POST /api/admin/generate-jersey-cover` requer sessão admin (NextAuth `role=admin`); rejeita 401/403 caso contrário.
9. Aceita JSON com: `prompt`, `referenceImageBase64?`, `dimensions: { width, height }`.
10. Rate limit: máximo 30 gerações/admin/hora (mesmo da PI da lib Gemini).
11. Retorna `{ imageBase64, mimeType }` ou erro tipado.

### C. Componente `<JerseyCover>`

12. Renderiza duas `Image` empilhadas (cinza visível, colorida `opacity-0`).
13. `group-hover:opacity-100` na colorida com `transition-opacity duration-300` (desktop).
14. Em `md:hidden` (mobile), a colorida fica sempre `opacity-100` e a cinza não renderiza.
15. Aspect-ratio 4:5 (igual aos outros cards).
16. Fallback: se faltar uma das duas imagens (ex: produtos antigos), usa `images[0]` simples sem hover.

### D. Ajuste galeria (`ProductDetailClient`)

17. Quando `images[0]` for capa AI (heurística: slug em `covers/`), substituir o thumb pelo `<JerseyCover>` (sem `react-inner-image-zoom`).
18. Demais miniaturas (`index >= 1`) mantêm `<InnerImageZoom>` normal.
19. Navegação entre thumbnails respeita a regra: ao chegar em `index 0`, lupa fica desabilitada (sem cursor de zoom no hover).

### E. Compartilhamento Jogador/Torcedor

20. Ao salvar, identificar par via slug:
    - `camisa-{team}-2026` (Jogador) ↔ `camisa-{team}-2026-torcedor` (Torcedor).
    - Para variantes (II, III, manga-longa), pair ainda compartilha capa do mesmo "kit" (ex: `camisa-brasil-ii-2026` ↔ `camisa-brasil-ii-2026-torcedor`).
21. Update atualiza ambos os registros do Prisma em uma transação.

## Arquitetura técnica

### Stack

- **Geração**: Google Gemini 2.5 Flash Image (`gemini-2.5-flash-image-preview` via `@google/genai`).
- **Custo estimado**: ~$0.039 por imagem × 96 (48 seleções × 2 estados) ≈ R$ 19.
- **Variável de ambiente**: `GOOGLE_API_KEY` em `.env.local`.
- **Otimização local**: `sharp` (já no projeto) → webp 88.

### Arquivos novos

```
gabinete-fc/
├── src/
│   ├── lib/
│   │   └── gemini-image.ts            # Cliente Gemini, fn generateJerseyCover()
│   ├── app/
│   │   ├── api/admin/generate-jersey-cover/
│   │   │   └── route.ts               # POST handler, auth, rate limit
│   │   └── admin/produtos/[id]/capa/
│   │       └── page.tsx               # Server: carrega produto e par
│   │       └── CapaForm.tsx           # Client: form + preview + salvar
│   ├── components/product/
│   │   └── JerseyCover.tsx            # Crossfade cinza→cor
│   └── lib/actions/
│       └── covers.ts                  # Server action: saveCover(slug, ...)
```

### Arquivos modificados

- `src/components/product/ProductCard.tsx` — usa `<JerseyCover>` quando produto tem `images[0]` + `images[1]` em `covers/`.
- `src/components/product/ProductDetailClient.tsx` — desabilita lupa no thumb 0.

### Prompt template

```typescript
const COVER_PROMPT = (data: {
  team: string
  primaryColor: string
  secondaryColor: string
  brand: string
  crest: string
  details: string
}) => `${data.primaryColor} ${data.team} national football jersey, product photography,
floating against dark charcoal #0a0a0a background, dramatic studio lighting from above,
streetwear editorial style, hyper detailed fabric texture,
${data.secondaryColor} accents, ${data.brand} branding on chest right,
${data.crest} crest on chest left, ${data.details},
centered composition, high fashion magazine aesthetic,
no mannequin, no person, no hanger, floating product shot`

const GRAY_SUFFIX = `, fully desaturated monochrome grayscale, no color saturation`
```

### Pipeline de save

1. Admin clica "Aprovar e salvar".
2. Server action `saveCover(slug, { colorBase64, grayBase64 })`:
   - Converte ambos os base64 → buffer → sharp → webp.
   - Escreve em `public/images/products/copa2026/covers/{slug}-cover-{color|gray}.webp`.
   - Identifica par Jogador/Torcedor via slug pattern.
   - `prisma.$transaction` atualiza `images` dos dois produtos:
     - Novo array: `["{slug}-cover-gray.webp", "{slug}-cover-color.webp", ...fotosReaisExistentes]`
     - O cinza é `[0]` (capa default), colorido é `[1]` (acende no hover via componente).
   - `revalidatePath('/loja')`, `/loja/[categoria]`, `/produto/[slug]` x2.

### Mobile vs Desktop

- **Detecção**: Tailwind `md:` (≥768px). Não usar JS — totalmente CSS.
- **Mobile**: a `<Image>` colorida tem `opacity-100` por padrão; a cinza tem `hidden md:block`. Resultado: mobile só vê a colorida.
- **Desktop**: cinza visível, colorida `opacity-0 md:opacity-0 md:group-hover:opacity-100`.

## Plano de QA

### Testes manuais (piloto — 6 destaques)

1. ✅ Gerar capa Brasil I no admin → verificar amarelo correto (#FEDD00) e brasão CBF reconhecível.
2. ✅ Verificar que cinza está **realmente** dessaturada (não só baixo contraste).
3. ✅ Verificar que ao salvar, **ambos** Jogador e Torcedor do Brasil receberam as duas imagens novas.
4. ✅ Abrir home (`/`) → passar mouse no card do Brasil → crossfade cinza→amarelo deve durar ~300ms.
5. ✅ Abrir `/loja/selecoes` → confirmar que todos os 6 cards têm cinza→cor no hover.
6. ✅ Mobile (Chrome DevTools 375px) → confirmar que aparece direto colorida, sem hover.
7. ✅ Abrir `/produto/camisa-brasil-2026` → thumb [0] sem cursor de lupa, thumb [1+] com lupa.
8. ✅ Tentar acessar `/admin/produtos/[id]/capa` sem login → redirect para `/auth/login`.
9. ✅ Tentar acessar como user comum (não admin) → 403.
10. ✅ Tentar `POST /api/admin/generate-jersey-cover` direto via curl sem cookie → 401.

### Edge cases

- **Produto sem capa AI ainda**: `<JerseyCover>` faz fallback pra `images[0]` simples, sem quebrar.
- **API Gemini fora do ar**: API route retorna 503; UI mostra toast de erro com retry.
- **Imagem grande (>5MB base64)**: rejeitar no client antes de enviar; mostrar mensagem.
- **Rate limit estourado**: 429 com `Retry-After`; UI mostra contador.

### Regressão

- Cards na home (`getFeaturedProducts`) continuam carregando sem flicker (`next/image` priority na primeira fila).
- Lupa em `/produto/[slug]` funciona normalmente em `images[1+]`.
- Carrinho, busca, checkout — sem mudança esperada.

## Plano de execução

### Fase 1 — Implementação (esta story)

- [x] Criar story 029 (este doc)
- [ ] Adicionar `@google/genai` ao package.json
- [ ] Criar `src/lib/gemini-image.ts`
- [ ] Criar API route `POST /api/admin/generate-jersey-cover`
- [ ] Criar server action `saveCover` em `src/lib/actions/covers.ts`
- [ ] Criar página admin `/admin/produtos/[id]/capa`
- [ ] Criar componente `<JerseyCover>`
- [ ] Ajustar `ProductCard` pra usar `<JerseyCover>`
- [ ] Ajustar `ProductDetailClient` pra desabilitar lupa em `index 0`
- [ ] Type-check + lint

### Fase 2 — Piloto (após API key)

- [ ] Gerar Brasil I → validar visual com usuário
- [ ] Ajustar prompt-template se necessário
- [ ] Gerar Brasil II, Argentina, França, Espanha, Alemanha
- [ ] Validar comportamento hover desktop + mobile
- [ ] Validar lupa só em img[1+]

### Fase 3 — Expansão (42 seleções restantes)

- [ ] Usuário preenche dados das seleções faltantes (já tem cor/marca/detalhes/brasão de 47 das 48)
- [ ] Gera 1 a 1 via admin
- [ ] Foto real chega → entra em `images[2+]`, capa AI permanece em [0]/[1]

## Dados das 47 seleções (referência consolidada)

> Fonte: `Informação Camisas/copa2026_uniformes (1).html` + complementos do usuário em chat.
> **Brasões disponíveis em**: `Informação Camisas/{Pais}-1024x614.jpg` ou variantes.

| # | Time | Marca | Cores principais | Status dados | Brasão |
|---|---|---|---|---|---|
| 1 | Brasil I | Nike × Jordan | #FEDD00 / #009C3B / #002776 | ✅ | ✅ |
| 2 | Brasil II | Nike × Jordan | #002776 / #FEDD00 | ✅ | ✅ (CBF) |
| 3 | Argentina | Adidas | #75AADB / branco | ✅ | ✅ |
| 4 | França | Nike | #001F5B / branco / #EF1923 | ✅ | ✅ |
| 5 | Espanha | Adidas | #AA151B / #F1BF00 | ✅ | ✅ |
| 6 | Alemanha | Adidas | branco / preto/vermelho/amarelo | ✅ | ✅ |
| 7 | Inglaterra | Nike | branco / #012169 / #CF142B | ✅ | ✅ |
| 8 | Portugal | Nike | #006600 / #DA291C | ✅ | ✅ |
| 9 | Holanda | Nike | #FF6600 / branco / #003087 | ✅ | ✅ |
| 10 | Bélgica | Adidas | #EF3340 / preto / #F5D000 | ✅ | ✅ |
| 11 | Croácia | Nike | xadrez vermelho/branco / #002776 | ✅ | ✅ |
| 12 | Noruega | Nike | #EF2B2D / branco / #003087 | ✅ | ✅ |
| 13 | Suíça | Puma | #FF0000 / branco | ✅ | ✅ |
| 14 | Áustria | Puma | #ED2939 / branco | ✅ | ✅ |
| 15 | Escócia | Adidas | #003DA5 / branco | ✅ | ✅ |
| 16 | Turquia | Nike | #E30A17 / branco | ✅ | ✅ |
| 17 | Suécia | Adidas | #FFCD00 / #006AA7 | ✅ | ✅ |
| 18 | Rep. Tcheca | Puma | #CC0000 / #002EA6 | ✅ | ✅ |
| 19 | Bósnia | Jako | #002395 / #FECB00 | ✅ | ✅ |
| 20-31 | América + África + Ásia | ver HTML | ✅ | parcial |
| 32 | Nova Zelândia | Nike | branco / preto | ✅ | ✅ |

**Brasões ainda faltando** (15 países): Canadá, EUA, Equador, Paraguai, Haiti, Curaçao, Argélia, Costa do Marfim, Gana, Cabo Verde, África do Sul, Jordânia, Uzbequistão, Catar, RD Congo, Iraque. Para esses, o Gemini gera o brasão a partir de descrição textual (menos fiel, mas viável).

**Observação**: dado de Portugal contém typo (`Vermelho #006600 (verde)` — provavelmente erro de copy/paste). Interpretação adotada: **Verde #006600** é a cor primária do titular (camisa vermelha do Portugal é reserva). Confirmar com usuário se necessário.

## Decisões registradas

- **API**: Gemini 2.5 Flash Image (precedente no projeto, custo viável, suporta imagem de referência).
- **Workflow**: admin gera 1 a 1, controle visual total, sem batch.
- **Hover**: 2 arquivos (`cover-color.webp` + `cover-gray.webp`), crossfade CSS.
- **Mobile**: sempre colorida (sem hover).
- **Lupa**: apenas em `images[index >= 1]`.
- **Compartilhamento**: capa Jogador = capa Torcedor (mesma seleção/variante).
