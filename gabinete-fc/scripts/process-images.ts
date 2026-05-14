/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Pipeline de processamento de imagens das camisas — Photoroom + Sharp
 *
 * Como usar:
 *   1) Configure PHOTOROOM_API_KEY no .env.local
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
 *   - Envia cada imagem pro Photoroom API (remove fundo, padroniza cinza #F5F5F5)
 *   - Otimiza com Sharp (WebP, 1200×1500, qualidade 88)
 *   - Salva em /public/images/products/copa2026/{slug}.webp
 *   - Atualiza Product.images no Supabase com paths das novas imagens
 *
 * NÃO commita nada — quem ativa as imagens no site é o seed/db.
 */

import { config } from 'dotenv'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import sharp from 'sharp'
import { PrismaClient } from '@prisma/client'

// Carrega .env.local (não usa default .env)
config({ path: path.resolve(__dirname, '..', '.env.local') })

// ─── Config ──────────────────────────────────────────────────
const TOKEN = process.env.PHOTOROOM_API_KEY
if (!TOKEN) {
  console.error('❌ PHOTOROOM_API_KEY não encontrado em .env.local')
  process.exit(1)
}

const REPO_ROOT = path.resolve(__dirname, '..', '..')
const INPUT_DIR = path.join(REPO_ROOT, 'imagens-raw')
const OUTPUT_DIR = path.resolve(__dirname, '..', 'public', 'images', 'products', 'copa2026')

const BACKGROUND_HEX = 'F5F5F5' // cinza claro do design
const OUTPUT_W = 1200
const OUTPUT_H = 1500

const prisma = new PrismaClient()

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
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function slugify(text: string): string {
  return normalize(text)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Palavras de "ruído" que aparecem no nome da pasta mas não afetam o slug
const NOISE_TOKENS = new Set([
  'camisa',
  'destaque',
  'home',
  'curta', // manga curta é o default
  'frente',
  'costas',
])

function parseFolderName(name: string): ParsedFolder | null {
  // Pré-processamento: remove parênteses e conteúdo, troca hífens por espaço
  const cleaned = name
    .replace(/\([^)]*\)/g, ' ') // remove "(...)"
    .replace(/[-_]+/g, ' ') // hífens e underscores viram espaço
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

    // Ignora tokens ruído em qualquer posição
    if (NOISE_TOKENS.has(lower)) continue

    // Variant (II, III, IV — antes da version)
    if (!version && /^(ii|iii|iv|2|3|4)$/.test(lower)) {
      variant =
        ({ '2': 'II', '3': 'III', '4': 'IV', ii: 'II', iii: 'III', iv: 'IV' } as Record<
          string,
          ParsedFolder['variant']
        >)[lower] ?? ''
      metaStarted = true
      continue
    }

    // Version
    if (lower === 'jogador' || lower === 'torcedor') {
      version = lower as 'jogador' | 'torcedor'
      metaStarted = true
      continue
    }

    // Manga longa (sequência "manga longa")
    if (lower === 'manga' && normalize(raw[i + 1] ?? '') === 'longa') {
      longSleeve = true
      i++
      metaStarted = true
      continue
    }
    // Manga (sozinha, sem "longa") = ruído (manga curta é default)
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
  const variantSuffix =
    variant === 'II' ? '-ii' : variant === 'III' ? '-iii' : variant === 'IV' ? '-iv' : ''
  const versionSuffix = version === 'torcedor' ? '-torcedor' : ''
  const sleeveSuffix = longSleeve ? '-manga-longa' : ''
  const slug = `camisa-${teamSlug}${variantSuffix}-2026${versionSuffix}${sleeveSuffix}`

  return {
    team,
    variant,
    version,
    longSleeve,
    color: colorTokens.join(' '),
    slug,
  }
}

// ─── Photoroom API ───────────────────────────────────────────
// Tenta primeiro Image Editing API v2 (plano Premium — gera o fundo direto).
// Se 403/401 (token sem acesso a v2), cai pra Remove Background v1 e o Sharp aplica o fundo.
let photoroomMode: 'v2' | 'v1' | null = null

async function tryV2(file: Buffer, name: string, mime: string): Promise<Buffer | null> {
  const form = new FormData()
  form.append('imageFile', new Blob([file], { type: mime }), name)
  form.append('background.color', BACKGROUND_HEX)
  form.append('padding', '0.08')
  form.append('outputSize', `${OUTPUT_W}x${OUTPUT_H}`)

  const res = await fetch('https://image-api.photoroom.com/v2/edit', {
    method: 'POST',
    headers: { 'x-api-key': TOKEN! },
    body: form as any,
  })
  if (res.status === 401 || res.status === 403) return null
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Photoroom v2 ${res.status}: ${text}`)
  }
  return Buffer.from(await res.arrayBuffer())
}

async function tryV1(file: Buffer, name: string, mime: string): Promise<Buffer> {
  // v1 retorna PNG com alpha (fundo transparente) — Sharp aplica o cinza depois
  const form = new FormData()
  form.append('image_file', new Blob([file], { type: mime }), name)
  form.append('format', 'png')

  const res = await fetch('https://sdk.photoroom.com/v1/segment', {
    method: 'POST',
    headers: { 'x-api-key': TOKEN! },
    body: form as any,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Photoroom v1 ${res.status}: ${text}`)
  }
  return Buffer.from(await res.arrayBuffer())
}

