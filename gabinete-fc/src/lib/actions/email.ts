'use server'

// TODO Sprint 5: Instalar Resend: npm install resend react-email
// import { Resend } from 'resend'
// const resend = new Resend(process.env.RESEND_API_KEY)

interface OrderConfirmationData {
  to: string
  customerName: string
  orderId: string
  total: number
  items: Array<{ name: string; size: string; quantity: number; price: number }>
}

// Stub: loga o email em vez de enviar
// TODO Sprint 5: Implementar com Resend real
export async function sendOrderConfirmation(data: OrderConfirmationData) {
  console.log('[EMAIL STUB] Confirmação de pedido:', {
    to: data.to,
    subject: `Pedido #${data.orderId.slice(-8).toUpperCase()} confirmado — Gabinete FC`,
    customer: data.customerName,
    total: data.total,
  })
  return { success: true }
}

export async function sendOrderStatusUpdate(data: {
  to: string
  customerName: string
  orderId: string
  status: string
  trackingCode?: string
}) {
  console.log('[EMAIL STUB] Atualização de status:', data)
  return { success: true }
}

export async function sendPasswordReset(data: { to: string; resetLink: string }) {
  console.log('[EMAIL STUB] Reset de senha:', { to: data.to, link: data.resetLink })
  return { success: true }
}

export async function sendAbandonedCart(data: {
  to: string
  customerName: string
  cartValue: number
  recoveryLink: string
}) {
  console.log('[EMAIL STUB] Carrinho abandonado:', data)
  return { success: true }
}
