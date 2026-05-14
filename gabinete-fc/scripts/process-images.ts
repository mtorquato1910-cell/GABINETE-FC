/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Pipeline de processamento de imagens das camisas — Gemini 2.5 Flash Image + Sharp
 *
 * Como usar:
 *   1) Configure GEMINI_API_KEY no .env.local (https://aistudio.google.com/app/apikey)
 *   2) Crie pastas em /imagens-raw/ (raiz do repo) com o padrão:
 *        - "Brasil Jogador"
 *        - "Brasil Torcedor"
 *        - "Brasil II Jogador"               (variante reserva = II)
 *        - "Brasil III Jogador"              (terceiro uniforme = III)
 *        - "Brasil Jogador Manga Longa"      (versão manga longa)
 *      Dentro de cada pasta:
 *        - Imagem com prefixo 001 → frente (foto principal)
 *        - Imagem com prefixo 021 → costas
 *        - Demais → galeria adicional
 *   3) Rode: npm run images:process
 *
 * O script:
 *   - Envia cada imagem pro Gemini 2.5 Flash Image (fundo branco, manequim preto preservado)
 *   - Para versão TORCEDOR usa prompt de CABIDE (não manequim)
 *   - Detecta bbox do conteúdo (corta tarja branca residual)
 *   - Aplica sharpen + composite em canvas 1200×1500 branco puro
 *   - Salva em /public/images/products/copa2026/{slug}.webp
 *   - Atualiza Product.images no Supabase
 */

import { config } from 'dotenv'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import sharp from 'sharp'
import { GoogleGenAI } from '@google/genai'
import { PrismaClient } from '@prisma/client'

config({ path: path.resolve(__dirname, '..', '.env.local') })

// ─── Config ──────────────────────────────────────────────────
const TOKEN = process.env.GEMINI_API_KEY
if (!TOKEN) {
  console.error('❌ GEMINI_API_KEY não encontrado em .env.local')
  process.exit(1)
}

const REPO_ROOT = path.resolve(__dirname, '..', '..')
const INPUT_DIR = path.join(REPO_ROOT, 'imagens-raw')
const OUTPUT_DIR = path.resolve(__dirname, '..', 'public', 'images', 'products', 'copa2026')
const REVIEW_DIR = path.join(OUTPUT_DIR, '_revisar')

const OUTPUT_W = 1200
const OUTPUT_H = 1500
const BG = { r: 0xff, g: 0xff, b: 0xff } // branco puro
const MAX_RETRIES = 2 // total de tentativas = 1 + MAX_RETRIES

const MODEL_CANDIDATES = [
  'gemini-2.5-flash-image',
  'gemini-2.5-flash-image-preview',
  'gemini-2.0-flash-preview-image-generation',
  'gemini-2.0-flash-exp-image-generation',
]

const prisma = new PrismaClient()
const ai = new GoogleGenAI({ apiKey: TOKEN })
let resolvedModel: string | null = null

