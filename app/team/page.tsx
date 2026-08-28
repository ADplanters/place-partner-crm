"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar"; // 사이드바 컴포넌트 불러오기
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { Users } from "lucide-react";

interface UserData {
  uid: string;
  name: string;
  email: string;
  role: string;
  team: string;
  createdAt?: any;
}

// 🌟 미슐랭 가이드 컨셉 소속 팀 옵션
const TEAM_OPTIONS = [
  "본사/총괄 디렉터",
  "3-Star 수석 매니저",
  "2-Star 전문 매니저",
  "1-Star 어드바이저",
  "미배정",
];

export default function TeamPage() {
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [activeTab, setActiveTab] = useState<"pending" | "active">("pending");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const role = userSnap.data().role;
          setCurrentUserRole(role);
          if (role === "admin") {
            fetchUsers();
          }
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const userList: UserData[] = [];
      querySnapshot.forEach((docSnap) => {
        userList.push({ uid: docSnap.id, ...docSnap.data() } as UserData);
      });
      setUsers(userList);
    } catch (error) {
      console.error("유저 목록 불러오기 실패:", error);
    }
  };

  // 🌟 소속 팀 변경 핸들러 (파이어베이스 DB 실시간 반영)
  const handleTeamChange = async (uid: string, newTeam: string) => {
    try {
      await updateDoc(doc(db, "users", uid), { team: newTeam });
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, team: newTeam } : u))
      );
      alert("소속 팀이 정상적으로 변경되었습니다.");
    } catch (error) {
      console.error("팀 변경 실패:", error);
      alert("소속 팀 변경 중 오류가 발생했습니다.");
    }
  };

  const handleApprove = async (uid: string, targetRole: "user" | "admin") => {
    try {
      await updateDoc(doc(db, "users", uid), {
        role: targetRole,
        team: targetRole === "admin" ? "본사/총괄 디렉터" : "1-Star 어드바이저",
      });
      alert(`[${targetRole === "admin" ? "관리자" : "일반 사용자"}] 권한으로 승인되었습니다.`);
      fetchUsers();
    } catch (error) {
      alert("승인 처리 중 오류가 발생했습니다.");
    }
  };

  const handleReject = async (uid: string) => {
    if (!confirm("정말 이 가입 요청을 거절하고 삭제하시겠습니까?")) return;
    try {
      await deleteDoc(doc(db, "users", uid));
      alert("가입 요청이 삭제되었습니다.");
      fetchUsers();
    } catch (error) {
      alert("처리 중 오류가 발생했습니다.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent">
        <div className="font-bold text-gray-500">권한 확인 중...</div>
      </div>
    );
  }

  const pendingUsers = users.filter((u) => u.role === "pending");
  const activeUsers = users.filter((u) => u.role !== "pending");

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-transparent text-gray-900">
      <Sidebar currentMenu="team" />

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {/* 상단 헤더 */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-black flex items-center gap-2">
                <Users className="text-blue-600" size={24} /> 팀원 및 권한 관리
              </h1>
              <p className="text-xs text-gray-500 font-bold mt-1">
                신규 가입자를 승인하고 팀원의 권한을 관리하세요.
              </p>
            </div>
          </div>

          {currentUserRole !== "admin" ? (
            <div className="flex flex-col items-center justify-center p-12 md:p-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div className="text-4xl mb-4">🔒</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">접근 권한 없음</h2>
              <p className="text-gray-500 text-sm font-medium text-center">
                관리자 계정으로 로그인해야 열람할 수 있습니다.
              </p>
            </div>
          ) : (
            <>
              {/* 탭 버튼 */}
              <div className="flex border-b border-gray-200 mb-6">
                <button
                  onClick={() => setActiveTab("pending")}
                  className={`pb-3 px-4 font-bold text-xs md:text-sm border-b-2 transition-all ${
                    activeTab === "pending"
                      ? "border-red-600 text-red-600"
                      : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}
                >
                  승인 대기 목록 ({pendingUsers.length})
                </button>
                <button
                  onClick={() => setActiveTab("active")}
                  className={`pb-3 px-4 font-bold text-xs md:text-sm border-b-2 transition-all ${
                    activeTab === "active"
                      ? "border-red-600 text-red-600"
                      : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}
                >
                  승인 완료 목록 ({activeUsers.length})
                </button>
              </div>

              {/* 승인 대기 탭 */}
              {activeTab === "pending" && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                  {pendingUsers.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 font-medium text-xs">
                      현재 승인 대기 중인 사용자가 없습니다.
                    </div>
                  ) : (
                    <table className="w-full text-left text-sm text-gray-600 min-w-[600px]">
                      <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-100 text-xs">
                        <tr>
                          <th className="p-4">이름</th>
                          <th className="p-4">이메일</th>
                          <th className="p-4 text-center">승인 / 거절</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-xs">
                        {pendingUsers.map((u) => (
                          <tr key={u.uid} className="hover:bg-gray-50">
                            <td className="p-4 font-bold text-gray-900">{u.name}</td>
                            <td className="p-4">{u.email}</td>
                            <td className="p-4 text-center">
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() => handleApprove(u.uid, "user")}
                                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 text-xs transition-all shadow-sm"
                                >
                                  일반유저 승인
                                </button>
                                <button
                                  onClick={() => handleApprove(u.uid, "admin")}
                                  className="px-3 py-1.5 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 text-xs transition-all shadow-sm"
                                >
                                  관리자 승인
                                </button>
                                <button
                                  onClick={() => handleReject(u.uid)}
                                  className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg font-bold hover:bg-red-50 hover:text-red-600 text-xs transition-all"
                                >
                                  거절
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* 승인 완료 탭 */}
              {activeTab === "active" && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600 min-w-[600px]">
                    <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-100 text-xs">
                      <tr>
                        <th className="p-4">이름</th>
                        <th className="p-4">이메일</th>
                        <th className="p-4">소속 팀</th>
                        <th className="p-4">권한</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {activeUsers.map((u) => (
                        <tr key={u.uid} className="hover:bg-gray-50">
                          <td className="p-4 font-bold text-gray-900">{u.name}</td>
                          <td className="p-4">{u.email}</td>
                          <td className="p-4">
                            {/* 소속 팀 드롭다운 메뉴 */}
                            <select
                              value={u.team || "미배정"}
                              onChange={(e) => handleTeamChange(u.uid, e.target.value)}
                              className="border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 font-medium text-xs shadow-sm"
                            >
                              {TEAM_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                u.role === "admin"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {u.role === "admin" ? "관리자" : "일반유저"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}