"use client";

import React, { useState } from "react";
import Sidebar from "../components/Sidebar"; // 사이드바 컴포넌트 불러오기
import { GraduationCap, BookOpen, Video, FileCheck, ExternalLink } from "lucide-react";

interface EduItem {
  id: number;
  title: string;
  type: "가이드" | "동영상" | "매뉴얼";
  desc: string;
  readTime: string;
  updatedAt: string;
}

export default function EducationPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("전체");

  const [eduMaterials] = useState<EduItem[]>([
    {
      id: 1,
      title: "신입 영업자 필수 온보딩 가이드",
      type: "가이드",
      desc: "첫 영업 개시 전 필수 숙지사항 및 영업 프로세스 전체 안내",
      readTime: "소요시간 15분",
      updatedAt: "2026-08-10",
    },
    {
      id: 2,
      title: "PLACE PARTNER CRM 핵심 기능 사용법",
      type: "동영상",
      desc: "계약 등록, 통합 일정 관리 및 DB 활용법 10분 마스터",
      readTime: "영상 10분",
      updatedAt: "2026-07-28",
    },
    {
      id: 3,
      title: "고객거절 대응 및 계약 성사 스크립트",
      type: "매뉴얼",
      desc: "주요 거절 사유별 실전 대응 대화 시나리오 모음",
      readTime: "소요시간 20분",
      updatedAt: "2026-07-02",
    },
  ]);

  const filteredMaterials = eduMaterials.filter((item) => {
    if (selectedCategory === "전체") return true;
    return item.type === selectedCategory;
  });

  return (
    // 🌟 사이드바 레이아웃 구조 적용
    <div className="flex flex-col md:flex-row min-h-screen bg-transparent text-gray-900">
      {/* 사이드바 컴포넌트 장착 */}
      <Sidebar currentMenu="education" />

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* 상단 헤더 */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-black flex items-center gap-2">
                  <GraduationCap className="text-purple-600" size={24} /> 교육 자료
                </h1>
                <p className="text-xs text-gray-500 font-bold mt-1">
                  영업 역량 강화를 위한 매뉴얼과 교육 자료를 확인하세요.
                </p>
              </div>
            </div>
          </div>

          {/* 카테고리 탭 */}
          <div className="flex gap-2 mb-6">
            {["전체", "가이드", "동영상", "매뉴얼"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === cat
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 교육 자료 카드 목록 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredMaterials.map((item) => (
              <div
                key={item.id}
                className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col justify-between hover:border-purple-200 transition-all"
              >
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span
                      className={`p-3 rounded-xl ${
                        item.type === "동영상"
                          ? "bg-red-50 text-red-600"
                          : item.type === "가이드"
                          ? "bg-purple-50 text-purple-600"
                          : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      {item.type === "동영상" ? (
                        <Video size={20} />
                      ) : item.type === "가이드" ? (
                        <BookOpen size={20} />
                      ) : (
                        <FileCheck size={20} />
                      )}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400">
                      {item.readTime}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-6">
                    {item.desc}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-[11px] text-gray-400 font-medium">
                    {item.updatedAt}
                  </span>
                  <button
                    onClick={() => alert(`'${item.title}' 자료를 열람합니다.`)}
                    className="flex items-center gap-1 text-xs font-bold text-purple-600 hover:underline"
                  >
                    자료 보기 <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}