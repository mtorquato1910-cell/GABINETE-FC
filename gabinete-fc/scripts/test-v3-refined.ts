/**
 * Gera 2 imagens FUSION pro Brasil:
 *   - Colorida: amarela canarinho, 8K hiper-realista, torso inclinado 15° à direita
 *   - Apagada: stealth blackout monocromática, mesmas características
 *
 * Combina:
 *   - Linguagem de textura dos prompts referência do usuário (rib-knit, heat-press, embroidery)
 *   - Fundo preto puro com spotlight cool no topo (aprovado anteriormente)
 *   - Inclinação dinâmica 3/4 à direita (igual print Lovable)
 *
 * Salva em _tests/.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { generateJerseyCover } from '../src/lib/gemini-image'

const REPO_ROOT = path.resolve(__dirname, '..', '..')
const INFO_DIR = path.join(REPO_ROOT, 'Informação Camisas')
const TESTS_DIR = path.join(__dirname, '..', 'public', 'images', 'products', 'copa2026', 'covers', '_tests')

const PROMPT_FUSION_COLORIDA = `Ultra-detailed, hyper-realistic professional product photography of a premium Brazil national football team home jersey for the 2026 World Cup.

The jersey is classic vibrant canary yellow with a dynamic, intricate performance-mesh weave pattern visible across the fabric. The V-neck collar features structured bright green rib-knit trim with a subtle thin navy blue inner piping. The sleeve cuffs have matching bright green rib-knit trim. Subtle tonal-on-tonal Jordan Brand elephant-print pattern is applied on the shoulders. The CBF (Confederação Brasileira de Futebol) crest with its five small green stars and "BRASIL" text in green is rendered with detailed high-quality embroidery texture on the LEFT chest from the viewer's perspective. A green Nike swoosh applied as a precise heat-press material is on the RIGHT chest from the viewer's perspective.

POSE (critical): the jersey is presented in a floating 3D ghost mannequin style, with the torso rotated slightly to the RIGHT (about 15 degrees three-quarter angle view). The left side of the chest appears slightly more forward while the right shoulder recedes slightly back, creating a dynamic angled stance — NOT a flat frontal view. Sculpted, natural form with subtle fabric folds along the torso and shoulders.

BACKGROUND: PURE DEEP BLACK background with a soft cool white spotlight from above the frame, creating a subtle top-down gradient — slightly lighter at the top edge and fading to pure deep black everywhere else. The spotlight illuminates only the upper area from above like an overhead stage light. NO warm tones, NO halo behind the jersey, NO charcoal grey background.

LIGHTING: cinematic, directional top-down studio lighting with rim-lighting along the shoulder contours and collar, casting deep shadows and dramatic highlights that accentuate every fiber of the fabric, every seam, every emblem. Ultra-sharp focus on the central chest and crest.

FRAMING: the jersey is large and dominant, filling about 85% of the vertical frame, tight catalog crop with the bottom hem just slightly out of frame.

Empty floating product shot — no mannequin, no hanger, no person, no body, no display stand. Front view only.
8k resolution, photorealistic, premium catalog quality, streetwear hype editorial aesthetic.`

const PROMPT_FUSION_APAGADA = `Ultra-detailed, hyper-realistic professional product photography of a premium monochromatic football jersey, the "stealth blackout" edition of the Brazil national team home jersey, in a deep charcoal grey and dark slate tonal colorway.

The entire jersey features a uniform complex textured performance-mesh fabric weave, all elements rendered in a tonal dark grey palette. The V-neck collar and sleeve cuffs are contrasting matte black with subtle ribbed knit texture. Subtle tonal-on-tonal Jordan Brand elephant-print pattern in dark grey is applied on the shoulders. The CBF Brazilian crest with five stars and "BRASIL" is rendered as a sophisticated monochrome dark grey embroidery with sharp clear stitches on the LEFT chest from the viewer's perspective. The Nike swoosh in matte black is a precision-cut heat-press application on the RIGHT chest from the viewer's perspective.

POSE (critical): the jersey is presented in a floating 3D ghost mannequin style, with the torso rotated slightly to the RIGHT (about 15 degrees three-quarter angle view). The left side of the chest appears slightly more forward while the right shoulder recedes slightly back, creating a dynamic angled stance — NOT a flat frontal view. Sculpted natural form with subtle fabric folds along the torso and shoulders.

BACKGROUND: PURE DEEP BLACK background with a soft cool white spotlight from above the frame, creating a subtle top-down gradient — slightly lighter at the top edge and fading to pure deep black everywhere else. The spotlight illuminates only the upper area from above like an overhead stage light. NO warm tones, NO orange glow, NO halo behind the jersey.

LIGHTING: intense directional rim-lighting along the shoulder contours and dramatic top-down illumination, highlighting the contours and complex textures of the grey-toned fabric, seams, and branding with high contrast. Ultra-sharp focus on the fabric texture and crest details.

FRAMING: the jersey is large and dominant, filling about 85% of the vertical frame, tight catalog crop with the bottom hem just slightly out of frame.

Empty floating product shot — no mannequin, no hanger, no person, no body, no display stand. Front view only.
8k resolution, photorealistic, high-fashion editorial streetwear style, premium "blackout" colorway.`

async function main() {
  await fs.mkdir(TESTS_DIR, { recursive: true })

  const crestBuf = await fs.readFile(path.join(INFO_DIR, 'Brasil-1024x614.jpg'))
  const crest = { data: crestBuf.toString('base64'), mime: 'image/jpeg' as const }
  console.log('✓ Brasão CBF carregado')

  console.log('\n━━━ FUSION Colorida (8K + textura rica + 15° à direita) ━━━')
  const colorResult = await generateJerseyCover({
    prompt: PROMPT_FUSION_COLORIDA,
    referenceImageBase64: crest.data,
    referenceImageMime: crest.mime,
  })
  const colorBuffer = Buffer.from(colorResult.imageBase64, 'base64')
  const colorFile = path.join(TESTS_DIR, 'brasil-fusion-colorida.webp')
  await sharp(colorBuffer)
    .resize(1024, 1280, { fit: 'cover', position: 'centre' })
    .webp({ quality: 88 })
    .toFile(colorFile)
  console.log(`  ✓ ${path.basename(colorFile)}`)

  console.log('\n━━━ FUSION Apagada (stealth blackout + 15° à direita herdando pose) ━━━')
  const apagadaResult = await generateJerseyCover({
    prompt: PROMPT_FUSION_APAGADA,
    referenceImageBase64: colorBuffer.toString('base64'),
    referenceImageMime: 'image/png',
  })
  const apagadaFile = path.join(TESTS_DIR, 'brasil-fusion-apagada.webp')
  await sharp(Buffer.from(apagadaResult.imageBase64, 'base64'))
    .resize(1024, 1280, { fit: 'cover', position: 'centre' })
    .webp({ quality: 88 })
    .toFile(apagadaFile)
  console.log(`  ✓ ${path.basename(apagadaFile)}`)

  console.log('\n✅ 2 imagens FUSION salvas em _tests/')
}

main().catch((e) => { console.error(e); process.exit(1) })
