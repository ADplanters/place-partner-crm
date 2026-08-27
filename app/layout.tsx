"use client"; // 화면 크기 및 권한 상태 감지를 위해 Client Component로 변경

import { useEffect, useState } from "react";
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
  const [isMobile, setIsMobile] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. 화면 크기(모바일 여부) 감지 로직
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768); // 가로 해상도 768px 이하를 모바일로 간주
    };

    checkIsMobile(); // 초기 로드 시 감지
    window.addEventListener("resize", checkIsMobile); // 리사이즈 이벤트 시 감지

    // 2. 유저 권한 확인 로직
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

  // 로딩 중 화면 (깜빡임 방지)
  if (loading) {
    return (
      <html lang="ko">
        <body className={`${inter.className} bg-place-partner`}>
          <div className="flex h-screen items-center justify-center">
            <div className="font-bold text-gray-400 text-sm">환경 설정 확인 중...</div>
          </div>
        </body>
      </html>
    );
  }

  // 🌟 [핵심] 모바일 기기인데, 관리자가 아닌 경우 -> 차단 화면 렌더링
  if (isMobile && !isAdmin) {
    return (
      <html lang="ko">
        <title>PLACE PARTNER | 모바일 접근 제한</title>
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
                해당 시스템은 보안 및 최적화를 위해
                <br />
                <span className="font-bold text-gray-900">PC 환경</span> 또는 <span className="font-bold text-gray-900">본사/관리자 권한</span>
                <br />
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

  // 모바일이지만 관리자이거나, PC 접속인 경우 정상 렌더링
  return (
    <html lang="ko">
      <title>PLACE PARTNER | 영업 관리 시스템</title>
      <body className={`${inter.className} bg-place-partner antialiased`}>
        {children}
      </body>
    </html>
  );
}