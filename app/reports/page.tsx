"use client";

import React, { useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import { ExternalLink, Copy, Check, BarChart3, Search } from "lucide-react";

// 고객사 보고서 목록
const clientReports = [
  { id: "coway-perfectmall", name: "코웨이 퍼펙트몰", fileName: "coway-perfectmall.html" },
  { id: "photopot", name: "포토팟", fileName: "photopot.html" },
  { id: "Lumy", name: "루미", fileName: "Lumy.html" },
  { id: "jungwonyong", name: "정원용", fileName: "jungwonyong.html" },
  { id: "noahuniversecompany", name: "노아유니버스컴퍼니", fileName: "noahuniversecompany.html" },
  { id: "gyesog", name: "계속", fileName: "gyesog.html" },
];

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState(clientReports[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [copied, setCopied] = useState(false);

  const liveUrl = `https://stackover-dev.github.io/Looker-Studio/${selectedReport.fileName}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(liveUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredReports = clientReports.filter(
    (report) =>
      report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 사이드바 */}
      <Sidebar currentMenu="reports" />

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* 헤더 */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="text-blue-600 dark:text-blue-400" size={28} />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  고객사 광고 보고서 관리
                </h1>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                고객사별 라이브 광고 보고서를 실시간으로 확인하고 외부 공유 링크를 관리합니다.
              </p>
            </div>

            {/* 검색창 */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="고객사 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* 고객사 탭 선택 영역 */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {filteredReports.map((report) => {
              const isSelected = selectedReport.id === report.id;
              return (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {report.name}
                </button>
              );
            })}
          </div>

          {/* 선택된 보고서 제어 및 미리보기 영역 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 space-y-4">
            {/* 상단 URL 제어 바 */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200/80 dark:border-gray-600">
              <div className="space-y-1 overflow-hidden w-full sm:w-auto">
                <span className="text-xs font-bold text-gray-400 dark:text-gray-400 block">
                  고객 전달용 라이브 URL
                </span>
                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline truncate block"
                >
                  {liveUrl}
                </a>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                >
                  {copied ? (
                    <>
                      <Check size={14} className="text-green-500" /> 복사됨!
                    </>
                  ) : (
                    <>
                      <Copy size={14} /> 링크 복사
                    </>
                  )}
                </button>

                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <ExternalLink size={14} /> 새 탭에서 열기
                </a>
              </div>
            </div>

            {/* Iframe 미리보기 */}
            <div className="w-full h-[750px] border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-900 relative">
              <iframe
                src={liveUrl}
                className="w-full h-full border-0"
                title={`${selectedReport.name} 보고서`}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}