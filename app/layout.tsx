"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Inter } from "next/font/google";
import "./globals.css";
import { auth, db } from "../firebase"; 
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// Google Inter 폰트 설정 (영문 기본 폰트 최적화)
const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdminDomain, setIsAdminDomain] = useState(false);

  useEffect(() => {
    // 1. 접속 기기 가로폭 반응형 감지 (768px 이하 모바일로 판단)
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // 2. 접속 서브도메인 감지 (admin.placepartner.cloud 도메인 여부 감지)
    if (typeof window !== "undefined" && window.location.hostname.startsWith("admin.")) {
      setIsAdminDomain(true);
    }

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    // 3. 파이어베이스 사용자 로그인 권한 상태 확인 (관리자/총괄 디렉터 판별)
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const uData = userSnap.data();
            const hasAdminRole =
              uData.role === "admin" ||
              uData.team === "본사/총괄 디렉터" ||
              uData.team === "본사/관리자";
            setIsAdmin(hasAdminRole);
          }
        } catch (error) {
          console.error("권한 확인 실패:", error);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => {
      window.removeEventListener("resize", checkIsMobile);
      unsubscribe();
    };
  }, []);

  // 🌟 접속 퍼블릭 예외 경로 설정
  // 메인 루트(/), 순위진단(/rank-check), 기존 백업 라우트(/pp-manager) 및 admin. 서브도메인 접속 시 예외 처리
  const isPublicRoute =
    pathname === "/" ||
    pathname === "/rank-check" ||
    pathname === "/pp-manager" ||
    isAdminDomain;

  // 4. 로딩 중 화면 처리 (퍼블릭 경로가 아닐 때만 렌더링)
  if (loading && !isPublicRoute) {
    return (
      <html lang="ko">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body className={`${inter.className} bg-place-partner`}>
          <div className="flex h-screen items-center justify-center">
            <div className="font-bold text-gray-400 text-sm">환경 설정 확인 중...</div>
          </div>
        </body>
      </html>
    );
  }

  // 5. 모바일 비관리자 접속 차단 안내 화면 (원본 UI 100% 보존)
  if (isMobile && !isAdmin && !isPublicRoute) {
    return (
      <html lang="ko">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body className={`${inter.className} bg-place-partner`}>
          <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-2xl max-w-sm w-full flex flex-col items-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6 text-3xl">
                📱
              </div>
              <h1 className="text-xl font-black text-gray-900 mb-3">
                모바일 접근이 제한되었습니다
              </h1>
              <p className="text-sm font-medium text-gray-500 mb-6 leading-relaxed">
                해당 시스템은 보안 및 최적화를 위해<br />
                <span className="font-bold text-gray-900">PC 환경</span> 또는{" "}
                <span className="font-bold text-gray-900">본사/관리자 권한</span><br />
                보유 시에만 접속이 가능합니다.
              </p>
              <div className="w-full bg-gray-50 p-3 rounded-xl flex items-center gap-2 justify-center text-xs text-gray-400 font-bold">
                🔒 현재 접속 기기: 모바일 환경
              </div>
            </div>
          </div>
        </body>
      </html>
    );
  }

  // 6. 루트 자식 요소 렌더링
  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
      </head>
      <body className={`${inter.className} bg-place-partner antialiased`}>
        {children}
      </body>
    </html>
  );
}