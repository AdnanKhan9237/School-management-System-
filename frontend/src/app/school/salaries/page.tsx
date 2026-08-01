"use client";

import React, { useState, useEffect } from "react";
import { DollarSign, Plus, User, CheckCircle2, Clock, Trash2, X } from "lucide-react";
import { formatPKR } from "@/lib/utils";
import { schoolApi } from "@/lib/api";

interface SalaryItem {
  id: string;
  teacher_id: string;
  month_year: string;
  basic_salary: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  status: "pending" | "paid" | "cancelled";
  paid_date?: string;
  payment_method?: string;
  teacher?: { user?: { name: string }; name?: string };
}

export default function SalariesPage() {
  const [salaries, setSalaries] = useState<SalaryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    teacher_id: "",
    month_year: new Date().toISOString().slice(0, 7), // YYYY-MM
    basic_pkr: 50000,
    allowances_pkr: 5000,
    deductions_pkr: 0,
    payment_method: "bank",
    status: "paid" as const,
  });

  const loadSalaries = async () => {
    setLoading(true);
    try {
      const res = await schoolApi.getSalaries();
      setSalaries(res.data.data?.data ?? res.data.data ?? []);
    } catch {
      setSalaries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSalaries();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await schoolApi.createSalary({
        teacher_id: form.teacher_id,
        month_year: form.month_year,
        basic_salary: Math.round(Number(form.basic_pkr) * 100),
        allowances: Math.round(Number(form.allowances_pkr) * 100),
        deductions: Math.round(Number(form.deductions_pkr) * 100),
        payment_method: form.payment_method,
        status: form.status,
        paid_date: form.status === "paid" ? new Date().toISOString().split("T")[0] : null,
      });
      setShowModal(false);
      loadSalaries();
    } catch (err) {
      alert("Error processing staff salary.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this salary record?")) return;
    try {
      await schoolApi.deleteSalary(id);
      loadSalaries();
    } catch (err) {
      alert("Error deleting salary record.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-400" /> Staff Salaries
          </h1>
          <p className="text-sm text-slate-400">Manage payroll, salary disbursements, and staff allowances.</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold shadow-lg shadow-emerald-500/20 flex items-center gap-2 text-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Process Monthly Payroll
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      ) : salaries.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <p className="text-slate-400 text-sm">No payroll records found. Click "Process Monthly Payroll" to log disbursements.</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/40 text-xs font-semibold text-slate-400">
                <th className="py-3.5 px-4">Staff Member</th>
                <th className="py-3.5 px-4">Month</th>
                <th className="py-3.5 px-4">Basic Salary</th>
                <th className="py-3.5 px-4">Allowances</th>
                <th className="py-3.5 px-4">Net Salary</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
              {salaries.map((s) => (
                <tr key={s.id}>
                  <td className="py-3.5 px-4 font-semibold text-white">{s.teacher?.user?.name ?? s.teacher?.name ?? "Teacher"}</td>
                  <td className="py-3.5 px-4 text-slate-400">{s.month_year}</td>
                  <td className="py-3.5 px-4">{formatPKR(s.basic_salary)}</td>
                  <td className="py-3.5 px-4 text-emerald-400">+{formatPKR(s.allowances)}</td>
                  <td className="py-3.5 px-4 font-bold text-white">{formatPKR(s.net_salary)}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                      s.status === "paid"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}>
                      {s.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button onClick={() => handleDelete(s.id)} className="text-rose-400 hover:text-rose-300">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Process Monthly Payroll</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Month / Year</label>
                  <input
                    type="month"
                    required
                    value={form.month_year}
                    onChange={(e) => setForm({ ...form, month_year: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Basic Salary (PKR)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={form.basic_pkr}
                    onChange={(e) => setForm({ ...form, basic_pkr: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Allowances (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.allowances_pkr}
                    onChange={(e) => setForm({ ...form, allowances_pkr: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Deductions (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.deductions_pkr}
                    onChange={(e) => setForm({ ...form, deductions_pkr: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Payment Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none"
                >
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition-all"
              >
                Disburse Payroll
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
