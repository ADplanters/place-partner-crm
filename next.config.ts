import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // rewrites 기능: 주소창 URL은 그대로 유지하면서 목적지(destination)의 화면만 불러옵니다.
  async rewrites() {
    return [
      {
        source: "/",
        destination: "/rank-check",
      },
    ];
  },
};

export default nextConfig;