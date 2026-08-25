"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, X, Trash2 } from "lucide-react";
import { db } from "../../firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp } from "firebase/firestore";

interface ScheduleEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: string;
}

export default function SchedulePage() {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 입력 폼 상태
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("2026-08-25");
  const [type, setType] = useState("미팅");

  const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];

  // 1. Firebase에서 일정 데이터 불러오기
  const fetchSchedules = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, "schedules"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const data: ScheduleEvent[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as ScheduleEvent);
      });
      setEvents(data);
    } catch (error) {
      console.error("일정 불러오기 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  // 2. 새 일정 DB 추가
  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    try {
      const newSchedule = {
        title,
        date,
        type,
        createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, "schedules"), newSchedule);
      setEvents([{ id: docRef.id, ...newSchedule } as ScheduleEvent, ...events]);
      setTitle("");
      setIsModalOpen(false);
    } catch (error) {
      console.error("일정 추가 실패:", error);
      alert("일정 추가 중 오류가 발생했습니다.");
    }
  };

  // 3. 일정 삭제
  const handleDeleteSchedule = async (id: string) => {
    if (!confirm("이 일정을 삭제하시겠습니까?")) return;
    try {
      await deleteDoc(doc(db, "schedules", id));
      setEvents(events.filter((e) => e.id !== id));
    } catch (error) {
      console.error("일정 삭제 실패:", error);
    }
  };

  // 2026년 8월 기준 달력 셀 생성 (8월 1일: 토요일 -> 앞쪽 빈칸 6개)
  const blankDays = Array.from({ length: 6 }, () => null);
  const monthDays = Array.from({ length: 31 }, (_, i) => i + 1);
  const allCells = [...blankDays, ...monthDays];
  while (allCells.length < 35) allCells.push(null);

  // 이벤트 타입별 색상 배정
  const getTypeColor = (evtType: string) => {
    switch (evtType) {
      case "미팅": return "bg-blue-100 text-blue-700 border-blue-200";
      case "계약": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "내부": return "bg-purple-100 text-purple-700 border-purple-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <Sidebar />

      <main className="relative flex-1 p-8">
        {/* 상단 헤더 */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
              통합 일정 (DB 연동됨)
            </h1>
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 shadow-sm">
              <button className="text-gray-400 hover:text-gray-600"><ChevronLeft className="h-4 w-4" /></button>
              <span className="text-sm font-bold text-gray-800">2026년 8월</span>
              <button className="text-gray-400 hover:text-gray-600"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> 일정 추가
          </button>
        </div>

        {/* 캘린더 영역 */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm h-[calc(100vh-140px)]">
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
            {daysOfWeek.map((day, index) => (
              <div
                key={day}
                className={`py-3 text-center text-sm font-bold ${
                  index === 0 ? "text-red-500" : index === 6 ? "text-blue-500" : "text-gray-600"
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid flex-1 grid-cols-7 grid-rows-5 bg-gray-200 gap-[1px]">
            {allCells.map((dayNum, index) => {
              // YYYY-MM-DD 형식 매칭
              const currentDateStr = dayNum
                ? `2026-08-${dayNum.toString().padStart(2, "0")}`
                : "";
              const dayEvents = events.filter((e) => e.date === currentDateStr);

              return (
                <div key={index} className="flex flex-col bg-white p-2 transition-colors hover:bg-gray-50/80 overflow-y-auto">
                  {dayNum && (
                    <>
                      <div
                        className={`mb-1 text-sm font-semibold ${
                          index % 7 === 0 ? "text-red-500" : index % 7 === 6 ? "text-blue-500" : "text-gray-700"
                        }`}
                      >
                        {dayNum}
                      </div>

                      <div className="flex flex-col gap-1">
                        {dayEvents.map((evt) => (
                          <div
                            key={evt.id}
                            className={`group flex items-center justify-between rounded border px-1.5 py-1 text-[11px] font-bold ${getTypeColor(
                              evt.type
                            )}`}
                          >
                            <span className="truncate">{evt.title}</span>
                            <button
                              onClick={() => handleDeleteSchedule(evt.id)}
                              className="hidden text-gray-400 hover:text-red-500 group-hover:block"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 일정 추가 모달 */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-bold text-gray-900">새 일정 추가</h3>
                <button onClick={() => setIsModalOpen(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddSchedule} className="space-y-4 text-xs font-medium text-gray-700">
                <div>
                  <label className="mb-1 block font-bold">일정 내용</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="예: 애플 미팅건"
                    className="w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold">날짜</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold">유형</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-2.5 outline-none"
                  >
                    <option value="미팅">미팅 (파란색)</option>
                    <option value="계약">계약 (초록색)</option>
                    <option value="내부">내부 (보라색)</option>
                  </select>
                </div>

                <div className="mt-6 flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                  >
                    등록하기
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}