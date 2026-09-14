// 파일 경로: app/page.tsx
// 역할: 주소 변경 없이, /rank-check 경로의 화면을 메인에서 그대로 렌더링합니다.

import RankCheckPage from "./rank-check/page";

export default function HomePage() {
  return <RankCheckPage />;
}