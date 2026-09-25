// 파일 경로: app/layout.tsx
import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter } from "next/font/google";
import "./globals.css";
import LayoutClientLogic from "./LayoutClientLogic";

const inter = Inter({ subsets: ["latin"] });

// 🌟 [추가] 네이버/구글 검색 노출 및 OpenGraph 메타 데이터 설정
export const metadata: Metadata = {
  title: '네이버 플레이스 순위 확인 | 플레이스 파트너',
  description: '소상공인을 위한 네이버 플레이스 실시간 순위 확인 및 마케팅 솔루션. 내 업체 지도의 상위노출 순위를 조회하고 효과적으로 관리하세요.',
  keywords: [
    '네이버 플레이스 상위노출',
    '플레이스 상위노출',
    '플레이스 마케팅',
    '플레이스 파트너',
    '네이버 플레이스 순위 확인',
    '내업체 순위 확인'
  ],
  openGraph: {
    title: '네이버 플레이스 순위 확인 | 플레이스 파트너',
    description: '소상공인을 위한 네이버 플레이스 실시간 순위 확인 및 마케팅 솔루션',
    url: 'https://rank.placepartner.cloud',
    siteName: '플레이스 파트너',
    locale: 'ko_KR',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

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
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
      </head>
      <body className={`${inter.className} bg-place-partner antialiased`}>
        <LayoutClientLogic isAdminDomain={isAdminDomain}>
          {children}
        </LayoutClientLogic>
      </body>
    </html>
  );
}