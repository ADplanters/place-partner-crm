import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 루트 주소(/) 접속 시 자동으로 /rank-check 경로로 영구 이동시키는 설정
  async redirects() {
    return [
      {
        source: '/',
        destination: '/rank-check',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;