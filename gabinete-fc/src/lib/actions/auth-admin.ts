'use server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Informe a senha'),
})

/**
 * Login do painel administrativo. Só aceita usuários com role = 'admin'.
 * Contas customer são rejeitadas com mensagem genérica ("Credenciais inválidas")
 * pra evitar enumeração de admins.
 */
export async function loginAdmin(data: { email: string; password: string }) {
  const parsed = loginSchema.safeParse(data)
  if (!parsed.success) {
    return { error: 'Credenciais inválidas' }
  }

  const supabase = await createClient()
  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error || !signInData.user) {
    return { error: 'Credenciais inválidas' }
  }

  const profile = await prisma.user.findUnique({
    where: { id: signInData.user.id },
    select: { role: true },
  })

  if (profile?.role !== 'admin') {
    // Não é admin — faz signOut imediato pra não criar sessão pendurada
    await supabase.auth.signOut()
    return { error: 'Credenciais inválidas' }
  }

  revalidatePath('/', 'layout')
  redirect('/admin/dashboard')
}