async function processWithPhotoroom(filePath: string): Promise<{ buffer: Buffer; hasBackground: boolean }> {
  const fileData = await fs.readFile(filePath)
  const ext = path.extname(filePath).toLowerCase()
  const mime =
    ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg'
  const name = path.basename(filePath)

  // Detecta modo na primeira chamada
  if (photoroomMode === null) {
    const v2result = await tryV2(fileData, name, mime)
    if (v2result) {
      photoroomMode = 'v2'
      return { buffer: v2result, hasBackground: true }
    }
    photoroomMode = 'v1'
    console.log('   ℹ️  Token sem acesso à Image Editing v2 — usando Remove Background v1 + composição local')
  }

  if (photoroomMode === 'v2') {
    const buf = await tryV2(fileData, name, mime)
    if (!buf) throw new Error('Photoroom v2 retornou 401/403 após sucesso inicial')
    return { buffer: buf, hasBackground: true }
  }

  // v1: PNG transparente — Sharp aplicará o fundo cinza
  const buf = await tryV1(fileData, name, mime)
  return { buffer: buf, hasBackground: false }
}

// ─── Processamento de cada pasta ─────────────────────────────
async function processFolder(folderName: string): Promise<{
  slug: string
  images: string[]
} | null> {
  const parsed = parseFolderName(folderName)
  if (!parsed) {
    console.warn(`  ⚠️  Pasta ignorada — nome não reconhecido: "${folderName}"`)
    return null
  }

  const folderPath = path.join(INPUT_DIR, folderName)
  const files = (await fs.readdir(folderPath))
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .sort()

  if (files.length === 0) {
    console.warn(`  ⚠️  Pasta vazia: ${folderName}`)
    return null
  }

  console.log(`\n📦 ${folderName}`)
  console.log(`   slug:    ${parsed.slug}`)
  console.log(`   times:   ${files.length} imagens`)

  const outputUrls: string[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const inputPath = path.join(folderPath, file)

    // Determina sufixo de saída pelo prefixo numérico do arquivo
    const numMatch = file.match(/^(\d+)/)
    const num = numMatch ? parseInt(numMatch[1], 10) : i

    let suffix: string
    if (num === 1) suffix = '' // frente (principal)
    else if (num === 21) suffix = '-back' // costas
    else suffix = `-${num}` // galeria adicional

    const outputName = `${parsed.slug}${suffix}.webp`
    const outputPath = path.join(OUTPUT_DIR, outputName)

    process.stdout.write(`   ${String(i + 1).padStart(2, '0')}/${files.length}  ${file} → ${outputName} ... `)

    try {
      const { buffer: photoroomBuffer, hasBackground } = await processWithPhotoroom(inputPath)

      let pipeline = sharp(photoroomBuffer)

      if (!hasBackground) {
        // PNG transparente vindo da v1 — compõe sobre canvas cinza com padding 8%
        const meta = await sharp(photoroomBuffer).metadata()
        const sourceW = meta.width ?? OUTPUT_W
        const sourceH = meta.height ?? OUTPUT_H

        // Padding 8% nas bordas — manequim ocupa 84% da menor dimensão
        const targetMaxDim = Math.round(Math.min(OUTPUT_W, OUTPUT_H) * 0.84)
        const scale = targetMaxDim / Math.max(sourceW, sourceH)
        const resizedW = Math.round(sourceW * scale)
        const resizedH = Math.round(sourceH * scale)

        const subject = await sharp(photoroomBuffer)
          .resize(resizedW, resizedH, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .toBuffer()

        pipeline = sharp({
          create: {
            width: OUTPUT_W,
            height: OUTPUT_H,
            channels: 3,
            background: { r: 0xf5, g: 0xf5, b: 0xf5 },
          },
        }).composite([{ input: subject, gravity: 'center' }])
      } else {
        pipeline = pipeline.resize(OUTPUT_W, OUTPUT_H, {
          fit: 'contain',
          background: { r: 0xf5, g: 0xf5, b: 0xf5 },
        })
      }

      await pipeline.webp({ quality: 88, effort: 4 }).toFile(outputPath)

      outputUrls.push(`/images/products/copa2026/${outputName}`)
      console.log('✓')
    } catch (err) {
      console.log('✗')
      console.error(`        ${err instanceof Error ? err.message : err}`)
    }
  }

  return { slug: parsed.slug, images: outputUrls }
}

// ─── Atualiza Prisma com paths das imagens ───────────────────
async function updateProductImages(slug: string, images: string[]): Promise<void> {
  if (images.length === 0) return
  // Garante que a foto principal (001) vem primeiro, costas em segundo
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
    console.log(`   ⚠️  Nenhum produto com slug "${slug}" no banco — imagens salvas mas não vinculadas`)
  } else {
    console.log(`   ✓ Banco atualizado (${updated.count} produto)`)
  }
}

