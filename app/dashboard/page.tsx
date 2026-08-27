"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import {
  LayoutDashboard,
  Target,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
} from "lucide-react";

interface ContractItem {
  id: string;
  startDate: string;
  amount: number;
}

// 1월~12월 기본 목표 (단위: 원)
const DEFAULT_MONTHLY_TARGETS: Record<number, number> = {
  1: 10000000,
  2: 10000000,
  3: 10000000,
  4: 10000000,
  5: 10000000,
  6: 10000000,
  7: 10000000,
  8: 10000000,
  9: 10000000,
  10: 10000000,
  11: 10000000,
  12: 10000000,
};

export default function DashboardPage() {
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(6); // 기본 6월
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  
  // 🌟 월별 목표 금액 데이터 (키: 월(1~12), 값: 목표 금액)
  const [monthlyTargets, setMonthlyTargets] = useState<Record<number, number>>(DEFAULT_MONTHLY_TARGETS);
  
  // 목표 설정 모달 상태
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [tempTargets, setTempTargets] = useState<Record<number, number>>(DEFAULT_MONTHLY_TARGETS);

  // 1. 파이어베이스 데이터 불러오기
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        fetchContracts();
        fetchTargets();
      }
    });
    return () => unsubscribe();
  }, [currentYear]);

  // 계약 DB 로드
  const fetchContracts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "contracts"));
      const list: ContractItem[] = [];
      querySnapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: docSnap.id,
          startDate: d.startDate || "2026-01-01",
          amount: Number(d.amount || 0),
        });
      });
      setContracts(list);
    } catch (error) {
      console.error("계약 데이터 로드 실패:", error);
    }
  };

  // 🌟 월별 목표 DB 로드
  const fetchTargets = async () => {
    try {
      const targetDocRef = doc(db, "settings", `targets_${currentYear}`);
      const targetSnap = await getDoc(targetDocRef);
      if (targetSnap.exists()) {
        const data = targetSnap.data().monthlyTargets;
        if (data) {
          setMonthlyTargets(data);
          setTempTargets(data);
        }
      }
    } catch (error) {
      console.error("목표 데이터 로드 실패:", error);
    }
  };

  // 🌟 월별 목표 DB 저장
  const handleSaveTargets = async () => {
    try {
      const targetDocRef = doc(db, "settings", `targets_${currentYear}`);
      await setDoc(targetDocRef, { monthlyTargets: tempTargets }, { merge: true });
      setMonthlyTargets(tempTargets);
      setIsTargetModalOpen(false);
      alert(`${currentYear}년 월별 목표 금액이 수정되었습니다.`);
    } catch (error) {
      console.error("목표 저장 실패:", error);
      alert("목표 저장 중 오류가 발생했습니다.");
    }
  };

  // 2. 매출 및 목표 계산 로직
  // 월별 실제 매출 집계 (1월~12월)
  const monthlySales: Record<number, number> = {};
  for (let m = 1; m <= 12; m++) monthlySales[m] = 0;

  contracts.forEach((c) => {
    if (c.startDate) {
      const [yearStr, monthStr] = c.startDate.split("-");
      if (Number(yearStr) === currentYear) {
        const m = Number(monthStr);
        if (m >= 1 && m <= 12) {
          monthlySales[m] += c.amount;
        }
      }
    }
  });

  // 당월 매출 & 당월 목표
  const currentMonthSales = monthlySales[currentMonth] || 0;
  const currentMonthTarget = monthlyTargets[currentMonth] || 0;
  const currentMonthRate = currentMonthTarget > 0 ? (currentMonthSales / currentMonthTarget) * 100 : 0;
  const remainingMonthAmount = currentMonthTarget - currentMonthSales;

  // 🌟 연간 누적 매출 & 연간 누적 목표 (1~12월 전체 합산)
  const annualSales = Object.values(monthlySales).reduce((acc, val) => acc + val, 0);
  const annualTarget = Object.values(monthlyTargets).reduce((acc, val) => acc + val, 0);
  const annualRate = annualTarget > 0 ? (annualSales / annualTarget) * 100 : 0;

  // 이전/다음 월 이동
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
        <div className="max-w-[1300px] mx-auto">
          {/* 상단 타이틀 & 월 선택 바 */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-black flex items-center gap-2">
              <LayoutDashboard className="text-blue-600" size={24} /> 대시보드
            </h1>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setTempTargets(monthlyTargets);
                  setIsTargetModalOpen(true);
                }}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm"
              >
                <Target size={15} /> 목표 설정 변경
              </button>

              <div className="flex items-center gap-1 bg-white border border-gray-200 px-3 py-1.5 rounded-xl font-bold text-xs shadow-sm">
                <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-lg">
                  <ChevronLeft size={16} />
                </button>
                <span className="px-2 font-extrabold text-gray-800">
                  {currentYear}년 {currentMonth}월
                </span>
                <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-lg">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* 목표 설정 안내 상단 배너 */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 flex items-center gap-2">
            <span className="text-base">🎯</span>
            <span className="text-xs font-bold text-gray-700">
              목표 설정 안내: 이번 달, 매출 목표까지{" "}
              <span className="text-blue-600 font-extrabold">
                {remainingMonthAmount > 0
                  ? `₩ ${remainingMonthAmount.toLocaleString()} 남았어요`
                  : "목표를 달성했습니다! 🎉"}
              </span>{" "}
              💪
            </span>
          </div>

          {/* 연간 / 당월 현황 카드 */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* 1. 연간 누적 현황 카드 */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="text-xs font-bold text-gray-400 mb-2">
                연간 {currentYear}년 누적 (1~12월 합산)
              </div>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-black text-gray-900">
                  {annualRate.toFixed(1)}%
                </span>
                <span className="text-xs font-bold text-gray-400">달성</span>
              </div>

              {/* 진행바 */}
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(annualRate, 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-gray-500">
                  달성 ₩ {annualSales.toLocaleString()}
                </span>
                <span className="text-gray-400">
                  목표 ₩ {annualTarget.toLocaleString()}
                </span>
              </div>
            </div>

            {/* 2. 당월 현황 카드 */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="text-xs font-bold text-gray-400 mb-2">
                당월 {currentMonth}월 현황
              </div>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-black text-gray-900">
                  {currentMonthRate.toFixed(1)}%
                </span>
                <span className="text-xs font-bold text-gray-400">달성</span>
              </div>

              {/* 진행바 */}
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(currentMonthRate, 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-gray-500">
                  달성 ₩ {currentMonthSales.toLocaleString()}
                </span>
                <span className="text-gray-400">
                  목표 ₩ {currentMonthTarget.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* 월별 매출 추이 그래프 카드 (1월~12월) */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-blue-600" />
                <h3 className="text-sm font-black text-gray-900">
                  계약 총 매출 추이 (MONTHLY) - {currentYear}년
                </h3>
              </div>
              <div className="text-[11px] font-bold text-gray-400">
                * 각 월별 설정된 목표 실시간 반영
              </div>
            </div>

            {/* 12개월 바 차트 */}
            <div className="grid grid-cols-12 gap-3 h-64 items-end pt-8 pb-2 px-2 border-b border-gray-100">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                const sales = monthlySales[m] || 0;
                const target = monthlyTargets[m] || 1;
                const heightPercent = Math.min((sales / target) * 100, 100);
                const isSelected = m === currentMonth;

                return (
                  <div key={m} className="flex flex-col items-center h-full justify-end group relative">
                    {/* 호버/선택 시 금액 말풍선 */}
                    {sales > 0 && (
                      <div className="absolute -top-7 bg-gray-900 text-white text-[10px] font-black px-2 py-0.5 rounded-md whitespace-nowrap shadow-md z-10">
                        ₩{(sales / 10000).toLocaleString()}만
                      </div>
                    )}

                    {/* 막대 바 */}
                    <div className="w-full max-w-[32px] bg-gray-100 rounded-xl h-full flex items-end overflow-hidden p-0.5">
                      <div
                        className={`w-full rounded-lg transition-all duration-300 ${
                          isSelected ? "bg-blue-600" : "bg-blue-300 group-hover:bg-blue-500"
                        }`}
                        style={{ height: `${heightPercent || 4}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X축 (월 레이블) */}
            <div className="grid grid-cols-12 gap-3 text-center mt-3 text-xs font-bold text-gray-400">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <div
                  key={m}
                  onClick={() => setCurrentMonth(m)}
                  className={`cursor-pointer transition-all hover:text-blue-600 ${
                    m === currentMonth ? "text-blue-600 font-extrabold scale-110" : ""
                  }`}
                >
                  {m}월
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* 🌟 월별 목표 설정 변경 모달 */}
      {isTargetModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-xl bg-white rounded-3xl border border-gray-100 shadow-2xl p-6 text-gray-900 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-black flex items-center gap-2">
                  <Target className="text-blue-600" size={20} /> {currentYear}년 월별 목표 금액 설정
                </h2>
                <p className="text-xs text-gray-400 font-bold mt-1">
                  각 월별 목표를 설정하면 연간 누적 목표가 자동으로 합산됩니다.
                </p>
              </div>
              <button onClick={() => setIsTargetModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={20} />
              </button>
            </div>

            {/* 1월 ~ 12월 입력 그리드 */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <div key={m} className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    {m}월 목표 금액 (원)
                  </label>
                  <input
                    type="number"
                    step={100000}
                    value={tempTargets[m] || 0}
                    onChange={(e) =>
                      setTempTargets({
                        ...tempTargets,
                        [m]: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold bg-white outline-none focus:border-blue-600"
                  />
                </div>
              ))}
            </div>

            {/* 연간 목표 자동 합산 표시 */}
            <div className="bg-blue-50 p-4 rounded-2xl mb-6 flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900">연간 총 목표 금액 (합계):</span>
              <span className="text-base font-black text-blue-600">
                ₩ {Object.values(tempTargets).reduce((a, b) => a + b, 0).toLocaleString()}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsTargetModalOpen(false)}
                className="flex-1 py-3 rounded-xl font-bold text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveTargets}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1"
              >
                <Save size={15} /> 저장하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}