"use client";

import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

interface UserData {
  uid: string;
  name: string;
  email: string;
  role: string;
  team: string;
  createdAt?: any;
}

export default function TeamPage() {
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [activeTab, setActiveTab] = useState<"pending" | "active">("pending");

  // 현재 로그인한 유저의 권한 확인 및 목록 불러오기
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

  // 사용자 목록 조회
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

  // 가입 승인 처리
  const handleApprove = async (uid: string, targetRole: "user" | "admin") => {
    try {
      await updateDoc(doc(db, "users", uid), {
        role: targetRole,
        team: targetRole === "admin" ? "본사/관리자" : "영업팀",
      });
      alert(`[${targetRole === "admin" ? "관리자" : "일반 사용자"}] 권한으로 승인되었습니다.`);
      fetchUsers();
    } catch (error) {
      console.error("승인 실패:", error);
      alert("승인 처리 중 오류가 발생했습니다.");
    }
  };

  // 가입 거절 및 삭제 처리
  const handleReject = async (uid: string) => {
    if (!confirm("정말 이 가입 요청을 거절하고 삭제하시겠습니까?")) return;
    try {
      await deleteDoc(doc(db, "users", uid));
      alert("가입 요청이 삭제되었습니다.");
      fetchUsers();
    } catch (error) {
      console.error("삭제 실패:", error);
      alert("처리 중 오류가 발생했습니다.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500 font-bold">
        사용자 정보를 확인하는 중입니다...
      </div>
    );
  }

  if (currentUserRole !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center text-red-500 font-bold">
        접근 권한이 없습니다. 관리자 계정으로 접속해 주세요.
      </div>
    );
  }

  const pendingUsers = users.filter((u) => u.role === "pending");
  const activeUsers = users.filter((u) => u.role !== "pending");

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">팀 및 사용자 승인 관리</h1>
      </div>

      {/* 탭 버튼 */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("pending")}
          className={`pb-3 px-4 font-bold border-b-2 transition-all ${
            activeTab === "pending"
              ? "border-red-600 text-red-600"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          승인 대기 목록 ({pendingUsers.length})
        </button>
        <button
          onClick={() => setActiveTab("active")}
          className={`pb-3 px-4 font-bold border-b-2 transition-all ${
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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {pendingUsers.length === 0 ? (
            <div className="p-12 text-center text-gray-400 font-medium">
              현재 승인 대기 중인 사용자가 없습니다.
            </div>
          ) : (
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-100">
                <tr>
                  <th className="p-4">이름</th>
                  <th className="p-4">이메일</th>
                  <th className="p-4 text-center">승인 / 거절</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-100">
              <tr>
                <th className="p-4">이름</th>
                <th className="p-4">이메일</th>
                <th className="p-4">소속 팀</th>
                <th className="p-4">권한</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activeUsers.map((u) => (
                <tr key={u.uid} className="hover:bg-gray-50">
                  <td className="p-4 font-bold text-gray-900">{u.name}</td>
                  <td className="p-4">{u.email}</td>
                  <td className="p-4">{u.team || "미배정"}</td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
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
    </div>
  );
}