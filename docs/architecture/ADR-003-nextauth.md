# ADR-003 — NextAuth v5 como Solução de Autenticação

**Status:** Aceito
**Data:** 2026-04-16
**Autor:** @architect

---

## Contexto

O Gabinete FC necessita de autenticação para dois contextos distintos:

1. **Clientes:** Cadastro e login para acompanhamento de pedidos, histórico de compras e gestão de endereços. O login com Google OAuth reduz atrito no onboarding.
2. **Administradores:** Acesso ao painel `/admin` para gerenciar produtos, pedidos e configurações. Requer autenticação por credenciais (e-mail + senha) com proteção de rota rigorosa.

Os requisitos técnicos são:
- Integração nativa com Next.js App Router e middleware
- Suporte a OAuth (Google) e Credentials provider
- Sessões JWT stateless (sem tabela de sessões obrigatória no banco)
- Sem dependência de serviço de autenticação externo pago
- Proteção de rotas server-side via middleware antes de qualquer renderização

---

## Decisão

**Adotar NextAuth.js v5 (beta.31) como solução de autenticação.**

A configuração central será em `auth.ts` na raiz do projeto, exportando handlers HTTP, helpers de sessão e o middleware de proteção de rotas. O projeto utilizará dois providers:

1. **Google OAuth:** Para login de clientes via conta Google.
2. **Credentials:** Para login de administradores com e-mail e senha hasheada (bcrypt).

As sessões serão JWT por padrão, com estratégia `strategy: "jwt"` no NextAuth config. O `middleware.ts` na raiz interceptará todas as rotas protegidas antes de qualquer renderização no servidor.

---

## Consequências

### Positivas

**Integração nativa com Next.js:** NextAuth v5 foi reescrito para o App Router. O `auth()` helper funciona em Server Components, Server Actions, Route Handlers e middleware sem adapters especiais.

```typescript
// Server Component — acesso direto à sessão
import { auth } from "@/auth";

export default async function ContaPage() {
  const session = await auth();
  if (!session) redirect("/login");
  return <div>Bem-vindo, {session.user.name}</div>;
}
```

**Middleware de proteção centralizado:** Um único arquivo `middleware.ts` protege todas as rotas sensíveis antes do processamento da requisição, sem vazamento de dados.

```typescript
// middleware.ts
export { auth as middleware } from "@/auth";

export const config = {
  matcher: ["/admin/:path*", "/conta/:path*", "/checkout/:path*"],
};
```

**Callbacks para controle granular:** Os callbacks `jwt` e `session` permitem enriquecer o token com dados do Prisma (role, id do usuário) sem queries adicionais nas rotas protegidas.

```typescript
callbacks: {
  jwt({ token, user }) {
    if (user) {
      token.role = user.role; // "admin" | "cliente"
      token.userId = user.id;
    }
    return token;
  },
  session({ session, token }) {
    session.user.role = token.role;
    session.user.id = token.userId;
    return session;
  },
}
```

**Zero dependências de serviço externo:** A autenticação é completamente self-hosted. Não há cobrança por MAU (Monthly Active Users), sem limites de usuários e sem risco de mudança de pricing.

**CSRF protection built-in:** NextAuth gerencia tokens CSRF automaticamente para todas as operações de sign-in/sign-out via POST.

### Negativas / Trade-offs

**Status beta:** NextAuth v5 está em beta. APIs podem sofrer breaking changes antes da versão estável. A equipe deve monitorar o changelog e fixar a versão exata no `package.json` (`"next-auth": "5.0.0-beta.31"`).

**Credentials provider e segurança:** O uso do Credentials provider exige cuidado redobrado com hashing de senhas (`bcryptjs`), rate limiting no endpoint de login e proteção contra brute force. Nenhum desses controles vem built-in — são responsabilidade da implementação.

**Gestão de tokens OAuth:** Refresh tokens do Google exigem configuração adicional se a sessão precisar durar mais de 1 hora. Para o escopo atual, tokens de acesso de curta duração são suficientes.

**Tipagem com TypeScript strict:** A extensão do tipo `Session` para incluir campos customizados (`role`, `id`) requer augmentation do módulo `next-auth`. Necessário adicionar em `types/next-auth.d.ts`.

---

## Configuração de Referência

```typescript
// auth.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      async authorize(credentials) {
        const user = await prisma.usuario.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user?.senhaHash) return null;
        const valid = await bcrypt.compare(
          credentials.password as string,
          user.senhaHash
        );
        return valid ? user : null;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = (user as any).role;
      return token;
    },
    session({ session, token }) {
      session.user.role = token.role as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
```

---

## Alternativas Consideradas

### Clerk

- **Prós:** UI de autenticação pronta, gestão de usuários visual, sem configuração de OAuth manual, excelente DX.
- **Contras:** Serviço pago com pricing por MAU ($25/mês após 10k MAU), vendor lock-in total (usuários ficam na plataforma Clerk), sem suporte a self-hosting. Dados de autenticação fora do controle do projeto.
- **Decisão:** Descartado por custo e vendor lock-in.

### Auth.js (versão genérica, sem Next.js)

- **Prós:** Agnóstico de framework.
- **Contras:** NextAuth v5 já é Auth.js com bindings para Next.js. Usar a versão genérica adicionaria boilerplate sem benefícios.
- **Decisão:** Não aplicável — NextAuth v5 é a implementação Next.js do Auth.js.

### Lucia Auth

- **Prós:** Biblioteca de auth muito leve, sem magic, controle total do fluxo.
- **Contras:** Requer implementação manual de OAuth flows, gestão de sessões e muito mais boilerplate. Menor ecossistema que NextAuth.
- **Decisão:** Descartado. O benefício de "sem magic" gera sobrecarga de implementação desnecessária para os requisitos atuais.

### Supabase Auth

- **Prós:** Integrado ao Supabase DB (opção original do PRD).
- **Contras:** Descartado junto com o Supabase DB (ADR-002). RLS baseado em `auth.uid()` não funciona com Prisma. Migraria dados de auth para fora do controle do projeto.
- **Decisão:** Descartado — consequência direta da ADR-002.

---

## Variáveis de Ambiente Necessárias

```env
# OAuth Google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# NextAuth
AUTH_SECRET=             # openssl rand -base64 32
AUTH_URL=                # https://gabinete-fc.vercel.app (produção)

# Desenvolvimento
NEXTAUTH_URL=http://localhost:3000
```

---

## Referências

- [NextAuth.js v5 Documentation](https://authjs.dev)
- [NextAuth v5 Migration Guide](https://authjs.dev/getting-started/migrating-to-v5)
- [NextAuth with Prisma Adapter](https://authjs.dev/getting-started/adapters/prisma)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
