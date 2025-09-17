// Temporarily disabled auth middleware while auth system is being rebuilt
// Original middleware saved for when auth-v2 is implemented

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Allow all requests while auth system is being rebuilt
  // TODO: Re-enable proper authentication when auth-v2 is implemented
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files
     * Currently allowing all requests while auth system is being rebuilt
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}

/* 
ORIGINAL AUTH MIDDLEWARE - TO BE RESTORED WHEN AUTH-V2 IS READY:

import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        const publicRoutes = ['/auth/signin', '/auth/signup', '/']
        const guestRoutes = ['/select', '/upload', '/confirm', '/dashboard']
        
        if (publicRoutes.includes(pathname)) {
          return true
        }
        
        if (guestRoutes.some(route => pathname.startsWith(route))) {
          return true
        }
        
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/((?!api/auth|api/audit|_next/static|_next/image|favicon.ico).*)',
  ],
}
*/
