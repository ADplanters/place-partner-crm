// 🌟 `headers`를 import합니다.
import { headers } from "next/headers";

// ... (다른 import는 유지)

const inter = Inter({ subsets: ["latin"] });

// 🌟 `metadata` 객체를 직접 내보내는 대신 `generateMetadata` 함수를 사용합니다.
// export const metadata: Metadata = { ... }; <- 이 부분을 아래 함수로 대체합니다.

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const isAdminDomain = host.startsWith("admin.");

  // 기본 메인 도메인 설정
  let title = '네이버 플레이스 순위 확인 | 플레이스 파트너';
  let description = '소상공인을 위한 네이버 플레이스 실시간 순위 확인 및 마케팅 솔루션. 내 업체 지도의 상위노출 순위를 조회하고 효과적으로 관리하세요.';
  // 메인 파비콘 경로
  let faviconPath = '/favicon/favicon.ico'; 
  // 타겟 사이즈별 추가 파비콘도 여기에 설정 가능 (필요시)

  // 🌟 관리자 도메인일 경우 설정 변경
  if (isAdminDomain) {
    title = '플레이스 파트너 | 보안 CRM - 관리자 대시보드'; // 사용자 요청 제목
    description = '내부 회사 관리자 전용 보안 CRM 페이지입니다.';
    // 🌟 사용자 요청: '보안 CRM' 전용 파비콘 파일명 사용
    faviconPath = '/favicon/security-crm-favicon.ico'; // 관리자 전용 파비콘
  }

  return {
    title,
    description,
    // ... (keywords, openGraph, robots 등은 기존 설정을 복사하여 유지하거나 도메인별로 조건부 처리)
    icons: {
      icon: faviconPath,
      // ... (선택사항 기기별 파비콘 경로도 조건부로 변경)
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