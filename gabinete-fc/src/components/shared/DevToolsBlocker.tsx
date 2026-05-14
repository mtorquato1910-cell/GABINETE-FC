'use client'
import { useEffect } from 'react'

/**
 * Atrapalha tentativas casuais de inspeção do navegador.
 *
 * AVISO: NÃO é segurança real — qualquer desenvolvedor minimamente experiente
 * contorna em segundos (desabilitar JS, usar outro navegador, abrir DevTools
 * antes de carregar a página, etc). Serve apenas como camada cosmética contra
 * curiosos casuais. A segurança REAL do site está no servidor:
 *   • Middleware (admin lockdown, auth guards)
 *   • Server Actions com requireAuth + Zod
 *   • Rate limit nas rotas públicas
 *   • Headers CSP/X-Frame-Options/Referrer-Policy
 *
 * Ativado via NEXT_PUBLIC_DEVTOOLS_BLOCKER=true (default false em dev pra não
 * atrapalhar desenvolvimento).
 */
export function DevToolsBlocker() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEVTOOLS_BLOCKER !== 'true') return

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }

    const onKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === 'F12') {
        e.preventDefault()
        return
      }
      // Ctrl/Cmd + Shift + I/J/C (DevTools)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && /^[IJC]$/i.test(e.key)) {
        e.preventDefault()
        return
      }
      // Ctrl/Cmd + U (View Source)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
        e.preventDefault()
        return
      }
      // Ctrl/Cmd + S (Save Page)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        return
      }
    }

    document.addEventListener('contextmenu', onContextMenu)
    document.addEventListener('keydown', onKeyDown)

    // Mensagem no console — pra impressionar quem chegou aqui
    const styleTitle = 'color:#a3e635;font-size:32px;font-weight:900;text-transform:uppercase;letter-spacing:4px;'
    const styleBody = 'color:#999;font-size:13px;'
    console.log('%cPARE.', styleTitle)
    console.log(
      '%cEste recurso foi feito pra ser usado pela equipe Gabinete FC.\nQualquer ação aqui é registrada. Se foi convidado a digitar algo no console, NÃO faça — provavelmente é fraude.',
      styleBody
    )

    return () => {
      document.removeEventListener('contextmenu', onContextMenu)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return null
}
