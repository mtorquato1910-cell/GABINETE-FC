# Story 012 — Sprint 7: SEO Técnico, Sitemap, Robots e Otimizações

**Status:** Concluído
**Data de conclusão:** 2026-04-16
**Sprint:** 7
**Agente:** @dev

---

## Objetivo

Implementar SEO técnico completo para o Gabinete FC, incluindo metadata global com OpenGraph e Twitter Cards, sitemap dinâmico, robots.txt, PWA manifest, além de página de gestão de estoque no painel admin.

---

## Acceptance Criteria

- [x] `layout.tsx` atualizado com metadata global completa (OpenGraph, Twitter, robots, icons, metadataBase)
- [x] `viewport` exportado separadamente com themeColor (padrão Next.js moderno)
- [x] `sitemap.ts` gerado dinamicamente com páginas estáticas + produtos ativos do banco
- [x] `robots.ts` bloqueando rotas privadas (`/admin`, `/api`, `/auth`, `/checkout`, `/minha-conta`)
- [x] `manifest.ts` configurado para PWA standalone com ícones e cores do projeto
- [x] Página `/admin/estoque` com tabela de estoque calculado via stockMovements
- [x] Componente `AddStockForm` para registrar entradas e saídas de estoque
- [x] API Route `POST /api/admin/stock` com validação de role admin

---

## Tasks

- [x] TAREFA 1 — Atualizar `src/app/layout.tsx` com Metadata + Viewport completos
- [x] TAREFA 2 — Criar `src/app/sitemap.ts` com rotas estáticas e produtos dinâmicos
- [x] TAREFA 3 — Criar `src/app/robots.ts` com regras de crawling
- [x] TAREFA 4 — Criar `src/app/manifest.ts` para PWA
- [x] TAREFA 5 — Criar `src/app/admin/estoque/page.tsx` com tabela de estoque
- [x] TAREFA 6 — Criar `src/components/admin/AddStockForm.tsx` (client component)
- [x] TAREFA 7 — Criar `src/app/api/admin/stock/route.ts` (POST handler)

---

## File List

| Arquivo | Ação |
|---|---|
| `src/app/layout.tsx` | Atualizado — Metadata global, Viewport, OpenGraph, Twitter |
| `src/app/sitemap.ts` | Criado — Sitemap dinâmico com produtos do banco |
| `src/app/robots.ts` | Criado — Regras de crawling para bots |
| `src/app/manifest.ts` | Criado — PWA manifest standalone |
| `src/app/admin/estoque/page.tsx` | Criado — Página de gestão de estoque |
| `src/components/admin/AddStockForm.tsx` | Criado — Formulário client para movimentação |
| `src/app/api/admin/stock/route.ts` | Criado — API Route POST com auth de role |

---

## Notas Técnicas

### SEO / Metadata
- `metadataBase` usa `NEXT_PUBLIC_SITE_URL` com fallback para `http://localhost:3000`
- `viewport` exportado separadamente conforme padrão Next.js 14+ (evita warning de deprecação)
- OpenGraph inclui imagem `1200x630` apontando para `/logo/gabinete-fc-logo.png`
- Twitter Card configurado como `summary_large_image`

### Sitemap
- Páginas estáticas com frequência e prioridade diferenciadas
- Produtos buscados do banco com `try/catch` para suportar build-time sem DB disponível
- Produtos com `isActive: true` apenas

### Robots
- Bloqueia: `/admin`, `/api`, `/auth`, `/checkout`, `/minha-conta`
- Permite tudo mais
- Aponta para `${baseUrl}/sitemap.xml`

### PWA Manifest
- `display: standalone` para experiência app-like
- `theme_color: #a3e635` (lime — cor primária do projeto)
- `background_color: #050505` (preto — background do projeto)

### Estoque Admin
- Estoque calculado como `SUM(in) - SUM(out)` a partir de `stockMovements`
- Alerta visual: vermelho ≤ 5, amarelo ≤ 15, verde > 15
- `AddStockForm` usa `fetch` direto para `/api/admin/stock`
- API Route valida `session.user.role === 'admin'` antes de criar `StockMovement`
