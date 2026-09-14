// 파일 경로: app/page.tsx
// 역할: 접속 도메인(admin.placepartner.cloud vs rank.placepartner.cloud)을 확인하여
//       admin 도메인 접속 시 URL 뒤에 하위 경로 없이 메인 주소 그대로 관리자 콘솔을 렌더링합니다.

import { headers } from "next/headers";
import RankCheckPage from "./rank-check/page";
import AdminPage from "./admin/page"; // 🌟 pp-manager를 완전히 제거하고 admin 경로 컴포넌트로 연결

export default function HomePage() {
  // 서버 사이드에서 현재 접속한 도메인(Host)을 감지합니다.
  const headersList = headers();
  const host = headersList.get("host") || "";
  
  // admin.placepartner.cloud 접속 시 관리자 전용 페이지(AdminPage) 출력
  if (host.startsWith("admin.")) {
    return <AdminPage />;
  }

  // 그 외 도메인(rank.placepartner.cloud 등) 접속 시 순위 진단 페이지 출력
  return <RankCheckPage />;
}