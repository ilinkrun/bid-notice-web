import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // API routes는 middleware에서 완전히 제외
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    // API routes 완전 제외
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};