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

  // 공개 라우트 (모바일 제한 예외 대상)
  const isPublicRoute = pathname === "/rank-check";

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

  // 모바일 비관리자 차단 (공개 라우트는 예외)
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