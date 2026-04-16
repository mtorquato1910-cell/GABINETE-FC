import { z } from 'zod'

// Schema de variáveis PRIVADAS (servidor)
const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatório'),

  NEXTAUTH_SECRET: z.string().min(10, 'NEXTAUTH_SECRET deve ter pelo menos 10 caracteres'),
  NEXTAUTH_URL: z.string().url().optional(),

  // OAuth (opcional em dev)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Stripe (Sprint 4)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Correios (Sprint 5)
  CORREIOS_USERNAME: z.string().optional(),
  CORREIOS_PASSWORD: z.string().optional(),

  // Claude (Sprint 5)
  ANTHROPIC_API_KEY: z.string().optional(),

  // Email Resend (Sprint 5)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional().default('Gabinete FC <noreply@gabinetefc.com.br>'),

  // Push VAPID (Sprint 15)
  VAPID_PRIVATE_KEY: z.string().optional(),
})

// Schema de variáveis PÚBLICAS (client)
const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().optional().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_NAME: z.string().optional().default('Gabinete FC'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
})

// Validação server-side
const _serverEnv = (() => {
  if (typeof window !== 'undefined') return {} as z.infer<typeof serverSchema>

  const result = serverSchema.safeParse(process.env)

  if (!result.success) {
    console.error('❌ Variáveis de ambiente inválidas:')
    console.error(result.error.flatten().fieldErrors)
    throw new Error('Variáveis de ambiente inválidas. Verifique o .env')
  }

  return result.data
})()

// Validação client-side
const _clientEnv = (() => {
  const result = clientSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  })

  if (!result.success) {
    console.error('❌ Variáveis públicas inválidas:', result.error.flatten())
  }

  return result.data ?? {}
})()

export const env = {
  ..._serverEnv,
  ..._clientEnv,
} as z.infer<typeof serverSchema> & z.infer<typeof clientSchema>
