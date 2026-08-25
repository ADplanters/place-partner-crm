"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  PhoneCall,
  FileText,
  FolderArchive,
  BookOpen,
  Users,
  Moon,
  Bell,
  LogOut,
  User,
} from "lucide-react";

const menuItems = [
  { name: "대시보드", href: "/dashboard", icon: LayoutDashboard },
  { name: "통합 일정", href: "/schedule", icon: Calendar },
  { name: "영업 결과 관리", href: "/sales", icon: PhoneCall },
  { name: "계약 관리", href: "/contracts", icon: FileText },
  { name: "서식 모음", href: "/forms", icon: FolderArchive },
  { name: "교육 자료", href: "/education", icon: BookOpen },
  { name: "팀원 관리", href: "/team", icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white p-4">
      {/* 로고 영역 */}
      <div className="mb-8 flex items-center gap-2 px-2 pt-2">
        <svg width="28" height="28" viewBox="0 0 100 100" fill="#D80B28">
          <g transform="translate(50, 50)">
            <rect x="-9" y="-44" width="18" height="36" rx="9" transform="rotate(0)" />
            <rect x="-9" y="-44" width="18" height="36" rx="9" transform="rotate(60)" />
            <rect x="-9" y="-44" width="18" height="36" rx="9" transform="rotate(120)" />
            <rect x="-9" y="-44" width="18" height="36" rx="9" transform="rotate(180)" />
            <rect x="-9" y="-44" width="18" height="36" rx="9" transform="rotate(240)" />
            <rect x="-9" y="-44" width="18" height="36" rx="9" transform="rotate(300)" />
            <circle cx="0" cy="0" r="16" />
          </g>
        </svg>
        <span className="text-xl font-black tracking-tight text-[#D80B28]">
          PLACE PARTNER
        </span>
      </div>

      {/* 네비게이션 메뉴 */}
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-[#E8F0FE] text-[#1A73E8]"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* 하단 프로필 및 컨트롤 영역 */}
      <div className="space-y-4 border-t border-gray-100 pt-4">
        <div className="flex items-center gap-2">
          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200">
            <Moon className="h-4 w-4" />
          </button>
          <button className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200">
            <Bell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
          </button>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-gray-50 p-2.5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <User className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">황현진</p>
              <p className="text-xs text-gray-500">영업 1팀</p>
            </div>
          </div>
          <Link href="/" className="text-gray-400 hover:text-gray-600">
            <LogOut className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}