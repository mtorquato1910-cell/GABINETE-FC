import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { z } from 'zod'
import { prisma } from './db'

// Note: In production, use bcryptjs for password hashing
// For local dev without bcrypt, we use a simple comparison
// npm install bcryptjs @types/bcryptjs — will be added in Sprint 4

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    // Google OAuth — uncomment when GOOGLE_CLIENT_ID is set
    // Google({
    //   clientId: process.env.GOOGLE_CLIENT_ID!,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    // }),

    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user || !user.password) return null

        // TODO Sprint 4: substituir por bcrypt.compare(password, user.password)
        // Por ora: comparação simples para dev local (NUNCA em produção)
        if (password !== user.password) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role ?? 'customer'
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        ;(session.user as { role?: string }).role = token.role as string
      }
      return session
    },
  },

  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
})

/**
 * Guard para Server Actions — verifica se usuário é admin
 */
export async function requireAdmin() {
  const session = await auth()
  if (!session?.user) throw new Error('Não autenticado')
  if ((session.user as { role?: string }).role !== 'admin') {
    throw new Error('Acesso negado — apenas admins')
  }
  return session
}

/**
 * Guard para Server Actions — verifica se usuário está autenticado
 */
export async function requireAuth() {
  const session = await auth()
  if (!session?.user) throw new Error('Não autenticado')
  return session
}
