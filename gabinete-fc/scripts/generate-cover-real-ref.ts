/**
 * Gera capa (colorida + apagada) usando a FOTO REAL da camisa como referência
 * de detalhes (jacquard, gola, crest, trims). A pose vem da capa antiga
 * (que o cliente já aprovou) — assim a nova fica fiel em detalhes mantendo
 * a mesma orientação/estilo de estúdio.
 *
 * Critérios pra processar um slug:
 *   1. Tem pasta /photos/<slug>/ com ≥ 1 foto real
 *   2. Tem capa existente /covers/<slug>-cover-color.webp (pose-anchor)
 *   3. Pelo menos uma variante (slug ou slug-torcedor) está com estoque > 0
 *
 * Uso:
 *   npx dotenv-cli -e .env.local -- npx ts-node --transpile-only --project scripts/tsconfig.json scripts/generate-cover-real-ref.ts
 *   npx dotenv-cli -e .env.local -- npx ts-node --transpile-only --project scripts/tsconfig.json scripts/generate-cover-real-ref.ts <slug>
 *   npx dotenv-cli -e .env.local -- npx ts-node --transpile-only --project scripts/tsconfig.json scripts/generate-cover-real-ref.ts --dry-run
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { PrismaClient } from '@prisma/client'
import { generateJerseyCover } from '../src/lib/gemini-image'
import { PRESETS, type Preset } from './generate-cover'

const prisma = new PrismaClient()

const REPO_ROOT = path.resolve(__dirname, '..', '..')
const INFO_DIR = path.join(REPO_ROOT, 'Informação Camisas')
const PHOTOS_DIR = path.join(__dirname, '..', 'public', 'images', 'products', 'copa2026', 'photos')
const COVERS_DIR = path.join(__dirname, '..', 'public', 'images', 'products', 'copa2026', 'covers')

const PHOTO_EXT_RE = /\.(webp|jpe?g|png)$/i

async function loadImageBase64(fullPath: string): Promise<{ data: string; mime: string }> {
  const buf = await fs.readFile(fullPath)
  const lower = fullPath.toLowerCase()
  const mime =
    lower.endsWith('.png') ? 'image/png' :
    lower.endsWith('.svg') ? 'image/svg+xml' :
    lower.endsWith('.webp') ? 'image/webp' : 'image/jpeg'
  return { data: buf.toString('base64'), mime }
}

async function loadPhotoAsJpeg(fullPath: string, opts?: { hiRes?: boolean }): Promise<{ data: string; mime: string }> {
  const buf = await fs.readFile(fullPath)
  const size = opts?.hiRes ? 1024 : 768
  const jpegBuf = await sharp(buf)
    .resize(size, Math.round(size * 1.33), { fit: 'inside' })
    .jpeg({ quality: opts?.hiRes ? 92 : 90 })
    .toBuffer()
  return { data: jpegBuf.toString('base64'), mime: 'image/jpeg' }
}

function buildColorPrompt(p: Preset): string {
  return `Professional product photography, ultra-detailed shot of a premium ${p.team} national football team jersey (kit ${p.variant}) in ${p.primaryColor}.

HOW TO USE THE REFERENCE IMAGES (read very carefully — this is the most important instruction):
- The FIRST reference image is the EXISTING STUDIO COVER of this jersey. You MUST replicate its POSE, ANGLE, ROTATION, FRAMING, BACKGROUND and LIGHTING with PIXEL-LEVEL fidelity. Same direction the torso is rotated, same shoulder elevation, same crop, same charcoal-black studio cyclorama, same dramatic chiaroscuro lighting. Treat the first reference as the ABSOLUTE TRUTH for pose and framing.
- The SECOND reference image is the federation crest art.
- The REMAINING reference images are PHOTOS OF THE REAL JERSEY that is currently being sold. Use these to extract DESIGN DETAILS as faithfully as possible: exact fabric pattern (any all-over jacquard, embossed, woven or printed motif visible on the body — DO NOT smooth out or omit it), exact collar shape and multi-tone color layering (inner contrast band, ribbed trim, neckline cut), exact sleeve cuff trim (color blocks, stripes, contrast piping), exact crest layout and BRASIL/team wordmark, exact brand logo placement and size, any graphic detail (side panels, dorsal stripe, sponsor heat-press, hem details). The goal is for the final cover to be INSTANTLY RECOGNIZABLE as the same jersey shown in those real-jersey photos — a customer must see the cover and recognize their jersey.
- DO NOT copy the pose, camera angle, framing, lighting or background from the real-jersey photos — they are flat frontal store/mannequin shots and that pose is WRONG for this cover.

FINAL OUTPUT FORMULA: pose/angle/framing/background/lighting from the FIRST reference (existing cover) + design details (fabric pattern, collar, trim, crest art, every authentic graphic element) from the real-jersey photos = the new cover.

The jersey is rendered in ${p.primaryColor} with ${p.secondaryColor}. ${p.brand}. ${p.crest}. ${p.details}.

Background: deep matte charcoal-black studio cyclorama with subtle tonal depth, soft contact shadow grounding the jersey. Lighting: powerful directional top-down cinematic studio lighting with rim light separating the silhouette from the dark background. Fabric: extreme focus on the dry-fit mesh texture and any tonal jacquard pattern visible in the real-jersey photos — preserve it faithfully.

Empty floating product shot — no mannequin visible, no hanger, no person, no body, no display stand, no banner. Hyper-realistic, 8k resolution, photorealistic, ultra-sharp focus, premium sports catalog style.`
}

function buildBlackoutPrompt(p: Preset): string {
  return `Professional product photography, ultra-detailed shot of a premium ${p.team} national football team jersey in a deep grayscale colorway, inspired by a dark "hype drop" aesthetic. The entire jersey is rendered in sophisticated tones of matte gray.

HOW TO USE THE REFERENCE IMAGES (read very carefully):
- The FIRST reference image is the NEW COLORED COVER you must mirror — match its POSE, ANGLE, ROTATION, FRAMING, CROP, BACKGROUND and LIGHTING with PIXEL-LEVEL fidelity. The two covers (color + gray) MUST look like the same product photographed in the same studio setup, only differing in colorway.
- The REMAINING reference images are PHOTOS OF THE REAL JERSEY. Use them to preserve AUTHENTIC DESIGN DETAILS: fabric jacquard/embossed pattern (render as subtle gray-on-gray tonal pattern, do NOT smooth it out), collar shape and layering, sleeve cuff trim structure, crest layout, brand logo placement. DO NOT copy their pose/angle/framing/lighting.

FINAL OUTPUT FORMULA: pose/angle/framing/background/lighting from the FIRST reference (colored cover) + design details from the real-jersey photos + ALL colors converted to neutral monochrome grayscale (NO blue tint, NO cyan, NO cool tones — neutral or slightly warm grays only) = the new gray cover.

The ${p.crest} is rendered in dark gray embroidery on the LEFT chest (viewer's right when looking at front). The ${p.brand} logo is a tonal dark-gray heat-press on the RIGHT chest (viewer's left). Collar and cuff trim layering follows the real-jersey reference photos but rendered in neutral gray tones.

Background: deep matte charcoal-black studio cyclorama, soft contact shadow. Lighting: high-contrast chiaroscuro with prominent neutral-white rim lighting separating the gray jersey from the dark background. Fabric: ultra-sharp focus on the dry-fit mesh texture; preserve the tonal jacquard pattern from the real photos as a subtle gray-on-gray motif.

Empty floating product shot — no mannequin, no hanger, no person, no body, no display stand. Hyper-realistic, 8k resolution, photorealistic, premium "blackout" colorway.`
}

function buildColorPromptHighFidelity(p: Preset): string {
  return `Professional product photography, ultra-detailed studio shot of a premium ${p.team} national football team jersey (kit ${p.variant}). This is a MAXIMUM-FIDELITY REPLICATION job — the output must look identical to the real jersey in every visible detail.

HOW TO USE THE REFERENCE IMAGES (read VERY carefully — this is the most important instruction in the entire prompt):
- The FIRST reference image is the EXISTING STUDIO COVER. You MUST replicate ONLY its POSE, ANGLE, ROTATION, FRAMING, BACKGROUND and LIGHTING with pixel-level fidelity. SAME direction the torso is rotated, SAME shoulder elevation, SAME crop, SAME charcoal-black studio cyclorama, SAME dramatic chiaroscuro lighting. DO NOT copy the design (colors, pattern, collar style, sleeve trims, crest art) from this first image — its design will be REPLACED by what the real-jersey photos show.
- The SECOND reference image is the federation crest art.
- The REMAINING reference images (there are 5 of them) are PHOTOS OF THE REAL JERSEY currently being sold. Each photo shows a different angle/detail. STUDY ALL OF THEM CAREFULLY and replicate EXACTLY:
  • The EXACT primary body color tone (do NOT approximate — match the precise hue and saturation visible in the photos)
  • Every secondary accent color (e.g. turquoise/teal/cyan vs simple green vs lime — match precisely what the photos show)
  • The COMPLETE all-over fabric pattern visible on the body (jacquard, embossed motifs, gradient effects, dripping wave patterns, multi-zone designs — render every element exactly as in the photos; do NOT simplify, do NOT generalize, do NOT substitute with a generic pattern)
  • The exact collar geometry (V-neck depth, ribbed trim, inner contrast band color, layering)
  • The exact sleeve cuff trim (color, stripes, piping, inner accent color)
  • The exact crest layout (stars, federation badge colors and shape, country name wordmark color and font)
  • The exact brand mark (Nike swoosh / Jumpman / Puma / Adidas — including its color, size and exact position)
  • Side panels, dorsal stripes, sponsor heat-press, hem details — every visible element
- DO NOT copy the pose, camera angle, framing, lighting, mannequin, store-background from the real-jersey photos — those are flat frontal store/mannequin shots and that POSE is WRONG. Use the FIRST reference for pose, the REAL PHOTOS for design.

FINAL OUTPUT FORMULA: pose/angle/framing/background/lighting from the FIRST reference (existing cover) + EVERY visible design detail (color, pattern, collar, sleeves, crest, brand) from the real-jersey photos = the new cover.

CRITICAL FIDELITY RULE: a customer who owns this jersey must look at the cover and immediately recognize their own jersey — same color tones, same pattern, same accents, same crest layout. If any visible detail in the real photos is missing or simplified in the cover, the output is WRONG. Generic patterns, approximated colors, missing accents — all FORBIDDEN.

Background: deep matte charcoal-black studio cyclorama with subtle tonal depth, soft contact shadow grounding the jersey. Lighting: powerful directional top-down cinematic studio lighting with rim light separating the silhouette from the dark background. Fabric: extreme focus on the dry-fit mesh texture and the EXACT tonal/multi-color pattern visible in the real-jersey photos.

Empty floating product shot — no mannequin visible, no hanger, no person, no body, no display stand, no banner, no store background. Hyper-realistic, 8k resolution, photorealistic, ultra-sharp focus, premium sports catalog style. ${p.details}.`
}

function buildBlackoutPromptHighFidelity(p: Preset): string {
  return `Professional product photography, ultra-detailed shot of a premium ${p.team} national football team jersey in a deep grayscale colorway. This is a MAXIMUM-FIDELITY REPLICATION job — the output must look identical to the real jersey in every visible structural detail, only with all colors converted to neutral monochrome gray.

HOW TO USE THE REFERENCE IMAGES (read very carefully):
- The FIRST reference image is the NEW COLORED COVER you must mirror — match its POSE, ANGLE, ROTATION, FRAMING, CROP, BACKGROUND and LIGHTING with pixel-level fidelity. The two covers (color + gray) MUST look like the same product photographed in the same studio setup, only differing in colorway.
- The REMAINING reference images (5 of them) are PHOTOS OF THE REAL JERSEY. STUDY ALL OF THEM and replicate every structural design detail: the COMPLETE all-over fabric pattern (jacquard, embossed motifs, gradient, multi-zone designs — render the EXACT pattern as a subtle gray-on-gray tonal motif, do NOT smooth out, do NOT simplify), exact collar shape and layering, exact sleeve cuff structure, exact crest layout, exact brand logo placement.
- DO NOT copy the pose, camera angle, framing or lighting from the real-jersey photos.

FINAL OUTPUT FORMULA: pose/angle/framing/background/lighting from the FIRST reference (colored cover) + EVERY structural design detail from the real-jersey photos + ALL colors converted to neutral monochrome grayscale (NO blue tint, NO cyan, NO cool tones — neutral or slightly warm grays only) = the new gray cover.

CRITICAL: preserve the exact fabric pattern from the real photos — render every element of the jacquard/embossed motif as gray-on-gray tonal detail. Generic smoothed-out body is FORBIDDEN. The ${p.crest} stays in dark gray embroidery on the LEFT chest (viewer's right). The ${p.brand} logo as a tonal dark-gray heat-press.

Background: deep matte charcoal-black studio cyclorama, soft contact shadow. Lighting: high-contrast chiaroscuro with prominent neutral-white rim lighting separating the gray jersey from the dark background.

Empty floating product shot — no mannequin, no hanger, no person, no body, no display stand. Hyper-realistic, 8k resolution, photorealistic, premium "blackout" colorway.`
}

async function listRealPhotos(slug: string, max = 2): Promise<string[]> {
  try {
    const files = await fs.readdir(path.join(PHOTOS_DIR, slug))
    return files
      .filter((f) => PHOTO_EXT_RE.test(f))
      .sort()
      .slice(0, max)
      .map((f) => path.join(PHOTOS_DIR, slug, f))
  } catch {
    return []
  }
}

/**
 * Slugs que precisam de máxima fidelidade — usam mais fotos de referência (5)
 * em alta resolução, e prompt reforçado de "match EVERY detail".
 */
