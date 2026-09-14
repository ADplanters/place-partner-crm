import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // rewrites를 사용하면 주소창의 URL 변경 없이 내부 페이지 화면만 보여줍니다.
  async rewrites() {
    return [
      {
        source: "/",            // 사용자가 접속하는 기본 주소 (rank.placepartner.cloud)
        destination: "/rank-check", // 실제로 불러올 내부 페이지 경로
      },
    ];
  },
};

export default nextConfig;