'use server'
import { z } from 'zod'
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

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { error: { email: ['Email já cadastrado'] } }
  }

  // TODO Sprint 4: substituir por bcrypt.hash(password, 12)
  await prisma.user.create({
    data: { name, email, password, role: 'customer' },
  })

  return { success: true }
}
