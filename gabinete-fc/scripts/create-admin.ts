/**
 * Cria (ou promove) um usuário admin no Supabase Auth + tabela public.users (Prisma).
 *
 * Usa Service Role Key pra criar o user com email já confirmado (sem precisar
 * passar pelo fluxo de registro/confirmação).
 *
 * Uso:
 *   npx dotenv-cli -e .env.local -- npx ts-node --transpile-only --project scripts/tsconfig.json scripts/create-admin.ts
 */
import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'gabinetefc@gmail.com'
const ADMIN_PASSWORD = 'gabinete123@321@'
const ADMIN_NAME = 'Gabinete FC Admin'

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes no .env.local')
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const prisma = new PrismaClient()

  console.log(`\n→ Procurando usuário existente: ${ADMIN_EMAIL}`)
  const { data: listData, error: listErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  })
  if (listErr) throw listErr
  const existing = listData.users.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase())

  let userId: string

  if (existing) {
    console.log(`✓ Usuário já existe no Supabase Auth — id=${existing.id}`)
    console.log(`→ Atualizando senha + confirmando email`)
    const { error: updErr } = await admin.auth.admin.updateUserById(existing.id, {
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { name: ADMIN_NAME },
    })
    if (updErr) throw updErr
    userId = existing.id
  } else {
    console.log(`→ Criando novo usuário no Supabase Auth`)
    const { data: createData, error: createErr } = await admin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { name: ADMIN_NAME },
    })
    if (createErr) throw createErr
    if (!createData.user) throw new Error('Supabase não retornou user na criação')
    userId = createData.user.id
    console.log(`✓ Criado no Supabase Auth — id=${userId}`)
  }

  console.log(`\n→ Upsert no Prisma com role=admin`)
  const profile = await prisma.user.upsert({
    where: { id: userId },
    update: {
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      role: 'admin',
    },
    create: {
      id: userId,
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      role: 'admin',
    },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  })

  console.log(`\n✅ Admin pronto:`)
  console.log(profile)
  console.log(`\nLogin em:  https://www.gabinetefc.com.br/auth/login`)
  console.log(`Admin em:  https://www.gabinetefc.com.br/admin/dashboard`)

  await prisma.$disconnect()
}

main().catch((err) => {
  console.error('\n❌ Erro:', err)
  process.exit(1)
})
