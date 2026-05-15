# Jersey Cover — Prompts oficiais (story 029)

Snapshot dos prompts aprovados pelo usuário em 2026-05-15.
Versão runtime vive em `src/lib/gemini-image.ts` (`buildCoverPrompt` + `buildCoverPromptBlackout`).

---

## ✅ Prompt COLORIDA (V1 — aprovado)

Estilo Lovable adaptado. Vibrant body color, floating ghost mannequin,
fundo preto puro com spotlight no topo, camisa preenchendo ~85% do frame.

```
Professional product photography of a {team} national football team home jersey,
vibrant {primaryColor} body with {secondaryColor} V-collar, side stripes and cuff trim,
{crest} embroidered on chest, {brand} logo on chest right,
floating ghost mannequin style,
PURE DEEP BLACK background with a soft cool white spotlight coming from above the frame,
creating a subtle top-down gradient — slightly lighter at the very top edge of the frame and fading to pure deep black everywhere else.
The spotlight is positioned overhead like an overhead stage light, illuminating only the upper area from above.
NO glow behind or around the jersey body, NO warm tones, NO halo around the jersey.
Streetwear hype editorial aesthetic, high contrast,
centered composition, hyper detailed fabric weave texture, premium sportswear catalog, 4k.
The jersey is large and dominant, filling about 85% of the vertical frame, tight catalog crop with the bottom hem just slightly out of frame.
Empty floating product shot — no mannequin, no hanger, no person, no body. Front view only.
```

**Variáveis**: `{team}`, `{primaryColor}` (ex: "golden yellow"), `{secondaryColor}` (ex: "bright green"), `{crest}` (ex: "CBF crest"), `{brand}` (ex: "Nike swoosh in green").

---

## ✅ Prompt APAGADA (V3 — aprovado, "Stealth Blackout")

Mesma pose/composição da colorida. Camisa em cinza-charcoal com detalhes pretos.
Fundo preto puro com spotlight cool no topo.

```
Professional product photography of a {team} national football team stealth blackout edition home jersey,
deep charcoal grey body with matte black V-collar and black cuff trim,
tonal {crest} blacked out in deep grey on chest, {brand} logo in matte black,
floating ghost mannequin style,
PURE DEEP BLACK background with a soft cool white spotlight coming from above the frame,
creating a subtle top-down gradient — slightly lighter at the very top edge and fading to pure deep black everywhere else.
The spotlight is positioned overhead like an overhead stage light, illuminating only the upper area from above.
NO warm tones, NO halo around the jersey, NO glow behind the jersey body.
Streetwear hype editorial aesthetic, premium "blackout" colorway,
very subtle cool rim light along the top of the shoulders and collar (almost imperceptible),
centered composition, hyper detailed fabric weave texture, premium sportswear catalog, 4k.
The jersey is large and dominant, filling about 85% of the vertical frame, tight catalog crop with the bottom hem just slightly out of frame.
Empty floating product shot — no mannequin, no hanger, no person, no body. Front view only.
```

**Variáveis**: `{team}`, `{crest}`, `{brand}`. Cor da camisa é sempre charcoal grey + black trim (não muda por seleção).

---

---

## 📚 Prompts de referência fornecidos pelo usuário (2026-05-15)

> Usados como inspiração para o estilo hiper-realista 8K. **Não usar literalmente** — extrair linguagem de textura, iluminação direcional e rim-light.

### Referência 1 — Brasil Home (hiper-realista)

```
Ultra-detailed, hyper-realistic professional product photography of a premium Brazil national football team home jersey.
The jersey is classic canary yellow with a dynamic, intricate performance-mesh weave pattern visible across the fabric.
The V-neck collar and sleeve cuffs feature precise, structured green rib-knit trim.
The CBF crest with its five stars and "BRASIL" text is rendered with detailed, high-quality embroidery texture on the right chest,
while the prominent athletic brand swoosh is applied as a precise heat-press material on the left chest.
The jersey is presented in a floating, 3D ghost mannequin style, maintaining a perfect, sculpted form.
The lighting is cinematic, directional top-down studio lighting, casting deep shadows and dramatic highlights
that accentuate every fiber of the fabric, seam, and emblem.
Focus is ultra-sharp on the central chest and crest.
The background is a deep, void-like matte charcoal black.
8k resolution, photorealistic, premium catalog quality.
```

### Referência 2 — Variante Monocromática (Stealth Hype)

```
Ultra-detailed, hyper-realistic professional product photography of a premium, monochromatic football jersey,
inspired by the Brazil national team away kit, in a deep slate gray and silver-toned colorway.
The entire jersey features a uniform, complex textured performance fabric weave, rendering all elements in a tonal palette.
The V-neck collar and sleeve cuffs are a contrasting dark charcoal gray with subtle ribbed texture.
The central Brazilian crest, with five stars and "BRASIL", is rendered as a sophisticated, monochrome dark gray embroidery with sharp, clear stitches.
The athletic brand swoosh on the right chest is a precision-cut heat-press application in matching charcoal.
The jersey is presented in a floating 3D ghost mannequin style against a solid, dark moody charcoal background.
The lighting is intense, directional rim-lighting and dramatic top-down illumination,
highlighting the contours and complex textures of the gray-toned fabric, seams, and branding with high contrast.
Ultra-sharp focus on the fabric texture and crest details.
8k resolution, photorealistic, high-fashion editorial streetwear style.
```

**Termos-chave extraídos para uso em prompts oficiais**: `performance-mesh weave`, `rib-knit trim`, `heat-press material`, `monochrome dark gray embroidery`, `directional rim-lighting`, `dramatic top-down illumination`, `sculpted form`, `ultra-sharp focus`, `8k photorealistic`, `every fiber of the fabric`.

---

## Pipeline

1. **Colorida**: chama Gemini com prompt COLORIDA + brasão como referência. Gera 1 imagem.
2. **Apagada**: chama Gemini com prompt APAGADA + a imagem colorida recém-gerada como referência (pra herdar pose). Gera 1 imagem.
3. Ambas passam por sharp `.resize(1024, 1280, fit: 'cover')` + `.webp({ quality: 88 })`.
4. Salvas em `public/images/products/copa2026/covers/{slug}-cover-{color|gray}.webp`.
5. `Product.images = [grayPath, colorPath, ...fotosReaisExistentes]` — atualizado em transação no par Jogador + Torcedor.

Custo por par: ~R$ 0.40 (2 chamadas Gemini 2.5 Flash Image @ ~R$ 0.20 cada).
