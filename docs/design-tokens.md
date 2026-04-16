# Design Tokens — Gabinete FC

**Versão:** 1.0
**Data:** 2026-04-16
**Autor:** @architect

> Fonte única de verdade para todas as decisões visuais do projeto. Estes tokens são implementados como variáveis CSS no `:root` via Tailwind CSS 4 e referenciados em todo o codebase de UI.

---

## Filosofia Visual

O Gabinete FC adota uma linguagem visual **editorial e flat**, inspirada em marcas contemporâneas de streetwear e esportes de alto desempenho. Os princípios são:

- **Sharp edges:** Zero border radius. Sem arredondamentos. Geometria pura.
- **Alto contraste:** Background escuro próximo ao preto com acento volt green de alto impacto.
- **Tipografia funcional:** Space Grotesk — geométrica, legível em qualquer tamanho, com caráter técnico.
- **Sem sombras:** Profundidade comunicada por cor e espaçamento, não por sombras drop-shadow.
- **Densidade controlada:** Grid de 4px como unidade base, sem padding excessivo.

---

## Cores

### Paleta Principal

| Token               | oklch                    | Hex       | Uso                                              |
|---------------------|--------------------------|-----------|--------------------------------------------------|
| `--color-background`| `oklch(0.06 0 0)`        | `#0f0f0f` | Fundo base da aplicação                          |
| `--color-foreground`| `oklch(0.98 0 0)`        | `#f9f9f9` | Texto principal, ícones primários                |
| `--color-primary`   | `oklch(0.85 0.22 130)`   | `#a3e635` | Volt green — CTAs, destaques, hover states       |
| `--color-primary-foreground` | `oklch(0.1 0 0)` | `#1a1a1a` | Texto sobre fundo primary (green)              |
| `--color-muted`     | `oklch(0.15 0 0)`        | `#262626` | Fundos de cards, inputs, seções secundárias      |
| `--color-muted-foreground` | `oklch(0.55 0 0)` | `#8a8a8a` | Texto secundário, labels, placeholders          |
| `--color-border`    | `oklch(0.2 0 0)`         | `#333333` | Bordas de cards, divisores, outlines de inputs   |
| `--color-accent`    | `oklch(0.85 0.22 130)`   | `#a3e635` | Alias para primary, para uso em shadcn/ui        |
| `--color-accent-foreground` | `oklch(0.1 0 0)` | `#1a1a1a` | Texto sobre fundo accent                        |
| `--color-destructive` | `oklch(0.55 0.22 25)` | `#dc2626`  | Erros, ações destrutivas, alertas               |

### Variantes de Estado

| Token                        | Valor                  | Uso                                 |
|------------------------------|------------------------|-------------------------------------|
| `--color-primary-hover`      | `oklch(0.78 0.22 130)` | Hover em botões primary             |
| `--color-primary-active`     | `oklch(0.72 0.22 130)` | Estado pressed/active               |
| `--color-muted-hover`        | `oklch(0.18 0 0)`      | Hover em elementos muted            |
| `--color-ring`               | `oklch(0.85 0.22 130)` | Focus ring em inputs e botões       |

### Escala de Cinzas (Gray Scale)

| Token            | oklch              | Hex       |
|------------------|--------------------|-----------|
| `--color-gray-50` | `oklch(0.98 0 0)` | `#f9f9f9` |
| `--color-gray-100`| `oklch(0.93 0 0)` | `#ededed` |
| `--color-gray-200`| `oklch(0.85 0 0)` | `#d4d4d4` |
| `--color-gray-300`| `oklch(0.72 0 0)` | `#b5b5b5` |
| `--color-gray-400`| `oklch(0.55 0 0)` | `#8a8a8a` |
| `--color-gray-500`| `oklch(0.45 0 0)` | `#737373` |
| `--color-gray-600`| `oklch(0.35 0 0)` | `#525252` |
| `--color-gray-700`| `oklch(0.25 0 0)` | `#404040` |
| `--color-gray-800`| `oklch(0.18 0 0)` | `#2d2d2d` |
| `--color-gray-900`| `oklch(0.12 0 0)` | `#1f1f1f` |
| `--color-gray-950`| `oklch(0.06 0 0)` | `#0f0f0f` |

---

## Tipografia

### Família de Fontes

**Space Grotesk** — fonte principal da aplicação.

```html
<!-- Importação via Google Fonts no layout.tsx -->
<link
  href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap"
  rel="stylesheet"
/>
```

| Token              | Valor                                     |
|--------------------|-------------------------------------------|
| `--font-sans`      | `'Space Grotesk', system-ui, sans-serif`  |
| `--font-mono`      | `'JetBrains Mono', monospace`             |

### Pesos Disponíveis

| Peso | Nome       | Uso                                                       |
|------|------------|-----------------------------------------------------------|
| 400  | Regular    | Corpo de texto, descrições, parágrafos                    |
| 500  | Medium     | Labels, badges, navegação, texto de interface             |
| 600  | SemiBold   | Subtítulos, preços, calls-to-action secundários           |
| 700  | Bold       | Títulos de produto, headings de seção, CTAs primários     |

