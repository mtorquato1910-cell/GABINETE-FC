'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

interface HeatPoint { posX: number | null; posY: number | null; eventType: string }
interface Lead {
  sessionId: string
  events: number
  firstSeen: string | null
  lastSeen: string | null
  userId: string | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  landingPage: string | null
}
interface JourneyEvent {
  id: string
  eventType: string
  pageUrl: string | null
  posX: number | null
  posY: number | null
  productId: string | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  createdAt: string
}

const EVENT_COLORS: Record<string, string> = {
  click: '#ef4444',
  mouse_move: '#3b82f6',
}

export function HeatmapDashboard({ availablePages }: { availablePages: string[] }) {
  const [tab, setTab] = useState<'heatmap' | 'leads'>('heatmap')
  const [selectedPage, setSelectedPage] = useState(availablePages[0] ?? '/')
  const [points, setPoints] = useState<HeatPoint[]>([])
  const [showClicks, setShowClicks] = useState(true)
  const [showMoves, setShowMoves] = useState(true)
  const [loading, setLoading] = useState(false)

  const [error, setError] = useState<string | null>(null)

  const [leads, setLeads] = useState<Lead[]>([])
  const [leadsLoading, setLeadsLoading] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [journey, setJourney] = useState<JourneyEvent[]>([])
  const [journeyLoading, setJourneyLoading] = useState(false)
  const [leadSearch, setLeadSearch] = useState('')

  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Load heatmap points
  const loadHeatmap = useCallback(async (page: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/analytics/heatmap?type=heatmap&page=${encodeURIComponent(page)}`)
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error ?? 'Falha ao carregar dados do heatmap')
        setPoints([])
      } else {
        setPoints(data.points ?? [])
      }
    } catch {
      setError('Falha de rede ao carregar heatmap')
      setPoints([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Load leads
  const loadLeads = useCallback(async () => {
    setLeadsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/analytics/heatmap?type=leads')
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error ?? 'Falha ao carregar leads')
        setLeads([])
      } else {
        setLeads(data.leads ?? [])
      }
    } catch {
      setError('Falha de rede ao carregar leads')
      setLeads([])
    } finally {
      setLeadsLoading(false)
    }
  }, [])

  // Load journey for selected lead
  const loadJourney = useCallback(async (sessionId: string) => {
    setJourneyLoading(true)
    try {
      const res = await fetch(`/api/analytics/heatmap?type=journey&session=${encodeURIComponent(sessionId)}`)
      const data = await res.json()
      setJourney(data.journey ?? [])
    } finally {
      setJourneyLoading(false)
    }
  }, [])

  useEffect(() => {
    if (tab === 'heatmap') loadHeatmap(selectedPage)
  }, [tab, selectedPage, loadHeatmap])

  useEffect(() => {
    if (tab === 'leads') loadLeads()
  }, [tab, loadLeads])

  // Draw heatmap on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height

    ctx.clearRect(0, 0, W, H)

    const filtered = points.filter(p => {
      if (p.eventType === 'click' && !showClicks) return false
      if (p.eventType === 'mouse_move' && !showMoves) return false
      return p.posX !== null && p.posY !== null
    })

    if (filtered.length === 0) return

    // Build density grid for heat gradient
    const GRID = 40
    const density: number[][] = Array.from({ length: GRID }, () => Array(GRID).fill(0))

    filtered.forEach(p => {
      const gx = Math.min(GRID - 1, Math.floor((p.posX ?? 0) * GRID))
      const gy = Math.min(GRID - 1, Math.floor((p.posY ?? 0) * GRID))
      density[gy][gx]++
    })

    const maxD = Math.max(...density.flat(), 1)

    // Draw heat blobs
    for (let gy = 0; gy < GRID; gy++) {
      for (let gx = 0; gx < GRID; gx++) {
        const val = density[gy][gx]
        if (val === 0) continue
        const intensity = val / maxD
        const cx = (gx + 0.5) * (W / GRID)
        const cy = (gy + 0.5) * (H / GRID)
        const radius = (W / GRID) * 1.5

        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
        // Blue → Yellow → Red based on intensity
        const r = Math.round(intensity > 0.5 ? 255 : intensity * 2 * 255)
        const g = Math.round(intensity < 0.5 ? intensity * 2 * 200 : (1 - intensity) * 2 * 200)
        const b = Math.round(intensity < 0.5 ? 255 * (1 - intensity * 2) : 0)
        gradient.addColorStop(0, `rgba(${r},${g},${b},${0.15 + intensity * 0.55})`)
        gradient.addColorStop(1, 'rgba(0,0,0,0)')

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(cx, cy, radius, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Draw individual click dots
    if (showClicks) {
      filtered.filter(p => p.eventType === 'click').forEach(p => {
        const x = (p.posX ?? 0) * W
        const y = (p.posY ?? 0) * H
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(239,68,68,0.8)'
        ctx.fill()
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'
        ctx.lineWidth = 1
        ctx.stroke()
      })
    }
  }, [points, showClicks, showMoves])

  const filteredLeads = leads.filter(l =>
    !leadSearch ||
    l.sessionId.includes(leadSearch) ||
    (l.userId ?? '').toLowerCase().includes(leadSearch.toLowerCase()) ||
    (l.utmSource ?? '').toLowerCase().includes(leadSearch.toLowerCase()) ||
    (l.utmCampaign ?? '').toLowerCase().includes(leadSearch.toLowerCase())
  )

  const eventIcon: Record<string, string> = {
    page_view: '📄',
    click: '🖱️',
    mouse_move: '↗',
    add_to_cart: '🛒',
    checkout_start: '💳',
    purchase: '✅',
  }

  return (
    <div className="p-6 space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-border">
        {(['heatmap', 'leads'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
              tab === t ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'heatmap' ? '🔥 Mapa de Calor' : '👤 Jornada de Leads'}
          </button>
        ))}
      </div>

      {/* HEATMAP TAB */}
      {tab === 'heatmap' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Página:</label>
              <select
                value={selectedPage}
                onChange={e => setSelectedPage(e.target.value)}
                className="bg-background border border-border text-xs px-2 py-1.5 focus:outline-none focus:border-primary"
              >
                {availablePages.length === 0 && <option value="/">/</option>}
                {availablePages.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={showClicks}
                onChange={e => setShowClicks(e.target.checked)}
                className="accent-red-500"
              />
              <span className="w-3 h-3 bg-red-500 inline-block" />
              Cliques
            </label>

            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={showMoves}
                onChange={e => setShowMoves(e.target.checked)}
                className="accent-blue-500"
              />
              <span className="w-3 h-3 bg-blue-500 inline-block" />
              Movimentos
            </label>

            <span className="text-[10px] text-muted-foreground uppercase tracking-widest ml-auto">
              {loading ? 'Carregando...' : `${points.length} eventos`}
            </span>
          </div>

          {/* Canvas heatmap */}
          <div className="border border-border relative bg-secondary/30" style={{ aspectRatio: '16/9' }}>
            {/* Page structure overlay (representação visual do layout) */}
            <div className="absolute inset-0 pointer-events-none opacity-10">
              {/* Nav bar */}
              <div className="absolute top-0 left-0 right-0 h-[6%] bg-foreground/50" />
              {/* Hero */}
              <div className="absolute top-[6%] left-0 right-0 h-[30%] bg-foreground/20" />
              {/* Content area */}
              <div className="absolute top-[36%] left-[5%] right-[5%] h-[50%] bg-foreground/10" />
              {/* Footer */}
              <div className="absolute bottom-0 left-0 right-0 h-[8%] bg-foreground/30" />
            </div>

            {/* Zone labels */}
            <div className="absolute top-[1%] left-[1%] text-[8px] text-muted-foreground/50 uppercase tracking-widest pointer-events-none">
              Navigation
            </div>
            <div className="absolute top-[8%] left-[1%] text-[8px] text-muted-foreground/50 uppercase tracking-widest pointer-events-none">
              Hero / Banner
            </div>
            <div className="absolute top-[38%] left-[1%] text-[8px] text-muted-foreground/50 uppercase tracking-widest pointer-events-none">
              Conteúdo
            </div>

            <canvas
              ref={canvasRef}
              width={1280}
              height={720}
              className="w-full h-full"
            />

            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <span className="text-xs text-muted-foreground uppercase tracking-widest">Carregando dados...</span>
              </div>
            )}

            {!loading && error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center bg-background/80">
                <span className="text-4xl mb-3">⚠️</span>
                <p className="text-xs text-red-400 normal-case max-w-xs">
                  {error}
                </p>
                <button
                  onClick={() => loadHeatmap(selectedPage)}
                  className="mt-3 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground border border-border px-3 py-1"
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {!loading && !error && points.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-4xl mb-3">🔥</span>
                <p className="text-xs text-muted-foreground normal-case max-w-xs">
                  Sem dados de heatmap para esta página ainda. Os eventos são coletados automaticamente quando usuários navegam no site.
                </p>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex gap-6 text-[10px] text-muted-foreground uppercase tracking-widest">
            <span className="flex items-center gap-2"><span className="w-3 h-3 bg-blue-500 inline-block rounded-full" /> Baixa atividade</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 bg-yellow-400 inline-block rounded-full" /> Média</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 bg-red-500 inline-block rounded-full" /> Alta atividade</span>
            <span className="flex items-center gap-2"><span className="w-2 h-2 border border-red-500 bg-red-500 inline-block rounded-full" /> Clique</span>
          </div>
        </div>
      )}

      {/* LEADS TAB */}
      {tab === 'leads' && (
        <div className="space-y-4">
          <div className="flex gap-4 items-center">
            <input
              type="text"
              placeholder="Buscar por session ID, UTM source, campanha..."
              value={leadSearch}
              onChange={e => setLeadSearch(e.target.value)}
              className="flex-1 bg-background border border-border text-xs px-3 py-2 focus:outline-none focus:border-primary normal-case placeholder:normal-case"
            />
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest shrink-0">
              {leadsLoading ? 'Carregando...' : `${filteredLeads.length} leads`}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Lead list */}
            <div className="border border-border">
              <div className="px-4 py-3 border-b border-border bg-secondary">
                <h2 className="text-xs font-bold uppercase tracking-widest">Sessões / Leads</h2>
              </div>
              <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                {filteredLeads.length === 0 && (
                  <div className="px-4 py-8 text-center text-xs text-muted-foreground normal-case">
                    {leadsLoading ? 'Carregando...' : 'Sem leads ainda. Os dados aparecem quando usuários visitam o site.'}
                  </div>
                )}
                {filteredLeads.map(lead => (
                  <button
                    key={lead.sessionId}
                    onClick={() => {
                      setSelectedLead(lead)
                      loadJourney(lead.sessionId)
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-secondary/50 transition-colors ${
                      selectedLead?.sessionId === lead.sessionId ? 'bg-primary/10 border-l-2 border-primary' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-foreground font-mono">
                          {lead.sessionId.slice(0, 16)}…
                        </p>
                        <p className="text-[10px] text-muted-foreground normal-case mt-0.5">
                          {lead.landingPage ?? '/'} · {lead.events} eventos
                        </p>
                        {(lead.utmSource || lead.utmCampaign) && (
                          <p className="text-[10px] text-primary normal-case mt-0.5">
                            via {lead.utmSource ?? '—'}
                            {lead.utmCampaign ? ` / ${lead.utmCampaign}` : ''}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[9px] text-muted-foreground normal-case">
                          {lead.lastSeen ? new Date(lead.lastSeen).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </p>
                        {lead.userId && (
                          <span className="text-[9px] bg-primary/20 text-primary px-1 py-0.5 font-bold uppercase">
                            Logado
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Journey detail */}
            <div className="border border-border">
              <div className="px-4 py-3 border-b border-border bg-secondary">
                <h2 className="text-xs font-bold uppercase tracking-widest">
                  {selectedLead ? `Jornada: ${selectedLead.sessionId.slice(0, 12)}…` : 'Selecione um lead'}
                </h2>
              </div>

              {!selectedLead && (
                <div className="px-4 py-8 text-center text-xs text-muted-foreground normal-case">
                  Clique em um lead para ver o caminho completo que ele percorreu no site.
                </div>
              )}

              {selectedLead && (
                <div className="max-h-[600px] overflow-y-auto">
                  {/* Lead info header */}
                  <div className="px-4 py-3 border-b border-border bg-primary/5 space-y-1">
                    {selectedLead.utmSource && (
                      <div className="flex gap-2 text-[10px]">
                        <span className="text-muted-foreground uppercase tracking-widest">Origem:</span>
                        <span className="font-bold text-primary">
                          {selectedLead.utmSource}
                          {selectedLead.utmMedium ? ` / ${selectedLead.utmMedium}` : ''}
                        </span>
                      </div>
                    )}
                    {selectedLead.utmCampaign && (
                      <div className="flex gap-2 text-[10px]">
                        <span className="text-muted-foreground uppercase tracking-widest">Campanha:</span>
                        <span className="font-bold normal-case">{selectedLead.utmCampaign}</span>
                      </div>
                    )}
                    <div className="flex gap-2 text-[10px]">
                      <span className="text-muted-foreground uppercase tracking-widest">Entrada:</span>
                      <span className="font-bold normal-case">{selectedLead.landingPage ?? '/'}</span>
                    </div>
                    <div className="flex gap-2 text-[10px]">
                      <span className="text-muted-foreground uppercase tracking-widest">Total:</span>
                      <span className="font-bold">{selectedLead.events} eventos</span>
                    </div>
                  </div>

                  {journeyLoading && (
                    <div className="px-4 py-8 text-center text-xs text-muted-foreground">Carregando jornada...</div>
                  )}

                  {!journeyLoading && journey.length === 0 && (
                    <div className="px-4 py-8 text-center text-xs text-muted-foreground normal-case">Sem eventos detalhados.</div>
                  )}

                  {/* Timeline */}
                  <div className="p-4 space-y-0">
                    {journey.map((ev, i) => {
                      const isLast = i === journey.length - 1
                      const time = new Date(ev.createdAt)
                      const prevTime = i > 0 ? new Date(journey[i - 1].createdAt) : null
                      const diffMs = prevTime ? time.getTime() - prevTime.getTime() : 0
                      const diffSec = Math.round(diffMs / 1000)

                      const isConversion = ev.eventType === 'purchase'
                      const isCart = ev.eventType === 'add_to_cart'
                      const isCheckout = ev.eventType === 'checkout_start'

                      return (
                        <div key={ev.id} className="flex gap-3">
                          {/* Timeline line */}
                          <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full shrink-0 border-2 ${
                              isConversion ? 'bg-green-500 border-green-500' :
                              isCart ? 'bg-yellow-500 border-yellow-500' :
                              isCheckout ? 'bg-orange-500 border-orange-500' :
                              ev.eventType === 'page_view' ? 'bg-primary border-primary' :
                              'bg-border border-border'
                            }`} />
                            {!isLast && <div className="w-0.5 bg-border flex-1 my-0.5" style={{ minHeight: '20px' }} />}
                          </div>

                          {/* Content */}
                          <div className={`pb-3 min-w-0 flex-1 ${isLast ? 'pb-0' : ''}`}>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-widest">
                                  {eventIcon[ev.eventType] ?? '•'} {ev.eventType.replace('_', ' ')}
                                </span>
                                {ev.pageUrl && (
                                  <p className="text-[10px] text-muted-foreground normal-case">{ev.pageUrl}</p>
                                )}
                                {ev.productId && (
                                  <p className="text-[10px] text-primary normal-case">produto: {ev.productId.slice(0, 8)}…</p>
                                )}
                                {(ev.posX !== null && ev.posY !== null) && (
                                  <p className="text-[9px] text-muted-foreground/50 normal-case">
                                    pos: {Math.round((ev.posX ?? 0) * 100)}% × {Math.round((ev.posY ?? 0) * 100)}%
                                  </p>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-[9px] text-muted-foreground normal-case">
                                  {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </p>
                                {diffSec > 0 && (
                                  <p className="text-[9px] text-muted-foreground/50 normal-case">
                                    +{diffSec < 60 ? `${diffSec}s` : `${Math.round(diffSec / 60)}m`}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
