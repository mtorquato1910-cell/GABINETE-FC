// Util pra consultar CEP via ViaCEP (público, sem auth).
// Usado no onboarding e no checkout pra autocompletar endereço.

export interface CepResult {
  zipCode: string
  street: string
  neighborhood: string
  city: string
  state: string
}

export async function lookupCep(cep: string): Promise<CepResult | null> {
  const digits = cep.replace(/\D/g, '')
  if (digits.length !== 8) return null
  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
      cache: 'force-cache',
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data.erro) return null
    return {
      zipCode: digits,
      street: data.logradouro ?? '',
      neighborhood: data.bairro ?? '',
      city: data.localidade ?? '',
      state: data.uf ?? '',
    }
  } catch {
    return null
  }
}
