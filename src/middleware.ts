import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  let ip = request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1';
  
  if (ip.includes(',')) {
    ip = ip.split(',')[0];
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-origin-ip', ip);

  const path = request.nextUrl.pathname;
  const isPublicPath = path === '/login';
  const session = request.cookies.get('admin_session')?.value;

  if (!session && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (session && isPublicPath) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
