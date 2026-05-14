import { signOut } from '@/lib/auth'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  await signOut()
  const origin = new URL(request.url).origin
  return NextResponse.redirect(`${origin}/`)
}

export async function POST(request: NextRequest) {
  await signOut()
  const origin = new URL(request.url).origin
  return NextResponse.redirect(`${origin}/`)
}
