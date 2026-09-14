// 파일 경로: app/page.tsx
// 역할: URL 리다이렉팅(이동) 절대 없이, 메인 도메인에서 순위 진단 폼을 즉시 렌더링합니다.

import RankCheckPage from "./rank-check/page";

export default function HomePage() {
  return <RankCheckPage />;
}