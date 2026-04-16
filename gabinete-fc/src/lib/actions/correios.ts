'use server'

export interface FreightOption {
  service: string
  serviceCode: string
  price: number
  deadline: number // dias úteis
}

// Token CWS em memória (válido por 1h)
let cwsToken: string | null = null
let cwsTokenExpiry = 0

async function getCWSToken(): Promise<string | null> {
  if (cwsToken && Date.now() < cwsTokenExpiry) return cwsToken

  const username = process.env.CORREIOS_USERNAME
  const password = process.env.CORREIOS_PASSWORD

  if (!username || !password) return null

  try {
    const res = await fetch('https://cws.correios.com.br/v1/autentica/cartaopostagem', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
      },
    })

    if (!res.ok) return null

    const data = await res.json()
    cwsToken = data.token as string
    cwsTokenExpiry = Date.now() + 55 * 60 * 1000 // 55 minutos
    return cwsToken
  } catch {
    return null
  }
}

// Fallback local baseado na região do CEP
function calculateFreightFallback(
  cep: string,
  totalWeight: number
): FreightOption[] {
  const prefix = parseInt(cep.slice(0, 2))
  const isCapital = prefix >= 1 && prefix <= 9
  const isNordeste = prefix >= 50 && prefix <= 65
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

export async function calculateFreight(
  destCep: string,
  items: Array<{ weight: number; quantity: number }>
): Promise<FreightOption[]> {
  const cep = destCep.replace(/\D/g, '')
  if (cep.length !== 8) return []

  const totalWeight = items.reduce((sum, i) => sum + i.weight * i.quantity, 0) || 0.35
  const originCep = process.env.CORREIOS_CEP_ORIGEM || '01310100'

  const token = await getCWSToken()

  if (!token) {
    // Fallback: cálculo estimado por região
    return calculateFreightFallback(cep, totalWeight)
  }

  try {
    const res = await fetch('https://cws.correios.com.br/v1/precos/preco', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        idLote: '1',
        parametros: [
          {
            cepDestino: cep,
            cepOrigem: originCep,
            psObjeto: Math.ceil(totalWeight * 1000), // gramas
            tpObjeto: '2', // pacote/caixa
            comprimento: 20,
            largura: 20,
            altura: 5,
            servicosAdicionais: [],
            vlDeclarado: 0,
          },
        ],
      }),
    })

    if (!res.ok) {
      return calculateFreightFallback(cep, totalWeight)
    }

    const data = await res.json()
    const parametros = data?.parametros?.[0]

    if (!parametros) return calculateFreightFallback(cep, totalWeight)

    const results: FreightOption[] = []

    // PAC
    if (parametros.pac) {
      results.push({
        service: 'PAC',
        serviceCode: '04510',
        price: parseFloat(parametros.pac.pcFinal || '0'),
        deadline: parseInt(parametros.pac.prazoEntrega || '7'),
      })
    }

    // SEDEX
    if (parametros.sedex) {
      results.push({
        service: 'SEDEX',
        serviceCode: '04014',
        price: parseFloat(parametros.sedex.pcFinal || '0'),
        deadline: parseInt(parametros.sedex.prazoEntrega || '3'),
      })
    }

    return results.length > 0 ? results : calculateFreightFallback(cep, totalWeight)
  } catch {
    return calculateFreightFallback(cep, totalWeight)
  }
}

export async function trackPackage(trackingCode: string) {
  const token = await getCWSToken()

  if (!token) {
    return {
      code: trackingCode,
      status: 'Em trânsito',
      events: [
        { date: new Date().toISOString(), description: 'Rastreamento não disponível — configure CORREIOS_USERNAME e CORREIOS_PASSWORD', location: '' },
      ],
    }
  }

  try {
    const res = await fetch(
      `https://cws.correios.com.br/v1/rastreamento/objetos/${trackingCode}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )

    if (!res.ok) throw new Error('API indisponível')

    const data = await res.json()
    const objeto = data?.objetos?.[0]

    return {
      code: trackingCode,
      status: objeto?.situacao || 'Em trânsito',
      events: (objeto?.eventos || []).map((ev: { dtHrCriado: string; descricao: string; unidade?: { endereco?: { cidade?: string; uf?: string } } }) => ({
        date: ev.dtHrCriado,
        description: ev.descricao,
        location: ev.unidade?.endereco
          ? `${ev.unidade.endereco.cidade}/${ev.unidade.endereco.uf}`
          : '',
      })),
    }
  } catch {
    return {
      code: trackingCode,
      status: 'Em trânsito',
      events: [
        { date: new Date().toISOString(), description: 'Objeto postado', location: 'Brasil' },
      ],
    }
  }
}
