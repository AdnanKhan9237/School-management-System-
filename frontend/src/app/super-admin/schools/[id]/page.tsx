"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Building2, Users, GraduationCap, CreditCard,
  CheckCircle2, XCircle, Clock, Pause, Play, Trash2,
  Globe, Calendar, BarChart3, Loader2, AlertTriangle,
  KeyRound, TrendingUp, Edit3, X,
} from "lucide-react";
import { superAdminApi } from "@/lib/api";
import { formatDate, formatPKR, schoolStatusColor } from "@/lib/utils";
import type { School, SubscriptionPlanModel } from "@/types";

interface SchoolStats {
  counts?: { students?: number; teachers?: number };
  total_revenue?: number;
  attendance_rate?: number;
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  active: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
  trial: <Clock className="w-4 h-4 text-blue-400" />,
  suspended: <XCircle className="w-4 h-4 text-red-400" />,
  cancelled: <XCircle className="w-4 h-4 text-slate-400" />,
};

// ── Small modal wrapper ──────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-800/60 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scaleUp">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function SchoolDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [school, setSchool] = useState<School | null>(null);
  const [stats, setStats] = useState<SchoolStats>({});
  const [plans, setPlans] = useState<SubscriptionPlanModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Modal states
  const [showResetModal, setShowResetModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Reset password form
  const [resetPw, setResetPw] = useState({ password: "", password_confirmation: "" });
  const [resetError, setResetError] = useState("");

  // Upgrade plan form
  const [selectedPlan, setSelectedPlan] = useState("");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [upgradeError, setUpgradeError] = useState("");

  // Edit school form
  const [editForm, setEditForm] = useState({ name: "", slug: "" });
  const [editError, setEditError] = useState("");

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sc, st, pl] = await Promise.allSettled([
        superAdminApi.getSchool(id),
        superAdminApi.getSchoolStats(id),
        superAdminApi.getPlans(),
      ]);
      if (sc.status === "fulfilled") {
        const schoolData = sc.value.data.data ?? sc.value.data;
        setSchool(schoolData);
        setEditForm({ name: schoolData.name || "", slug: schoolData.slug || "" });
      } else setError("School not found.");
      if (st.status === "fulfilled") setStats(st.value.data.data ?? {});
      if (pl.status === "fulfilled") setPlans(pl.value.data.data ?? []);
    } catch {
      setError("Failed to load school details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleSuspend = async () => {
    const reason = window.prompt("Suspension reason:");
    if (!reason || !school) return;
    setActionLoading(true);
    try {
      await superAdminApi.suspendSchool(school.id, reason);
      setSchool((s) => s ? { ...s, status: "suspended" as const } : s);
      showToast("School suspended.");
    } catch { showToast("Failed to suspend.", false); }
    setActionLoading(false);
  };

  const handleActivate = async () => {
    if (!school) return;
    setActionLoading(true);
    try {
      await superAdminApi.activateSchool(school.id);
      setSchool((s) => s ? { ...s, status: "active" as const } : s);
      showToast("School activated.");
    } catch { showToast("Failed to activate.", false); }
    setActionLoading(false);
  };

  const handleDelete = async () => {
    if (!school) return;
    if (!window.confirm(`Delete "${school.name}"? This cannot be undone.`)) return;
    setActionLoading(true);
    try {
      await superAdminApi.deleteSchool(school.id);
      router.push("/super-admin/schools");
    } catch { showToast("Failed to delete.", false); }
    setActionLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    if (resetPw.password !== resetPw.password_confirmation) {
      setResetError("Passwords do not match.");
      return;
    }
    if (resetPw.password.length < 8) {
      setResetError("Password must be at least 8 characters.");
      return;
    }
    setActionLoading(true);
    try {
      const res = await superAdminApi.resetPrincipalPassword(id, resetPw);
      showToast(res.data.message ?? "Password reset successfully.");
      setShowResetModal(false);
      setResetPw({ password: "", password_confirmation: "" });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setResetError(msg ?? "Failed to reset password.");
    }
    setActionLoading(false);
  };

  const handleUpgradePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpgradeError("");
    if (!selectedPlan) { setUpgradeError("Please select a plan."); return; }
    setActionLoading(true);
    try {
      await superAdminApi.subscribeSchool(id, {
        plan_id: selectedPlan,
        billing_cycle: billingCycle,
        auto_renew: true,
      });
      const planName = plans.find((p) => p.id === selectedPlan)?.name ?? selectedPlan;
      showToast(`Plan upgraded to ${planName} (${billingCycle}).`);
      setShowUpgradeModal(false);
      setSelectedPlan("");
      const sc = await superAdminApi.getSchool(id);
      setSchool(sc.data.data ?? sc.data);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setUpgradeError(msg ?? "Failed to upgrade plan.");
    }
    setActionLoading(false);
  };

  const handleEditSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");
    if (!editForm.name.trim() || !editForm.slug.trim()) {
      setEditError("Name and Subdomain Slug are required.");
      return;
    }
    setActionLoading(true);
    try {
      const res = await superAdminApi.updateSchool(id, editForm);
      setSchool(res.data.data ?? res.data);
      showToast("School details updated successfully.");
      setShowEditModal(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setEditError(msg ?? "Failed to update school details.");
    }
    setActionLoading(false);
  };

  // ── Loading / Error ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
      </div>
    );
  }

  if (error || !school) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertTriangle className="w-8 h-8 text-red-400" />
        <p className="text-slate-400">{error || "School not found."}</p>
        <button onClick={() => router.back()} className="text-sm text-purple-400 hover:text-purple-300">← Go back</button>
      </div>
    );
  }

  const studentCount = stats.counts?.students ?? school.students_count;
  const teacherCount = stats.counts?.teachers ?? school.teachers_count;

  const statCards = [
    { label: "Total Students", value: studentCount?.toLocaleString() ?? "—", icon: GraduationCap, color: "bg-purple-500/20 text-purple-400" },
    { label: "Total Teachers", value: teacherCount?.toLocaleString() ?? "—", icon: Users, color: "bg-blue-500/20 text-blue-400" },
    { label: "Total Revenue", value: stats.total_revenue != null ? formatPKR(stats.total_revenue) : "—", icon: CreditCard, color: "bg-emerald-500/20 text-emerald-400" },
    { label: "Attendance Rate", value: stats.attendance_rate != null ? `${stats.attendance_rate}%` : "—", icon: BarChart3, color: "bg-orange-500/20 text-orange-400" },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg border animate-fadeIn ${
          toast.ok ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{school.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${schoolStatusColor(school.status)}`}>
                {STATUS_ICON[school.status]}
                <span className="capitalize">{school.status}</span>
              </span>
              <span className="text-slate-500 text-xs font-mono">{school.slug}.localhost</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { setEditError(""); setEditForm({ name: school.name, slug: school.slug }); setShowEditModal(true); }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800/60 text-sm transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit Info
          </button>
          <button
            onClick={() => { setResetError(""); setShowResetModal(true); }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800/60 text-sm transition-all"
          >
            <KeyRound className="w-3.5 h-3.5" />
            Reset Password
          </button>
          <button
            onClick={() => { setUpgradeError(""); setShowUpgradeModal(true); }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-purple-500/40 text-purple-400 hover:bg-purple-500/10 text-sm transition-all"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Upgrade Plan
          </button>
          {(school.status === "active" || school.status === "trial") && (
            <button onClick={handleSuspend} disabled={actionLoading} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm transition-all disabled:opacity-50">
              <Pause className="w-3.5 h-3.5" />Suspend
            </button>
          )}
          {school.status === "suspended" && (
            <button onClick={handleActivate} disabled={actionLoading} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-sm transition-all disabled:opacity-50">
              <Play className="w-3.5 h-3.5" />Activate
            </button>
          )}
          <button onClick={handleDelete} disabled={actionLoading} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 text-sm transition-all disabled:opacity-50">
            <Trash2 className="w-3.5 h-3.5" />Delete
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-5 hover:border-slate-700/60 transition-all">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-white mb-0.5">{value}</p>
            <p className="text-sm text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Detail panels */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* School Info */}
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white text-sm">School Information</h3>
            <button
              onClick={() => { setEditError(""); setEditForm({ name: school.name, slug: school.slug }); setShowEditModal(true); }}
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
            >
              <Edit3 className="w-3 h-3" /> Edit
            </button>
          </div>
          <div className="space-y-0">
            {[
              { label: "School Name", value: school.name, icon: Building2 },
              { label: "Subdomain", value: `${school.slug}.localhost`, icon: Globe },
              { label: "Status", value: school.status, icon: CheckCircle2 },
              { label: "Onboarded", value: formatDate(school.onboarded_at) ?? "—", icon: Calendar },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center justify-between py-3 border-b border-slate-800/40 last:border-0">
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Icon className="w-3.5 h-3.5 text-slate-500" />{label}
                </div>
                <span className="text-sm font-medium text-white capitalize">{value || "—"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Subscription */}
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white text-sm">Subscription</h3>
            <button
              onClick={() => { setUpgradeError(""); setShowUpgradeModal(true); }}
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
            >
              <TrendingUp className="w-3 h-3" /> Change Plan
            </button>
          </div>

          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 mb-4">
            <p className="text-xs text-purple-400 font-medium uppercase tracking-wider mb-1">Current Plan</p>
            <p className="text-2xl font-bold text-white capitalize">{school.plan ?? "—"}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {school.plan === "premium" ? "Full platform access" :
               school.plan === "standard" ? "Standard feature set" : "Basic feature set"}
            </p>
          </div>

          {[
            { label: "Billing Cycle", value: (school as { billing_cycle?: string }).billing_cycle ?? "Monthly" },
            { label: "Students Count", value: studentCount?.toString() ?? "—" },
            { label: "Teachers Count", value: teacherCount?.toString() ?? "—" },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2.5 border-b border-slate-800/40 last:border-0">
              <span className="text-slate-400 text-sm">{label}</span>
              <span className="text-sm font-medium text-white capitalize">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Edit School Modal ────────────────────────────────────────────── */}
      {showEditModal && (
        <Modal title="Edit School Details" onClose={() => setShowEditModal(false)}>
          <form onSubmit={handleEditSchool} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">School Name *</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                required
                className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Subdomain Slug *</label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={editForm.slug}
                  onChange={(e) => setEditForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
                  required
                  className="flex-1 bg-slate-800/60 border border-slate-700/60 rounded-l-xl px-3 py-2 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                />
                <span className="bg-slate-700/60 border border-l-0 border-slate-700/60 rounded-r-xl px-3 py-2 text-xs text-slate-500 whitespace-nowrap">.localhost</span>
              </div>
            </div>

            {editError && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">{editError}</p>}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-sm hover:border-slate-600 hover:text-white transition-all">Cancel</button>
              <button type="submit" disabled={actionLoading} className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit3 className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Reset Password Modal ───────────────────────────────────────────── */}
      {showResetModal && (
        <Modal title="Reset Principal Password" onClose={() => setShowResetModal(false)}>
          <p className="text-slate-400 text-sm mb-4">
            This will reset the <span className="text-white font-medium">principal&apos;s</span> login password for{" "}
            <span className="text-purple-400 font-medium">{school.name}</span>. They must use the new password to log in.
          </p>
          <form onSubmit={handleResetPassword} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">New Password</label>
              <input
                type="password"
                value={resetPw.password}
                onChange={(e) => setResetPw((p) => ({ ...p, password: e.target.value }))}
                required
                minLength={8}
                placeholder="Min 8 characters"
                className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Confirm Password</label>
              <input
                type="password"
                value={resetPw.password_confirmation}
                onChange={(e) => setResetPw((p) => ({ ...p, password_confirmation: e.target.value }))}
                required
                placeholder="Repeat password"
                className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              />
            </div>
            {resetError && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">{resetError}</p>}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowResetModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-sm hover:border-slate-600 hover:text-white transition-all">Cancel</button>
              <button type="submit" disabled={actionLoading} className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                Reset Password
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Upgrade Plan Modal ────────────────────────────────────────────── */}
      {showUpgradeModal && (
        <Modal title="Upgrade / Change Plan" onClose={() => setShowUpgradeModal(false)}>
          <p className="text-slate-400 text-sm mb-4">
            Select a new subscription plan for <span className="text-purple-400 font-medium">{school.name}</span>. An invoice will be generated automatically.
          </p>
          <form onSubmit={handleUpgradePlan} className="space-y-4">
            {/* Plan selector */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Select Plan</label>
              <div className="grid grid-cols-1 gap-2">
                {plans.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPlan(p.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedPlan === p.id
                        ? "border-purple-500/60 bg-purple-500/10 ring-2 ring-purple-500/30"
                        : "border-slate-700/60 bg-slate-800/40 hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white capitalize">{p.name}</p>
                      {school.plan === p.slug && (
                        <span className="text-xs text-purple-400 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded-full">Current</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Rs. {((p.price_monthly ?? 0) / 100).toLocaleString()}/mo · Rs. {((p.price_yearly ?? 0) / 100).toLocaleString()}/yr
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Billing cycle */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Billing Cycle</label>
              <div className="grid grid-cols-2 gap-2">
                {(["monthly", "yearly"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setBillingCycle(c)}
                    className={`py-2.5 rounded-xl border text-sm font-medium transition-all capitalize ${
                      billingCycle === c
                        ? "border-purple-500/60 bg-purple-500/10 text-purple-400"
                        : "border-slate-700/60 text-slate-400 hover:border-slate-600 hover:text-white"
                    }`}
                  >
                    {c} {c === "yearly" && <span className="text-xs text-emerald-400 ml-1">Save ~17%</span>}
                  </button>
                ))}
              </div>
            </div>

            {upgradeError && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">{upgradeError}</p>}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowUpgradeModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-sm hover:border-slate-600 hover:text-white transition-all">Cancel</button>
              <button type="submit" disabled={actionLoading || !selectedPlan} className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                Apply Plan
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
