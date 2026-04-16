import { NextRequest, NextResponse } from 'next/server'
import { capiLead } from '@/lib/actions/capi'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 })

    const clientIp = req.headers.get('x-forwarded-for') ?? undefined
    const userAgent = req.headers.get('user-agent') ?? undefined

    // Dispara CAPI Lead (non-blocking)
    capiLead({ email, clientIp, clientUserAgent: userAgent }).catch(() => {})

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
