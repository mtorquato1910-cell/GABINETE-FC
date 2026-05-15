'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Sparkles, Save, RotateCcw } from 'lucide-react'
import { saveCover } from '@/lib/actions/covers'

interface Props {
  productId: string
  slug: string
  team: string
  variant: string
  existingGray: string | null
  existingColor: string | null
}

interface GeneratedImage {
  imageBase64: string
  mimeType: string
}

export function CapaForm({ slug, team, variant, existingGray, existingColor }: Props) {
  const [primaryColor, setPrimaryColor] = useState('')
  const [secondaryColor, setSecondaryColor] = useState('')
  const [brand, setBrand] = useState('Nike')
  const [crest, setCrest] = useState('')
  const [details, setDetails] = useState('')
  const [referenceImageBase64, setReferenceImageBase64] = useState<string | null>(null)
  const [referenceImageMime, setReferenceImageMime] = useState<string | null>(null)
  const [referencePreview, setReferencePreview] = useState<string | null>(null)

  const [generatedColor, setGeneratedColor] = useState<GeneratedImage | null>(null)
  const [generatedGray, setGeneratedGray] = useState<GeneratedImage | null>(null)
  const [generating, setGenerating] = useState<'color' | 'gray' | null>(null)
  const [saving, setSaving] = useState(false)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 4 * 1024 * 1024) {
      toast.error('Brasão muito grande (máx 4MB)')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1] ?? ''
      setReferenceImageBase64(base64)
      setReferenceImageMime(file.type)
      setReferencePreview(result)
    }
    reader.readAsDataURL(file)
  }

  async function generate(gray: boolean) {
    if (!primaryColor || !brand) {
      toast.error('Preencha pelo menos cor primária e marca')
      return
    }
    setGenerating(gray ? 'gray' : 'color')
    try {
      const res = await fetch('/api/admin/generate-jersey-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team,
          variant,
          primaryColor,
          secondaryColor,
          brand,
          crest,
          details,
          gray,
          referenceImageBase64: referenceImageBase64 ?? undefined,
          referenceImageMime: referenceImageMime ?? undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? 'Erro ao gerar')
        return
      }
      if (gray) setGeneratedGray(json)
      else setGeneratedColor(json)
      toast.success(`Capa ${gray ? 'cinza' : 'colorida'} gerada`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro de rede')
    } finally {
      setGenerating(null)
    }
  }

  async function handleSave() {
    if (!generatedColor || !generatedGray) {
      toast.error('Gere as duas versões (cinza e colorida) antes de salvar')
      return
    }
    setSaving(true)
    try {
      const result = await saveCover({
        slug,
        colorBase64: generatedColor.imageBase64,
        grayBase64: generatedGray.imageBase64,
      })
      if ('error' in result) {
        toast.error(typeof result.error === 'string' ? result.error : 'Erro ao salvar')
        return
      }
      toast.success(`Capa salva em ${result.updated.length} produto(s): ${result.updated.join(', ')}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const colorSrc = generatedColor
    ? `data:${generatedColor.mimeType};base64,${generatedColor.imageBase64}`
    : existingColor
  const graySrc = generatedGray
    ? `data:${generatedGray.mimeType};base64,${generatedGray.imageBase64}`
    : existingGray

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl">
      {/* Form */}
      <div className="space-y-4">
        <div>
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">
            Cor primária (hex)
          </label>
          <div className="flex gap-2">
            <input
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              placeholder="#FEDD00"
              className="bg-secondary border border-border px-3 py-2 text-sm flex-1 font-mono focus:outline-none focus:border-primary"
            />
            {primaryColor.startsWith('#') && (
              <div
                className="w-10 h-10 border border-border"
                style={{ background: primaryColor }}
                aria-label="Preview cor primária"
              />
            )}
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">
            Cor(es) secundária(s) — texto livre
          </label>
          <input
            value={secondaryColor}
            onChange={(e) => setSecondaryColor(e.target.value)}
            placeholder="#009C3B verde + #002776 azul"
            className="bg-secondary border border-border px-3 py-2 text-sm w-full focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">
            Marca esportiva
          </label>
          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="bg-secondary border border-border px-3 py-2 text-sm w-full focus:outline-none focus:border-primary"
          >
            <option>Nike</option>
            <option>Nike × Jordan</option>
            <option>Adidas</option>
            <option>Puma</option>
            <option>Jako</option>
            <option>Joma</option>
            <option>Marathon</option>
            <option>Finta</option>
            <option>Meyba</option>
            <option>New Balance</option>
            <option>Genérica</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">
            Escudo / Federação (texto)
          </label>
          <input
            value={crest}
            onChange={(e) => setCrest(e.target.value)}
            placeholder="CBF — escudo amarelo com 5 estrelas"
            className="bg-secondary border border-border px-3 py-2 text-sm w-full focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">
            Detalhes do uniforme
          </label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Amarelinha clássica, gola verde com detalhes azuis, elephant print Jordan, sem listras"
            rows={4}
            className="bg-secondary border border-border px-3 py-2 text-sm w-full focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">
            Brasão (referência opcional — jpg/png/svg, máx 4MB)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="text-xs text-muted-foreground file:bg-secondary file:border file:border-border file:px-3 file:py-2 file:text-xs file:uppercase file:tracking-widest file:text-foreground hover:file:border-primary"
          />
          {referencePreview && (
            <div className="mt-2 inline-block border border-border bg-white p-2">
              <img src={referencePreview} alt="Brasão de referência" className="h-20 w-auto object-contain" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-4 border-t border-border">
          <button
            onClick={() => generate(false)}
            disabled={!!generating}
            className="flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 text-xs font-bold uppercase tracking-widest hover:opacity-90 disabled:opacity-50"
          >
            {generating === 'color' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Gerar Colorida
          </button>
          <button
            onClick={() => generate(true)}
            disabled={!!generating}
            className="flex items-center justify-center gap-2 bg-foreground text-background py-3 text-xs font-bold uppercase tracking-widest hover:opacity-90 disabled:opacity-50"
          >
            {generating === 'gray' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Gerar Cinza
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={!generatedColor || !generatedGray || saving}
          className="w-full flex items-center justify-center gap-2 border border-primary text-primary py-3 text-xs font-bold uppercase tracking-widest hover:bg-primary hover:text-primary-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Aprovar e Salvar (atualiza Jogador + Torcedor)
        </button>

        {(generatedColor || generatedGray) && (
          <button
            onClick={() => {
              setGeneratedColor(null)
              setGeneratedGray(null)
            }}
            className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground uppercase tracking-widest py-2"
          >
            <RotateCcw className="w-3 h-3" />
            Descartar previews
          </button>
        )}
      </div>

      {/* Preview */}
      <div className="space-y-4">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Preview (hover passa do cinza pra colorida)
        </p>

        <div className="group relative aspect-[4/5] bg-[#0a0a0a] overflow-hidden border border-border">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_60%,rgba(255,255,255,0.04)_0%,transparent_70%)]" />
          {graySrc ? (
            <img
              src={graySrc}
              alt="Capa cinza"
              className="absolute inset-0 w-full h-full object-contain p-10 transition-opacity duration-300 group-hover:opacity-0"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-white/30 uppercase tracking-widest">
              Sem versão cinza ainda
            </div>
          )}
          {colorSrc && (
            <img
              src={colorSrc}
              alt="Capa colorida"
              className="absolute inset-0 w-full h-full object-contain p-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="aspect-square bg-[#0a0a0a] border border-border relative">
            {graySrc ? (
              <img src={graySrc} alt="Cinza" className="w-full h-full object-contain p-4" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white/30 uppercase">
                Cinza
              </div>
            )}
            <div className="absolute bottom-1 left-1 text-[9px] uppercase text-white/40 tracking-widest">
              Cinza (default)
            </div>
          </div>
          <div className="aspect-square bg-[#0a0a0a] border border-border relative">
            {colorSrc ? (
              <img src={colorSrc} alt="Colorida" className="w-full h-full object-contain p-4" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white/30 uppercase">
                Colorida
              </div>
            )}
            <div className="absolute bottom-1 left-1 text-[9px] uppercase text-primary tracking-widest">
              Colorida (hover)
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
