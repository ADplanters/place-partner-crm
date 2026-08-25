"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar"; // 🌟 여기서 공통 사이드바를 불러오고 있습니다.
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { Settings, ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const monthPickerRef = useRef<HTMLDivElement>(null);

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(8);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

  const [isDarkMode] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  const [monthlyGoal, setMonthlyGoal] = useState(0);
  const [annualGoal, setAnnualGoal] = useState(0);
  const [monthlySalesMap, setMonthlySalesMap] = useState<number[]>(Array(12).fill(0));

  const [tempMonthlyGoal, setTempMonthlyGoal] = useState(0);
  const [tempAnnualGoal, setTempAnnualGoal] = useState(0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (monthPickerRef.current && !monthPickerRef.current.contains(event.target as Node)) {
        setIsMonthPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          if (!isNaN(contractDate.getTime()) && contractDate.getFullYear() === year) {
            salesArray[contractDate.getMonth()] += amount;
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
          setMonthlyGoal(10000000);
          setAnnualGoal(120000000);
          setTempMonthlyGoal(10000000);
          setTempAnnualGoal(120000000);
        }

        await fetchDashboardData(selectedYear);
        setIsLoadingData(false);
      } else {
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

  const currentMonthlySales = monthlySalesMap[selectedMonth - 1] || 0;
  const currentAnnualSales = monthlySalesMap.reduce((acc, curr) => acc + curr, 0);
  const remainingSales = Math.max(0, monthlyGoal - currentMonthlySales);

  const monthlyAchievementRate = monthlyGoal > 0 ? ((currentMonthlySales / monthlyGoal) * 100).toFixed(1) : "0.0";
  const annualAchievementRate = annualGoal > 0 ? ((currentAnnualSales / annualGoal) * 100).toFixed(1) : "0.0";
  const maxSalesInYear = Math.max(...monthlySalesMap, monthlyGoal, 1);

  if (isLoadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] text-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-blue-600" size={48} />
          <p className="font-bold text-sm text-gray-500">데이터를 동기화 중입니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] text-gray-900">
      {/* 🌟 공통 사이드바 사용 */}
      <Sidebar currentMenu="dashboard" />

      {/* 메인 콘텐츠 영역 */}
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

            <div className="flex items-center gap-1 px-3 py-2 rounded-xl border text-sm font-bold bg-white border-gray-200">
              <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-lg">
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
                className="px-2 hover:text-blue-600 transition-colors"
              >
                {`${selectedYear}년 ${selectedMonth}월`}
              </button>
              <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-lg">
                <ChevronRight size={16} />
              </button>
            </div>

            {isMonthPickerOpen && (
              <div className="absolute top-12 right-0 w-64 p-4 rounded-2xl border shadow-xl z-50 grid grid-cols-3 gap-2 bg-white border-gray-100">
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

        {/* 카드 및 그래프 구역 */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-6 rounded-2xl border bg-white border-gray-100 shadow-sm">
            <div className="text-xs font-bold text-gray-400 mb-2">연간 {selectedYear}년 누적</div>
            <div className="text-3xl font-black mb-4">
              {annualAchievementRate} <span className="text-base font-normal text-gray-400">% 달성</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-3">
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

          <div className="p-6 rounded-2xl border bg-white border-gray-100 shadow-sm">
            <div className="text-xs font-bold text-gray-400 mb-2">당월 {selectedMonth}월 현황</div>
            <div className="text-3xl font-black mb-4">
              {monthlyAchievementRate} <span className="text-base font-normal text-gray-400">% 달성</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-3">
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

        <div className="p-6 rounded-2xl border bg-white border-gray-100 shadow-sm">
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
                      isSelected ? "bg-blue-600 shadow-md" : sales > 0 ? "bg-blue-400" : "bg-gray-100"
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
          <div className="w-full max-w-md p-6 rounded-3xl border shadow-2xl bg-white border-gray-100 text-gray-900">
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
                  className="w-full px-4 py-3 rounded-xl border text-sm font-bold outline-none focus:border-blue-600 bg-gray-50 border-gray-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">연간 목표 금액 (원)</label>
                <input
                  type="number"
                  value={tempAnnualGoal}
                  onChange={(e) => setTempAnnualGoal(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border text-sm font-bold outline-none focus:border-blue-600 bg-gray-50 border-gray-200"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsGoalModalOpen(false)}
                className="flex-1 py-3 rounded-xl font-bold text-sm bg-gray-100 text-gray-600"
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