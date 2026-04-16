'use client'
import { useEffect, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'

export function PushNotificationManager({ vapidPublicKey }: { vapidPublicKey?: string }) {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    setPermission(Notification.permission)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => setIsSubscribed(!!sub))
      })
    }
  }, [])

  const subscribe = async () => {
    if (!vapidPublicKey) return
    try {
      const reg = await navigator.serviceWorker.ready
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') return

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      })

      setIsSubscribed(true)
    } catch (err) {
      console.error('Push subscribe error:', err)
    }
  }

  if (!vapidPublicKey || permission === 'denied') return null

  return (
    <button
      onClick={subscribe}
      className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors ${
        isSubscribed ? 'text-primary cursor-default' : 'text-muted-foreground hover:text-primary'
      }`}
    >
      {isSubscribed ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
      {isSubscribed ? 'Notificações ativas' : 'Ativar notificações'}
    </button>
  )
}
