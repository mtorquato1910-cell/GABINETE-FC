'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ShoppingCart, Check, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import InnerImageZoom from 'react-inner-image-zoom'
import 'react-inner-image-zoom/lib/styles.min.css'
import { useCartStore } from '@/stores/cart-store'
import { SocialProof } from '@/components/shared/SocialProof'
import { StockAlertButton } from '@/components/product/StockAlertButton'
import type { Product } from '@/types'

interface Props {
  product: Product
}

type CustomizationChoice = 'plain' | 'personalize' | null

const MAX_NAME = 12

export function ProductDetailClient({ product }: Props) {
  const addItem = useCartStore((s) => s.addItem)
  const [selectedSize, setSelectedSize] = useState('')
  const [choice, setChoice] = useState<CustomizationChoice>(null)
  const [customName, setCustomName] = useState('')
  const [customNumber, setCustomNumber] = useState('')

  // Galeria de imagens — índice da imagem atualmente exibida
  const galleryImages = product.images.length > 0
    ? product.images
    : ['/images/products/placeholder-jersey.svg']
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const currentImage = galleryImages[currentImageIndex] ?? galleryImages[0]
  const hasMultipleImages = galleryImages.length > 1

  const prevImage = () => {
    setCurrentImageIndex((i) => (i === 0 ? galleryImages.length - 1 : i - 1))
  }
  const nextImage = () => {
    setCurrentImageIndex((i) => (i === galleryImages.length - 1 ? 0 : i + 1))
  }

  const sanitizedName = customName.toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, MAX_NAME)
  const sanitizedNumber = customNumber.replace(/\D/g, '').slice(0, 2)
  const numberInRange =
    sanitizedNumber.length > 0 &&
    Number(sanitizedNumber) >= 1 &&
    Number(sanitizedNumber) <= 99

  const canAdd = useMemo(() => {
    if (!selectedSize) return false
    if (choice === null) return false
    if (choice === 'personalize') {
      return sanitizedName.length > 0 && numberInRange
    }
    return true
  }, [selectedSize, choice, sanitizedName, numberInRange])

  const blocker =
    !selectedSize
      ? 'Selecione um tamanho'
      : choice === null
        ? 'Escolha se quer personalizar'
        : choice === 'personalize' && !sanitizedName
          ? 'Digite o nome para a personalização'
          : choice === 'personalize' && !numberInRange
            ? 'Digite um número entre 1 e 99'
            : null

  const handleAdd = () => {
    if (!canAdd) {
      if (blocker) toast.error(blocker)
      return
    }
    addItem(
      product,
      selectedSize,
      1,
      choice === 'personalize'
        ? { name: sanitizedName, number: sanitizedNumber }
        : null
    )
    toast.success('Adicionado!', {
      description:
        choice === 'personalize'
          ? `${product.name} (${selectedSize}) · ${sanitizedName} #${sanitizedNumber}`
          : `${product.name} (${selectedSize}) no carrinho.`,
    })
    if (choice === 'personalize') {
      setCustomName('')
      setCustomNumber('')
      setChoice(null)
    }
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="px-4 md:px-6 py-4 border-b border-border">
        <Link
          href="/loja"
          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
        >
          <ArrowLeft className="w-3 h-3" /> Voltar
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-200px)]">
        {/* Galeria de imagens + lens magnifier */}
        <div className="bg-secondary p-6 lg:p-12 flex flex-col items-center justify-center min-h-[50vh] relative gap-4">
          {/* Imagem principal com lupa */}
          <div className="relative w-full max-w-[600px] gfc-zoom">
            <InnerImageZoom
              key={currentImage}
              src={currentImage}
              zoomSrc={currentImage}
              zoomType="hover"
              zoomScale={1.6}
              hideHint
              fullscreenOnMobile
              imgAttributes={{
                alt: `${product.name} — foto ${currentImageIndex + 1}`,
                className: 'w-full h-auto object-contain',
              }}
            />
            <div className="absolute top-2 right-2 bg-black/70 border border-primary/40 text-primary px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1 pointer-events-none">
              <Search className="w-3 h-3" />
              Lupa
            </div>

            {/* Setas de navegação (desktop) */}
            {hasMultipleImages && (
              <>
                <button
                  onClick={prevImage}
                  aria-label="Foto anterior"
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/70 border border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center z-10"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextImage}
                  aria-label="Próxima foto"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/70 border border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center z-10"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                {/* Contador */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 border border-[#1a1a1a] text-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em]">
                  {currentImageIndex + 1} / {galleryImages.length}
                </div>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {hasMultipleImages && (
            <div className="w-full max-w-[600px] flex gap-2 overflow-x-auto pb-1">
              {galleryImages.map((src, idx) => (
                <button
                  key={src + idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  aria-label={`Ver foto ${idx + 1}`}
                  className={`shrink-0 w-16 h-20 border-2 transition-colors ${
                    idx === currentImageIndex
                      ? 'border-primary'
                      : 'border-[#1a1a1a] hover:border-white/40'
                  }`}
                >
                  <img
                    src={src}
                    alt={`Miniatura ${idx + 1}`}
                    className="w-full h-full object-contain bg-white"
                  />
                </button>
              ))}
            </div>
          )}

          {choice === 'personalize' && (sanitizedName || sanitizedNumber) && (
            <div className="w-full max-w-xs border border-[#1a1a1a] bg-black p-4 flex flex-col items-center gap-1 transition-opacity">
              <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                Preview · costas
              </span>
              <span className="text-2xl font-bold tracking-[0.15em] text-white">
                {sanitizedName || '—'}
              </span>
              <span className="text-6xl font-bold leading-none text-primary">
                {sanitizedNumber || '0'}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-6 lg:p-16 flex flex-col justify-center gap-8 border-l border-border">
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              {product.badge && (
                <span className="inline-block bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 uppercase tracking-wider">
                  {product.badge}
                </span>
              )}
              <span className="inline-block bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 uppercase tracking-[0.2em]">
                {product.version === 'torcedor' ? 'Versão Torcedor' : 'Versão Jogador'}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase mb-2">
              {product.name}
            </h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">
              {product.team}
            </p>
          </div>

          <p className="text-muted-foreground text-sm leading-relaxed normal-case tracking-normal">
            {product.description}
          </p>

          {/* Price */}
          <div className="flex items-baseline gap-3 flex-wrap">
            {product.originalPrice && (
              <span className="text-lg text-muted-foreground line-through">
                R$ {product.originalPrice.toFixed(2)}
              </span>
            )}
            <span className="text-3xl font-bold">R$ {product.price.toFixed(2)}</span>
            <span className="text-xs text-primary uppercase tracking-widest">
              ou R$ {(product.price * 0.95).toFixed(2)} no Pix
            </span>
          </div>

          {/* Sizes */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
              1. Tamanho{' '}
              {selectedSize && (
                <span className="text-primary ml-2">— Selecionado: {selectedSize}</span>
              )}
            </p>
            <div className="flex gap-2 flex-wrap">
              {product.sizesAvailable.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`w-12 h-12 text-xs font-bold uppercase transition-colors ${
                    selectedSize === size
                      ? 'bg-foreground text-background'
                      : 'border border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Personalização */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
              2. Personalizar camisa?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setChoice('plain')
                  setCustomName('')
                  setCustomNumber('')
                }}
                className={`flex items-center justify-center gap-2 px-3 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
                  choice === 'plain'
                    ? 'bg-foreground text-background'
                    : 'border border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                }`}
              >
                {choice === 'plain' && <Check className="w-3 h-3" />}
                Deixar lisa
              </button>
              <button
                onClick={() => setChoice('personalize')}
                className={`flex items-center justify-center gap-2 px-3 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
                  choice === 'personalize'
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border text-muted-foreground hover:border-primary hover:text-primary'
                }`}
              >
                {choice === 'personalize' && <Check className="w-3 h-3" />}
                Personalizar
              </button>
            </div>

            {choice === 'personalize' && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="col-span-2">
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">
                    Nome · max {MAX_NAME} caracteres
                  </label>
                  <input
                    value={sanitizedName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="EX: TORQUATO"
                    maxLength={MAX_NAME}
                    className="bg-secondary border border-border px-3 py-2 text-sm w-full uppercase tracking-widest focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">
                    Nº · 1–99
                  </label>
                  <input
                    value={sanitizedNumber}
                    onChange={(e) => setCustomNumber(e.target.value)}
                    placeholder="10"
                    inputMode="numeric"
                    maxLength={2}
                    className="bg-secondary border border-border px-3 py-2 text-sm w-full text-center font-bold focus:outline-none focus:border-primary"
                  />
                </div>
                <p className="col-span-3 text-[10px] text-muted-foreground normal-case">
                  Personalização é gravada com o pedido e não pode ser alterada depois da compra.
                </p>
              </div>
            )}
          </div>

          {/* Social Proof */}
          <SocialProof productId={product.id} />

          {/* CTA */}
          {product.stock > 0 ? (
            <div className="flex flex-col gap-2">
              <button
                onClick={handleAdd}
                disabled={!canAdd}
                className={`w-full flex items-center justify-center gap-3 py-4 font-bold text-sm uppercase tracking-widest transition-colors ${
                  canAdd
                    ? 'bg-primary text-primary-foreground hover:bg-foreground hover:text-background'
                    : 'bg-secondary border border-border text-muted-foreground cursor-not-allowed'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                Adicionar ao Carrinho
              </button>
              {!canAdd && blocker && (
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground text-center">
                  {blocker}
                </p>
              )}
            </div>
          ) : (
            <StockAlertButton productId={product.id} size={selectedSize || 'Único'} />
          )}

          {/* Details */}
          <div className="grid grid-cols-2 gap-4 text-xs uppercase tracking-wider text-muted-foreground border-t border-border pt-6">
            <div>
              <span className="text-foreground font-bold block mb-1">Frete</span>
              <span className="text-primary">Grátis sempre</span>
            </div>
            <div>
              <span className="text-foreground font-bold block mb-1">Troca</span>
              Em até 30 dias
            </div>
            <div>
              <span className="text-foreground font-bold block mb-1">Estoque</span>
              {product.stock > 10
                ? 'Disponível'
                : product.stock > 0
                  ? `Últimas ${product.stock} unidades`
                  : 'Esgotado'}
            </div>
            <div>
              <span className="text-foreground font-bold block mb-1">Pagamento</span>
              Pix (5% off) ou Cartão
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
