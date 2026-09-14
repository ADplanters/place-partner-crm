// 파일 경로: app/layout.tsx
// 역할: 서버 단에서 접속 도메인(admin.placepartner.cloud)을 감지하고 Next.js 최신 비동기 headers() 대응

import { headers } from "next/headers";
import { Inter } from "next/font/google";
import "./globals.css";
import LayoutClientLogic from "./LayoutClientLogic";

const inter = Inter({ subsets: ["latin"] });

// 🌟 [핵심] Next.js 15/16+ 대응: RootLayout 컴포넌트를 async 함수로 변경
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 🌟 [핵심] headers() 함수 호출 앞에 await 추가 (TS2339 에러 원천 차단)
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const isAdminDomain = host.startsWith("admin.");

  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
      </head>
      <body className={`${inter.className} bg-place-partner antialiased`}>
        {/* 클라이언트 권한 검증 및 모바일 차단 로직 컴포넌트 호출 */}
        <LayoutClientLogic isAdminDomain={isAdminDomain}>
          {children}
        </LayoutClientLogic>
      </body>
    </html>
  );
}