// 파일 경로: app/LayoutClientLogic.tsx
// 역할: 파이어베이스 Auth 권한 검증 및 모바일 차단 UI 100% 보존 컴포넌트

"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { auth, db } from "../firebase"; 
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function LayoutClientLogic({ 
  children, 
  isAdminDomain 
}: { 
  children: React.ReactNode;
  isAdminDomain: boolean;
}) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 접속 기기가 모바일 환경(가로폭 768px 이하)인지 판별
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    // 파이어베이스 인증 상태 변경 감지 및 관리자 권한 확인
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

  // 🌟 퍼블릭 예외 경로 조건문 (pp-manager 제거 및 /admin 통일)
  const isPublicRoute =
    pathname === "/" ||
    pathname === "/rank-check" ||
    pathname === "/admin" ||
    isAdminDomain; 

  // 로딩 상태 렌더링
  if (loading && !isPublicRoute) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="font-bold text-gray-400 text-sm">환경 설정 확인 중...</div>
      </div>
    );
  }

  // 모바일 접속 차단 안내 화면 (원본 UI 100% 보존)
  if (isMobile && !isAdmin && !isPublicRoute) {
    return (
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
    );
  }

  return <>{children}</>;
}