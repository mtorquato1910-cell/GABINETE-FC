'use server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
})

export async function registerUser(data: unknown) {
  try {
    const parsed = registerSchema.safeParse(data)
    if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

    const { name, email, password } = parsed.data
    const supabase = await createClient()

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      'http://localhost:3000'

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${baseUrl}/auth/callback`,
      },
    })

    if (authError) {
      const msg = authError.message.toLowerCase()
      if (msg.includes('already') || msg.includes('registered')) {
        return { error: { email: ['Email já cadastrado'] } }
      }
      if (msg.includes('weak') || msg.includes('password')) {
        return { error: { password: ['Senha muito fraca — use mais caracteres'] } }
      }
      return { error: { email: [authError.message] } }
    }

    if (!authData.user) {
      return { error: { email: ['Erro ao criar conta — tente novamente'] } }
    }

    // Não criamos o profile no Prisma aqui — o callback (após confirmação de email)
    // chama ensureProfile() automaticamente. Isso evita constraints duplicados
    // se o usuário tentar se cadastrar mais de uma vez.

    return { success: true, requireEmailConfirmation: true }
  } catch (err) {
    console.error('[registerUser] Unexpected error:', err)
    return { error: { email: ['Erro interno — tente novamente em alguns minutos'] } }
  }
}

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Informe a senha'),
})

/**
 * Login server-side com redirect + revalidate.
 * Em caso de erro, retorna { error } sem redirect.
 * Em caso de sucesso, lança redirect() — quem chama NÃO deve tentar usar router.push.
 */
export async function loginUser(data: { email: string; password: string; callbackUrl?: string }) {
  const parsed = loginSchema.safeParse(data)
  if (!parsed.success) {
    return { error: 'Email ou senha inválidos' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('email not confirmed') || msg.includes('confirm')) {
      return { error: 'Confirme seu email antes de entrar — verifique sua caixa de entrada' }
    }
    return { error: 'Email ou senha incorretos' }
  }

  // Revalida todos os layouts pra middleware enxergar a sessão nova
  revalidatePath('/', 'layout')

  // Redirect server-side garante que o middleware veja os cookies atualizados
  redirect(data.callbackUrl && data.callbackUrl.startsWith('/') ? data.callbackUrl : '/minha-conta')
}

export async function logoutUser() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}
