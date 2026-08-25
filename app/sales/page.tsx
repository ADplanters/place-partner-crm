"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import {
  PhoneCall,
  Plus,
  Search,
  MinusCircle,
  Save,
  X,
  FileSpreadsheet,
} from "lucide-react";

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
}

const STATUS_OPTIONS = [
  "신규가망",
  "당일재통",
  "자료요청",
  "미팅예정",
  "미팅짤",
  "계약건",
  "결제짤림",
  "연장체크",
  "월말터치",
  "최종짤",
  "짤모음",
  "이전재통",
  "거절",
  "부재",
];

export default function SalesPage() {
  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>([]);
  const [managersList, setManagersList] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>("전체");
  const [searchTerm, setSearchTerm] = useState("");

  // 수정 모드 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<SalesRecord>>({});

  // DB 데이터 불러오기
  const fetchData = async () => {
    try {
      // 1. 담당자 목록 (팀원 DB)
      const usersSnap = await getDocs(collection(db, "users"));
      const userNames: string[] = [];
      usersSnap.forEach((docSnap) => {
        const u = docSnap.data();
        if (u.name) userNames.push(u.name);
      });
      setManagersList(userNames);

      // 2. 영업 DB
      const salesSnap = await getDocs(collection(db, "sales"));
      const list: SalesRecord[] = [];
      salesSnap.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: docSnap.id,
          date: d.date || "8. 25.",
          status: d.status || "신규가망",
          manager: d.manager || (userNames[0] || "매니저 1"),
          company: d.company || "업체명",
          phone: d.phone || "",
          address: d.address || "",
          placeUrl: d.placeUrl || "",
          lastContent: d.lastContent || "",
          recallTime: d.recallTime || "",
        });
      });
      setSalesRecords(list);
    } catch (error) {
      console.error("영업 DB 로딩 실패:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) fetchData();
    });
    return () => unsubscribe();
  }, []);

  // 빈 행 추가
  const handleAddEmptyRow = async () => {
    try {
      const newRecord = {
        date: "오늘",
        status: "신규가망",
        manager: managersList[0] || "매니저 1",
        company: "새 고객사",
        phone: "",
        address: "",
        placeUrl: "",
        lastContent: "",
        recallTime: "",
      };
      const docRef = await addDoc(collection(db, "sales"), newRecord);
      setSalesRecords([{ id: docRef.id, ...newRecord }, ...salesRecords]);
    } catch (error) {
      alert("행 추가 실패");
    }
  };

  // 수정 시작
  const handleStartEdit = (item: SalesRecord) => {
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
      await updateDoc(doc(db, "sales", id), editForm);
      setSalesRecords(salesRecords.map((s) => (s.id === id ? ({ ...s, ...editForm } as SalesRecord) : s)));
      setEditingId(null);
      alert("영업 정보가 저장되었습니다.");
    } catch (error) {
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  // 삭제
  const handleDeleteSales = async (id: string, company: string) => {
    if (!confirm(`'${company}' 영업건을 정말 삭제하시겠습니까?`)) return;

    try {
      await deleteDoc(doc(db, "sales", id));
      setSalesRecords(salesRecords.filter((s) => s.id !== id));
      if (editingId === id) setEditingId(null);
      alert("삭제되었습니다.");
    } catch (error) {
      alert("삭제 실패");
    }
  };

  // 필터링
  const filteredRecords = salesRecords.filter((item) => {
    const matchesTab = activeTab === "전체" || item.status === activeTab;
    const matchesSearch =
      item.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.phone.includes(searchTerm) ||
      item.manager.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] text-gray-900">
      <Sidebar currentMenu="sales" />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-[1600px] mx-auto">
          {/* 헤더 */}
          <div className="mb-6">
            <h1 className="text-2xl font-black flex items-center gap-2">
              <PhoneCall className="text-blue-600" size={24} /> 영업 결과 관리 (DB 연동됨)
            </h1>
            <p className="text-xs text-gray-500 font-bold mt-1">
              엑셀 붙여넣기로 대량 등록이 가능하며, 상태 탭과 검색 기능이 실시간으로 적용됩니다.
            </p>
          </div>

          {/* 상태 카운트 탭 */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
            <button
              onClick={() => setActiveTab("전체")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === "전체" ? "bg-gray-900 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"
              }`}
            >
              전체 ({salesRecords.length})
            </button>
            {STATUS_OPTIONS.map((status) => {
              const count = salesRecords.filter((s) => s.status === status).length;
              return (
                <button
                  key={status}
                  onClick={() => setActiveTab(status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    activeTab === status ? "bg-blue-600 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {status} {count}
                </button>
              );
            })}
          </div>

          {/* 액션바 및 검색 */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-2">
              <button
                onClick={handleAddEmptyRow}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all"
              >
                <Plus size={16} /> 빈 행 추가
              </button>
              <button
                onClick={() => alert("붙여넣기 등록 연동 가능")}
                className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-all"
              >
                <FileSpreadsheet size={16} /> 붙여넣기 등록
              </button>
            </div>

            <div className="relative w-72">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="업체명, 전화번호, 내용 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs font-bold outline-none focus:border-blue-600 bg-white"
              />
            </div>
          </div>

          {/* 테이블 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 min-w-[1300px]">
              <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-100">
                <tr>
                  <th className="p-3 w-10 text-center"></th>
                  <th className="p-3 w-24">날짜</th>
                  <th className="p-3 w-28">상태</th>
                  <th className="p-3 w-28">담당자</th>
                  <th className="p-3 w-36">업체명</th>
                  <th className="p-3 w-32">전화번호</th>
                  <th className="p-3 w-40">주소</th>
                  <th className="p-3 w-28">URL</th>
                  <th className="p-3 min-w-[150px]">마지막내용</th>
                  <th className="p-3 w-32">재통시간</th>
                  <th className="p-3 w-28 text-center sticky right-0 bg-gray-50 shadow-l">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-12 text-center text-gray-400 font-bold">
                      등록된 영업 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((item) => {
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
                        {/* 🔴 삭제 버튼 */}
                        <td className="p-3 text-center">
                          {isEditing && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSales(item.id, item.company);
                              }}
                              className="text-red-500 hover:text-red-700 transition-transform hover:scale-110"
                              title="영업건 삭제"
                            >
                              <MinusCircle size={18} strokeWidth={2.2} />
                            </button>
                          )}
                        </td>

                        {/* 날짜 */}
                        <td className="p-3">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.date || ""}
                              onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                              className="w-full px-2 py-1 rounded border border-blue-300 text-xs font-bold outline-none"
                            />
                          ) : (
                            item.date
                          )}
                        </td>

                        {/* 상태 */}
                        <td className="p-3">
                          {isEditing ? (
                            <select
                              value={editForm.status || "신규가망"}
                              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                              className="w-full px-1.5 py-1 rounded border border-blue-300 text-xs font-bold text-blue-600 outline-none"
                            >
                              {STATUS_OPTIONS.map((st) => (
                                <option key={st} value={st}>
                                  {st}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-md text-[11px] font-bold">
                              {item.status}
                            </span>
                          )}
                        </td>

                        {/* 🎯 담당자 드롭다운 (팀원 DB 연동) */}
                        <td className="p-3">
                          {isEditing ? (
                            <select
                              value={editForm.manager || ""}
                              onChange={(e) => setEditForm({ ...editForm, manager: e.target.value })}
                              className="w-full px-1.5 py-1 rounded border border-blue-300 text-xs font-bold outline-none"
                            >
                              {managersList.length > 0 ? (
                                managersList.map((m) => (
                                  <option key={m} value={m}>
                                    {m}
                                  </option>
                                ))
                              ) : (
                                <option value={editForm.manager}>{editForm.manager}</option>
                              )}
                            </select>
                          ) : (
                            item.manager
                          )}
                        </td>

                        {/* 업체명 */}
                        <td className="p-3 font-bold text-gray-900">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.company || ""}
                              onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                              className="w-full px-2 py-1 rounded border border-blue-300 text-xs font-bold outline-none"
                            />
                          ) : (
                            item.company
                          )}
                        </td>

                        {/* 전화번호 */}
                        <td className="p-3">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.phone || ""}
                              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                              className="w-full px-2 py-1 rounded border border-blue-300 text-xs font-bold outline-none"
                            />
                          ) : (
                            item.phone
                          )}
                        </td>

                        {/* 주소 */}
                        <td className="p-3">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.address || ""}
                              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                              className="w-full px-2 py-1 rounded border border-blue-300 text-xs font-bold outline-none"
                            />
                          ) : (
                            item.address
                          )}
                        </td>

                        {/* URL */}
                        <td className="p-3 text-blue-600">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.placeUrl || ""}
                              onChange={(e) => setEditForm({ ...editForm, placeUrl: e.target.value })}
                              className="w-full px-2 py-1 rounded border border-blue-300 text-xs font-bold outline-none"
                            />
                          ) : item.placeUrl ? (
                            <a href={item.placeUrl} target="_blank" rel="noopener noreferrer" className="underline">
                              링크
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>

                        {/* 마지막내용 */}
                        <td className="p-3 text-gray-600">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.lastContent || ""}
                              onChange={(e) => setEditForm({ ...editForm, lastContent: e.target.value })}
                              className="w-full px-2 py-1 rounded border border-blue-300 text-xs font-bold outline-none"
                            />
                          ) : (
                            item.lastContent
                          )}
                        </td>

                        {/* 재통시간 */}
                        <td className="p-3 text-gray-400">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.recallTime || ""}
                              onChange={(e) => setEditForm({ ...editForm, recallTime: e.target.value })}
                              className="w-full px-2 py-1 rounded border border-blue-300 text-xs font-bold outline-none"
                            />
                          ) : (
                            item.recallTime
                          )}
                        </td>

                        {/* 액션 버튼 */}
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