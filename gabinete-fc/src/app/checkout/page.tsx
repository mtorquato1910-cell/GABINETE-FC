import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { CheckoutClient } from '@/components/checkout/CheckoutClient'
import { getUserAddresses } from '@/lib/actions/checkout'
import type { Address } from '@/types'

export const metadata: Metadata = { title: 'Checkout | Gabinete FC' }

export default async function CheckoutPage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/login?callbackUrl=/checkout')

  const dbAddresses = await getUserAddresses()
  const addresses: Address[] = dbAddresses.map(a => ({
    id: a.id,
    userId: a.userId,
    label: a.label,
    zipCode: a.zipCode,
    street: a.street,
    number: a.number,
    complement: a.complement,
    neighborhood: a.neighborhood,
    city: a.city,
    state: a.state,
    isDefault: a.isDefault,
  }))

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="px-4 md:px-6 py-6 border-b border-border">
          <h1 className="text-xl font-bold tracking-tighter uppercase">Checkout</h1>
        </div>
        <CheckoutClient existingAddresses={addresses} />
      </main>
      <Footer />
    </div>
  )
}
