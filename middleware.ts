// 파일 경로: middleware.ts (app 폴더 바깥, 프로젝트 최상단)

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const url = request.nextUrl;

  // 🌟 admin.placepartner.cloud 도메인으로 메인 경로(/) 접속 시
  if (host.startsWith('admin.') && url.pathname === '/') {
    // URL 주소창은 그대로 유지한 채, /admin 폴더 내의 page.tsx를 렌더링합니다.
    return NextResponse.rewrite(new URL('/admin', request.url));
  }

  // 그 외(rank.placepartner.cloud 등)는 통과시킵니다.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};