// ─── Prompts ─────────────────────────────────────────────────
const PROMPT_JOGADOR = `INSTRUÇÃO CRÍTICA: A imagem de saída NÃO contém a imagem de entrada inserida dentro dela. É uma edição direta, não uma composição com moldura.

Edite esta foto. Saída: UMA única imagem com fundo branco puro sólido #FFFFFF ocupando 100% do quadro, edge-to-edge, full-bleed.

═══ REGRA #1 — FUNDO (mais importante) ═══
• O fundo é UMA cor branca pura sólida #FFFFFF
• Esse branco preenche cada pixel do canto superior-esquerdo (0,0) até o canto inferior-direito da imagem final
• Os 4 cantos da imagem são branco #FFFFFF
• As 4 bordas (topo, base, esquerda, direita) são branco #FFFFFF
• Se a foto original tem fundo cinza, off-white, bege, papel de estúdio, parede, sombra de cenário ou qualquer cor que NÃO seja parte da camisa ou do manequim: SUBSTITUA TODOS esses pixels por branco puro #FFFFFF
• Não existe passe-partout, não existe borda cinza ou colorida, não existe foto dentro de foto, não existe quadro
• Mantenha a mesma proporção da imagem de entrada — não adicione barras, letterbox ou pillarbox

═══ REGRA #2 — MANEQUIM ═══
• O manequim deve aparecer na foto editada — NÃO o remova
• Mantenha o manequim torso PRETO sólido exatamente igual à foto original: mesma forma, mesma pose, mesma cor preta
• Manequim sem cabeça e sem braços (estilo busto de loja) — esse é o estilo correto, mantenha assim
• A camisa permanece vestida no manequim como na original
• NÃO complete o manequim com cabeça, rosto, pescoço, braços, mãos, pernas ou qualquer parte de corpo humano que não exista na foto original
• NÃO transforme o manequim em pessoa, em humano ou em modelo vivo
• NÃO substitua o manequim por outro suporte (cabide, fundo liso, etc) — É manequim preto

═══ CAMISA ═══
• Preserve 100% fiel: cores, tecido, escudo, listras, logo do fabricante, gola, números, patrocinador, costuras
• Texto, números e logos intactos — não redesenhe
• Suavize apenas dobras e vincos para aparência recém-passada

═══ NITIDEZ E QUALIDADE ═══
• Alta resolução com máxima nitidez fotográfica profissional
• Detalhes da camisa precisos: textura do tecido, costuras visíveis, escudo bordado nítido, números legíveis
• Sem desfoque, sem suavização excessiva, sem perda de detalhe
• Foco perfeito em toda a camisa

═══ COMPOSIÇÃO ═══
• Manequim + camisa centralizados, ocupando cerca de 85% da altura
• Sombra de contato muito sutil sob o manequim, em cinza claro suave (não preta forte)
• Iluminação difusa de estúdio, sem reflexos duros
• Mesmo ângulo de câmera da foto original

═══ AFIRMAÇÕES FINAIS ═══
• A imagem final é continuamente branco #FFFFFF em todo o fundo, sem qualquer interrupção, divisão ou moldura
• O manequim torso preto está presente, vestindo a camisa
• Nenhuma parte de corpo humano (cabeça, rosto, braços) foi adicionada além do que já existe na foto original`

const PROMPT_TORCEDOR = `INSTRUÇÃO CRÍTICA: A imagem de saída NÃO contém a imagem de entrada inserida dentro dela. É uma edição direta, não uma composição com moldura.

Edite esta foto. Saída: UMA única imagem com fundo branco puro sólido #FFFFFF ocupando 100% do quadro, edge-to-edge, full-bleed.

═══ REGRA #1 — FUNDO (mais importante) ═══
• O fundo é UMA cor branca pura sólida #FFFFFF
• Esse branco preenche cada pixel do canto superior-esquerdo (0,0) até o canto inferior-direito da imagem final
• Os 4 cantos da imagem são branco #FFFFFF
• As 4 bordas (topo, base, esquerda, direita) são branco #FFFFFF
• Não existe passe-partout, não existe borda cinza ou colorida, não existe foto dentro de foto, não existe quadro
• Substitua todo pixel cinza, off-white, parede de estúdio e qualquer cenário original por #FFFFFF
• Mantenha a mesma proporção da imagem de entrada — não adicione barras, letterbox ou pillarbox

═══ CABIDE ═══
• A camisa está pendurada em um cabide simples (madeira clara natural ou plástico preto fosco — escolha o que combinar)
• Cabide visível na parte superior, gancho metálico fino apontado para cima
• Sem suporte visível atrás — apenas o cabide e o gancho
• Camisa com caimento natural, leve queda do tecido nos ombros

═══ CAMISA ═══
• Preserve 100% fiel: cores, tecido, escudo, listras, logo do fabricante, gola, números, patrocinador, costuras
• Texto, números e logos intactos — não redesenhe
• Tecido com caimento natural, sem vincos fortes, recém-passada

═══ NITIDEZ E QUALIDADE ═══
• Alta resolução com máxima nitidez fotográfica profissional
• Detalhes da camisa precisos: textura do tecido, costuras visíveis, escudo bordado nítido, números legíveis
• Sem desfoque, sem suavização excessiva, sem perda de detalhe

═══ COMPOSIÇÃO ═══
• Cabide + camisa centralizados, ocupando cerca de 85% da altura
• Sombra de contato muito sutil atrás da camisa, em cinza claro suave
• Iluminação difusa de estúdio, sem reflexos duros
• Mesmo ângulo frontal da foto original

═══ AFIRMAÇÕES FINAIS ═══
• A imagem final é continuamente branco #FFFFFF em todo o fundo, sem qualquer interrupção, divisão ou moldura
• Apenas o cabide e a camisa interrompem o branco`

