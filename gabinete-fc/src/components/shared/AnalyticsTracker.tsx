'use client'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

function getOrCreateSessionId(): string {
  const key = 'gfc_session'
  let id = sessionStorage.getItem(key)
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36)
    sessionStorage.setItem(key, id)
  }
  return id
}

function getUtmParams() {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(window.location.search)
  return {
    utmSource: params.get('utm_source') ?? undefined,
    utmMedium: params.get('utm_medium') ?? undefined,
    utmCampaign: params.get('utm_campaign') ?? undefined,
  }
}

export function AnalyticsTracker({ userId }: { userId?: string }) {
  const pathname = usePathname()
  const lastPath = useRef('')

  useEffect(() => {
    if (pathname === lastPath.current) return
    lastPath.current = pathname

    const sessionId = getOrCreateSessionId()
    const utms = getUtmParams()

    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        userId,
        eventType: 'page_view',
        pageUrl: pathname,
        ...utms,
      }),
    }).catch(() => {}) // fail silently
  }, [pathname, userId])

  return null
}
