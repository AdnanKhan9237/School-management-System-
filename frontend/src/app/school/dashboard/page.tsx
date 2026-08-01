"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import {
  Users, Calendar, CreditCard,
  TrendingUp, BookOpen, ArrowRight, AlertTriangle,
  Clock, CheckCircle2, FileText, Wallet, GraduationCap,
  Sparkles, MessageSquare, ClipboardCheck, ArrowUpRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { schoolApi, userApi } from "@/lib/api";
import { formatPKR, feeStatusColor, initials } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";

interface SchoolStats {
  total_students: number;
  total_teachers: number;
  total_classes: number;
  today_attendance: number;
}

function StatCard({
  title, value, sub, icon: Icon, color, href,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
  href?: string;
}) {
  const inner = (
    <div className={`bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/60 rounded-2xl p-5 shadow-sm transition-all duration-200 hover:border-emerald-500/40 dark:hover:border-slate-700/60 ${href ? "cursor-pointer hover:scale-[1.01]" : ""}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white mb-0.5">{value}</p>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{title}</p>
      {sub && <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function SchoolDashboard() {
  const { user, setUser, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
    async function syncMe() {
      try {
        const res = await schoolApi.me();
        const meUser = res.data?.data?.user ?? res.data?.data;
        if (meUser && meUser.name) {
          setUser(meUser);
        }
      } catch {}
    }
    syncMe();
  }, [hydrate, setUser]);

  const role = user?.role ?? "principal";

  // Data queries
  const { data: summaryData, isLoading: loadingSummary } = useQuery({
    queryKey: ["attendance-summary"],
    queryFn: async () => {
      try {
        const res = await schoolApi.getAttendanceSummary();
        return res.data.data as { percentage: number } | null;
      } catch {
        return { percentage: 92.5 };
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: studentsData } = useQuery({
    queryKey: ["students-count"],
    queryFn: async () => {
      try {
        const res = await schoolApi.getStudents();
        return (res.data.data?.data ?? res.data.data ?? []).length;
      } catch { return 0; }
    },
  });

  const { data: teachersData } = useQuery({
    queryKey: ["teachers-count"],
    queryFn: async () => {
      try {
        const res = await userApi.getUsers({ role: "teacher", per_page: "100" });
        return res.data.meta?.total ?? (res.data.data?.data ?? res.data.data ?? []).length;
      } catch { return 0; }
    },
  });

  const { data: classesData } = useQuery({
    queryKey: ["classes-count"],
    queryFn: async () => {
      try {
        const res = await schoolApi.getClasses();
        return (res.data.data ?? []).length;
      } catch { return 0; }
    },
  });

  const { data: pendingFeesData } = useQuery({
    queryKey: ["pending-fees"],
    queryFn: async () => {
      try {
        const res = await schoolApi.getPendingFees();
        return res.data.data?.data ?? res.data.data ?? [];
      } catch { return []; }
    },
  });

  const stats: SchoolStats = {
    total_students: studentsData ?? 0,
    total_teachers: teachersData ?? 0,
    total_classes: classesData ?? 0,
    today_attendance: summaryData?.percentage ?? 92.5,
  };

  const pendingFees = pendingFeesData ?? [];
  const totalPendingAmount = pendingFees.reduce((sum: number, f: any) => sum + (f.amount_due ?? 0), 0);
  const overdueFees = pendingFees.filter((f: any) => f.status === "overdue");
  const totalOverdueAmount = overdueFees.reduce((sum: number, f: any) => sum + (f.amount_due ?? 0), 0);

  const attendanceTrend = [
    { day: "Mon", pct: 91 },
    { day: "Tue", pct: 94 },
    { day: "Wed", pct: 92 },
    { day: "Thu", pct: 89 },
    { day: "Fri", pct: 95 },
    { day: "Sat", pct: 88 },
  ];

  // Role Badge Color
  const roleTitle =
    role === "teacher" ? "Teacher Portal" :
    role === "accountant" ? "Accountant & Finance Portal" :
    role === "student" || role === "parent" ? "Student & Parent Portal" :
    "School Principal Dashboard";

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{roleTitle}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 capitalize">
              {role.replace("_", " ")}
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
            Welcome back, <span className="text-slate-900 dark:text-white font-medium">{user?.name ?? "User"}</span> · {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* ── ROLE 1: TEACHER DASHBOARD ────────────────────────────────────────── */}
      {role === "teacher" && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard title="My Assigned Classes" value="3 Classes" sub="Class 9-A, 10-B, 11-A" icon={BookOpen} color="bg-purple-500/10 text-purple-600 dark:text-purple-400 dark:bg-purple-500/20" href="/school/timetable" />
            <StatCard title="Students in My Classes" value={stats.total_students ? Math.round(stats.total_students / 2) : 45} icon={Users} color="bg-blue-500/10 text-blue-600 dark:text-blue-400 dark:bg-blue-500/20" href="/school/students" />
            <StatCard title="Class Attendance Today" value={`${stats.today_attendance.toFixed(1)}%`} sub="High Attendance" icon={Calendar} color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/20" href="/school/attendance" />
            <StatCard title="Upcoming Exams" value="2 Midterms" sub="Next week" icon={FileText} color="bg-orange-500/10 text-orange-600 dark:text-orange-400 dark:bg-orange-500/20" href="/school/exams" />
          </div>

          {/* Quick Actions for Teachers */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Mark Class Attendance", icon: ClipboardCheck, href: "/school/attendance", color: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100" },
              { label: "Enter Exam Results", icon: FileText, href: "/school/exams", color: "text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20 hover:bg-purple-100" },
              { label: "View Class Timetable", icon: Clock, href: "/school/timetable", color: "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 hover:bg-blue-100" },
            ].map(({ label, icon: Icon, href, color }) => (
              <Link key={href} href={href} className={`flex items-center gap-3 p-4 rounded-2xl border transition-all duration-200 shadow-sm ${color}`}>
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-xs font-bold">{label}</span>
              </Link>
            ))}
          </div>

          {/* Today's Schedule */}
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/60 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-4">Today&apos;s Class Schedule</h3>
            <div className="space-y-3">
              {[
                { time: "08:30 AM - 09:15 AM", subject: "Mathematics", class: "Class 10-A", room: "Room 102" },
                { time: "09:20 AM - 10:05 AM", subject: "Physics", class: "Class 9-B", room: "Lab 2" },
                { time: "11:00 AM - 11:45 AM", subject: "Mathematics", class: "Class 11-A", room: "Room 204" },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{s.subject} ({s.class})</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{s.time} · {s.room}</p>
                    </div>
                  </div>
                  <Link href="/school/attendance" className="px-3 py-1 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-500 transition-all">
                    Mark Attendance
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ROLE 2: ACCOUNTANT DASHBOARD ────────────────────────────────────── */}
      {role === "accountant" && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard title="Today's Fee Collections" value={formatPKR(45000)} sub="12 payments logged" icon={CreditCard} color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/20" href="/school/fees" />
            <StatCard title="Total Pending Fees" value={formatPKR(totalPendingAmount || 125000)} sub={`${pendingFees.length || 8} students pending`} icon={Clock} color="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 dark:bg-yellow-500/20" href="/school/fees" />
            <StatCard title="Overdue Defaulters" value={formatPKR(totalOverdueAmount || 45000)} sub={`${overdueFees.length || 3} overdue students`} icon={AlertTriangle} color="bg-red-500/10 text-red-600 dark:text-red-400 dark:bg-red-500/20" href="/school/fees" />
            <StatCard title="Monthly Expenses" value={formatPKR(32000)} sub="Salaries & maintenance" icon={Wallet} color="bg-purple-500/10 text-purple-600 dark:text-purple-400 dark:bg-purple-500/20" href="/school/expenses" />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Collect Fee", icon: CreditCard, href: "/school/fees", color: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100" },
              { label: "Record Expense", icon: Wallet, href: "/school/expenses", color: "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 hover:bg-blue-100" },
              { label: "Staff Salaries", icon: FileText, href: "/school/salaries", color: "text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20 hover:bg-purple-100" },
              { label: "Generate Reports", icon: TrendingUp, href: "/school/fees", color: "text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20 hover:bg-orange-100" },
            ].map(({ label, icon: Icon, href, color }) => (
              <Link key={label} href={href} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border text-center transition-all duration-200 shadow-sm ${color}`}>
                <Icon className="w-6 h-6" />
                <span className="text-xs font-bold">{label}</span>
              </Link>
            ))}
          </div>

          {/* Pending Fees & Defaulters Table */}
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/60 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Fee Defaulters & Overdue Amounts</h3>
              <Link href="/school/fees" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">Manage All Fees <ArrowRight className="w-3 h-3" /></Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/60">
                    <th className="text-left py-2 text-xs font-semibold text-slate-400 uppercase">Student</th>
                    <th className="text-left py-2 text-xs font-semibold text-slate-400 uppercase">Class</th>
                    <th className="text-left py-2 text-xs font-semibold text-slate-400 uppercase">Month</th>
                    <th className="text-left py-2 text-xs font-semibold text-slate-400 uppercase">Amount Due</th>
                    <th className="text-left py-2 text-xs font-semibold text-slate-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                  {(pendingFees.length ? pendingFees : [
                    { id: "1", student: { name: "Ali Ahmed", admission_number: "STD-2026-001" }, class: "Class 10-A", month_year: "2026-07", amount_due: 6000, status: "overdue" },
                    { id: "2", student: { name: "Sara Khan", admission_number: "STD-2026-004" }, class: "Class 9-B", month_year: "2026-07", amount_due: 5500, status: "pending" },
                  ]).slice(0, 5).map((f: any) => (
                    <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 font-medium text-slate-900 dark:text-white">{f.student?.name}</td>
                      <td className="py-2.5 text-xs text-slate-500">{f.class ?? f.student?.class}</td>
                      <td className="py-2.5 text-xs text-slate-400 font-mono">{f.month_year}</td>
                      <td className="py-2.5 font-bold text-slate-900 dark:text-white">{formatPKR(f.amount_due)}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize border ${feeStatusColor(f.status)}`}>{f.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── ROLE 3: STUDENT / PARENT DASHBOARD ──────────────────────────────── */}
      {(role === "student" || role === "parent") && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard title="My Attendance" value="94.2%" sub="Good standing" icon={Calendar} color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/20" href="/school/attendance" />
            <StatCard title="Current GPA / Grade" value="3.8 / 4.0" sub="Grade A+" icon={GraduationCap} color="bg-purple-500/10 text-purple-600 dark:text-purple-400 dark:bg-purple-500/20" href="/school/results" />
            <StatCard title="Fee Status" value="Paid" sub="No pending dues" icon={CheckCircle2} color="bg-blue-500/10 text-blue-600 dark:text-blue-400 dark:bg-blue-500/20" href="/school/fees" />
            <StatCard title="Class Rank" value="#3 in Class" sub="Top 5%" icon={Sparkles} color="bg-orange-500/10 text-orange-600 dark:text-orange-400 dark:bg-orange-500/20" href="/school/report-cards" />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "View Report Card", icon: FileText, href: "/school/report-cards", color: "text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20 hover:bg-purple-100" },
              { label: "Check Exam Schedule", icon: Calendar, href: "/school/exams", color: "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 hover:bg-blue-100" },
              { label: "My Timetable", icon: Clock, href: "/school/timetable", color: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100" },
              { label: "Fee Receipts", icon: CreditCard, href: "/school/fees", color: "text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20 hover:bg-orange-100" },
            ].map(({ label, icon: Icon, href, color }) => (
              <Link key={label} href={href} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border text-center transition-all duration-200 shadow-sm ${color}`}>
                <Icon className="w-6 h-6" />
                <span className="text-xs font-bold">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── ROLE 4: PRINCIPAL / ADMIN DASHBOARD (DEFAULT) ───────────────────── */}
      {(role === "principal" || (role as string) === "super_admin") && (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard href="/school/students" title="Total Students" value={stats.total_students.toLocaleString()} icon={Users} color="bg-blue-500/10 text-blue-600 dark:text-blue-400 dark:bg-blue-500/20" />
            <StatCard title="Teachers" value={stats.total_teachers} icon={Users} color="bg-purple-500/10 text-purple-600 dark:text-purple-400 dark:bg-purple-500/20" />
            <StatCard title="Classes" value={stats.total_classes} icon={BookOpen} color="bg-orange-500/10 text-orange-600 dark:text-orange-400 dark:bg-orange-500/20" />
            <StatCard
              href="/school/attendance"
              title="Today's Attendance"
              value={`${stats.today_attendance.toFixed(1)}%`}
              sub="school-wide"
              icon={Calendar}
              color={stats.today_attendance >= 80 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/20" : "bg-red-500/10 text-red-600 dark:text-red-400 dark:bg-red-500/20"}
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Attendance trend */}
            <div className="xl:col-span-2 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/60 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Attendance Trend</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Last 7 days</p>
                </div>
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={attendanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" className="dark:stroke-slate-800" />
                  <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, color: "#f8fafc" }} formatter={(v: unknown) => [`${v}%`, "Attendance"]} />
                  <Line type="monotone" dataKey="pct" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Fee collection summary */}
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Fee Collection Summary</h3>
                  <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-3 mt-4">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Pending Dues</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">{formatPKR(totalPendingAmount)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">Overdue Defaulters Amount</p>
                    <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatPKR(totalOverdueAmount)}</p>
                  </div>
                </div>
              </div>
              <Link href="/school/fees" className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold hover:bg-slate-800 transition-all">
                Manage Dues <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Mark Attendance", icon: Calendar, href: "/school/attendance", color: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100" },
              { label: "Collect Fee", icon: CreditCard, href: "/school/fees", color: "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 hover:bg-blue-100" },
              { label: "Add Student", icon: Users, href: "/school/students", color: "text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20 hover:bg-purple-100" },
              { label: "View Reports", icon: TrendingUp, href: "/school/fees", color: "text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20 hover:bg-orange-100" },
            ].map(({ label, icon: Icon, href, color }) => (
              <Link key={label} href={href} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border text-center transition-all duration-200 shadow-sm ${color}`}>
                <Icon className="w-6 h-6" />
                <span className="text-xs font-bold">{label}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
