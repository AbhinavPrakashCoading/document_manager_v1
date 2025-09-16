import { withAuth } from 'next-auth/middleware'

export default withAuth(
  // `withAuth` augments your `Request` with the user's token.
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Check if user is authenticated for protected routes
        const { pathname } = req.nextUrl
        
        // Public routes that don't require authentication
        const publicRoutes = ['/auth/signin', '/auth/signup', '/']
        
        // Guest-accessible routes (core app features)
        const guestRoutes = ['/select', '/upload', '/confirm', '/dashboard']
        
        // If it's a public route, allow access
        if (publicRoutes.includes(pathname)) {
          return true
        }
        
        // If it's a guest route, allow access (both authenticated and guest users)
        if (guestRoutes.some(route => pathname.startsWith(route))) {
          return true
        }
        
        // For other protected routes, require a valid token
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints)
     * - api/audit (allow guest audit logs)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|api/audit|_next/static|_next/image|favicon.ico).*)',
  ],
}