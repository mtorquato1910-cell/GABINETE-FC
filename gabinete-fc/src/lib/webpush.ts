import webpush from 'web-push'

let initialized = false

export function getWebPush() {
  if (!initialized) {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const privateKey = process.env.VAPID_PRIVATE_KEY
    const subject = process.env.VAPID_SUBJECT || 'mailto:contato@gabinetefc.com.br'

    if (!publicKey || !privateKey) {
      return null
    }

    webpush.setVapidDetails(subject, publicKey, privateKey)
    initialized = true
  }

  return webpush
}

export { webpush }
