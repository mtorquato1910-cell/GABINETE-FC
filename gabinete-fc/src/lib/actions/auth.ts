'use server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
})

export async function registerUser(data: unknown) {
  const parsed = registerSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { name, email, password } = parsed.data
  const supabase = await createClient()

  // Supabase signup → envia email de verificação automaticamente
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (authError) {
    if (authError.message.toLowerCase().includes('already')) {
      return { error: { email: ['Email já cadastrado'] } }
    }
    return { error: { email: [authError.message] } }
  }

  if (!authData.user) {
    return { error: { email: ['Erro ao criar conta'] } }
  }

  // Cria o profile correspondente no Prisma (mesmo id do auth.users)
  await prisma.user.upsert({
    where: { id: authData.user.id },
    update: { name, email },
    create: {
      id: authData.user.id,
      email,
      name,
      role: 'customer',
    },
  })

  return { success: true, requireEmailConfirmation: true }
}

export async function loginUser(data: { email: string; password: string }) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })
  if (error) {
    return { error: 'Email ou senha incorretos' }
  }
  return { success: true }
}

export async function logoutUser() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return { success: true }
}
