import { NextAuthOptions } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true
    }),
    Credentials({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        await connectDB()
        const user = await User.findOne({ email: credentials.email })
        if (!user || !user.passwordHash) return null
        const ok = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!ok) return null
        return { id: String(user._id), name: user.name, email: user.email, role: user.role } as any
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        await connectDB()
        const existingUser = await User.findOne({ email: user.email })
        if (!existingUser) {
          await User.create({
            name: user.name || user.email?.split('@')[0] || 'Unknown',
            email: user.email!,
            role: 'member',
            photoUrl: user.image
          })
        }
      }
      return true
    },
    async session({ session }) {
      await connectDB()
      if (session.user?.email) {
        const u = await User.findOne({ email: session.user.email })
        if (u) (session as any).role = u.role
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET
}
