// Rate limiter in-memory simples (Map LRU).
// Limitações: reseta a cada deploy/restart. Não compartilha entre instâncias serverless.
// Pra produção em escala real, migrar pra Vercel KV / Upstash Redis.

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()
const MAX_KEYS = 5000

/** Limpeza preguiçosa: quando o Map cresce demais, remove o que já expirou. */
function maybeCleanup() {
  if (buckets.size < MAX_KEYS) return
  const now = Date.now()
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key)
  }
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

/**
 * Verifica e incrementa o contador para uma chave.
 * @param key  Identificador único (ex: `analytics:1.2.3.4`)
 * @param max  Máximo de requests permitidos na janela
 * @param windowMs  Janela em milissegundos
 */
export function checkRateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  maybeCleanup()

  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt < now) {
    const resetAt = now + windowMs
    buckets.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: max - 1, resetAt }
  }

  if (bucket.count >= max) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt }
  }

  bucket.count++
  return { allowed: true, remaining: max - bucket.count, resetAt: bucket.resetAt }
}

/** Extrai o IP do cliente de headers comuns. Fallback: 'unknown'. */
export function getClientIp(headers: Headers): string {
  const xff = headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return headers.get('x-real-ip') ?? 'unknown'
}
