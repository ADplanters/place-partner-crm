"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { Trophy, Users, Filter, Plus, ChevronLeft, ChevronRight, X, Save, ClipboardPaste } from "lucide-react";
import { db } from "../../firebase"; 
import { collection, addDoc, getDocs, updateDoc, doc, query, orderBy, serverTimestamp, writeBatch } from "firebase/firestore";

// 상태 및 옵션 정의
const STATUS_OPTIONS = ["결제대기", "계약금입금", "결제완료"];
const TYPE_OPTIONS = ["콜", "지인", "인바운드", "기타"];
const MANAGER_OPTIONS = ["매니저 1", "매니저 2", "매니저 3"];
const INVOICE_OPTIONS = ["미발행", "발행"];

// 계약 데이터 타입 정의
interface ContractRecord {
  id: string;
  period: string;
  type: string;
  manager: string;
  status: string;
  company: string;
  product: string;
  amount: string; // 매출액 계산을 위해 단순 문자열 처리 (나중에 콤마 제거 후 숫자로 계산)
  payMethod: string;
  taxInvoice: string;
  note: string;
  isEditing?: boolean;
}

export default function ContractsPage() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  
  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Firebase 데이터 불러오기
  const fetchContracts = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, "contracts"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const data: ContractRecord[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as ContractRecord);
      });
      setContracts(data);
    } catch (error) {
      console.error("계약 불러오기 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  // 2. 단일 빈 계약 행 추가
  const addEmptyContract = async () => {
    try {
      const newContract = {
        period: "2026-08-25 ~ 2027-08-24",
        type: "콜",
        manager: "매니저 1",
        status: "결제대기",
        company: "새 고객사",
        product: "스마트플레이스",
        amount: "1000000", 
        payMethod: "카드",
        taxInvoice: "미발행",
        note: "",
        createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, "contracts"), newContract);
      setContracts([{ id: docRef.id, ...newContract, isEditing: true } as ContractRecord, ...contracts]);
    } catch (error) {
      console.error("계약 추가 실패:", error);
    }
  };

  // 3. 엑셀 대량 등록 (Batch Insert)
  const handleBulkPaste = async () => {
    if (!pasteText.trim()) return;
    const lines = pasteText.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return;

    setIsLoading(true);
    try {
      const batch = writeBatch(db);
      lines.forEach(line => {
        const cols = line.split('\t');
        const docRef = doc(collection(db, "contracts"));
        const newRecord = {
          period: cols[0]?.trim() || "",
          type: cols[1]?.trim() || "콜",
          manager: cols[2]?.trim() || "매니저 1",
          status: cols[3]?.trim() || "결제대기",
          company: cols[4]?.trim() || "",
          product: cols[5]?.trim() || "",
          amount: cols[6]?.trim() || "0",
          payMethod: cols[7]?.trim() || "",
          taxInvoice: cols[8]?.trim() || "미발행",
          note: cols[9]?.trim() || "",
          createdAt: serverTimestamp(),
        };
        batch.set(docRef, newRecord);
      });

      await batch.commit();
      alert(`${lines.length}건의 계약이 등록되었습니다.`);
      setIsPasteModalOpen(false);
      setPasteText("");
      fetchContracts(); 
    } catch (error) {
      console.error("대량 등록 실패:", error);
      alert("대량 등록 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 4. 입력 상태 변경 및 단일 저장
  const handleInputChange = (id: string, field: keyof ContractRecord, value: string) => {
    setContracts(contracts.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const saveContract = async (id: string) => {
    try {
      const rowToSave = contracts.find(row => row.id === id);
      if (!rowToSave) return;
      const { isEditing, id: docId, ...dataToSave } = rowToSave;
      await updateDoc(doc(db, "contracts", id), dataToSave);
      setContracts(contracts.map(row => row.id === id ? { ...row, isEditing: false } : row));
    } catch (error) {
      console.error("저장 실패:", error);
    }
  };

  const inputClassName = "w-full bg-transparent outline-none focus:border-b-2 focus:border-blue-500 py-1";

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <Sidebar />

      <main className="relative flex-1 p-8 h-screen overflow-y-auto">
        {/* 상단 컨트롤 및 액션 버튼 */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 shadow-sm">
            <button className="text-gray-400 hover:text-gray-600"><ChevronLeft className="h-4 w-4" /></button>
            <span className="text-sm font-bold text-gray-800">26년 8월</span>
            <button className="text-gray-400 hover:text-gray-600"><ChevronRight className="h-4 w-4" /></button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setIsPasteModalOpen(true)} className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50">
              <ClipboardPaste className="h-3.5 w-3.5 text-gray-500" /> 엑셀 대량 등록
            </button>
            <button onClick={() => setIsFilterOpen(!isFilterOpen)} className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50">
              <Filter className="h-3.5 w-3.5 text-blue-600" /> 상세 필터
            </button>
            <button onClick={addEmptyContract} className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700">
              <Plus className="h-4 w-4" /> 신규 계약
            </button>
          </div>
        </div>

        {/* ... (기존 대시보드 위젯: 명예의 전당 / 팀별 매출 현황 UI 유지 - 이 부분은 다음 단계에서 DB 데이터로 동적 계산할 예정) ... */}
        {/* 임시로 숨기거나 기존 코드 유지(UI만) - 여기서는 너무 길어지므로 생략하지 않고 간단히 유지 */}
        <div className="mb-4 flex items-center justify-between rounded-xl border border-gray-100 bg-white px-6 py-3 text-xs font-semibold text-gray-600 shadow-sm">
          <div className="flex items-center gap-6">
             <span>현재 등록된 DB 데이터 수: <strong className="text-gray-900">{contracts.length}건</strong></span>
          </div>
        </div>

        {/* 계약 목록 테이블 (CRUD 연동) */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="border-b border-gray-100 bg-gray-50/50 text-gray-500 sticky top-0">
                <tr>
                  <th className="p-3 font-semibold">계약기간(시작~종료)</th>
                  <th className="p-3 font-semibold w-20">유형</th>
                  <th className="p-3 font-semibold w-24">담당자</th>
                  <th className="p-3 font-semibold w-24">상태</th>
                  <th className="p-3 font-semibold">고객사(업체명)</th>
                  <th className="p-3 font-semibold">판매 상품</th>
                  <th className="p-3 font-semibold w-28">계약 금액</th>
                  <th className="p-3 font-semibold w-20">결제수단</th>
                  <th className="p-3 font-semibold w-20">세금계산서</th>
                  <th className="p-3 font-semibold min-w-[150px]">특이사항</th>
                  <th className="p-3 font-semibold w-16 text-center">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {isLoading ? (
                  <tr><td colSpan={11} className="p-8 text-center text-gray-400">데이터를 불러오는 중입니다...</td></tr>
                ) : contracts.length === 0 ? (
                  <tr><td colSpan={11} className="p-8 text-center text-gray-400">등록된 계약이 없습니다.</td></tr>
                ) : (
                  contracts.map((item) => (
                    <tr key={item.id} className={`hover:bg-gray-50/50 ${item.isEditing ? 'bg-blue-50/20' : ''}`}>
                      {/* 계약 기간 */}
                      <td className="p-3 text-gray-500">
                        {item.isEditing ? <input type="text" value={item.period} onChange={(e) => handleInputChange(item.id, 'period', e.target.value)} className={inputClassName} /> : <span onDoubleClick={() => handleInputChange(item.id, 'isEditing', "true")}>{item.period || '-'}</span>}
                      </td>
                      {/* 유형 */}
                      <td className="p-3">
                        {item.isEditing ? (
                          <select value={item.type} onChange={(e) => handleInputChange(item.id, 'type', e.target.value)} className="w-full bg-transparent outline-none">
                            {TYPE_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
                          </select>
                        ) : (<span onDoubleClick={() => handleInputChange(item.id, 'isEditing', "true")} className="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-600">{item.type}</span>)}
                      </td>
                      {/* 담당자 */}
                      <td className="p-3">
                         {item.isEditing ? (
                          <select value={item.manager} onChange={(e) => handleInputChange(item.id, 'manager', e.target.value)} className="w-full bg-transparent outline-none">
                            {MANAGER_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
                          </select>
                        ) : (<span onDoubleClick={() => handleInputChange(item.id, 'isEditing', "true")}>{item.manager}</span>)}
                      </td>
                      {/* 상태 */}
                      <td className="p-3">
                         {item.isEditing ? (
                          <select value={item.status} onChange={(e) => handleInputChange(item.id, 'status', e.target.value)} className="w-full bg-transparent outline-none font-bold text-blue-600">
                            {STATUS_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
                          </select>
                        ) : (
                          <span onDoubleClick={() => handleInputChange(item.id, 'isEditing', "true")} className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold cursor-pointer ${item.status === "결제완료" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                            {item.status}
                          </span>
                        )}
                      </td>
                      {/* 고객사 */}
                      <td className="p-3 font-bold text-gray-800">
                         {item.isEditing ? <input type="text" value={item.company} onChange={(e) => handleInputChange(item.id, 'company', e.target.value)} className={inputClassName} /> : <span onDoubleClick={() => handleInputChange(item.id, 'isEditing', "true")}>{item.company || '-'}</span>}
                      </td>
                      {/* 판매상품 */}
                      <td className="p-3 text-blue-600">
                         {item.isEditing ? <input type="text" value={item.product} onChange={(e) => handleInputChange(item.id, 'product', e.target.value)} className={inputClassName} /> : <span onDoubleClick={() => handleInputChange(item.id, 'isEditing', "true")}>{item.product || '-'}</span>}
                      </td>
                      {/* 계약금액 */}
                      <td className="p-3 font-bold text-gray-900">
                         {item.isEditing ? <input type="text" value={item.amount} onChange={(e) => handleInputChange(item.id, 'amount', e.target.value)} className={inputClassName} placeholder="숫자만 입력 (예: 2244000)"/> : <span onDoubleClick={() => handleInputChange(item.id, 'isEditing', "true")}>₩ {Number(item.amount.replace(/[^0-9]/g, '')).toLocaleString()}</span>}
                      </td>
                      {/* 결제수단 */}
                      <td className="p-3 text-gray-600">
                         {item.isEditing ? <input type="text" value={item.payMethod} onChange={(e) => handleInputChange(item.id, 'payMethod', e.target.value)} className={inputClassName} /> : <span onDoubleClick={() => handleInputChange(item.id, 'isEditing', "true")}>{item.payMethod || '-'}</span>}
                      </td>
                      {/* 세금계산서 */}
                      <td className="p-3 text-gray-600">
                        {item.isEditing ? (
                          <select value={item.taxInvoice} onChange={(e) => handleInputChange(item.id, 'taxInvoice', e.target.value)} className="w-full bg-transparent outline-none">
                            {INVOICE_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
                          </select>
                        ) : (<span onDoubleClick={() => handleInputChange(item.id, 'isEditing', "true")}>{item.taxInvoice}</span>)}
                      </td>
                      {/* 특이사항 */}
                      <td className="p-3 text-gray-500">
                         {item.isEditing ? <input type="text" value={item.note} onChange={(e) => handleInputChange(item.id, 'note', e.target.value)} className={inputClassName} /> : <span onDoubleClick={() => handleInputChange(item.id, 'isEditing', "true")}>{item.note || '-'}</span>}
                      </td>
                      {/* 액션 (저장/수정 버튼) */}
                      <td className="p-3 text-center">
                        {item.isEditing ? (
                           <button onClick={() => saveContract(item.id)} className="text-white bg-blue-500 rounded px-2 py-1 flex items-center gap-1 hover:bg-blue-600"><Save className="w-3 h-3"/> 저장</button>
                        ) : (
                           <button onClick={() => handleInputChange(item.id, 'isEditing', "true")} className="text-gray-400 hover:text-blue-500 underline text-[10px]">수정</button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 엑셀 붙여넣기 모달 (계약 관리 전용) */}
        {isPasteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-bold text-gray-900">계약 정보 엑셀 대량 등록</h3>
                <button onClick={() => setIsPasteModalOpen(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
              </div>
              <p className="mb-2 text-xs text-gray-500">
                <strong className="text-red-500">권장 열 순서: 기간 | 유형 | 담당자 | 상태 | 업체명 | 상품 | 계약금액(숫자만) | 결제수단 | 계산서 | 특이사항</strong><br/>
                예시: 26.8.25~27.8.24(탭)콜(탭)매니저 1(탭)결제완료(탭)애플설비(탭)스마트플레이스(탭)2244000(탭)카드(탭)발행(탭)테스트
              </p>
              <textarea 
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="여기에 계약 엑셀 데이터를 붙여넣기 하세요..."
                className="h-64 w-full rounded-xl border border-gray-200 p-3 text-xs outline-none focus:border-blue-500"
              />
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setIsPasteModalOpen(false)} className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50">취소</button>
                <button onClick={handleBulkPaste} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700">일괄 등록하기</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}