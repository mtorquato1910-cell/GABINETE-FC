# ADR-002 — Railway + Prisma como Camada de Dados (em vez de Supabase)

**Status:** Aceito
**Data:** 2026-04-16
**Autor:** @architect

---

## Contexto

O projeto Gabinete FC necessita de uma camada de persistência para armazenar produtos, pedidos, usuários, sessões e configurações. A decisão inicial do PRD apontava para Supabase como solução de banco de dados. No entanto, após análise técnica da stack definida e dos requisitos do projeto, foi necessário reavaliar essa escolha.

Os critérios de avaliação foram:

1. **Custo:** Projeto bootstrap com orçamento limitado; free tiers são críticos.
2. **DX local:** Fluidez no desenvolvimento sem dependência de serviços externos.
3. **Type safety:** Tipagem end-to-end entre schema do banco e código TypeScript.
4. **Vendor lock-in:** Risco de dependência irreversível de plataforma específica.
5. **Complexidade operacional:** Overhead de configuração e manutenção.
6. **Compatibilidade com Next.js App Router:** Row Level Security e realtime do Supabase têm fricções com Server Components.

---

## Decisão

**Adotar Prisma 5 como ORM com SQLite em desenvolvimento local e PostgreSQL no Railway para produção.**

A estratégia de banco de dados será:

- **Desenvolvimento:** SQLite via `file:./dev.db` — zero configuração, sem Docker obrigatório, banco portável no repositório (apenas o arquivo `.db` no `.gitignore`).
- **Produção:** PostgreSQL no Railway — instância gerenciada, backups automáticos, `DATABASE_URL` via variável de ambiente.
- **ORM:** Prisma 5.22.0 com `provider` configurado via variável de ambiente (`DATABASE_URL` define o provider automaticamente).

O schema Prisma é a fonte única de verdade para o modelo de dados. Migrações são gerenciadas via `prisma migrate dev` (local) e `prisma migrate deploy` (CI/CD no Railway).

---

## Consequências

### Positivas

**Desenvolvimento completamente offline:** SQLite não requer conexão de rede, containers Docker ou credenciais de serviço externo. Um desenvolvedor pode clonar o repositório e rodar `npm run dev` imediatamente.

**Type safety end-to-end:** O Prisma Client gerado a partir do `schema.prisma` fornece tipos TypeScript precisos para todas as queries. Não há necessidade de definir interfaces manualmente — o schema é a fonte de verdade.

```typescript
// Tipos inferidos automaticamente pelo Prisma Client
const produto = await prisma.produto.findUnique({
  where: { id },
  include: { imagens: true, variantes: true },
});
// produto: Produto & { imagens: Imagem[]; variantes: Variante[] } | null
```

**Sem vendor lock-in:** Prisma é agnóstico de banco de dados. A migração de Railway para AWS RDS, PlanetScale, Neon ou qualquer outro PostgreSQL exige apenas alterar a `DATABASE_URL`. Não há código específico de plataforma no codebase.

**Migrações versionadas em Git:** Cada `prisma migrate dev` gera arquivos SQL em `prisma/migrations/` que são commitados no repositório, garantindo rastreabilidade completa do histórico do schema.

**Railway free tier generoso:** O plano Hobby do Railway oferece $5/mês em créditos gratuitos — suficiente para a fase inicial do projeto. PostgreSQL no Railway inclui conexão SSL, backups diários e métricas básicas.

**Compatibilidade total com App Router:** Prisma Client é chamado diretamente em Server Components e Server Actions sem adaptadores ou wrappers adicionais.

### Negativas / Trade-offs

**Diferenças SQLite vs PostgreSQL:** Alguns tipos e comportamentos diferem entre os dois bancos. Exemplos: `DateTime` com timezone, `Decimal` precision, `Json` fields, full-text search. O time deve testar funcionalidades críticas em PostgreSQL antes do deploy.

**Sem realtime out-of-the-box:** Diferente do Supabase, não há subscriptions realtime. Para o escopo atual do projeto (e-commerce), isso não é necessário. Se futuramente necessário, pode-se integrar WebSockets com Ably ou Pusher.

**Sem autenticação integrada:** O Supabase oferece auth integrado ao banco via RLS. Com esta stack, a autenticação é responsabilidade do NextAuth (ADR-003), mantendo separação de responsabilidades mas exigindo configuração adicional.

**Connection pooling em produção:** Ambientes serverless (Vercel) criam muitas conexões simultâneas ao banco. Será necessário usar Prisma Accelerate ou `pgBouncer` do Railway para connection pooling. Configuração via `DATABASE_URL` com `?pgbouncer=true&connection_limit=1`.

---

## Modelo de Dados — Entidades Principais

```prisma
// Estrutura de alto nível do schema.prisma
model Usuario {
  id        String   @id @default(cuid())
  email     String   @unique
  nome      String?
  pedidos   Pedido[]
  createdAt DateTime @default(now())
}

model Produto {
  id        String     @id @default(cuid())
  slug      String     @unique
  nome      String
  preco     Decimal    @db.Decimal(10, 2)
  variantes Variante[]
  imagens   Imagem[]
}

model Pedido {
  id        String      @id @default(cuid())
  usuarioId String?
  status    StatusPedido
  total     Decimal     @db.Decimal(10, 2)
  itens     ItemPedido[]
  stripeId  String?     @unique
}
```

---

## Configuração de Ambiente

```env
# .env (desenvolvimento local)
DATABASE_URL="file:./prisma/dev.db"

# .env.production (Railway)
DATABASE_URL="postgresql://user:password@host:5432/gabinetefc?schema=public&connection_limit=1&pgbouncer=true"
```

---

## Alternativas Consideradas

### Supabase (opção original do PRD)

- **Prós:** Auth + DB + Storage em uma plataforma, interface visual de administração, RLS declarativo, realtime built-in.
- **Contras:** Vendor lock-in significativo (auth, RLS, Storage têm APIs proprietárias), desenvolvimento local requer Supabase CLI com Docker, fricções com Server Components do Next.js (o `supabase-js` foi projetado para client-side), free tier limitado a 2 projetos com pausa após inatividade de 1 semana. A RLS declarativa dificulta debug de permissões complexas.
- **Decisão:** Descartado em favor de maior controle e melhor DX local.

### Drizzle ORM + Neon Serverless PostgreSQL

- **Prós:** ORM mais leve, sintaxe SQL-like, Neon oferece serverless PostgreSQL com branching de banco.
- **Contras:** Drizzle é mais novo com ecossistema menor, documentação menos madura que Prisma. Neon serverless tem latência de cold start. A equipe tem maior familiaridade com Prisma.
- **Decisão:** Descartado. Prisma oferece melhor suporte, tooling maduro (Prisma Studio) e maior adoção.

### Mongoose + MongoDB Atlas

- **Prós:** Schema flexível, Atlas free tier generoso.
- **Contras:** Banco NoSQL inadequado para dados relacionais de e-commerce (produtos-variantes-pedidos-itens), falta de joins nativos, transações ACID menos robustas.
- **Decisão:** Descartado. A natureza relacional dos dados de e-commerce favorece SQL.

### PlanetScale (MySQL serverless)

- **Prós:** Branching de banco de dados, plataforma developer-friendly.
- **Contras:** PlanetScale encerrou o plano gratuito em 2024, tornando-o inviável para estágio bootstrap.
- **Decisão:** Descartado por razões de custo.

---

## Referências

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma with Next.js App Router](https://www.prisma.io/docs/guides/nextjs)
- [Railway PostgreSQL](https://docs.railway.app/databases/postgresql)
- [Prisma Connection Pooling](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
