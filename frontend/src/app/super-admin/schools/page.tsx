"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Search, Building2, CheckCircle2, XCircle, Clock,
  Pause, Play, Eye, Edit3, Loader2, X,
} from "lucide-react";
import { superAdminApi } from "@/lib/api";
import { formatDate, schoolStatusColor, planBadgeColor, slugify } from "@/lib/utils";
import type { School, SubscriptionPlanModel } from "@/types";

const STATUS_ICON: Record<string, React.ReactNode> = {
  active: <CheckCircle2 className="w-3.5 h-3.5" />,
  trial: <Clock className="w-3.5 h-3.5" />,
  suspended: <XCircle className="w-3.5 h-3.5" />,
  cancelled: <XCircle className="w-3.5 h-3.5" />,
};

interface OnboardForm {
  [key: string]: unknown;
  name: string;
  slug: string;
  principal_name: string;
  principal_email: string;
  principal_phone: string;
  city: string;
  plan_id: string;
  billing_cycle: "monthly" | "yearly";
}

const EMPTY_FORM: OnboardForm = {
  name: "", slug: "", principal_name: "", principal_email: "", principal_phone: "", city: "", plan_id: "standard", billing_cycle: "monthly",
};

export default function SchoolsPage() {
  const router = useRouter();
  const [schools, setSchools] = useState<School[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlanModel[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPlan, setFilterPlan] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<OnboardForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ message: string; credentials?: string } | null>(null);
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  // Edit School State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [editForm, setEditForm] = useState({ name: "", slug: "" });
  const [editError, setEditError] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  const handleEditClick = (school: School) => {
    setEditingSchool(school);
    setEditForm({ name: school.name, slug: school.slug });
    setEditError("");
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchool) return;
    setEditError("");
    setEditSubmitting(true);
    try {
      await superAdminApi.updateSchool(editingSchool.id, editForm);
      setSuccess({ message: `School "${editForm.name}" updated successfully.` });
      setShowEditModal(false);
      load();
    } catch (err: unknown) {
      const errRes = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setEditError(errRes?.message ?? "Failed to update school.");
    } finally {
      setEditSubmitting(false);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sc, pl] = await Promise.all([superAdminApi.getSchools(), superAdminApi.getPlans()]);
      setSchools(sc.data.data?.data ?? sc.data.data ?? []);
      setPlans(pl.data.data ?? []);
    } catch {
      setSchools([]);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = schools.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.slug.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || s.status === filterStatus;
    const matchPlan = filterPlan === "all" || s.plan === filterPlan;
    return matchSearch && matchStatus && matchPlan;
  });

  const handleNameChange = (name: string) => {
    setForm((f) => ({ ...f, name, slug: slugify(name) }));
  };

  const handleSlugChange = (raw: string) => {
    // Only allow lowercase letters, digits, and hyphens (alpha_dash:ascii)
    const clean = raw.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").substring(0, 63);
    setForm((f) => ({ ...f, slug: clean }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      // Find plan slug from plan_id or default to 'standard'
      const selectedPlan = plans.find((p) => p.id === form.plan_id);
      const planSlug = selectedPlan ? selectedPlan.slug : (form.plan_id || "standard");

      const payload = {
        name: form.name,
        slug: form.slug,
        plan: planSlug,
        principal: {
          name: form.principal_name,
          email: form.principal_email,
          phone: form.principal_phone || undefined,
        },
      };

      const res = await superAdminApi.createSchool(payload);
      const d = res.data.data;
      setSuccess({
        message: `${form.name} has been onboarded successfully.`,
        credentials: `Login Email: ${d?.credentials?.email ?? form.principal_email} | Password: ${d?.credentials?.password ?? "Auto-generated"}`,
      });
      setShowModal(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err: unknown) {
      const errRes = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
      if (errRes?.errors) {
        const firstErr = Object.values(errRes.errors).flat()[0];
        setFormError(firstErr || errRes.message || "Failed to onboard school.");
      } else {
        setFormError(errRes?.message ?? "Failed to onboard school.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuspend = async (id: string) => {
    const reason = window.prompt("Suspension reason:");
    if (!reason) return;
    try {
      await superAdminApi.suspendSchool(id, reason);
      setSchools((prev) => prev.map((s) => s.id === id ? { ...s, status: "suspended" as const } : s));
    } catch {}
  };

  const handleActivate = async (id: string) => {
    try {
      await superAdminApi.activateSchool(id);
      setSchools((prev) => prev.map((s) => s.id === id ? { ...s, status: "active" as const } : s));
    } catch {}
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Schools</h1>
          <p className="text-slate-400 text-sm mt-0.5">{schools.length} schools registered</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-purple-500/25"
        >
          <Plus className="w-4 h-4" />
          Onboard New School
        </button>
      </div>

      {/* Success banner */}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 flex items-center justify-between animate-fadeIn">
          <div>
            <p className="text-emerald-400 font-medium text-sm">{success.message}</p>
            {success.credentials && <p className="text-emerald-600 text-xs mt-0.5 font-mono">{success.credentials}</p>}
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-600 hover:text-emerald-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search schools…"
            className="w-full bg-slate-900/60 border border-slate-800/60 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-900/60 border border-slate-800/60 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="suspended">Suspended</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={filterPlan}
          onChange={(e) => setFilterPlan(e.target.value)}
          className="bg-slate-900/60 border border-slate-800/60 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
        >
          <option value="all">All Plans</option>
          <option value="basic">Basic</option>
          <option value="standard">Standard</option>
          <option value="premium">Premium</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/60">
                {["School", "Subdomain", "Plan", "Students", "Teachers", "Status", "Joined", "Actions"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-slate-500"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-slate-500">No schools found</td></tr>
              ) : filtered.map((school) => (
                <tr key={school.id} className="hover:bg-slate-800/20 transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 text-slate-400" />
                      </div>
                      <span className="font-medium text-white">{school.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 font-mono text-xs">{school.slug}</td>
                  <td className="px-5 py-3.5">
                    <span className={`capitalize px-2 py-0.5 rounded-full text-xs font-medium border ${planBadgeColor(school.plan)}`}>{school.plan}</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-300">{school.students_count ?? "—"}</td>
                  <td className="px-5 py-3.5 text-slate-300">{school.teachers_count ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    <span className={`flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-xs font-medium border ${schoolStatusColor(school.status)}`}>
                      {STATUS_ICON[school.status]}
                      <span className="capitalize">{school.status}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs">{formatDate(school.onboarded_at)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => router.push(`/super-admin/schools/${school.id}`)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-all" title="View Details">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleEditClick(school)} className="p-1.5 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all" title="Edit Info">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {school.status === "active" || school.status === "trial" ? (
                        <button onClick={() => handleSuspend(school.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Suspend">
                          <Pause className="w-3.5 h-3.5" />
                        </button>
                      ) : school.status === "suspended" ? (
                        <button onClick={() => handleActivate(school.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all" title="Activate">
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Onboard Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-slate-900 border border-slate-800/60 rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Onboard New School</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-1">School Name *</label>
                  <input value={form.name} onChange={(e) => handleNameChange(e.target.value)} required placeholder="The City School" className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Subdomain Slug <span className="text-slate-500">(letters, numbers, hyphens only)</span> *</label>
                  <div className="flex items-center">
                    <input
                      value={form.slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      required
                      placeholder="city-school"
                      className="flex-1 bg-slate-800/60 border border-slate-700/60 rounded-l-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 font-mono"
                    />
                    <span className="bg-slate-700/60 border border-l-0 border-slate-700/60 rounded-r-xl px-3 py-2 text-xs text-slate-500 whitespace-nowrap">.localhost</span>
                  </div>
                  {form.slug && (
                    <p className="text-xs text-slate-500 mt-1">
                      Principal login header: <code className="text-purple-400">X-Tenant: {form.slug}</code>
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Principal Name *</label>
                  <input value={form.principal_name} onChange={(e) => setForm((f) => ({ ...f, principal_name: e.target.value }))} required className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">City *</label>
                  <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} required placeholder="Karachi" className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Principal Email *</label>
                  <input type="email" value={form.principal_email} onChange={(e) => setForm((f) => ({ ...f, principal_email: e.target.value }))} required className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Phone</label>
                  <input value={form.principal_phone} onChange={(e) => setForm((f) => ({ ...f, principal_phone: e.target.value }))} placeholder="+923001234567" className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Billing Cycle</label>
                  <select value={form.billing_cycle} onChange={(e) => setForm((f) => ({ ...f, billing_cycle: e.target.value as "monthly" | "yearly" }))} className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/40">
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Subscription Plan *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {plans.map((p) => {
                      const isSelected = form.plan_id === p.id || form.plan_id === p.slug;
                      return (
                        <button key={p.id} type="button" onClick={() => setForm((f) => ({ ...f, plan_id: p.slug }))}
                          className={`p-3 rounded-xl border text-left transition-all ${isSelected ? "border-purple-500/60 bg-purple-500/10 ring-2 ring-purple-500/30" : "border-slate-700/60 bg-slate-800/40 hover:border-slate-600"}`}>
                          <p className="text-sm font-semibold text-white capitalize">{p.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">Rs. {(p.price_monthly / 100).toLocaleString()}/mo</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              {formError && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">{formError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-xl border border-slate-700 text-slate-400 text-sm hover:border-slate-600 hover:text-white transition-all">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : "Onboard School"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit School Modal */}
      {showEditModal && editingSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="relative bg-slate-900 border border-slate-800/60 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Edit School Details</h2>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">School Name *</label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  placeholder="The City School"
                  className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Subdomain Slug *</label>
                <div className="flex items-center">
                  <input
                    value={editForm.slug}
                    onChange={(e) => setEditForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
                    required
                    placeholder="city-school"
                    className="flex-1 bg-slate-800/60 border border-slate-700/60 rounded-l-xl px-3 py-2 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  />
                  <span className="bg-slate-700/60 border border-l-0 border-slate-700/60 rounded-r-xl px-3 py-2 text-xs text-slate-500 whitespace-nowrap">.localhost</span>
                </div>
              </div>

              {editError && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">{editError}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-2 rounded-xl border border-slate-700 text-slate-400 text-sm hover:border-slate-600 hover:text-white transition-all">Cancel</button>
                <button type="submit" disabled={editSubmitting} className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                  {editSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
