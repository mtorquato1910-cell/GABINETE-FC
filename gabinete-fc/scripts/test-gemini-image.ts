/**
 * Teste rápido — processa UMA imagem com Gemini 2.5 Flash Image (Nano Banana).
 * Output: public/images/products/copa2026/_test-gemini.webp
 */

import { config } from 'dotenv'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { GoogleGenAI } from '@google/genai'
import sharp from 'sharp'

config({ path: path.resolve(__dirname, '..', '.env.local') })

const API_KEY = process.env.GEMINI_API_KEY
if (!API_KEY) {
  console.error('❌ GEMINI_API_KEY não encontrado em .env.local')
  process.exit(1)
}

const INPUT_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  'imagens-raw',
  'Brasil - jogador - amarela- manga curta (camisa destaque home)',
  '001.jpg'
)
const OUTPUT_DIR = path.resolve(
  __dirname,
  '..',
  'public',
  'images',
  'products',
  'copa2026'
)
const OUTPUT_NAME = '_test-gemini.webp'

// Prompt revisado pelo @qa após detectar que pedir aspect ratio no prompt
// fazia o Gemini criar letterbox (moldura branca). Agora o resize fica no Sharp.
const PROMPT = `INSTRUÇÃO CRÍTICA: A imagem de saída NÃO contém a imagem de entrada inserida dentro dela. É uma edição direta, não uma composição com moldura.

Edite esta foto. Saída: UMA única imagem com fundo cinza claro sólido #F5F5F5 ocupando 100% do quadro, edge-to-edge, full-bleed.

═══ REGRA #1 — FUNDO (mais importante) ═══
• O fundo é UMA cor cinza clara sólida #F5F5F5
• Esse cinza preenche cada pixel do canto superior-esquerdo (0,0) até o canto inferior-direito da imagem final
• Os 4 cantos da imagem são cinza #F5F5F5
• As 4 bordas (topo, base, esquerda, direita) são cinza #F5F5F5
• Não existe passe-partout, não existe borda branca de Polaroid, não existe foto dentro de foto, não existe quadro
• Substitua todo pixel branco, off-white, parede de estúdio e qualquer cenário original por #F5F5F5
• Mantenha a mesma proporção da imagem de entrada — não adicione barras, letterbox ou pillarbox

═══ MANEQUIM ═══
• Mantenha o manequim torso PRETO sólido exatamente como está
• Mesma pose, mesmo material, mesma cor preta
• Não substitua por outro objeto, não mude para cinza

═══ CAMISA ═══
• Preserve 100% fiel: cores, tecido, escudo, listras, logo do fabricante, gola, números, patrocinador, costuras
• Texto, números e logos intactos — não redesenhe
• Suavize apenas dobras e vincos para aparência recém-passada

═══ COMPOSIÇÃO ═══
• Manequim + camisa centralizados, ocupando cerca de 85% da altura
• Sombra de contato sutil sob o manequim, mesma família cinza (variação tonal pequena), nunca preta forte
• Iluminação difusa de estúdio, sem reflexos duros
• Mesmo ângulo de câmera da foto original

═══ AFIRMAÇÕES FINAIS ═══
• A imagem final é continuamente cinza #F5F5F5 em todo o fundo, sem qualquer interrupção, divisão ou moldura
• Apenas o manequim preto e a camisa interrompem o cinza`

