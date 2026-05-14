'use server'
import { render } from '@react-email/render'
import { OrderConfirmation } from '@/emails/OrderConfirmation'
import { AbandonedCart } from '@/emails/AbandonedCart'
import { ShippingNotification } from '@/emails/ShippingNotification'

function getResend() {
  if (!process.env.RESEND_API_KEY) return null
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Resend } = require('resend')
  return new Resend(process.env.RESEND_API_KEY)
}

const FROM = process.env.EMAIL_FROM || 'Gabinete FC <noreply@gabinetefc.com.br>'

interface OrderConfirmationData {
  to: string
  customerName: string
  orderId: string
  total: number
  items: Array<{
    name: string
    size: string
    quantity: number
    price: number
    hasCustomization?: boolean
    customName?: string | null
    customNumber?: string | null
  }>
}

export async function sendOrderConfirmation(data: OrderConfirmationData) {
  const resend = getResend()
  if (!resend) {
    console.log('[EMAIL] RESEND_API_KEY não configurado — confirmação de pedido não enviada:', data.orderId)
    return { success: true }
  }

  const html = await render(OrderConfirmation({
    customerName: data.customerName,
    orderId: data.orderId,
    total: data.total,
    items: data.items,
  }))

  const { error } = await resend.emails.send({
    from: FROM,
    to: data.to,
    subject: `Pedido #${data.orderId.slice(-8).toUpperCase()} confirmado — Gabinete FC`,
    html,
  })

  if (error) console.error('[EMAIL] Erro ao enviar confirmação:', error)
  return { success: !error }
}

export async function sendOrderStatusUpdate(data: {
  to: string
  customerName: string
  orderId: string
  status: string
  trackingCode?: string
}) {
  const resend = getResend()
  if (!resend) {
    console.log('[EMAIL] RESEND_API_KEY não configurado — status de pedido não enviado')
    return { success: true }
  }

  if (data.trackingCode) {
    const html = await render(ShippingNotification({
      customerName: data.customerName,
      orderId: data.orderId,
      trackingCode: data.trackingCode,
    }))

    const { error } = await resend.emails.send({
      from: FROM,
      to: data.to,
      subject: `Seu pedido #${data.orderId.slice(-8).toUpperCase()} foi enviado — Gabinete FC`,
      html,
    })

    if (error) console.error('[EMAIL] Erro ao enviar status:', error)
    return { success: !error }
  }

  // Status simples sem tracking
  const { error } = await resend.emails.send({
    from: FROM,
    to: data.to,
    subject: `Atualização do pedido #${data.orderId.slice(-8).toUpperCase()} — Gabinete FC`,
    html: `<p>Olá ${data.customerName}, seu pedido foi atualizado para: <strong>${data.status}</strong></p>`,
  })

  if (error) console.error('[EMAIL] Erro ao enviar status:', error)
  return { success: !error }
}

export async function sendPasswordReset(data: { to: string; resetLink: string }) {
  const resend = getResend()
  if (!resend) {
    console.log('[EMAIL] RESEND_API_KEY não configurado — reset de senha não enviado')
    return { success: true }
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to: data.to,
    subject: 'Redefinição de senha — Gabinete FC',
    html: `
      <div style="background:#0a0a0a;color:#cccccc;font-family:Arial,sans-serif;padding:40px;max-width:600px;margin:0 auto;">
        <h1 style="color:#fff;font-size:20px;letter-spacing:4px;text-transform:uppercase;">GABINETE FC</h1>
        <p>Clique no link abaixo para redefinir sua senha:</p>
        <a href="${data.resetLink}" style="color:#fff;font-weight:bold;">Redefinir Senha →</a>
        <p style="color:#666;font-size:12px;margin-top:24px;">Este link expira em 1 hora. Se você não solicitou, ignore este email.</p>
      </div>
    `,
  })

  if (error) console.error('[EMAIL] Erro ao enviar reset:', error)
  return { success: !error }
}

export async function sendAbandonedCart(data: {
  to: string
  customerName: string
  cartValue: number
  recoveryLink: string
}) {
  const resend = getResend()
  if (!resend) {
    console.log('[EMAIL] RESEND_API_KEY não configurado — email de carrinho abandonado não enviado')
    return { success: true }
  }

  const html = await render(AbandonedCart({
    customerName: data.customerName,
    cartValue: data.cartValue,
    recoveryLink: data.recoveryLink,
  }))

  const { error } = await resend.emails.send({
    from: FROM,
    to: data.to,
    subject: 'Você deixou algo no carrinho — Gabinete FC',
    html,
  })

  if (error) console.error('[EMAIL] Erro ao enviar carrinho abandonado:', error)
  return { success: !error }
}
