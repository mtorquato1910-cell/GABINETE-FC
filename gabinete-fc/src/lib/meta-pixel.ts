// Utilitário Meta Pixel — client-side events
// Lê meta_pixel_id das store_settings (carregado no layout)

declare global {
  interface Window {
    fbq: (command: string, event: string, params?: Record<string, unknown>, options?: Record<string, unknown>) => void
    _fbq: unknown
  }
}

export function initMetaPixel(pixelId: string) {
  if (typeof window === 'undefined' || !pixelId) return
  if (window.fbq) return // já inicializado

  const script = document.createElement('script')
  script.innerHTML = `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${pixelId}');
    fbq('track', 'PageView');
  `
  document.head.appendChild(script)
}

export function trackPixelEvent(event: string, params?: Record<string, unknown>, eventId?: string) {
  if (typeof window === 'undefined' || !window.fbq) return
  const options = eventId ? { eventID: eventId } : undefined
  window.fbq('track', event, params, options)
}

// Eventos padrão
export const pixelEvents = {
  pageView: () => trackPixelEvent('PageView'),
  viewContent: (productId: string, name: string, value: number) =>
    trackPixelEvent('ViewContent', { content_ids: [productId], content_name: name, value, currency: 'BRL' }),
  addToCart: (productId: string, name: string, value: number, eventId: string) =>
    trackPixelEvent('AddToCart', { content_ids: [productId], content_name: name, value, currency: 'BRL' }, eventId),
  initiateCheckout: (value: number, numItems: number, eventId: string) =>
    trackPixelEvent('InitiateCheckout', { value, currency: 'BRL', num_items: numItems }, eventId),
  purchase: (orderId: string, value: number, eventId: string) =>
    trackPixelEvent('Purchase', { value, currency: 'BRL', order_id: orderId }, eventId),
  lead: (eventId: string) =>
    trackPixelEvent('Lead', {}, eventId),
}