// ─── Parser de nome de pasta ─────────────────────────────────
interface ParsedFolder {
  team: string
  variant: '' | 'II' | 'III' | 'IV'
  version: 'jogador' | 'torcedor'
  longSleeve: boolean
  color: string
  slug: string
}

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function slugify(text: string): string {
  return normalize(text).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

const NOISE_TOKENS = new Set([
  'camisa', 'destaque', 'home', 'curta', 'frente', 'costas',
])

function parseFolderName(name: string): ParsedFolder | null {
  const cleaned = name
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const raw = cleaned.split(' ').filter(Boolean)
  if (raw.length < 2) return null

  let version: 'jogador' | 'torcedor' | null = null
  let variant: ParsedFolder['variant'] = ''
  let longSleeve = false
  const teamTokens: string[] = []
  const colorTokens: string[] = []
  let metaStarted = false

  for (let i = 0; i < raw.length; i++) {
    const t = raw[i]
    const lower = normalize(t)
    if (NOISE_TOKENS.has(lower)) continue

    if (!version && /^(ii|iii|iv|2|3|4)$/.test(lower)) {
      variant = ({ '2': 'II', '3': 'III', '4': 'IV', ii: 'II', iii: 'III', iv: 'IV' } as Record<string, ParsedFolder['variant']>)[lower] ?? ''
      metaStarted = true
      continue
    }
    if (lower === 'jogador' || lower === 'torcedor') {
      version = lower as 'jogador' | 'torcedor'
      metaStarted = true
      continue
    }
    if (lower === 'manga' && normalize(raw[i + 1] ?? '') === 'longa') {
      longSleeve = true
      i++
      metaStarted = true
      continue
    }
    if (lower === 'manga') {
      metaStarted = true
      continue
    }

    if (metaStarted) {
      colorTokens.push(lower)
    } else {
      teamTokens.push(t)
    }
  }

  if (!version) return null
  const team = teamTokens.join(' ').trim()
  if (!team) return null

  const teamSlug = slugify(team)
  const variantSuffix = variant === 'II' ? '-ii' : variant === 'III' ? '-iii' : variant === 'IV' ? '-iv' : ''
  const versionSuffix = version === 'torcedor' ? '-torcedor' : ''
  const sleeveSuffix = longSleeve ? '-manga-longa' : ''
  const slug = `camisa-${teamSlug}${variantSuffix}-2026${versionSuffix}${sleeveSuffix}`

  return { team, variant, version, longSleeve, color: colorTokens.join(' '), slug }
}

// ─── Gemini API ──────────────────────────────────────────────
async function processWithGemini(
  filePath: string,
  version: 'jogador' | 'torcedor',
  feedback: string | null = null
): Promise<Buffer> {
  const fileData = await fs.readFile(filePath)
  const base64 = fileData.toString('base64')
  const basePrompt = version === 'torcedor' ? PROMPT_TORCEDOR : PROMPT_JOGADOR
  const prompt = feedback
    ? `${basePrompt}\n\n═══ FEEDBACK DA TENTATIVA ANTERIOR ═══\nA imagem gerada anteriormente teve estes problemas: ${feedback}. Corrija essas falhas nesta nova tentativa.`
    : basePrompt

  const contents = [
    {
      role: 'user',
      parts: [
        { text: prompt },
        { inlineData: { mimeType: 'image/jpeg', data: base64 } },
      ],
    },
  ]

  // Resolve modelo na primeira chamada
  if (!resolvedModel) {
    for (const m of MODEL_CANDIDATES) {
      try {
        const r = await ai.models.generateContent({ model: m, contents })
        resolvedModel = m
        return extractImage(r)
      } catch (err: any) {
        const msg = err?.message ?? String(err)
        if (msg.includes('NOT_FOUND') || msg.includes('not found')) continue
        throw err
      }
    }
    throw new Error('Nenhum modelo image-gen disponível pra essa API key')
  }

  const r = await ai.models.generateContent({ model: resolvedModel, contents })
  return extractImage(r)
}

function extractImage(response: any): Buffer {
  const candidates = response.candidates ?? []
  for (const cand of candidates) {
    const parts = cand.content?.parts ?? []
    for (const part of parts) {
      if (part.inlineData?.data) {
        return Buffer.from(part.inlineData.data, 'base64')
      }
    }
  }
  throw new Error('Gemini não retornou imagem')
}

// ─── Validação local (heurística, sem custo de API) ──────────
async function validateImageLocal(buffer: Buffer): Promise<{ ok: boolean; issues: string[] }> {
  const issues: string[] = []
  const meta = await sharp(buffer).metadata()
  if (!meta.width || !meta.height || meta.width < 600 || meta.height < 600) {
    issues.push('resolução baixa demais')
  }

  const { data, info } = await sharp(buffer)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const w = info.width
  const h = info.height
  const c = info.channels

  // 1. Cantos devem ser brancos (>240 nos 3 canais)
  const corners: [number, number][] = [
    [15, 15],
    [w - 15, 15],
    [15, h - 15],
    [w - 15, h - 15],
  ]
  let nonWhiteCorners = 0
  for (const [x, y] of corners) {
    const idx = (y * w + x) * c
    const r = data[idx]
    const g = data[idx + 1]
    const b = data[idx + 2]
    if (r < 240 || g < 240 || b < 240) nonWhiteCorners++
  }
  if (nonWhiteCorners > 0) {
    issues.push(`fundo não-branco em ${nonWhiteCorners} canto(s) — substitua TODOS os pixels não-camisa por branco puro #FFFFFF`)
  }

  // 2. Sample da área central — precisa ter pixels escuros (manequim) E conteúdo não-fundo
  // (a regra antiga rejeitava camisas brancas porque branco tem saturação zero)
  const cx = Math.floor(w / 2)
  const cy = Math.floor(h / 2)
  const radius = Math.floor(Math.min(w, h) / 3)
  let darkCount = 0
  let contentCount = 0
  let total = 0
  for (let y = cy - radius; y < cy + radius; y += 6) {
    for (let x = cx - radius; x < cx + radius; x += 6) {
      if (x < 0 || x >= w || y < 0 || y >= h) continue
      const idx = (y * w + x) * c
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]
      total++
      const lum = (r + g + b) / 3
      // Conteúdo = qualquer pixel que NÃO seja branco/fundo
      const isBg = r >= 240 && g >= 240 && b >= 240
      if (!isBg) contentCount++
      // Escuro = provavelmente manequim preto OU detalhes escuros da camisa
      if (lum < 100) darkCount++
    }
  }
  if (total > 0) {
    const darkRatio = darkCount / total
    const contentRatio = contentCount / total
    if (darkRatio < 0.01) {
      issues.push('quase nenhum pixel escuro no centro — manequim preto pode estar ausente')
    }
    if (contentRatio < 0.15) {
      issues.push('pouco conteúdo no centro — camisa pode estar muito pequena ou faltando')
    }
  }

  return { ok: issues.length === 0, issues }
}

