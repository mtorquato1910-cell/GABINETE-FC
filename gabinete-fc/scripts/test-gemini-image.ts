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

const PROMPT = `Foto profissional de e-commerce de uma camisa de futebol oficial em manequim.

INSTRUÇÕES OBRIGATÓRIAS:
- Mantenha exatamente a camisa original: as cores, o tecido, todos os detalhes do escudo, listras, logo do fabricante e gola
- NÃO altere nenhum elemento gráfico, texto, número ou patrocinador da camisa
- Mantenha o manequim no enquadramento
- Substitua o fundo por um cinza claro neutro #F5F5F5
- Suavize quaisquer dobras, vincos ou amassados na camisa para que ela pareça nova e bem passada
- Suavize papel embaixo ou enchimentos visíveis no manequim
- Iluminação difusa de estúdio de fotografia profissional
- Camisa centralizada, preenchendo cerca de 90% do quadro
- Sombra suave abaixo do manequim para dar profundidade
- Qualidade alta como foto premium de e-commerce de moda esportiva
- Proporção retrato 4:5 (1024×1280)`

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

  await sharp(outputBuffer)
    .resize(1200, 1500, { fit: 'contain', background: { r: 0xf5, g: 0xf5, b: 0xf5 } })
    .webp({ quality: 90, effort: 4 })
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
