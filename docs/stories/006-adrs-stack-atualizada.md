# Story 006 — ADR: Stack Atualizada (Railway + NextAuth + Prisma)

**Epic:** EPIC-01 (Infraestrutura)
**Sprint:** Sprint 1
**Tipo:** Architecture Decision Record
**Agente:** @architect
**SP:** 2
**Status:** [ ] Não iniciado

---

## Objetivo

Documentar a decisão de usar Railway PostgreSQL + Prisma + NextAuth em vez de Supabase, e as implicações para os EPICs anteriores.

---

## ADR-007: Railway PostgreSQL + Prisma em vez de Supabase

**Status:** Aceito ✅
**Data:** 2026-04-16

**Contexto:**
Os EPICs v1–v5 foram escritos com Supabase como backend. A decisão foi usar Supabase para autenticação, banco e storage. Após análise de setup e velocidade de desenvolvimento, o stack foi simplificado.

**Decisão:** Usar Railway PostgreSQL + Prisma + NextAuth.js v5.

**Razões:**
1. **Sem Docker local** — SQLite com Prisma funciona sem nenhum setup adicional em desenvolvimento
2. **Curva de aprendizado menor** — Prisma é ORM padrão no ecossistema Next.js
3. **Railway é mais simples** — PostgreSQL puro, sem camadas extras (RLS, Auth, Storage)
4. **NextAuth.js** — integração nativa com Next.js App Router, suporte a Google OAuth e Credentials

**Equivalências:**

| Supabase | Stack nova | Notas |
|---|---|---|
| Supabase PostgreSQL | Railway PostgreSQL | Mesma coisa, provider diferente |
| Supabase Auth | NextAuth.js v5 | Mesma funcionalidade |
| Supabase Client | Prisma Client | ORM em vez de cliente REST/RealTime |
| Row Level Security (RLS) | Middleware Next.js + queries Prisma filtradas | Segurança na camada de aplicação |
| Supabase Storage | Uploadthing (prod) / `public/` (dev) | Para imagens de produtos e reviews |
| supabase.from().select() | prisma.product.findMany() | Sintaxe diferente, mesma funcionalidade |

**Consequências:**
- ✅ Desenvolvimento local sem Docker
- ✅ Sem necessidade de conta Supabase para começar
- ✅ Migração SQLite → PostgreSQL é só trocar `DATABASE_URL`
- ⚠️ RLS precisa ser implementado via guards nas Server Actions (não é automático)
- ⚠️ Storage de imagens precisa de solução adicional (Uploadthing em produção)
- ⚠️ Os EPICs mencionam `store_settings` como key-value — mantido como tabela Prisma

---

## ADR-008: SQLite em Desenvolvimento, PostgreSQL em Produção

**Status:** Aceito ✅

**Estratégia:**
```
Desenvolvimento → SQLite (DATABASE_URL="file:./dev.db")
Produção       → Railway PostgreSQL (DATABASE_URL="postgresql://...")
```

**Regras para compatibilidade:**
1. **Enums**: SQLite não tem enums nativos. Usar `String` com validação Zod em runtime. Em produção PostgreSQL, Prisma gera enums reais mas o schema usa String para compatibilidade.
2. **JSON**: SQLite armazena como Text. Usar `JSON.parse/stringify` ao ler/escrever.
3. **Datas**: Sempre usar `DateTime` do Prisma, nunca strings.
4. **Boolean**: SQLite armazena como 0/1 — o Prisma trata automaticamente.

**Helper para JSON fields:**
```typescript
// src/lib/db-helpers.ts
export function parseJsonField<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

// Uso:
const sizes = parseJsonField<string[]>(product.sizesAvailable, [])
const images = parseJsonField<string[]>(product.images, [])
```

---

## ADR-009: Uploadthing para Storage de Imagens

**Status:** Aceito ✅

**Contexto:** Supabase Storage foi substituído. Precisamos de um lugar para guardar imagens de produtos.

**Desenvolvimento:** Imagens ficam em `public/images/products/` (pasta local)
**Produção:** Uploadthing (free tier: 2GB)

**Quando migrar para Uploadthing:**
- Sprint 6 (Admin base): formulário de upload de produto
- Não é necessário antes disso

**Setup futuro (Sprint 6):**
```bash
npm install uploadthing @uploadthing/react
```

---

## Mapeamento EPICs → Nova Stack

Atualizações nos EPICs já documentados:

| Item nos EPICs | Nova implementação |
|---|---|
| `supabase.auth.getUser()` | `auth()` do NextAuth |
| `requireAdmin()` via `app_metadata` | `requireAdmin()` via `session.user.role` |
| `createServerSupabaseClient()` | `prisma` (lib/db.ts) |
| RLS policies | Guards em Server Actions + middleware |
| `store_settings` key-value | `prisma.storeSetting.findUnique({ where: { key } })` |
| Supabase Storage bucket | `public/images/` (dev) / Uploadthing (prod) |
| Supabase migrations | `npx prisma migrate dev` |
| `supabase gen types` | Prisma Client (tipagem automática) |

---

## Tarefas desta Story

- [ ] Atualizar `docs/architecture/ARCHITECTURE.md` com ADR-007, ADR-008, ADR-009
- [ ] Anotar no `INDICE-EPICS.md` que a stack foi atualizada para Railway + Prisma + NextAuth
- [ ] Criar `src/lib/db-helpers.ts` com helper para campos JSON

---

## db-helpers.ts

```typescript
// src/lib/db-helpers.ts

/**
 * Parse seguro de campo JSON armazenado como string (SQLite)
 */
export function parseJsonField<T>(
  value: string | null | undefined,
  fallback: T
): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

/**
 * Serializa array/objeto para string JSON para salvar no banco
 */
export function stringifyJsonField<T>(value: T): string {
  return JSON.stringify(value)
}

/**
 * Converte produto do Prisma para tipo Product do frontend
 * (trata os campos JSON que ficam como string no SQLite)
 */
export function mapProductFromDb(dbProduct: any) {
  return {
    ...dbProduct,
    sizesAvailable: parseJsonField<string[]>(dbProduct.sizesAvailable, []),
    images: parseJsonField<string[]>(dbProduct.images, []),
  }
}

/**
 * Verifica se usuário é admin
 */
export function isAdmin(role?: string | null): boolean {
  return role === 'admin'
}
```

---

*Story 006 | Sprint 1 | Gabinete FC*
