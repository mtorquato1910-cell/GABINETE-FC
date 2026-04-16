# Story 002 — Schema do Banco de Dados com Prisma

**Epic:** EPIC-01 (Infraestrutura)
**Sprint:** Sprint 1
**Referência:** US-01.2 (adaptado para Prisma + SQLite/Railway)
**Agente:** @data-engineer
**SP:** 8
**Status:** [x] Concluído — 2026-04-16

---

## Objetivo

Configurar o Prisma ORM com SQLite para desenvolvimento local (zero setup, sem Docker) e PostgreSQL para produção no Railway. Criar o schema completo com todas as tabelas definidas nos EPICs v1 a v5.

**Estratégia de banco:**
```
Desenvolvimento local  → SQLite (arquivo .db no projeto)
Staging/Produção       → Railway PostgreSQL (mesma schema, só muda DATABASE_URL)
```

---

## Stack desta Story

- Prisma ORM (schema + client)
- SQLite (dev) / PostgreSQL (prod)
- Sem Supabase

---

## Tarefas

- [ ] 1. Instalar Prisma e configurar
- [ ] 2. Criar schema completo (todas as tabelas dos EPICs)
- [ ] 3. Criar migration inicial
- [ ] 4. Criar seed com dados de exemplo
- [ ] 5. Gerar Prisma Client e verificar types
- [ ] 6. Criar lib/db.ts (singleton do Prisma Client)

---

## Implementação

### 1. Instalar Prisma

```bash
npm install prisma @prisma/client
npx prisma init --datasource-provider sqlite
```

Isso cria:
- `prisma/schema.prisma`
- `.env` com `DATABASE_URL="file:./dev.db"`

### 2. Schema Prisma completo

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// ─── ENUMS ──────────────────────────────────────────────
// Nota: SQLite não tem enums nativos — usar String com validação em runtime
// Em PostgreSQL (Railway produção), trocar para enum real

// ─── USUÁRIOS ───────────────────────────────────────────
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  phone         String?
  cpf           String?   @unique
  passwordHash  String?   // null = login apenas via OAuth
  role          String    @default("customer") // "customer" | "admin"
  emailVerified DateTime?
  image         String?   // URL do avatar (Google OAuth)
  isVip         Boolean   @default(false)
  deletedAt     DateTime? // Soft delete LGPD
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts     Account[]
  sessions     Session[]
  orders       Order[]
  addresses    Address[]
  reviews      Review[]
  wishlists    Wishlist[]
  loyaltyPoints LoyaltyPoint[]
  stockAlerts  StockAlert[]
  returnRequests ReturnRequest[]

  @@map("users")
}

// ─── AUTH (NextAuth.js) ──────────────────────────────────
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}

// ─── PRODUTOS ───────────────────────────────────────────
model Product {
  id              String   @id @default(cuid())
  name            String
  slug            String   @unique
  description     String?
  price           Float    // Preço de venda
  costPrice       Float?   // [PRIVADO] Preço de custo JIN
  supplierCode    String?  // [PRIVADO] Código do fornecedor JIN
  supplierName    String   @default("JIN")
  jinNotes        String?  // [PRIVADO] Notas sobre o produto na JIN

  // Classificação
  category        String   // "selecoes" | "clubes-europeus" | "clubes-brasileiros" | "retro" | "especial"
  team            String   // Nome do time/seleção
  type            String   // "titular" | "reserva" | "terceiro" | "goleiro"

  // Tamanhos disponíveis (JSON array: ["P","M","G","GG","XG","2XL","3XL","4XL"])
  sizesAvailable  String   @default("[]")
  stockNotes      String?  // Notas sobre estoque

  // Imagens (JSON array de URLs)
  images          String   @default("[]")

  // SEO
  metaTitle       String?
  metaDescription String?

  // Status
  isActive        Boolean  @default(false)
  isFeatured      Boolean  @default(false)

  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  orderItems     OrderItem[]
  reviews        Review[]
  wishlists      Wishlist[]
  stockMovements StockMovement[]
  stockAlerts    StockAlert[]

  @@map("products")
}

// ─── ENDEREÇOS ──────────────────────────────────────────
model Address {
  id            String  @id @default(cuid())
  userId        String
  label         String  @default("Casa")
  recipientName String
  street        String
  number        String
  complement    String?
  neighborhood  String
  city          String
  state         String
  zipCode       String
  isDefault     Boolean @default(false)

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  orders  Order[]

  @@map("addresses")
}

// ─── CUPONS ─────────────────────────────────────────────
model Coupon {
  id             String    @id @default(cuid())
  code           String    @unique
  type           String    // "percent" | "fixed"
  value          Float
  minOrderValue  Float     @default(0)
  maxUses        Int?
  usedCount      Int       @default(0)
  userRestriction String?  // userId específico (cupom de review)
  expiresAt      DateTime?
  isActive       Boolean   @default(true)
  createdAt      DateTime  @default(now())

  orders Order[]

  @@map("coupons")
}

