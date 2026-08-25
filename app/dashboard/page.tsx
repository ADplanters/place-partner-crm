"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  Moon,
  Sun,
  Bell,
  X,
  Settings,
  LogOut,
  LayoutDashboard,
  Calendar,
  PhoneCall,
  FileText,
  Folder,
  GraduationCap,
  Users,
  Globe,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();

  // 유저 및 권한 상태
  const [userName, setUserName] = useState("사용자");
  const [userTeam, setUserTeam] = useState("영업팀");

  // 기능별 상태 값
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // 매출 목표 및 현재 실적 데이터
  const [monthlyGoal, setMonthlyGoal] = useState(10000000);
  const [annualGoal, setAnnualGoal] = useState(120000000);
  const [currentMonthlySales, setCurrentMonthlySales] = useState(0);
  const [currentAnnualSales, setCurrentAnnualSales] = useState(200000);

  // 모달 입력용 임시 데이터
  const [tempMonthlyGoal, setTempMonthlyGoal] = useState(monthlyGoal);
  const [tempAnnualGoal, setTempAnnualGoal] = useState(annualGoal);

  // 알림 데이터 목록
  const [notifications, setNotifications] = useState([
    { id: 1, title: "새로운 계약 체결", desc: "(주)플래너스 300만원 계약 등록 완료", time: "10분 전", read: false },
    { id: 2, title: "가입 승인 요청", desc: "신규 영업자 계정 승인 대기 중입니다.", time: "1시간 전", read: false },
    { id: 3, title: "목표 달성 알림", desc: "당월 목표 실적의 50%를 달성했습니다.", time: "어제", read: true },
  ]);

  // 로그인 상태 및 DB 목표 설정 불러오기
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserName(user.displayName || "담당자");

        // 유저 팀 정보 가져오기
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists()) {
          setUserTeam(userSnap.data().team || "영업팀");
        }

        // 목표 데이터 Firestore에서 불러오기
        const goalSnap = await getDoc(doc(db, "settings", "salesGoal"));
        if (goalSnap.exists()) {
          const data = goalSnap.data();
          setMonthlyGoal(data.monthlyGoal || 10000000);
          setAnnualGoal(data.annualGoal || 120000000);
          setTempMonthlyGoal(data.monthlyGoal || 10000000);
          setTempAnnualGoal(data.annualGoal || 120000000);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // 목표 설정 저장 함수
  const handleSaveGoal = async () => {
    try {
      setMonthlyGoal(tempMonthlyGoal);
      setAnnualGoal(tempAnnualGoal);

      await setDoc(doc(db, "settings", "salesGoal"), {
        monthlyGoal: tempMonthlyGoal,
        annualGoal: tempAnnualGoal,
        updatedAt: new Date(),
      });

      setIsGoalModalOpen(false);
      alert("목표 금액이 정상적으로 수정되었습니다.");
    } catch (error) {
      console.error("목표 저장 에러:", error);
      alert("목표 저장 중 오류가 발생했습니다.");
    }
  };

  // 로그아웃
  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  // 알림 읽음 처리
  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  // 남은 금액 및 달성률 계산
  const remainingSales = Math.max(0, monthlyGoal - currentMonthlySales);
  const monthlyAchievementRate = ((currentMonthlySales / monthlyGoal) * 100).toFixed(1);
  const annualAchievementRate = ((currentAnnualSales / annualGoal) * 100).toFixed(1);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className={`flex min-h-screen ${isDarkMode ? "bg-gray-900 text-white" : "bg-[#F8F9FA] text-gray-900"} transition-colors duration-200`}>
      {/* 1. 사이드바 */}
      <aside className={`w-64 border-r flex flex-col justify-between p-6 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
        <div>
          {/* 클릭 시 대시보드 홈으로 이동하는 로고 */}
          <div
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 mb-10 cursor-pointer hover:opacity-80 transition-opacity"
            title="대시보드 홈으로 이동"
          >
            <span className="text-3xl font-black text-red-600">*</span>
            <span className="text-xl font-black text-red-600 tracking-tight">PLACE PARTNER</span>
          </div>

          {/* 메뉴 목록 */}
          <nav className="space-y-1">
            <button className="flex w-full items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl bg-blue-50 text-blue-600">
              <LayoutDashboard size={18} /> 대시보드
            </button>
            <button onClick={() => router.push("/schedule")} className={`flex w-full items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all ${isDarkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-50 text-gray-600"}`}>
              <Calendar size={18} /> 통합 일정
            </button>
            <button onClick={() => router.push("/sales")} className={`flex w-full items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all ${isDarkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-50 text-gray-600"}`}>
              <PhoneCall size={18} /> 영업 결과 관리
            </button>
            <button onClick={() => router.push("/contracts")} className={`flex w-full items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all ${isDarkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-50 text-gray-600"}`}>
              <FileText size={18} /> 계약 관리
            </button>
            <button onClick={() => router.push("/forms")} className={`flex w-full items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all ${isDarkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-50 text-gray-600"}`}>
              <Folder size={18} /> 서식 모음
            </button>
            <button onClick={() => router.push("/education")} className={`flex w-full items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all ${isDarkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-50 text-gray-600"}`}>
              <GraduationCap size={18} /> 교육 자료
            </button>
            <button onClick={() => router.push("/team")} className={`flex w-full items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all ${isDarkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-50 text-gray-600"}`}>
              <Users size={18} /> 팀원 관리
            </button>
          </nav>
        </div>

        {/* 사이드바 하단 (다크모드 / 알림 / 네이버 카페 & 홈페이지 바로가기 / 프로필) */}
        <div className="space-y-4 relative">
          <div className="flex items-center gap-2">
            {/* 다크모드 버튼 */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2.5 rounded-full transition-all ${isDarkMode ? "bg-gray-700 text-yellow-400 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              title="다크모드 토글"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* 알림창 토글 버튼 */}
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className={`relative p-2.5 rounded-full transition-all ${isDarkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              title="알림창"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>

            {/* 네이버 플레이스 파트너 카페 링크 (네이버 N 로고 적용) */}
            <a
              href="https://cafe.naver.com/bluebottlefollower"
              target="_blank"
              rel="noopener noreferrer"
              className={`p-2.5 rounded-full transition-all flex items-center justify-center ${isDarkMode ? "bg-gray-700 text-green-400 hover:bg-gray-600" : "bg-green-50 text-[#03C75A] hover:bg-green-100"}`}
              title="네이버 플레이스 파트너 카페"
            >
              <svg className="w-[18px] h-[18px] fill-current" viewBox="0 0 24 24">
                <path d="M16.273 12.845L7.376 0H0v24h7.727v-12.845L16.624 24H24V0h-7.727v12.845z" />
              </svg>
            </a>

            {/* 애드플랜터스 홈페이지 링크 */}
            <a
              href="https://www.adplanters.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={`p-2.5 rounded-full transition-all ${isDarkMode ? "bg-gray-700 text-blue-400 hover:bg-gray-600" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}
              title="애드플랜터스 공식 홈페이지"
            >
              <Globe size={18} />
            </a>
          </div>

          {/* 알림 팝업 창 */}
          {isNotificationOpen && (
            <div className={`absolute bottom-16 left-0 w-80 rounded-2xl border shadow-xl p-4 z-50 transition-all ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-100 text-gray-900"}`}>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm">알림</h3>
                  {unreadCount > 0 && (
                    <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-bold">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <button onClick={markAllAsRead} className="text-xs text-blue-500 hover:underline">
                  모두 읽음
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-2.5 rounded-xl text-xs transition-all ${
                      n.read
                        ? isDarkMode ? "bg-gray-700/50 text-gray-400" : "bg-gray-50 text-gray-400"
                        : isDarkMode ? "bg-gray-700 text-gray-100" : "bg-blue-50/60 text-gray-800 font-medium"
                    }`}
                  >
                    <div className="font-bold mb-0.5">{n.title}</div>
                    <div className="text-gray-500 dark:text-gray-400 mb-1">{n.desc}</div>
                    <div className="text-[10px] text-gray-400">{n.time}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 프로필 및 로그아웃 */}
          <div className={`flex items-center justify-between p-3 rounded-2xl border ${isDarkMode ? "bg-gray-700/50 border-gray-700" : "bg-gray-50 border-gray-100"}`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                {userName.slice(0, 1)}
              </div>
              <div>
                <div className="text-xs font-bold">{userName}</div>
                <div className="text-[10px] text-gray-400">{userTeam}</div>
              </div>
            </div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors" title="로그아웃">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. 메인 콘텐츠 영역 */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-xs font-bold text-red-500 mb-1 flex items-center gap-1">
              🎯 목표 설정 안내
            </div>
            <h1 className="text-2xl font-black">
              이번 달, 매출 목표까지{" "}
              <span className="text-blue-600">{remainingSales.toLocaleString()}원</span> 남았어요 💪
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* 목표 설정 변경 버튼 */}
            <button
              onClick={() => setIsGoalModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-sm transition-all"
            >
              <Settings size={16} /> 목표 설정 변경
            </button>
            <div className={`px-4 py-2.5 rounded-xl border text-sm font-bold ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              2026년 8월
            </div>
          </div>
        </div>

        {/* 상단 현황 카드 2개 */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* 연간 누적 카드 */}
          <div className={`p-6 rounded-2xl border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"} shadow-sm`}>
            <div className="text-xs font-bold text-gray-400 mb-2">연간 2026년 누적</div>
            <div className="text-3xl font-black mb-4">
              {annualAchievementRate} <span className="text-base font-normal text-gray-400">% 달성</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden mb-3">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Number(annualAchievementRate))}%` }}
              />
            </div>
            <div className="flex justify-between text-xs font-bold text-gray-400">
              <span>달성 ₩ {currentAnnualSales.toLocaleString()}</span>
              <span>목표 ₩ {annualGoal.toLocaleString()}</span>
            </div>
          </div>

          {/* 당월 현황 카드 */}
          <div className={`p-6 rounded-2xl border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"} shadow-sm`}>
            <div className="text-xs font-bold text-gray-400 mb-2">당월 8월 현황</div>
            <div className="text-3xl font-black mb-4">
              {monthlyAchievementRate} <span className="text-base font-normal text-gray-400">% 달성</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden mb-3">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Number(monthlyAchievementRate))}%` }}
              />
            </div>
            <div className="flex justify-between text-xs font-bold text-gray-400">
              <span>달성 ₩ {currentMonthlySales.toLocaleString()}</span>
              <span>목표 ₩ {monthlyGoal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* 하단 계약 총 매출 추이 차트 구역 */}
        <div className={`p-6 rounded-2xl border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"} shadow-sm`}>
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-sm">계약 총 매출 추이 (MONTHLY) - 2026년</h3>
            <span className="text-xs text-gray-400">* DB 계약 매출 기준 실시간 집계</span>
          </div>

          {/* 월별 막대 그래프 UI */}
          <div className="flex items-end justify-between h-48 pt-8 px-4">
            {["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"].map((m, idx) => (
              <div key={m} className="flex flex-col items-center gap-3">
                <div
                  className={`w-8 rounded-full transition-all ${
                    idx === 7 ? "bg-blue-600 h-3" : isDarkMode ? "bg-gray-700 h-2" : "bg-gray-100 h-2"
                  }`}
                />
                <span className={`text-xs font-bold ${idx === 7 ? "text-blue-600" : "text-gray-400"}`}>
                  {m}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* 3. 목표 설정 변경 모달 */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-100 text-gray-900"}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black">매출 목표 설정</h2>
              <button onClick={() => setIsGoalModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">당월 목표 금액 (원)</label>
                <input
                  type="number"
                  value={tempMonthlyGoal}
                  onChange={(e) => setTempMonthlyGoal(Number(e.target.value))}
                  className={`w-full px-4 py-3 rounded-xl border text-sm font-bold outline-none focus:border-blue-600 ${
                    isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">연간 목표 금액 (원)</label>
                <input
                  type="number"
                  value={tempAnnualGoal}
                  onChange={(e) => setTempAnnualGoal(Number(e.target.value))}
                  className={`w-full px-4 py-3 rounded-xl border text-sm font-bold outline-none focus:border-blue-600 ${
                    isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"
                  }`}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsGoalModalOpen(false)}
                className={`flex-1 py-3 rounded-xl font-bold text-sm ${isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}
              >
                취소
              </button>
              <button
                onClick={handleSaveGoal}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-sm transition-all"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}