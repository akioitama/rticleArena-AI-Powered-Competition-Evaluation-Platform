import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Redirect old auth routes to home (auth is now on main page)
  if (path.startsWith('/login') || path.startsWith('/register')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Redirect old admin/competitor routes to home
  if (path.startsWith('/admin') || path.startsWith('/competitor')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/login/:path*', '/register', '/register/:path*', '/admin/:path*', '/competitor/:path*'],
};
