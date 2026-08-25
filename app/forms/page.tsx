"use client";

import React, { useState } from "react";
import Sidebar from "../components/Sidebar"; // 사이드바 컴포넌트 불러오기
import { Folder, Download, FileText, Search, Plus } from "lucide-react";

interface FormItem {
  id: number;
  title: string;
  category: "계약 서식" | "영업 보고" | "기타 양식";
  fileSize: string;
  updatedAt: string;
}

export default function FormsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("전체");

  const [forms] = useState<FormItem[]>([
    {
      id: 1,
      title: "표준 영업 위탁 계약서 양식 (2026)",
      category: "계약 서식",
      fileSize: "245 KB",
      updatedAt: "2026-08-01",
    },
    {
      id: 2,
      title: "주간 영업 결과 보고서 서식",
      category: "영업 보고",
      fileSize: "180 KB",
      updatedAt: "2026-07-15",
    },
    {
      id: 3,
      title: "신규 제휴 가입 신청서 및 정보제공동의서",
      category: "계약 서식",
      fileSize: "320 KB",
      updatedAt: "2026-06-20",
    },
    {
      id: 4,
      title: "고객사 표준 견적서 양식",
      category: "기타 양식",
      fileSize: "150 KB",
      updatedAt: "2026-05-10",
    },
  ]);

  const filteredForms = forms.filter((item) => {
    const matchesCategory =
      selectedCategory === "전체" || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleDownload = (title: string) => {
    alert(`'${title}' 서식 다운로드를 시작합니다.`);
  };

  return (
    // 🌟 사이드바 레이아웃 구조 적용
    <div className="flex min-h-screen bg-[#F8F9FA]">
      {/* 사이드바 컴포넌트 장착 */}
      <Sidebar currentMenu="forms" />

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* 상단 헤더 */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-black flex items-center gap-2 text-gray-900">
                <Folder className="text-blue-600" size={24} /> 서식 모음
              </h1>
              <p className="text-xs text-gray-500 font-bold mt-1">
                영업 및 계약에 필요한 표준 양식을 다운로드하세요.
              </p>
            </div>

            <button
              onClick={() => alert("서식 업로드 기능 준비 중입니다.")}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all"
            >
              <Plus size={16} /> 새 서식 등록
            </button>
          </div>

          {/* 필터 및 검색바 */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
            <div className="flex gap-2">
              {["전체", "계약 서식", "영업 보고", "기타 양식"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedCategory === cat
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-3 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="서식명 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold bg-white text-gray-900 outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* 서식 목록 카드 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredForms.length === 0 ? (
              <div className="col-span-1 md:col-span-2 text-center py-10 text-sm font-bold text-gray-400 bg-white rounded-2xl border border-gray-100">
                검색된 서식이 없습니다.
              </div>
            ) : (
              filteredForms.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-between hover:border-blue-200 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                      <FileText size={22} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md mb-1 inline-block">
                        {item.category}
                      </span>
                      <h3 className="text-sm font-bold text-gray-900">
                        {item.title}
                      </h3>
                      <div className="flex gap-3 text-[11px] text-gray-400 font-medium mt-1">
                        <span>용량: {item.fileSize}</span>
                        <span>등록일: {item.updatedAt}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownload(item.title)}
                    className="p-2.5 rounded-xl bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-all border border-gray-100"
                    title="다운로드"
                  >
                    <Download size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}