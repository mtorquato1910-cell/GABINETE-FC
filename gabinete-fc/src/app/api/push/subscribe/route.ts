import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { savePushSubscription } from '@/lib/actions/push'

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = (session?.user as { id?: string })?.id

  const body = await req.json()
  const { endpoint, keys } = body

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Subscription inválida' }, { status: 400 })
  }

  await savePushSubscription({
    endpoint,
    p256dhKey: keys.p256dh,
    authKey: keys.auth,
    userId,
  })

  return NextResponse.json({ success: true })
}
