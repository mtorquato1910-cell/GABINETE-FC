// Server Component wrapper — obtém sessão e passa como props para o Client
import { auth } from '@/lib/auth'
import { NavbarClient } from './NavbarClient'

export async function Navbar() {
  const session = await auth()
  const user = session?.user as { role?: string; name?: string | null } | undefined

  return (
    <NavbarClient
      isLoggedIn={!!session?.user}
      isAdmin={user?.role === 'admin'}
      userName={user?.name ?? undefined}
    />
  )
}