// ─── Sharp pipeline ──────────────────────────────────────────
async function composeOnWhiteCanvas(geminiBuffer: Buffer, outputPath: string): Promise<void> {
  // 1. Detecta bbox do conteúdo (corta tarja branca residual)
  const flat = await sharp(geminiBuffer)
    .removeAlpha()
    .flatten({ background: BG })
    .toBuffer()
  const { data: pixels, info } = await sharp(flat).raw().toBuffer({ resolveWithObject: true })
  const { width: pw, height: ph, channels: pc } = info

  // "Fundo" = pixel próximo do branco puro (todos canais ≥ 240)
  const WHITE_T = 240
  let minX = pw, minY = ph, maxX = 0, maxY = 0
  for (let y = 0; y < ph; y++) {
    for (let x = 0; x < pw; x++) {
      const idx = (y * pw + x) * pc
      const r = pixels[idx]
      const g = pixels[idx + 1]
      const b = pixels[idx + 2]
      const isBg = r >= WHITE_T && g >= WHITE_T && b >= WHITE_T
      if (!isBg) {
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }
  }
  if (minX > maxX || minY > maxY) {
    minX = 0; minY = 0; maxX = pw - 1; maxY = ph - 1
  }
  const MARGIN = 6
  minX = Math.max(0, minX - MARGIN)
  minY = Math.max(0, minY - MARGIN)
  maxX = Math.min(pw - 1, maxX + MARGIN)
  maxY = Math.min(ph - 1, maxY + MARGIN)
  const bboxW = Math.max(1, maxX - minX + 1)
  const bboxH = Math.max(1, maxY - minY + 1)

  // 2. Extrai bbox + redimensiona pra 92% do canvas
  const extracted = await sharp(geminiBuffer)
    .extract({ left: minX, top: minY, width: bboxW, height: bboxH })
    .toBuffer()

  const maxInner = Math.min(OUTPUT_W, OUTPUT_H) * 0.92
  const scale = maxInner / Math.max(bboxW, bboxH)
  const innerW = Math.round(bboxW * scale)
  const innerH = Math.round(bboxH * scale)

  // Sharpen leve pra recuperar nitidez perdida no upscale
  const resized = await sharp(extracted)
    .resize(innerW, innerH, { fit: 'inside', kernel: sharp.kernel.lanczos3 })
    .sharpen({ sigma: 0.8, m1: 0.6, m2: 2.2 })
    .toBuffer()

  // 3. Composite center sobre canvas branco puro
  await sharp({
    create: { width: OUTPUT_W, height: OUTPUT_H, channels: 3, background: BG },
  })
    .composite([{ input: resized, gravity: 'center' }])
    .webp({ quality: 95, effort: 6 })
    .toFile(outputPath)
}

// ─── Processamento de cada pasta ─────────────────────────────
async function processFolder(folderName: string): Promise<{ slug: string; images: string[] } | null> {
  const parsed = parseFolderName(folderName)
  if (!parsed) {
    console.warn(`  ⚠️  Pasta ignorada — nome não reconhecido: "${folderName}"`)
    return null
  }

  const folderPath = path.join(INPUT_DIR, folderName)
  // Flag --only=001,021 filtra só esses prefixos numéricos
  const onlyArg = process.argv.find((a) => a.startsWith('--only='))
  const onlyPrefixes = onlyArg
    ? onlyArg
        .replace('--only=', '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : null

  const files = (await fs.readdir(folderPath))
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .filter((f) => {
      if (!onlyPrefixes) return true
      const m = f.match(/^(\d+)/)
      const num = m ? m[1] : ''
      return onlyPrefixes.some((p) => num === p || num === p.padStart(3, '0'))
    })
    .sort()

  if (files.length === 0) {
    console.warn(`  ⚠️  Pasta vazia: ${folderName}`)
    return null
  }

  console.log(`\n📦 ${folderName}`)
  console.log(`   slug:    ${parsed.slug}`)
  console.log(`   versão:  ${parsed.version}`)
  console.log(`   files:   ${files.length} imagens`)

  const outputUrls: string[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const inputPath = path.join(folderPath, file)

    const numMatch = file.match(/^(\d+)/)
    const num = numMatch ? parseInt(numMatch[1], 10) : i
    let suffix: string
    if (num === 1) suffix = ''
    else if (num === 21) suffix = '-back'
    else suffix = `-${num}`

    const outputName = `${parsed.slug}${suffix}.webp`
    const outputPath = path.join(OUTPUT_DIR, outputName)

    process.stdout.write(`   ${String(i + 1).padStart(2, '0')}/${files.length}  ${file} → ${outputName} ... `)

    let geminiBuffer: Buffer | null = null
    let lastIssues: string[] = []
    let attempt = 0
    try {
      for (attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const feedback = attempt === 0 ? null : lastIssues.join(' · ')
        const buf = await processWithGemini(inputPath, parsed.version, feedback)
        const v = await validateImageLocal(buf)
        if (v.ok) {
          geminiBuffer = buf
          lastIssues = []
          break
        }
        // Última tentativa também vale — salva mesmo com issues em _revisar
        geminiBuffer = buf
        lastIssues = v.issues
        if (attempt < MAX_RETRIES) {
          console.log(`✗ (tentativa ${attempt + 1}: ${v.issues.join(' · ')})`)
          process.stdout.write(
            `              retry ${attempt + 2}/${MAX_RETRIES + 1} ... `
          )
        }
      }
    } catch (err) {
      console.log('✗')
      console.error(`        erro Gemini: ${err instanceof Error ? err.message : err}`)
      continue
    }

    if (!geminiBuffer) {
      console.log('✗ (sem buffer)')
      continue
    }

    // Decide destino: se passou na validação vai pra OUTPUT_DIR, senão pra _revisar/
    const needsReview = lastIssues.length > 0
    if (needsReview) {
      await fs.mkdir(REVIEW_DIR, { recursive: true })
      const reviewPath = path.join(REVIEW_DIR, outputName)
      await composeOnWhiteCanvas(geminiBuffer, reviewPath)
      console.log(`⚠️ → _revisar/ (${lastIssues.join(' · ')})`)
    } else {
      await composeOnWhiteCanvas(geminiBuffer, outputPath)
      outputUrls.push(`/images/products/copa2026/${outputName}`)
      console.log(attempt > 0 ? `✓ (após ${attempt + 1} tentativas)` : '✓')
    }
  }

  return { slug: parsed.slug, images: outputUrls }
}

// ─── Atualiza Prisma com paths das imagens ───────────────────
async function updateProductImages(slug: string, images: string[]): Promise<void> {
  // Quando reprocessando subset (--only), NÃO sobrescreve o array completo no banco
  const onlyMode = process.argv.some((a) => a.startsWith('--only='))
  if (images.length === 0 || onlyMode) return
  const sorted = images.sort((a, b) => {
    const isFront = (u: string) => /-2026(-torcedor)?(-manga-longa)?\.webp$/.test(u)
    const isBack = (u: string) => u.includes('-back.')
    if (isFront(a)) return -1
    if (isFront(b)) return 1
    if (isBack(a)) return -1
    if (isBack(b)) return 1
    return 0
  })
  const updated = await prisma.product.updateMany({
    where: { slug },
    data: { images: JSON.stringify(sorted) },
  })
  if (updated.count === 0) {
    console.log(`   ⚠️  Nenhum produto com slug "${slug}" no banco`)
  } else {
    console.log(`   ✓ Banco atualizado (${updated.count} produto)`)
  }
}

// ─── Main ────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Processando imagens via Gemini 2.5 Flash Image (Nano Banana)...\n')
  console.log(`   Input:  ${INPUT_DIR}`)
  console.log(`   Output: ${OUTPUT_DIR}`)
  console.log(`   Fundo:  branco puro #FFFFFF\n`)

  await fs.mkdir(OUTPUT_DIR, { recursive: true })

  let folders: string[]
  try {
    const entries = await fs.readdir(INPUT_DIR, { withFileTypes: true })
    folders = entries.filter((d) => d.isDirectory()).map((d) => d.name)
  } catch {
    console.error(`❌ Pasta não encontrada: ${INPUT_DIR}`)
    process.exit(1)
  }

  if (folders.length === 0) {
    console.log('   Nenhuma subpasta em imagens-raw/.')
    return
  }

  console.log(`   ${folders.length} pasta(s) encontrada(s)\n`)
  console.log('─'.repeat(60))

  let ok = 0, fail = 0
  for (const folder of folders) {
    try {
      const result = await processFolder(folder)
      if (!result) { fail++; continue }
      await updateProductImages(result.slug, result.images)
      ok++
    } catch (err) {
      fail++
      console.error(`❌ Erro processando "${folder}":`, err)
    }
  }

  console.log('\n' + '─'.repeat(60))
  console.log(`✅ Concluído: ${ok} pasta(s) ok · ${fail} falha(s)`)
  await prisma.$disconnect()
}

main().catch(async (err) => {
  console.error('❌ Erro fatal:', err)
  await prisma.$disconnect()
  process.exit(1)
})
