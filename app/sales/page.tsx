"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { Plus, ClipboardPaste, History, Search, Trash2, X, ChevronDown, Save } from "lucide-react";
import { db } from "../../firebase";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp, writeBatch } from "firebase/firestore";

const STATUS_OPTIONS = [
  "신규가망", "당일재통", "자료요청", "미팅예정", "미팅짤", 
  "계약건", "결제짤림", "연장체크", "월말터치", "최종짤", 
  "짤모음", "이전재통", "거절", "부재"
];

interface SalesRecord {
  id: string;
  date: string;
  status: string;
  manager: string;
  company: string;
  phone: string;
  address: string;
  placeUrl: string;
  lastContent: string;
  recallTime: string;
  isEditing?: boolean;
}

export default function SalesPage() {
  const [activeTab, setActiveTab] = useState("전체");
  const [searchTerm, setSearchTerm] = useState(""); // 검색어 상태 추가
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rows, setRows] = useState<SalesRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 모달 상태
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");

  // 1. Firebase 데이터 불러오기
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, "salesRecords"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const data: SalesRecord[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as SalesRecord);
      });
      setRows(data);
    } catch (error) {
      console.error("데이터 불러오기 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. 단일 빈 행 추가
  const addEmptyRow = async () => {
    try {
      const today = new Date();
      const formattedDate = `${today.getMonth() + 1}. ${today.getDate()}.`;
      const newRecord = {
        date: formattedDate,
        status: "신규가망",
        manager: "매니저 1",
        company: "", phone: "", address: "", placeUrl: "", lastContent: "", recallTime: "",
        createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, "salesRecords"), newRecord);
      setRows([{ id: docRef.id, ...newRecord, isEditing: true } as SalesRecord, ...rows]);
      setActiveTab("전체");
    } catch (error) {
      console.error("행 추가 실패:", error);
    }
  };

  // 3. 엑셀 대량 붙여넣기 (Batch Insert)
  const handleBulkPaste = async () => {
    if (!pasteText.trim()) return;
    const lines = pasteText.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return;

    setIsLoading(true);
    try {
      const batch = writeBatch(db);
      const today = new Date();
      const formattedDate = `${today.getMonth() + 1}. ${today.getDate()}.`;

      lines.forEach(line => {
        const cols = line.split('\t'); // 엑셀은 탭(\t)으로 열이 구분됨
        const docRef = doc(collection(db, "salesRecords"));
        const newRecord = {
          date: cols[0]?.trim() || formattedDate,
          status: cols[1]?.trim() || "신규가망",
          manager: cols[2]?.trim() || "매니저 1",
          company: cols[3]?.trim() || "",
          phone: cols[4]?.trim() || "",
          address: cols[5]?.trim() || "",
          placeUrl: cols[6]?.trim() || "",
          lastContent: cols[7]?.trim() || "",
          recallTime: cols[8]?.trim() || "",
          createdAt: serverTimestamp(),
        };
        batch.set(docRef, newRecord);
      });

      await batch.commit();
      alert(`${lines.length}건의 데이터가 등록되었습니다.`);
      setIsPasteModalOpen(false);
      setPasteText("");
      fetchData(); // 등록 후 새로고침
    } catch (error) {
      console.error("대량 등록 실패:", error);
      alert("대량 등록 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 4. 로컬 상태 변경 및 단일 저장
  const handleInputChange = (id: string, field: keyof SalesRecord, value: string) => {
    setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const saveRow = async (id: string) => {
    try {
      const rowToSave = rows.find(row => row.id === id);
      if (!rowToSave) return;
      const { isEditing, id: docId, ...dataToSave } = rowToSave;
      await updateDoc(doc(db, "salesRecords", id), dataToSave);
      setRows(rows.map(row => row.id === id ? { ...row, isEditing: false } : row));
    } catch (error) {
      console.error("저장 실패:", error);
    }
  };

  // 5. 일괄 삭제
  const deleteSelected = async () => {
    if (!confirm(`${selectedIds.length}개의 데이터를 삭제하시겠습니까?`)) return;
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => batch.delete(doc(db, "salesRecords", id)));
      await batch.commit();
      setRows(rows.filter((r) => !selectedIds.includes(r.id)));
      setSelectedIds([]);
    } catch (error) {
      console.error("삭제 실패:", error);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredRows.length && filteredRows.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRows.map((r) => r.id));
    }
  };

  const toggleSelect = (id: string) => {
    selectedIds.includes(id) ? setSelectedIds(selectedIds.filter((item) => item !== id)) : setSelectedIds([...selectedIds, id]);
  };

  // --- 탭 개수 카운트 및 필터링 로직 ---
  const getCount = (status: string) => {
    if (status === "전체") return rows.length;
    return rows.filter(r => r.status === status).length;
  };

  const filteredRows = rows.filter(row => {
    const matchTab = activeTab === "전체" || row.status === activeTab;
    const matchSearch = searchTerm === "" || 
      (row.company.includes(searchTerm) || row.phone.includes(searchTerm) || row.lastContent.includes(searchTerm));
    return matchTab && matchSearch;
  });

  const inputClassName = "w-full bg-transparent outline-none focus:border-b-2 focus:border-blue-500 py-1";

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <Sidebar />

      <main className="relative flex-1 p-8 pb-24 h-screen overflow-y-auto">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900">📋 영업 결과 관리 (DB 연동됨)</h1>
          <p className="mt-1 text-xs text-gray-500">엑셀 붙여넣기로 대량 등록이 가능하며, 상태 탭과 검색 기능이 실시간으로 적용됩니다.</p>
        </div>

        {/* 상태별 카운트 탭 (실시간 DB 연동) */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab("전체")}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
              activeTab === "전체" ? "bg-[#1A2536] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            전체 ({getCount("전체")})
          </button>
          {STATUS_OPTIONS.slice(0, 9).map((status) => (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === status ? "bg-blue-600 text-white" : "bg-blue-50/60 text-blue-600 hover:bg-blue-100"
              }`}
            >
              {status} <span className="opacity-75">{getCount(status)}</span>
            </button>
          ))}
        </div>

        {/* 액션 바 및 검색창 */}
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <button onClick={addEmptyRow} className="flex items-center gap-1 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700">
              <Plus className="h-4 w-4" /> 빈 행 추가
            </button>
            <button onClick={() => setIsPasteModalOpen(true)} className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">
              <ClipboardPaste className="h-4 w-4 text-gray-500" /> 붙여넣기 등록
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="업체명, 전화번호, 내용 검색"
                className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-8 pr-3 text-xs outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 데이터 테이블 */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="border-b border-gray-100 bg-gray-50/50 text-gray-500 sticky top-0">
                <tr>
                  <th className="p-3 text-center">
                    <input type="checkbox" checked={selectedIds.length === filteredRows.length && filteredRows.length > 0} onChange={toggleSelectAll} className="rounded border-gray-300"/>
                  </th>
                  <th className="p-3 font-semibold w-16">날짜</th>
                  <th className="p-3 font-semibold w-24">상태</th>
                  <th className="p-3 font-semibold w-24">담당자</th>
                  <th className="p-3 font-semibold w-32">업체명</th>
                  <th className="p-3 font-semibold w-32">전화번호</th>
                  <th className="p-3 font-semibold min-w-[150px]">주소</th>
                  <th className="p-3 font-semibold min-w-[100px]">URL</th>
                  <th className="p-3 font-semibold min-w-[200px]">마지막내용</th>
                  <th className="p-3 font-semibold w-24">재통시간</th>
                  <th className="p-3 font-semibold w-16 text-center">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {isLoading ? (
                  <tr><td colSpan={11} className="p-8 text-center text-gray-400">데이터를 불러오는 중입니다...</td></tr>
                ) : filteredRows.length === 0 ? (
                  <tr><td colSpan={11} className="p-8 text-center text-gray-400">조건에 맞는 데이터가 없습니다.</td></tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr key={row.id} className={`hover:bg-gray-50/50 ${row.isEditing ? 'bg-blue-50/20' : ''}`}>
                      <td className="p-3 text-center"><input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => toggleSelect(row.id)} className="rounded border-gray-300"/></td>
                      <td className="p-3 text-gray-500">{row.date}</td>
                      <td className="p-3">
                        <select value={row.status} onChange={(e) => { handleInputChange(row.id, 'status', e.target.value); saveRow(row.id); }} className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-bold text-blue-600 outline-none w-full">
                          {STATUS_OPTIONS.map((st) => <option key={st} value={st}>{st}</option>)}
                        </select>
                      </td>
                      <td className="p-3">{row.isEditing ? <input type="text" value={row.manager} onChange={(e) => handleInputChange(row.id, 'manager', e.target.value)} className={inputClassName} /> : <span onDoubleClick={() => handleInputChange(row.id, 'isEditing', "true")}>{row.manager || '-'}</span>}</td>
                      <td className="p-3">{row.isEditing ? <input type="text" value={row.company} onChange={(e) => handleInputChange(row.id, 'company', e.target.value)} placeholder="업체명" className={inputClassName} /> : <span onDoubleClick={() => handleInputChange(row.id, 'isEditing', "true")} className="font-bold">{row.company || '-'}</span>}</td>
                      <td className="p-3">{row.isEditing ? <input type="text" value={row.phone} onChange={(e) => handleInputChange(row.id, 'phone', e.target.value)} placeholder="전화번호" className={inputClassName} /> : <span onDoubleClick={() => handleInputChange(row.id, 'isEditing', "true")}>{row.phone || '-'}</span>}</td>
                      <td className="p-3">{row.isEditing ? <input type="text" value={row.address} onChange={(e) => handleInputChange(row.id, 'address', e.target.value)} placeholder="주소" className={inputClassName} /> : <span onDoubleClick={() => handleInputChange(row.id, 'isEditing', "true")}>{row.address || '-'}</span>}</td>
                      <td className="p-3">{row.isEditing ? <input type="text" value={row.placeUrl} onChange={(e) => handleInputChange(row.id, 'placeUrl', e.target.value)} placeholder="URL" className={inputClassName} /> : <span onDoubleClick={() => handleInputChange(row.id, 'isEditing', "true")} className="text-blue-500 underline cursor-pointer">{row.placeUrl ? '링크' : '-'}</span>}</td>
                      <td className="p-3">{row.isEditing ? <input type="text" value={row.lastContent} onChange={(e) => handleInputChange(row.id, 'lastContent', e.target.value)} placeholder="통화 내용" className={inputClassName} /> : <span onDoubleClick={() => handleInputChange(row.id, 'isEditing', "true")}>{row.lastContent || '-'}</span>}</td>
                      <td className="p-3">{row.isEditing ? <input type="text" value={row.recallTime} onChange={(e) => handleInputChange(row.id, 'recallTime', e.target.value)} placeholder="시간" className={inputClassName} /> : <span onDoubleClick={() => handleInputChange(row.id, 'isEditing', "true")}>{row.recallTime || '-'}</span>}</td>
                      <td className="p-3 text-center">
                        {row.isEditing ? <button onClick={() => saveRow(row.id)} className="text-white bg-blue-500 rounded px-2 py-1 flex items-center gap-1 hover:bg-blue-600 transition-colors"><Save className="w-3 h-3"/> 저장</button> : <button onClick={() => handleInputChange(row.id, 'isEditing', "true")} className="text-gray-400 hover:text-blue-500 underline text-[10px]">수정</button>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 엑셀 붙여넣기 모달 */}
        {isPasteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-bold text-gray-900">엑셀 대량 붙여넣기 등록</h3>
                <button onClick={() => setIsPasteModalOpen(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
              </div>
              <p className="mb-2 text-xs text-gray-500">
                엑셀에서 데이터를 복사(Ctrl+C)한 후 아래 칸에 붙여넣기(Ctrl+V) 하세요.<br/>
                <strong className="text-red-500">권장 열 순서: 날짜 | 상태 | 담당자 | 업체명 | 전화번호 | 주소 | URL | 통화내용 | 재통시간</strong>
              </p>
              <textarea 
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="여기에 엑셀 데이터를 붙여넣기 하세요..."
                className="h-64 w-full rounded-xl border border-gray-200 p-3 text-xs outline-none focus:border-blue-500"
              />
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setIsPasteModalOpen(false)} className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50">취소</button>
                <button onClick={handleBulkPaste} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700">일괄 등록하기</button>
              </div>
            </div>
          </div>
        )}

        {/* 하단 일괄 삭제 바 */}
        {selectedIds.length > 0 && (
          <div className="fixed bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-4 rounded-full bg-[#111827] px-6 py-3 text-xs font-bold text-white shadow-2xl">
            <span className="rounded-full bg-blue-600 px-2.5 py-0.5">{selectedIds.length} 개 선택됨</span>
            <button onClick={deleteSelected} className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-white hover:bg-red-700">
              <Trash2 className="h-3.5 w-3.5" /> 일괄 삭제
            </button>
          </div>
        )}
      </main>
    </div>
  );
}