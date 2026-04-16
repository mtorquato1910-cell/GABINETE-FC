# Story 027 — Sprint 22: Meta Conversions API (CAPI) Real

**Status:** Aguardando Access Token
**Sprint:** 22
**Agente:** @dev
**Prioridade:** Média (marketing)

## Objetivo

Substituir o stub da Meta Conversions API (CAPI) por envio real de eventos server-side ao Meta. Isso garante rastreamento mesmo com bloqueadores de anúncios e iOS privacy changes.

## Acceptance Criteria

- [ ] Eventos enviados ao endpoint real da Meta Graph API
- [ ] Deduplicação correta com eventos client-side (eventId compartilhado)
- [ ] Eventos: Purchase, AddToCart, InitiateCheckout, ViewContent, Lead
- [ ] Hash SHA-256 do email do usuário (PII)
- [ ] IP e User-Agent enviados para melhor correspondência

## Dependências

Nenhuma — usa `fetch` nativo da Meta Graph API.

## Variáveis de Ambiente Necessárias

```env
META_PIXEL_ID=...                    # ID do seu Pixel Meta
META_CAPI_ACCESS_TOKEN=...           # Token de acesso do Sistema/Meta Events Manager
```

## Como Obter o Access Token

1. Acesse Meta Events Manager → Configurações de origem de dados
2. Selecione seu Pixel → Aba "API de Conversões"
3. Gere um novo Access Token (ou use um token de sistema no Business Manager)

## Tasks

- [ ] Adicionar `META_CAPI_ACCESS_TOKEN` em `src/env.ts`
- [ ] Atualizar `src/lib/actions/capi.ts` com envio real
- [ ] Implementar hash SHA-256 do email (obrigatório pela Meta)
- [ ] Testar eventos no Meta Events Manager → Ferramenta de Teste de Eventos
- [ ] Verificar deduplicação com `eventId` nos eventos client + server

## Código de Referência

```typescript
// src/lib/actions/capi.ts
import crypto from 'crypto'

function hashSHA256(value: string): string {
  return crypto.createHash('sha256').update(value.toLowerCase().trim()).digest('hex')
}

export async function sendCAPIEvent(event: CAPIEvent) {
  const pixelId = process.env.META_PIXEL_ID
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN

  if (!pixelId || !accessToken) {
    console.warn('Meta CAPI não configurado')
    return { success: false }
  }

  const payload = {
    data: [{
      event_name: event.eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: event.eventId,
      event_source_url: event.sourceUrl,
      action_source: 'website',
      user_data: {
        em: event.email ? [hashSHA256(event.email)] : undefined,
        client_ip_address: event.ip,
        client_user_agent: event.userAgent,
        fbc: event.fbc,
        fbp: event.fbp,
      },
      custom_data: event.customData,
    }],
    test_event_code: process.env.NODE_ENV !== 'production' ? 'TEST12345' : undefined,
  }

  const response = await fetch(
    `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  )

  return response.json()
}
```

## File List

- `src/lib/actions/capi.ts` (modificar)
- `src/env.ts` (adicionar META_CAPI_ACCESS_TOKEN)
