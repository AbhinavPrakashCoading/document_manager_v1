import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: process.env.DATABASE_URL ? PrismaAdapter(prisma) as any : undefined,
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        authorization: {
          params: {
            prompt: "consent",
            access_type: "offline",
            response_type: "code"
          }
        }
      })
    ] : []),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Only try database operations if we have a database connection
          if (!process.env.DATABASE_URL) {
            console.warn('No DATABASE_URL configured, credentials auth disabled')
            return null
          }

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          })

          if (!user || !user.password) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: process.env.DATABASE_URL ? 'database' : 'jwt',
  },
  callbacks: {
    async session({ session, user, token }) {
      if (user && session.user) {
        (session.user as any).id = user.id
      } else if (token && session.user) {
        (session.user as any).id = token.sub
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      console.log('Auth redirect called:', { url, baseUrl })
      
      // If the URL is just the base URL (after sign-in), redirect to dashboard
      if (url === baseUrl || url === baseUrl + '/') {
        console.log('Redirecting to dashboard from base URL')
        return `${baseUrl}/dashboard`
      }
      
      // If it's a relative callback URL, make it absolute and check if it should go to dashboard
      if (url.startsWith("/")) {
        const absoluteUrl = `${baseUrl}${url}`
        // If it's a sign-in related URL, redirect to dashboard
        if (url.includes('/signin') || url.includes('/signup') || url === '/') {
          console.log('Redirecting to dashboard from auth page')
          return `${baseUrl}/dashboard`
        }
        return absoluteUrl
      }
      
      // If it's an absolute URL on the same origin, allow it
      try {
        const urlObject = new URL(url)
        const baseUrlObject = new URL(baseUrl)
        if (urlObject.origin === baseUrlObject.origin) {
          // If it's pointing to auth pages, redirect to dashboard
          if (urlObject.pathname.includes('/signin') || urlObject.pathname.includes('/signup') || urlObject.pathname === '/') {
            console.log('Redirecting to dashboard from same origin auth URL')
            return `${baseUrl}/dashboard`
          }
          return url
        }
      } catch (error) {
        console.error('Error parsing URL in redirect:', error)
      }
      
      // Default fallback - always go to dashboard
      console.log('Default redirect to dashboard')
      return `${baseUrl}/dashboard`
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
}