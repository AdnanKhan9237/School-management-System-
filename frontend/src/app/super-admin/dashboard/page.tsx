"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { superAdminApi } from "@/lib/api";
import { formatPKR, formatDate, schoolStatusColor } from "@/lib/utils";
import type { School, SubscriptionPlanModel } from "@/types";

const STATUS_ICON: Record<string, React.ReactNode> = {
  active: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
  trial: <Clock className="w-3.5 h-3.5 text-blue-400" />,
  suspended: <XCircle className="w-3.5 h-3.5 text-red-400" />,
};

const PLAN_COLORS: Record<string, string> = {
  premium: "#10b981",
  standard: "#3b82f6",
  basic: "#6366f1",
};

function StatCard({
  title,
  value,
  sub,
  growth,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  sub?: string;
  growth?: number;
  icon: React.ElementType;
  color: string;
}) {
  const positive = (growth ?? 0) >= 0;
  return (
    <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-5 hover:border-slate-700/60 transition-all duration-200 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {growth !== undefined && (
          <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${positive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
            {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(growth)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white mb-0.5">{value}</p>
      <p className="text-sm text-slate-400">{title}</p>
      {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function SuperAdminDashboard() {
  const [overview, setOverview] = useState({ total_schools: 0, active_subscriptions: 0, monthly_revenue: 0, total_students: 0, growth: { schools: 0, revenue: 0, students: 0 } });
  const [revenueData, setRevenueData] = useState<{ month: string; revenue: number }[]>([]);
  const [growthData, setGrowthData] = useState<{ month: string; schools: number }[]>([]);
  const [recentSchools, setRecentSchools] = useState<School[]>([]);
  const [allSchools, setAllSchools] = useState<School[]>([]);

  const load = useCallback(async () => {
    try {
      const [ov, rev, gr, sc, allSc] = await Promise.all([
        superAdminApi.getOverview(),
        superAdminApi.getRevenue(),
        superAdminApi.getSchoolsGrowth(),
        superAdminApi.getSchools({ sort: "created_at", order: "desc", per_page: "5" }),
        superAdminApi.getSchools({ per_page: "100" }),
      ]);
      const rawOv = ov.data?.data ?? ov.data ?? {};
      setOverview({
        total_schools: rawOv.total_schools ?? 0,
        active_subscriptions: rawOv.active_subscriptions ?? rawOv.active_schools ?? 0,
        monthly_revenue: rawOv.monthly_revenue ?? rawOv.total_revenue ?? 0,
        total_students: rawOv.total_students ?? rawOv.active_users ?? 0,
        growth: {
          schools: rawOv.growth?.schools ?? 0,
          revenue: rawOv.growth?.revenue ?? 0,
          students: rawOv.growth?.students ?? 0,
        },
      });
      setRevenueData(rev.data?.data ?? rev.data ?? []);
      setGrowthData(gr.data?.data ?? gr.data ?? []);
      setRecentSchools(sc.data?.data?.data ?? sc.data?.data ?? []);
      setAllSchools(allSc.data?.data?.data ?? allSc.data?.data ?? []);
    } catch {
      setRevenueData([]);
      setGrowthData([]);
      setRecentSchools([]);
      setAllSchools([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Compute dynamic plan distribution from database schools
  const totalSc = allSchools.length || 1;
  const planCounts: Record<string, number> = {};
  allSchools.forEach((s) => {
    const p = (s.plan || "standard").toLowerCase();
    planCounts[p] = (planCounts[p] || 0) + 1;
  });

  const dynamicPlanPie = Object.keys(planCounts).map((planName) => {
    const count = planCounts[planName];
    const pct = Math.round((count / totalSc) * 100);
    return {
      name: planName.charAt(0).toUpperCase() + planName.slice(1),
      value: count,
      percentage: pct,
      color: PLAN_COLORS[planName] || "#a855f7",
    };
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Super Admin Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Platform overview across all schools in real-time database</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Schools"
          value={(overview.total_schools ?? 0).toLocaleString()}
          growth={overview.growth?.schools}
          icon={Building2}
          color="bg-purple-500/20 text-purple-400"
        />
        <StatCard
          title="Active Subscriptions"
          value={(overview.active_subscriptions ?? 0).toLocaleString()}
          icon={CheckCircle2}
          color="bg-emerald-500/20 text-emerald-400"
        />
        <StatCard
          title="Monthly Revenue"
          value={formatPKR(overview.monthly_revenue ?? 0)}
          growth={overview.growth?.revenue}
          icon={CreditCard}
          color="bg-blue-500/20 text-blue-400"
        />
        <StatCard
          title="Total Students"
          value={(overview.total_students ?? 0).toLocaleString()}
          growth={overview.growth?.students}
          icon={Users}
          color="bg-orange-500/20 text-orange-400"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Schools growth */}
        <div className="xl:col-span-2 bg-slate-900/60 border border-slate-800/60 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-white text-sm">Schools Growth</h3>
              <p className="text-xs text-slate-500">Real-time database records</p>
            </div>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, color: "#f8fafc" }} />
              <Line type="monotone" dataKey="schools" stroke="#a855f7" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#a855f7" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Dynamic Plan distribution */}
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-white text-sm">Plan Distribution</h3>
              <p className="text-xs text-slate-500">Live active schools distribution</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={dynamicPlanPie.length ? dynamicPlanPie : [{ name: "Standard", value: 1, color: "#3b82f6" }]} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                {dynamicPlanPie.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, color: "#f8fafc" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {dynamicPlanPie.map((p) => (
              <div key={p.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                  <span className="text-xs text-slate-400">{p.name}</span>
                </div>
                <span className="text-xs font-semibold text-white">{p.value} school{p.value !== 1 ? "s" : ""} ({p.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue chart */}
      <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-white text-sm">Revenue Trends</h3>
            <p className="text-xs text-slate-500">Database subscription invoices (PKR)</p>
          </div>
          <Calendar className="w-4 h-4 text-blue-400" />
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`} />
            <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, color: "#f8fafc" }} formatter={(v: unknown) => [formatPKR(Number(v) ?? 0), "Revenue"]} />
            <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent schools table */}
      <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white text-sm">Recently Onboarded Schools</h3>
          <a href="/super-admin/schools" className="text-xs text-purple-400 hover:text-purple-300 transition-colors">View all →</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/60">
                {["School", "Subdomain", "Plan", "Students", "Status", "Joined"].map((h) => (
                  <th key={h} className="text-left py-2.5 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {recentSchools.map((school) => (
                <tr key={school.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="py-3 pr-4 font-medium text-white">{school.name}</td>
                  <td className="py-3 pr-4 text-slate-400 font-mono text-xs">{school.slug}</td>
                  <td className="py-3 pr-4">
                    <span className={`capitalize px-2 py-0.5 rounded-full text-xs font-medium border ${
                      school.plan === "premium" ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                      : school.plan === "standard" ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                      : "bg-slate-500/20 text-slate-400 border-slate-500/30"
                    }`}>{school.plan}</span>
                  </td>
                  <td className="py-3 pr-4 text-slate-300">{school.students_count ?? "—"}</td>
                  <td className="py-3 pr-4">
                    <span className={`flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-xs font-medium border ${schoolStatusColor(school.status)}`}>
                      {STATUS_ICON[school.status]}
                      <span className="capitalize">{school.status}</span>
                    </span>
                  </td>
                  <td className="py-3 text-slate-500 text-xs">{formatDate(school.onboarded_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="text-center pt-4 pb-2 border-t border-slate-800/40">
        <p className="text-xs text-slate-500">
          Powered by <span className="text-purple-400 font-semibold">Aivora Technologies</span> · EduSuite SaaS Platform
        </p>
      </div>
    </div>
  );
}
