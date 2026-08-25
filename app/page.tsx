"use client";

import React from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      alert("로그인에 성공했습니다!");
    } catch (error) {
      console.error("로그인 실패:", error);
      alert("로그인에 실패했습니다.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f5f7]">
      <div className="flex w-full max-w-md flex-col items-center">
        {/* 로고 영역 */}
        <div className="mb-6 flex flex-col items-center text-center">
          {/* 정밀 구현된 6잎 클로버/꽃 로고 심볼 */}
          <div className="mb-3 text-[#D80B28]">
            <svg width="52" height="52" viewBox="0 0 100 100" fill="currentColor">
              <g transform="translate(50, 50)">
                <rect x="-9" y="-44" width="18" height="36" rx="9" transform="rotate(0)" />
                <rect x="-9" y="-44" width="18" height="36" rx="9" transform="rotate(60)" />
                <rect x="-9" y="-44" width="18" height="36" rx="9" transform="rotate(120)" />
                <rect x="-9" y="-44" width="18" height="36" rx="9" transform="rotate(180)" />
                <rect x="-9" y="-44" width="18" height="36" rx="9" transform="rotate(240)" />
                <rect x="-9" y="-44" width="18" height="36" rx="9" transform="rotate(300)" />
                <circle cx="0" cy="0" r="16" />
              </g>
            </svg>
          </div>

          {/* 로고 텍스트 */}
          <h1 className="text-3xl font-black tracking-tight text-[#D80B28]">
            PLACE PARTNER
          </h1>
          <p className="mt-1 text-xs font-semibold tracking-wider text-gray-500">
            계약 및 영업 관리 시스템
          </p>
        </div>

        {/* 로그인 카드 */}
        <div className="w-full rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <p className="mb-6 text-sm font-medium text-gray-600">
            서비스를 이용하려면 로그인이 필요합니다.
          </p>

          <button
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Google 계정으로 로그인
          </button>
        </div>
      </div>
    </div>
  );
}