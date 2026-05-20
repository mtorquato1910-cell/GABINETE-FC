/**
 * Teste — gera capa colorida + apagada do Brasil usando a FOTO REAL da camisa
 * como referência adicional, pra Gemini reproduzir o jacquard, gola dupla,
 * crest e demais detalhes fiéis à camisa que será vendida.
 *
 * Não atualiza banco. Salva em public/images/products/copa2026/covers/_tests/.
 *
 * Uso:
 *   npx dotenv-cli -e .env.local -- npx ts-node --transpile-only --project scripts/tsconfig.json scripts/test-cover-real-ref.ts
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { generateJerseyCover } from '../src/lib/gemini-image'

const REPO_ROOT = path.resolve(__dirname, '..', '..')
const INFO_DIR = path.join(REPO_ROOT, 'Informação Camisas')
const PHOTOS_DIR = path.join(__dirname, '..', 'public', 'images', 'products', 'copa2026', 'photos')
const COVERS_DIR = path.join(__dirname, '..', 'public', 'images', 'products', 'copa2026', 'covers')
const TESTS_DIR = path.join(COVERS_DIR, '_tests')

interface TestPreset {
  slug: string
  team: string
  variant: string
  primaryColor: string
  secondaryColor: string
  brand: string
  crest: string
  details: string
  crestFile: string
  realPhotos: string[]
}

const BRASIL_TEST: TestPreset = {
  slug: 'camisa-brasil-2026',
  team: 'Brazil',
  variant: 'I home',
  primaryColor: 'classic vibrant canary yellow #FEDD00',
  secondaryColor: 'bright green #009C3B with thin navy blue #002776 inner piping',
  brand: 'green Nike swoosh',
  crest: 'CBF crest with five small green stars above and "BRASIL" text in green',
  details: 'Classic Brazilian canarinho home jersey for the 2026 World Cup',
  crestFile: 'Brasil-1024x614.jpg',
  realPhotos: ['02-amarela.webp', '03-amarela.webp'],
}

async function loadImageBase64(fullPath: string, label: string): Promise<{ data: string; mime: string }> {
  const buf = await fs.readFile(fullPath)
  const lower = fullPath.toLowerCase()
  const mime =
    lower.endsWith('.png') ? 'image/png' :
    lower.endsWith('.svg') ? 'image/svg+xml' :
    lower.endsWith('.webp') ? 'image/webp' : 'image/jpeg'
  console.log(`    ${label}: ${(buf.length / 1024).toFixed(0)}KB (${mime})`)
  return { data: buf.toString('base64'), mime }
}

async function loadRealPhotoAsJpeg(slug: string, filename: string): Promise<{ data: string; mime: string }> {
  const full = path.join(PHOTOS_DIR, slug, filename)
  const buf = await fs.readFile(full)
  const jpegBuf = await sharp(buf)
    .resize(768, 1024, { fit: 'inside' })
    .jpeg({ quality: 90 })
    .toBuffer()
  console.log(`    real-photo[${filename}]: ${(jpegBuf.length / 1024).toFixed(0)}KB → JPEG`)
  return { data: jpegBuf.toString('base64'), mime: 'image/jpeg' }
}

function buildColorPromptWithRealRef(p: TestPreset): string {
  return `Professional product photography, ultra-detailed shot of a premium ${p.team} national football team jersey (kit ${p.variant}) in ${p.primaryColor}.

HOW TO USE THE REFERENCE IMAGES (read very carefully — this is the most important instruction):
- The FIRST reference image is the EXISTING STUDIO COVER of this jersey. You MUST replicate its POSE, ANGLE, ROTATION, FRAMING, BACKGROUND and LIGHTING with PIXEL-LEVEL fidelity. Same direction the torso is rotated, same shoulder elevation, same crop, same charcoal-black studio cyclorama, same dramatic chiaroscuro lighting. Treat the first reference as the ABSOLUTE TRUTH for pose and framing.
- The SECOND reference image is the federation crest art.
- The REMAINING reference images are PHOTOS OF THE REAL JERSEY. Use these ONLY to extract DESIGN DETAILS: fabric pattern, jacquard/embossed motifs, collar shape and color layering, sleeve cuff trim structure, crest layout, brand logo placement, and any authentic graphic detail. DO NOT copy the pose, camera angle, framing, lighting or background from these real-jersey photos — they are flat frontal store/mannequin shots and that pose is WRONG for this cover.

FINAL OUTPUT FORMULA: pose/angle/framing/background/lighting from the FIRST reference (existing cover) + design details (fabric pattern, collar, trim, crest art) from the real-jersey photos = the new cover.

BACKGROUND (critical): deep matte charcoal-black studio cyclorama — NOT pure flat #000000, NOT light charcoal grey. A rich dark matte charcoal-black with subtle depth and slight tonal variation, like an infinite seamless studio cyclorama where the floor and back wall merge into one continuous void. The background absorbs light, no reflections. Below the jersey there is a SOFT CONTACT SHADOW spreading naturally on the floor, slightly darker than the background, diffused and gradient, giving the jersey weight and grounding it as if floating just above the cyclorama floor.

JERSEY POSITION (CRITICAL): the jersey must DOMINATE the frame and occupy approximately 75-85% of the vertical frame — large, dramatic, catalog-style crop. The collar sits in the upper third of the image, the hem is just slightly out of frame at the bottom. The jersey is NOT small or distant; it is the heroic centerpiece of the image. The framing is tight and bold, NOT a small-product-floating-in-empty-space composition.

LIGHTING (critical): powerful directional top-down cinematic studio lighting from above and slightly to the front, focused to dramatically accent the STRONG contours of the broad shoulders and athletic torso. Hard high-contrast light creating defined highlights and deep shadows that sculpt the fabric folds. Combined with subtle RIM LIGHTING from the sides/back — a thin sharp accent of light that draws the silhouette edge along the shoulder line, sleeves and torso outline, separating the jersey from the dark background. Moody atmospheric high-contrast lighting that reveals the dry-fit mesh fabric texture. Neutral color temperature, NO bright bloom, NO lens flare.

FABRIC: extreme focus on the complex performance-mesh dry-fit fabric texture. PRESERVE any all-over tonal jacquard / embossed geometric pattern that is visible on the real-jersey reference photos — do NOT smooth it out or simplify to a plain body. The pattern, if present, must be subtle and tonal (same hue family as the primary color), exactly as in the references.

The ${p.crest} is richly embroidered on the LEFT chest from the viewer's perspective, with precise stitch texture, five stars where applicable, and the federation name clearly visible — matching the layout in the real-jersey reference photos. The ${p.brand} brand logo is applied as a precision heat-press material on the RIGHT chest from the viewer's perspective, matching the size and position seen in the references.

Collar: faithful to the real-jersey reference photos — replicate exact shape, color layering and trim. If the reference shows a V-neck with multi-tone ribbed trim and an inner contrast band, reproduce it exactly. NO polo collar, NO button-up placket, NO buttons unless visible in the references.

${p.details}.

Empty floating product shot — no mannequin visible, no hanger, no person, no body, no display stand. Hyper-realistic, 8k resolution, photorealistic, ultra-sharp focus, clean minimalist aesthetic, high-fashion sports catalog style.`
}

function buildBlackoutPromptWithRealRef(p: TestPreset): string {
  return `Professional product photography, ultra-detailed shot of a premium ${p.team} national football team jersey in a deep grayscale colorway, inspired by a dark "hype drop" aesthetic. The entire jersey is rendered in sophisticated tones of matte gray.

HOW TO USE THE REFERENCE IMAGES (read very carefully):
- The FIRST reference image is the NEW COLORED COVER you must mirror — match its POSE, ANGLE, ROTATION, FRAMING, CROP, BACKGROUND and LIGHTING with PIXEL-LEVEL fidelity. The two covers (color + gray) MUST look like the same product photographed in the same studio setup, only differing in colorway.
- The REMAINING reference images are PHOTOS OF THE REAL JERSEY. Use them ONLY to preserve AUTHENTIC DESIGN DETAILS — fabric jacquard/embossed pattern, collar shape and layering, sleeve cuff trim structure, crest layout, brand logo placement. DO NOT copy their pose/angle/framing/lighting.

FINAL OUTPUT FORMULA: pose/angle/framing/background/lighting from the FIRST reference (colored cover) + design details from the real-jersey photos + ALL colors converted to monochrome grayscale = the new gray cover.

BACKGROUND (critical): deep matte charcoal-black studio cyclorama — NOT pure flat #000000, NOT light charcoal grey. A rich dark matte charcoal-black with subtle depth, like an infinite seamless studio cyclorama where the floor and back wall merge into one continuous void. Below the jersey there is a SOFT CONTACT SHADOW spreading naturally on the floor, slightly darker than the background, diffused and gradient, grounding the jersey as if floating just above the cyclorama floor.

JERSEY POSITION (CRITICAL): match the colored cover EXACTLY — jersey dominates the frame at 75-85% vertical fill, collar in the upper third, hem just slightly out of frame at the bottom. NOT a small floating product in empty space.

COLOR PALETTE (critical): PURELY MONOCHROMATIC grayscale — using only shades of light gray, medium gray, and charcoal black. The gray tone must be NEUTRAL or slightly WARM — ABSOLUTELY NO BLUE TINT, NO BLUE UNDERTONES, NO COOL CYAN HUES, NO SILVERY METALLIC SHEEN, NO ICE-BLUE colors. The jersey should look like a true black-and-white photograph or a sophisticated chiaroscuro rendering — neutral grays only, like a B&W studio shot.

LIGHTING (critical): strong high-contrast directional top-down lighting from above, designed to dramatically highlight the strong contours of the broad athletic shoulders and torso. Chiaroscuro effect — deep blacks and defined grays sculpting the fabric and form. Combined with PROMINENT RIM LIGHTING from the sides/back — sharp accent line drawing the silhouette edge along shoulders, sleeves and torso, ESSENTIAL to separate the gray jersey from the dark charcoal-black background (otherwise the dark jersey would disappear). The rim light is NEUTRAL WHITE, not cool blue. Moody high-contrast atmospheric lighting revealing the dry-fit mesh fabric texture. NEUTRAL color temperature only, NO blue tones, NO cool cyan, NO lens flare.

FABRIC: ultra-sharp focus on the intricate, fine dry-fit fabric mesh texture. PRESERVE the all-over tonal jacquard / embossed geometric pattern that is visible on the real-jersey reference photos — render it as a subtle gray-on-gray tonal pattern (NOT smoothed out). The collar layering and sleeve cuff trim structure stay faithful to the real jersey, just rendered in deep gray tones instead of green.

All branding is monochromatic: the ${p.crest} is rendered in matching dark gray embroidery with precise stitching on the LEFT chest from the viewer's perspective, and the ${p.brand} brand logo on the RIGHT chest as a tonal heat-press material in dark matte gray. The crest layout (stars, BRASIL wordmark) follows the real-jersey reference photos exactly, just monochrome.

Collar: faithful to the real-jersey reference photos in SHAPE and STRUCTURE (multi-tone V-neck with inner contrast band if present in the references), but rendered fully in neutral gray tones — darker gray for the outer ribbed trim and slightly lighter gray for the inner band. Matching ribbed sleeve cuffs in dark gray.

Empty floating product shot — no mannequin visible, no hanger, no person, no body, no display stand. Hyper-realistic, 8k resolution, photorealistic, ultra-sharp focus, clean minimalist aesthetic, high-fashion sports catalog style, premium "blackout" colorway.`
}

async function main() {
  await fs.mkdir(TESTS_DIR, { recursive: true })
  const p = BRASIL_TEST
  console.log(`\n━━━ TESTE COM REFERÊNCIA REAL — ${p.team} ${p.variant} (${p.slug}) ━━━\n`)

  console.log('  Carregando referências:')

  // 1º ref (âncora de pose) = capa atual do produto, convertida pra JPEG
  const existingCoverPath = path.join(COVERS_DIR, `${p.slug}-cover-color.webp`)
  const existingBuf = await fs.readFile(existingCoverPath)
  const poseAnchorBuf = await sharp(existingBuf)
    .resize(640, 800, { fit: 'inside' })
    .jpeg({ quality: 90 })
    .toBuffer()
  console.log(`    pose-anchor (capa atual): ${(poseAnchorBuf.length / 1024).toFixed(0)}KB`)

  const crest = await loadImageBase64(path.join(INFO_DIR, p.crestFile), 'crest')
  const realRefs: Array<{ base64: string; mime: string }> = []
  for (const photo of p.realPhotos) {
    const r = await loadRealPhotoAsJpeg(p.slug, photo)
    realRefs.push({ base64: r.data, mime: r.mime })
  }

  console.log('\n  → [1/2] Gerando COLORIDA (pose-anchor=capa atual + crest + 2 fotos reais)...')
  const colorPrompt = buildColorPromptWithRealRef(p)
  const colorResult = await generateJerseyCover({
    prompt: colorPrompt,
    referenceImageBase64: poseAnchorBuf.toString('base64'),
    referenceImageMime: 'image/jpeg',
    extraReferences: [{ base64: crest.data, mime: crest.mime }, ...realRefs],
  })
  const colorBuffer = Buffer.from(colorResult.imageBase64, 'base64')
  const colorFile = path.join(TESTS_DIR, `${p.slug}-realref-cover-color.webp`)
  await sharp(colorBuffer)
    .resize(1024, 1280, { fit: 'cover', position: 'centre' })
    .webp({ quality: 95 })
    .toFile(colorFile)
  console.log(`  ✓ Colorida → ${path.relative(REPO_ROOT, colorFile)}`)

  console.log('\n  → [2/2] Gerando APAGADA (colorida nova como pose-anchor + fotos reais)...')
  const blackoutPrompt = buildBlackoutPromptWithRealRef(p)
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
  const grayFile = path.join(TESTS_DIR, `${p.slug}-realref-cover-gray.webp`)
  await sharp(Buffer.from(grayResult.imageBase64, 'base64'))
    .resize(1024, 1280, { fit: 'cover', position: 'centre' })
    .webp({ quality: 95 })
    .toFile(grayFile)
  console.log(`  ✓ Apagada → ${path.relative(REPO_ROOT, grayFile)}`)

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`✅ Teste concluído. Compare:`)
  console.log(`   ATUAL : public/images/products/copa2026/covers/${p.slug}-cover-color.webp`)
  console.log(`   NOVO  : public/images/products/copa2026/covers/_tests/${p.slug}-realref-cover-color.webp`)
}

main().catch((e) => { console.error(e); process.exit(1) })
