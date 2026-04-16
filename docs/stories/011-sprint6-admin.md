# Story 011 — Sprint 6: Painel Administrativo Completo

**Status:** Concluído
**Data:** 2026-04-16
**Agente:** @dev / @ux-design-expert

---

## Objetivo

Implementar o painel administrativo completo do Gabinete FC, com autenticação por role, sidebar de navegação, e páginas funcionais para gerenciar produtos, pedidos, cupons, avaliações e configurações da loja.

---

## Acceptance Criteria

- [x] Acesso restrito a usuários com `role === 'admin'` via guard no layout
- [x] Sidebar persistente com links para todas as seções admin
- [x] Dashboard com KPIs (receita, pedidos totais, pendentes, produtos ativos)
- [x] Lista de pedidos recentes na dashboard
- [x] CRUD de produtos com formulário completo (nome, slug, preço, tamanhos, etc.)
- [x] Botão de desativar produto (soft delete)
- [x] Lista de pedidos com filtro por status e link para detalhe
- [x] Detalhe do pedido com itens, totais, histórico e form de atualização de status
- [x] Gestão de cupons com criação inline
- [x] Configurações da loja por grupo (geral, pagamentos, operações, fidelidade, meta)
- [x] Lista de avaliações com status colorido
- [x] Design system aplicado: bg-background ultra-dark, volt green primary, sharp corners (radius 0px), Space Grotesk uppercase

---

## Tarefas

- [x] T1 — Criar `src/app/admin/layout.tsx` (sidebar + auth guard)
- [x] T2 — Criar `src/app/admin/page.tsx` (redirect para /admin/dashboard)
- [x] T3 — Criar `src/app/admin/dashboard/page.tsx` (KPIs + pedidos recentes)
- [x] T4 — Criar `src/lib/actions/admin.ts` (Server Actions: produto, pedido, cupom, configuração)
- [x] T5 — Criar `src/app/admin/produtos/page.tsx` (lista de produtos)
- [x] T6 — Criar `src/components/admin/DeleteProductButton.tsx`
- [x] T7 — Criar `src/app/admin/produtos/novo/page.tsx`
- [x] T8 — Criar `src/app/admin/produtos/[id]/page.tsx` (editar produto)
- [x] T9 — Criar `src/components/admin/ProductForm.tsx`
- [x] T10 — Criar `src/app/admin/pedidos/page.tsx`
- [x] T11 — Criar `src/app/admin/pedidos/[id]/page.tsx` (detalhe do pedido)
- [x] T12 — Criar `src/components/admin/OrderStatusForm.tsx`
- [x] T13 — Criar `src/app/admin/cupons/page.tsx`
- [x] T14 — Criar `src/components/admin/CouponForm.tsx`
- [x] T15 — Criar `src/app/admin/configuracoes/page.tsx`
- [x] T16 — Criar `src/components/admin/StoreSettingsForm.tsx`
- [x] T17 — Criar `src/app/admin/avaliacoes/page.tsx`

---

## File List

### Novos arquivos criados

| Arquivo | Descrição |
|---------|-----------|
| `gabinete-fc/src/app/admin/layout.tsx` | Layout do admin com sidebar e guard de role |
| `gabinete-fc/src/app/admin/page.tsx` | Redirect para /admin/dashboard |
| `gabinete-fc/src/app/admin/dashboard/page.tsx` | KPIs + pedidos recentes |
| `gabinete-fc/src/lib/actions/admin.ts` | Server Actions (createProduct, updateProduct, deleteProduct, updateOrderStatus, createCoupon, updateStoreSetting) |
| `gabinete-fc/src/app/admin/produtos/page.tsx` | Lista de produtos com imagem, status e ações |
| `gabinete-fc/src/app/admin/produtos/novo/page.tsx` | Página de criação de produto |
| `gabinete-fc/src/app/admin/produtos/[id]/page.tsx` | Página de edição de produto |
| `gabinete-fc/src/components/admin/ProductForm.tsx` | Formulário de produto (client) |
| `gabinete-fc/src/components/admin/DeleteProductButton.tsx` | Botão de desativação de produto (client) |
| `gabinete-fc/src/app/admin/pedidos/page.tsx` | Lista de pedidos |
| `gabinete-fc/src/app/admin/pedidos/[id]/page.tsx` | Detalhe do pedido com histórico |
| `gabinete-fc/src/components/admin/OrderStatusForm.tsx` | Form de atualização de status do pedido (client) |
| `gabinete-fc/src/app/admin/cupons/page.tsx` | Lista e criação de cupons |
| `gabinete-fc/src/components/admin/CouponForm.tsx` | Formulário de criação de cupom (client) |
| `gabinete-fc/src/app/admin/configuracoes/page.tsx` | Configurações da loja por grupo |
| `gabinete-fc/src/components/admin/StoreSettingsForm.tsx` | Form de configurações por chave (client) |
| `gabinete-fc/src/app/admin/avaliacoes/page.tsx` | Lista de avaliações com status |

---

## Notas técnicas

- O guard de admin está no `layout.tsx` usando `auth()` do NextAuth + redirect para `/auth/login` se não for admin.
- Server Actions em `src/lib/actions/admin.ts` usam `requireAdmin()` de `@/lib/auth` antes de qualquer operação.
- Produtos e pedidos usam `revalidatePath` após mutações para invalidar o cache de páginas relevantes.
- `OrderStatusForm` também registra entrada em `orderHistory` (action `status_changed`) com `fromStatus` e `toStatus`.
- `StoreSettingsForm` usa `upsert` no Prisma para criar ou atualizar chaves de configuração.
- O design segue estritamente o sistema: `bg-background` ultra-dark, `text-primary` volt green `#a3e635`, `border-border`, `bg-secondary`, `bg-sidebar`, `text-muted-foreground`, radius 0px, tipografia uppercase `tracking-widest`.
