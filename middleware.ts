import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      // Redirect to login with the current path as redirect parameter
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      loginUrl.searchParams.set('source', 'admin');
      return NextResponse.redirect(loginUrl);
    }    // For email settings, we'll handle SUPERADMIN validation in the page component
    // since middleware runs in edge runtime and can't access Prisma
  }

  // Handle email link redirects for admin registrations page
  if (pathname === '/admin/registrations' && request.nextUrl.searchParams.get('source') === 'email') {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      // Redirect to login with email source and redirect to registrations
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', '/admin/registrations');
      loginUrl.searchParams.set('source', 'email');
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public|images).*)',
  ],
};