// ─── PROMOÇÕES ──────────────────────────────────────────
model Promotion {
  id        String   @id @default(cuid())
  name      String
  type      String   // "bundle" | "buy_x_get_y" | "category_discount"
  rulesJson String   // JSON com as regras
  startAt   DateTime
  endAt     DateTime
  isActive  Boolean  @default(false)
  createdAt DateTime @default(now())

  @@map("promotions")
}

// ─── PEDIDOS ────────────────────────────────────────────
model Order {
  id                   String    @id @default(cuid())
  userId               String
  addressId            String?

  // Status
  status               String    @default("pending")
  // "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded"

  // Valores
  subtotal             Float
  freightCost          Float     @default(0)
  discountAmount       Float     @default(0)
  total                Float
  couponId             String?

  // Pagamento
  paymentMethod        String    // "credit_card" | "debit_card" | "pix"
  paymentStatus        String    @default("pending")
  // "pending" | "paid" | "failed" | "refunded"
  stripePaymentIntentId String?
  pixQrCode            String?   // QR Code base64
  pixExpiration        DateTime?
  threeDsTriggered     Boolean   @default(false)

  // Frete / Rastreio
  trackingCode         String?
  carrier              String?
  trackingEventsJson   String?   // JSON array de eventos Correios
  trackingUpdatedAt    DateTime?

  notes                String?
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  user      User       @relation(fields: [userId], references: [id])
  address   Address?   @relation(fields: [addressId], references: [id])
  coupon    Coupon?    @relation(fields: [couponId], references: [id])
  items     OrderItem[]
  history   OrderHistory[]
  returnRequests ReturnRequest[]

  @@map("orders")
}

model OrderItem {
  id           String  @id @default(cuid())
  orderId      String
  productId    String
  productName  String  // snapshot do nome no momento da compra
  productImage String  // snapshot da imagem
  size         String
  quantity     Int
  unitPrice    Float
  totalPrice   Float
  jinSourcedAt DateTime? // [PRIVADO] Quando o item foi comprado na JIN

  order   Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id])

  @@map("order_items")
}

model OrderHistory {
  id          String    @id @default(cuid())
  orderId     String
  adminUserId String?
  action      String    // "status_change" | "note_added" | "refund_processed" | ...
  fromStatus  String?
  toStatus    String?
  note        String?
  createdAt   DateTime  @default(now())

  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@map("order_history")
}

// ─── AVALIAÇÕES ─────────────────────────────────────────
model Review {
  id               String    @id @default(cuid())
  userId           String
  productId        String
  orderId          String?
  rating           Int       // 1-5
  title            String?
  body             String?
  photos           String    @default("[]") // JSON array de URLs
  status           String    @default("pending") // "pending" | "approved" | "rejected"
  adminResponse    String?
  couponGeneratedId String?  // ID do cupom gerado como recompensa
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  user    User    @relation(fields: [userId], references: [id])
  product Product @relation(fields: [productId], references: [id])

  @@map("reviews")
}

// ─── LISTA DE DESEJOS ────────────────────────────────────
model Wishlist {
  id        String   @id @default(cuid())
  userId    String
  productId String
  createdAt DateTime @default(now())

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id])

  @@unique([userId, productId])
  @@map("wishlists")
}

// ─── PONTOS DE FIDELIDADE ────────────────────────────────
model LoyaltyPoint {
  id        String    @id @default(cuid())
  userId    String
  points    Int
  action    String    // "purchase" | "review" | "referral" | "double_points" | "expired"
  orderId   String?
  expiresAt DateTime?
  createdAt DateTime  @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("loyalty_points")
}

// ─── ALERTAS DE ESTOQUE ──────────────────────────────────
model StockAlert {
  id          String    @id @default(cuid())
  productId   String
  size        String
  email       String
  userId      String?
  notifiedAt  DateTime?
  createdAt   DateTime  @default(now())

  product Product @relation(fields: [productId], references: [id])
  user    User?   @relation(fields: [userId], references: [id])

  @@map("stock_alerts")
}

// ─── MOVIMENTAÇÕES DE ESTOQUE ────────────────────────────
model StockMovement {
  id          String   @id @default(cuid())
  productId   String
  size        String
  type        String   // "in" | "out"
  quantity    Int
  reason      String
  adminUserId String?
  createdAt   DateTime @default(now())

  product Product @relation(fields: [productId], references: [id])

  @@map("stock_movements")
}

// ─── BANNERS ─────────────────────────────────────────────
model Banner {
  id        String   @id @default(cuid())
  title     String
  imageUrl  String
  linkUrl   String?
  startsAt  DateTime
  endsAt    DateTime
  isActive  Boolean  @default(false)
  position  Int      @default(0)
  createdAt DateTime @default(now())

  @@map("banners")
}

