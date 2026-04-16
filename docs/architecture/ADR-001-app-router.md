# ADR-001 — Next.js App Router como Camada de Roteamento

**Status:** Aceito
**Data:** 2026-04-16
**Autor:** @architect

---

## Contexto

O projeto Gabinete FC é uma plataforma de e-commerce de dropshipping de camisetas de futebol. A escolha da estratégia de roteamento do Next.js é uma das decisões mais fundamentais da arquitetura, pois afeta diretamente:

- A forma como páginas e layouts são compostos
- A estratégia de renderização (SSR, SSG, ISR, CSR)
- A forma como dados são buscados no servidor
- A segurança de operações sensíveis (checkout, autenticação)
- A experiência do desenvolvedor (DX) ao longo do projeto

O Next.js oferece dois sistemas de roteamento: o **Pages Router** (legado, disponível desde v9) e o **App Router** (estável desde Next.js 13.4, padrão no 14+). A equipe precisa definir qual deles adotar para o Sprint 0 e manter consistência ao longo de todo o desenvolvimento.

---

## Decisão

**Adotar o App Router do Next.js como sistema de roteamento único e exclusivo do projeto.**

Toda a aplicação será construída sob o diretório `app/`, seguindo as convenções do App Router: `layout.tsx`, `page.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx` e `route.ts` para API handlers.

---

## Consequências

### Positivas

**Server Components por padrão:** Todos os componentes são React Server Components (RSC) por default. Isso significa que o fetch de dados e a lógica de negócio ocorrem no servidor, sem expor chaves de API ao cliente. Componentes de UI interativos são marcados explicitamente com `"use client"`.

**Server Actions para mutações:** Operações como adicionar ao carrinho, processar checkout e gerenciar pedidos podem ser implementadas como Server Actions (`"use server"`), eliminando a necessidade de criar rotas de API intermediárias para a maioria dos casos de uso. Isso reduz a superfície de ataque e simplifica o código.

**SSR nativo e granular:** Cada segmento de rota pode ter sua própria estratégia de cache e revalidação via `fetch` com opções como `{ next: { revalidate: 3600 } }` ou `{ cache: 'no-store' }`. Páginas de produto podem ser ISR (revalidação horária), enquanto páginas de checkout são sempre dinâmicas.

**Layouts aninhados:** O sistema de layouts hierárquicos (`app/layout.tsx` → `app/(shop)/layout.tsx` → `app/(shop)/produto/layout.tsx`) permite reutilizar estruturas como header, footer e sidebars sem re-renderização, melhorando a performance percebida e o Core Web Vitals.

**Streaming e Suspense:** Integração nativa com React Suspense permite streaming incremental de HTML, melhorando o TTFB (Time to First Byte) em páginas com múltiplas fontes de dados assíncronas.

**Middleware de autenticação:** O middleware do Next.js (`middleware.ts`) permite proteger rotas de `/admin/*` e `/conta/*` antes de qualquer renderização, integrando diretamente com NextAuth v5.

### Negativas / Trade-offs

**Curva de aprendizado:** O modelo mental de Server vs. Client Components requer atenção. Erros comuns incluem usar hooks em Server Components ou tentar acessar o DOM no servidor.

**Ecossistema de bibliotecas:** Algumas bibliotecas legadas de React não são compatíveis com RSC. Todas as integrações devem ser verificadas quanto à compatibilidade com o App Router.

**Debugging mais complexo:** O stack trace de Server Actions e o comportamento de cache podem ser menos intuitivos durante o desenvolvimento comparado ao Pages Router.

---

## Alternativas Consideradas

### Pages Router (Next.js legacy)

- **Prós:** Mais maduro, ecossistema de exemplos maior, comportamento mais previsível.
- **Contras:** Não suporta Server Components, requer `getServerSideProps` / `getStaticProps` com padrões verbosos, layouts duplicados são gerenciados manualmente, sem suporte a Server Actions nativo. Não é a direção futura do Next.js.
- **Decisão:** Descartado. O Pages Router está em modo de manutenção e não receberá novos recursos.

### Remix

- **Prós:** Modelo de dados baseado em loaders/actions, excelente suporte a formulários, foco em web standards.
- **Contras:** Ecossistema menor, menor adoção no mercado brasileiro, não integra tão nativamente com Vercel quanto o Next.js. A equipe não tem experiência prévia com Remix.
- **Decisão:** Descartado. Next.js oferece melhor fit para o time e infraestrutura definida.

### SPA pura (React + Vite + Express API)

- **Prós:** Separação clara entre frontend e backend, familiar para devs React puros.
- **Contras:** SEO dependente de SSR adicional, maior complexidade de deploy e CORS, sem otimizações automáticas de imagem e fontes. Inviável para e-commerce sem SSR.
- **Decisão:** Descartado. E-commerce requer SSR para SEO de páginas de produto.

---

## Referências

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [React Server Components RFC](https://github.com/reactjs/rfcs/blob/main/text/0188-server-components.md)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
