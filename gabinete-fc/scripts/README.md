# Pipeline de Imagens — Photoroom

Processa fotos brutas das camisas: troca fundo, otimiza, salva como WebP, atualiza Prisma.

## Setup (uma vez)

1. **Adicione o token Photoroom no `.env.local`** (na raiz `gabinete-fc/`):

```bash
PHOTOROOM_API_KEY=seu_token_aqui
```

2. **Crie a pasta de input** na raiz do repositório (não em `gabinete-fc/`):

```
GABINETE-FC/
├── gabinete-fc/         (app Next.js)
└── imagens-raw/         (cria essa pasta)
```

A pasta `imagens-raw/` está no `.gitignore` — nada vai pro Git.

## Estrutura de pastas esperada

Dentro de `imagens-raw/`, crie uma subpasta por produto. O nome da pasta vira o slug:

```
imagens-raw/
├── Brasil Jogador/                  →  camisa-brasil-2026
│   ├── 001.jpg                      →  frente (foto principal)
│   ├── 021.jpg                      →  costas
│   └── 003.jpg, 006.jpg, ...        →  galeria adicional
│
├── Brasil Torcedor/                 →  camisa-brasil-2026-torcedor
├── Brasil II Jogador/               →  camisa-brasil-ii-2026 (camisa azul reserva)
├── Brasil II Torcedor/              →  camisa-brasil-ii-2026-torcedor
├── Brasil Jogador Manga Longa/      →  camisa-brasil-2026-manga-longa
├── Argentina Jogador/               →  camisa-argentina-2026
├── Argentina Torcedor/              →  camisa-argentina-2026-torcedor
└── ...
```

### Regras do nome da pasta

- **Time** primeiro (Brasil, Argentina, França, etc) — múltiplas palavras OK ("Costa do Marfim")
- **Variante** (opcional): `II`, `III`, `IV` → camisa reserva, terceiro uniforme
- **Versão** (obrigatório): `Jogador` ou `Torcedor`
- **Manga Longa** (opcional): adiciona ao final
- Caracteres especiais e acentos OK (são normalizados)

### Regras dos arquivos dentro

| Arquivo | Função | Sufixo no output |
|---|---|---|
| `001.jpg` | Frente (manequim de frente) — **foto principal** | — (sem sufixo) |
| `021.jpg` | Costas (manequim de costas) | `-back` |
| Outros | Galeria adicional | `-{numero}` |

## Como rodar

```bash
cd gabinete-fc
npm run images:process
```

O script vai:
1. Listar todas as pastas em `/imagens-raw/`
2. Pra cada imagem, mandar pro Photoroom (`https://image-api.photoroom.com/v2/edit`):
   - Remove fundo
   - Aplica cinza `#F5F5F5` (combina com o site)
   - Padding 8%
   - Output 1200×1500
3. Otimiza local com Sharp → WebP qualidade 88
4. Salva em `/public/images/products/copa2026/{slug}{sufixo}.webp`
5. Atualiza `Product.images` no Supabase com o array de paths
6. No site, as imagens aparecem automaticamente (próximo build / refresh)

## Custo Photoroom

Consulte seu plano em [photoroom.com/pricing](https://www.photoroom.com/api/pricing). Cada chamada de API consome 1 crédito.

Estimativa pra 49 seleções × 2 versões × ~5 imagens cada = **~490 chamadas**.

## Reprocessar

Pra reprocessar uma pasta específica:
1. Apague o subdiretório que você quer redo (ou só ajuste imagens dentro)
2. Rode `npm run images:process` de novo — só processa o que estiver na pasta de input

Pra forçar download das imagens novas no site após processar: `npm run db:seed` opcional pra sincronizar o resto.

## Troubleshooting

| Erro | Causa | Fix |
|---|---|---|
| `PHOTOROOM_API_KEY não encontrado` | `.env.local` faltando ou token errado | Adicione `PHOTOROOM_API_KEY=...` |
| `Photoroom 401` | Token inválido | Verifique no painel Photoroom |
| `Photoroom 402` | Sem créditos | Recarregue no Photoroom |
| `Pasta ignorada — nome não reconhecido` | Faltou "Jogador" ou "Torcedor" no nome | Renomeie a pasta |
| `Nenhum produto com slug "X" no banco` | Slug gerado não bate com seed | Confirme nome da pasta vs slugs do `prisma/seed.ts` |
