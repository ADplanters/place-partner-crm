"use client";

import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from "lucide-react";

interface ScheduleEvent {
  id: string;
  title: string;
  date: string;
  color?: string;
}

export default function SchedulePage() {
  const monthPickerRef = useRef<HTMLDivElement>(null);

  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(8);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (monthPickerRef.current && !monthPickerRef.current.contains(event.target as Node)) {
        setIsMonthPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
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
      }
    });
    return () => unsubscribe();
  }, []);

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

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] text-gray-900">
      {/* 🌟 공통 사이드바 사용 */}
      <Sidebar currentMenu="schedule" />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
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

            <button
              onClick={() => alert("신규 일정 등록 기능 준비 중입니다.")}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all"
            >
              <Plus size={16} /> 일정 추가
            </button>
          </div>

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
                          className={`text-[10px] font-bold p-1 rounded-md truncate ${
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
    </div>
  );
}