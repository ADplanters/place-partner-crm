"use client";

import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
} from "lucide-react";

interface ScheduleEvent {
  id: string;
  title: string;
  date: string;
  color?: string;
}

// 색상 태그 옵션
const COLOR_OPTIONS = [
  { label: "보라", value: "bg-purple-100 text-purple-700" },
  { label: "파랑", value: "bg-blue-100 text-blue-700" },
  { label: "초록", value: "bg-emerald-100 text-emerald-700" },
  { label: "빨강", value: "bg-red-100 text-red-700" },
  { label: "노랑", value: "bg-amber-100 text-amber-700" },
];

export default function SchedulePage() {
  const monthPickerRef = useRef<HTMLDivElement>(null);

  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(8);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

  const [events, setEvents] = useState<ScheduleEvent[]>([]);

  // 🌟 모달 및 입력 폼 상태
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newColor, setNewColor] = useState("bg-purple-100 text-purple-700");

  // 외부 클릭 시 월 선택 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (monthPickerRef.current && !monthPickerRef.current.contains(event.target as Node)) {
        setIsMonthPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Firestore에서 일정 가져오기
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
          color: data.color || "bg-purple-100 text-purple-700",
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

  // 🌟 신규 일정 DB 등록 처리
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
        createdAt: new Date(),
      });

      // 즉시 화면에 반영
      setEvents((prev) => [
        ...prev,
        { id: docRef.id, title: newTitle, date: newDate, color: newColor },
      ]);

      // 초기화 및 모달 닫기
      setNewTitle("");
      setIsAddModalOpen(false);
      alert("일정이 등록되었습니다.");
    } catch (error) {
      console.error("일정 등록 실패:", error);
      alert("일정 등록 중 오류가 발생했습니다.");
    }
  };

  // 🌟 일정 삭제 처리
  const handleDeleteSchedule = async (id: string, title: string) => {
    if (!confirm(`'${title}' 일정을 삭제하시겠습니까?`)) return;

    try {
      await deleteDoc(doc(db, "schedules", id));
      setEvents(events.filter((ev) => ev.id !== id));
      alert("일정이 삭제되었습니다.");
    } catch (error) {
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  // 이전 월 이동
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear((prev) => prev - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  // 다음 월 이동
  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear((prev) => prev + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  // 달력 날짜 그리드 계산
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay();

  const calendarDays = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] text-gray-900">
      <Sidebar currentMenu="schedule" />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* 상단 헤더 */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black flex items-center gap-2">
                <CalendarIcon className="text-blue-600" size={24} /> 통합 일정 (DB 연동됨)
              </h1>

              {/* 월 이동 및 피커 */}
              <div className="relative" ref={monthPickerRef}>
                <div className="flex items-center gap-1 bg-white border border-gray-200 px-3 py-1.5 rounded-xl font-bold text-sm shadow-sm">
                  <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-all">
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
                    className="px-2 hover:text-blue-600 transition-colors"
                  >
                    {`${currentYear}년 ${currentMonth}월`}
                  </button>
                  <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-all">
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

            {/* 🌟 일정 추가 버튼 클릭 시 모달 오픈 */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all"
            >
              <Plus size={16} /> 일정 추가
            </button>
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
                          onClick={() => handleDeleteSchedule(ev.id, ev.title)}
                          title="클릭하여 삭제"
                          className={`text-[10px] font-bold p-1 rounded-md truncate cursor-pointer hover:opacity-80 transition-all ${
                            ev.color || "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {ev.title}
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

      {/* 🌟 신규 일정 등록 모달 (팝업창) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-full max-w-md p-6 bg-white rounded-3xl border border-gray-100 shadow-2xl text-gray-900">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black flex items-center gap-2">
                <CalendarIcon className="text-blue-600" size={20} /> 새 일정 등록
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 transition-colors"
              >
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

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">색상 태그</label>
                <div className="flex gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      type="button"
                      key={c.value}
                      onClick={() => setNewColor(c.value)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${c.value} ${
                        newColor === c.value ? "ring-2 ring-gray-900 ring-offset-1 scale-105" : "opacity-60 hover:opacity-100"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
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
    </div>
  );
}