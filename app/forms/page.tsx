"use client";

import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import { FolderOpen, Download, Plus, Search, FileText, X } from "lucide-react";

interface FormItem {
  id: string;
  category: string;
  title: string;
  size: string;
  date: string;
  requiresAdmin: boolean;
  downloadUrl?: string; // 🎯 직다운로드 전용 URL
}

const INITIAL_FORMS: FormItem[] = [
  {
    id: "1",
    category: "계약 서식",
    title: "표준 영업 위탁 계약서 양식 (2026)",
    size: "245 KB",
    date: "2026-08-01",
    requiresAdmin: true,
  },
  {
    id: "2",
    category: "영업 보고",
    title: "주간 영업 결과 보고서 서식",
    size: "180 KB",
    date: "2026-07-15",
    requiresAdmin: false,
    // 🎯 구글 스프레드시트를 .xlsx 엑셀 파일로 즉시 다운로드하는 직가공 링크
    downloadUrl: "https://docs.google.com/spreadsheets/d/15UM-_nW4BBFnHYY2O5_KcOps2SW2PvbE/export?format=xlsx",
  },
  {
    id: "3",
    category: "계약 서식",
    title: "신규 제휴 가입 신청서 및 정보제공동의서",
    size: "320 KB",
    date: "2026-06-20",
    requiresAdmin: false,
  },
  {
    id: "4",
    category: "기타 양식",
    title: "고객사 표준 견적서 양식",
    size: "150 KB",
    date: "2026-05-10",
    requiresAdmin: true,
  },
];

const CATEGORIES = ["전체", "계약 서식", "영업 보고", "기타 양식"];

export default function FormsPage() {
  const [forms, setForms] = useState<FormItem[]>(INITIAL_FORMS);
  const [activeCategory, setActiveCategory] = useState("전체");
  const [searchTerm, setSearchTerm] = useState("");

  // 새 서식 등록 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("계약 서식");
  const [newSize, setNewSize] = useState("200 KB");

  // 🎯 엑셀 파일 바로 다운로드 처리 함수
  const handleDownload = (item: FormItem) => {
    if (item.requiresAdmin) {
      alert("관리자에게 요청하시기 바랍니다.");
    } else if (item.downloadUrl) {
      // hidden anchor 태그를 생성하여 즉시 엑셀 파일(.xlsx) 저장 실행
      const a = document.createElement("a");
      a.href = item.downloadUrl;
      a.setAttribute("download", `${item.title}.xlsx`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      alert(`'${item.title}' 서식 다운로드를 시작합니다.`);
    }
  };

  // 새 서식 추가 함수
  const handleAddForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert("서식명을 입력해 주세요.");
      return;
    }

    const newForm: FormItem = {
      id: Date.now().toString(),
      category: newCategory,
      title: newTitle,
      size: newSize,
      date: new Date().toISOString().split("T")[0],
      requiresAdmin: false,
    };

    setForms([newForm, ...forms]);
    setNewTitle("");
    setIsModalOpen(false);
    alert("새 서식이 등록되었습니다.");
  };

  // 필터링 처리
  const filteredForms = forms.filter((item) => {
    const matchesCategory = activeCategory === "전체" || item.category === activeCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex min-h-screen bg-transparent text-gray-900">
      <Sidebar currentMenu="forms" />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto space-y-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black flex items-center gap-2">
                <FolderOpen className="text-blue-600" size={24} /> 서식 모음
              </h1>
              <p className="text-xs text-gray-500 font-bold mt-1">
                영업 및 계약에 필요한 표준 양식을 다운로드하거나 신규 양식을 등록할 수 있습니다.
              </p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all"
            >
              <Plus size={16} /> 새 서식 등록
            </button>
          </div>

          {/* 카테고리 필터 & 검색 */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeCategory === cat
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="서식명 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs font-bold outline-none focus:border-blue-600 bg-white"
              />
            </div>
          </div>

          {/* 서치 및 그리드 카드 목록 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredForms.length === 0 ? (
              <div className="col-span-2 p-12 text-center text-gray-400 font-bold bg-white rounded-3xl border border-gray-100">
                조회된 서식이 없습니다.
              </div>
            ) : (
              filteredForms.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl mt-0.5 shrink-0">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                      <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold mb-1.5">
                        {item.category}
                      </span>
                      <h3 className="text-sm font-bold text-gray-900 truncate">{item.title}</h3>
                      <div className="text-[11px] font-bold text-gray-400 mt-1 flex items-center gap-2">
                        <span>용량: {item.size}</span>
                        <span>•</span>
                        <span>등록일: {item.date}</span>
                      </div>
                    </div>
                  </div>

                  {/* 🎯 엑셀 파일 즉시 다운로드 버튼 */}
                  <button
                    onClick={() => handleDownload(item)}
                    className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shrink-0"
                    title="엑셀 다운로드"
                  >
                    <Download size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* 새 서식 등록 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-full max-w-md p-6 bg-white rounded-3xl border border-gray-100 shadow-2xl text-gray-900">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black flex items-center gap-2">
                <FileText className="text-blue-600" size={20} /> 새 서식 등록
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddForm} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">카테고리</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs font-bold bg-gray-50 outline-none"
                >
                  <option value="계약 서식">계약 서식</option>
                  <option value="영업 보고">영업 보고</option>
                  <option value="기타 양식">기타 양식</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">서식 제목</label>
                <input
                  type="text"
                  placeholder="예: 표준 계약서 양식"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs font-bold bg-gray-50 outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">파일 용량</label>
                <input
                  type="text"
                  placeholder="예: 250 KB"
                  value={newSize}
                  onChange={(e) => setNewSize(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs font-bold bg-gray-50 outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                >
                  등록하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}