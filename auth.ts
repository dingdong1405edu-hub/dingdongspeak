import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from '@/lib/prisma'
import type { Adapter } from 'next-auth/adapters'

// Custom adapter: maps NextAuth's `image` field to our schema's `avatar` field
const baseAdapter = PrismaAdapter(prisma) as Adapter
const adapter: Adapter = {
  ...baseAdapter,
  createUser: async (data: any) => {
    const { image, emailVerified, ...rest } = data
    const user = await prisma.user.create({
      data: { ...rest, avatar: image ?? null, emailVerified: emailVerified ?? null },
    })
    return { ...user, emailVerified: user.emailVerified ?? null, image: user.avatar ?? null }
  },
  updateUser: async (data: any) => {
    const { image, id, ...rest } = data
    const user = await prisma.user.update({
      where: { id },
      data: { ...rest, ...(image !== undefined ? { avatar: image } : {}) },
    })
    return { ...user, emailVerified: user.emailVerified ?? null, image: user.avatar ?? null }
  },
  getUser: async (id: string) => {
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return null
    return { ...user, emailVerified: user.emailVerified ?? null, image: user.avatar ?? null }
  },
  getUserByEmail: async (email: string) => {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return null
    return { ...user, emailVerified: user.emailVerified ?? null, image: user.avatar ?? null }
  },
  getUserByAccount: async ({ provider, providerAccountId }: any) => {
    const account = await prisma.account.findUnique({
      where: { provider_providerAccountId: { provider, providerAccountId } },
      include: { user: true },
    })
    if (!account) return null
    const user = account.user
    return { ...user, emailVerified: user.emailVerified ?? null, image: user.avatar ?? null }
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    async session({ session, token }) {
      if (token?.id) session.user.id = token.id as string
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.AUTH_SECRET,
})
