# Story 003 — Variáveis de Ambiente e Validação com Zod

**Epic:** EPIC-01 (Infraestrutura)
**Sprint:** Sprint 1
**Referência:** US-01.3
**Agente:** @dev
**SP:** 3
**Status:** [ ] Não iniciado

---

## Objetivo

Criar o sistema de gestão de variáveis de ambiente com validação Zod em runtime. Qualquer variável obrigatória ausente causa erro claro no startup, antes de qualquer requisição ser processada.

---

## Tarefas

- [ ] 1. Criar `.env.example` com todas as variáveis
- [ ] 2. Criar `src/lib/env.ts` com validação Zod
- [ ] 3. Importar `env` no `next.config.js` para validar no build
- [ ] 4. Documentar como obter cada credencial

---

## Implementação

### 1. Arquivo .env.example (commitar este, nunca o .env real)

```bash
# ─── BANCO DE DADOS ─────────────────────────────────────
# Dev local: SQLite
DATABASE_URL="file:./dev.db"
# Produção Railway PostgreSQL:
# DATABASE_URL="postgresql://USER:PASS@HOST:PORT/DATABASE"

# ─── NEXTAUTH ────────────────────────────────────────────
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="[gerar com: openssl rand -base64 32]"

# ─── GOOGLE OAUTH ────────────────────────────────────────
GOOGLE_CLIENT_ID="[console.cloud.google.com]"
GOOGLE_CLIENT_SECRET="[console.cloud.google.com]"

# ─── STRIPE ──────────────────────────────────────────────
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_[...]"
STRIPE_SECRET_KEY="sk_test_[...]"
STRIPE_WEBHOOK_SECRET="whsec_[stripe listen --print-secret]"

# ─── CORREIOS ────────────────────────────────────────────
CORREIOS_API_USERNAME="[contrato Correios]"
CORREIOS_API_PASSWORD="[contrato Correios]"

# ─── CLAUDE (BOT DE SUPORTE) ─────────────────────────────
ANTHROPIC_API_KEY="sk-ant-[...]"

# ─── EMAIL (RESEND) ──────────────────────────────────────
RESEND_API_KEY="re_[...]"
EMAIL_FROM="Gabinete FC <noreply@gabinetefc.com.br>"
ADMIN_NOTIFICATION_EMAIL="admin@gabinetefc.com.br"

# ─── URLs ────────────────────────────────────────────────
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# ─── ANALYTICS (META) ────────────────────────────────────
NEXT_PUBLIC_PIXEL_ID=""
META_ACCESS_TOKEN=""

# ─── ANALYTICS (GOOGLE) ──────────────────────────────────
NEXT_PUBLIC_GA_MEASUREMENT_ID=""

# ─── PUSH NOTIFICATIONS (VAPID) ──────────────────────────
NEXT_PUBLIC_VAPID_PUBLIC_KEY=""
VAPID_PRIVATE_KEY=""   # ← Nunca no banco! Vercel Secret em produção

# ─── SENTRY (MONITORAMENTO) ──────────────────────────────
NEXT_PUBLIC_SENTRY_DSN=""
SENTRY_AUTH_TOKEN=""

# ─── RATE LIMITING (KV) ──────────────────────────────────
# Vercel KV (Redis) — configurar no dashboard Vercel
KV_REST_API_URL=""
KV_REST_API_TOKEN=""
```

### 2. Validação com Zod — src/lib/env.ts

```typescript
// src/lib/env.ts
import { z } from 'zod'

/**
 * Variáveis de ambiente com validação Zod.
 * Erro claro em startup se algo obrigatório estiver ausente.
 */

// Schema de variáveis PRIVADAS (servidor)
const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Banco
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatório'),

  // Auth
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET deve ter pelo menos 32 caracteres'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL deve ser uma URL válida').optional(),

  // Google OAuth (opcional no dev)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Stripe (opcional até Sprint 4)
  STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),

  // Correios (opcional até Sprint 5)
  CORREIOS_API_USERNAME: z.string().optional(),
  CORREIOS_API_PASSWORD: z.string().optional(),

  // Claude (opcional até Sprint 5)
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-').optional(),

  // Email (opcional até Sprint 5)
  RESEND_API_KEY: z.string().startsWith('re_').optional(),
  EMAIL_FROM: z.string().optional().default('Gabinete FC <noreply@gabinetefc.com.br>'),
  ADMIN_NOTIFICATION_EMAIL: z.string().email().optional(),

  // Meta CAPI (opcional até Sprint 11)
  META_ACCESS_TOKEN: z.string().optional(),

  // Push (opcional até Sprint 15)
  VAPID_PRIVATE_KEY: z.string().optional(),
})

// Schema de variáveis PÚBLICAS (client)
const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().optional().default('http://localhost:3000'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_').optional(),
  NEXT_PUBLIC_PIXEL_ID: z.string().optional(),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
})

// Validação das variáveis de servidor (somente no servidor)
const _serverEnv = (() => {
  // Não executar no browser
  if (typeof window !== 'undefined') return {} as z.infer<typeof serverSchema>

  const result = serverSchema.safeParse(process.env)

  if (!result.success) {
    console.error('❌ Variáveis de ambiente inválidas:')
    console.error(result.error.flatten().fieldErrors)
    throw new Error('Variáveis de ambiente inválidas. Verifique o .env')
  }

  return result.data
})()

// Validação das variáveis de cliente
const _clientEnv = (() => {
  const result = clientSchema.safeParse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_PIXEL_ID: process.env.NEXT_PUBLIC_PIXEL_ID,
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  })

  if (!result.success) {
    console.error('❌ Variáveis públicas inválidas:', result.error.flatten())
    throw new Error('Variáveis públicas inválidas.')
  }

  return result.data
})()

export const env = {
  ..._serverEnv,
  ..._clientEnv,
} as z.infer<typeof serverSchema> & z.infer<typeof clientSchema>
```

### 3. Importar env no next.config.ts (valida no build)

```typescript
// next.config.ts
import type { NextConfig } from 'next'

// Valida env vars no build — falha cedo se algo estiver errado
import './src/lib/env'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'uploadthing.com' },
      { protocol: 'https', hostname: 'utfs.io' },
      // Adicionar Railway CDN aqui se usar
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'gabinetefc.com.br'],
    },
  },
}

export default nextConfig
```

### 4. .gitignore atualizado

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Next.js
.next/
out/

# Prisma
prisma/dev.db
prisma/dev.db-journal

# Environment Variables — NUNCA commitar
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Commitar apenas o exemplo:
# .env.example ← manter fora do .gitignore

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
```

---

## Critérios de Aceitação

- [ ] `.env.example` commitado no repositório com todas as variáveis listadas
- [ ] `.env` no `.gitignore` (verificar com `git status` que não aparece)
- [ ] `src/lib/env.ts` importável em Server Components sem erros
- [ ] Se remover `DATABASE_URL` do `.env`, `npm run dev` falha com mensagem clara
- [ ] Variáveis `NEXT_PUBLIC_*` acessíveis no browser
- [ ] Variáveis sem prefixo `NEXT_PUBLIC_` lançam erro se importadas em `'use client'`

---

## Arquivos criados/modificados

- [ ] `.env.example`
- [ ] `.env` (local, não commitado)
- [ ] `src/lib/env.ts`
- [ ] `next.config.ts`
- [ ] `.gitignore`

---

*Story 003 | Sprint 1 | Gabinete FC*
