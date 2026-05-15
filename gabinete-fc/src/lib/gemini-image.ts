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
 * Prompt COLORIDA — FUSION v3 (2026-05-15, otimizado pra nano-banana).
 * Frontal centralizada (sem rotação forçada), fundo charcoal-grey void,
 * 8K hiper-realista, foco em mesh dry-fit, sem banners (badges são CSS do site).
 */
export function buildCoverPromptColor(data: CoverPromptInput): string {
  return `Professional product photography, ultra-detailed shot of a premium ${data.team} national football team jersey (kit ${data.variant}) in ${data.primaryColor}.

POSE (critical): floating in a 3D ghost mannequin form with an ATHLETIC POWERFUL silhouette — engineered with enhanced dorsal seam and contour lines, BROAD muscular shoulders, defined chest volume, robust torso width, defined rear shoulder structure, natural fabric folds emphasizing the athletic build, sleeves with proper athletic width filled with shoulder mass, hem hanging naturally. NOT a slim/thin/narrow silhouette, NOT a flat 2D layout — proper sculpted athletic powerful volume as if worn by a strong invisible athlete with broad shoulders. The torso is ROTATED to the LEFT at about 15-20 degrees three-quarter angle from the viewer's perspective — meaning the RIGHT side of the chest (viewer's right) is slightly more forward toward the camera, while the LEFT shoulder (viewer's left) recedes back into the frame, creating dynamic depth. The dynamic angled stance leans the jersey toward the viewer's right side.

BACKGROUND (critical): deep matte charcoal-black studio cyclorama — NOT pure flat #000000, NOT light charcoal grey. A rich dark matte charcoal-black with subtle depth and slight tonal variation, like an infinite seamless studio cyclorama where the floor and back wall merge into one continuous void. The background absorbs light, no reflections. Below the jersey there is a SOFT CONTACT SHADOW spreading naturally on the floor, slightly darker than the background, diffused and gradient, giving the jersey weight and grounding it as if floating just above the cyclorama floor.

JERSEY POSITION: the jersey occupies approximately 55-60% of the vertical frame with comfortable breathing space above the collar and below the hem, set in the middle of the frame.

LIGHTING (critical): powerful directional top-down cinematic studio lighting from above and slightly to the front, focused to dramatically accent the STRONG contours of the broad shoulders and athletic torso. Hard high-contrast light creating defined highlights and deep shadows that sculpt the fabric folds. Combined with subtle RIM LIGHTING from the sides/back — a thin sharp accent of light that draws the silhouette edge along the shoulder line, sleeves and torso outline, separating the jersey from the dark background. Moody atmospheric high-contrast lighting that reveals the dry-fit mesh fabric texture. Neutral color temperature, NO bright bloom, NO lens flare.

Extreme focus on the complex performance-mesh dry-fit fabric texture. The body is smooth and clean — NO all-over patterns, NO decorative graphics, NO jacquard motifs. Just the natural fine weave of the dry-fit material.

The ${data.crest} is richly embroidered on the LEFT chest from the viewer's perspective, with precise stitch texture, five stars where applicable, and the federation name clearly visible. The ${data.brand} brand logo is applied as a precision heat-press material on the RIGHT chest from the viewer's perspective.

Collar (critical): a clean simple V-NECK neckline with ribbed ${data.secondaryColor} trim wrapping around the V opening. NOT a polo collar, NOT a folded shirt collar, NOT a button-up placket, NOT buttons — just a flat V-shaped neckline with ribbed knit trim. Matching ribbed sleeve cuffs.

${data.details}.

Empty floating product shot — no mannequin visible, no hanger, no person, no body, no display stand. Hyper-realistic, 8k resolution, photorealistic, ultra-sharp focus, clean minimalist aesthetic, high-fashion sports catalog style.`
}

/**
 * Prompt APAGADA — "Stealth Blackout" FUSION v3 (2026-05-15, otimizado pra nano-banana).
 * Mesma estética da colorida, mas em deep grayscale/silver colorway monocromático.
 */
