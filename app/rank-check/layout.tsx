import { Metadata } from "next";

export const metadata: Metadata = {
  title: "PLACE PARTNER | 내 매장 플레이스 실시간 순위 진단",
  description:
    "미슐랭 가이드 데이터 알고리즘을 기반으로 사장님 매장의 현재 위치와 문제점을 1분 만에 실시간 진단해 드립니다.",
  
  // 🌟 카카오톡, 네이버 카페, 페이스북 공유 메타 태그 (Open Graph)
  openGraph: {
    title: "PLACE PARTNER | 내 매장 플레이스 실시간 순위 진단",
    description:
      "우리 매장 네이버 플레이스, 몇 위에 노출되고 있을까? 1분 무료 실시간 진단받기",
    url: "https://placepartner.kr/rank-check",
    siteName: "PLACE PARTNER",
    images: [
      {
        url: "/rank-check-image.png", // public/rank-check-image.png 사용
        width: 1200,
        height: 630,
        alt: "PLACE PARTNER 플레이스 순위 진단",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },

  // 🌟 트위터 / X 카드
  twitter: {
    card: "summary_large_image",
    title: "PLACE PARTNER | 내 매장 플레이스 실시간 순위 진단",
    description:
      "우리 매장 네이버 플레이스, 몇 위에 노출되고 있을까? 1분 무료 실시간 진단받기",
    images: ["/rank-check-image.png"],
  },

  // 🌟 브라우저 파비콘
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RankCheckLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}