// Util puro de cálculo de parcelamento — sem dependências React/Prisma.
// Regras Gabinete FC (Sprint 4):
//   • 1x à vista
//   • 2x e 3x SEM juros (sempre)
//   • Se carrinho tem 3+ camisas: 4x e 5x SEM juros liberados
//   • Acima disso (ou se <3 itens e parcelas > 3): juros de MONTHLY_RATE a.m.

export const MONTHLY_RATE = 0.0299 // 2.99% a.m.
export const MAX_INSTALLMENTS = 10
export const FREE_INSTALLMENTS_BASE = 3
export const FREE_INSTALLMENTS_BOOSTED = 5
export const BOOST_ITEM_THRESHOLD = 3

export interface InstallmentOption {
  count: number
  monthly: number
  total: number
  hasInterest: boolean
}

function pricePerInstallmentWithInterest(total: number, count: number, monthlyRate: number): number {
  if (count <= 1) return total
  // Tabela Price: PMT = PV * i / (1 - (1+i)^-n)
  return (total * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -count))
}

export function calculateInstallments(
  total: number,
  itemCount: number,
  options: { maxInstallments?: number; monthlyRate?: number } = {}
): InstallmentOption[] {
  const max = options.maxInstallments ?? MAX_INSTALLMENTS
  const rate = options.monthlyRate ?? MONTHLY_RATE
  const freeCap =
    itemCount >= BOOST_ITEM_THRESHOLD ? FREE_INSTALLMENTS_BOOSTED : FREE_INSTALLMENTS_BASE

  const out: InstallmentOption[] = []
  for (let n = 1; n <= max; n++) {
    if (n === 1) {
      out.push({ count: 1, monthly: total, total, hasInterest: false })
      continue
    }
    if (n <= freeCap) {
      out.push({
        count: n,
        monthly: total / n,
        total,
        hasInterest: false,
      })
    } else {
      const monthly = pricePerInstallmentWithInterest(total, n, rate)
      out.push({
        count: n,
        monthly,
        total: monthly * n,
        hasInterest: true,
      })
    }
  }
  return out
}

// Para o Stripe — quantidade máxima de parcelas SEM juros disponíveis dado um carrinho
export function maxFreeInstallments(itemCount: number): number {
  return itemCount >= BOOST_ITEM_THRESHOLD ? FREE_INSTALLMENTS_BOOSTED : FREE_INSTALLMENTS_BASE
}