const HIGH_FIDELITY_SLUGS = new Set<string>([
  'camisa-brasil-2026',
  'camisa-brasil-ii-2026',
])

async function hasExistingCover(slug: string): Promise<string | null> {
  const p = path.join(COVERS_DIR, `${slug}-cover-color.webp`)
  try { await fs.access(p); return p } catch { return null }
}

async function calcStockBatch(productIds: string[]): Promise<Record<string, number>> {
  if (productIds.length === 0) return {}
  const movements = await prisma.stockMovement.groupBy({
    by: ['productId', 'type'],
    where: { productId: { in: productIds } },
    _sum: { quantity: true },
  })
  const out: Record<string, number> = {}
  for (const id of productIds) {
    const inQty = movements.find((m) => m.productId === id && m.type === 'in')?._sum.quantity ?? 0
    const outQty = movements.find((m) => m.productId === id && m.type === 'out')?._sum.quantity ?? 0
    const calc = inQty - outQty
    out[id] = calc > 0 ? calc : 99 // default 99 sem movimento (igual à app)
  }
  return out
}

interface Qualified {
  slug: string
  preset: Preset
  realPhotos: string[]
  existingCoverPath: string
  productIds: string[]
}

async function findQualifyingSlugs(only?: string): Promise<Qualified[]> {
  const slugs = only ? [only] : Object.keys(PRESETS)
  const result: Qualified[] = []

  for (const slug of slugs) {
    const preset = PRESETS[slug]
    if (!preset) {
      console.warn(`  ⏭️  ${slug}: preset não encontrado`)
      continue
    }
    const maxPhotos = HIGH_FIDELITY_SLUGS.has(slug) ? 5 : 2
    const realPhotos = await listRealPhotos(slug, maxPhotos)
    if (realPhotos.length === 0) {
      if (only) console.warn(`  ⏭️  ${slug}: sem fotos reais em /photos/${slug}/`)
      continue
    }
    const existingCoverPath = await hasExistingCover(slug)
    if (!existingCoverPath) {
      if (only) console.warn(`  ⏭️  ${slug}: sem capa existente (precisa de pose-anchor)`)
      continue
    }
    // Estoque — slug + slug-torcedor
    const candidates = [slug, `${slug}-torcedor`]
    const products = await prisma.product.findMany({
      where: { slug: { in: candidates } },
      select: { id: true, slug: true },
    })
    if (products.length === 0) {
      if (only) console.warn(`  ⏭️  ${slug}: produto não existe no banco`)
      continue
    }
    const stocks = await calcStockBatch(products.map((p) => p.id))
    const anyInStock = Object.values(stocks).some((s) => s > 0)
    if (!anyInStock) {
      console.log(`  ⏭️  ${slug}: sem estoque (todas variantes esgotadas)`)
      continue
    }
    result.push({
      slug, preset, realPhotos, existingCoverPath,
      productIds: products.map((p) => p.id),
    })
  }
  return result
}

