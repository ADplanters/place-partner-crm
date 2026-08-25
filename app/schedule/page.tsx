"use client";

import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Edit3,
  Trash2,
  FileText,
  Clock,
  Tag,
} from "lucide-react";

interface ScheduleEvent {
  id: string;
  title: string;
  date: string;
  color?: string;
  memo?: string;
}

// 🎯 실무 맞춤형 색상 태그 기획 (대면영업, 가망건, 2차콜, 임시보류, 계약/중요)
const COLOR_OPTIONS = [
  { label: "대면영업", value: "bg-purple-100 text-purple-700 border-purple-200" },
  { label: "가망건", value: "bg-blue-100 text-blue-700 border-blue-200" },
  { label: "2차콜", value: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { label: "임시보류", value: "bg-amber-100 text-amber-700 border-amber-200" },
  { label: "계약/중요", value: "bg-rose-100 text-rose-700 border-rose-200" },
];

export default function SchedulePage() {
  const monthPickerRef = useRef<HTMLDivElement>(null);

  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(8);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

  const [events, setEvents] = useState<ScheduleEvent[]>([]);

  // 신규 등록 모달 상태
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newColor, setNewColor] = useState(COLOR_OPTIONS[0].value);
  const [newMemo, setNewMemo] = useState("");

  // 상세/수정 모달 상태
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // 수정용 상태
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editMemo, setEditMemo] = useState("");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (monthPickerRef.current && !monthPickerRef.current.contains(event.target as Node)) {
        setIsMonthPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSchedules = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "schedules"));
      const eventList: ScheduleEvent[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        eventList.push({
          id: docSnap.id,
          title: data.title || "일정",
          date: data.date || "",
          color: data.color || COLOR_OPTIONS[0].value,
          memo: data.memo || "",
        });
      });
      setEvents(eventList);
    } catch (error) {
      console.error("일정 불러오기 에러:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) fetchSchedules();
    });
    return () => unsubscribe();
  }, []);

  // 일정 등록
  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert("일정 제목을 입력해 주세요.");
      return;
    }

    try {
      const docRef = await addDoc(collection(db, "schedules"), {
        title: newTitle,
        date: newDate,
        color: newColor,
        memo: newMemo,
        createdAt: new Date(),
      });

      setEvents((prev) => [
        ...prev,
        { id: docRef.id, title: newTitle, date: newDate, color: newColor, memo: newMemo },
      ]);

      setNewTitle("");
      setNewMemo("");
      setNewColor(COLOR_OPTIONS[0].value);
      setIsAddModalOpen(false);
      alert("신규 일정이 등록되었습니다.");
    } catch (error) {
      console.error("일정 등록 실패:", error);
      alert("일정 등록 중 오류가 발생했습니다.");
    }
  };

  // 상세 모달 열기
  const handleOpenDetail = (ev: ScheduleEvent) => {
    setSelectedEvent(ev);
    setEditTitle(ev.title);
    setEditDate(ev.date);
    setEditColor(ev.color || COLOR_OPTIONS[0].value);
    setEditMemo(ev.memo || "");
    setIsEditMode(false);
    setIsDetailModalOpen(true);
  };

  // 일정 수정
  const handleUpdateSchedule = async () => {
    if (!selectedEvent) return;
    if (!editTitle.trim()) {
      alert("제목을 입력해 주세요.");
      return;
    }

    try {
      await updateDoc(doc(db, "schedules", selectedEvent.id), {
        title: editTitle,
        date: editDate,
        color: editColor,
        memo: editMemo,
        updatedAt: new Date(),
      });

      setEvents(
        events.map((e) =>
          e.id === selectedEvent.id
            ? { ...e, title: editTitle, date: editDate, color: editColor, memo: editMemo }
            : e
        )
      );

      setSelectedEvent({ ...selectedEvent, title: editTitle, date: editDate, color: editColor, memo: editMemo });
      setIsEditMode(false);
      alert("일정이 수정되었습니다.");
    } catch (error) {
      console.error("수정 실패:", error);
      alert("일정 수정 중 오류가 발생했습니다.");
    }
  };

  // 일정 삭제
  const handleDeleteSchedule = async () => {
    if (!selectedEvent) return;
    if (!confirm(`'${selectedEvent.title}' 일정을 삭제하시겠습니까?`)) return;

    try {
      await deleteDoc(doc(db, "schedules", selectedEvent.id));
      setEvents(events.filter((ev) => ev.id !== selectedEvent.id));
      setIsDetailModalOpen(false);
      alert("일정이 삭제되었습니다.");
    } catch (error) {
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear((prev) => prev - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear((prev) => prev + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay();

  const calendarDays = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  // 색상 클래스로부터 태그 라벨 명칭 반환
  const getTagLabel = (colorValue?: string) => {
    const found = COLOR_OPTIONS.find((c) => c.value === colorValue);
    return found ? found.label : "일정";
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] text-gray-900">
      <Sidebar currentMenu="schedule" />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* 상단 헤더 및 범례 */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black flex items-center gap-2">
                <CalendarIcon className="text-blue-600" size={24} /> 통합 일정 (DB 연동됨)
              </h1>

              <div className="relative" ref={monthPickerRef}>
                <div className="flex items-center gap-1 bg-white border border-gray-200 px-3 py-1.5 rounded-xl font-bold text-sm shadow-sm">
                  <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-lg">
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
                    className="px-2 hover:text-blue-600 transition-colors"
                  >
                    {`${currentYear}년 ${currentMonth}월`}
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

            {/* 실무 태그 안내 범례 및 추가 버튼 */}
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-xl text-[11px] font-bold">
                {COLOR_OPTIONS.map((c) => (
                  <span key={c.label} className={`px-2 py-0.5 rounded-md ${c.value}`}>
                    {c.label}
                  </span>
                ))}
              </div>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all"
              >
                <Plus size={16} /> 일정 추가
              </button>
            </div>
          </div>

          {/* 달력 UI */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-7 border-b border-gray-200 text-center text-xs font-black text-gray-500 bg-gray-50/50 py-3">
              <div className="text-red-500">일</div>
              <div>월</div>
              <div>화</div>
              <div>수</div>
              <div>목</div>
              <div>금</div>
              <div className="text-blue-500">토</div>
            </div>

            <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
              {calendarDays.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="h-28 bg-gray-50/30" />;
                }

                const formattedMonth = String(currentMonth).padStart(2, "0");
                const formattedDay = String(day).padStart(2, "0");
                const dateKey = `${currentYear}-${formattedMonth}-${formattedDay}`;

                const dayEvents = events.filter((e) => e.date === dateKey);

                return (
                  <div key={day} className="h-28 p-2 flex flex-col justify-between hover:bg-gray-50/50 transition-all">
                    <span
                      className={`text-xs font-bold ${
                        idx % 7 === 0 ? "text-red-500" : idx % 7 === 6 ? "text-blue-500" : "text-gray-700"
                      }`}
                    >
                      {day}
                    </span>

                    <div className="space-y-1 overflow-y-auto max-h-20">
                      {dayEvents.map((ev) => (
                        <div
                          key={ev.id}
                          onClick={() => handleOpenDetail(ev)}
                          className={`group relative text-[10px] font-bold p-1 rounded-md truncate cursor-pointer transition-all border ${
                            ev.color || COLOR_OPTIONS[0].value
                          }`}
                        >
                          <span className="opacity-75 mr-1">[{getTagLabel(ev.color)}]</span>
                          {ev.title}

                          {/* 🌟 마우스오버 미리보기 툴팁 */}
                          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-56 p-3 bg-gray-900 text-white rounded-2xl shadow-2xl z-40 pointer-events-none text-left">
                            <div className="flex items-center justify-between border-b border-gray-700 pb-1.5 mb-1.5">
                              <span className="font-bold text-xs text-blue-300 truncate">📌 {ev.title}</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">
                                {getTagLabel(ev.color)}
                              </span>
                            </div>
                            <div className="text-[10px] text-gray-300 mb-1">📅 {ev.date}</div>
                            <div className="text-[10px] text-gray-200 whitespace-pre-wrap leading-relaxed">
                              {ev.memo ? ev.memo : "등록된 세부 메모가 없습니다."}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* 🌟 1. 신규 일정 등록 모달 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-full max-w-md p-6 bg-white rounded-3xl border border-gray-100 shadow-2xl text-gray-900">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black flex items-center gap-2">
                <CalendarIcon className="text-blue-600" size={20} /> 새 일정 등록
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSchedule} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">일정 제목</label>
                <input
                  type="text"
                  placeholder="예: 미팅, 계약 건 터치 등"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs font-bold bg-gray-50 outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">날짜 선택</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs font-bold bg-gray-50 outline-none focus:border-blue-600 cursor-pointer"
                  required
                />
              </div>

              {/* 🎯 기획된 영업 상태 태그 선택 */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">영업 상태 태그</label>
                <div className="flex flex-wrap gap-1.5">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      type="button"
                      key={c.label}
                      onClick={() => setNewColor(c.value)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${c.value} ${
                        newColor === c.value
                          ? "ring-2 ring-blue-600 ring-offset-1 scale-105 shadow-sm"
                          : "opacity-60 hover:opacity-100"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">세부 내용 / 메모</label>
                <textarea
                  rows={3}
                  placeholder="일정에 대한 세부적인 메모나 특이사항을 작성해 주세요."
                  value={newMemo}
                  onChange={(e) => setNewMemo(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs font-bold bg-gray-50 outline-none focus:border-blue-600 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
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

      {/* 🌟 2. 일정 클릭 시 오픈되는 상세 / 수정 / 삭제 모달 */}
      {isDetailModalOpen && selectedEvent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-full max-w-md p-6 bg-white rounded-3xl border border-gray-100 shadow-2xl text-gray-900">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black flex items-center gap-2">
                <CalendarIcon className="text-blue-600" size={20} />
                {isEditMode ? "일정 수정" : "일정 상세 정보"}
              </h2>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            {!isEditMode ? (
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1">
                      <Tag size={12} /> 일정 제목
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${selectedEvent.color}`}>
                      {getTagLabel(selectedEvent.color)}
                    </span>
                  </div>
                  <div className="text-base font-black text-gray-900">{selectedEvent.title}</div>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-gray-400 mb-1 flex items-center gap-1">
                    <Clock size={12} /> 날짜
                  </div>
                  <div className="text-xs font-bold text-gray-700">{selectedEvent.date}</div>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-gray-400 mb-1 flex items-center gap-1">
                    <FileText size={12} /> 세부 메모
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs font-medium text-gray-700 leading-relaxed whitespace-pre-wrap min-h-[80px]">
                    {selectedEvent.memo ? selectedEvent.memo : "등록된 메모가 없습니다."}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleDeleteSchedule}
                    className="flex items-center justify-center gap-1 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl transition-all"
                  >
                    <Trash2 size={15} /> 삭제
                  </button>
                  <button
                    onClick={() => setIsEditMode(true)}
                    className="flex-1 flex items-center justify-center gap-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                  >
                    <Edit3 size={15} /> 수정하기
                  </button>
                  <button
                    onClick={() => setIsDetailModalOpen(false)}
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs rounded-xl transition-all"
                  >
                    닫기
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">일정 제목</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs font-bold bg-gray-50 outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">날짜 선택</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs font-bold bg-gray-50 outline-none focus:border-blue-600 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">영업 상태 태그</label>
                  <div className="flex flex-wrap gap-1.5">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        type="button"
                        key={c.label}
                        onClick={() => setEditColor(c.value)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${c.value} ${
                          editColor === c.value
                            ? "ring-2 ring-blue-600 ring-offset-1 scale-105 shadow-sm"
                            : "opacity-60 hover:opacity-100"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">세부 내용 / 메모</label>
                  <textarea
                    rows={3}
                    value={editMemo}
                    onChange={(e) => setEditMemo(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs font-bold bg-gray-50 outline-none focus:border-blue-600 resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditMode(false)}
                    className="flex-1 py-3 rounded-xl font-bold text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdateSchedule}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                  >
                    저장하기
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}