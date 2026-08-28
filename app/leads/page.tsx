"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import {
  Database,
  Search,
  Phone,
  ExternalLink,
  Trash2,
  Lock,
  Clock,
  User,
  MapPin,
} from "lucide-react";

interface LeadItem {
  id: string;
  name: string;
  phone: string;
  placeUrl: string;
  keyword: string;
  status: string;
  createdAt?: any;
}

const STATUS_OPTIONS = ["신규 접수", "상담 대기", "상담 완료", "계약 진행", "부재중", "보류"];

export default function LeadsPage() {
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUserTeam, setCurrentUserTeam] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("전체");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const uData = userSnap.data();
            setCurrentUserRole(uData.role || null);
            setCurrentUserTeam(uData.team || null);

            const isAdminUser =
              uData.role === "admin" ||
              uData.team === "본사/총괄 디렉터" ||
              uData.team === "본사/관리자";

            if (isAdminUser) {
              fetchLeads();
            }
          }
        } catch (error) {
          console.error("유저 권한 확인 실패:", error);
        }
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 파이어베이스 'leads' 컬렉션 데이터 패치
  const fetchLeads = async () => {
    try {
      const q = query(collection(db, "leads"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const list: LeadItem[] = [];

      querySnapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: docSnap.id,
          name: d.name || "사장님",
          phone: d.phone || "",
          placeUrl: d.placeUrl || "",
          keyword: d.keyword || "",
          status: d.status || "신규 접수",
          createdAt: d.createdAt ? d.createdAt.toDate() : new Date(),
        });
      });

      setLeads(list);
    } catch (error) {
      console.error("진단 신청 DB 불러오기 실패:", error);
    }
  };

  // 상담 상태 변경
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "leads", id), { status: newStatus });
      setLeads((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
      );
    } catch (error) {
      console.error("상태 변경 실패:", error);
      alert("상태 변경 중 오류가 발생했습니다.");
    }
  };

  // DB 삭제
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`'${name}' 사장님의 진단 신청 DB를 삭제하시겠습니까?`)) return;

    try {
      await deleteDoc(doc(db, "leads", id));
      setLeads((prev) => prev.filter((item) => item.id !== id));
      alert("삭제되었습니다.");
    } catch (error) {
      console.error("삭제 실패:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const isAdmin =
    currentUserRole === "admin" ||
    currentUserTeam === "본사/총괄 디렉터" ||
    currentUserTeam === "본사/관리자";

  // 검색 및 필터링
  const filteredLeads = leads.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.phone.includes(searchTerm) ||
      item.keyword.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "전체" ? true : item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent">
        <div className="font-bold text-gray-500 text-sm">권한 확인 중...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-transparent text-gray-900">
      <Sidebar currentMenu="leads" />

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto">
          {/* 상단 타이틀 */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-black flex items-center gap-2">
                <Database className="text-red-600" size={24} /> 진단 신청 DB 현황 (본사/관리자 전용)
              </h1>
              <p className="text-xs text-gray-500 font-bold mt-1">
                순위 진단 랜딩페이지(`/rank-check`)에서 실시간으로 접수된 사장님들의 리드 데이터입니다.
              </p>
            </div>
          </div>

          {!isAdmin ? (
            <div className="flex flex-col items-center justify-center p-12 md:p-20 bg-white rounded-3xl border border-gray-100 shadow-sm mt-8">
              <div className="p-4 bg-red-50 rounded-full mb-4 text-red-500">
                <Lock size={32} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">접근 권한 제한</h2>
              <p className="text-gray-500 text-xs font-medium text-center">
                진단 신청 DB 페이지는 **[본사/관리자]** 권한을 가진 계정만 접근할 수 있습니다.
              </p>
            </div>
          ) : (
            <>
              {/* 상단 현황 및 검색 바 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="text-xs font-bold text-gray-700">
                    전체 수집 DB: <span className="text-red-600 font-extrabold">{leads.length}건</span>
                  </div>

                  {/* 상태 필터 */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold bg-gray-50 outline-none focus:border-blue-600"
                  >
                    <option value="전체">전체 상태 보기</option>
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3.5 top-2.5 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="성함, 연락처, 키워드 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs font-bold bg-gray-50 outline-none focus:bg-white focus:border-blue-600 transition-all"
                  />
                </div>
              </div>

              {/* DB 테이블 */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-600 min-w-[1000px]">
                  <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-100">
                    <tr>
                      <th className="p-4 w-32">접수 일시</th>
                      <th className="p-4 w-28">사장님 성함</th>
                      <th className="p-4 w-36">연락처 (전화걸기)</th>
                      <th className="p-4 w-40">조회 희망 키워드</th>
                      <th className="p-4">네이버 플레이스 URL</th>
                      <th className="p-4 w-32 text-center">상담 진행 상태</th>
                      <th className="p-4 w-20 text-center">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {filteredLeads.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-gray-400 font-bold">
                          접수된 진단 신청 DB가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      filteredLeads.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                          <td className="p-4 text-gray-400 font-medium whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Clock size={13} />
                              {item.createdAt instanceof Date
                                ? item.createdAt.toLocaleString("ko-KR", {
                                    month: "2-digit",
                                    day: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "방금 전"}
                            </div>
                          </td>

                          <td className="p-4 font-bold text-gray-900">
                            <div className="flex items-center gap-1.5">
                              <User size={14} className="text-gray-400" />
                              {item.name}
                            </div>
                          </td>

                          <td className="p-4 font-black text-blue-600 whitespace-nowrap">
                            <a
                              href={`tel:${item.phone}`}
                              className="inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-all"
                              title="전화 걸기"
                            >
                              <Phone size={13} />
                              {item.phone.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3")}
                            </a>
                          </td>

                          <td className="p-4 font-bold text-gray-800">
                            <span className="bg-gray-100 px-2.5 py-1 rounded-md text-[11px]">
                              {item.keyword}
                            </span>
                          </td>

                          <td className="p-4">
                            {item.placeUrl ? (
                              <a
                                href={item.placeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-bold text-blue-600 hover:underline max-w-[280px] truncate"
                              >
                                <MapPin size={13} />
                                {item.placeUrl}
                                <ExternalLink size={11} />
                              </a>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>

                          <td className="p-4 text-center">
                            <select
                              value={item.status}
                              onChange={(e) => handleStatusChange(item.id, e.target.value)}
                              className={`px-2.5 py-1 rounded-xl text-xs font-bold outline-none border cursor-pointer ${
                                item.status === "신규 접수"
                                  ? "bg-red-50 border-red-200 text-red-600"
                                  : item.status === "상담 완료"
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                                  : item.status === "계약 진행"
                                  ? "bg-blue-50 border-blue-200 text-blue-600"
                                  : "bg-gray-50 border-gray-200 text-gray-600"
                              }`}
                            >
                              {STATUS_OPTIONS.map((st) => (
                                <option key={st} value={st}>
                                  {st}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleDelete(item.id, item.name)}
                              className="text-gray-300 hover:text-red-500 p-1.5 transition-colors"
                              title="DB 삭제"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}