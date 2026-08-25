"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { LayoutDashboard, ChevronLeft, ChevronRight, Settings, TrendingUp } from "lucide-react";

interface ContractItem {
  id: string;
  startDate: string;
  amount: number;
  status: string;
}

export default function DashboardPage() {
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(8);
  const [contracts, setContracts] = useState<ContractItem[]>([]);

  // 목표 금액 설정 (기본값)
  const [yearlyTarget, setYearlyTarget] = useState(100000000); // 1억원
  const [monthlyTarget, setMonthlyTarget] = useState(500000); // 50만원

  // DB에서 계약 목록 불러오기
  const fetchContracts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "contracts"));
      const list: ContractItem[] = [];
      querySnapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: docSnap.id,
          startDate: d.startDate || d.contractStartDate || "",
          amount: Number(d.amount || d.contractAmount || 0),
          status: d.status || "결제완료",
        });
      });
      setContracts(list);
    } catch (error) {
      console.error("계약 데이터 불러오기 에러:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) fetchContracts();
    });
    return () => unsubscribe();
  }, []);

  // 1월 ~ 12월 월별 매출 실시간 집계
  const monthlyRevenues = Array.from({ length: 12 }, (_, i) => {
    const monthNum = i + 1;
    return contracts.reduce((acc, item) => {
      if (!item.startDate) return acc;
      const dateParts = item.startDate.split("-");
      if (dateParts.length >= 2) {
        const y = Number(dateParts[0]);
        const m = Number(dateParts[1]);
        if (y === currentYear && m === monthNum) {
          return acc + item.amount;
        }
      }
      return acc;
    }, 0);
  });

  // 연간 총 누적 매출
  const yearlyTotal = monthlyRevenues.reduce((a, b) => a + b, 0);

  // 선택된 당월 매출
  const currentMonthRevenue = monthlyRevenues[currentMonth - 1] || 0;

  // 🎯 그래프 높이 스케일링을 위한 최고 매출액 계산 (최소 3,000,000원)
  const maxRevenue = Math.max(...monthlyRevenues, 3000000);

  // 달성률 계산
  const yearlyProgress = Math.min((yearlyTotal / yearlyTarget) * 100, 100).toFixed(1);
  const monthlyProgress = Math.min((currentMonthRevenue / monthlyTarget) * 100, 100).toFixed(1);
  const remainingMonthly = Math.max(monthlyTarget - currentMonthRevenue, 0);

  // 연월 이동 컨트롤러
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear((prev) => prev - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear((prev) => prev + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] text-gray-900">
      <Sidebar currentMenu="dashboard" />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto space-y-6">
          
          {/* 상단 메인 헤더 & 연월 선택 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black flex items-center gap-2">
                <LayoutDashboard className="text-blue-600" size={24} /> 대시보드
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const newTarget = prompt("당월 목표 금액을 입력하세요 (원):", String(monthlyTarget));
                  if (newTarget && !isNaN(Number(newTarget))) {
                    setMonthlyTarget(Number(newTarget));
                  }
                }}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                <Settings size={14} /> 목표 설정 변경
              </button>

              <div className="flex items-center gap-1 bg-white border border-gray-200 px-3 py-1.5 rounded-xl font-bold text-sm shadow-sm">
                <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-lg">
                  <ChevronLeft size={16} />
                </button>
                <span className="px-2">{`${currentYear}년 ${currentMonth}월`}</span>
                <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-lg">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* 목표 안내 메시지 */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-2 text-sm font-bold">
            <span className="text-lg">🎯</span>
            <span className="text-gray-500">목표 설정 안내:</span>
            <span>
              이번 달, 매출 목표까지{" "}
              <span className="text-blue-600 font-black">
                {remainingMonthly.toLocaleString()}원
              </span>{" "}
              남았어요 💪
            </span>
          </div>

          {/* 연간 & 당월 목표 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 연간 누적 */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="text-xs font-bold text-gray-400">연간 {currentYear}년 누적</div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-gray-900">{yearlyProgress}%</span>
                <span className="text-xs font-bold text-gray-500">달성</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${yearlyProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs font-bold text-gray-400 pt-1">
                <span>달성 ₩ {yearlyTotal.toLocaleString()}</span>
                <span>목표 ₩ {yearlyTarget.toLocaleString()}</span>
              </div>
            </div>

            {/* 당월 현황 */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="text-xs font-bold text-gray-400">당월 {currentMonth}월 현황</div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-gray-900">{monthlyProgress}%</span>
                <span className="text-xs font-bold text-gray-500">달성</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${monthlyProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs font-bold text-gray-400 pt-1">
                <span>달성 ₩ {currentMonthRevenue.toLocaleString()}</span>
                <span>목표 ₩ {monthlyTarget.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* 🌟 계약 총 매출 추이 (MONTHLY) 막대 그래프 영역 */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp size={16} className="text-blue-600" />
                계약 총 매출 추이 (MONTHLY) - {currentYear}년
              </h2>
              <span className="text-[11px] font-bold text-gray-400">
                * DB 계약 시작일 기준 실시간 집계
              </span>
            </div>

            {/* 막대 그래프 컨테이너 */}
            <div className="pt-12 pb-4 px-2">
              <div className="h-64 flex items-end justify-between gap-3 border-b border-gray-100 pb-2">
                {monthlyRevenues.map((amount, idx) => {
                  const monthNum = idx + 1;
                  const isCurrentSelected = monthNum === currentMonth;
                  
                  // 🎯 매출액 기준 높이 비율 계산 (매출이 있으면 최소 12% 높이 보장)
                  const heightPercent = amount > 0 ? Math.max((amount / maxRevenue) * 100, 12) : 0;

                  return (
                    <div
                      key={monthNum}
                      className="flex-1 flex flex-col items-center h-full justify-end relative group"
                    >
                      {/* 금액 뱃지 */}
                      {amount > 0 && (
                        <div className="mb-2 px-2.5 py-1 bg-gray-900 text-white text-[10px] font-black rounded-xl shadow-lg whitespace-nowrap animate-bounce">
                          ₩{amount.toLocaleString()}
                        </div>
                      )}

                      {/* 🎯 막대 바 (보이도록 높이 및 배경 트랙 적용) */}
                      <div className="w-full max-w-[40px] bg-gray-50 rounded-t-2xl h-full flex items-end overflow-hidden p-1">
                        <div
                          className={`w-full rounded-t-xl transition-all duration-700 ease-out ${
                            amount > 0
                              ? isCurrentSelected
                                ? "bg-gradient-to-t from-blue-600 to-indigo-500 shadow-md"
                                : "bg-blue-500 hover:bg-blue-600"
                              : "bg-transparent"
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>

                      {/* X축 월 표시 */}
                      <span
                        className={`text-xs font-bold mt-3 transition-all ${
                          isCurrentSelected
                            ? "text-blue-600 font-black scale-110"
                            : "text-gray-400"
                        }`}
                      >
                        {monthNum}월
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}