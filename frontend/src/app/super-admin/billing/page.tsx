"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CreditCard, CheckCircle2, XCircle, Clock, AlertTriangle,
  Download, Loader2, Edit3, Users, GraduationCap, X, Layers, Plus,
  DollarSign, FilePlus, Building2,
} from "lucide-react";
import { superAdminApi } from "@/lib/api";
import { formatPKR, formatDate, slugify } from "@/lib/utils";
import type { Invoice, SubscriptionPlanModel, School } from "@/types";

const STATUS_CONFIG = {
  paid: { icon: CheckCircle2, color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  pending: { icon: Clock, color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  overdue: { icon: AlertTriangle, color: "bg-red-500/20 text-red-400 border-red-500/30" },
  cancelled: { icon: XCircle, color: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
};

const PAYMENT_METHODS = ["bank", "cash", "jazzcash", "easypaisa", "cheque"] as const;

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlanModel[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(false);
  const [plansLoading, setPlansLoading] = useState(false);

  // Edit Plan Modal state
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlanModel | null>(null);
  const [planForm, setPlanForm] = useState({
    name: "",
    price_monthly: 0,
    price_yearly: 0,
    max_students: 0,
    max_teachers: 0,
  });
  const [planSubmitting, setPlanSubmitting] = useState(false);
  const [planError, setPlanError] = useState("");

  // Create Custom Plan Modal state
  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
  const [createPlanForm, setCreatePlanForm] = useState({
    name: "",
    slug: "",
    price_monthly: 5000,
    price_yearly: 50000,
    max_students: 500,
    max_teachers: 25,
  });
  const [createPlanSubmitting, setCreatePlanSubmitting] = useState(false);
  const [createPlanError, setCreatePlanError] = useState("");

  // Record Payment Modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<typeof PAYMENT_METHODS[number]>("bank");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  // Generate Invoice Modal state
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [createInvoiceForm, setCreateInvoiceForm] = useState({
    tenant_id: "",
    amount: 10000,
    due_date: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
  });
  const [createInvoiceSubmitting, setCreateInvoiceSubmitting] = useState(false);
  const [createInvoiceError, setCreateInvoiceError] = useState("");

  const [toast, setToast] = useState<string | null>(null);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setPlansLoading(true);
    try {
      const [invRes, planRes, schoolRes] = await Promise.allSettled([
        superAdminApi.getInvoices(),
        superAdminApi.getPlans(),
        superAdminApi.getSchools({ per_page: "100" }),
      ]);
      if (invRes.status === "fulfilled") {
        setInvoices(invRes.value.data.data?.data ?? invRes.value.data.data ?? []);
      }
      if (planRes.status === "fulfilled") {
        setPlans(planRes.value.data.data ?? []);
      }
      if (schoolRes.status === "fulfilled") {
        const scList = schoolRes.value.data.data?.data ?? schoolRes.value.data.data ?? [];
        setSchools(scList);
        if (scList.length > 0 && !createInvoiceForm.tenant_id) {
          setCreateInvoiceForm((f) => ({ ...f, tenant_id: scList[0].id }));
        }
      }
    } catch {
      setInvoices([]);
      setPlans([]);
    } finally {
      setLoading(false);
      setPlansLoading(false);
    }
  }, [createInvoiceForm.tenant_id]);

  useEffect(() => { load(); }, [load]);

  const handleOpenPaymentModal = (inv: Invoice) => {
    setPayingInvoice(inv);
    setPaymentMethod("bank");
    setPaymentReference("");
    setPaymentError("");
    setShowPaymentModal(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice) return;
    setPaymentError("");
    setPaymentSubmitting(true);
    try {
      await superAdminApi.markInvoicePaid(payingInvoice.id, {
        payment_method: paymentMethod,
        payment_reference: paymentReference || undefined,
        paid_at: new Date().toISOString(),
      });

      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === payingInvoice.id
            ? { ...inv, status: "paid" as const, paid_at: new Date().toISOString(), payment_method: paymentMethod }
            : inv
        )
      );

      showToastMsg(`Payment recorded! Invoice #${payingInvoice.invoice_number} marked as Paid.`);
      setShowPaymentModal(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setPaymentError(msg ?? "Failed to record payment.");
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createInvoiceForm.tenant_id) {
      setCreateInvoiceError("Please select a school.");
      return;
    }
    setCreateInvoiceError("");
    setCreateInvoiceSubmitting(true);
    try {
      await superAdminApi.createInvoice({
        tenant_id: createInvoiceForm.tenant_id,
        amount: Number(createInvoiceForm.amount),
        due_date: createInvoiceForm.due_date,
      });

      showToastMsg("New Subscription Invoice generated & in-app notification sent to School!");
      setShowCreateInvoiceModal(false);
      const invRes = await superAdminApi.getInvoices();
      setInvoices(invRes.data.data?.data ?? invRes.data.data ?? []);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setCreateInvoiceError(msg ?? "Failed to generate invoice.");
    } finally {
      setCreateInvoiceSubmitting(false);
    }
  };

  const handleOpenEditPlan = (plan: SubscriptionPlanModel) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      price_monthly: Math.round(plan.price_monthly / 100),
      price_yearly: Math.round(plan.price_yearly / 100),
      max_students: plan.max_students,
      max_teachers: plan.max_teachers,
    });
    setPlanError("");
    setShowPlanModal(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    setPlanError("");
    setPlanSubmitting(true);
    try {
      const payload = {
        name: planForm.name,
        price_monthly: Math.round(planForm.price_monthly * 100),
        price_yearly: Math.round(planForm.price_yearly * 100),
        max_students: Number(planForm.max_students),
        max_teachers: Number(planForm.max_teachers),
      };
      await superAdminApi.updatePlan(editingPlan.id, payload);
      showToastMsg(`Plan "${planForm.name}" updated successfully.`);
      setShowPlanModal(false);
      const planRes = await superAdminApi.getPlans();
      setPlans(planRes.data.data ?? []);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setPlanError(msg ?? "Failed to update plan.");
    } finally {
      setPlanSubmitting(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatePlanError("");
    setCreatePlanSubmitting(true);
    try {
      const payload = {
        name: createPlanForm.name,
        slug: createPlanForm.slug || slugify(createPlanForm.name),
        price_monthly: Math.round(createPlanForm.price_monthly * 100),
        price_yearly: Math.round(createPlanForm.price_yearly * 100),
        max_students: Number(createPlanForm.max_students),
        max_teachers: Number(createPlanForm.max_teachers),
        features: ["Student SIS", "Attendance Tracking", "Fee Management"],
        is_active: true,
      };
      await superAdminApi.createPlan(payload);
      showToastMsg(`Custom Plan "${createPlanForm.name}" created successfully!`);
      setShowCreatePlanModal(false);
      setCreatePlanForm({
        name: "",
        slug: "",
        price_monthly: 5000,
        price_yearly: 50000,
        max_students: 500,
        max_teachers: 25,
      });
      const planRes = await superAdminApi.getPlans();
      setPlans(planRes.data.data ?? []);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setCreatePlanError(msg ?? "Failed to create plan.");
    } finally {
      setCreatePlanSubmitting(false);
    }
  };

  const filtered = invoices.filter((inv) => filterStatus === "all" || inv.status === filterStatus);

  const totalReceived = invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + i.total_amount, 0);
  const totalPending = invoices.filter((i) => i.status === "pending").reduce((sum, i) => sum + i.total_amount, 0);
  const totalOverdue = invoices.filter((i) => i.status === "overdue").reduce((sum, i) => sum + i.total_amount, 0);

  return (
    <div className="space-y-8 animate-fadeIn">

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-xl text-sm font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-lg animate-fadeIn flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Billing & School Subscription Invoices</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage subscription pricing, issue billing invoices, and record school payments</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setCreateInvoiceError(""); setShowCreateInvoiceModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-emerald-500/20"
          >
            <FilePlus className="w-4 h-4" /> Issue New Invoice
          </button>
        </div>
      </div>

      {/* ── SECTION 1: Subscription Plans & Limits Management ─────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-bold text-white">Subscription Plans & Custom Limits</h2>
          </div>
          <button
            onClick={() => { setCreatePlanError(""); setShowCreatePlanModal(true); }}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-purple-500/20"
          >
            <Plus className="w-4 h-4" /> Create Custom Plan
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {plansLoading ? (
            <div className="col-span-4 text-center py-8 text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            </div>
          ) : (
            plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-5 relative group hover:border-purple-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-white text-base capitalize">{plan.name}</span>
                    <button
                      onClick={() => handleOpenEditPlan(plan)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 text-xs font-medium transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                  </div>

                  {/* Pricing Display */}
                  <div className="mb-4 bg-slate-800/40 border border-slate-800 rounded-xl p-3">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-white">Rs. {Math.round(plan.price_monthly / 100).toLocaleString()}</span>
                      <span className="text-slate-400 text-xs">/ month</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Yearly: <span className="text-slate-300 font-medium">Rs. {Math.round(plan.price_yearly / 100).toLocaleString()}</span> / yr
                    </div>
                  </div>

                  {/* Limits */}
                  <div className="space-y-2.5 text-xs text-slate-300">
                    <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
                      <span className="flex items-center gap-2 text-slate-400">
                        <GraduationCap className="w-3.5 h-3.5 text-purple-400" /> Max Students
                      </span>
                      <span className="font-bold text-white">{plan.max_students.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
                      <span className="flex items-center gap-2 text-slate-400">
                        <Users className="w-3.5 h-3.5 text-blue-400" /> Max Teachers
                      </span>
                      <span className="font-bold text-white">{plan.max_teachers.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/40 flex items-center justify-between text-xs text-slate-500">
                  <span>Status</span>
                  <span className={`px-2 py-0.5 rounded-full font-medium ${plan.is_active ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-400"}`}>
                    {plan.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── SECTION 2: Invoices & Payment Recording ───────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">School Invoices & Financial Ledger</h2>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Received", value: formatPKR(totalReceived), icon: CheckCircle2, color: "bg-emerald-500/20 text-emerald-400", count: invoices.filter(i => i.status === "paid").length },
            { label: "Pending", value: formatPKR(totalPending), icon: Clock, color: "bg-yellow-500/20 text-yellow-400", count: invoices.filter(i => i.status === "pending").length },
            { label: "Overdue", value: formatPKR(totalOverdue), icon: AlertTriangle, color: "bg-red-500/20 text-red-400", count: invoices.filter(i => i.status === "overdue").length },
          ].map(({ label, value, icon: Icon, color, count }) => (
            <div key={label} className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{value}</p>
                  <p className="text-sm text-slate-400">{label}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{count} invoice{count !== 1 ? "s" : ""}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {["all", "paid", "pending", "overdue", "cancelled"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filterStatus === s ? "bg-purple-600 text-white" : "bg-slate-800/60 text-slate-400 hover:text-white border border-slate-700/60"}`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Invoices Table */}
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800/60">
                  {["Invoice #", "School", "Amount", "Status", "Due Date", "Paid At", "Actions"].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-12"><Loader2 className="w-5 h-5 animate-spin text-slate-500 mx-auto" /></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-slate-500">No invoices found</td></tr>
                ) : filtered.map((inv) => {
                  const cfg = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.pending;
                  const Icon = cfg.icon;
                  const schoolName = (inv as any).tenant?.name ?? inv.school?.name ?? "—";

                  return (
                    <tr key={inv.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs text-purple-400 font-semibold">{inv.invoice_number}</td>
                      <td className="px-5 py-3.5 text-white font-medium">
                        {schoolName}
                      </td>
                      <td className="px-5 py-3.5 text-white font-bold">{formatPKR(inv.total_amount)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`flex items-center gap-1 w-fit px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
                          <Icon className="w-3 h-3" />
                          <span className="capitalize">{inv.status}</span>
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 text-xs">{formatDate(inv.due_date)}</td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs">
                        {inv.paid_at ? (
                          <div>
                            <p className="text-slate-300 font-medium">{formatDate(inv.paid_at)}</p>
                            {inv.payment_method && <p className="text-[10px] text-slate-500 capitalize">{inv.payment_method}</p>}
                          </div>
                        ) : "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        {(inv.status === "pending" || inv.status === "overdue") ? (
                          <button
                            onClick={() => handleOpenPaymentModal(inv)}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20 transition-all"
                          >
                            <DollarSign className="w-3.5 h-3.5" /> Record Payment
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Settled
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── MODAL: Generate / Issue New Invoice ───────────────────────────── */}
      {showCreateInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowCreateInvoiceModal(false)} />
          <div className="relative bg-slate-900 border border-slate-800/60 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scaleUp space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <FilePlus className="w-5 h-5 text-emerald-400" /> Issue Subscription Invoice
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Generates invoice & sends automatic in-app notification to School Principal</p>
              </div>
              <button onClick={() => setShowCreateInvoiceModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Target School *</label>
                <select
                  value={createInvoiceForm.tenant_id}
                  onChange={(e) => setCreateInvoiceForm((f) => ({ ...f, tenant_id: e.target.value }))}
                  required
                  className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  {schools.length === 0 ? (
                    <option value="">No schools available</option>
                  ) : (
                    schools.map((sc) => (
                      <option key={sc.id} value={sc.id}>
                        {sc.name} ({sc.plan.toUpperCase()})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Amount (PKR) *</label>
                  <input
                    type="number"
                    value={createInvoiceForm.amount}
                    onChange={(e) => setCreateInvoiceForm((f) => ({ ...f, amount: Number(e.target.value) }))}
                    required
                    min={1}
                    className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Due Date *</label>
                  <input
                    type="date"
                    value={createInvoiceForm.due_date}
                    onChange={(e) => setCreateInvoiceForm((f) => ({ ...f, due_date: e.target.value }))}
                    required
                    className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              </div>

              {createInvoiceError && (
                <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
                  {createInvoiceError}
                </p>
              )}

              <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300">
                <p className="font-bold flex items-center gap-1.5 mb-1">
                  <Building2 className="w-3.5 h-3.5 text-purple-400" /> Automatic In-App Alert
                </p>
                <p className="text-purple-300/80">An in-app fee reminder notification will be automatically delivered to the School Principal before the due date.</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateInvoiceModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-xs font-semibold hover:border-slate-600 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createInvoiceSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {createInvoiceSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : "Generate & Notify"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Record School Payment ──────────────────────────────────── */}
      {showPaymentModal && payingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)} />
          <div className="relative bg-slate-900 border border-slate-800/60 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scaleUp space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-white">Record School Payment</h2>
                <p className="text-xs text-slate-400">Mark invoice #{payingInvoice.invoice_number} as Paid</p>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            {/* School & Invoice Info Card */}
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">School</span>
                <span className="font-bold text-white">{(payingInvoice as any).tenant?.name ?? payingInvoice.school?.name ?? "School"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Invoice Number</span>
                <span className="font-mono text-purple-400 font-bold">{payingInvoice.invoice_number}</span>
              </div>
              <div className="flex justify-between border-t border-slate-700/50 pt-2">
                <span className="text-slate-400 font-semibold">Total Amount Due</span>
                <span className="text-base font-bold text-emerald-400">{formatPKR(payingInvoice.total_amount)}</span>
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Payment Method *</label>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold capitalize transition-all ${
                        paymentMethod === m
                          ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-400"
                          : "border-slate-700/60 text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      {m === "bank" ? "Bank Transfer" : m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Payment Reference / Txn ID
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. TRX-992381023 or Cheque #1029"
                  className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 font-mono"
                />
              </div>

              {paymentError && (
                <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
                  {paymentError}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-xs font-semibold hover:border-slate-600 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {paymentSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Recording…</> : "Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Edit Plan & Limits ──────────────────────────────────────── */}
      {showPlanModal && editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowPlanModal(false)} />
          <div className="relative bg-slate-900 border border-slate-800/60 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Edit Plan & Capacity Limits</h2>
              <button onClick={() => setShowPlanModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSavePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Plan Name *</label>
                <input
                  type="text"
                  value={planForm.name}
                  onChange={(e) => setPlanForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Monthly Price (PKR) *</label>
                  <input
                    type="number"
                    value={planForm.price_monthly}
                    onChange={(e) => setPlanForm((f) => ({ ...f, price_monthly: Number(e.target.value) }))}
                    required
                    min={0}
                    className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Yearly Price (PKR) *</label>
                  <input
                    type="number"
                    value={planForm.price_yearly}
                    onChange={(e) => setPlanForm((f) => ({ ...f, price_yearly: Number(e.target.value) }))}
                    required
                    min={0}
                    className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Max Students Limit *</label>
                  <input
                    type="number"
                    value={planForm.max_students}
                    onChange={(e) => setPlanForm((f) => ({ ...f, max_students: Number(e.target.value) }))}
                    required
                    min={1}
                    className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Max Teachers Limit *</label>
                  <input
                    type="number"
                    value={planForm.max_teachers}
                    onChange={(e) => setPlanForm((f) => ({ ...f, max_teachers: Number(e.target.value) }))}
                    required
                    min={1}
                    className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  />
                </div>
              </div>

              {planError && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">{planError}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPlanModal(false)} className="flex-1 py-2 rounded-xl border border-slate-700 text-slate-400 text-sm hover:border-slate-600 hover:text-white transition-all">Cancel</button>
                <button type="submit" disabled={planSubmitting} className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                  {planSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Create Custom Plan ──────────────────────────────────────── */}
      {showCreatePlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowCreatePlanModal(false)} />
          <div className="relative bg-slate-900 border border-slate-800/60 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Create Custom Plan</h2>
              <button onClick={() => setShowCreatePlanModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Plan Name *</label>
                <input
                  type="text"
                  value={createPlanForm.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCreatePlanForm((f) => ({ ...f, name: val, slug: slugify(val) }));
                  }}
                  required
                  placeholder="e.g. Enterprise Special"
                  className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Plan Slug Identifier *</label>
                <input
                  type="text"
                  value={createPlanForm.slug}
                  onChange={(e) => setCreatePlanForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
                  required
                  placeholder="e.g. enterprise-special"
                  className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Monthly Price (PKR) *</label>
                  <input
                    type="number"
                    value={createPlanForm.price_monthly}
                    onChange={(e) => setCreatePlanForm((f) => ({ ...f, price_monthly: Number(e.target.value) }))}
                    required
                    min={0}
                    className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Yearly Price (PKR) *</label>
                  <input
                    type="number"
                    value={createPlanForm.price_yearly}
                    onChange={(e) => setCreatePlanForm((f) => ({ ...f, price_yearly: Number(e.target.value) }))}
                    required
                    min={0}
                    className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Max Students Limit *</label>
                  <input
                    type="number"
                    value={createPlanForm.max_students}
                    onChange={(e) => setCreatePlanForm((f) => ({ ...f, max_students: Number(e.target.value) }))}
                    required
                    min={1}
                    className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Max Teachers Limit *</label>
                  <input
                    type="number"
                    value={createPlanForm.max_teachers}
                    onChange={(e) => setCreatePlanForm((f) => ({ ...f, max_teachers: Number(e.target.value) }))}
                    required
                    min={1}
                    className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  />
                </div>
              </div>

              {createPlanError && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">{createPlanError}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreatePlanModal(false)} className="flex-1 py-2 rounded-xl border border-slate-700 text-slate-400 text-sm hover:border-slate-600 hover:text-white transition-all">Cancel</button>
                <button type="submit" disabled={createPlanSubmitting} className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                  {createPlanSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : "Create Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
