// 파일 경로: app/page.tsx
// 역할: next.config.ts의 rewrites(마스킹) 설정이 화면을 가로채서 보여주므로,
// 강제로 URL을 바꾸던 기존 redirect 코드는 삭제하고 빈 화면(null)을 반환합니다.

export default function HomePage() {
  return null;
}