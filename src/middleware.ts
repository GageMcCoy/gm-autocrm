import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Temporarily return next response to disable auth checks
  return NextResponse.next();
}

// Keep the matcher configuration for when we re-enable auth
export const config = {
  matcher: [
    '/',
    '/auth/:path*',
    '/customer/:path*',
    '/worker/:path*',
    '/admin/:path*',
  ],
}; 