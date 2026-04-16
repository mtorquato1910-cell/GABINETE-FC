# Story 007 — Sprint 2: Queries Reais do Banco de Dados

**Epic:** EPIC-02 (Frontend Público)
**Sprint:** Sprint 2
**Status:** [x] Concluído — 2026-04-16

## Tarefas
- [x] Atualizar mapProductFromDb em db-helpers.ts
- [x] Criar src/lib/actions/products.ts (server actions)
- [x] Home (/) usando getFeaturedProducts() do banco
- [x] Catálogo (/loja) usando getActiveProducts() do banco
- [x] PDP (/produto/[slug]) usando getProductBySlug() do banco
- [x] Categoria (/loja/[categoria]) usando getProductsByCategory()
- [x] Busca (/busca) com searchProductsDb()
- [x] SearchForm component

## File List
- `gabinete-fc/src/lib/db-helpers.ts` — mapProductFromDb reescrito para schema real (isActive, isFeatured, sem stock/status diretos)
- `gabinete-fc/src/lib/actions/products.ts` — Server actions: getActiveProducts, getFeaturedProducts, getProductBySlug, getProductsByCategory, searchProductsDb, getAllProductSlugs
- `gabinete-fc/src/app/page.tsx` — Home async com getFeaturedProducts(), revalidate=3600
- `gabinete-fc/src/app/loja/page.tsx` — Catálogo async com getActiveProducts(), revalidate=3600
- `gabinete-fc/src/app/produto/[slug]/page.tsx` — PDP async com getProductBySlug(), generateStaticParams real, OG metadata
- `gabinete-fc/src/app/loja/[categoria]/page.tsx` — Página de categoria criada
- `gabinete-fc/src/app/busca/page.tsx` — Página de busca com searchParams
- `gabinete-fc/src/components/shared/SearchForm.tsx` — Client component com useTransition
