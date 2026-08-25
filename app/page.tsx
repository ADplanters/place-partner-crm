"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../firebase";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, setIsPending] = useState(false); // 승인 대기 상태

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Firestore의 users 컬렉션에서 해당 유저 데이터 확인
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // 1. 처음 로그인한 사람 (신규 가입 처리) -> 'pending(대기)' 권한 부여
        await setDoc(userRef, {
          uid: user.uid,
          name: user.displayName || "이름 없음",
          email: user.email,
          role: "pending", // 가입 대기 상태
          team: "미배정",
          createdAt: serverTimestamp(),
        });
        setIsPending(true);
      } else {
        // 2. 이미 가입된 사람
        const userData = userSnap.data();
        if (userData.role === "pending") {
          // 아직 관리자가 승인 안 해줌
          setIsPending(true);
        } else {
          // 승인된 유저 (admin, manager, member) -> 대시보드로 이동
          router.push("/dashboard");
        }
      }
    } catch (error) {
      console.error("로그인 에러:", error);
      alert("로그인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsPending(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]">
      <div className="flex flex-col items-center">
        {/* 로고 영역 */}
        <div className="mb-6 flex flex-col items-center">
          <div className="text-4xl text-red-600 font-black mb-2">*</div>
          <h1 className="text-2xl font-black text-red-600 tracking-tight">PLACE PARTNER</h1>
          <p className="text-xs font-semibold text-gray-400 mt-1">계약 및 영업 관리 시스템</p>
        </div>

        {/* 로그인 박스 */}
        <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          {isPending ? (
            <div className="text-center">
              <h2 className="mb-2 text-lg font-bold text-gray-900">가입 승인 대기 중입니다.</h2>
              <p className="text-xs text-gray-500 mb-6">
                관리자가 계정을 승인해야 시스템에 접속할 수 있습니다.<br />담당자에게 승인을 요청해 주세요.
              </p>
              <button 
                onClick={handleLogout}
                className="w-full rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-gray-700 hover:bg-gray-50"
              >
                다른 계정으로 로그인
              </button>
            </div>
          ) : (
            <div className="text-center">
              <p className="mb-6 text-xs text-gray-500">서비스를 이용하려면 로그인이 필요합니다.</p>
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow disabled:opacity-50"
              >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="h-4 w-4" />
                {isLoading ? "로그인 중..." : "Google 계정으로 로그인"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}