import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === '/login' || request.nextUrl.pathname.startsWith('/api/session')) {
    return NextResponse.next();
  }
  if (!request.cookies.has('airmax_access')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
