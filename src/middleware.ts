import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = ['/auth/sign-in', '/auth/sign-up'];

// Define role-based route patterns
const routePatterns = {
  Customer: ['/customer', '/'],
  Worker: ['/worker', '/'],
  Admin: ['/admin', '/']
};

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  try {
    // Create a Supabase client configured to use cookies
    const supabase = createMiddlewareClient({ req, res });

    // Refresh session if expired
    await supabase.auth.getSession();

    // Return the response with the session refreshed
    return res;

  } catch (error) {
    console.error('Middleware error:', error);
    return res;
  }
}

// Specify which routes this middleware should run for
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 