async function generateAndSave(q: Qualified) {
  const { slug, preset, realPhotos, existingCoverPath } = q
  console.log(`\n━━━ ${preset.team} ${preset.variant} (${slug}) ━━━`)
  console.log(`  fotos reais: ${realPhotos.length} (${realPhotos.map((p) => path.basename(p)).join(', ')})`)

  // Pose-anchor da capa atual
  const existingBuf = await fs.readFile(existingCoverPath)
  const poseAnchorBuf = await sharp(existingBuf)
    .resize(640, 800, { fit: 'inside' })
    .jpeg({ quality: 90 })
    .toBuffer()

  // Brasão
  const crestExtra: Array<{ base64: string; mime: string }> = []
  if (preset.crestFile) {
    try {
      const c = await loadImageBase64(path.join(INFO_DIR, preset.crestFile))
      crestExtra.push({ base64: c.data, mime: c.mime })
    } catch {
      console.warn(`  ⚠ brasão não encontrado: ${preset.crestFile}`)
    }
  }

  // Fotos reais convertidas pra JPEG (hi-res para slugs high-fidelity)
  const hiRes = HIGH_FIDELITY_SLUGS.has(slug)
  const realRefs: Array<{ base64: string; mime: string }> = []
  for (const photoPath of realPhotos) {
    const r = await loadPhotoAsJpeg(photoPath, { hiRes })
    realRefs.push({ base64: r.data, mime: r.mime })
  }

  // [1/2] colorida
  console.log(`  → [1/2] colorida (pose-anchor + brasão + ${realRefs.length} foto(s) reais${hiRes ? ', hi-res' : ''})`)
  const colorPrompt = hiRes ? buildColorPromptHighFidelity(preset) : buildColorPrompt(preset)
  const colorResult = await generateJerseyCover({
    prompt: colorPrompt,
    referenceImageBase64: poseAnchorBuf.toString('base64'),
    referenceImageMime: 'image/jpeg',
    extraReferences: [...crestExtra, ...realRefs],
  })
  const colorBuffer = Buffer.from(colorResult.imageBase64, 'base64')

  // [2/2] apagada
  console.log(`  → [2/2] apagada (pose-anchor=colorida nova + ${realRefs.length} foto(s) reais${hiRes ? ', hi-res' : ''})`)
  const blackoutPrompt = hiRes ? buildBlackoutPromptHighFidelity(preset) : buildBlackoutPrompt(preset)
  const colorAsAnchor = await sharp(colorBuffer)
    .resize(512, 640, { fit: 'inside' })
    .jpeg({ quality: 85 })
    .toBuffer()
  const grayResult = await generateJerseyCover({
    prompt: blackoutPrompt,
    referenceImageBase64: colorAsAnchor.toString('base64'),
    referenceImageMime: 'image/jpeg',
    extraReferences: realRefs,
  })

  // Salvar (sobrescrever)
  const colorFile = `${slug}-cover-color.webp`
  const grayFile = `${slug}-cover-gray.webp`
  await sharp(colorBuffer)
    .resize(1024, 1280, { fit: 'cover', position: 'centre' })
    .webp({ quality: 95 })
    .toFile(path.join(COVERS_DIR, colorFile))
  await sharp(Buffer.from(grayResult.imageBase64, 'base64'))
    .resize(1024, 1280, { fit: 'cover', position: 'centre' })
    .webp({ quality: 95 })
    .toFile(path.join(COVERS_DIR, grayFile))
  console.log(`  ✓ Salvas: ${colorFile} + ${grayFile}`)

  // Atualizar banco — coloca cinza primeiro (default na vitrine) e colorida em segundo
  const publicGray = `/images/products/copa2026/covers/${grayFile}`
  const publicColor = `/images/products/copa2026/covers/${colorFile}`
  const candidates = [slug, `${slug}-torcedor`]
  const products = await prisma.product.findMany({ where: { slug: { in: candidates } } })
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
    }),
  )
  console.log(`  ✓ Banco atualizado (${products.length} produto(s))`)
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const slugArg = args.find((a) => !a.startsWith('--'))

  console.log(`🔍 Filtrando camisas qualificadas${slugArg ? ` (slug=${slugArg})` : ''}...`)
  const qualified = await findQualifyingSlugs(slugArg)
  console.log(`\n✅ ${qualified.length} camisa(s) qualificada(s):`)
  for (const q of qualified) {
    console.log(`   - ${q.slug} (${q.preset.team} ${q.preset.variant}) — ${q.realPhotos.length} fotos`)
  }

  if (dryRun) {
    console.log('\n[dry-run] nada foi gerado.')
    return
  }
  if (qualified.length === 0) {
    console.log('Nada a gerar.')
    return
  }

  let ok = 0
  const failed: Array<{ slug: string; error: string }> = []
  for (const q of qualified) {
    try {
      await generateAndSave(q)
      ok++
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error(`  ❌ Falha em ${q.slug}: ${msg}`)
      failed.push({ slug: q.slug, error: msg })
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`✅ Pronto: ${ok}/${qualified.length} capas geradas`)
  if (failed.length > 0) {
    console.log(`❌ ${failed.length} falhas:`)
    for (const f of failed) console.log(`   - ${f.slug}: ${f.error}`)
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
