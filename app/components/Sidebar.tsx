"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../firebase";
import { doc, getDoc, collection, getDocs, query, where, limit } from "firebase/firestore";
import {
  Moon,
  Sun,
  Bell,
  LogOut,
  LayoutDashboard,
  Calendar,
  PhoneCall,
  FileText,
  Folder,
  GraduationCap,
  Users as UsersIcon,
  Globe,
  User,
  Menu,
  X,
  Database,
} from "lucide-react";

interface SidebarProps {
  currentMenu: "dashboard" | "schedule" | "sales" | "contracts" | "forms" | "education" | "team" | "leads";
}

export default function Sidebar({ currentMenu }: SidebarProps) {
  const router = useRouter();
  const notificationRef = useRef<HTMLDivElement>(null);

  // 모바일 토글 메뉴 상태
  const [isOpen, setIsOpen] = useState(false);

  // 사용자, 관리자 여부 및 알림 상태
  const [userName, setUserName] = useState("사용자");
  const [userTeam, setUserTeam] = useState("영업팀");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 실시간 파이어베이스 알림 로딩
  const fetchRealNotifications = async () => {
    try {
      const realNotifs: any[] = [];
      const pendingSnap = await getDocs(query(collection(db, "users"), where("role", "==", "pending")));
      pendingSnap.forEach((docSnap) => {
        const u = docSnap.data();
        realNotifs.push({
          id: `user-${docSnap.id}`,
          title: "가입 승인 요청",
          desc: `${u.name || "신규 유저"} (${u.email}) 님이 승인 대기 중입니다.`,
          time: "승인 대기",
          read: false,
        });
      });

      const contractsSnap = await getDocs(query(collection(db, "contracts"), limit(5)));
      contractsSnap.forEach((docSnap) => {
        const c = docSnap.data();
        const clientName = c.clientName || c.companyName || c.customerName || "고객사";
        const amt = c.amount || c.contractAmount || 0;
        realNotifs.push({
          id: `contract-${docSnap.id}`,
          title: "계약 체결 완료",
          desc: `${clientName} - ₩${Number(amt).toLocaleString()} 계약 등록`,
          time: c.startDate || "최근",
          read: true,
        });
      });

      setNotifications(realNotifs);
    } catch (error) {
      console.error("알림 로딩 실패:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserName(user.displayName || "담당자");
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists()) {
          const uData = userSnap.data();
          setUserTeam(uData.team || "영업팀");

          // 본사/관리자 권한 판단
          const hasAdminRole =
            uData.role === "admin" ||
            uData.team === "본사/총괄 디렉터" ||
            uData.team === "본사/관리자";
          setIsAdmin(hasAdminRole);
        }
        fetchRealNotifications();
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // 기본 메뉴 목록
  const baseMenuItems = [
    { key: "dashboard", label: "대시보드", icon: LayoutDashboard, path: "/dashboard" },
    { key: "schedule", label: "통합 일정", icon: Calendar, path: "/schedule" },
    { key: "sales", label: "영업 결과 관리", icon: PhoneCall, path: "/sales" },
    { key: "contracts", label: "계약 관리", icon: FileText, path: "/contracts" },
    { key: "forms", label: "서식 모음", icon: Folder, path: "/forms" },
    { key: "education", label: "교육 자료", icon: GraduationCap, path: "/education" },
    { key: "team", label: "팀원 관리", icon: UsersIcon, path: "/team" },
  ];

  // 🌟 관리자 권한 있을 때만 '진단 신청 DB' 메뉴 추가
  const menuItems = isAdmin
    ? [
        ...baseMenuItems.slice(0, 3),
        { key: "leads", label: "진단 신청 DB", icon: Database, path: "/leads" },
        ...baseMenuItems.slice(3),
      ]
    : baseMenuItems;

  return (
    <>
      {/* 🌟 모바일 전용 상단 헤더 바 */}
      <div
        className={`md:hidden flex items-center justify-between px-4 py-3 border-b sticky top-0 z-40 w-full shadow-sm ${
          isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900"
        }`}
      >
        <div
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-1.5 cursor-pointer"
        >
          <span className="text-2xl font-black text-red-600 relative top-0.5 leading-[0]">*</span>
          <span className="text-lg font-black text-red-600 tracking-tight">PLACE PARTNER</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-1.5 focus:outline-none ${isDarkMode ? "text-gray-200" : "text-gray-600"}`}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* 🌟 모바일 메뉴 열림 시 불투명 백드롭 */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 🌟 사이드바 본체 */}
      <aside
        className={`fixed md:static top-0 left-0 z-50 h-full w-64 border-r flex flex-col justify-between p-6 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-100 text-gray-900"}`}
      >
        <div>
          {/* 로고 */}
          <div
            onClick={() => {
              setIsOpen(false);
              router.push("/dashboard");
            }}
            className="flex items-center gap-1.5 mb-10 cursor-pointer hover:opacity-80 transition-opacity"
            title="대시보드 홈으로 이동"
          >
            <span className="text-3xl font-black text-red-600 relative top-1 leading-[0]">*</span>
            <span className="text-xl font-black text-red-600 tracking-tight">PLACE PARTNER</span>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentMenu === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    setIsOpen(false);
                    router.push(item.path);
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all ${
                    isActive
                      ? "bg-blue-50 text-blue-600 shadow-sm"
                      : isDarkMode
                      ? "hover:bg-gray-700 text-gray-300"
                      : "hover:bg-gray-50 text-gray-600"
                  }`}
                >
                  <Icon size={18} /> {item.label}
                  {item.key === "leads" && (
                    <span className="ml-auto bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded-full font-black">
                      HOT
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* 하단 유틸리티 */}
        <div className="space-y-4 relative" ref={notificationRef}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2.5 rounded-full transition-all ${
                isDarkMode ? "bg-gray-700 text-yellow-400" : "bg-gray-100 text-gray-600"
              }`}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className={`relative p-2.5 rounded-full transition-all ${
                isDarkMode ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-600"
              }`}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>

            <a
              href="https://cafe.naver.com/bluebottlefollower"
              target="_blank"
              rel="noopener noreferrer"
              className={`p-2.5 rounded-full transition-all flex items-center justify-center ${
                isDarkMode ? "bg-gray-700 text-green-400" : "bg-green-50 text-[#03C75A]"
              }`}
            >
              <svg className="w-[18px] h-[18px] fill-current" viewBox="0 0 24 24">
                <path d="M16.273 12.845L7.376 0H0v24h7.727v-12.845L16.624 24H24V0h-7.727v12.845z" />
              </svg>
            </a>

            <a
              href="https://www.adplanters.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={`p-2.5 rounded-full transition-all ${
                isDarkMode ? "bg-gray-700 text-blue-400" : "bg-blue-50 text-blue-600"
              }`}
            >
              <Globe size={18} />
            </a>
          </div>

          {/* 알림 드롭다운 */}
          {isNotificationOpen && (
            <div
              className={`absolute bottom-16 left-0 w-80 rounded-2xl border shadow-xl p-4 z-50 transition-all ${
                isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-100 text-gray-900"
              }`}
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm">알림</h3>
                  {unreadCount > 0 && (
                    <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-bold">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <button onClick={markAllAsRead} className="text-xs text-blue-500 hover:underline">
                  모두 읽음
                </button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {notifications.length === 0 ? (
                  <div className="text-xs text-gray-400 text-center py-4">새로운 알림이 없습니다.</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-xl text-xs transition-all ${
                        n.read
                          ? isDarkMode
                            ? "bg-gray-700/50 text-gray-400"
                            : "bg-gray-50 text-gray-400"
                          : isDarkMode
                          ? "bg-gray-700 text-gray-100"
                          : "bg-blue-50/60 text-gray-800 font-medium"
                      }`}
                    >
                      <div className="font-bold mb-0.5">{n.title}</div>
                      <div className="text-gray-500 dark:text-gray-400 mb-1">{n.desc}</div>
                      <div className="text-[10px] text-gray-400">{n.time}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 프로필 카드 */}
          <div
            className={`flex items-center justify-between p-3 rounded-2xl border ${
              isDarkMode ? "bg-gray-700/50 border-gray-700" : "bg-gray-50 border-gray-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100/50 text-blue-600 flex items-center justify-center">
                <User size={16} strokeWidth={2.5} />
              </div>
              <div>
                <div className="text-xs font-bold">{userName}</div>
                <div className="text-[10px] text-gray-400">{userTeam}</div>
              </div>
            </div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}