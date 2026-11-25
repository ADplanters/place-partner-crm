"use client";

import React, { useState, useRef, useEffect } from "react";
import Sidebar from "@/app/components/Sidebar";
import {
  ExternalLink,
  Copy,
  Check,
  BarChart3,
  Search,
  Settings,
  ChevronDown,
  X,
  Building2,
} from "lucide-react";

interface ClientReport {
  id: string;
  name: string;
  fileName: string;
}

// 고객사 보고서 목록 (신규 3곳 포함 - 실제 생성한 .html 파일명과 다르면 fileName만 수정하세요)
const clientReports: ClientReport[] = [
  { id: "coway-perfectmall", name: "코웨이 퍼펙트몰", fileName: "coway-perfectmall.html" },
  { id: "photopot", name: "포토팟", fileName: "photopot.html" },
  { id: "Lumy", name: "루미", fileName: "Lumy.html" },
  { id: "jungwonyong", name: "정원용", fileName: "jungwonyong.html" },
  { id: "noahuniversecompany", name: "노아유니버스컴퍼니", fileName: "noahuniversecompany.html" },
  { id: "gyesog", name: "계속", fileName: "gyesog.html" },
  { id: "boseong-bluetour", name: "보성블루투어 주식회사", fileName: "boseong-bluetour.html" },
  { id: "enableu", name: "이네이블유", fileName: "enableu.html" },
  { id: "simji", name: "심지", fileName: "simji.html" },
];