### Escala de Tamanhos

| Token          | rem      | px   | Uso                                        |
|----------------|----------|------|--------------------------------------------|
| `text-xs`      | `0.75rem`| 12px | Metadados, labels pequenas, copyright      |
| `text-sm`      | `0.875rem`| 14px | Texto de interface, placeholders, badges  |
| `text-base`    | `1rem`   | 16px | Corpo de texto padrão                      |
| `text-lg`      | `1.125rem`| 18px | Texto de destaque, lead text              |
| `text-xl`      | `1.25rem`| 20px | Subtítulos, nomes de produtos em cards     |
| `text-2xl`     | `1.5rem` | 24px | Títulos de seção, preços em destaque       |
| `text-3xl`     | `1.875rem`| 30px | Títulos de página                         |
| `text-4xl`     | `2.25rem`| 36px | Hero titles, nome do produto na PDP        |
| `text-5xl`     | `3rem`   | 48px | Display headlines em hero sections         |
| `text-6xl`     | `3.75rem`| 60px | Headlines editoriais de grande impacto     |

### Line Height

| Token             | Valor | Uso                          |
|-------------------|-------|------------------------------|
| `leading-none`    | 1     | Headings grandes, display    |
| `leading-tight`   | 1.25  | Títulos de produto           |
| `leading-snug`    | 1.375 | Subtítulos                   |
| `leading-normal`  | 1.5   | Corpo de texto               |
| `leading-relaxed` | 1.625 | Texto longo, descrições      |

### Letter Spacing

| Token             | Valor     | Uso                                      |
|-------------------|-----------|------------------------------------------|
| `tracking-tighter`| -0.05em   | Headings grandes (acima de 3xl)          |
| `tracking-tight`  | -0.025em  | Títulos de seção (2xl a 3xl)             |
| `tracking-normal` | 0         | Corpo de texto                           |
| `tracking-wide`   | 0.025em   | Labels em uppercase, categorias          |
| `tracking-widest` | 0.1em     | Tags, badges, overlines em caps          |

---

## Border Radius

**Decisão: zero border radius em toda a aplicação.** Estilo sharp/editorial.

| Token              | Valor  | Uso                        |
|--------------------|--------|----------------------------|
| `--radius`         | `0px`  | Valor global do shadcn/ui  |
| `rounded-none`     | `0px`  | Padrão de todos os elementos|

> Nota: o shadcn/ui usa `--radius` como variável CSS base. Definindo `--radius: 0px` no `globals.css`, todos os componentes shadcn/ui automaticamente terão corners retos.

---

## Espaçamento

### Sistema Base

Unidade base: **4px (0.25rem)**. Todo espaçamento é múltiplo de 4px.

| Token  | rem      | px   | Uso típico                              |
|--------|----------|------|-----------------------------------------|
| `1`    | `0.25rem`| 4px  | Gap mínimo entre elementos inline       |
| `2`    | `0.5rem` | 8px  | Padding interno de badges, chips        |
| `3`    | `0.75rem`| 12px | Padding de inputs compactos             |
| `4`    | `1rem`   | 16px | Padding padrão de cards e botões        |
| `5`    | `1.25rem`| 20px | Gap entre elementos de formulário       |
| `6`    | `1.5rem` | 24px | Padding de seções internas              |
| `8`    | `2rem`   | 32px | Margin entre componentes                |
| `10`   | `2.5rem` | 40px | Padding de seções de página             |
| `12`   | `3rem`   | 48px | Margin entre seções principais          |
| `16`   | `4rem`   | 64px | Padding de hero sections                |
| `20`   | `5rem`   | 80px | Separação entre seções de landing page  |
| `24`   | `6rem`   | 96px | Padding de seções de grande impacto     |

### Container

| Contexto          | Max Width | Padding Lateral       |
|-------------------|-----------|-----------------------|
| Mobile            | 100%      | `px-4` (16px)         |
| Tablet (md)       | 100%      | `px-6` (24px)         |
| Desktop (lg)      | 1024px    | `px-8` (32px)         |
| Wide (xl)         | 1280px    | `px-8` (32px)         |
| Full (2xl)        | 1536px    | `px-8` (32px)         |

---

## Breakpoints

| Token  | Valor  | Uso                                                     |
|--------|--------|---------------------------------------------------------|
| `sm`   | 640px  | Smartphones grandes, layout de 2 colunas em listas      |
| `md`   | 768px  | Tablets, navegação horizontal                           |
| `lg`   | 1024px | Desktops, grid de 3-4 colunas em produtos               |
| `xl`   | 1280px | Desktops largos, sidebar + conteúdo                     |
| `2xl`  | 1536px | Monitores ultra-wide, grids de 5+ colunas               |

### Grid de Produtos

