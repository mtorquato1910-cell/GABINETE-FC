'use server'
import { z } from 'zod'
import { capiLead } from './capi'

const schema = z.object({ email: z.string().email() })

export async function subscribeNewsletter(data: unknown, clientIp?: string, userAgent?: string) {
  const parsed = schema.safeParse(data)
  if (!parsed.success) return { error: 'Email inválido' }

  const { email } = parsed.data

  // Salva em StoreSetting como flag (em produção: usar tabela subscribers)
  // Por ora, apenas dispara o CAPI Lead
  try {
    await capiLead({ email, clientIp, clientUserAgent: userAgent })
  } catch { /* non-critical */ }

  console.log('[NEWSLETTER] Novo inscrito:', email)
  return { success: true }
}

