'use server'
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { stringifyJsonField, parseJsonField } from '@/lib/db-helpers'

const COVERS_DIR = path.join(process.cwd(), 'public', 'images', 'products', 'copa2026', 'covers')

const saveSchema = z.object({
  slug: z.string().min(1),
  colorBase64: z.string().min(1),
  /** @deprecated não é mais usado — gray é derivado da color via sharp */
  grayBase64: z.string().optional(),
})

function getBaseSlug(slug: string): string {
  return slug.replace(/-torcedor$/, '')
}

function getPairSlugs(slug: string): string[] {
  const base = getBaseSlug(slug)
  return [base, `${base}-torcedor`]
}

export async function saveCover(input: unknown) {
  await requireAdmin()
  const parsed = saveSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { slug, colorBase64 } = parsed.data
  const baseSlug = getBaseSlug(slug)
  const candidates = getPairSlugs(slug)

  await fs.mkdir(COVERS_DIR, { recursive: true })
  const colorFile = `${baseSlug}-cover-color.webp`
  const grayFile = `${baseSlug}-cover-gray.webp`

  const colorBuffer = Buffer.from(colorBase64, 'base64')

  await sharp(colorBuffer)
    .resize(1024, 1280, { fit: 'cover', position: 'centre' })
    .webp({ quality: 95 })
    .toFile(path.join(COVERS_DIR, colorFile))
  // Cinza derivada da colorida (composição idêntica + tons escuros estilo Lovable)
  await sharp(colorBuffer)
    .resize(1024, 1280, { fit: 'cover', position: 'centre' })
    .grayscale()
    .linear(0.55, -10)
    .webp({ quality: 95 })
    .toFile(path.join(COVERS_DIR, grayFile))

  const publicGray = `/images/products/copa2026/covers/${grayFile}`
  const publicColor = `/images/products/copa2026/covers/${colorFile}`

  const products = await prisma.product.findMany({
    where: { slug: { in: candidates } },
  })

  if (products.length === 0) {
    return { error: 'Nenhum produto encontrado para esse slug' }
  }

  await prisma.$transaction(
    products.map((p) => {
      const existing = parseJsonField<string[]>(p.images, [])
      const filtered = existing.filter(
        (url) =>
          !url.includes('/covers/') &&
          !url.endsWith('placeholder-jersey.svg')
      )
      const next = [publicGray, publicColor, ...filtered]
      return prisma.product.update({
        where: { id: p.id },
        data: { images: stringifyJsonField(next) },
      })
    })
  )

  revalidatePath('/')
  revalidatePath('/loja')
  revalidatePath('/loja/selecoes')
  revalidatePath('/loja/clubes')
  for (const p of products) {
    revalidatePath(`/produto/${p.slug}`)
  }
  revalidatePath('/admin/produtos')

  return { success: true, updated: products.map((p) => p.slug) }
}
