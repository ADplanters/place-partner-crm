"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../firebase";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          name: user.displayName || "이름 없음",
          email: user.email,
          role: "pending",
          team: "미배정",
          createdAt: serverTimestamp(),
        });
        setIsPending(true);
      } else {
        const userData = userSnap.data();
        if (userData.role === "pending") {
          setIsPending(true);
        } else {
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
      <div className="flex w-full max-w-lg flex-col items-center px-4">
        {/* 상단 로고 & 타이틀 */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="text-6xl font-black text-red-600 mb-3">*</div>
          <h1 className="text-4xl font-black text-red-600 tracking-tight">
            PLACE PARTNER
          </h1>
          <p className="mt-2 text-sm font-bold text-gray-500">
            계약 및 영업 관리 시스템
          </p>
        </div>

        {/* 로그인 박스 */}
        <div className="w-full rounded-3xl border border-gray-100 bg-white p-10 shadow-sm">
          {isPending ? (
            <div className="text-center">
              <h2 className="mb-3 text-xl font-bold text-gray-900">
                가입 승인 대기 중입니다
              </h2>
              <p className="mb-8 text-sm text-gray-500 leading-relaxed">
                관리자가 계정을 승인해야 시스템에 접속할 수 있습니다.
                <br />
                담당자에게 승인을 요청해 주세요.
              </p>
              <button
                onClick={handleLogout}
                className="w-full rounded-2xl border border-gray-200 bg-white py-4 text-base font-bold text-gray-700 hover:bg-gray-50 transition-all"
              >
                다른 계정으로 로그인
              </button>
            </div>
          ) : (
            <div className="text-center">
              <p className="mb-8 text-sm font-semibold text-gray-500">
                서비스를 이용하려면 로그인이 필요합니다.
              </p>
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white py-4 text-base font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow disabled:opacity-50"
              >
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google"
                  className="h-5 w-5"
                />
                {isLoading ? "로그인 중..." : "Google 계정으로 로그인"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}