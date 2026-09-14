"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Inter } from "next/font/google";
import "./globals.css";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { MonitorSmartphone, Lock } from "lucide-react";

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

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

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

  // 🌟 [수정 핵심] 공개 라우트 예외 대상 범위 확대
  // 1. 메인 루트('/') : 리다이렉션 코드 실행을 허용하기 위해 예외 추가
  // 2. 진단 폼('/rank-check') : 일반 사장님들이 접속해야 하므로 예외 유지가 필요함
  // 3. 관리자 페이지('/admin') : 대표님이 로그인할 화면이 모바일 차단에 걸리지 않도록 예외 추가
  const isPublicRoute =
    pathname === "/" ||
    pathname === "/rank-check" ||
    pathname === "/admin";

  // 공개 라우트 접속 시 로딩 락 없이 화면을 즉시 렌더링하도록 처리
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

  // 모바일 비관리자 차단 (공개 라우트는 차단 대상에서 제외)
  if (isMobile && !isAdmin && !isPublicRoute) {
    return (
      <html lang="ko">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body className={`${inter.className} bg-place-partner`}>
          <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-2xl max-w-sm w-full flex flex-col items-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
                <MonitorSmartphone size={32} className="text-red-500" />
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
                <Lock size={14} /> 현재 접속 기기: 모바일 환경
              </div>
            </div>
          </div>
        </body>
      </html>
    );
  }

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