"use client";

import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar"; // 🌟 공통 사이드바 연동
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { FileText, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";

interface ContractItem {
  id: string;
  startDate: string;
  endDate: string;
  type: string; // 인바운드 / 아웃바운드
  manager: string;
  status: string; // 결제완료 등
  clientName: string;
  productName: string;
  amount: number;
  paymentMethod: string;
  taxInvoice: string;
  note: string;
}

export default function ContractsPage() {
  const monthPickerRef = useRef<HTMLDivElement>(null);

  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(8);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [contracts, setContracts] = useState<ContractItem[]>([]);

  // 외부 클릭 시 월 선택 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (monthPickerRef.current && !monthPickerRef.current.contains(event.target as Node)) {
        setIsMonthPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Firestore DB에서 계약 목록 불러오기
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const querySnapshot = await getDocs(collection(db, "contracts"));
          const list: ContractItem[] = [];
          querySnapshot.forEach((docSnap) => {
            const d = docSnap.data();
            list.push({
              id: docSnap.id,
              startDate: d.startDate || d.contractStartDate || "2026-07-24",
              endDate: d.endDate || d.contractEndDate || "2027-08-23",
              type: d.type || "인바운드",
              manager: d.manager || "매니저 1",
              status: d.status || "결제완료",
              clientName: d.clientName || d.companyName || "테스트",
              productName: d.productName || "플레이스파트너",
              amount: Number(d.amount || d.contractAmount || 200000),
              paymentMethod: d.paymentMethod || "현금",
              taxInvoice: d.taxInvoice || "미발행",
              note: d.note || "숨고인입",
            });
          });
          setContracts(list);
        } catch (error) {
          console.error("계약 데이터를 불러오는 중 에러 발생:", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // 이전 월 이동
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear((prev) => prev - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  // 다음 월 이동
  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear((prev) => prev + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  // 검색 및 날짜 필터링
  const filteredContracts = contracts.filter((item) => {
    const matchesSearch =
      item.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.manager.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] text-gray-900">
      {/* 🌟 공통 사이드바 장착 (로고 클릭 및 네이버N, 지구본 아이콘 연동) */}
      <Sidebar currentMenu="contracts" />

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* 상단 헤더 및 연월 선택 컨트롤러 */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black flex items-center gap-2">
                <FileText className="text-blue-600" size={24} /> 계약 관리
              </h1>

              {/* 월 선택 피커 */}
              <div className="relative" ref={monthPickerRef}>
                <div className="flex items-center gap-1 bg-white border border-gray-200 px-3 py-1.5 rounded-xl font-bold text-sm shadow-sm">
                  <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-lg">
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
                    className="px-2 hover:text-blue-600 transition-colors"
                  >
                    {`${currentYear % 100}년 ${currentMonth}월`}
                  </button>
                  <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-lg">
                    <ChevronRight size={16} />
                  </button>
                </div>

                {isMonthPickerOpen && (
                  <div className="absolute top-10 left-0 w-60 p-3 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 grid grid-cols-3 gap-2">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <button
                        key={m}
                        onClick={() => {
                          setCurrentMonth(m);
                          setIsMonthPickerOpen(false);
                        }}
                        className={`py-2 rounded-xl font-bold text-xs transition-all ${
                          currentMonth === m ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-700"
                        }`}
                      >
                        {m}월
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => alert("신규 계약 등록 모달 연동 가능")}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all"
            >
              <Plus size={16} /> 신규 계약
            </button>
          </div>

          {/* 상단 요약 카드 및 검색바 */}
          <div className="flex items-center justify-between p-4 mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="text-sm font-bold text-gray-700">
              현재 등록된 DB 데이터 수: <span className="text-blue-600">{filteredContracts.length}건</span>
            </div>

            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="고객사명 또는 담당자 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs font-bold outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* 계약 목록 데이터 테이블 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-100">
                <tr>
                  <th className="p-4">계약기간(시작~종료)</th>
                  <th className="p-4">유형</th>
                  <th className="p-4">담당자</th>
                  <th className="p-4">상태</th>
                  <th className="p-4">고객사(업체명)</th>
                  <th className="p-4">판매 상품</th>
                  <th className="p-4">계약 금액</th>
                  <th className="p-4">결제수단</th>
                  <th className="p-4">세금계산서</th>
                  <th className="p-4">특이사항</th>
                  <th className="p-4 text-center">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredContracts.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-12 text-center text-gray-400 font-bold">
                      등록된 계약 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredContracts.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-all">
                      <td className="p-4 text-gray-500">{`${item.startDate} ~ ${item.endDate}`}</td>
                      <td className="p-4">
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-[11px] font-bold">
                          {item.type}
                        </span>
                      </td>
                      <td className="p-4">{item.manager}</td>
                      <td className="p-4">
                        <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md text-[11px] font-bold">
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-gray-900">{item.clientName}</td>
                      <td className="p-4 text-blue-600 font-bold">{item.productName}</td>
                      <td className="p-4 font-black text-gray-900">₩ {item.amount.toLocaleString()}</td>
                      <td className="p-4">{item.paymentMethod}</td>
                      <td className="p-4">{item.taxInvoice}</td>
                      <td className="p-4 text-gray-400">{item.note}</td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => alert(`'${item.clientName}' 계약 수정`)}
                          className="text-gray-400 hover:text-blue-600 font-bold underline"
                        >
                          수정
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}