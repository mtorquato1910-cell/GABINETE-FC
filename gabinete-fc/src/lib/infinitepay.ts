/**
 * Cliente da Infinity Pay (Checkout Integrado).
 *
 * Doc oficial: https://www.infinitepay.io/checkout-documentacao
 *
 * Autenticação: 100% via campo `handle` no body do POST. NÃO existe API key,
 * NÃO existe webhook secret. A validação de webhook é feita por callback no
 * endpoint /payment_check (defesa em camadas — ver lib do webhook).
 */

const HANDLE = process.env.INFINITEPAY_HANDLE
const API_URL = process.env.INFINITEPAY_API_URL ?? 'https://api.checkout.infinitepay.io'

const TIMEOUT_MS = 10_000
const MAX_RETRIES = 3

// ─── Helpers de conversão ────────────────────────────────────

/** Converte Reais (Float, ex: 189.90) para centavos (Int, ex: 18990). */
export function toCents(reais: number): number {
  return Math.round(reais * 100)
}

/** Converte centavos (Int, ex: 18990) para Reais (Float, ex: 189.90). */
export function fromCents(cents: number): number {
  return cents / 100
}

// ─── Tipos ───────────────────────────────────────────────────

export interface InfinitePayItem {
  /** Quantidade do item. */
  quantity: number
  /** Preço UNITÁRIO em centavos (R$ 189,90 = 18990). */
  price: number
  /** Descrição legível ("Camisa Brasil I 2026 — Tam G"). */
  description: string
}

export interface InfinitePayCustomer {
  name: string
  email: string
  /** Telefone com DDI (ex: "+5511999999999"). */
  phone_number?: string
}

export interface InfinitePayAddress {
  cep: string
  street: string
  number: string
  neighborhood: string
  complement?: string
}

export interface CreateLinkInput {
  /** ID do pedido no nosso banco (Order.id). Usado como `order_nsu`. */
  orderId: string
  items: InfinitePayItem[]
  customer: InfinitePayCustomer
  address?: InfinitePayAddress
  /** URL pra onde o cliente volta após pagar. */
  redirectUrl: string
  /** URL do nosso endpoint que recebe o webhook. */
  webhookUrl: string
}

export interface CreateLinkResult {
  /** URL do checkout hosted da Infinity Pay. Redirecionar o cliente pra cá. */
  url: string
}

export interface CheckPaymentResult {
  success: boolean
  paid: boolean
  /** Valor SOLICITADO em centavos. */
  amount: number
  /** Valor PAGO em centavos (pode incluir taxa de parcelamento). */
  paid_amount: number
  installments: number
  capture_method: 'pix' | 'credit_card' | 'debit_card' | string
}

// ─── Erros ───────────────────────────────────────────────────

export class InfinitePayError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly responseBody?: unknown,
  ) {
    super(message)
    this.name = 'InfinitePayError'
  }
}

// ─── Fetch interno com timeout ───────────────────────────────

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

function assertHandle(): string {
  if (!HANDLE) {
    throw new InfinitePayError(
      'INFINITEPAY_HANDLE não configurado no ambiente — defina em .env.local e Vercel',
    )
  }
  return HANDLE
}

// ─── createPaymentLink ────────────────────────────────────────

/**
 * Cria link de pagamento na Infinity Pay (POST /links).
 *
 * Comportamento:
 *  - Timeout de 10s
 *  - Retry exponencial até 3x para falhas de rede / 5xx (não retenta em 4xx)
 *  - Retorna apenas a URL do checkout. NÃO tenta extrair `invoice_slug` da URL —
 *    o slug autoritativo vem só pelo webhook.
 *
 * Lança `InfinitePayError` em falha definitiva.
 */
