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
  Users,
  Globe,
} from "lucide-react";

interface SidebarProps {
  currentMenu: "dashboard" | "schedule" | "sales" | "contracts" | "forms" | "education" | "team";
}

export default function Sidebar({ currentMenu }: SidebarProps) {
  const router = useRouter();
  const notificationRef = useRef<HTMLDivElement>(null);

  const [userName, setUserName] = useState("사용자");
  const [userTeam, setUserTeam] = useState("영업팀");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // 알림창 바깥 영역 클릭 시 자동으로 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 실제 DB 알림 데이터 조회 (가입 승인 대기 유저 + 최근 계약 건)
  const fetchRealNotifications = async () => {
    try {
      const realNotifs: any[] = [];

      // 1. 가입 승인 대기 중인 사용자
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

      // 2. 최근 체결된 계약 데이터
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
      console.error("알림 로딩 오류:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserName(user.displayName || "담당자");
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists()) {
          setUserTeam(userSnap.data().team || "영업팀");
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

  const menuItems = [
    { key: "dashboard", label: "대시보드", icon: LayoutDashboard, path: "/dashboard" },
    { key: "schedule", label: "통합 일정", icon: Calendar, path: "/schedule" },
    { key: "sales", label: "영업 결과 관리", icon: PhoneCall, path: "/sales" },
    { key: "contracts", label: "계약 관리", icon: FileText, path: "/contracts" },
    { key: "forms", label: "서식 모음", icon: Folder, path: "/forms" },
    { key: "education", label: "교육 자료", icon: GraduationCap, path: "/education" },
    { key: "team", label: "팀원 관리", icon: Users, path: "/team" },
  ];

  return (
    <aside className={`w-64 border-r flex flex-col justify-between p-6 ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-100 text-gray-900"}`}>
      <div>
        {/* 로고 클릭 시 대시보드 이동 */}
        <div
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 mb-10 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <span className="text-3xl font-black text-red-600">*</span>
          <span className="text-xl font-black text-red-600 tracking-tight">PLACE PARTNER</span>
        </div>

        {/* 네비게이션 메뉴 */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentMenu === item.key;
            return (
              <button
                key={item.key}
                onClick={() => router.push(item.path)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : isDarkMode
                    ? "hover:bg-gray-700 text-gray-300"
                    : "hover:bg-gray-50 text-gray-600"
                }`}
              >
                <Icon size={18} /> {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 하단 제어 및 알림창 (외부 클릭 자동 닫기 적용) */}
      <div className="space-y-4 relative" ref={notificationRef}>
        <div className="flex items-center gap-2">
          {/* 다크모드 토글 */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2.5 rounded-full transition-all ${isDarkMode ? "bg-gray-700 text-yellow-400" : "bg-gray-100 text-gray-600"}`}
            title="다크모드"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* 알림창 버튼 */}
          <button
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className={`relative p-2.5 rounded-full transition-all ${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-600"}`}
            title="알림창"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>

          {/* 네이버 카페 링크 */}
          <a
            href="https://cafe.naver.com/bluebottlefollower"
            target="_blank"
            rel="noopener noreferrer"
            className={`p-2.5 rounded-full transition-all flex items-center justify-center ${isDarkMode ? "bg-gray-700 text-green-400" : "bg-green-50 text-[#03C75A]"}`}
            title="네이버 카페 바로가기"
          >
            <svg className="w-[18px] h-[18px] fill-current" viewBox="0 0 24 24">
              <path d="M16.273 12.845L7.376 0H0v24h7.727v-12.845L16.624 24H24V0h-7.727v12.845z" />
            </svg>
          </a>

          {/* 공식 홈페이지 링크 */}
          <a
            href="https://www.adplanters.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={`p-2.5 rounded-full transition-all ${isDarkMode ? "bg-gray-700 text-blue-400" : "bg-blue-50 text-blue-600"}`}
            title="공식 홈페이지 바로가기"
          >
            <Globe size={18} />
          </a>
        </div>

        {/* 알림 팝업 창 */}
        {isNotificationOpen && (
          <div className={`absolute bottom-16 left-0 w-80 rounded-2xl border shadow-xl p-4 z-50 transition-all ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-100 text-gray-900"}`}>
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
                        ? isDarkMode ? "bg-gray-700/50 text-gray-400" : "bg-gray-50 text-gray-400"
                        : isDarkMode ? "bg-gray-700 text-gray-100" : "bg-blue-50/60 text-gray-800 font-medium"
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

        {/* 유저 프로필 및 로그아웃 */}
        <div className={`flex items-center justify-between p-3 rounded-2xl border ${isDarkMode ? "bg-gray-700/50 border-gray-700" : "bg-gray-50 border-gray-100"}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
              {userName.slice(0, 1)}
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
  );
}