| Breakpoint | Colunas | Uso                         |
|------------|---------|-----------------------------|
| Default    | 1       | Mobile, listagem vertical   |
| `sm`       | 2       | Smartphones paisagem        |
| `md`       | 2       | Tablets                     |
| `lg`       | 3       | Desktops                    |
| `xl`       | 4       | Desktops largos             |

---

## Sombras

**Decisão: sem sombras em toda a aplicação.** Estilo flat/editorial. Profundidade é comunicada por bordas (`border`) e diferença de cor de fundo entre camadas.

| Token          | Valor  | Notas                                     |
|----------------|--------|-------------------------------------------|
| `shadow-none`  | none   | Padrão de todos os elementos              |
| `shadow-sm`    | none   | Override — não utilizado                  |
| `shadow`       | none   | Override — não utilizado                  |
| `shadow-lg`    | none   | Override — não utilizado                  |

> Alternativa ao shadow para elevação visual: usar `border border-border` (borda `#333333`) sobre fundo `muted` (`#262626`).

---

## Implementação em CSS

```css
/* app/globals.css */
@import "tailwindcss";

:root {
  /* Cores */
  --color-background: oklch(0.06 0 0);
  --color-foreground: oklch(0.98 0 0);
  --color-primary: oklch(0.85 0.22 130);
  --color-primary-foreground: oklch(0.1 0 0);
  --color-muted: oklch(0.15 0 0);
  --color-muted-foreground: oklch(0.55 0 0);
  --color-border: oklch(0.2 0 0);
  --color-accent: oklch(0.85 0.22 130);
  --color-accent-foreground: oklch(0.1 0 0);
  --color-destructive: oklch(0.55 0.22 25);
  --color-ring: oklch(0.85 0.22 130);

  /* shadcn/ui compatibility */
  --background: var(--color-background);
  --foreground: var(--color-foreground);
  --primary: var(--color-primary);
  --primary-foreground: var(--color-primary-foreground);
  --muted: var(--color-muted);
  --muted-foreground: var(--color-muted-foreground);
  --border: var(--color-border);
  --accent: var(--color-accent);
  --accent-foreground: var(--color-accent-foreground);
  --destructive: var(--color-destructive);
  --ring: var(--color-ring);

  /* Radius — zero para estilo sharp */
  --radius: 0px;

  /* Tipografia */
  --font-sans: 'Space Grotesk', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

body {
  background-color: var(--color-background);
  color: var(--color-foreground);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

---

## Implementação no Tailwind CSS 4

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "oklch(var(--color-background))",
        foreground: "oklch(var(--color-foreground))",
        primary: {
          DEFAULT: "oklch(var(--color-primary))",
          foreground: "oklch(var(--color-primary-foreground))",
        },
        muted: {
          DEFAULT: "oklch(var(--color-muted))",
          foreground: "oklch(var(--color-muted-foreground))",
        },
        border: "oklch(var(--color-border))",
        volt: "#a3e635", // alias direto para uso em classes utilitárias
      },
      fontFamily: {
        sans: ["Space Grotesk", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        none: "0px",
        sm: "0px",
        DEFAULT: "0px",
        md: "0px",
        lg: "0px",
        xl: "0px",
        "2xl": "0px",
        full: "9999px", // mantido apenas para avatares/badges circulares quando necessário
      },
      boxShadow: {
        sm: "none",
        DEFAULT: "none",
        md: "none",
        lg: "none",
        xl: "none",
        "2xl": "none",
      },
    },
  },
};

export default config;
```

---

## Componentes de Referência

### Botão Primary

```tsx
// Aparência: fundo volt-green, texto escuro, sem radius, sem sombra
<button className="bg-primary text-primary-foreground px-6 py-3 font-semibold tracking-wide uppercase text-sm hover:bg-primary/90 transition-colors">
  Comprar Agora
</button>
```

### Card de Produto

```tsx
// Borda definida, fundo muted, sem radius, sem sombra
<div className="border border-border bg-muted p-4">
  <img className="w-full aspect-square object-cover" />
  <h3 className="text-foreground font-semibold mt-3">Camiseta Flamengo</h3>
  <p className="text-primary font-bold text-xl mt-1">R$ 189,90</p>
</div>
```

### Input de Formulário

```tsx
// Borda border-border, fundo muted, texto foreground, focus ring volt
<input className="w-full bg-muted border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
```

---

## Acessibilidade e Contraste

| Combinação                        | Ratio   | WCAG   |
|-----------------------------------|---------|--------|
| `foreground` (#f9f9f9) / `background` (#0f0f0f) | 18.7:1 | AAA |
| `primary` (#a3e635) / `background` (#0f0f0f) | 10.2:1 | AAA |
| `primary` (#a3e635) / `muted` (#262626)       | 7.8:1  | AAA |
| `muted-foreground` (#8a8a8a) / `background` (#0f0f0f) | 5.1:1 | AA |
| `primary-foreground` (#1a1a1a) / `primary` (#a3e635)  | 8.9:1 | AAA |

> Todos os pares de texto/fundo primários atendem ou excedem o nível AA do WCAG 2.1.
