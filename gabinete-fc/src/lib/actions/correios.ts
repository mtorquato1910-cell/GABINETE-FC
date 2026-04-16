'use server'

export interface FreightOption {
  service: string
  serviceCode: string
  price: number
  deadline: number // dias úteis
}

// Stub do cálculo de frete dos Correios
// TODO Sprint 5: Integrar com API real dos Correios (https://cws.correios.com.br)
export async function calculateFreight(
  destCep: string,
  items: Array<{ weight: number; quantity: number }>
): Promise<FreightOption[]> {
  // Limpa CEP
  const cep = destCep.replace(/\D/g, '')
  if (cep.length !== 8) return []

  // Peso total em kg (estimativa: 350g por camisa)
  const totalWeight = items.reduce((sum, i) => sum + i.weight * i.quantity, 0) || 0.35

  // Simula frete baseado na região (por prefixo de CEP)
  const prefix = parseInt(cep.slice(0, 2))

  // SP capital (01-09) = mais barato
  const isCapital = prefix >= 1 && prefix <= 9
  // Nordeste (50-65) = mais caro
  const isNordeste = prefix >= 50 && prefix <= 65
  // Norte (66-69) = mais caro ainda
  const isNorte = prefix >= 66 && prefix <= 69

  const basePrice = isCapital ? 15 : isNordeste ? 28 : isNorte ? 35 : 22
  const extraPerKg = totalWeight > 1 ? (totalWeight - 1) * 3 : 0

  return [
    {
      service: 'PAC',
      serviceCode: '04510',
      price: parseFloat((basePrice + extraPerKg).toFixed(2)),
      deadline: isCapital ? 5 : isNordeste ? 10 : isNorte ? 14 : 7,
    },
    {
      service: 'SEDEX',
      serviceCode: '04014',
      price: parseFloat(((basePrice + extraPerKg) * 2.2).toFixed(2)),
      deadline: isCapital ? 1 : isNordeste ? 4 : isNorte ? 6 : 3,
    },
  ]
}

// Stub de rastreamento
// TODO Sprint 5: Integrar com API real
export async function trackPackage(trackingCode: string) {
  return {
    code: trackingCode,
    status: 'Em trânsito',
    events: [
      { date: new Date().toISOString(), description: 'Objeto postado', location: 'São Paulo/SP' },
    ],
  }
}
