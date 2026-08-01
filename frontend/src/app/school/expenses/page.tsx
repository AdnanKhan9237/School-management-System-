"use client";

import React, { useState, useEffect } from "react";
import { Receipt, Plus, Search, Calendar, Tag, Trash2, X } from "lucide-react";
import { formatPKR } from "@/lib/utils";
import { schoolApi } from "@/lib/api";

interface ExpenseItem {
  id: string;
  category: string;
  description?: string;
  amount: number; // in paisa
  expense_date: string;
  payment_method: string;
  receipt_number?: string;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    category: "Utilities",
    description: "",
    amount_pkr: 5000,
    expense_date: new Date().toISOString().split("T")[0],
    payment_method: "cash",
    receipt_number: "",
  });

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const res = await schoolApi.getExpenses();
      setExpenses(res.data.data?.data ?? res.data.data ?? []);
    } catch {
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await schoolApi.createExpense({
        category: form.category,
        description: form.description,
        amount: Math.round(Number(form.amount_pkr) * 100), // convert PKR to paisa
        expense_date: form.expense_date,
        payment_method: form.payment_method,
        receipt_number: form.receipt_number,
      });
      setShowModal(false);
      loadExpenses();
    } catch (err) {
      alert("Error logging expense.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense record?")) return;
    try {
      await schoolApi.deleteExpense(id);
      loadExpenses();
    } catch (err) {
      alert("Error deleting expense.");
    }
  };

  const totalExpensePaisa = expenses.reduce((sum, e) => sum + e.amount, 0);
  const filteredExpenses = expenses.filter(
    (e) =>
      e.category.toLowerCase().includes(search.toLowerCase()) ||
      (e.description && e.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-400" /> Expenses Tracking
          </h1>
          <p className="text-sm text-slate-400">Log school operational expenditures and vendor payments.</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold shadow-lg shadow-emerald-500/20 flex items-center gap-2 text-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Log New Expense
        </button>
      </div>

      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex justify-between items-center">
        <div>
          <span className="text-xs text-slate-400">Total Recorded Expenses</span>
          <p className="text-2xl font-bold text-white mt-0.5">{formatPKR(totalExpensePaisa)}</p>
        </div>
        <div className="text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50">
          {expenses.length} Records Logged
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <p className="text-slate-400 text-sm">No expenses logged. Click "Log New Expense" to add expenditures.</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/40 text-xs font-semibold text-slate-400">
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Method</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
              {filteredExpenses.map((exp) => (
                <tr key={exp.id}>
                  <td className="py-3.5 px-4 font-semibold text-white">{exp.category}</td>
                  <td className="py-3.5 px-4 text-slate-400">{exp.description || "—"}</td>
                  <td className="py-3.5 px-4">{exp.expense_date}</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-400">{formatPKR(exp.amount)}</td>
                  <td className="py-3.5 px-4 uppercase text-xs">{exp.payment_method}</td>
                  <td className="py-3.5 px-4 text-right">
                    <button onClick={() => handleDelete(exp.id)} className="text-rose-400 hover:text-rose-300">
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
              <h3 className="text-lg font-bold text-white">Log New Expense</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none"
                >
                  <option value="Utilities">Utilities</option>
                  <option value="Stationery">Stationery & Printing</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Events">School Events</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. Monthly Electricity Bill"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Amount (PKR)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={form.amount_pkr}
                    onChange={(e) => setForm({ ...form, amount_pkr: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Expense Date</label>
                  <input
                    type="date"
                    required
                    value={form.expense_date}
                    onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Payment Method</label>
                <select
                  value={form.payment_method}
                  onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none"
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition-all"
              >
                Log Expense
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
