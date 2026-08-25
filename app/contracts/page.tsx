"use client";

import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import {
  FileText,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  MinusCircle,
  Save,
  X,
} from "lucide-react";

interface ContractItem {
  id: string;
  startDate: string;
  endDate: string;
  type: string;
  manager: string;
  status: string;
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
  const [currentMonth, setCurrentMonth] = useState<number | "all">("all");
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [contracts, setContracts] = useState<ContractItem[]>([]);

  // 수정 모드 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ContractItem>>({});

  // 외부 클릭 시 월 선택 팝업 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (monthPickerRef.current && !monthPickerRef.current.contains(event.target as Node)) {
        setIsMonthPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // DB에서 계약 목록 불러오기
  const fetchContracts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "contracts"));
      const list: ContractItem[] = [];
      querySnapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: docSnap.id,
          startDate: d.startDate || d.contractStartDate || "2026-08-25",
          endDate: d.endDate || d.contractEndDate || "2027-08-24",
          type: d.type || "인바운드",
          manager: d.manager || "매니저 1",
          status: d.status || "결제완료",
          clientName: d.clientName || d.companyName || "고객사",
          productName: d.productName || "스마트플레이스",
          amount: Number(d.amount || d.contractAmount || 0),
          paymentMethod: d.paymentMethod || "현금",
          taxInvoice: d.taxInvoice || "미발행",
          note: d.note || "",
        });
      });
      setContracts(list);
    } catch (error) {
      console.error("계약 데이터 불러오기 실패:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) fetchContracts();
    });
    return () => unsubscribe();
  }, []);

  // 수정 모드 시작
  const handleStartEdit = (item: ContractItem) => {
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  // 수정 취소
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  // 수정 저장
  const handleSaveEdit = async (id: string) => {
    try {
      await updateDoc(doc(db, "contracts", id), editForm);
      setContracts(contracts.map((c) => (c.id === id ? ({ ...c, ...editForm } as ContractItem) : c)));
      setEditingId(null);
      alert("계약 정보가 수정되었습니다.");
    } catch (error) {
      console.error("수정 실패:", error);
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  // 삭제 처리
  const handleDeleteContract = async (id: string, clientName: string) => {
    if (!confirm(`'${clientName}' 계약을 정말 삭제하시겠습니까?`)) return;

    try {
      await deleteDoc(doc(db, "contracts", id));
      setContracts(contracts.filter((c) => c.id !== id));
      if (editingId === id) setEditingId(null);
      alert("계약이 삭제되었습니다.");
    } catch (error) {
      console.error("삭제 실패:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  // 🎯 타입 에러(ts2362) 완벽 해결: 숫자 타입 명확화
  const handlePrevMonth = () => {
    if (typeof currentMonth !== "number" || currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((prev) => prev - 1);
    } else {
      const prevVal: number = currentMonth - 1;
      setCurrentMonth(prevVal);
    }
  };

  // 🎯 타입 에러(ts2365) 완벽 해결: 숫자 타입 명확화
  const handleNextMonth = () => {
    if (typeof currentMonth !== "number") {
      setCurrentMonth(1);
    } else if (currentMonth === 12) {
      setCurrentYear((prev) => prev + 1);
      setCurrentMonth(1);
    } else {
      const nextVal: number = currentMonth + 1;
      setCurrentMonth(nextVal);
    }
  };

  // 계약 시작 월 필터링 + 검색 + 내림차순 정렬
  const filteredContracts = contracts
    .filter((item) => {
      const matchesSearch =
        item.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.manager.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;
      if (currentMonth === "all") return true;

      if (!item.startDate) return false;
      const dateParts = item.startDate.split("-");
      if (dateParts.length < 2) return false;

      const contractYear = Number(dateParts[0]);
      const contractMonth = Number(dateParts[1]);

      return contractYear === currentYear && contractMonth === currentMonth;
    })
    .sort((a, b) => (b.startDate || "").localeCompare(a.startDate || ""));

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] text-gray-900">
      <Sidebar currentMenu="contracts" />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-[1500px] mx-auto">
          {/* 상단 헤더 */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black flex items-center gap-2">
                <FileText className="text-blue-600" size={24} /> 계약 관리
              </h1>

              {/* 월 선택 드롭다운 */}
              <div className="relative" ref={monthPickerRef}>
                <div className="flex items-center gap-1 bg-white border border-gray-200 px-3 py-1.5 rounded-xl font-bold text-sm shadow-sm">
                  <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-lg">
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
                    className="px-2 hover:text-blue-600 transition-colors"
                  >
                    {currentMonth === "all" ? "전체 보기" : `${currentYear % 100}년 ${currentMonth}월`}
                  </button>
                  <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-lg">
                    <ChevronRight size={16} />
                  </button>
                </div>

                {isMonthPickerOpen && (
                  <div className="absolute top-10 left-0 w-64 p-3 bg-white border border-gray-100 rounded-2xl shadow-xl z-50">
                    <button
                      onClick={() => {
                        setCurrentMonth("all");
                        setIsMonthPickerOpen(false);
                      }}
                      className={`w-full mb-2 py-1.5 rounded-xl font-bold text-xs transition-all ${
                        currentMonth === "all"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                      }`}
                    >
                      전체 보기
                    </button>

                    <div className="grid grid-cols-3 gap-2">
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

          {/* 서치 & 정보 카운터 */}
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

          {/* 테이블 컨테이너 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 min-w-[1200px]">
              <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-100">
                <tr>
                  <th className="p-3 w-10 text-center"></th>
                  <th className="p-3 w-40">계약기간(시작~종료)</th>
                  <th className="p-3 w-24">유형</th>
                  <th className="p-3 w-24">담당자</th>
                  <th className="p-3 w-28">상태</th>
                  <th className="p-3 w-32">고객사(업체명)</th>
                  <th className="p-3 w-32">판매 상품</th>
                  <th className="p-3 w-28">계약 금액</th>
                  <th className="p-3 w-20">결제수단</th>
                  <th className="p-3 w-24">세금계산서</th>
                  <th className="p-3 min-w-[100px]">특이사항</th>
                  <th className="p-3 w-28 text-center sticky right-0 bg-gray-50 shadow-l">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredContracts.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-12 text-center text-gray-400 font-bold">
                      선택한 조건에 해당하는 계약 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredContracts.map((item) => {
                    const isEditing = editingId === item.id;

                    return (
                      <tr
                        key={item.id}
                        onDoubleClick={() => !isEditing && handleStartEdit(item)}
                        title={!isEditing ? "더블클릭하여 수정하기" : ""}
                        className={`transition-all ${
                          isEditing ? "bg-blue-50/40" : "hover:bg-gray-50/60 cursor-pointer"
                        }`}
                      >
                        <td className="p-3 text-center">
                          {isEditing && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteContract(item.id, item.clientName);
                              }}
                              className="text-red-500 hover:text-red-700 transition-transform hover:scale-110"
                              title="계약 삭제"
                            >
                              <MinusCircle size={18} strokeWidth={2.2} />
                            </button>
                          )}
                        </td>

                        <td className="p-3 text-gray-500 whitespace-nowrap">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.startDate || ""}
                              onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                              className="w-full px-2 py-1 rounded border border-blue-300 text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          ) : (
                            `${item.startDate} ~ ${item.endDate}`
                          )}
                        </td>

                        <td className="p-3">
                          {isEditing ? (
                            <select
                              value={editForm.type || "인바운드"}
                              onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                              className="w-full px-1.5 py-1 rounded border border-blue-300 text-xs font-bold outline-none"
                            >
                              <option value="인바운드">인바운드</option>
                              <option value="콜">콜</option>
                              <option value="아웃바운드">아웃바운드</option>
                            </select>
                          ) : (
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-[11px] font-bold">
                              {item.type}
                            </span>
                          )}
                        </td>

                        <td className="p-3">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.manager || ""}
                              onChange={(e) => setEditForm({ ...editForm, manager: e.target.value })}
                              className="w-full px-2 py-1 rounded border border-blue-300 text-xs font-bold outline-none"
                            />
                          ) : (
                            item.manager
                          )}
                        </td>

                        <td className="p-3">
                          {isEditing ? (
                            <select
                              value={editForm.status || "결제완료"}
                              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                              className="w-full px-1.5 py-1 rounded border border-blue-300 text-xs font-bold text-blue-600 outline-none"
                            >
                              <option value="결제완료">결제완료</option>
                              <option value="결제대기">결제대기</option>
                              <option value="계약해지">계약해지</option>
                            </select>
                          ) : (
                            <span
                              className={`px-2 py-1 rounded-md text-[11px] font-bold ${
                                item.status === "결제대기" ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
                              }`}
                            >
                              {item.status}
                            </span>
                          )}
                        </td>

                        <td className="p-3 font-bold text-gray-900">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.clientName || ""}
                              onChange={(e) => setEditForm({ ...editForm, clientName: e.target.value })}
                              className="w-full px-2 py-1 rounded border border-blue-300 text-xs font-bold outline-none"
                            />
                          ) : (
                            item.clientName
                          )}
                        </td>

                        <td className="p-3 text-blue-600 font-bold">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.productName || ""}
                              onChange={(e) => setEditForm({ ...editForm, productName: e.target.value })}
                              className="w-full px-2 py-1 rounded border border-blue-300 text-xs font-bold outline-none"
                            />
                          ) : (
                            item.productName
                          )}
                        </td>

                        <td className="p-3 font-black text-gray-900">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editForm.amount || 0}
                              onChange={(e) => setEditForm({ ...editForm, amount: Number(e.target.value) })}
                              className="w-full px-2 py-1 rounded border border-blue-300 text-xs font-bold outline-none"
                            />
                          ) : (
                            `₩ ${item.amount.toLocaleString()}`
                          )}
                        </td>

                        <td className="p-3">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.paymentMethod || ""}
                              onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value })}
                              className="w-full px-2 py-1 rounded border border-blue-300 text-xs font-bold outline-none"
                            />
                          ) : (
                            item.paymentMethod
                          )}
                        </td>

                        <td className="p-3">
                          {isEditing ? (
                            <select
                              value={editForm.taxInvoice || "미발행"}
                              onChange={(e) => setEditForm({ ...editForm, taxInvoice: e.target.value })}
                              className="w-full px-1 py-1 rounded border border-blue-300 text-xs font-bold outline-none"
                            >
                              <option value="발행">발행</option>
                              <option value="미발행">미발행</option>
                            </select>
                          ) : (
                            item.taxInvoice
                          )}
                        </td>

                        <td className="p-3 text-gray-400">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.note || ""}
                              onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                              className="w-full px-2 py-1 rounded border border-blue-300 text-xs font-bold outline-none"
                            />
                          ) : (
                            item.note
                          )}
                        </td>

                        <td className="p-3 text-center whitespace-nowrap sticky right-0 bg-white/90 backdrop-blur-sm">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSaveEdit(item.id);
                                }}
                                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-md text-xs font-bold shadow-sm transition-all"
                              >
                                <Save size={13} /> 저장
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelEdit();
                                }}
                                className="flex items-center gap-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded-md text-xs font-bold transition-all"
                              >
                                <X size={13} /> 취소
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEdit(item);
                              }}
                              className="text-gray-400 hover:text-blue-600 font-bold underline px-2 py-1"
                            >
                              수정
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}