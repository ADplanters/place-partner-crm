// 파일 경로: app/page.tsx
// 역할: 메인 도메인 접속 시 일반 고객을 순위 진단 폼으로 즉시 이동시킵니다.

import { redirect } from 'next/navigation';

export default function HomePage() {
  // 고객이 주소창에 rank.placepartner.cloud를 치면
  // 자동으로 /rank-check 경로로 넘겨버립니다.
  redirect('/rank-check');
}