export function buildCoverPromptBlackout(data: Pick<CoverPromptInput, 'team' | 'crest' | 'brand'>): string {
  return `Professional product photography, ultra-detailed shot of a premium ${data.team} national football team jersey in a deep grayscale colorway, inspired by a dark "hype drop" aesthetic. The entire jersey is rendered in sophisticated tones of matte gray.

POSE (critical): floating in a 3D ghost mannequin form with an ATHLETIC POWERFUL silhouette identical to the colored reference image — engineered with enhanced dorsal seam and contour lines, BROAD muscular shoulders, defined chest volume, robust torso width, defined rear shoulder structure, natural fabric folds emphasizing athletic build, sleeves with proper athletic width filled with shoulder mass, hem hanging naturally. NOT slim, NOT narrow, NOT thin — proper sculpted athletic powerful volume as if worn by a strong invisible athlete. Torso ROTATED to the LEFT at about 15-20 degrees three-quarter angle from the viewer's perspective — RIGHT side of chest (viewer's right) slightly more forward toward camera, LEFT shoulder (viewer's left) recedes back. The jersey leans toward the viewer's right side, identical to the colored reference image.

BACKGROUND (critical): deep matte charcoal-black studio cyclorama — NOT pure flat #000000, NOT light charcoal grey. A rich dark matte charcoal-black with subtle depth, like an infinite seamless studio cyclorama where the floor and back wall merge into one continuous void. Below the jersey there is a SOFT CONTACT SHADOW spreading naturally on the floor, slightly darker than the background, diffused and gradient, grounding the jersey as if floating just above the cyclorama floor.

JERSEY POSITION: the jersey occupies approximately 55-60% of the vertical frame with comfortable breathing space above and below.

COLOR PALETTE (critical): PURELY MONOCHROMATIC grayscale — using only shades of light gray, medium gray, and charcoal black. The gray tone must be NEUTRAL or slightly WARM — ABSOLUTELY NO BLUE TINT, NO BLUE UNDERTONES, NO COOL CYAN HUES, NO SILVERY METALLIC SHEEN, NO ICE-BLUE colors. The jersey should look like a true black-and-white photograph or a sophisticated chiaroscuro rendering — neutral grays only, like a B&W studio shot.

LIGHTING (critical): strong high-contrast directional top-down lighting from above, designed to dramatically highlight the strong contours of the broad athletic shoulders and torso. Chiaroscuro effect — deep blacks and defined grays sculpting the fabric and form. Combined with PROMINENT RIM LIGHTING from the sides/back — sharp accent line drawing the silhouette edge along shoulders, sleeves and torso, ESSENTIAL to separate the gray jersey from the dark charcoal-black background (otherwise the dark jersey would disappear). The rim light is NEUTRAL WHITE, not cool blue. Moody high-contrast atmospheric lighting revealing the dry-fit mesh fabric texture. NEUTRAL color temperature only, NO blue tones, NO cool cyan, NO lens flare.

Ultra-sharp focus on the intricate, fine dry-fit fabric mesh texture. The body is smooth and clean — NO all-over patterns, NO graphics, NO jacquard motifs.

All branding is monochromatic: the ${data.crest} is rendered in matching dark gray embroidery with precise stitching on the LEFT chest from the viewer's perspective, and the ${data.brand} brand logo on the RIGHT chest as a tonal heat-press material in dark matte gray.

Collar (critical): a clean simple V-NECK neckline with darker matte gray ribbed trim wrapping around the V opening. NOT a polo collar, NOT a folded shirt collar, NOT a button-up placket, NOT buttons — just a flat V-shaped neckline with ribbed knit trim. Matching ribbed sleeve cuffs in darker matte gray. Precision seams.

Empty floating product shot — no mannequin visible, no hanger, no person, no body, no display stand. Hyper-realistic, 8k resolution, photorealistic, ultra-sharp focus, clean minimalist aesthetic, high-fashion sports catalog style, premium "blackout" colorway.`
}
