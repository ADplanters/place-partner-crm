// app/layout.tsx

import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter } from "next/font/google";
import "./globals.css";
import LayoutClientLogic from "./LayoutClientLogic";

const inter = Inter({ subsets: ["latin"] });

// 🌟 `headers`를 사용하여 요청 도메인별 메타데이터를 동적으로 생성합니다.
export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const isAdminDomain = host.startsWith("admin.");

  // 1️⃣ 외부 홍보용 페이지 기본 설정 (https://rank.placepartner.cloud)
  let title = '네이버 플레이스 순위 확인 | 플레이스 파트너';
  let description = '소상공인을 위한 네이버 플레이스 실시간 순위 확인 및 마케팅 솔루션. 내 업체 지도의 상위노출 순위를 조회하고 효과적으로 관리하세요.';
  let url = 'https://rank.placepartner.cloud';
  // 🌟 외부용 파비콘 파일명: favicon.png
  let faviconPath = '/favicon.png';

  const keywords = [
    '네이버 플레이스 상위노출',
    '플레이스 상위노출',
    '플레이스 마케팅',
    '플레이스 파트너',
    '네이버 플레이스 순위 확인',
    '내업체 순위 확인'
  ];

  // 2️⃣ 내부 관리자 보안 CRM 페이지 설정 (https://admin.placepartner.cloud)
  if (isAdminDomain) {
    title = '플레이스 파트너 | 보안 CRM - 관리자 대시보드';
    description = '내부 회사 관리자 전용 보안 CRM 페이지입니다.';
    url = 'https://admin.placepartner.cloud';
    // 🌟 관리자용 파비콘 파일명: CRM-favicon.png
    faviconPath = '/CRM-favicon.png';
  }

  // 최종 메타데이터 객체 반환
  return {
    title,
    description,
    keywords,
    openGraph: {
      title, // 동적 제목 사용
      description, // 동적 설명 사용
      url, // 동적 URL 사용
      siteName: '플레이스 파트너',
      locale: 'ko_KR',
      type: 'website',
    },
    robots: {
      index: true,
      follow: true,
    },
    // 🌟 3️⃣ Icons 설정을 조건부 `faviconPath`로 적용합니다.
    icons: {
      icon: faviconPath,
      // 필요시 다른 사이즈의 파비콘도 조건부로 추가할 수 있습니다.
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const isAdminDomain = host.startsWith("admin.");

  return (
    <html lang="ko">
      <head>
        {/* Viewport 등 필수 태그만 유지 */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
        {/* 파비콘 및 타이틀은 generateMetadata에서 자동 삽입 */}
      </head>
      <body className={`${inter.className} bg-place-partner antialiased`}>
        {/* isAdminDomain 로직은 유지하여 body 렌더링 제어 */}
        <LayoutClientLogic isAdminDomain={isAdminDomain}>
          {children}
        </LayoutClientLogic>
      </body>
    </html>
  );
}