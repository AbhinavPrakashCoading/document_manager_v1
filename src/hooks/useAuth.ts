'use client'

import { useSession } from 'next-auth/react'

export interface User {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

export function useAuth() {
  const { data: session, status } = useSession()
  
  return {
    user: session?.user as User | null,
    isLoading: status === 'loading',
    isAuthenticated: !!session?.user
  }
}
