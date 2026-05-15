/**
 * Copia direta de imagens das camisas — SEM IA, SEM processamento.
 *
 * Lê pastas em /Camisas destaques/ (raiz do repo), identifica:
 *   - "capa.*"   → imagem principal ({slug}.{ext})
 *   - "capa 2.*" → segunda imagem ({slug}-2.{ext})
 *   - resto      → galeria ({slug}-3, -4, ...)
 *
 * Copia pra /public/images/products/copa2026/ e atualiza Product.images.
 */

import { config } from 'dotenv'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { PrismaClient } from '@prisma/client'

config({ path: path.resolve(__dirname, '..', '.env.local') })

const REPO_ROOT = path.resolve(__dirname, '..', '..')
const INPUT_DIR = path.join(REPO_ROOT, 'Camisas destaques')
const OUTPUT_DIR = path.resolve(__dirname, '..', 'public', 'images', 'products', 'copa2026')

// Mapeamento explícito pasta → slug do banco
const FOLDER_TO_SLUG: Record<string, string> = {
  'Alemanha - jogador - Branca - manga curta (camisa destaque home)': 'camisa-alemanha-2026',
  'Argentina Jogador - branco e azul - manga curta (Camisa Destaque home)': 'camisa-argentina-2026',
  'Brasil - jogador - amarela- manga curta (camisa destaque home)': 'camisa-brasil-2026',
  'Brasil II Jogador - azul - manga curta (camisa destaque home)': 'camisa-brasil-ii-2026',
  'Espanha - jogador - vermelha - manga curta (Camisa destaque home)': 'camisa-espanha-2026',
  'França Jogador - branca - manga curta (Camisa Destaque home)': 'camisa-franca-2026',
}

const prisma = new PrismaClient()

// Identifica "capa" / "capa 2" / outro
function classify(filename: string): 'cover' | 'cover2' | 'gallery' {
  const lower = filename.toLowerCase()
  const base = lower.replace(/\.(jpe?g|png|webp)$/, '').trim()
  if (base === 'capa') return 'cover'
  if (base === 'capa 2' || base === 'capa2') return 'cover2'
  return 'gallery'
}

async function processFolder(folderName: string, slug: string): Promise<string[]> {
  const folderPath = path.join(INPUT_DIR, folderName)
  const files = (await fs.readdir(folderPath)).filter((f) => /\.(jpe?g|png|webp)$/i.test(f))

  let cover: string | null = null
  let cover2: string | null = null
  const gallery: string[] = []

  for (const file of files) {
    const klass = classify(file)
    if (klass === 'cover') cover = file
    else if (klass === 'cover2') cover2 = file
    else gallery.push(file)
  }

  console.log(`\n📦 ${folderName}`)
  console.log(`   slug: ${slug}`)
  console.log(`   capa: ${cover ?? '(nenhuma)'}`)
  console.log(`   capa 2: ${cover2 ?? '(nenhuma)'}`)
  console.log(`   galeria: ${gallery.length} arquivos`)

  const outputUrls: string[] = []

  async function copyOne(src: string, suffix: string): Promise<string> {
    const ext = path.extname(src).toLowerCase()
    const outputName = `${slug}${suffix}${ext}`
    const outputPath = path.join(OUTPUT_DIR, outputName)
    await fs.copyFile(path.join(folderPath, src), outputPath)
    return `/images/products/copa2026/${outputName}`
  }

  if (cover) {
    outputUrls.push(await copyOne(cover, ''))
    console.log(`   ✓ ${cover} → ${slug}${path.extname(cover).toLowerCase()}`)
  }
  if (cover2) {
    outputUrls.push(await copyOne(cover2, '-2'))
    console.log(`   ✓ ${cover2} → ${slug}-2${path.extname(cover2).toLowerCase()}`)
  }
  for (let i = 0; i < gallery.length; i++) {
    const file = gallery[i]
    const idx = i + 3
    outputUrls.push(await copyOne(file, `-${idx}`))
    console.log(`   ✓ ${file} → ${slug}-${idx}${path.extname(file).toLowerCase()}`)
  }

  return outputUrls
}

async function updateProductImages(slug: string, images: string[]): Promise<void> {
  if (images.length === 0) return
  const updated = await prisma.product.updateMany({
    where: { slug },
    data: { images: JSON.stringify(images) },
  })
  if (updated.count === 0) {
    console.log(`   ⚠️  Sem produto com slug "${slug}" no banco`)
  } else {
    console.log(`   ✓ Banco atualizado (${images.length} imagens)`)
  }
}

async function main() {
  console.log('🌱 Copiando imagens estáticas (sem IA)\n')
  console.log(`   Input:  ${INPUT_DIR}`)
  console.log(`   Output: ${OUTPUT_DIR}\n`)

  await fs.mkdir(OUTPUT_DIR, { recursive: true })

  let entries: string[]
  try {
    const dirents = await fs.readdir(INPUT_DIR, { withFileTypes: true })
    entries = dirents.filter((d) => d.isDirectory()).map((d) => d.name)
  } catch {
    console.error(`❌ Pasta não encontrada: ${INPUT_DIR}`)
    process.exit(1)
  }

  let ok = 0
  let skipped = 0
  for (const folder of entries) {
    const slug = FOLDER_TO_SLUG[folder]
    if (!slug) {
      console.log(`\n⚠️  Pulando "${folder}" — sem mapeamento de slug`)
      skipped++
      continue
    }
    const urls = await processFolder(folder, slug)
    await updateProductImages(slug, urls)
    ok++
  }

  console.log('\n' + '─'.repeat(60))
  console.log(`✅ ${ok} pasta(s) copiada(s) · ${skipped} ignorada(s)`)
  await prisma.$disconnect()
}

main().catch(async (err) => {
  console.error('❌ Erro:', err)
  await prisma.$disconnect()
  process.exit(1)
})
