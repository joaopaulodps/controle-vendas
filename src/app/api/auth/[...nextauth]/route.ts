import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        usuario: { label: 'Usuário', type: 'text' },
        senha: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.usuario || !credentials?.senha) {
          return null
        }

        const usuario = await prisma.usuario.findUnique({
          where: { usuario: credentials.usuario },
        })

        if (!usuario) {
          return null
        }

        const senhaValida = await bcrypt.compare(credentials.senha, usuario.senha)

        if (!senhaValida) {
          return null
        }

        return {
          id: String(usuario.id),
          name: usuario.nome,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
      }
      return session
    },
  },
})

export { handler as GET, handler as POST }