// ─── CONFIGURAÇÕES DA LOJA ──────────────────────────────
model StoreSetting {
  id        String   @id @default(cuid())
  key       String   @unique
  value     String
  category  String   @default("general")
  updatedAt DateTime @updatedAt

  @@map("store_settings")
}

// ─── TROCAS E DEVOLUÇÕES ────────────────────────────────
model ReturnRequest {
  id             String    @id @default(cuid())
  orderId        String
  userId         String
  type           String    // "refund" | "exchange"
  reason         String
  description    String?
  photosUrls     String    @default("[]") // JSON array
  status         String    @default("pending")
  // "pending" | "approved" | "rejected" | "received" | "refunded" | "exchanged"
  adminNotes     String?
  trackingReturn  String?  // Código de rastreio da devolução (cliente → loja)
  trackingExchange String? // Código do produto substituto (loja → cliente)
  stripeRefundId  String?
  refundAmount    Float?
  processedBy    String?
  processedAt    DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  order Order @relation(fields: [orderId], references: [id])
  user  User  @relation(fields: [userId], references: [id])

  @@map("return_requests")
}

// ─── PUSH SUBSCRIPTIONS ─────────────────────────────────
model PushSubscription {
  id         String   @id @default(cuid())
  userId     String?
  endpoint   String   @unique
  p256dhKey  String
  authKey    String
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())

  @@map("push_subscriptions")
}

// ─── ANALYTICS ──────────────────────────────────────────
model BehaviorEvent {
  id          String   @id @default(cuid())
  sessionId   String
  userId      String?
  eventType   String   // "page_view" | "product_view" | "add_to_cart" | "checkout_started" | "purchase"
  pageUrl     String?
  productId   String?
  metadata    String?  // JSON
  utmSource   String?
  utmMedium   String?
  utmCampaign String?
  createdAt   DateTime @default(now())

  @@index([sessionId, eventType])
  @@map("behavior_events")
}
```

### 3. Criar migration e aplicar

```bash
npx prisma migrate dev --name init
```

Isso cria o arquivo `prisma/migrations/[timestamp]_init/migration.sql` e aplica no SQLite local.

### 4. Criar seed com dados de exemplo

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import { hashSync } from 'bcrypt-ts'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // Admin user
  await prisma.user.upsert({
    where: { email: 'admin@gabinetefc.com.br' },
    update: {},
    create: {
      email: 'admin@gabinetefc.com.br',
      name: 'Admin Gabinete FC',
      role: 'admin',
      passwordHash: hashSync('Admin@123', 10),
    },
  })

  // Store settings padrão
  const settings = [
    { key: 'store_name', value: 'Gabinete FC', category: 'general' },
    { key: 'store_email', value: 'contato@gabinetefc.com.br', category: 'general' },
    { key: 'whatsapp', value: '5511999999999', category: 'general' },
    { key: 'pix_discount_percent', value: '5', category: 'payments' },
    { key: 'pix_expiry_minutes', value: '60', category: 'payments' },
    { key: 'stripe_3ds_threshold', value: '500', category: 'payments' },
    { key: 'meta_pixel_id', value: '', category: 'meta' },
    { key: 'meta_bm_id', value: '', category: 'meta' },
    { key: 'meta_access_token', value: '', category: 'meta' },
    { key: 'vapid_public_key', value: '', category: 'push' },
    { key: 'return_address', value: '', category: 'operations' },
    { key: 'freight_origin_cep', value: '01310100', category: 'operations' },
  ]

  for (const setting of settings) {
    await prisma.storeSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    })
  }

  // Produtos de exemplo (mock dos 6 do frontend legado)
  const products = [
    {
      name: 'Camisa Brasil I 2024',
      slug: 'camisa-brasil-2024-titular',
      description: 'Camisa oficial da Seleção Brasileira. Tecido de alta qualidade, idêntica à usada pelos jogadores.',
      price: 249.90,
      costPrice: 75.00,
      supplierCode: 'JIN-BRA-24-T',
      category: 'selecoes',
      team: 'Brasil',
      type: 'titular',
      sizesAvailable: JSON.stringify(['P','M','G','GG','XG','2XL']),
      images: JSON.stringify(['/images/products/brasil-titular-2024.jpg']),
      isActive: true,
      isFeatured: true,
      metaTitle: 'Camisa Brasil Titular 2024 | Gabinete FC',
    },
    {
      name: 'Camisa Argentina I 2024',
      slug: 'camisa-argentina-2024-titular',
      description: 'Camisa da Campeã do Mundo. Listras azul e branca icônicas.',
      price: 249.90,
      costPrice: 75.00,
      supplierCode: 'JIN-ARG-24-T',
      category: 'selecoes',
      team: 'Argentina',
      type: 'titular',
      sizesAvailable: JSON.stringify(['P','M','G','GG','XG']),
      images: JSON.stringify(['/images/products/argentina-titular-2024.jpg']),
      isActive: true,
      isFeatured: true,
    },
    {
      name: 'Camisa Real Madrid I 2024/25',
      slug: 'camisa-real-madrid-2024-titular',
      description: 'Camisa do maior clube do mundo. Branco clássico com detalhes em dourado.',
      price: 229.90,
      costPrice: 68.00,
      supplierCode: 'JIN-RMA-24-T',
      category: 'clubes-europeus',
      team: 'Real Madrid',
      type: 'titular',
      sizesAvailable: JSON.stringify(['P','M','G','GG','XG','2XL','3XL']),
      images: JSON.stringify(['/images/products/real-madrid-titular-2024.jpg']),
      isActive: true,
      isFeatured: true,
    },
    {
      name: 'Camisa Barcelona I 2024/25',
      slug: 'camisa-barcelona-2024-titular',
      description: 'As listras azul e grená do Barça em alta qualidade.',
      price: 229.90,
      costPrice: 68.00,
      supplierCode: 'JIN-BAR-24-T',
      category: 'clubes-europeus',
      team: 'Barcelona',
      type: 'titular',
      sizesAvailable: JSON.stringify(['P','M','G','GG','XG']),
      images: JSON.stringify(['/images/products/barcelona-titular-2024.jpg']),
      isActive: true,
      isFeatured: false,
    },
    {
      name: 'Camisa Flamengo I 2024',
      slug: 'camisa-flamengo-2024-titular',
      description: 'O manto sagrado do Mengão. Rubro-negro raça e amor.',
      price: 199.90,
      costPrice: 60.00,
      supplierCode: 'JIN-FLA-24-T',
      category: 'clubes-brasileiros',
      team: 'Flamengo',
      type: 'titular',
      sizesAvailable: JSON.stringify(['P','M','G','GG','XG','2XL']),
      images: JSON.stringify(['/images/products/flamengo-titular-2024.jpg']),
      isActive: true,
      isFeatured: true,
    },
    {
      name: 'Camisa Brasil Retrô 1970',
      slug: 'camisa-brasil-retro-1970',
      description: 'A camisa da Copa do Mundo de 1970. Pelé eterno.',
      price: 219.90,
      costPrice: 65.00,
      supplierCode: 'JIN-BRA-70-R',
      category: 'retro',
      team: 'Brasil',
      type: 'titular',
      sizesAvailable: JSON.stringify(['P','M','G','GG']),
      images: JSON.stringify(['/images/products/brasil-retro-1970.jpg']),
      isActive: true,
      isFeatured: false,
    },
  ]

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product as any,
    })
  }

  console.log('✅ Seed concluído!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
```

