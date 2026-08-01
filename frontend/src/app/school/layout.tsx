"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calendar,
  CreditCard,
  BookOpen,
  Award,
  FileText,
  Clock,
  Receipt,
  DollarSign,
  Bell,
  Settings,
  LogOut,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { schoolApi } from "@/lib/api";
import { initials } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AivoraLogo } from "@/components/AivoraLogo";

const ALL_NAV = [
  { href: "/school/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ["principal", "teacher", "accountant"] },
  { href: "/school/students", icon: Users, label: "Students", roles: ["principal", "teacher"] },
  { href: "/school/teachers", icon: GraduationCap, label: "Teachers & Staff", roles: ["principal"] },
  { href: "/school/attendance", icon: Calendar, label: "Attendance", roles: ["principal", "teacher"] },
  { href: "/school/fees", icon: CreditCard, label: "Fees", roles: ["principal", "accountant"] },
  { href: "/school/expenses", icon: Receipt, label: "Expenses", roles: ["principal", "accountant"] },
  { href: "/school/salaries", icon: DollarSign, label: "Staff Salaries", roles: ["principal", "accountant"] },
  { href: "/school/exams", icon: BookOpen, label: "Exams", roles: ["principal", "teacher"] },
  { href: "/school/results", icon: Award, label: "Results", roles: ["principal", "teacher"] },
  { href: "/school/report-cards", icon: FileText, label: "Report Cards", roles: ["principal", "teacher", "accountant"] },
  { href: "/school/timetable", icon: Clock, label: "Timetable", roles: ["principal", "teacher"] },
  { href: "/school/notifications", icon: Bell, label: "Notifications", roles: ["principal", "teacher", "accountant"] },
  { href: "/school/settings", icon: Settings, label: "Settings", roles: ["principal"] },
];

export default function SchoolLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser, logout, hydrate } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    hydrate();
    async function loadMe() {
      try {
        const res = await schoolApi.me();
        const meUser = res.data?.data?.user ?? res.data?.data;
        if (meUser && meUser.name) {
          setUser(meUser);
        }
      } catch {}
    }
    loadMe();
  }, [hydrate, setUser]);

  const role = user?.role ?? "principal";
  const navItems = ALL_NAV.filter((n) => n.roles.includes(role));

  const handleLogout = async () => {
    try { await schoolApi.logout(); } catch {}
    logout();
    router.push("/login");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900/90 text-slate-800 dark:text-slate-200">
      {/* Brand & Logo Header */}
      <div className={`px-4 py-4 border-b border-slate-200 dark:border-slate-800/80 ${collapsed ? "flex justify-center" : ""}`}>
        {collapsed ? (
          <AivoraLogo size="sm" showText={false} />
        ) : (
          <div className="flex flex-col gap-2">
            <AivoraLogo size="md" showText={true} />
            {user?.school?.name && (
              <div className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 truncate">
                  {user.school.name}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                  {user.role}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                active
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 dark:bg-emerald-500/20"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200"}`} />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User profile & Logout */}
      <div className="px-3 pb-4 border-t border-slate-200 dark:border-slate-800/80 pt-3 space-y-2">
        {!collapsed && user && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm">
              {initials(user.name, role ? role[0].toUpperCase() : "P")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">{user.name || "Principal User"}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate capitalize">{user.role || "principal"}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all w-full ${collapsed ? "justify-center" : ""}`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && "Sign Out"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden text-slate-900 dark:text-slate-100 transition-colors">
      {/* Desktop sidebar */}
      <aside className={`hidden md:flex flex-col bg-white dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800/60 transition-all duration-300 flex-shrink-0 ${collapsed ? "w-16" : "w-60"}`}>
        <SidebarContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{ position: "fixed", left: collapsed ? "52px" : "228px" }}
          className="w-6 h-6 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-sm transition-colors z-20 top-1/2 -translate-y-1/2"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content viewport */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white" onClick={() => setMobileOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-tight">
              {navItems.find((n) => pathname.startsWith(n.href))?.label ?? "Dashboard"}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* Notification bell */}
            <button className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
              <Bell className="w-4 h-4" />
            </button>

            {/* Profile Avatar */}
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
              {initials(user?.name, role ? role[0].toUpperCase() : "P")}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
