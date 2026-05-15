import { GoogleGenAI } from '@google/genai'

const API_KEY = process.env.GEMINI_API_KEY
const MODEL = process.env.GEMINI_IMAGE_MODEL ?? 'gemini-2.5-flash-image'

export interface GenerateJerseyCoverInput {
  prompt: string
  referenceImageBase64?: string
  referenceImageMime?: string
  /** Imagens de referência adicionais (em ordem). Ex: [brasão, pose-anchor] */
  extraReferences?: Array<{ base64: string; mime: string }>
}

export interface GenerateJerseyCoverResult {
  imageBase64: string
  mimeType: string
}

export async function generateJerseyCover(input: GenerateJerseyCoverInput): Promise<GenerateJerseyCoverResult> {
  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY não configurada no .env.local')
  }
  const ai = new GoogleGenAI({ apiKey: API_KEY })

  const parts: Array<Record<string, unknown>> = [{ text: input.prompt }]
  if (input.referenceImageBase64) {
    parts.push({
      inlineData: {
        data: input.referenceImageBase64,
        mimeType: input.referenceImageMime ?? 'image/png',
      },
    })
  }
  if (input.extraReferences) {
    for (const ref of input.extraReferences) {
      parts.push({
        inlineData: { data: ref.base64, mimeType: ref.mime },
      })
    }
  }

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: 'user', parts: parts as never }],
  })

  const candidate = response.candidates?.[0]
  const partImage = candidate?.content?.parts?.find((p) => p.inlineData?.data)
  if (!partImage?.inlineData?.data) {
    throw new Error('Resposta do Gemini sem imagem')
  }

  return {
    imageBase64: partImage.inlineData.data,
    mimeType: partImage.inlineData.mimeType ?? 'image/png',
  }
}

export interface CoverPromptInput {
  team: string
  variant: string
  primaryColor: string
  secondaryColor: string
  brand: string
  crest: string
  details: string
}

/**
 * Prompt COLORIDA — FUSION aprovado (2026-05-15).
 * Hiper-realista 8K, torso inclinado 15° à direita, camisa lisa (sem all-over pattern),
 * fundo preto puro com spotlight cool no topo.
 */
export function buildCoverPromptColor(data: CoverPromptInput): string {
  return `Ultra-detailed, hyper-realistic professional product photography of a premium ${data.team} national football team home jersey (kit ${data.variant}) for the 2026 World Cup.

The jersey body is ${data.primaryColor} with a SUBTLE smooth performance-mesh fabric micro-texture — clean and minimal, NO bold all-over patterns, NO decorative graphics across the body, NO elephant-print or jacquard motifs on the fabric. Just the natural fine weave texture of the dry-fit material. The V-neck collar features structured ${data.secondaryColor} rib-knit trim. The sleeve cuffs have matching ${data.secondaryColor} rib-knit trim. ${data.details}.

The ${data.crest} is rendered with detailed high-quality embroidery texture on the LEFT chest from the viewer's perspective. The ${data.brand} brand logo is applied as a precise heat-press material on the RIGHT chest from the viewer's perspective.

POSE (critical): floating 3D ghost mannequin style, the torso rotated slightly to the RIGHT (about 15 degrees three-quarter angle view) — the left side of the chest appears slightly more forward while the right shoulder recedes slightly back, creating a dynamic angled stance — NOT a flat frontal view. Sculpted natural form with subtle fabric folds along the torso and shoulders.

BACKGROUND (critical): PURE DEEP BLACK background with a soft cool white spotlight from above the frame creating a subtle top-down gradient — slightly lighter at the top edge and fading to pure deep black everywhere else. NO warm tones, NO halo behind the jersey body, NO charcoal grey background.

LIGHTING: cinematic, directional top-down studio lighting with rim-lighting along the shoulder contours, casting deep shadows and dramatic highlights that accentuate the fabric, seams, and emblems. Ultra-sharp focus on the central chest and crest.

FRAMING: the jersey occupies approximately 50% of the vertical frame, leaving abundant empty background space above the collar, below the hem, and on both sides. The ENTIRE jersey including the full bottom hem must be visible inside the frame. The background fills the ENTIRE composition continuously — same deep black with soft top spotlight extending edge-to-edge across the whole image, with no letterbox bars, no abrupt color transitions, no rectangular dark borders inserted into the scene. Editorial e-commerce catalog style with generous negative space all around.

Empty floating product shot — no mannequin, no hanger, no person, no body, no display stand. Front view only.
8k resolution, photorealistic, premium catalog quality, streetwear hype editorial aesthetic.`
}

/**
 * Prompt APAGADA — "Stealth Blackout" FUSION aprovado (2026-05-15).
 * Mesma pose da colorida (passada como referência via imagem), camisa charcoal grey lisa.
 */
export function buildCoverPromptBlackout(data: Pick<CoverPromptInput, 'team' | 'crest' | 'brand'>): string {
  return `Ultra-detailed, hyper-realistic professional product photography of a premium monochromatic football jersey, the "stealth blackout" edition of the ${data.team} national team home jersey, in a deep charcoal grey colorway.

The jersey body is uniform smooth charcoal grey with a SUBTLE clean mesh fabric micro-texture — NO bold all-over patterns, NO decorative graphics across the body, NO elephant-print or jacquard motifs on the fabric. Just minimal natural micro-texture of the dry-fit weave. The V-neck collar and sleeve cuffs are contrasting matte black with subtle ribbed knit texture.

The ${data.crest} is rendered as sophisticated monochrome dark grey embroidery with sharp clear stitches on the LEFT chest from the viewer's perspective. The ${data.brand} brand logo in matte black is a precision-cut heat-press application on the RIGHT chest from the viewer's perspective.

POSE (critical): floating 3D ghost mannequin style, the torso rotated slightly to the RIGHT (about 15 degrees three-quarter angle view) — the left side of the chest appears slightly more forward while the right shoulder recedes slightly back, creating a dynamic angled stance. Sculpted natural form with subtle fabric folds.

BACKGROUND (critical): PURE DEEP BLACK background with a soft cool white spotlight from above the frame creating a subtle top-down gradient — slightly lighter at the top edge and fading to pure deep black everywhere else. NO warm tones, NO orange glow, NO halo behind the jersey body, NO charcoal grey background.

LIGHTING: intense directional rim-lighting along the shoulder contours and dramatic top-down illumination, highlighting the contours and texture of the grey-toned fabric, seams, and branding with high contrast. Ultra-sharp focus on the fabric texture and crest details.

FRAMING: the jersey occupies approximately 50% of the vertical frame, leaving abundant empty background space above the collar, below the hem, and on both sides. The ENTIRE jersey including the full bottom hem must be visible inside the frame. The background fills the ENTIRE composition continuously — same deep black with soft top spotlight extending edge-to-edge across the whole image, with no letterbox bars, no abrupt color transitions, no rectangular dark borders inserted into the scene. Editorial e-commerce catalog style with generous negative space all around.

Empty floating product shot — no mannequin, no hanger, no person, no body, no display stand. Front view only.
8k resolution, photorealistic, high-fashion editorial streetwear style, premium "blackout" colorway.`
}
