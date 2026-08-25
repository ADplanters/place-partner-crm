"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { Plus, Users, Mail, Phone, UserCheck, Trash2, X, Edit2, Shield } from "lucide-react";
import { db } from "../../firebase";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from "firebase/firestore";

interface TeamMember {
  id: string;
  name: string;
  team: string;
  role: string;
  email: string;
  phone: string;
  status: string;
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // 폼 입력 상태
  const [name, setName] = useState("");
  const [team, setTeam] = useState("영업 1팀");
  const [role, setRole] = useState("팀원");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("재직중");

  // 1. Firebase에서 팀원 목록 불러오기
  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, "teamMembers"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const data: TeamMember[] = [];
      querySnapshot.forEach((docSnapshot) => {
        data.push({ id: docSnapshot.id, ...docSnapshot.data() } as TeamMember);
      });
      setMembers(data);
    } catch (error) {
      console.error("팀원 목록 불러오기 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // 모달 열기 (추가 / 수정 공용)
  const openModal = (member?: TeamMember) => {
    if (member) {
      setEditingId(member.id);
      setName(member.name);
      setTeam(member.team);
      setRole(member.role);
      setEmail(member.email || "");
      setPhone(member.phone || "");
      setStatus(member.status || "재직중");
    } else {
      setEditingId(null);
      setName("");
      setTeam("영업 1팀");
      setRole("팀원");
      setEmail("");
      setPhone("");
      setStatus("재직중");
    }
    setIsModalOpen(true);
  };

  // 2. 팀원 추가 또는 수정 저장
  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      if (editingId) {
        // 수정
        const docRef = doc(db, "teamMembers", editingId);
        await updateDoc(docRef, { name, team, role, email, phone, status });
        setMembers(members.map((m) => (m.id === editingId ? { ...m, name, team, role, email, phone, status } : m)));
      } else {
        // 신규 추가
        const newMember = {
          name,
          team,
          role,
          email,
          phone,
          status,
          createdAt: serverTimestamp(),
        };
        const docRef = await addDoc(collection(db, "teamMembers"), newMember);
        setMembers([{ id: docRef.id, ...newMember } as TeamMember, ...members]);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("팀원 저장 실패:", error);
      alert("팀원 정보를 저장하는 중 오류가 발생했습니다.");
    }
  };

  // 3. 팀원 삭제
  const handleDeleteMember = async (id: string) => {
    if (!confirm("해당 팀원 정보를 삭제하시겠습니까?")) return;
    try {
      await deleteDoc(doc(db, "teamMembers", id));
      setMembers(members.filter((m) => m.id !== id));
    } catch (error) {
      console.error("팀원 삭제 실패:", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <Sidebar />

      <main className="relative flex-1 p-8 h-screen overflow-y-auto">
        {/* 상단 타이틀 & 버튼 */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <Users className="h-6 w-6 text-blue-600" />
              팀원 관리
            </h1>
            <p className="mt-1 text-xs text-gray-500">
              영업 팀원들의 권한, 직급, 소속 팀 및 상태를 한눈에 관리합니다.
            </p>
          </div>

          <button
            onClick={() => openModal()}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> 팀원 추가
          </button>
        </div>

        {/* 요약 지표 */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400">전체 팀원</p>
            <p className="mt-2 text-2xl font-black text-gray-900">{members.length} 명</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400">영업 1팀</p>
            <p className="mt-2 text-2xl font-black text-blue-600">
              {members.filter((m) => m.team === "영업 1팀").length} 명
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400">영업 2팀</p>
            <p className="mt-2 text-2xl font-black text-purple-600">
              {members.filter((m) => m.team === "영업 2팀").length} 명
            </p>
          </div>
        </div>

        {/* 팀원 그리드 카드 */}
        {isLoading ? (
          <div className="p-12 text-center text-xs text-gray-400">팀원 목록을 불러오는 중입니다...</div>
        ) : members.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center text-xs text-gray-400">
            등록된 팀원이 없습니다. [팀원 추가] 버튼을 눌러 구성원을 등록해 보세요.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-5">
            {members.map((member) => (
              <div key={member.id} className="relative rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 font-bold text-sm">
                      {member.name.slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{member.name}</h3>
                      <p className="text-xs text-gray-400">{member.team} · {member.role}</p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      member.status === "재직중" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {member.status}
                  </span>
                </div>

                <div className="mt-4 space-y-1.5 border-t border-gray-50 pt-3 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                    <span>{member.email || "이메일 미입력"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                    <span>{member.phone || "연락처 미입력"}</span>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2 border-t border-gray-50 pt-3">
                  <button
                    onClick={() => openModal(member)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-blue-600"
                  >
                    <Edit2 className="h-3 w-3" /> 수정
                  </button>
                  <button
                    onClick={() => handleDeleteMember(member.id)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-red-600"
                  >
                    <Trash2 className="h-3 w-3" /> 삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 팀원 추가/수정 모달 */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-bold text-gray-900">
                  {editingId ? "팀원 정보 수정" : "새 팀원 추가"}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveMember} className="space-y-3 text-xs font-medium text-gray-700">
                <div>
                  <label className="mb-1 block font-bold">이름 / 명칭</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="예: 매니저 1"
                    className="w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block font-bold">소속 팀</label>
                    <select
                      value={team}
                      onChange={(e) => setTeam(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 p-2.5 outline-none"
                    >
                      <option value="영업 1팀">영업 1팀</option>
                      <option value="영업 2팀">영업 2팀</option>
                      <option value="운영팀">운영팀</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block font-bold">직급 / 역할</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 p-2.5 outline-none"
                    >
                      <option value="팀장">팀장</option>
                      <option value="팀원">팀원</option>
                      <option value="파트너">파트너</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-bold">이메일</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@placepartner.com"
                    className="w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold">연락처</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="010-0000-0000"
                    className="w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold">상태</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-2.5 outline-none"
                  >
                    <option value="재직중">재직중</option>
                    <option value="휴직">휴직</option>
                    <option value="퇴사">퇴사</option>
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
                    저장하기
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