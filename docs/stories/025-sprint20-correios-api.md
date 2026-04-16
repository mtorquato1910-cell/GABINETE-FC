# Story 025 — Sprint 20: Integração API Correios Real

**Status:** Concluído — 2026-04-16
**Sprint:** 20
**Agente:** @dev
**Prioridade:** Média (frete)

## Objetivo

Substituir o stub de cálculo de frete dos Correios por integração real com a API CWS (Correios Web Services), incluindo cálculo de PAC, SEDEX e rastreamento de encomendas.

## Acceptance Criteria

- [x] Cálculo de frete real para PAC e SEDEX usando API CWS
- [x] Rastreamento de encomenda por código de rastreio
- [x] CEP de origem configurável via variável de ambiente
- [x] Fallback para frete fixo se API indisponível
- [x] Cache de consultas de CEP para evitar rate limiting

## Dependências

```
npm install axios  # ou usar fetch nativo
```

## Variáveis de Ambiente Necessárias

```env
CORREIOS_CWS_TOKEN=...              # Token CWS dos Correios
CORREIOS_CNPJ=...                    # CNPJ do contrato
CORREIOS_CEP_ORIGEM=01310100        # CEP da loja
```

## Tasks

- [x] Obter credenciais na API CWS: https://cws.correios.com.br
- [x] Atualizar `src/lib/actions/correios.ts` com chamadas reais à API
- [x] Implementar autenticação OAuth2 da CWS (token Bearer)
- [x] Implementar `calcularFrete(cepDestino, produtos)` real
- [x] Implementar `rastrearEncomenda(codigoRastreio)` real
- [x] Adicionar cache com `unstable_cache` do Next.js para consultas de CEP
- [x] Adicionar as variáveis em `src/env.ts`

## Endpoints CWS

```
POST https://cws.correios.com.br/v1/precos/preco
GET  https://cws.correios.com.br/v1/rastreamento/objetos/{codigo}
```

## Código de Referência

```typescript
// Autenticação CWS
const tokenResponse = await fetch('https://cws.correios.com.br/v1/token', {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${Buffer.from(`${cnpj}:${token}`).toString('base64')}`,
    'Content-Type': 'application/json',
  }
})
const { token: bearerToken } = await tokenResponse.json()

// Calcular frete
const response = await fetch('https://cws.correios.com.br/v1/precos/preco', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${bearerToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    idLote: '1',
    parametros: [{
      cepDestino: cepDestino,
      cepOrigem: process.env.CORREIOS_CEP_ORIGEM,
      psObjeto: peso,          // em gramas
      tpObjeto: '2',           // pacote
      comprimento: comprimento,
      largura: largura,
      altura: altura,
      servicosAdicionais: [],
      vlDeclarado: valorDeclarado,
    }]
  })
})
```

## File List

- `src/lib/actions/correios.ts` (modificar)
- `src/env.ts` (adicionar variáveis)
