import { prisma } from '@/lib/db'
import { headers } from 'next/headers'

interface LogAdminActionInput {
  adminUserId: string
  adminEmail: string
  action: 'view_customer' | 'view_cpf' | 'edit_customer' | 'delete_customer' | 'view_audit_log'
  targetType: 'customer' | 'order' | 'review'
  targetId: string
  metadata?: Record<string, unknown>
}

/**
 * Registra ação administrativa pra auditoria LGPD.
 * Captura IP e user-agent automaticamente quando disponíveis.
 * Falhas são logadas mas não interrompem o fluxo principal (audit best-effort).
 */
export async function logAdminAction(input: LogAdminActionInput) {
  try {
    const hdrs = await headers()
    const ipAddress =
      hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      hdrs.get('x-real-ip') ??
      null
    const userAgent = hdrs.get('user-agent') ?? null

    await prisma.adminAuditLog.create({
      data: {
        adminUserId: input.adminUserId,
        adminEmail: input.adminEmail,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        ipAddress,
        userAgent,
      },
    })
  } catch (err) {
    console.error('[logAdminAction] Falha ao gravar audit log:', err)
  }
}

/**
 * Máscara CPF: 123.456.789-01 → ***.***.***-01
 * Aceita CPF com ou sem formatação. Retorna string vazia se inválido.
 */
export function maskCpf(cpf: string | null | undefined): string {
  if (!cpf) return ''
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return cpf
  return `***.***.***-${digits.slice(9)}`
}

/**
 * Formata CPF completo: 12345678901 → 123.456.789-01
 */
export function formatCpf(cpf: string | null | undefined): string {
  if (!cpf) return ''
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return cpf
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}