async function main() {
  console.log('🌱 Teste Gemini 2.5 Flash Image — 1 imagem\n')
  console.log(`   Input:  ${INPUT_PATH}`)
  console.log(`   Output: ${path.join(OUTPUT_DIR, OUTPUT_NAME)}\n`)

  const fileData = await fs.readFile(INPUT_PATH)
  const base64 = fileData.toString('base64')
  console.log(`   ✓ Imagem original carregada (${(fileData.length / 1024).toFixed(0)} KB)`)

  const ai = new GoogleGenAI({ apiKey: API_KEY })

  console.log('   ⏳ Enviando pro Gemini...')
  const t0 = Date.now()

  // Tenta modelos em ordem de preferência (nomes mudaram entre versões da API)
  const MODEL_CANDIDATES = [
    'gemini-2.5-flash-image',
    'gemini-2.5-flash-image-preview',
    'gemini-2.0-flash-preview-image-generation',
    'gemini-2.0-flash-exp-image-generation',
  ]

  let response: any = null
  let usedModel = ''
  let lastErr: any = null
  for (const model of MODEL_CANDIDATES) {
    try {
      response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              { text: PROMPT },
              { inlineData: { mimeType: 'image/jpeg', data: base64 } },
            ],
          },
        ],
      })
      usedModel = model
      break
    } catch (err: any) {
      lastErr = err
      const msg = err?.message ?? String(err)
      if (msg.includes('NOT_FOUND') || msg.includes('not found')) {
        console.log(`   ✗ ${model} indisponível, tentando próximo...`)
        continue
      }
      throw err
    }
  }

  if (!response) {
    console.error('❌ Nenhum modelo image-gen disponível pra essa API key.')
    console.error('   Último erro:', lastErr?.message ?? lastErr)
    process.exit(1)
  }
  console.log(`   ✓ Modelo usado: ${usedModel}`)

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
  console.log(`   ✓ Resposta recebida em ${elapsed}s\n`)

  // Procura a imagem na resposta
  const candidates = response.candidates ?? []
  let outputBuffer: Buffer | null = null
  let textResponse = ''

  for (const cand of candidates) {
    const parts = cand.content?.parts ?? []
    for (const part of parts) {
      if (part.inlineData?.data) {
        outputBuffer = Buffer.from(part.inlineData.data, 'base64')
      } else if (part.text) {
        textResponse += part.text + '\n'
      }
    }
  }

  if (textResponse) {
    console.log('   📝 Texto da resposta:')
    console.log('   ' + textResponse.trim().split('\n').join('\n   '))
    console.log()
  }

  if (!outputBuffer) {
    console.error('❌ Gemini não retornou imagem. Texto recebido:')
    console.error(textResponse)
    console.error('\nResposta completa:')
    console.error(JSON.stringify(response, null, 2))
    process.exit(1)
  }

  console.log(`   ✓ Imagem extraída (${(outputBuffer.length / 1024).toFixed(0)} KB)`)

  await fs.mkdir(OUTPUT_DIR, { recursive: true })
  const outputPath = path.join(OUTPUT_DIR, OUTPUT_NAME)

  // Trim remove bordas uniformes (qualquer tarja branca/cinza nas extremidades)
  // Depois compose center em canvas #F5F5F5 1200×1500 — garante fundo totalmente uniforme
  const BG = { r: 0xf5, g: 0xf5, b: 0xf5 }

  // ─── ETAPA 1: detecta bounding box do conteúdo (pixel-level) ───
  // Considera "fundo" qualquer pixel próximo do cinza alvo #F5F5F5 (±18 por canal),
  // ou branco/off-white. Tudo o resto (manequim preto, camisa colorida) é conteúdo.
  const flat = await sharp(outputBuffer)
    .removeAlpha()
    .flatten({ background: { r: 0xf5, g: 0xf5, b: 0xf5 } })
    .toBuffer()
  const { data: pixels, info } = await sharp(flat)
    .raw()
    .toBuffer({ resolveWithObject: true })
  const { width: pw, height: ph, channels: pc } = info

  const BG_TARGET = { r: 0xf5, g: 0xf5, b: 0xf5 }
  const BG_TOLERANCE = 18 // ±18 por canal cobre cinza F5±18 e até white puro
  let minX = pw,
    minY = ph,
    maxX = 0,
    maxY = 0
  for (let y = 0; y < ph; y++) {
    for (let x = 0; x < pw; x++) {
      const idx = (y * pw + x) * pc
      const r = pixels[idx]
      const g = pixels[idx + 1]
      const b = pixels[idx + 2]
      const isBg =
        Math.abs(r - BG_TARGET.r) <= BG_TOLERANCE &&
        Math.abs(g - BG_TARGET.g) <= BG_TOLERANCE &&
        Math.abs(b - BG_TARGET.b) <= BG_TOLERANCE
      // Também trata branco puro / off-white como fundo
      const isNearWhite = r >= 240 && g >= 240 && b >= 240
      if (!isBg && !isNearWhite) {
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }
  }

  // Se nada foi detectado (imagem 100% fundo), usa tudo
  if (minX > maxX || minY > maxY) {
    minX = 0
    minY = 0
    maxX = pw - 1
    maxY = ph - 1
  }

  // Margem pequena pra não cortar sombra/anti-alias
  const MARGIN = 6
  minX = Math.max(0, minX - MARGIN)
  minY = Math.max(0, minY - MARGIN)
  maxX = Math.min(pw - 1, maxX + MARGIN)
  maxY = Math.min(ph - 1, maxY + MARGIN)
  const bboxW = Math.max(1, maxX - minX + 1)
  const bboxH = Math.max(1, maxY - minY + 1)
  console.log(`   ✂️  Bounding box do conteúdo: ${bboxW}×${bboxH} (de ${pw}×${ph})`)

  // ─── ETAPA 2: extrai só a área do conteúdo ───
  const extracted = await sharp(outputBuffer)
    .extract({ left: minX, top: minY, width: bboxW, height: bboxH })
    .toBuffer()

  // ─── ETAPA 3: redimensiona pra ocupar 94% da menor dimensão do canvas final ───
  const TARGET_W = 1200
  const TARGET_H = 1500
  const maxInner = Math.min(TARGET_W, TARGET_H) * 0.94
  const scale = maxInner / Math.max(bboxW, bboxH)
  const innerW = Math.round(bboxW * scale)
  const innerH = Math.round(bboxH * scale)

  const resized = await sharp(extracted)
    .resize(innerW, innerH, { fit: 'inside' })
    .toBuffer()

  // ─── ETAPA 4: composite center sobre canvas cinza puro 1200×1500 ───
  await sharp({
    create: { width: TARGET_W, height: TARGET_H, channels: 3, background: BG },
  })
    .composite([{ input: resized, gravity: 'center' }])
    .webp({ quality: 92, effort: 5 })
    .toFile(outputPath)

  const stats = await fs.stat(outputPath)
  console.log(`   ✓ Salvo: ${OUTPUT_NAME} (${(stats.size / 1024).toFixed(0)} KB WebP)\n`)
  console.log('🎉 Pronto. Abra a imagem em:')
  console.log(`   ${outputPath}`)
}

main().catch((err) => {
  console.error('❌ Erro:', err)
  process.exit(1)
})
