// 파일 경로: app/page.tsx
"use client";

import RankCheckPage from "./rank-check/page";

export default function HomePage() {
  // 🌟 도메인 분기는 middleware.ts가 모두 처리하므로, 
  // 메인 페이지는 오직 순위 진단 폼(RankCheckPage)만 반환하면 됩니다.
  return <RankCheckPage />;
}