Adicionar ao `package.json`:
```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

```bash
npm install -D ts-node bcrypt-ts
npm install bcrypt-ts
npx prisma db seed
```

### 5. Singleton do Prisma Client

```typescript
// src/lib/db.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
```

### 6. Variáveis de ambiente para banco

```bash
# .env (dev local — SQLite)
DATABASE_URL="file:./dev.db"

# Para produção Railway PostgreSQL, trocar para:
# DATABASE_URL="postgresql://USER:PASS@HOST:PORT/DATABASE"
```

Adicionar ao `.gitignore`:
```
dev.db
dev.db-journal
prisma/migrations/  # NÃO ignorar, commitar as migrations
```

---

## Critérios de Aceitação

- [ ] `npx prisma migrate dev` executa sem erros
- [ ] `npx prisma db seed` popula o banco com 6 produtos e 1 admin
- [ ] `npx prisma studio` abre e mostra todas as tabelas
- [ ] `prisma.$connect()` funciona sem erro em uma Server Action de teste
- [ ] Tipos TypeScript do Prisma Client gerados e funcionando (sem erros de type)
- [ ] `lib/db.ts` exportando singleton sem memory leak em dev (hot reload)

---

## Para migrar para Railway PostgreSQL (quando necessário)

```bash
# 1. Trocar o provider no schema.prisma
# datasource db { provider = "postgresql" }

# 2. Trocar DATABASE_URL no Vercel/Railway
DATABASE_URL="postgresql://..."

# 3. Re-gerar o client
npx prisma generate

# 4. Aplicar migrations
npx prisma migrate deploy
```

---

## Arquivos criados/modificados

- [ ] `prisma/schema.prisma`
- [ ] `prisma/seed.ts`
- [ ] `prisma/dev.db` (gerado automaticamente — não commitar)
- [ ] `src/lib/db.ts`
- [ ] `.env` (DATABASE_URL)
- [ ] `package.json` (prisma.seed script)

---

*Story 002 | Sprint 1 | Gabinete FC*
