/**
 * Gera capa AI de uma seleção (colorida + apagada) e atualiza o banco.
 * Pipeline: 2 chamadas Gemini (colorida via crest, apagada usando colorida como ref de pose).
 *
 * Uso:
 *   npx dotenv-cli -e .env.local -- npx ts-node --transpile-only --project scripts/tsconfig.json scripts/generate-cover.ts <slug>
 *
 * Para gerar TODOS os 6 destaques:
 *   ... scripts/generate-cover.ts all-featured
 *
 * Para gerar TODAS as restantes (não-destaques que ainda não têm capa em /covers):
 *   ... scripts/generate-cover.ts all-remaining
 *
 * Para gerar absolutamente todas (destaques + restantes):
 *   ... scripts/generate-cover.ts all
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { PrismaClient } from '@prisma/client'
import { generateJerseyCover, buildCoverPromptColor, buildCoverPromptBlackout } from '../src/lib/gemini-image'

const prisma = new PrismaClient()

const REPO_ROOT = path.resolve(__dirname, '..', '..')
const INFO_DIR = path.join(REPO_ROOT, 'Informação Camisas')
const COVERS_DIR = path.join(__dirname, '..', 'public', 'images', 'products', 'copa2026', 'covers')

export interface Preset {
  slug: string
  team: string
  variant: string
  primaryColor: string
  secondaryColor: string
  brand: string
  crest: string
  details: string
  crestFile?: string
}

export const PRESETS: Record<string, Preset> = {
  'camisa-brasil-2026': {
    slug: 'camisa-brasil-2026',
    team: 'Brazil',
    variant: 'I home',
    primaryColor: 'classic vibrant canary yellow #FEDD00',
    secondaryColor: 'bright green #009C3B with thin navy blue #002776 inner piping',
    brand: 'green Nike swoosh',
    crest: 'CBF crest with five small green stars above and "BRASIL" text in green',
    details: 'Classic Brazilian canarinho home jersey for the 2026 World Cup',
    crestFile: 'Brasil-1024x614.jpg',
  },
  'camisa-brasil-ii-2026': {
    slug: 'camisa-brasil-ii-2026',
    team: 'Brazil',
    variant: 'II away/reserve',
    primaryColor: 'deep royal navy blue #002776',
    secondaryColor: 'bright yellow #FEDD00 with thin green #009C3B inner piping',
    brand: 'yellow Nike swoosh',
    crest: 'CBF crest in golden/yellow tones with five stars and "BRASIL" text',
    details: 'Royal blue away jersey, modern minimal design for the 2026 World Cup',
    crestFile: 'Brasil-1024x614.jpg',
  },
  'camisa-argentina-2026': {
    slug: 'camisa-argentina-2026',
    team: 'Argentina',
    variant: 'I home',
    primaryColor: 'iconic sky blue and white vertical "albiceleste" stripes (light sky blue #75AADB alternating with white #FFFFFF)',
    secondaryColor: 'white with black Adidas details',
    brand: 'three classic black Adidas stripes on the shoulders and a small Adidas trefoil logo',
    crest: 'AFA crest of the Argentine Football Association with sky-blue/white stripes and golden Sun of May',
    details: 'Albiceleste home jersey with vertical light blue and white stripes, white sleeves',
    crestFile: 'Argentina-1024x614.jpg',
  },
  'camisa-franca-2026': {
    slug: 'camisa-franca-2026',
    team: 'France',
    variant: 'I home',
    primaryColor: 'deep French navy marine blue #001F5B',
    secondaryColor: 'white #FFFFFF with thin red #EF1923 tricolor accents',
    brand: 'white Nike swoosh',
    crest: 'FFF crest with a stylized golden Gallic rooster (coq) on a small shield',
    details: 'Classic deep navy blue Les Bleus home jersey for the 2026 World Cup',
    crestFile: 'França-1024x614.jpg',
  },
  'camisa-espanha-2026': {
    slug: 'camisa-espanha-2026',
    team: 'Spain',
    variant: 'I home',
    primaryColor: 'bold vibrant La Roja red #AA151B',
    secondaryColor: 'golden yellow #F1BF00 with subtle black accents',
    brand: 'three black Adidas stripes on the shoulders',
    crest: 'RFEF crest of the Royal Spanish Football Federation with crown and red/yellow flag stripes',
    details: 'La Roja red home jersey for the 2026 World Cup',
    crestFile: 'Espanha-1024x614.jpg',
  },
  'camisa-alemanha-2026': {
    slug: 'camisa-alemanha-2026',
    team: 'Germany',
    variant: 'I home',
    primaryColor: 'pure clean white #FFFFFF',
    secondaryColor: 'a bold diagonal tricolor sash across the chest in black #000000, red #DD0000 and golden yellow #FFCE00 (German flag colors)',
    brand: 'three classic black Adidas stripes on the shoulders',
    crest: 'DFB crest with a stylized black eagle on a green shield with black/red/gold flag edge',
    details: 'Modern white Die Mannschaft home jersey with a tricolor diagonal sash across the chest, referencing the 2024 kit design',
    crestFile: 'Alemanha-1024x614.jpg',
  },

  // ─── PAÍSES-SEDE (CONCACAF) ───
  'camisa-estados-unidos-2026': {
    slug: 'camisa-estados-unidos-2026',
    team: 'United States',
    variant: 'I home',
    primaryColor: 'pure clean white #FFFFFF',
    secondaryColor: 'navy blue #0A2351 with thin red #BF0A30 accents (USA flag colors)',
    brand: 'navy blue Nike swoosh',
    crest: 'US Soccer crest with a stylized shield in navy and red with white stars',
    details: 'Classic white USMNT home jersey for the 2026 World Cup as host nation',
    crestFile: 'EUA.png',
  },
  'camisa-mexico-2026': {
    slug: 'camisa-mexico-2026',
    team: 'Mexico',
    variant: 'I home',
    primaryColor: 'vibrant deep emerald green #006341',
    secondaryColor: 'white #FFFFFF with thin red #CE1126 accents (Mexican flag tricolor)',
    brand: 'three classic white Adidas stripes on the shoulders',
    crest: 'FMF crest of the Mexican Football Federation with eagle and serpent in red, white and green',
    details: 'Classic deep green El Tri home jersey for the 2026 World Cup as host nation',
    crestFile: 'México-1024x614.jpg',
  },
  'camisa-canada-2026': {
    slug: 'camisa-canada-2026',
    team: 'Canada',
    variant: 'I home',
    primaryColor: 'vibrant bold red #D52B1E',
    secondaryColor: 'white #FFFFFF with subtle black accents',
    brand: 'white Nike swoosh',
    crest: 'Canada Soccer crest with a stylized white maple leaf on a red shield',
    details: 'Classic red Canada home jersey for the 2026 World Cup as host nation',
    crestFile: 'Canadá.png',
  },

  // ─── CONMEBOL (restantes) ───
  'camisa-uruguai-2026': {
    slug: 'camisa-uruguai-2026',
    team: 'Uruguay',
    variant: 'I home',
    primaryColor: 'sky-light celeste blue #5CACEE',
    secondaryColor: 'white #FFFFFF with subtle black piping',
    brand: 'Puma logo (jumping cat) in white with white PUMA wordmark',
    crest: 'AUF crest of the Uruguayan Football Association with four stars (representing FIFA-recognised titles) above',
    details: 'Classic celeste La Celeste home jersey for the 2026 World Cup',
    crestFile: 'Uruguai-1024x614.jpg',
  },
  'camisa-colombia-2026': {
    slug: 'camisa-colombia-2026',
    team: 'Colombia',
    variant: 'I home',
    primaryColor: 'vibrant golden yellow #FCD116',
    secondaryColor: 'royal blue #003893 with thin red #CE1126 accents (Colombian flag colors)',
    brand: 'three classic blue Adidas stripes on the shoulders',
    crest: 'FCF crest of the Colombian Football Federation in yellow, blue and red',
    details: 'Classic golden yellow Los Cafeteros home jersey for the 2026 World Cup',
    crestFile: 'Colômbia-1024x614.jpg',
  },
  'camisa-equador-2026': {
    slug: 'camisa-equador-2026',
    team: 'Ecuador',
    variant: 'I home',
    primaryColor: 'vibrant golden yellow #FFD100',
    secondaryColor: 'royal blue #034EA2 with thin red #ED1C24 accents (Ecuadorian flag colors)',
    brand: 'Marathon Sports logo as a tonal heat-press detail on the right chest',
    crest: 'FEF crest of the Ecuadorian Football Federation with stylized condor, blue and red bars and yellow background',
    details: 'Classic yellow La Tri home jersey for the 2026 World Cup',
  },
  'camisa-paraguai-2026': {
    slug: 'camisa-paraguai-2026',
    team: 'Paraguay',
    variant: 'I home',
    primaryColor: 'vertical red #D52B1E and white #FFFFFF stripes',
    secondaryColor: 'royal blue #0038A8 with subtle accents',
    brand: 'three classic blue Adidas stripes on the shoulders',
    crest: 'APF crest of the Paraguayan Football Association with star and palm/olive branches',
    details: 'Classic red-and-white striped Albirroja home jersey for the 2026 World Cup',
    crestFile: 'Paraguai.png',
  },

  // ─── CONCACAF (restantes) ───
  'camisa-panama-2026': {
    slug: 'camisa-panama-2026',
    team: 'Panama',
    variant: 'I home',
    primaryColor: 'vibrant deep red #CE1126',
    secondaryColor: 'royal blue #005AA7 with thin white #FFFFFF accents',
    brand: 'white Nike swoosh',
    crest: 'FEPAFUT crest of the Panamanian Football Federation in red, blue and white with stars',
    details: 'Classic red La Marea Roja home jersey for the 2026 World Cup',
    crestFile: 'Panamá-1024x614.jpg',
  },
  'camisa-haiti-2026': {
    slug: 'camisa-haiti-2026',
    team: 'Haiti',
    variant: 'I home',
    primaryColor: 'vibrant royal blue #00209F',
    secondaryColor: 'bright red #D21034 with thin white #FFFFFF accents',
    brand: 'tonal heat-press federation sponsor logo on the right chest',
    crest: 'FHF crest of the Haitian Football Federation in blue and red',
    details: 'Classic royal blue Les Grenadiers home jersey for the 2026 World Cup',
    crestFile: 'Haiti.png',
  },
  'camisa-curacao-2026': {
    slug: 'camisa-curacao-2026',
    team: 'Curaçao',
    variant: 'I home',
    primaryColor: 'royal navy blue #002B7F',
    secondaryColor: 'bright yellow #FFD500 with thin white accents (Curaçao flag colors)',
    brand: 'tonal heat-press federation sponsor logo on the right chest',
    crest: 'FFK crest of the Curaçao Football Federation in blue and yellow with white stars',
    details: 'Classic deep blue Curaçao home jersey for the 2026 World Cup',
    crestFile: 'Curaçao.png',
  },

  // ─── CAF (África) ───
  'camisa-marrocos-2026': {
    slug: 'camisa-marrocos-2026',
    team: 'Morocco',
    variant: 'I home',
    primaryColor: 'vibrant deep red #C1272D',
    secondaryColor: 'dark green #006233 with white #FFFFFF accents',
    brand: 'Puma logo (jumping cat) in white with white PUMA wordmark',
    crest: 'FRMF crest of the Royal Moroccan Football Federation with the green Moroccan star on red',
    details: 'Classic red Atlas Lions home jersey for the 2026 World Cup',
    crestFile: 'Marrocos-1024x614.jpg',
  },
  'camisa-senegal-2026': {
    slug: 'camisa-senegal-2026',
    team: 'Senegal',
    variant: 'I home',
    primaryColor: 'pure clean white #FFFFFF',
    secondaryColor: 'dark green #00853F with golden yellow #FDEF42 and red #E31B23 accents (Senegalese flag colors)',
    brand: 'green Puma logo (jumping cat) with PUMA wordmark',
    crest: 'FSF crest of the Senegalese Football Federation with lion (Teranga) in green and yellow',
    details: 'Classic white Lions of Teranga home jersey for the 2026 World Cup',
    crestFile: 'Senegal-1024x614.jpg',
  },
  'camisa-egito-2026': {
    slug: 'camisa-egito-2026',
    team: 'Egypt',
    variant: 'I home',
    primaryColor: 'vibrant deep red #CE1126',
    secondaryColor: 'white #FFFFFF and black #000000 with golden yellow #FFD700 accents',
    brand: 'white Puma logo (jumping cat) with PUMA wordmark',
    crest: 'EFA crest of the Egyptian Football Association with the golden Eagle of Saladin',
    details: 'Classic red Pharaohs home jersey for the 2026 World Cup',
    crestFile: 'Egito-1024x614.jpg',
  },
  'camisa-argelia-2026': {
    slug: 'camisa-argelia-2026',
    team: 'Algeria',
    variant: 'I home',
    primaryColor: 'pure clean white #FFFFFF',
    secondaryColor: 'vibrant deep green #006233 with thin red #D21034 accents (Algerian flag colors)',
    brand: 'three classic green Adidas stripes on the shoulders',
    crest: 'FAF crest of the Algerian Football Federation with green star and crescent on white',
    details: 'Classic white Les Fennecs home jersey for the 2026 World Cup',
    crestFile: 'Argelia.png',
  },
  'camisa-tunisia-2026': {
    slug: 'camisa-tunisia-2026',
    team: 'Tunisia',
    variant: 'I home',
    primaryColor: 'vibrant deep red #E70013',
    secondaryColor: 'white #FFFFFF with subtle dark accents',
    brand: 'Kappa logo (two seated figures back-to-back) in white with KAPPA wordmark',
    crest: 'FTF crest of the Tunisian Football Federation with the Eagle of Carthage in red and white',
    details: 'Classic red Eagles of Carthage home jersey for the 2026 World Cup',
    crestFile: 'Tunísia-1024x614.jpg',
  },
  'camisa-costa-do-marfim-2026': {
    slug: 'camisa-costa-do-marfim-2026',
    team: 'Ivory Coast',
    variant: 'I home',
    primaryColor: 'vibrant bright orange #F77F00',
    secondaryColor: 'white #FFFFFF with dark green #009E60 accents (Ivorian flag colors)',
    brand: 'white Puma logo (jumping cat) with PUMA wordmark',
    crest: 'FIF crest of the Ivorian Football Federation with the elephant in orange, white and green',
    details: 'Classic orange Les Éléphants home jersey for the 2026 World Cup',
    crestFile: 'Costa do Marfim.webp',
  },
  'camisa-gana-2026': {
    slug: 'camisa-gana-2026',
    team: 'Ghana',
    variant: 'I home',
    primaryColor: 'pure clean white #FFFFFF',
    secondaryColor: 'red #CE1126, golden yellow #FCD116 and dark green #006B3F accents (Ghanaian flag tricolor)',
    brand: 'red Puma logo (jumping cat) with PUMA wordmark',
    crest: 'GFA crest of the Ghana Football Association with the Black Star',
    details: 'Classic white Black Stars home jersey for the 2026 World Cup',
    crestFile: 'Gana.webp',
  },
  'camisa-cabo-verde-2026': {
    slug: 'camisa-cabo-verde-2026',
    team: 'Cape Verde',
    variant: 'I home',
    primaryColor: 'royal deep blue #003893',
    secondaryColor: 'white #FFFFFF with thin red #CF2027 accents',
    brand: 'tonal heat-press federation sponsor logo on the right chest',
    crest: 'FCF crest of the Cape Verdean Football Federation with stars and blue/white colors',
    details: 'Classic blue Tubarões Azuis home jersey for the 2026 World Cup',
    crestFile: 'Cabo Verde.png',
  },
  'camisa-africa-do-sul-2026': {
    slug: 'camisa-africa-do-sul-2026',
    team: 'South Africa',
    variant: 'I home',
    primaryColor: 'vibrant golden yellow #FFB81C',
    secondaryColor: 'dark green #007749 and black #000000 accents (South African flag colors)',
    brand: 'Le Coq Sportif logo (stylized rooster) in green with brand wordmark',
    crest: 'SAFA crest of the South African Football Association with the Bafana Bafana yellow-green-black scheme',
    details: 'Classic yellow Bafana Bafana home jersey for the 2026 World Cup',
    crestFile: 'África do Sul.webp',
  },

  // ─── AFC (Ásia) ───
  'camisa-japao-2026': {
    slug: 'camisa-japao-2026',
    team: 'Japan',
    variant: 'I home',
    primaryColor: 'deep royal samurai blue #0B1E5A',
    secondaryColor: 'white #FFFFFF with subtle red accents',
    brand: 'three classic white Adidas stripes on the shoulders',
    crest: 'JFA crest of the Japan Football Association with the three-legged Yatagarasu crow',
    details: 'Classic samurai-blue Samurai Blue home jersey for the 2026 World Cup',
    crestFile: 'Japão-1024x614.jpg',
  },
  'camisa-coreia-do-sul-2026': {
    slug: 'camisa-coreia-do-sul-2026',
    team: 'South Korea',
    variant: 'I home',
    primaryColor: 'vibrant deep red #CD2E3A',
    secondaryColor: 'navy blue #0047A0 with white #FFFFFF accents (Korean flag-inspired)',
    brand: 'white Nike swoosh',
    crest: 'KFA crest of the Korea Football Association with stylized tiger and red/blue colors',
    details: 'Classic red Taegeuk Warriors home jersey for the 2026 World Cup',
    crestFile: 'Coreia-do-Sul-1024x614.jpg',
  },
  'camisa-ira-2026': {
    slug: 'camisa-ira-2026',
    team: 'Iran',
    variant: 'I home',
    primaryColor: 'pure clean white #FFFFFF',
    secondaryColor: 'vibrant deep red #DA0000 and dark green #239F40 accents (Iranian flag colors)',
    brand: 'tonal heat-press federation sponsor logo on the right chest',
    crest: 'FFIRI crest of the Football Federation Islamic Republic of Iran with cheetah and red/green/white',
    details: 'Classic white Team Melli home jersey for the 2026 World Cup',
    crestFile: 'Irã-1024x614.jpg',
  },
  'camisa-arabia-saudita-2026': {
    slug: 'camisa-arabia-saudita-2026',
    team: 'Saudi Arabia',
    variant: 'I home',
    primaryColor: 'pure clean white #FFFFFF',
    secondaryColor: 'dark green #006C35 with thin gold accents (Saudi flag colors)',
    brand: 'green Nike swoosh',
    crest: 'SAFF crest of the Saudi Arabian Football Federation in green and gold with Arabic calligraphy and palm/swords',
    details: 'Classic white Green Falcons home jersey for the 2026 World Cup',
    crestFile: 'Arábia-Saudita-1024x614.jpg',
  },
  'camisa-australia-2026': {
    slug: 'camisa-australia-2026',
    team: 'Australia',
    variant: 'I home',
    primaryColor: 'vibrant golden yellow #FFCD00',
    secondaryColor: 'dark green #00843D with subtle accents',
    brand: 'green Nike swoosh',
    crest: 'Football Australia crest with golden kangaroo silhouette',
    details: 'Classic yellow Socceroos home jersey for the 2026 World Cup',
    crestFile: 'Austrália-1024x614.jpg',
  },
  'camisa-jordania-2026': {
    slug: 'camisa-jordania-2026',
    team: 'Jordan',
    variant: 'I home',
    primaryColor: 'pure clean white #FFFFFF',
    secondaryColor: 'deep red #CE1126 with black #000000 and green #007A3D accents (Jordanian flag colors)',
    brand: 'three classic black Adidas stripes on the shoulders',
    crest: 'JFA crest of the Jordan Football Association with seven-pointed star and red/black/green',
    details: 'Classic white Chivalrous Ones (Al-Nashama) home jersey for the 2026 World Cup',
    crestFile: 'Jordânia.png',
  },
  'camisa-uzbequistao-2026': {
    slug: 'camisa-uzbequistao-2026',
    team: 'Uzbekistan',
    variant: 'I home',
    primaryColor: 'pure clean white #FFFFFF',
    secondaryColor: 'sky blue #1EB0EA with thin green #009A44 and red #CE1126 accents (Uzbek flag colors)',
    brand: 'Joma logo (J-shape) in blue with JOMA wordmark',
    crest: 'UFA crest of the Uzbekistan Football Association with white wolf head on blue',
    details: 'Classic white White Wolves home jersey for the 2026 World Cup',
    crestFile: 'Uzbequistão.jpg',
  },
  'camisa-catar-2026': {
    slug: 'camisa-catar-2026',
    team: 'Qatar',
    variant: 'I home',
    primaryColor: 'deep maroon burgundy #8A1538',
    secondaryColor: 'white #FFFFFF with subtle silver accents',
    brand: 'white Nike swoosh',
    crest: 'QFA crest of the Qatar Football Association in maroon and white with stylized Arabic calligraphy',
    details: 'Classic maroon Al Annabi (The Maroons) home jersey for the 2026 World Cup',
    crestFile: 'Catar.png',
  },

  // ─── OFC ───
  'camisa-nova-zelandia-2026': {
    slug: 'camisa-nova-zelandia-2026',
    team: 'New Zealand',
    variant: 'I home',
    primaryColor: 'pure clean white #FFFFFF',
    secondaryColor: 'black #000000 with subtle silver accents',
    brand: 'black Nike swoosh',
    crest: 'NZF crest of New Zealand Football with stylized silver fern on black',
    details: 'Classic white All Whites home jersey for the 2026 World Cup',
    crestFile: 'Nova Zelândia.png',
  },

  // ─── UEFA (restantes) ───
  'camisa-inglaterra-2026': {
    slug: 'camisa-inglaterra-2026',
    team: 'England',
    variant: 'I home',
    primaryColor: 'pure clean white #FFFFFF',
    secondaryColor: 'navy blue #00247D with thin red #CE1124 St. George cross accents',
    brand: 'navy blue Nike swoosh',
    crest: 'The FA Three Lions crest with three lions passant on shield in navy and red',
    details: 'Classic white Three Lions home jersey for the 2026 World Cup',
    crestFile: 'Inglaterra-1024x614.jpg',
  },
  'camisa-portugal-2026': {
    slug: 'camisa-portugal-2026',
    team: 'Portugal',
    variant: 'I home',
    primaryColor: 'vibrant deep crimson red #B22234',
    secondaryColor: 'dark green #006847 with golden yellow #FFD700 accents (Portuguese flag colors)',
    brand: 'red Puma logo (jumping cat) with PUMA wordmark',
    crest: 'FPF crest of the Portuguese Football Federation with shield, castles and quinas',
    details: 'Classic red Seleção das Quinas home jersey for the 2026 World Cup',
    crestFile: 'Portugal-1024x614.jpg',
  },
  'camisa-holanda-2026': {
    slug: 'camisa-holanda-2026',
    team: 'Netherlands',
    variant: 'I home',
    primaryColor: 'vibrant bright orange #F36C21',
    secondaryColor: 'black #000000 with subtle white accents',
    brand: 'black Nike swoosh',
    crest: 'KNVB crest of the Royal Dutch Football Association with the orange lion rampant',
    details: 'Classic orange Oranje home jersey for the 2026 World Cup',
    crestFile: 'holanda.png',
  },
  'camisa-belgica-2026': {
    slug: 'camisa-belgica-2026',
    team: 'Belgium',
    variant: 'I home',
    primaryColor: 'deep burgundy wine red #6F0F19',
    secondaryColor: 'black #000000 and golden yellow #FFD700 accents (Belgian flag colors)',
    brand: 'three classic black Adidas stripes on the shoulders',
    crest: 'KBVB/URBSFA crest of the Belgian Football Association with shield and Belgian tricolor accents',
    details: 'Classic wine-red Red Devils home jersey for the 2026 World Cup',
    crestFile: 'Bélgica-1024x614.jpg',
  },
  'camisa-croacia-2026': {
    slug: 'camisa-croacia-2026',
    team: 'Croatia',
    variant: 'I home',
    primaryColor: 'iconic red and white checkered pattern (šahovnica) — bold red #FF0000 and white #FFFFFF squares across the entire body',
    secondaryColor: 'navy blue #002F6C with subtle accents',
    brand: 'white Nike swoosh',
    crest: 'HNS crest of the Croatian Football Federation with red-and-white checkered shield',
    details: 'Classic red-and-white checkered Vatreni home jersey for the 2026 World Cup',
    crestFile: 'Croácia-1024x614.jpg',
  },
  'camisa-noruega-2026': {
    slug: 'camisa-noruega-2026',
    team: 'Norway',
    variant: 'I home',
    primaryColor: 'vibrant deep red #BA0C2F',
    secondaryColor: 'navy blue #00205B with thin white #FFFFFF accents',
    brand: 'white Nike swoosh',
    crest: 'NFF crest of the Norwegian Football Federation with the Norwegian heraldic lion in gold on red',
    details: 'Classic red Vikings home jersey for the 2026 World Cup',
    crestFile: 'Noruega.jpg',
  },
  'camisa-suica-2026': {
    slug: 'camisa-suica-2026',
    team: 'Switzerland',
    variant: 'I home',
    primaryColor: 'vibrant deep red #DA291C',
    secondaryColor: 'white #FFFFFF with subtle accents',
    brand: 'white Puma logo (jumping cat) with PUMA wordmark',
    crest: 'SFV/ASF crest of the Swiss Football Association with white cross on red shield',
    details: 'Classic red Nati home jersey for the 2026 World Cup',
    crestFile: 'Suiça-1024x614.jpg',
  },
  'camisa-austria-2026': {
    slug: 'camisa-austria-2026',
    team: 'Austria',
    variant: 'I home',
    primaryColor: 'vibrant deep red #ED2939',
    secondaryColor: 'white #FFFFFF with subtle accents',
    brand: 'white Puma logo (jumping cat) with PUMA wordmark',
    crest: 'ÖFB crest of the Austrian Football Association with eagle and red/white shield',
    details: 'Classic red Das Team home jersey for the 2026 World Cup',
    crestFile: 'Áustria.png',
  },
  'camisa-escocia-2026': {
    slug: 'camisa-escocia-2026',
    team: 'Scotland',
    variant: 'I home',
    primaryColor: 'royal deep navy blue #0F2D52',
    secondaryColor: 'white #FFFFFF with subtle accents',
    brand: 'three classic white Adidas stripes on the shoulders',
    crest: 'SFA crest of the Scottish Football Association with the Scottish thistle in white',
    details: 'Classic navy blue Tartan Army home jersey for the 2026 World Cup',
    crestFile: 'Escócia.png',
  },
  'camisa-turquia-2026': {
    slug: 'camisa-turquia-2026',
    team: 'Turkey',
    variant: 'I home',
    primaryColor: 'vibrant deep red #E30A17',
    secondaryColor: 'white #FFFFFF with subtle accents',
    brand: 'white Nike swoosh',
    crest: 'TFF crest of the Turkish Football Federation with the white crescent and star on red',
    details: 'Classic red Ay-Yıldızlılar (Crescent-Stars) home jersey for the 2026 World Cup',
  },
  'camisa-suecia-2026': {
    slug: 'camisa-suecia-2026',
    team: 'Sweden',
    variant: 'I home',
    primaryColor: 'vibrant golden yellow #FECC00',
    secondaryColor: 'royal blue #006AA7 with subtle accents (Swedish flag colors)',
    brand: 'three classic blue Adidas stripes on the shoulders',
    crest: 'SvFF crest of the Swedish Football Association with three crowns on blue shield',
    details: 'Classic yellow Blågult home jersey for the 2026 World Cup',
    crestFile: 'Suécia-1024x614.jpg',
  },
  'camisa-republica-tcheca-2026': {
    slug: 'camisa-republica-tcheca-2026',
    team: 'Czech Republic',
    variant: 'I home',
    primaryColor: 'vibrant deep red #D7141A',
    secondaryColor: 'royal blue #11457E and white #FFFFFF accents (Czech flag colors)',
    brand: 'white Puma logo (jumping cat) with PUMA wordmark',
    crest: 'FAČR crest of the Czech Football Association with the Bohemian double-tailed lion',
    details: 'Classic red Lvi (Lions) home jersey for the 2026 World Cup',
    crestFile: 'Rep. Tcheca.png',
  },
  'camisa-bosnia-2026': {
    slug: 'camisa-bosnia-2026',
    team: 'Bosnia and Herzegovina',
    variant: 'I home',
    primaryColor: 'royal deep blue #002F6C',
    secondaryColor: 'golden yellow #FECB00 with thin white accents (Bosnian flag colors)',
    brand: 'three classic yellow Adidas stripes on the shoulders',
    crest: 'NSBiH crest of the Bosnian Football Association with the blue/yellow shield and white stars',
    details: 'Classic blue Zmajevi (Dragons) home jersey for the 2026 World Cup',
    crestFile: 'Bósnia.jpg',
  },

  // ─── REPESCAGEM INTERCONTINENTAL ───
  'camisa-rd-congo-2026': {
    slug: 'camisa-rd-congo-2026',
    team: 'DR Congo',
    variant: 'I home',
    primaryColor: 'sky-light blue #007FFF',
    secondaryColor: 'red #CE1021 and golden yellow #FCD116 accents (Congolese flag colors)',
    brand: 'tonal heat-press federation sponsor logo on the right chest',
    crest: 'FECOFA crest of the Congolese Football Federation with the leopard',
    details: 'Classic light-blue Leopards home jersey for the 2026 World Cup',
    crestFile: 'RD Congo.png',
  },
  'camisa-iraque-2026': {
    slug: 'camisa-iraque-2026',
    team: 'Iraq',
    variant: 'I home',
    primaryColor: 'vibrant deep green #00732F',
    secondaryColor: 'white #FFFFFF with thin red #CE1126 and black accents (Iraqi flag colors)',
    brand: 'white Puma logo (jumping cat) with PUMA wordmark',
    crest: 'IFA crest of the Iraqi Football Association with stylized eagle/palm in green',
    details: 'Classic green Lions of Mesopotamia home jersey for the 2026 World Cup',
    crestFile: 'Iraque.png',
  },

  // ─── VARIANTES DE COR (novos produtos) ───
  'camisa-espanha-branca-2026': {
    slug: 'camisa-espanha-branca-2026',
    team: 'Spain',
    variant: 'II away',
    primaryColor: 'pure clean white #FFFFFF',
    secondaryColor: 'bold La Roja red #AA151B with golden yellow #F1BF00 accents',
    brand: 'three classic red Adidas stripes on the shoulders',
    crest: 'RFEF crest of the Royal Spanish Football Federation with crown and red/yellow flag stripes',
    details: 'White La Roja away jersey for the 2026 World Cup',
    crestFile: 'Espanha-1024x614.jpg',
  },
  'camisa-espanha-azul-2026': {
    slug: 'camisa-espanha-azul-2026',
    team: 'Spain',
    variant: 'III alternate',
    primaryColor: 'deep royal navy blue #0F2D52',
    secondaryColor: 'bold red #AA151B with subtle golden yellow #F1BF00 accents',
    brand: 'three classic white Adidas stripes on the shoulders',
    crest: 'RFEF crest of the Royal Spanish Football Federation with crown and red/yellow flag stripes',
    details: 'Royal blue La Roja alternate jersey for the 2026 World Cup',
    crestFile: 'Espanha-1024x614.jpg',
  },
  'camisa-portugal-especial-2026': {
    slug: 'camisa-portugal-especial-2026',
    team: 'Portugal',
    variant: 'Special edition',
    primaryColor: 'pure clean white #FFFFFF with subtle ivory tones',
    secondaryColor: 'rich golden #C5A45C with deep crimson #B22234 and emerald green #006847 embroidered accents',
    brand: 'metallic gold Puma logo (jumping cat) with golden PUMA wordmark',
    crest: 'FPF crest of the Portuguese Football Federation with shield, castles and quinas, rendered in metallic gold embroidery',
    details: 'Limited Special Edition white Portugal jersey with gold embroidery and intricate heritage details for the 2026 World Cup',
    crestFile: 'Portugal-1024x614.jpg',
  },
}

const FEATURED_SLUGS = [
  'camisa-brasil-2026',
  'camisa-brasil-ii-2026',
  'camisa-argentina-2026',
  'camisa-franca-2026',
  'camisa-espanha-2026',
  'camisa-alemanha-2026',
]

async function loadCrestBase64(filename: string): Promise<{ data: string; mime: string } | null> {
  const fullPath = path.join(INFO_DIR, filename)
  try {
    const buf = await fs.readFile(fullPath)
    const lower = filename.toLowerCase()
    const mime =
      lower.endsWith('.png') ? 'image/png' :
      lower.endsWith('.svg') ? 'image/svg+xml' :
      lower.endsWith('.webp') ? 'image/webp' : 'image/jpeg'
    return { data: buf.toString('base64'), mime }
  } catch {
    console.warn(`  ⚠ Brasão não encontrado: ${fullPath}`)
    return null
  }
}

// Carrega Alemanha colorida (se já existir) como pose-anchor para outras seleções.
// Converte para PNG porque Gemini às vezes rejeita WebP como input.
async function loadPoseAnchor(currentSlug: string): Promise<{ data: string; mime: string } | null> {
  if (currentSlug === 'camisa-alemanha-2026') return null
  const anchorPath = path.join(COVERS_DIR, 'camisa-alemanha-2026-cover-color.webp')
  try {
    const webpBuf = await fs.readFile(anchorPath)
    // Converte pra JPEG menor (512x640) — múltiplas imagens grandes podem estourar limite do Gemini
    const jpegBuf = await sharp(webpBuf)
      .resize(512, 640, { fit: 'inside' })
      .jpeg({ quality: 85 })
      .toBuffer()
    console.log(`    pose-anchor: ${(jpegBuf.length / 1024).toFixed(0)}KB`)
    return { data: jpegBuf.toString('base64'), mime: 'image/jpeg' }
  } catch {
    return null
  }
}

async function generateAndSave(preset: Preset) {
  console.log(`\n━━━ ${preset.team} ${preset.variant} (${preset.slug}) ━━━`)

  const crest = preset.crestFile ? await loadCrestBase64(preset.crestFile) : null
  if (crest) console.log(`  ✓ Brasão carregado (${preset.crestFile})`)

  console.log('  → [1/2] Gerando colorida via Gemini...')
  const colorPrompt = buildCoverPromptColor(preset)
  const colorResult = await generateJerseyCover({
    prompt: colorPrompt,
    referenceImageBase64: crest?.data,
    referenceImageMime: crest?.mime,
  })
  const colorBuffer = Buffer.from(colorResult.imageBase64, 'base64')
  console.log(`  ✓ Colorida gerada`)

  console.log('  → [2/2] Gerando apagada via Gemini (usando colorida como ref de pose)...')
  const blackoutPrompt = buildCoverPromptBlackout({
    team: preset.team,
    crest: preset.crest,
    brand: preset.brand,
  })
  const apagadaResult = await generateJerseyCover({
    prompt: blackoutPrompt,
    referenceImageBase64: colorBuffer.toString('base64'),
    referenceImageMime: 'image/png',
  })
  console.log(`  ✓ Apagada gerada`)

  await fs.mkdir(COVERS_DIR, { recursive: true })
  const colorFile = `${preset.slug}-cover-color.webp`
  const grayFile = `${preset.slug}-cover-gray.webp`

  await sharp(colorBuffer)
    .resize(1024, 1280, { fit: 'cover', position: 'centre' })
    .webp({ quality: 95 })
    .toFile(path.join(COVERS_DIR, colorFile))
  await sharp(Buffer.from(apagadaResult.imageBase64, 'base64'))
    .resize(1024, 1280, { fit: 'cover', position: 'centre' })
    .webp({ quality: 95 })
    .toFile(path.join(COVERS_DIR, grayFile))
  console.log(`  ✓ Salvas em public/images/products/copa2026/covers/`)

  const publicGray = `/images/products/copa2026/covers/${grayFile}`
  const publicColor = `/images/products/copa2026/covers/${colorFile}`

  const candidates = [preset.slug, `${preset.slug}-torcedor`]
  const products = await prisma.product.findMany({ where: { slug: { in: candidates } } })
  console.log(`  ✓ Encontrados ${products.length} produtos: ${products.map((p) => p.slug).join(', ')}`)

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
    })
  )
  console.log(`  ✓ Banco atualizado`)
}

async function listMissingCovers(): Promise<string[]> {
  // Retorna slugs cujos arquivos -cover-color.webp E -cover-gray.webp ainda NÃO existem em COVERS_DIR.
  const missing: string[] = []
  for (const slug of Object.keys(PRESETS)) {
    const colorPath = path.join(COVERS_DIR, `${slug}-cover-color.webp`)
    const grayPath = path.join(COVERS_DIR, `${slug}-cover-gray.webp`)
    const [colorExists, grayExists] = await Promise.all([
      fs.access(colorPath).then(() => true).catch(() => false),
      fs.access(grayPath).then(() => true).catch(() => false),
    ])
    if (!colorExists || !grayExists) missing.push(slug)
  }
  return missing
}

async function main() {
  const arg = process.argv[2]
  if (!arg) {
    console.error('Uso: ts-node scripts/generate-cover.ts <slug | all-featured | all-remaining | all>')
    console.error(`Slugs disponíveis (${Object.keys(PRESETS).length}): ${Object.keys(PRESETS).join(', ')}`)
    process.exit(1)
  }

  let slugs: string[]
  if (arg === 'all-featured') {
    slugs = FEATURED_SLUGS
  } else if (arg === 'all-remaining') {
    slugs = await listMissingCovers()
    console.log(`🎯 Modo all-remaining: ${slugs.length} capas faltando.`)
    console.log(`   Slugs: ${slugs.join(', ')}`)
  } else if (arg === 'all') {
    slugs = Object.keys(PRESETS)
    console.log(`🎯 Modo all: gerando ${slugs.length} capas (vai sobrescrever existentes).`)
  } else {
    slugs = [arg]
  }

  let ok = 0
  const failed: Array<{ slug: string; error: string }> = []

  for (const slug of slugs) {
    const preset = PRESETS[slug]
    if (!preset) {
      console.error(`Preset não encontrado: ${slug}`)
      failed.push({ slug, error: 'preset-not-found' })
      continue
    }
    try {
      await generateAndSave(preset)
      ok++
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error(`  ❌ Falha em ${slug}: ${msg}`)
      failed.push({ slug, error: msg })
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`✅ Pronto: ${ok}/${slugs.length} capas geradas`)
  if (failed.length > 0) {
    console.log(`❌ ${failed.length} falhas:`)
    for (const f of failed) console.log(`   - ${f.slug}: ${f.error}`)
  }
}

if (require.main === module) {
  main()
    .catch((e) => { console.error(e); process.exit(1) })
    .finally(() => prisma.$disconnect())
}
