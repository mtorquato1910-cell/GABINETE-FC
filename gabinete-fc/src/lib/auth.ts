// Wrapper de auth compatível com a antiga API NextAuth, agora usando Supabase Auth.
// Mantém auth() / requireAuth() / requireAdmin() com a mesma forma de retorno
// (session.user = { id, email, name, image, role }) — assim o resto do código não muda.

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

export interface AuthSession {
  user: {
    id: string
    email: string
    name: string | null
    image: string | null
    role: string
  }
}

/**
 * Lê a sessão atual do Supabase + role do banco Prisma.
 * Retorna null se não autenticado.
 */
export async function auth(): Promise<AuthSession | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Busca o profile correspondente no Prisma (sincronizado pela tabela public.users)
  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, name: true, image: true, role: true, deletedAt: true },
  })

  // Se não existe ainda, cria (1ª vez logando depois do confirm email)
  if (!profile) {
    const created = await prisma.user.create({
      data: {
        id: user.id,
        email: user.email!,
        name: (user.user_metadata?.name as string | undefined) ?? null,
        role: 'customer',
      },
      select: { id: true, email: true, name: true, image: true, role: true },
    })
    return { user: { ...created } }
  }

  // Soft delete: usuário deletado não tem sessão válida.
  // Faz signOut do Supabase pra invalidar JWT atual e retorna null.
  if (profile.deletedAt) {
    await supabase.auth.signOut()
    return null
  }

  return {
    user: {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      image: profile.image,
      role: profile.role,
    },
  }
}

/**
 * Guard pra Server Actions — exige usuário autenticado.
 */
export async function requireAuth(): Promise<AuthSession> {
  const session = await auth()
  if (!session) throw new Error('Não autenticado')
  return session
}

/**
 * Guard pra Server Actions — exige role=admin.
 */
export async function requireAdmin(): Promise<AuthSession> {
  const session = await auth()
  if (!session) throw new Error('Não autenticado')
  if (session.user.role !== 'admin') throw new Error('Acesso negado — apenas admins')
  return session
}

/**
 * Sign out (server action helper)
 */
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}
