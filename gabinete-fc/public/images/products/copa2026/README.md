# Imagens das Camisas — Copa 2026

Pasta destinada às fotos das 48 seleções da Copa do Mundo 2026.

## Padrão dos arquivos
- Nomenclatura: `camisa-{slug}-2026.{jpg|webp}` (ex: `camisa-brasil-2026.jpg`)
- Resolução mínima: 1080×1080 px
- Fundo: branco puro `#FFFFFF`
- Tamanho máximo: 300 KB
- Pose: ghost mannequin ou flat lay aéreo
- Padding: ~10% em todos os lados

## Como aplicar uma imagem

1. Adicione o arquivo nesta pasta com o slug correto
2. Atualize o campo `images` do produto correspondente no Prisma (Supabase)
   ou rode `npm run db:seed` se for primeira carga
3. O helper `getProductImage()` em `src/lib/product-image.ts` já cuida do fallback

## Status atual

Enquanto não há imagens reais, o `placeholder-jersey.svg` é exibido
automaticamente pelo helper.