// ─── Main ────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Processando imagens via Photoroom API...\n')
  console.log(`   Input:  ${INPUT_DIR}`)
  console.log(`   Output: ${OUTPUT_DIR}\n`)

  await fs.mkdir(OUTPUT_DIR, { recursive: true })

  let folders: string[]
  try {
    const entries = await fs.readdir(INPUT_DIR, { withFileTypes: true })
    folders = entries.filter((d) => d.isDirectory()).map((d) => d.name)
  } catch (err) {
    console.error(`❌ Pasta de input não encontrada: ${INPUT_DIR}`)
    console.error('   Crie a pasta /imagens-raw/ na raiz do repositório.')
    process.exit(1)
  }

  if (folders.length === 0) {
    console.log('   Nenhuma subpasta em imagens-raw/. Nada a fazer.')
    return
  }

  console.log(`   Encontradas ${folders.length} pastas\n`)
  console.log('─'.repeat(60))

  let successCount = 0
  let failCount = 0

  for (const folder of folders) {
    try {
      const result = await processFolder(folder)
      if (!result) {
        failCount++
        continue
      }
      await updateProductImages(result.slug, result.images)
      successCount++
    } catch (err) {
      failCount++
      console.error(`❌ Erro processando "${folder}":`, err)
    }
  }

  console.log('\n' + '─'.repeat(60))
  console.log(`✅ Concluído: ${successCount} pasta(s) ok · ${failCount} falha(s)`)
  await prisma.$disconnect()
}

main().catch(async (err) => {
  console.error('❌ Erro fatal:', err)
  await prisma.$disconnect()
  process.exit(1)
})
