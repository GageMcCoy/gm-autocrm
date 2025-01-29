import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = ['/auth/sign-in', '/auth/sign-up'];

// Define role-based route patterns
const roleRoutes = {
  Customer: ['/customer'],
  Worker: ['/worker', '/customer'],
  Admin: ['/admin', '/worker', '/customer']
};

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  try {
    // Create a Supabase client configured to use cookies
    const supabase = createMiddlewareClient({ req, res });

    // Get the session
    const { data: { session } } = await supabase.auth.getSession();

    const path = req.nextUrl.pathname;

    // Allow public routes
    if (publicRoutes.includes(path)) {
      return res;
    }

    // Allow API routes for authenticated users
    if (path.startsWith('/api/') && session) {
      return res;
    }

    // If no session, redirect to sign in
    if (!session) {
      return NextResponse.redirect(new URL('/auth/sign-in', req.url));
    }

    // Get user's role
    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (roleError || !userData?.role) {
      console.error('Error fetching user role:', roleError);
      return NextResponse.redirect(new URL('/auth/sign-in', req.url));
    }

    const role = userData.role as keyof typeof roleRoutes;
    const allowedRoutes = roleRoutes[role] || [];

    // Check if the user has access to the requested route
    const hasAccess = allowedRoutes.some(route => path.startsWith(route));
    if (!hasAccess) {
      return NextResponse.redirect(new URL('/auth/sign-in', req.url));
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.redirect(new URL('/auth/sign-in', req.url));
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