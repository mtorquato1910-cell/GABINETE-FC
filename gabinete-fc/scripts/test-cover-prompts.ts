/**
 * Gera 3 variantes da capa APAGADA do Brasil I pra comparação.
 * Não atualiza banco — só salva em _tests/.
 *
 * Uso:
 *   npx dotenv-cli -e .env.local -- npx ts-node --transpile-only --project scripts/tsconfig.json scripts/test-cover-prompts.ts
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { generateJerseyCover } from '../src/lib/gemini-image'

const REPO_ROOT = path.resolve(__dirname, '..', '..')
const INFO_DIR = path.join(REPO_ROOT, 'Informação Camisas')
const TESTS_DIR = path.join(__dirname, '..', 'public', 'images', 'products', 'copa2026', 'covers', '_tests')

async function loadCrest(filename: string) {
  const buf = await fs.readFile(path.join(INFO_DIR, filename))
  return { data: buf.toString('base64'), mime: 'image/jpeg' }
}

// V1: prompt 1 do usuário (home jersey amarela)
const PROMPT_V1 = `Professional product photography of a Brazil national football team home jersey,
vibrant golden yellow body with bright green V-collar, green side stripes and green cuff trim,
CBF crest embroidered on chest, Nike swoosh in green,
floating ghost mannequin style,
dark charcoal background with dramatic studio spotlight from above,
streetwear hype editorial aesthetic, high contrast,
subtle yellow and green neon glow rim lighting,
centered composition, hyper detailed fabric weave texture, premium sportswear catalog, 4k.
The jersey is large and dominant, filling about 85% of the vertical frame, tight catalog crop with the bottom hem just slightly out of frame.
Empty floating product shot — no mannequin, no hanger, no person, no body. Front view only.`

// V2: prompt 2 do usuário (away silver-grey body)
const PROMPT_V2 = `Professional product photography of a Brazil national football team away jersey,
light silver-grey body with dark charcoal black V-collar and black cuff trim,
tonal CBF crest on chest in grey, Nike swoosh in dark grey,
floating ghost mannequin style,
very dark near-black background with single dramatic cool studio spotlight creating a bright silver sheen on the fabric,
streetwear hype editorial aesthetic, high contrast monochromatic palette,
subtle cool grey metallic rim light, centered composition,
hyper detailed fabric weave texture, premium sportswear catalog, 4k.
The jersey is large and dominant, filling about 85% of the vertical frame, tight catalog crop with the bottom hem just slightly out of frame.
Empty floating product shot — no mannequin, no hanger, no person, no body. Front view only.`

// V3: proposta Orion — Stealth Blackout edition (camisa escura com spotlight quente)
const PROMPT_V3 = `Professional product photography of a Brazil national football team stealth blackout edition home jersey,
deep charcoal grey body with matte black V-collar and black cuff trim,
tonal CBF crest blacked out in deep grey on chest, Nike swoosh in matte black,
floating ghost mannequin style,
dark charcoal background with a single bright warm spotlight from above creating a soft glow halo around the jersey,
strong contrast between the dark jersey and the slightly lighter spotlit background area behind it,
streetwear hype editorial aesthetic, premium "blackout" colorway,
subtle warm rim light along shoulders and sleeves,
centered composition, hyper detailed fabric weave texture, premium sportswear catalog, 4k.
The jersey is large and dominant, filling about 85% of the vertical frame, tight catalog crop with the bottom hem just slightly out of frame.
Empty floating product shot — no mannequin, no hanger, no person, no body. Front view only.`

const TESTS = [
  { id: 'v1-prompt1-amarela', prompt: PROMPT_V1 },
  { id: 'v2-prompt2-silver-grey', prompt: PROMPT_V2 },
  { id: 'v3-stealth-blackout', prompt: PROMPT_V3 },
]

async function main() {
  await fs.mkdir(TESTS_DIR, { recursive: true })
  const crest = await loadCrest('Brasil-1024x614.jpg')
  console.log(`✓ Brasão CBF carregado`)

  for (const t of TESTS) {
    console.log(`\n━━━ ${t.id} ━━━`)
    console.log('  → Gerando...')
    const result = await generateJerseyCover({
      prompt: t.prompt,
      referenceImageBase64: crest.data,
      referenceImageMime: crest.mime,
    })
    const file = path.join(TESTS_DIR, `brasil-${t.id}.webp`)
    await sharp(Buffer.from(result.imageBase64, 'base64'))
      .resize(1024, 1280, { fit: 'cover', position: 'centre' })
      .webp({ quality: 88 })
      .toFile(file)
    console.log(`  ✓ Salvo: ${path.relative(REPO_ROOT, file)}`)
  }

  console.log('\n✅ 3 versões geradas em public/images/products/copa2026/covers/_tests/')
}

main().catch((e) => { console.error(e); process.exit(1) })