// 검색어 정규식 특수문자 이스케이프 헬퍼
function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ClientReport>(clientReports[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const liveUrl = `https://stackover-dev.github.io/Looker-Studio/${selectedReport.fileName}`;
  // 관제탑 admin/index.html 경로
  const adminControlTowerUrl = `https://stackover-dev.github.io/Looker-Studio/admin/index.html`;

  // 실시간 자동 필터링 (고객명 + 파일명 모두 검색 지원)
  const filteredReports = clientReports.filter((report) => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return true;
    return (
      report.name.toLowerCase().includes(keyword) ||
      report.fileName.toLowerCase().includes(keyword)
    );
  });

  // 드롭다운 외부 클릭 시 자동 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 검색어 변경 시 키보드 하이라이트 인덱스 초기화
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchTerm, isDropdownOpen]);

  const handleSelectReport = (report: ClientReport) => {
    setSelectedReport(report);
    setIsDropdownOpen(false);
    setSearchTerm("");
    inputRef.current?.blur();
  };

  const handleOpenDropdown = () => {
    setIsDropdownOpen(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleToggleDropdown = () => {
    if (isDropdownOpen) {
      setIsDropdownOpen(false);
      setSearchTerm("");
      inputRef.current?.blur();
    } else {
      handleOpenDropdown();
    }
  };

  // 키보드 탐색 (↑, ↓, Enter, Esc)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        e.preventDefault();
        setIsDropdownOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (filteredReports.length > 0) {
        setHighlightedIndex((prev) => (prev + 1) % filteredReports.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (filteredReports.length > 0) {
        setHighlightedIndex((prev) => (prev - 1 + filteredReports.length) % filteredReports.length);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredReports[highlightedIndex]) {
        handleSelectReport(filteredReports[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsDropdownOpen(false);
      setSearchTerm("");
      inputRef.current?.blur();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(liveUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 검색어 일치 텍스트 하이라이트 렌더링
  const renderHighlightedText = (text: string, query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return text;
    const regex = new RegExp(`(${escapeRegExp(trimmed)})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, idx) =>
      part.toLowerCase() === trimmed.toLowerCase() ? (
        <span
          key={idx}
          className="bg-blue-100 dark:bg-blue-500/30 text-blue-700 dark:text-blue-200 rounded px-0.5 font-extrabold"
        >
          {part}
        </span>
      ) : (
        <React.Fragment key={idx}>{part}</React.Fragment>
      )
    );
  };

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

            {/* 우측 등록 고객사 수 배지 & 관제탑 관리자 버튼 */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-start md:justify-end">
              <span className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800/60 rounded-xl whitespace-nowrap">
                <Building2 size={14} />
                등록 고객사 {clientReports.length}곳
              </span>

              {/* 대행사 관제탑 데이터 관리자 접속 버튼 */}
              <a
                href={adminControlTowerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm transition-all whitespace-nowrap border border-slate-800"
              >
                <Settings size={15} className="text-amber-400" />
                <span>관제탑 데이터 관리자 ⚙️</span>
              </a>
            </div>
          </div>

          {/* 검색 자동 필터링 고객사 선택 드롭다운 바 (Combobox) */}
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label
                htmlFor="client-combobox-input"
                className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap shrink-0"
              >
                고객사 선택
              </label>

              {/* 드롭다운 컨테이너 */}
              <div ref={dropdownRef} className="relative flex-1 max-w-xl">
                <div
                  className={`flex items-center w-full bg-gray-50 dark:bg-gray-700/70 border rounded-xl transition-all ${
                    isDropdownOpen
                      ? "border-blue-500 ring-2 ring-blue-500/20 bg-white dark:bg-gray-800"
                      : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                  }`}
                >
                  <Search
                    className={`ml-3.5 shrink-0 transition-colors ${
                      isDropdownOpen ? "text-blue-500" : "text-gray-400"
                    }`}
                    size={18}
                  />

                  <input
                    id="client-combobox-input"
                    ref={inputRef}
                    type="text"
                    role="combobox"
                    aria-expanded={isDropdownOpen}
                    aria-autocomplete="list"
                    autoComplete="off"
                    value={isDropdownOpen ? searchTerm : selectedReport.name}
                    placeholder={`현재 선택: ${selectedReport.name} — 고객사명 입력으로 검색...`}
                    onFocus={() => setIsDropdownOpen(true)}
                    onClick={() => setIsDropdownOpen(true)}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      if (!isDropdownOpen) setIsDropdownOpen(true);
                    }}
                    onKeyDown={handleKeyDown}
                    className="w-full px-3 py-2.5 text-sm font-semibold bg-transparent focus:outline-none text-gray-900 dark:text-white placeholder:font-normal placeholder:text-gray-400 dark:placeholder:text-gray-400"
                  />

                  {/* 검색어 초기화 버튼 */}
                  {isDropdownOpen && searchTerm && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchTerm("");
                        inputRef.current?.focus();
                      }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                      aria-label="검색어 지우기"
                    >
                      <X size={16} />
                    </button>
                  )}

                  {/* 드롭다운 열기/닫기 화살표 버튼 */}
                  <button
                    type="button"
                    onClick={handleToggleDropdown}
                    className="px-3 py-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 border-l border-gray-200/80 dark:border-gray-600/80 transition-colors"
                    aria-label="고객사 목록 열기/닫기"
                  >
                    <ChevronDown
                      size={18}
                      className={`transition-transform duration-200 ${
                        isDropdownOpen ? "rotate-180 text-blue-500" : ""
                      }`}
                    />
                  </button>
                </div>

                {/* 드롭다운 자동 필터링 리스트 */}
                {isDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-40 overflow-hidden">
                    <div className="px-3.5 py-2 bg-gray-50 dark:bg-gray-900/60 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                      <span>
                        {searchTerm.trim()
                          ? `"${searchTerm.trim()}" 검색 결과`
                          : "전체 고객사 목록"}
                      </span>
                      <span>{filteredReports.length}건</span>
                    </div>

                    <ul
                      role="listbox"
                      className="max-h-72 overflow-y-auto py-1.5 divide-y divide-gray-100/70 dark:divide-gray-700/50"
                    >
                      {filteredReports.length > 0 ? (
                        filteredReports.map((report, index) => {
                          const isSelected = selectedReport.id === report.id;
                          const isHighlighted = index === highlightedIndex;

                          return (
                            <li
                              key={report.id}
                              role="option"
                              aria-selected={isSelected}
                              onMouseEnter={() => setHighlightedIndex(index)}
                              onMouseDown={(e) => {
                                // blur보다 먼저 선택 이벤트 실행되도록 방지
                                e.preventDefault();
                                handleSelectReport(report);
                              }}
                              className={`px-4 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-blue-50/90 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                  : isHighlighted
                                  ? "bg-gray-100 dark:bg-gray-700/70 text-gray-900 dark:text-white"
                                  : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-bold truncate">
                                  {renderHighlightedText(report.name, searchTerm)}
                                </div>
                                <div className="text-[11px] font-mono text-gray-400 dark:text-gray-400 truncate mt-0.5">
                                  {renderHighlightedText(report.fileName, searchTerm)}
                                </div>
                              </div>

                              {isSelected && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-600 text-white shrink-0">
                                  <Check size={12} /> 선택됨
                                </span>
                              )}
                            </li>
                          );
                        })
                      ) : (
                        <li className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                          <span className="font-semibold text-gray-600 dark:text-gray-300">
                            "{searchTerm}"
                          </span>
                          에 해당하는 고객사가 없습니다.
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* 현재 선택된 고객사 파일명 배지 */}
              <div className="hidden lg:flex items-center gap-2 ml-auto text-xs text-gray-500 dark:text-gray-400">
                <span>현재 보고서:</span>
                <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 font-bold text-gray-800 dark:text-gray-100">
                  {selectedReport.name}
                </span>
              </div>
            </div>
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
                  type="button"
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
                key={selectedReport.id}
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