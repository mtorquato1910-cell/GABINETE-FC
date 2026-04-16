'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/stores/cart-store'
import { toast } from 'sonner'
import { saveAddress, createOrder, validateCoupon } from '@/lib/actions/checkout'
import { formatPrice } from '@/lib/db-helpers'
import type { Address } from '@/types'

type Step = 'address' | 'review' | 'payment'

interface Props {
  existingAddresses: Address[]
}

export function CheckoutClient({ existingAddresses }: Props) {
  const router = useRouter()
  const { items, totalPrice, clearCart } = useCartStore()
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState<Step>('address')
  const [selectedAddressId, setSelectedAddressId] = useState(
    existingAddresses.find(a => a.isDefault)?.id ?? existingAddresses[0]?.id ?? ''
  )
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card' | 'debit_card'>('pix')
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [showNewAddress, setShowNewAddress] = useState(existingAddresses.length === 0)
  const [newAddr, setNewAddr] = useState({
    label: 'Casa', recipientName: '', street: '', number: '',
    complement: '', neighborhood: '', city: '', state: '', zipCode: '',
  })

  const subtotal = totalPrice()
  const freight = subtotal >= 500 ? 0 : 29.9
  const pixDiscount = paymentMethod === 'pix' ? subtotal * 0.05 : 0
  const total = subtotal + freight - couponDiscount - pixDiscount

  if (items.length === 0) {
    router.push('/carrinho')
    return null
  }

  const handleApplyCoupon = () => {
    startTransition(async () => {
      const result = await validateCoupon(couponCode, subtotal)
      if (result.valid) {
        setCouponDiscount(result.discount ?? 0)
        toast.success(`Cupom aplicado! -${formatPrice(result.discount ?? 0)}`)
      } else {
        toast.error(result.message)
      }
    })
  }

  const handleSaveNewAddress = async () => {
    const result = await saveAddress({ ...newAddr, zipCode: newAddr.zipCode.replace(/\D/g, '') })
    if ('error' in result) {
      toast.error('Verifique o endereço')
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

  const handlePlaceOrder = () => {
    startTransition(async () => {
      let addrId = selectedAddressId
      if (showNewAddress) {
        const savedId = await handleSaveNewAddress()
        if (!savedId) return
        addrId = savedId
      }

      const result = await createOrder({
        addressId: addrId,
        paymentMethod,
        couponCode: couponCode || undefined,
        items: items.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          productImage: item.product.images[0] ?? '',
          size: item.size,
          quantity: item.quantity,
          unitPrice: item.product.price,
        })),
        freightCost: freight,
      })

      if ('error' in result) {
        toast.error('Erro ao criar pedido')
        return
      }

      clearCart()
      router.push(`/checkout/sucesso?orderId=${result.orderId}`)
    })
  }

  const inputClass = 'bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:border-primary placeholder:text-muted-foreground normal-case tracking-normal w-full'

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress */}
      <div className="px-4 md:px-6 py-6 border-b border-border">
        <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest">
          {(['address', 'review', 'payment'] as Step[]).map((s, i) => (
            <span key={s} className={step === s ? 'text-primary' : 'text-muted-foreground'}>
              {i + 1}. {s === 'address' ? 'Endereço' : s === 'review' ? 'Revisão' : 'Pagamento'}
            </span>
          ))}
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
                    <input value={newAddr.recipientName} onChange={e => setNewAddr(a => ({...a, recipientName: e.target.value}))} placeholder="Nome completo" className={inputClass} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">CEP</label>
                    <input value={newAddr.zipCode} onChange={e => setNewAddr(a => ({...a, zipCode: e.target.value}))} placeholder="00000000" maxLength={8} className={inputClass} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Rua</label>
                    <input value={newAddr.street} onChange={e => setNewAddr(a => ({...a, street: e.target.value}))} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Número</label>
                    <input value={newAddr.number} onChange={e => setNewAddr(a => ({...a, number: e.target.value}))} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Complemento</label>
                    <input value={newAddr.complement} onChange={e => setNewAddr(a => ({...a, complement: e.target.value}))} placeholder="Opcional" className={inputClass} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Bairro</label>
                    <input value={newAddr.neighborhood} onChange={e => setNewAddr(a => ({...a, neighborhood: e.target.value}))} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Cidade</label>
                    <input value={newAddr.city} onChange={e => setNewAddr(a => ({...a, city: e.target.value}))} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Estado (UF)</label>
                    <input value={newAddr.state} onChange={e => setNewAddr(a => ({...a, state: e.target.value.toUpperCase().slice(0,2)}))} maxLength={2} placeholder="SP" className={inputClass} />
                  </div>
                  {existingAddresses.length > 0 && (
                    <button onClick={() => setShowNewAddress(false)} className="col-span-2 text-xs text-muted-foreground uppercase tracking-widest hover:text-primary text-left">
                      ← Usar endereço existente
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
                  <div key={`${item.product.id}-${item.size}`} className="flex justify-between items-center text-xs border-b border-border pb-3">
                    <div>
                      <p className="font-bold uppercase tracking-wider">{item.product.name}</p>
                      <p className="text-muted-foreground">Tam: {item.size} · Qtd: {item.quantity}</p>
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
                <button onClick={() => setStep('payment')} className="flex-1 py-4 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors">
                  Pagamento →
                </button>
              </div>
            </div>
          )}

          {/* Step: Payment */}
          {step === 'payment' && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest mb-6">Forma de Pagamento</h2>
              <div className="flex flex-col gap-3 mb-8">
                {[
                  { value: 'pix', label: 'Pix', desc: '5% de desconto · Pagamento instantâneo' },
                  { value: 'credit_card', label: 'Cartão de Crédito', desc: 'Até 12x sem juros acima de R$ 300' },
                  { value: 'debit_card', label: 'Cartão de Débito', desc: 'Desconto de débito' },
                ].map(opt => (
                  <label key={opt.value} className={`flex gap-3 p-4 border cursor-pointer transition-colors ${paymentMethod === opt.value ? 'border-primary' : 'border-border hover:border-muted-foreground'}`}>
                    <input type="radio" value={opt.value} checked={paymentMethod === opt.value} onChange={() => setPaymentMethod(opt.value as typeof paymentMethod)} className="mt-1" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider">{opt.label}</p>
                      <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              {paymentMethod === 'pix' && (
                <div className="bg-secondary border border-border p-4 mb-6 text-xs">
                  <p className="font-bold uppercase tracking-widest mb-1 text-primary">Pix — 5% de desconto</p>
                  <p className="text-muted-foreground">Após confirmar, você receberá o QR Code do Pix. Válido por 60 minutos.</p>
                </div>
              )}
              <div className="flex gap-4">
                <button onClick={() => setStep('review')} className="flex-1 py-4 border border-border font-bold text-xs uppercase tracking-widest hover:border-primary hover:text-primary transition-colors">
                  ← Voltar
                </button>
                <button onClick={handlePlaceOrder} disabled={isPending} className="flex-1 py-4 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors disabled:opacity-50">
                  {isPending ? 'Processando...' : `Confirmar — ${formatPrice(total)}`}
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
            {pixDiscount > 0 && <div className="flex justify-between text-primary"><span>Desconto Pix</span><span>-{formatPrice(pixDiscount)}</span></div>}
            <div className="flex justify-between font-bold text-sm border-t border-border pt-3"><span>Total</span><span>{formatPrice(total)}</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}
