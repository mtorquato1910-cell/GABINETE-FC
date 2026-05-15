import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import {
  generateJerseyCover,
  buildCoverPromptColor,
  buildCoverPromptBlackout,
  type CoverPromptInput,
} from '@/lib/gemini-image'

export const maxDuration = 60
export const runtime = 'nodejs'

const recentCalls = new Map<string, number[]>()
const MAX_PER_HOUR = 30

export async function POST(req: Request) {
  let session
  try {
    session = await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const userId = session.user.id

  const now = Date.now()
  const calls = (recentCalls.get(userId) ?? []).filter((t) => now - t < 3600_000)
  if (calls.length >= MAX_PER_HOUR) {
    return NextResponse.json(
      { error: `Limite de ${MAX_PER_HOUR} gerações por hora atingido. Tente mais tarde.` },
      { status: 429 }
    )
  }
  calls.push(now)
  recentCalls.set(userId, calls)

  let body: Partial<CoverPromptInput> & {
    referenceImageBase64?: string
    referenceImageMime?: string
    gray?: boolean
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  if (!body.team || !body.brand) {
    return NextResponse.json(
      { error: 'Campos obrigatórios: team, brand' },
      { status: 400 }
    )
  }

  const prompt = body.gray
    ? buildCoverPromptBlackout({
        team: body.team,
        crest: body.crest ?? '',
        brand: body.brand,
      })
    : buildCoverPromptColor({
        team: body.team,
        variant: body.variant ?? 'I',
        primaryColor: body.primaryColor ?? '',
        secondaryColor: body.secondaryColor ?? '',
        brand: body.brand,
        crest: body.crest ?? '',
        details: body.details ?? '',
      })

  try {
    const result = await generateJerseyCover({
      prompt,
      referenceImageBase64: body.referenceImageBase64,
      referenceImageMime: body.referenceImageMime,
    })
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro Gemini'
    console.error('[generate-jersey-cover]', err)
    return NextResponse.json({ error: message }, { status: 503 })
  }
}
