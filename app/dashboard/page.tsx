"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../firebase";
import { doc, getDoc, setDoc, collection, getDocs, query, where, limit } from "firebase/firestore";
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
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const notificationRef = useRef<HTMLDivElement>(null);
  const monthPickerRef = useRef<HTMLDivElement>(null);

  // 로딩 상태 (이 값이 false가 되어야 메인 화면 렌더링)
  const [isLoadingData, setIsLoadingData] = useState(true);

  // 유저 및 권한 상태
  const [userName, setUserName] = useState("");
  const [userTeam, setUserTeam] = useState("");

  // 날짜 선택 상태
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(8);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

  // 기능별 UI 상태
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // 매출 목표 및 월별 집계 데이터 (기본값 설정 없이 빈 데이터)
  const [monthlyGoal, setMonthlyGoal] = useState(0);
  const [annualGoal, setAnnualGoal] = useState(0);
  const [monthlySalesMap, setMonthlySalesMap] = useState<number[]>(Array(12).fill(0));

  // 모달 입력용 임시 데이터
  const [tempMonthlyGoal, setTempMonthlyGoal] = useState(0);
  const [tempAnnualGoal, setTempAnnualGoal] = useState(0);

  // DB 연동 알림 데이터
  const [notifications, setNotifications] = useState<any[]>([]);

  // 외부 클릭 시 알림창 & 월 선택 팝업 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
      if (monthPickerRef.current && !monthPickerRef.current.contains(event.target as Node)) {
        setIsMonthPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // DB에서 실제 알림 데이터 불러오기
  const fetchRealNotifications = async () => {
    try {
      const realNotifs: any[] = [];

      const pendingSnap = await getDocs(query(collection(db, "users"), where("role", "==", "pending")));
      pendingSnap.forEach((docSnap) => {
        const u = docSnap.data();
        realNotifs.push({
          id: `user-${docSnap.id}`,
          title: "가입 승인 요청",
          desc: `${u.name || "신규 유저"} (${u.email}) 님이 승인 대기 중입니다.`,
          time: "승인 대기",
          read: false,
        });
      });

      const contractsSnap = await getDocs(query(collection(db, "contracts"), limit(5)));
      contractsSnap.forEach((docSnap) => {
        const c = docSnap.data();
        const clientName = c.clientName || c.companyName || c.customerName || "고객사";
        const amt = c.amount || c.contractAmount || 0;
        realNotifs.push({
          id: `contract-${docSnap.id}`,
          title: "계약 체결 완료",
          desc: `${clientName} - ₩${Number(amt).toLocaleString()} 계약 등록`,
          time: c.startDate || "최근",
          read: true,
        });
      });

      setNotifications(realNotifs);
    } catch (error) {
      console.error("알림 데이터 로딩 실패:", error);
    }
  };

  // Firestore DB에서 매출 데이터 집계
  const fetchDashboardData = async (year: number) => {
    try {
      const querySnapshot = await getDocs(collection(db, "contracts"));
      const salesArray = Array(12).fill(0);

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        let dateStr = data.startDate || data.contractStartDate || "";
        if (!dateStr && data.contractPeriod) {
          dateStr = data.contractPeriod.split("~")[0].trim();
        }

        let amount = 0;
        if (typeof data.amount === "number") amount = data.amount;
        else if (typeof data.contractAmount === "number") amount = data.contractAmount;
        else if (typeof data.amount === "string") amount = Number(data.amount.replace(/[^0-9]/g, "")) || 0;
        else if (typeof data.contractAmount === "string") amount = Number(data.contractAmount.replace(/[^0-9]/g, "")) || 0;

        if (dateStr) {
          const contractDate = new Date(dateStr);
          if (!isNaN(contractDate.getTime())) {
            if (contractDate.getFullYear() === year) {
              salesArray[contractDate.getMonth()] += amount;
            }
          }
        }
      });

      setMonthlySalesMap(salesArray);
    } catch (error) {
      console.error("매출 데이터 로딩 실패:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserName(user.displayName || "담당자");
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists()) {
          setUserTeam(userSnap.data().team || "영업팀");
        }

        const goalSnap = await getDoc(doc(db, "settings", "salesGoal"));
        if (goalSnap.exists()) {
          const data = goalSnap.data();
          const loadedMonthly = data.monthlyGoal || 10000000;
          const loadedAnnual = data.annualGoal || 120000000;
          setMonthlyGoal(loadedMonthly);
          setAnnualGoal(loadedAnnual);
          setTempMonthlyGoal(loadedMonthly);
          setTempAnnualGoal(loadedAnnual);
        } else {
          // 목표치가 없을 경우 기본값 세팅
          setMonthlyGoal(10000000);
          setAnnualGoal(120000000);
          setTempMonthlyGoal(10000000);
          setTempAnnualGoal(120000000);
        }

        await fetchDashboardData(selectedYear);
        await fetchRealNotifications();

        // 모든 데이터를 받아온 뒤 화면 렌더링
        setIsLoadingData(false);
      } else {
        // 로그인 상태가 아니면 튕겨내기
        router.push("/");
      }
    });
    return () => unsubscribe();
  }, [selectedYear, router]);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedYear((prev) => prev - 1);
      setSelectedMonth(12);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedYear((prev) => prev + 1);
      setSelectedMonth(1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

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
      alert("목표 금액이 저장되었습니다.");
    } catch (error) {
      alert("목표 저장 중 오류가 발생했습니다.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  // 계산식 방어 코드 (목표가 0일 경우 달성률 분모 계산 오류 방지)
  const currentMonthlySales = monthlySalesMap[selectedMonth - 1] || 0;
  const currentAnnualSales = monthlySalesMap.reduce((acc, curr) => acc + curr, 0);
  const remainingSales = Math.max(0, monthlyGoal - currentMonthlySales);
  
  const monthlyAchievementRate = monthlyGoal > 0 ? ((currentMonthlySales / monthlyGoal) * 100).toFixed(1) : "0.0";
  const annualAchievementRate = annualGoal > 0 ? ((currentAnnualSales / annualGoal) * 100).toFixed(1) : "0.0";
  
  const unreadCount = notifications.filter((n) => !n.read).length;
  const maxSalesInYear = Math.max(...monthlySalesMap, monthlyGoal, 1);

  // 🔥 데이터가 로딩되는 동안에는 로딩 화면 렌더링
  if (isLoadingData) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${isDarkMode ? "bg-gray-900 text-white" : "bg-[#F8F9FA] text-gray-900"}`}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-blue-600" size={48} />
          <p className="font-bold text-sm text-gray-500">데이터를 동기화 중입니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen ${isDarkMode ? "bg-gray-900 text-white" : "bg-[#F8F9FA] text-gray-900"} transition-colors duration-200`}>
      {/* 1. 사이드바 */}
      <aside className={`w-64 border-r flex flex-col justify-between p-6 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
        <div>
          <div
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 mb-10 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <span className="text-3xl font-black text-red-600">*</span>
            <span className="text-xl font-black text-red-600 tracking-tight">PLACE PARTNER</span>
          </div>

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

        {/* 사이드바 하단 (알림창 팝업 외부 클릭 적용) */}
        <div className="space-y-4 relative" ref={notificationRef}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2.5 rounded-full transition-all ${isDarkMode ? "bg-gray-700 text-yellow-400" : "bg-gray-100 text-gray-600"}`}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className={`relative p-2.5 rounded-full transition-all ${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-600"}`}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>

            <a
              href="https://cafe.naver.com/bluebottlefollower"
              target="_blank"
              rel="noopener noreferrer"
              className={`p-2.5 rounded-full transition-all flex items-center justify-center ${isDarkMode ? "bg-gray-700 text-green-400" : "bg-green-50 text-[#03C75A]"}`}
            >
              <svg className="w-[18px] h-[18px] fill-current" viewBox="0 0 24 24">
                <path d="M16.273 12.845L7.376 0H0v24h7.727v-12.845L16.624 24H24V0h-7.727v12.845z" />
              </svg>
            </a>

            <a
              href="https://www.adplanters.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={`p-2.5 rounded-full transition-all ${isDarkMode ? "bg-gray-700 text-blue-400" : "bg-blue-50 text-blue-600"}`}
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
                {notifications.length === 0 ? (
                  <div className="text-xs text-gray-400 text-center py-4">새로운 알림이 없습니다.</div>
                ) : (
                  notifications.map((n) => (
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
                  ))
                )}
              </div>
            </div>
          )}

          {/* 프로필 및 로그아웃 */}
          <div className={`flex items-center justify-between p-3 rounded-2xl border ${isDarkMode ? "bg-gray-700/50 border-gray-700" : "bg-gray-50 border-gray-100"}`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">
                {userName.charAt(0)}
              </div>
              <div>
                <div className="text-xs font-bold">{userName}</div>
                <div className="text-[10px] text-gray-400">{userTeam}</div>
              </div>
            </div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. 메인 콘텐츠 영역 */}
      <main className="flex-1 p-8 overflow-y-auto">
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

          <div className="flex items-center gap-3 relative" ref={monthPickerRef}>
            <button
              onClick={() => setIsGoalModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-sm transition-all"
            >
              <Settings size={16} /> 목표 설정 변경
            </button>

            {/* 활성화된 연/월 선택 컨트롤러 */}
            <div className={`flex items-center gap-1 px-3 py-2 rounded-xl border text-sm font-bold ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
                className="px-2 hover:text-blue-600 transition-colors"
              >
                {`${selectedYear}년 ${selectedMonth}월`}
              </button>
              <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <ChevronRight size={16} />
              </button>
            </div>

            {/* 1월 ~ 12월 선택 드롭다운 팝업 */}
            {isMonthPickerOpen && (
              <div className={`absolute top-12 right-0 w-64 p-4 rounded-2xl border shadow-xl z-50 grid grid-cols-3 gap-2 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setSelectedMonth(m);
                      setIsMonthPickerOpen(false);
                    }}
                    className={`py-2 rounded-xl font-bold text-xs transition-all ${
                      selectedMonth === m
                        ? "bg-blue-600 text-white"
                        : isDarkMode
                        ? "hover:bg-gray-700 text-gray-300"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    {m}월
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 상단 현황 카드 2개 */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className={`p-6 rounded-2xl border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"} shadow-sm`}>
            <div className="text-xs font-bold text-gray-400 mb-2">연간 {selectedYear}년 누적</div>
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

          <div className={`p-6 rounded-2xl border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"} shadow-sm`}>
            <div className="text-xs font-bold text-gray-400 mb-2">당월 {selectedMonth}월 현황</div>
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

        {/* 매출 추이 그래프 */}
        <div className={`p-6 rounded-2xl border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"} shadow-sm`}>
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-sm">계약 총 매출 추이 (MONTHLY) - {selectedYear}년</h3>
            <span className="text-xs text-gray-400">* DB 계약 시작월 기준 실시간 집계</span>
          </div>

          <div className="flex items-end justify-between h-48 pt-8 px-4">
            {["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"].map((m, idx) => {
              const sales = monthlySalesMap[idx] || 0;
              const isSelected = idx === selectedMonth - 1;
              const heightPercent = sales > 0 ? Math.max(20, Math.min(100, (sales / maxSalesInYear) * 100)) : 8;

              return (
                <div key={m} className="flex flex-col items-center gap-3 group relative">
                  {sales > 0 && (
                    <div className="absolute -top-7 text-[10px] font-bold bg-gray-900 text-white px-2 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      ₩{sales.toLocaleString()}
                    </div>
                  )}
                  <div
                    className={`w-8 rounded-full transition-all duration-300 ${
                      isSelected ? "bg-blue-600 shadow-md" : sales > 0 ? "bg-blue-400" : isDarkMode ? "bg-gray-700" : "bg-gray-100"
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className={`text-xs font-bold ${isSelected ? "text-blue-600" : "text-gray-400"}`}>{m}</span>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* 목표 설정 모달 */}
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