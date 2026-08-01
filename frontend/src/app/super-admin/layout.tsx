"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  BarChart3,
  LogOut,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Bell,
  Menu,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { superAdminApi } from "@/lib/api";
import { initials } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/super-admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/super-admin/schools", icon: Building2, label: "Schools" },
  { href: "/super-admin/billing", icon: CreditCard, label: "Billing" },
  { href: "/super-admin/analytics", icon: BarChart3, label: "Analytics" },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, hydrate } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { hydrate(); }, [hydrate]);

  const handleLogout = async () => {
    try { await superAdminApi.logout(); } catch {}
    logout();
    router.push("/login");
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-800/60 ${collapsed ? "justify-center" : ""}`}>
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="font-bold text-white text-sm leading-tight">EduSuite</p>
            <p className="text-purple-400 text-xs flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Super Admin
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                active
                  ? "bg-purple-600/20 text-purple-400 border border-purple-500/30"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
              }`}
              onClick={() => setMobileOpen(false)}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-purple-400" : "text-slate-500 group-hover:text-white"}`} />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User & Branding */}
      <div className={`px-3 pb-4 border-t border-slate-800/60 pt-3 ${collapsed ? "flex flex-col items-center gap-2" : ""}`}>
        {!collapsed && user && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-800/40 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-xs font-bold text-white">
              {initials(user.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all w-full mb-3 ${collapsed ? "justify-center" : ""}`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && "Sign Out"}
        </button>

        {!collapsed && (
          <div className="px-3 text-center border-t border-slate-800/40 pt-3">
            <p className="text-[11px] text-slate-500 font-medium">Developed by</p>
            <p className="text-xs font-semibold text-purple-400 tracking-wide mt-0.5">Aivora Technologies</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col bg-slate-900/80 backdrop-blur-xl border-r border-slate-800/60 transition-all duration-300 flex-shrink-0 ${collapsed ? "w-16" : "w-60"}`}>
        {renderSidebarContent()}
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute left-full ml-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors z-10"
          style={{ position: "fixed", left: collapsed ? "52px" : "228px" }}
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-60 bg-slate-900 border-r border-slate-800/60 flex flex-col">
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60 bg-slate-900/50 backdrop-blur-xl flex-shrink-0">
          <button
            className="md:hidden text-slate-400 hover:text-white"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden md:block">
            <h2 className="text-sm font-semibold text-slate-200">
              {NAV_ITEMS.find(n => pathname.startsWith(n.href))?.label ?? "Super Admin"}
            </h2>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <button className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all">
              <Bell className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-xs font-bold text-white">
              {user ? initials(user.name) : "SA"}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
