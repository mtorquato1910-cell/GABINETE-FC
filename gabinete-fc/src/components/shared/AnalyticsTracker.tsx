'use client'
import { useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'

const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function getOrCreateSessionId(): string {
  const key = 'gfc_session'
  let id = sessionStorage.getItem(key)
  // Backend agora exige UUID v4. IDs antigos (formato Math.random)
  // são descartados — geramos novo via crypto.randomUUID().
  if (!id || !UUID_V4_RE.test(id)) {
    id = crypto.randomUUID()
    sessionStorage.setItem(key, id)
  }
  return id
}

function getUtmParams() {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(window.location.search)
  // Persist UTM params in sessionStorage so they survive navigation
  const stored = sessionStorage.getItem('gfc_utm')
  const storedUtm = stored ? JSON.parse(stored) : {}

  const current = {
    utmSource: params.get('utm_source') ?? undefined,
    utmMedium: params.get('utm_medium') ?? undefined,
    utmCampaign: params.get('utm_campaign') ?? undefined,
  }

  // If current URL has UTMs, update stored
  if (current.utmSource) {
    sessionStorage.setItem('gfc_utm', JSON.stringify(current))
    return current
  }
  return storedUtm
}

function track(payload: Record<string, unknown>) {
  fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {})
}

export function AnalyticsTracker({ userId }: { userId?: string }) {
  const pathname = usePathname()
  const lastPath = useRef('')
  const sessionId = useRef('')

  useEffect(() => {
    sessionId.current = getOrCreateSessionId()
  }, [])

  // Track page views
  useEffect(() => {
    if (pathname === lastPath.current) return
    lastPath.current = pathname

    const sid = getOrCreateSessionId()
    sessionId.current = sid
    const utms = getUtmParams()

    track({
      sessionId: sid,
      userId,
      eventType: 'page_view',
      pageUrl: pathname,
      ...utms,
    })
  }, [pathname, userId])

  // Track clicks with position
  const handleClick = useCallback((e: MouseEvent) => {
    const sid = sessionId.current || getOrCreateSessionId()
    const posX = Math.round((e.clientX / window.innerWidth) * 100) / 100
    const posY = Math.round((e.clientY / window.innerHeight) * 100) / 100
    const utms = getUtmParams()

    track({
      sessionId: sid,
      userId,
      eventType: 'click',
      pageUrl: window.location.pathname,
      posX,
      posY,
      ...utms,
    })
  }, [userId])

  // Track mouse movement throttled (1 event per 2s per page)
  const lastMoveTime = useRef(0)
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const now = Date.now()
    if (now - lastMoveTime.current < 2000) return
    lastMoveTime.current = now

    const sid = sessionId.current || getOrCreateSessionId()
    const posX = Math.round((e.clientX / window.innerWidth) * 100) / 100
    const posY = Math.round((e.clientY / window.innerHeight) * 100) / 100
    const utms = getUtmParams()

    track({
      sessionId: sid,
      userId,
      eventType: 'mouse_move',
      pageUrl: window.location.pathname,
      posX,
      posY,
      ...utms,
    })
  }, [userId])

  useEffect(() => {
    document.addEventListener('click', handleClick, { passive: true })
    document.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => {
      document.removeEventListener('click', handleClick)
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [handleClick, handleMouseMove])

  return null
}
