/**
 * Processa "Camisas seleção/<País> - <jogador|torcedor> - <cor> - manga curta"
 * - Ignora pastas "manga longa"
 * - Mapeia para slug do produto (com tratamento dos casos especiais)
 * - Redimensiona JPG → WebP 1024x1280 (igual ao cover)
 * - Salva em public/images/products/copa2026/photos/<slug>/
 * - Atualiza Product.images = [cover-gray, cover-color, ...fotos]
 *
 * Uso:
 *   npx dotenv-cli -e .env.local -- npx ts-node --transpile-only --project scripts/tsconfig.json scripts/process-jersey-photos.ts
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const REPO_ROOT = path.resolve(__dirname, '..', '..')
const SOURCE_DIR = path.join(REPO_ROOT, 'Camisas seleção')
const PHOTOS_DIR = path.join(__dirname, '..', 'public', 'images', 'products', 'copa2026', 'photos')
const PUBLIC_BASE = '/images/products/copa2026/photos'

interface ParsedFolder {
  country: string
  version: 'jogador' | 'torcedor'
  color: string
  isSpecial: boolean
  isLonga: boolean
}

const COUNTRY_TO_BASE_SLUG: Record<string, string> = {
  'alemanha': 'camisa-alemanha-2026',
  'arabia saudita': 'camisa-arabia-saudita-2026',
  'argelia': 'camisa-argelia-2026',
  'argentina': 'camisa-argentina-2026',
  'austria': 'camisa-austria-2026',
  'belgica': 'camisa-belgica-2026',
  'brasil ii': 'camisa-brasil-ii-2026',
  'brasil': 'camisa-brasil-2026',
  'canada': 'camisa-canada-2026',
  'colombia': 'camisa-colombia-2026',
  'croacia': 'camisa-croacia-2026',
  'equador': 'camisa-equador-2026',
  'espanha': 'camisa-espanha-2026',
  'franca': 'camisa-franca-2026',
  'frança': 'camisa-franca-2026',
  'inglaterra': 'camisa-inglaterra-2026',
  'reino unido': 'camisa-inglaterra-2026',
  'japao': 'camisa-japao-2026',
  'japão': 'camisa-japao-2026',
  'marocco': 'camisa-marrocos-2026',
  'marrocos': 'camisa-marrocos-2026',
  'mexico': 'camisa-mexico-2026',
  'méxico': 'camisa-mexico-2026',
  'noruega': 'camisa-noruega-2026',
  'nova zelandia': 'camisa-nova-zelandia-2026',
  'portugal': 'camisa-portugal-2026',
  'portugual': 'camisa-portugal-2026', // typo nas pastas
  'qatar': 'camisa-catar-2026',
  'catar': 'camisa-catar-2026',
  'senegal': 'camisa-senegal-2026',
  'suica': 'camisa-suica-2026',
  'suiça': 'camisa-suica-2026',
  'uruguay': 'camisa-uruguai-2026',
  'uruguai': 'camisa-uruguai-2026',
}

function parseFolderName(folder: string): ParsedFolder | null {
  const lower = folder.toLowerCase().replace(/\s+/g, ' ').trim()
  const isLonga = lower.includes('manga longa')
  const isSpecial = lower.includes('edição especial') || lower.includes('edicao especial') || lower.includes('esdição especial')
  const isJogador = lower.includes('jogador')
  const isTorcedor = lower.includes('torcedor') || lower.includes('tocedor') // typo "tocedor"
  if (!isJogador && !isTorcedor) return null
  const version: 'jogador' | 'torcedor' = isJogador ? 'jogador' : 'torcedor'

  // Country = parte antes de "jogador"/"torcedor"/"tocedor"
  const re = /^(.*?)\s*-?\s*(jogador|torcedor|tocedor)\b/i
  const m = folder.match(re)
  if (!m) return null
  const country = m[1].toLowerCase().trim().replace(/\s+/g, ' ')

  // Color = parte entre version e "manga"
  const colorRe = /(jogador|torcedor|tocedor)\s*-?\s*(.+?)\s*-?\s*manga/i
  const cm = folder.match(colorRe)
  const color = cm ? cm[2].toLowerCase().trim().replace(/\s+/g, ' ') : 'principal'

  return { country, version, color, isSpecial, isLonga }
}

function resolveSlug(parsed: ParsedFolder, originalFolder: string): string | null {
  const lower = originalFolder.toLowerCase()
  const { country, version, color, isSpecial } = parsed

  // CASOS ESPECIAIS:
  // "Brasil II Jogador" → camisa-brasil-ii
  if (/^brasil ii\b/i.test(originalFolder)) {
    const base = COUNTRY_TO_BASE_SLUG['brasil ii']
    return version === 'jogador' ? base : `${base}-torcedor`
  }

  // Brasil + torcedor/tocedor + azul → camisa-brasil-ii-2026-torcedor
  if (country === 'brasil' && version === 'torcedor' && color.includes('azul')) {
    return 'camisa-brasil-ii-2026-torcedor'
  }

  // Espanha + branca → camisa-espanha-branca
  if (country === 'espanha' && color.includes('branca')) {
    const base = 'camisa-espanha-branca-2026'
    return version === 'jogador' ? base : `${base}-torcedor`
  }
  // Espanha + azul → camisa-espanha-azul
  if (country === 'espanha' && color.includes('azul')) {
    const base = 'camisa-espanha-azul-2026'
    return version === 'jogador' ? base : `${base}-torcedor`
  }

  // Portugal + Edição especial → camisa-portugal-especial
  if ((country === 'portugal' || country === 'portugual') && isSpecial) {
    const base = 'camisa-portugal-especial-2026'
    return version === 'jogador' ? base : `${base}-torcedor`
  }

  // Default: country → slug base
  const base = COUNTRY_TO_BASE_SLUG[country]
  if (!base) {
    console.warn(`  ⚠ País não mapeado: "${country}" (pasta: ${originalFolder})`)
    return null
  }
  return version === 'jogador' ? base : `${base}-torcedor`
}

async function listJpgs(folderPath: string): Promise<string[]> {
  const entries = await fs.readdir(folderPath, { withFileTypes: true })
  return entries
    .filter((e) => e.isFile() && /\.(jpe?g|png|webp)$/i.test(e.name))
    .map((e) => e.name)
    .sort()
}

async function processFolder(
  folderName: string,
  bucket: Map<string, Array<{ src: string; folderLabel: string }>>,
): Promise<void> {
  const parsed = parseFolderName(folderName)
  if (!parsed) {
    console.warn(`  ⚠ Não parseou: ${folderName}`)
    return
  }
  if (parsed.isLonga) {
    console.log(`  ⊘ Pulando (manga longa): ${folderName}`)
    return
  }
  const slug = resolveSlug(parsed, folderName)
  if (!slug) return

  const folderPath = path.join(SOURCE_DIR, folderName)
  const jpgs = await listJpgs(folderPath)
  if (jpgs.length === 0) {
    console.log(`  ⊘ Sem imagens: ${folderName}`)
    return
  }

  const slugFolder = `${parsed.color.replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}${parsed.isSpecial ? '-especial' : ''}`
  const list = bucket.get(slug) ?? []
  for (const jpg of jpgs) {
    list.push({ src: path.join(folderPath, jpg), folderLabel: slugFolder })
  }
  bucket.set(slug, list)
}

async function saveAndUpdate(slug: string, photos: Array<{ src: string; folderLabel: string }>) {
  const outDir = path.join(PHOTOS_DIR, slug)
  await fs.mkdir(outDir, { recursive: true })

  // Apaga arquivos antigos da pasta pra evitar lixo de execuções anteriores
  try {
    const existing = await fs.readdir(outDir)
    await Promise.all(existing.map((f) => fs.unlink(path.join(outDir, f)).catch(() => {})))
  } catch {}

  const savedRelative: string[] = []
  let idx = 0
  for (const photo of photos) {
    idx++
    const outName = `${String(idx).padStart(2, '0')}-${photo.folderLabel}.webp`
    const outPath = path.join(outDir, outName)
    await sharp(photo.src)
      .resize(1024, 1280, { fit: 'cover', position: 'centre' })
      .webp({ quality: 90 })
      .toFile(outPath)
    savedRelative.push(`${PUBLIC_BASE}/${slug}/${outName}`)
  }

  // Atualiza Product.images preservando capa (gray + color) no início
  const product = await prisma.product.findUnique({ where: { slug } })
  if (!product) {
    console.warn(`  ⚠ Produto não existe no DB: ${slug}`)
    return
  }
  let existingImgs: string[] = []
  try { existingImgs = JSON.parse(product.images) } catch {}
  const covers = existingImgs.filter((u) => u.includes('/covers/'))
  // Garante ordem: gray primeiro, depois color
  const gray = covers.find((u) => u.includes('-gray'))
  const color = covers.find((u) => u.includes('-color'))
  const coverPair = [gray, color].filter(Boolean) as string[]
  const next = [...coverPair, ...savedRelative]
  await prisma.product.update({
    where: { id: product.id },
    data: { images: JSON.stringify(next) },
  })
  console.log(`  ✓ ${slug}: ${savedRelative.length} fotos`)
}

async function main() {
  const entries = await fs.readdir(SOURCE_DIR, { withFileTypes: true })
  const folders = entries.filter((e) => e.isDirectory()).map((e) => e.name)
  console.log(`📂 ${folders.length} subpastas em "Camisas seleção/"`)

  // Bucket: slug → [photo, ...]
  const bucket = new Map<string, Array<{ src: string; folderLabel: string }>>()

  for (const folder of folders) {
    await processFolder(folder, bucket)
  }

  console.log(`\n🎯 ${bucket.size} produtos com fotos para processar`)
  for (const [slug, photos] of bucket) {
    await saveAndUpdate(slug, photos)
  }
  console.log('\n✅ Pronto!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
