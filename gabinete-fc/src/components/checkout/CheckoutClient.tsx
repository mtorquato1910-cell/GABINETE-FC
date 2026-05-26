'use client'
import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/stores/cart-store'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { saveAddress, createOrder, validateCoupon } from '@/lib/actions/checkout'
import { formatPrice } from '@/lib/db-helpers'
import { lookupCep } from '@/lib/cep'
import { maskCpf, maskPhone } from '@/lib/masks'
import { gtmEvents } from '@/lib/gtm'
import type { Address } from '@/types'

type Step = 'address' | 'review'

interface Props {
  existingAddresses: Address[]
}

export function CheckoutClient({ existingAddresses }: Props) {
  const router = useRouter()
  const { items, totalPrice } = useCartStore()
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState<Step>('address')
  const [selectedAddressId, setSelectedAddressId] = useState(
    existingAddresses.find(a => a.isDefault)?.id ?? existingAddresses[0]?.id ?? ''
  )
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [showNewAddress, setShowNewAddress] = useState(existingAddresses.length === 0)
  const [newAddr, setNewAddr] = useState({
    label: 'Casa', recipientName: '', recipientCpf: '', recipientPhone: '',
    street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: '',
  })

  // ─── Estado de checkout ───
  const [cepLoading, setCepLoading] = useState(false)
  const [addrErrors, setAddrErrors] = useState<Record<string, string[]>>({})

  const subtotal = totalPrice()
  const freight = 0 // Política Gabinete FC: frete sempre grátis (Sprint 6)
  const total = subtotal + freight - couponDiscount
  const itemCount = items.reduce((acc, i) => acc + i.quantity, 0)

  // begin_checkout (GA4) — dispara uma única vez quando o usuário entra no checkout com itens
  const beginFiredRef = useRef(false)
  useEffect(() => {
    if (beginFiredRef.current || items.length === 0) return
    beginFiredRef.current = true
    gtmEvents.beginCheckout(
      items.map((i) => ({
        item_id: i.product.id,
        item_name: i.product.name,
        price: i.product.price,
        quantity: i.quantity,
        item_variant: i.size,
      })),
      subtotal,
    )
  }, [items, subtotal])

  if (items.length === 0) {
    router.push('/carrinho')
    return null
  }

  const handleApplyCoupon = () => {
    startTransition(async () => {
      const result = await validateCoupon(couponCode, subtotal, itemCount)
      if (result.valid) {
        setCouponDiscount(result.discount ?? 0)
        toast.success(`Cupom aplicado! -${formatPrice(result.discount ?? 0)}`)
      } else {
        toast.error(result.message)
      }
    })
  }

  const handleCepBlur = async () => {
    const digits = newAddr.zipCode.replace(/\D/g, '')
    if (digits.length !== 8) return
    setCepLoading(true)
    const result = await lookupCep(digits)
    setCepLoading(false)
    if (result) {
      setNewAddr((a) => ({
        ...a,
        street: a.street || result.street,
        neighborhood: a.neighborhood || result.neighborhood,
        city: a.city || result.city,
        state: a.state || result.state,
      }))
      toast.success('Endereço preenchido pelo CEP')
    } else {
      toast.warning('CEP não encontrado — preencha manualmente')
    }
  }

  const handleSaveNewAddress = async () => {
    setAddrErrors({})
    const result = await saveAddress({
      ...newAddr,
      zipCode: newAddr.zipCode.replace(/\D/g, ''),
      recipientCpf: newAddr.recipientCpf.replace(/\D/g, ''),
      recipientPhone: newAddr.recipientPhone.replace(/\D/g, ''),
    })
    if ('error' in result) {
      const fieldErrors = result.error as Record<string, string[]>
      setAddrErrors(fieldErrors)
      const firstKey = Object.keys(fieldErrors)[0]
      const firstMsg = fieldErrors[firstKey]?.[0] ?? 'Verifique os dados'
      toast.error(firstMsg)
      return null
    }
    return result.addressId
  }

  const handleProceedToReview = () => {
    if (!showNewAddress && !selectedAddressId) {
      toast.error('Selecione um endereço')
      return
    }
    setStep('review')
  }

  // Cria order + link Infinity Pay → redireciona pro checkout hosted
  const handleProceedToPayment = () => {
    startTransition(async () => {
      let addrId = selectedAddressId
      if (showNewAddress) {
        const savedId = await handleSaveNewAddress()
        if (!savedId) return
        addrId = savedId
      }

      // 1) Cria order no banco (status pending)
      const result = await createOrder({
        addressId: addrId,
        paymentMethod: 'infinitepay',
        couponCode: couponCode || undefined,
        items: items.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          productImage: item.product.images[0] ?? '',
          size: item.size,
          quantity: item.quantity,
          unitPrice: item.product.price,
          hasCustomization: !!item.hasCustomization,
          customName: item.hasCustomization ? item.customName ?? null : null,
          customNumber: item.hasCustomization ? item.customNumber ?? null : null,
        })),
        freightCost: freight,
      })

      if ('error' in result || !result.orderId) {
        const details = (result as { details?: Array<{ path: string; message: string }> })
          .details
        if (details && details.length > 0) {
          const firstError = details[0]
          toast.error(`Erro: ${firstError.path} — ${firstError.message}`)
          console.error('[createOrder] detalhes do erro Zod:', details)
        } else {
          toast.error('Erro ao criar pedido')
        }
        return
      }

      // 2) Pede o link de pagamento da Infinity Pay
      const linkRes = await fetch('/api/infinitepay/create-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: result.orderId }),
      })

      if (!linkRes.ok) {
        toast.error('Erro ao iniciar pagamento. Tente novamente.')
        return
      }

      const { url } = (await linkRes.json()) as { url?: string }
      if (!url) {
        toast.error('Link de pagamento inválido')
        return
      }

      // 3) Redireciona pro checkout hosted da Infinity Pay
      window.location.href = url
    })
  }

  // Estilo dinâmico: cinza vazio · verde quando preenchido/focado · vermelho com erro
  const inputClassFor = (value: string, fieldName?: string) => {
    const filled = value.trim().length > 0
    const hasError = fieldName ? !!addrErrors[fieldName]?.[0] : false
    const border = hasError
      ? 'border-destructive focus:border-destructive'
      : filled
        ? 'border-primary/40 focus:border-primary'
        : 'border-border focus:border-primary'
    return `bg-secondary border ${border} px-3 py-2 text-sm focus:outline-none placeholder:text-muted-foreground normal-case tracking-normal w-full transition-colors`
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress */}
      <div className="px-4 md:px-6 py-6 border-b border-border">
        <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest">
          {(['address', 'review'] as Step[]).map((s, i) => (
            <span key={s} className={step === s ? 'text-primary' : 'text-muted-foreground'}>
              {i + 1}. {s === 'address' ? 'Endereço' : 'Revisão'}
            </span>
          ))}
          <span className="text-muted-foreground">3. Pagamento (Infinity Pay)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
        {/* Main */}
        <div className="lg:col-span-2 border-r border-border p-6">
          {/* Step: Address */}
          {step === 'address' && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest mb-6">Endereço de Entrega</h2>
              {existingAddresses.length > 0 && !showNewAddress && (
                <div className="flex flex-col gap-3 mb-6">
                  {existingAddresses.map((addr) => (
                    <label key={addr.id} className={`flex gap-3 p-4 border cursor-pointer transition-colors ${selectedAddressId === addr.id ? 'border-primary' : 'border-border hover:border-muted-foreground'}`}>
                      <input type="radio" value={addr.id} checked={selectedAddressId === addr.id} onChange={() => setSelectedAddressId(addr.id)} className="mt-1" />
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider">{addr.label}</p>
                        <p className="text-xs text-muted-foreground normal-case">
                          {addr.street}, {addr.number} — {addr.city}/{addr.state} — CEP {addr.zipCode}
                        </p>
                      </div>
                    </label>
                  ))}
                  <button onClick={() => setShowNewAddress(true)} className="text-xs text-primary uppercase tracking-widest hover:underline text-left mt-2">
                    + Novo endereço
                  </button>
                </div>
              )}
              {showNewAddress && (
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="col-span-2">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Nome do destinatário</label>
                    <input value={newAddr.recipientName} onChange={e => setNewAddr(a => ({...a, recipientName: e.target.value}))} placeholder="Nome completo" className={inputClassFor(newAddr.recipientName, 'recipientName')} />
                    {addrErrors.recipientName?.map((err) => <p key={err} className="text-[10px] text-destructive normal-case mt-1">{err}</p>)}
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">CPF *</label>
                    <input value={newAddr.recipientCpf} onChange={e => setNewAddr(a => ({...a, recipientCpf: maskCpf(e.target.value)}))} placeholder="000.000.000-00" maxLength={14} className={inputClassFor(newAddr.recipientCpf, 'recipientCpf')} />
                    {addrErrors.recipientCpf?.map((err) => <p key={err} className="text-[10px] text-destructive normal-case mt-1">{err}</p>)}
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Telefone *</label>
                    <input value={newAddr.recipientPhone} onChange={e => setNewAddr(a => ({...a, recipientPhone: maskPhone(e.target.value)}))} placeholder="(00) 00000-0000" maxLength={15} className={inputClassFor(newAddr.recipientPhone, 'recipientPhone')} />
                    {addrErrors.recipientPhone?.map((err) => <p key={err} className="text-[10px] text-destructive normal-case mt-1">{err}</p>)}
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] text-muted-foreground normal-case">
                      * CPF e telefone são obrigatórios para o despacho.
                    </p>
                  </div>
                  <div className="relative">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">CEP</label>
                    <input value={newAddr.zipCode} onChange={e => setNewAddr(a => ({...a, zipCode: e.target.value.replace(/\D/g,'').slice(0,8)}))} onBlur={handleCepBlur} placeholder="00000000" maxLength={8} className={inputClassFor(newAddr.zipCode, 'zipCode')} />
                    {cepLoading && <Loader2 className="absolute right-2 top-[34px] w-3 h-3 animate-spin text-primary" />}
                    {addrErrors.zipCode?.map((err) => <p key={err} className="text-[10px] text-destructive normal-case mt-1">{err}</p>)}
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Rua</label>
                    <input value={newAddr.street} onChange={e => setNewAddr(a => ({...a, street: e.target.value}))} className={inputClassFor(newAddr.street, 'street')} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Número</label>
                    <input value={newAddr.number} onChange={e => setNewAddr(a => ({...a, number: e.target.value}))} className={inputClassFor(newAddr.number, 'number')} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Complemento</label>
                    <input value={newAddr.complement} onChange={e => setNewAddr(a => ({...a, complement: e.target.value}))} placeholder="Opcional" className={inputClassFor(newAddr.complement)} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Bairro</label>
                    <input value={newAddr.neighborhood} onChange={e => setNewAddr(a => ({...a, neighborhood: e.target.value}))} className={inputClassFor(newAddr.neighborhood, 'neighborhood')} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Cidade</label>
                    <input value={newAddr.city} onChange={e => setNewAddr(a => ({...a, city: e.target.value}))} className={inputClassFor(newAddr.city, 'city')} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Estado (UF)</label>
                    <input value={newAddr.state} onChange={e => setNewAddr(a => ({...a, state: e.target.value.toUpperCase().slice(0,2)}))} maxLength={2} placeholder="SP" className={inputClassFor(newAddr.state, 'state')} />
                  </div>
                  {existingAddresses.length > 0 && (
                    <button onClick={() => setShowNewAddress(false)} className="col-span-2 text-xs text-muted-foreground uppercase tracking-widest hover:text-primary text-left">
                      ← Usar endereço cadastrado
                    </button>
                  )}
                </div>
              )}
              <button onClick={handleProceedToReview} className="w-full py-4 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors">
                Continuar →
              </button>
            </div>
          )}

          {/* Step: Review */}
          {step === 'review' && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest mb-6">Resumo do Pedido</h2>
              <div className="flex flex-col gap-3 mb-6">
                {items.map(item => (
                  <div key={item.lineId} className="flex justify-between items-center text-xs border-b border-border pb-3">
                    <div>
                      <p className="font-bold uppercase tracking-wider">{item.product.name}</p>
                      <p className="text-muted-foreground">Tam: {item.size} · Qtd: {item.quantity}</p>
                      {item.hasCustomization && item.customName && item.customNumber && (
                        <p className="text-primary text-[10px] uppercase tracking-widest mt-1">
                          ⚡ {item.customName} · #{item.customNumber}
                        </p>
                      )}
                    </div>
                    <span className="font-bold">{formatPrice(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              {/* Coupon */}
              <div className="flex gap-2 mb-6">
                <input
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="CUPOM"
                  className="flex-1 bg-secondary border border-border px-3 py-2 text-xs focus:outline-none focus:border-primary uppercase tracking-wider"
                />
                <button onClick={handleApplyCoupon} disabled={!couponCode || isPending} className="px-4 py-2 border border-border text-xs font-bold uppercase tracking-widest hover:border-primary hover:text-primary transition-colors disabled:opacity-50">
                  Aplicar
                </button>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setStep('address')} className="flex-1 py-4 border border-border font-bold text-xs uppercase tracking-widest hover:border-primary hover:text-primary transition-colors">
                  ← Voltar
                </button>
                <button onClick={handleProceedToPayment} disabled={isPending} className="flex-1 py-4 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors disabled:opacity-50">
                  {isPending ? 'Redirecionando...' : 'Ir para Pagamento →'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order summary sidebar */}
        <div className="p-6">
          <h3 className="text-[10px] font-bold uppercase tracking-widest border-b border-border pb-4 mb-4">Resumo</h3>
          <div className="flex flex-col gap-3 text-xs uppercase tracking-widest">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span>{freight === 0 ? <span className="text-primary">Grátis</span> : formatPrice(freight)}</span></div>
            {couponDiscount > 0 && <div className="flex justify-between text-primary"><span>Cupom</span><span>-{formatPrice(couponDiscount)}</span></div>}
            <div className="flex justify-between font-bold text-sm border-t border-border pt-3"><span>Total</span><span>{formatPrice(total)}</span></div>
          </div>

          {/* Métodos de pagamento aceitos */}
          <div className="mt-6 border-t border-border pt-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest mb-3">
              Pagamento aceito
            </h4>
            <ul className="flex flex-col gap-1.5 text-[11px] text-muted-foreground normal-case">
              <li>⚡ <span className="text-primary font-bold">Pix</span> — instantâneo</li>
              <li>💳 Cartão de crédito até 8x sem juros</li>
              <li>💳 Cartão de débito</li>
            </ul>
            <p className="text-[10px] text-muted-foreground normal-case tracking-normal mt-3">
              Pagamento processado por Infinity Pay (CloudWalk). Você será
              redirecionado pra um checkout seguro.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
