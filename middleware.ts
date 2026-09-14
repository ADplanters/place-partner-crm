// 파일 경로: middleware.ts (app 폴더와 동일한 최상단 위치)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const url = request.nextUrl;

  // 접속 도메인이 admin.placepartner.cloud 이고, 메인 경로(/)로 접속했을 때
  if (host.startsWith('admin.') && url.pathname === '/') {
    // 서버 내부적으로 /admin 폴더를 렌더링합니다.
    return NextResponse.rewrite(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};