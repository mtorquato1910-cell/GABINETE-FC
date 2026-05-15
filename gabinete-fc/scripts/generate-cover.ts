/**
 * Gera capa AI de uma seleção (colorida + apagada) e atualiza o banco.
 * Pipeline: 2 chamadas Gemini (colorida via crest, apagada usando colorida como ref de pose).
 *
 * Uso:
 *   npx dotenv-cli -e .env.local -- npx ts-node --transpile-only --project scripts/tsconfig.json scripts/generate-cover.ts <slug>
 *
 * Para gerar TODOS os 6 destaques:
 *   ... scripts/generate-cover.ts all-featured
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { PrismaClient } from '@prisma/client'
import { generateJerseyCover, buildCoverPromptColor, buildCoverPromptBlackout } from '../src/lib/gemini-image'

const prisma = new PrismaClient()

const REPO_ROOT = path.resolve(__dirname, '..', '..')
const INFO_DIR = path.join(REPO_ROOT, 'Informação Camisas')
const COVERS_DIR = path.join(__dirname, '..', 'public', 'images', 'products', 'copa2026', 'covers')

interface Preset {
  slug: string
  team: string
  variant: string
  primaryColor: string
  secondaryColor: string
  brand: string
  crest: string
  details: string
  crestFile?: string
}

const PRESETS: Record<string, Preset> = {
  'camisa-brasil-2026': {
    slug: 'camisa-brasil-2026',
    team: 'Brazil',
    variant: 'I home',
    primaryColor: 'classic vibrant canary yellow #FEDD00',
    secondaryColor: 'bright green #009C3B with thin navy blue #002776 inner piping',
    brand: 'green Nike swoosh',
    crest: 'CBF crest with five small green stars above and "BRASIL" text in green',
    details: 'Classic Brazilian canarinho home jersey for the 2026 World Cup',
    crestFile: 'Brasil-1024x614.jpg',
  },
  'camisa-brasil-ii-2026': {
    slug: 'camisa-brasil-ii-2026',
    team: 'Brazil',
    variant: 'II away/reserve',
    primaryColor: 'deep royal navy blue #002776',
    secondaryColor: 'bright yellow #FEDD00 with thin green #009C3B inner piping',
    brand: 'yellow Nike swoosh',
    crest: 'CBF crest in golden/yellow tones with five stars and "BRASIL" text',
    details: 'Royal blue away jersey, modern minimal design for the 2026 World Cup',
    crestFile: 'Brasil-1024x614.jpg',
  },
  'camisa-argentina-2026': {
    slug: 'camisa-argentina-2026',
    team: 'Argentina',
    variant: 'I home',
    primaryColor: 'iconic sky blue and white vertical "albiceleste" stripes (light sky blue #75AADB alternating with white #FFFFFF)',
    secondaryColor: 'white with black Adidas details',
    brand: 'three classic black Adidas stripes on the shoulders and a small Adidas trefoil logo',
    crest: 'AFA crest of the Argentine Football Association with sky-blue/white stripes and golden Sun of May',
    details: 'Albiceleste home jersey with vertical light blue and white stripes, white sleeves',
    crestFile: 'Argentina-1024x614.jpg',
  },
  'camisa-franca-2026': {
    slug: 'camisa-franca-2026',
    team: 'France',
    variant: 'I home',
    primaryColor: 'deep French navy marine blue #001F5B',
    secondaryColor: 'white #FFFFFF with thin red #EF1923 tricolor accents',
    brand: 'white Nike swoosh',
    crest: 'FFF crest with a stylized golden Gallic rooster (coq) on a small shield',
    details: 'Classic deep navy blue Les Bleus home jersey for the 2026 World Cup',
    crestFile: 'França-1024x614.jpg',
  },
  'camisa-espanha-2026': {
    slug: 'camisa-espanha-2026',
    team: 'Spain',
    variant: 'I home',
    primaryColor: 'bold vibrant La Roja red #AA151B',
    secondaryColor: 'golden yellow #F1BF00 with subtle black accents',
    brand: 'three black Adidas stripes on the shoulders',
    crest: 'RFEF crest of the Royal Spanish Football Federation with crown and red/yellow flag stripes',
    details: 'La Roja red home jersey for the 2026 World Cup',
    crestFile: 'Espanha-1024x614.jpg',
  },
  'camisa-alemanha-2026': {
    slug: 'camisa-alemanha-2026',
    team: 'Germany',
    variant: 'I home',
    primaryColor: 'pure clean white #FFFFFF',
    secondaryColor: 'a bold diagonal tricolor sash across the chest in black #000000, red #DD0000 and golden yellow #FFCE00 (German flag colors)',
    brand: 'three classic black Adidas stripes on the shoulders',
    crest: 'DFB crest with a stylized black eagle on a green shield with black/red/gold flag edge',
    details: 'Modern white Die Mannschaft home jersey with a tricolor diagonal sash across the chest, referencing the 2024 kit design',
    crestFile: 'Alemanha-1024x614.jpg',
  },
}

const FEATURED_SLUGS = [
  'camisa-brasil-2026',
  'camisa-brasil-ii-2026',
  'camisa-argentina-2026',
  'camisa-franca-2026',
  'camisa-espanha-2026',
  'camisa-alemanha-2026',
]

async function loadCrestBase64(filename: string): Promise<{ data: string; mime: string } | null> {
  const fullPath = path.join(INFO_DIR, filename)
  try {
    const buf = await fs.readFile(fullPath)
    const lower = filename.toLowerCase()
    const mime =
      lower.endsWith('.png') ? 'image/png' :
      lower.endsWith('.svg') ? 'image/svg+xml' :
      lower.endsWith('.webp') ? 'image/webp' : 'image/jpeg'
    return { data: buf.toString('base64'), mime }
  } catch {
    console.warn(`  ⚠ Brasão não encontrado: ${fullPath}`)
    return null
  }
}

// Carrega Alemanha colorida (se já existir) como pose-anchor para outras seleções.
// Converte para PNG porque Gemini às vezes rejeita WebP como input.
async function loadPoseAnchor(currentSlug: string): Promise<{ data: string; mime: string } | null> {
  if (currentSlug === 'camisa-alemanha-2026') return null
  const anchorPath = path.join(COVERS_DIR, 'camisa-alemanha-2026-cover-color.webp')
  try {
    const webpBuf = await fs.readFile(anchorPath)
    // Converte pra JPEG menor (512x640) — múltiplas imagens grandes podem estourar limite do Gemini
    const jpegBuf = await sharp(webpBuf)
      .resize(512, 640, { fit: 'inside' })
      .jpeg({ quality: 85 })
      .toBuffer()
    console.log(`    pose-anchor: ${(jpegBuf.length / 1024).toFixed(0)}KB`)
    return { data: jpegBuf.toString('base64'), mime: 'image/jpeg' }
  } catch {
    return null
  }
}

async function generateAndSave(preset: Preset) {
  console.log(`\n━━━ ${preset.team} ${preset.variant} (${preset.slug}) ━━━`)

  const crest = preset.crestFile ? await loadCrestBase64(preset.crestFile) : null
  if (crest) console.log(`  ✓ Brasão carregado (${preset.crestFile})`)

  console.log('  → [1/2] Gerando colorida via Gemini...')
  const colorPrompt = buildCoverPromptColor(preset)
  const colorResult = await generateJerseyCover({
    prompt: colorPrompt,
    referenceImageBase64: crest?.data,
    referenceImageMime: crest?.mime,
  })
  const colorBuffer = Buffer.from(colorResult.imageBase64, 'base64')
  console.log(`  ✓ Colorida gerada`)

  console.log('  → [2/2] Gerando apagada via Gemini (usando colorida como ref de pose)...')
  const blackoutPrompt = buildCoverPromptBlackout({
    team: preset.team,
    crest: preset.crest,
    brand: preset.brand,
  })
  const apagadaResult = await generateJerseyCover({
    prompt: blackoutPrompt,
    referenceImageBase64: colorBuffer.toString('base64'),
    referenceImageMime: 'image/png',
  })
  console.log(`  ✓ Apagada gerada`)

  await fs.mkdir(COVERS_DIR, { recursive: true })
  const colorFile = `${preset.slug}-cover-color.webp`
  const grayFile = `${preset.slug}-cover-gray.webp`

  await sharp(colorBuffer)
    .resize(1024, 1280, { fit: 'cover', position: 'centre' })
    .webp({ quality: 88 })
    .toFile(path.join(COVERS_DIR, colorFile))
  await sharp(Buffer.from(apagadaResult.imageBase64, 'base64'))
    .resize(1024, 1280, { fit: 'cover', position: 'centre' })
    .webp({ quality: 88 })
    .toFile(path.join(COVERS_DIR, grayFile))
  console.log(`  ✓ Salvas em public/images/products/copa2026/covers/`)

  const publicGray = `/images/products/copa2026/covers/${grayFile}`
  const publicColor = `/images/products/copa2026/covers/${colorFile}`

  const candidates = [preset.slug, `${preset.slug}-torcedor`]
  const products = await prisma.product.findMany({ where: { slug: { in: candidates } } })
  console.log(`  ✓ Encontrados ${products.length} produtos: ${products.map((p) => p.slug).join(', ')}`)

  await prisma.$transaction(
    products.map((p) => {
      let existing: string[] = []
      try { existing = JSON.parse(p.images) as string[] } catch { existing = [] }
      const filtered = existing.filter(
        (url) => !url.includes('/covers/') && !url.endsWith('placeholder-jersey.svg')
      )
      const next = [publicGray, publicColor, ...filtered]
      return prisma.product.update({
        where: { id: p.id },
        data: { images: JSON.stringify(next) },
      })
    })
  )
  console.log(`  ✓ Banco atualizado`)
}

async function main() {
  const arg = process.argv[2]
  if (!arg) {
    console.error('Uso: ts-node scripts/generate-cover.ts <slug | all-featured>')
    console.error(`Slugs disponíveis: ${Object.keys(PRESETS).join(', ')}`)
    process.exit(1)
  }

  const slugs = arg === 'all-featured' ? FEATURED_SLUGS : [arg]
  for (const slug of slugs) {
    const preset = PRESETS[slug]
    if (!preset) {
      console.error(`Preset não encontrado: ${slug}`)
      continue
    }
    await generateAndSave(preset)
  }
  console.log('\n✅ Pronto!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
