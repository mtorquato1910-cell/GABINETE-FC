'use server'
import crypto from 'crypto'

// Hashes SHA-256 de dados PII para CAPI
function sha256(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

interface CAPIEvent {
  eventName: string
  eventId: string
  eventTime: number
  userData: {
    email?: string
    phone?: string
    firstName?: string
    clientIpAddress?: string
    clientUserAgent?: string
  }
  customData?: Record<string, unknown>
  eventSourceUrl?: string
}

export async function sendCAPIEvent(event: CAPIEvent) {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
  const accessToken = process.env.META_ACCESS_TOKEN

  if (!pixelId || !accessToken) {
    console.log('[CAPI STUB] Pixel ou Access Token não configurado:', event.eventName)
    return { success: true, stub: true }
  }

  const hashedUserData: Record<string, string | string[]> = {}
  if (event.userData.email) hashedUserData.em = [sha256(event.userData.email)]
  if (event.userData.phone) hashedUserData.ph = [sha256(event.userData.phone.replace(/\D/g, ''))]
  if (event.userData.firstName) hashedUserData.fn = [sha256(event.userData.firstName)]
  if (event.userData.clientIpAddress) hashedUserData.client_ip_address = event.userData.clientIpAddress
  if (event.userData.clientUserAgent) hashedUserData.client_user_agent = event.userData.clientUserAgent

  const payload = {
    data: [{
      event_name: event.eventName,
      event_id: event.eventId,
      event_time: event.eventTime,
      action_source: 'website',
      event_source_url: event.eventSourceUrl,
      user_data: hashedUserData,
      custom_data: event.customData,
    }],
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
    )
    const data = await res.json()
    if (!res.ok) console.error('[CAPI Error]', data)
    return { success: res.ok, data }
  } catch (err) {
    console.error('[CAPI Error]', err)
    return { success: false }
  }
}

// Eventos CAPI específicos
export async function capiPurchase(params: {
  orderId: string; value: number; email?: string; phone?: string;
  clientIp?: string; clientUserAgent?: string; siteUrl?: string;
}) {
  return sendCAPIEvent({
    eventName: 'Purchase',
    eventId: `purchase_${params.orderId}`,
    eventTime: Math.floor(Date.now() / 1000),
    userData: { email: params.email, phone: params.phone, clientIpAddress: params.clientIp, clientUserAgent: params.clientUserAgent },
    customData: { value: params.value, currency: 'BRL', order_id: params.orderId },
    eventSourceUrl: params.siteUrl,
  })
}

export async function capiAddToCart(params: {
  productId: string; value: number; email?: string;
  clientIp?: string; clientUserAgent?: string; siteUrl?: string;
}) {
  return sendCAPIEvent({
    eventName: 'AddToCart',
    eventId: `atc_${params.productId}_${Date.now()}`,
    eventTime: Math.floor(Date.now() / 1000),
    userData: { email: params.email, clientIpAddress: params.clientIp, clientUserAgent: params.clientUserAgent },
    customData: { content_ids: [params.productId], value: params.value, currency: 'BRL' },
    eventSourceUrl: params.siteUrl,
  })
}

export async function capiLead(params: {
  email: string; clientIp?: string; clientUserAgent?: string; siteUrl?: string;
}) {
  return sendCAPIEvent({
    eventName: 'Lead',
    eventId: `lead_${sha256(params.email)}_${Date.now()}`,
    eventTime: Math.floor(Date.now() / 1000),
    userData: { email: params.email, clientIpAddress: params.clientIp, clientUserAgent: params.clientUserAgent },
    eventSourceUrl: params.siteUrl,
  })
}
