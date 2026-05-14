'use server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { isValidCpf } from '@/lib/masks'

const profileSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  phone: z.string().refine((v) => v.replace(/\D/g, '').length >= 10, 'Telefone inválido'),
  cpf: z.string().refine(isValidCpf, 'CPF inválido'),
})

export async function updateProfile(data: unknown) {
  const session = await requireAuth()
  const userId = session.user.id
  const parsed = profileSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const cpf = parsed.data.cpf.replace(/\D/g, '')
  const phone = parsed.data.phone.replace(/\D/g, '')

  // Verifica conflito de CPF (se já existe em outro usuário)
  const conflict = await prisma.user.findFirst({
    where: { cpf, NOT: { id: userId } },
    select: { id: true },
  })
  if (conflict) {
    return { error: { cpf: ['Este CPF já está cadastrado em outra conta'] } }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { name: parsed.data.name, phone, cpf },
  })

  revalidatePath('/minha-conta')
  revalidatePath('/minha-conta/dados-pessoais')
  return { success: true }
}

const addressSchema = z.object({
  label: z.string().min(1, 'Identifique o endereço (ex: Casa, Trabalho)'),
  recipientName: z.string().min(2, 'Nome do destinatário obrigatório'),
  recipientCpf: z.string().refine(isValidCpf, 'CPF do destinatário inválido'),
  recipientPhone: z.string().refine((v) => v.replace(/\D/g, '').length >= 10, 'Telefone inválido'),
  zipCode: z.string().refine((v) => /^\d{8}$/.test(v.replace(/\D/g, '')), 'CEP inválido (8 dígitos)'),
  street: z.string().min(3, 'Rua obrigatória'),
  number: z.string().min(1, 'Número obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, 'Bairro obrigatório'),
  city: z.string().min(2, 'Cidade obrigatória'),
  state: z.string().length(2, 'UF com 2 letras'),
  isDefault: z.boolean().default(false),
})

function normalizeAddress(input: z.infer<typeof addressSchema>) {
  return {
    label: input.label,
    recipientName: input.recipientName.trim(),
    recipientCpf: input.recipientCpf.replace(/\D/g, ''),
    recipientPhone: input.recipientPhone.replace(/\D/g, ''),
    zipCode: input.zipCode.replace(/\D/g, ''),
    street: input.street.trim(),
    number: input.number.trim(),
    complement: input.complement?.trim() || null,
    neighborhood: input.neighborhood.trim(),
    city: input.city.trim(),
    state: input.state.toUpperCase().slice(0, 2),
    isDefault: input.isDefault,
  }
}

export async function createAddress(data: unknown) {
  const session = await requireAuth()
  const userId = session.user.id
  const parsed = addressSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const payload = normalizeAddress(parsed.data)

  // Transação atômica: garante invariante "1 endereço default por user"
  // mesmo com requests simultâneos.
  const address = await prisma.$transaction(async (tx) => {
    const count = await tx.address.count({ where: { userId } })
    const shouldBeDefault = payload.isDefault || count === 0
    if (shouldBeDefault) {
      await tx.address.updateMany({ where: { userId }, data: { isDefault: false } })
    }
    return tx.address.create({
      data: { ...payload, isDefault: shouldBeDefault, userId },
    })
  })

  revalidatePath('/minha-conta/enderecos')
  revalidatePath('/checkout')
  return { success: true, addressId: address.id }
}

export async function updateAddress(addressId: string, data: unknown) {
  const session = await requireAuth()
  const userId = session.user.id
  const parsed = addressSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  // Ownership-safe query (não revela existência de IDs de outros users)
  const existing = await prisma.address.findFirst({
    where: { id: addressId, userId },
    select: { id: true },
  })
  if (!existing) return { error: 'Endereço não encontrado' }

  const payload = normalizeAddress(parsed.data)

  await prisma.$transaction(async (tx) => {
    if (payload.isDefault) {
      await tx.address.updateMany({
        where: { userId, NOT: { id: addressId } },
        data: { isDefault: false },
      })
    }
    await tx.address.update({ where: { id: addressId }, data: payload })
  })

  revalidatePath('/minha-conta/enderecos')
  revalidatePath('/checkout')
  return { success: true }
}

export async function deleteAddress(addressId: string) {
  const session = await requireAuth()
  const userId = session.user.id

  const existing = await prisma.address.findFirst({
    where: { id: addressId, userId },
    select: { id: true, isDefault: true },
  })
  if (!existing) return { error: 'Endereço não encontrado' }

  await prisma.$transaction(async (tx) => {
    await tx.address.delete({ where: { id: addressId } })
    if (existing.isDefault) {
      const next = await tx.address.findFirst({ where: { userId }, orderBy: { id: 'asc' } })
      if (next) await tx.address.update({ where: { id: next.id }, data: { isDefault: true } })
    }
  })

  revalidatePath('/minha-conta/enderecos')
  revalidatePath('/checkout')
  return { success: true }
}

export async function setDefaultAddress(addressId: string) {
  const session = await requireAuth()
  const userId = session.user.id

  const existing = await prisma.address.findFirst({
    where: { id: addressId, userId },
    select: { id: true },
  })
  if (!existing) return { error: 'Endereço não encontrado' }

  await prisma.$transaction(async (tx) => {
    await tx.address.updateMany({ where: { userId }, data: { isDefault: false } })
    await tx.address.update({ where: { id: addressId }, data: { isDefault: true } })
  })

  revalidatePath('/minha-conta/enderecos')
  revalidatePath('/checkout')
  return { success: true }
}

// Onboarding pós-cadastro: cria perfil + primeiro endereço numa única chamada
const onboardingSchema = z.object({
  phone: z.string().refine((v) => v.replace(/\D/g, '').length >= 10, 'Telefone inválido'),
  cpf: z.string().refine(isValidCpf, 'CPF inválido'),
  zipCode: z.string().refine((v) => /^\d{8}$/.test(v.replace(/\D/g, '')), 'CEP inválido'),
  street: z.string().min(3, 'Rua obrigatória'),
  number: z.string().min(1, 'Número obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, 'Bairro obrigatório'),
  city: z.string().min(2, 'Cidade obrigatória'),
  state: z.string().length(2, 'UF com 2 letras'),
})

export async function completeOnboarding(data: unknown) {
  const session = await requireAuth()
  const userId = session.user.id
  const parsed = onboardingSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const cpf = parsed.data.cpf.replace(/\D/g, '')
  const phone = parsed.data.phone.replace(/\D/g, '')

  const conflict = await prisma.user.findFirst({
    where: { cpf, NOT: { id: userId } },
    select: { id: true },
  })
  if (conflict) return { error: { cpf: ['Este CPF já está em outra conta'] } }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } })

  await prisma.user.update({ where: { id: userId }, data: { phone, cpf } })

  await prisma.address.create({
    data: {
      userId,
      label: 'Casa',
      recipientName: user?.name ?? 'Cliente',
      recipientCpf: cpf,
      recipientPhone: phone,
      zipCode: parsed.data.zipCode.replace(/\D/g, ''),
      street: parsed.data.street.trim(),
      number: parsed.data.number.trim(),
      complement: parsed.data.complement?.trim() || null,
      neighborhood: parsed.data.neighborhood.trim(),
      city: parsed.data.city.trim(),
      state: parsed.data.state.toUpperCase().slice(0, 2),
      isDefault: true,
    },
  })

  revalidatePath('/minha-conta')
  return { success: true }
}