export async function createPaymentLink(input: CreateLinkInput): Promise<CreateLinkResult> {
  const handle = assertHandle()

  const body = {
    handle,
    redirect_url: input.redirectUrl,
    webhook_url: input.webhookUrl,
    order_nsu: input.orderId,
    items: input.items,
    customer: input.customer,
    ...(input.address ? { address: input.address } : {}),
  }

  let lastError: unknown
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetchWithTimeout(
        `${API_URL}/links`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
        TIMEOUT_MS,
      )

      const text = await res.text()
      let parsed: unknown
      try {
        parsed = text ? JSON.parse(text) : null
      } catch {
        parsed = text
      }

      if (!res.ok) {
        // 4xx: erro de premissa nossa — não retenta, propaga imediato
        if (res.status >= 400 && res.status < 500) {
          throw new InfinitePayError(
            `Infinity Pay rejeitou criação de link (HTTP ${res.status})`,
            res.status,
            parsed,
          )
        }
        // 5xx: erro do servidor deles — entra no retry loop
        throw new InfinitePayError(
          `Infinity Pay erro ${res.status}`,
          res.status,
          parsed,
        )
      }

      const url = (parsed as { url?: string } | null)?.url
      if (typeof url !== 'string' || !url.startsWith('http')) {
        throw new InfinitePayError(
          'Resposta da Infinity Pay sem campo `url` válido',
          res.status,
          parsed,
        )
      }

      return { url }
    } catch (err) {
      lastError = err
      // Não retenta erros 4xx (premissa errada nossa)
      if (err instanceof InfinitePayError && err.status && err.status >= 400 && err.status < 500) {
        throw err
      }
      // Último attempt: propaga
      if (attempt === MAX_RETRIES) break
      // Backoff exponencial: 500ms, 1s, 2s
      await new Promise((r) => setTimeout(r, 250 * Math.pow(2, attempt)))
    }
  }

  if (lastError instanceof InfinitePayError) throw lastError
  throw new InfinitePayError(
    `Falha ao criar link após ${MAX_RETRIES} tentativas: ${(lastError as Error)?.message ?? lastError}`,
  )
}

// ─── checkPayment (anti-fraude do webhook) ────────────────────

export interface CheckPaymentInput {
  /** ID do pedido (mesmo `order_nsu` que mandamos na criação). */
  orderId: string
  transactionNsu: string
  invoiceSlug: string
}

/**
 * Consulta status REAL do pagamento na Infinity Pay (POST /payment_check).
 *
 * USO CRÍTICO: Esta função é a DEFESA contra webhooks forjados. NUNCA marque
 * um pedido como pago sem chamar checkPayment() primeiro e validar que
 * response.paid === true E response.amount === order.total em centavos.
 *
 * Sem retry — queremos resposta autoritativa rápida pra decidir o que fazer
 * com o webhook (que precisa ser respondido em <1s).
 */
export async function checkPayment(input: CheckPaymentInput): Promise<CheckPaymentResult> {
  const handle = assertHandle()

  const res = await fetchWithTimeout(
    `${API_URL}/payment_check`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        handle,
        order_nsu: input.orderId,
        transaction_nsu: input.transactionNsu,
        slug: input.invoiceSlug,
      }),
    },
    TIMEOUT_MS,
  )

  const text = await res.text()
  let parsed: unknown
  try {
    parsed = text ? JSON.parse(text) : null
  } catch {
    parsed = text
  }

  if (!res.ok) {
    throw new InfinitePayError(
      `payment_check falhou (HTTP ${res.status})`,
      res.status,
      parsed,
    )
  }

  const result = parsed as Partial<CheckPaymentResult> | null
  if (!result || typeof result.success !== 'boolean' || typeof result.paid !== 'boolean') {
    throw new InfinitePayError('payment_check retornou shape inválido', res.status, parsed)
  }

  return {
    success: result.success,
    paid: result.paid,
    amount: typeof result.amount === 'number' ? result.amount : 0,
    paid_amount: typeof result.paid_amount === 'number' ? result.paid_amount : 0,
    installments: typeof result.installments === 'number' ? result.installments : 1,
    capture_method: typeof result.capture_method === 'string' ? result.capture_method : 'unknown',
  }
}
