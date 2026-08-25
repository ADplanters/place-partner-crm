"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";

export default function DashboardPage() {
  const [monthlySales, setMonthlySales] = useState(0);
  const [yearlySales, setYearlySales] = useState(0);
  const [chartData, setChartData] = useState<number[]>(Array(12).fill(0));
  const [isLoading, setIsLoading] = useState(true);

  const MONTHLY_TARGET = 10000000; // 월 목표: 1,000만 원
  const YEARLY_TARGET = 120000000; // 연 목표: 1억 2,000만 원

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "contracts"));
        let total = 0;
        const monthlyArr = Array(12).fill(0); // 1월 ~ 12월

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const amount = Number(data.amount?.toString().replace(/[^0-9]/g, "") || 0);
          total += amount;

          // 계약 기간 또는 생성 날짜 기준으로 월별 데이터 분류 (기본 8월 반영)
          let monthIndex = 7; // 기본 8월 (0-index)
          if (data.period && data.period.length >= 7) {
            const parsedMonth = parseInt(data.period.substring(5, 7), 10) - 1;
            if (!isNaN(parsedMonth) && parsedMonth >= 0 && parsedMonth < 12) {
              monthIndex = parsedMonth;
            }
          }
          monthlyArr[monthIndex] += amount;
        });

        setMonthlySales(monthlyArr[7]); // 8월 매출
        setYearlySales(total);
        setChartData(monthlyArr);
      } catch (error) {
        console.error("매출 데이터 불러오기 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalesData();
  }, []);

  const monthlyPercent = Math.min((monthlySales / MONTHLY_TARGET) * 100, 100).toFixed(1);
  const yearlyPercent = Math.min((yearlySales / YEARLY_TARGET) * 100, 100).toFixed(1);
  const remainingTarget = Math.max(MONTHLY_TARGET - monthlySales, 0);

  // 차트 최대값 계산 (기본 최소 1,000만 원 단위 스케일)
  const maxChartValue = Math.max(...chartData, MONTHLY_TARGET);

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <Sidebar />

      <main className="flex-1 p-8 h-screen overflow-y-auto">
        {/* 상단 타이틀 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-1">
              <span>🎯 목표 설정 안내</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isLoading ? (
                "데이터 불러오는 중..."
              ) : remainingTarget > 0 ? (
                <>이번 달, 매출 목표까지 <span className="text-blue-600">{remainingTarget.toLocaleString()}원</span> 남았어요 💪</>
              ) : (
                <>🎉 이번 달 <span className="text-blue-600">매출 목표를 100% 달성</span>했습니다! 👏</>
              )}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm">
              ⚙️ 목표 설정 변경
            </button>
            <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-700 shadow-sm">
              2026년 8월
            </div>
          </div>
        </div>

        {/* 연간 / 당월 현황 카드 */}
        <div className="mb-8 grid grid-cols-2 gap-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex justify-between text-sm font-semibold text-gray-500 mb-2">
              <span>연간 2026년 누적</span>
            </div>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-4xl font-extrabold text-gray-900">{yearlyPercent}</span>
              <span className="text-lg font-bold text-gray-500">% 달성</span>
            </div>
            <div className="h-3 w-full rounded-full bg-gray-100 mb-4 overflow-hidden">
              <div className="h-full rounded-full bg-blue-600 transition-all duration-1000" style={{ width: `${yearlyPercent}%` }} />
            </div>
            <div className="flex justify-between text-sm font-semibold text-gray-600">
              <span>달성 ₩ {yearlySales.toLocaleString()}</span>
              <span>목표 ₩ {YEARLY_TARGET.toLocaleString()}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex justify-between text-sm font-semibold text-gray-500 mb-2">
              <span>당월 8월 현황</span>
            </div>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-4xl font-extrabold text-gray-900">{monthlyPercent}</span>
              <span className="text-lg font-bold text-gray-500">% 달성</span>
            </div>
            <div className="h-3 w-full rounded-full bg-gray-100 mb-4 overflow-hidden">
              <div className="h-full rounded-full bg-blue-600 transition-all duration-1000" style={{ width: `${monthlyPercent}%` }} />
            </div>
            <div className="flex justify-between text-sm font-semibold text-gray-600">
              <span>달성 ₩ {monthlySales.toLocaleString()}</span>
              <span>목표 ₩ {MONTHLY_TARGET.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* 실시간 매출 추이 차트 */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-gray-800">
              계약 총 매출 추이 (MONTHLY) - 2026년
            </h2>
            <span className="text-xs text-gray-400 font-medium">* DB 계약 매출 기준 실시간 집계</span>
          </div>

          <div className="h-64 w-full flex items-end justify-between gap-3 pt-8 pb-2 px-4 border-b border-gray-100">
            {chartData.map((val, idx) => {
              const heightPercent = maxChartValue > 0 ? (val / maxChartValue) * 100 : 0;
              const isCurrentMonth = idx === 7; // 8월 Highlight

              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  {/* 데이터 툴팁 */}
                  {val > 0 && (
                    <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] font-bold py-1 px-2 rounded shadow-md whitespace-nowrap z-10">
                      ₩ {val.toLocaleString()}
                    </div>
                  )}
                  {/* 그래프 바 */}
                  <div
                    className={`w-full max-w-[36px] rounded-t-lg transition-all duration-500 ${
                      isCurrentMonth
                        ? "bg-blue-600 shadow-md shadow-blue-200"
                        : val > 0
                        ? "bg-blue-300 hover:bg-blue-400"
                        : "bg-gray-100"
                    }`}
                    style={{ height: `${Math.max(heightPercent, 4)}%` }}
                  />
                  {/* 월 라벨 */}
                  <span className={`mt-3 text-xs font-bold ${isCurrentMonth ? "text-blue-600" : "text-gray-400"}`}>
                    {idx + 1}월
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}