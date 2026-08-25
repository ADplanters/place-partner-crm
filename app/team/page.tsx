"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { Users, UserCheck, Shield, Clock, CheckCircle, Trash2 } from "lucide-react";
import { db } from "../../firebase";
import { collection, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";

interface UserRecord {
  id: string;
  uid: string;
  name: string;
  email: string;
  role: string; // admin, manager, member, pending
  team: string;
}

export default function TeamPage() {
  const [activeTab, setActiveTab] = useState("전체 팀원");
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Firestore에서 users 데이터 가져오기
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const data: UserRecord[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as UserRecord);
      });
      setUsers(data);
    } catch (error) {
      console.error("유저 불러오기 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 1. 신규 가입자 승인 (기본 권한: member, 영업 1팀)
  const approveUser = async (userId: string) => {
    if (!confirm("이 유저의 가입을 승인하시겠습니까?")) return;
    try {
      await updateDoc(doc(db, "users", userId), { role: "member", team: "영업 1팀" });
      alert("승인 완료되었습니다.");
      fetchUsers();
    } catch (error) {
      console.error("승인 실패:", error);
    }
  };

  // 2. 권한 및 팀 수정 (실시간 자동 저장)
  const handleUpdateRole = async (userId: string, field: string, value: string) => {
    try {
      await updateDoc(doc(db, "users", userId), { [field]: value });
      setUsers(users.map(u => u.id === userId ? { ...u, [field]: value } : u));
    } catch (error) {
      console.error("업데이트 실패:", error);
    }
  };

  // 3. 유저 삭제 (거절/퇴사)
  const deleteUser = async (userId: string) => {
    if (!confirm("해당 계정을 시스템에서 완전히 삭제하시겠습니까? (삭제 시 로그인 불가)")) return;
    try {
      await deleteDoc(doc(db, "users", userId));
      setUsers(users.filter((u) => u.id !== userId));
    } catch (error) {
      console.error("삭제 실패:", error);
    }
  };

  // 데이터 필터링 (승인된 멤버 vs 승인 대기자)
  const activeMembers = users.filter((u) => u.role !== "pending");
  const pendingMembers = users.filter((u) => u.role === "pending");

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <Sidebar />

      <main className="relative flex-1 p-8 h-screen overflow-y-auto">
        <div className="mb-6">
          <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <Users className="h-6 w-6 text-blue-600" /> 팀원 및 권한 관리
          </h1>
          <p className="mt-1 text-xs text-gray-500">가입 승인 및 직급(권한)을 설정하여 데이터 접근을 제어합니다.</p>
        </div>

        {/* 상단 탭 */}
        <div className="mb-6 flex gap-2 border-b border-gray-200 pb-px">
          <button
            onClick={() => setActiveTab("전체 팀원")}
            className={`px-4 py-2 text-sm font-bold transition-colors ${
              activeTab === "전체 팀원" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            승인된 팀원 ({activeMembers.length})
          </button>
          <button
            onClick={() => setActiveTab("가입 대기")}
            className={`flex items-center gap-1 px-4 py-2 text-sm font-bold transition-colors ${
              activeTab === "가입 대기" ? "border-b-2 border-red-600 text-red-600" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            가입 승인 대기 <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] text-red-600">{pendingMembers.length}</span>
          </button>
        </div>

        {/* 탭 내용 */}
        {isLoading ? (
          <div className="p-12 text-center text-xs text-gray-400">데이터를 불러오는 중입니다...</div>
        ) : activeTab === "가입 대기" ? (
          /* [가입 대기 탭] */
          <div className="space-y-3">
            {pendingMembers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center text-xs text-gray-400">
                대기 중인 가입 신청이 없습니다.
              </div>
            ) : (
              pendingMembers.map((user) => (
                <div key={user.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100"><Clock className="h-5 w-5 text-gray-400" /></div>
                    <div>
                      <h3 className="font-bold text-gray-900">{user.name}</h3>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => deleteUser(user.id)} className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50">거절 (삭제)</button>
                    <button onClick={() => approveUser(user.id)} className="flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700">
                      <CheckCircle className="h-4 w-4"/> 승인하기
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* [승인된 팀원 탭] */
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="border-b border-gray-100 bg-gray-50 text-gray-500">
                <tr>
                  <th className="p-4 font-semibold">이름</th>
                  <th className="p-4 font-semibold">이메일</th>
                  <th className="p-4 font-semibold">소속 팀</th>
                  <th className="p-4 font-semibold">권한 (Role)</th>
                  <th className="p-4 font-semibold text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {activeMembers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50">
                    <td className="p-4 font-bold text-gray-900">{user.name}</td>
                    <td className="p-4 text-gray-500">{user.email}</td>
                    <td className="p-4">
                      <select 
                        value={user.team} 
                        onChange={(e) => handleUpdateRole(user.id, "team", e.target.value)}
                        className="rounded-lg border border-gray-200 p-1.5 outline-none focus:border-blue-500 bg-white"
                      >
                        <option value="영업 1팀">영업 1팀</option>
                        <option value="영업 2팀">영업 2팀</option>
                        <option value="운영팀">운영팀</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <select 
                        value={user.role} 
                        onChange={(e) => handleUpdateRole(user.id, "role", e.target.value)}
                        className={`rounded-lg p-1.5 font-bold outline-none border ${
                          user.role === "admin" ? "bg-red-50 text-red-600 border-red-200" : 
                          user.role === "manager" ? "bg-purple-50 text-purple-600 border-purple-200" : "bg-blue-50 text-blue-600 border-blue-200"
                        }`}
                      >
                        <option value="admin">⭐ 최고 관리자</option>
                        <option value="manager">🛡️ 팀장 (수정/삭제 가능)</option>
                        <option value="member">👤 팀원 (열람/본인글 등록)</option>
                      </select>
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => deleteUser(user.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}