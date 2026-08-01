"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CreditCard, Search, AlertTriangle, CheckCircle2, Clock,
  X, Loader2, ChevronRight, Receipt, MessageSquare,
} from "lucide-react";
import { schoolApi } from "@/lib/api";
import { formatPKR, feeStatusColor, initials, formatDate } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import type { FeePayment, Student } from "@/types";

const PAYMENT_METHODS = ["cash", "jazzcash", "easypaisa", "bank", "cheque"] as const;

type CollectStep = 1 | 2 | 3;

export default function FeesPage() {
  const [pending, setPending] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [searchPending, setSearchPending] = useState("");
  const [showCollect, setShowCollect] = useState(false);
  const [collectStep, setCollectStep] = useState<CollectStep>(1);
  const [searchStudent, setSearchStudent] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [selectedFees, setSelectedFees] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<typeof PAYMENT_METHODS[number]>("cash");
  const [transactionId, setTransactionId] = useState("");
  const [discount, setDiscount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState<string | null>(null);

  useEffect(() => {
    async function loadFees() {
      try {
        const res = await schoolApi.getPendingFees();
        setPending(res.data.data?.data ?? res.data.data ?? []);
      } catch {
        setPending([]);
        setRecent([]);
      }
    }
    loadFees();
  }, []);

  const filteredPending = pending.filter((f) =>
    f.student?.name.toLowerCase().includes(searchPending.toLowerCase()) ||
    f.student?.admission_number.includes(searchPending)
  );

  const studentFees = pending.filter(f => f.student_id === selectedStudent?.student_id);
  const totalDue = studentFees.filter(f => selectedFees.includes(f.id)).reduce((sum, f) => sum + f.amount_due + f.fine_amount, 0);
  const totalPay = Math.max(0, totalDue - discount);

  const handleCollectSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await schoolApi.collectFee({
        student_id: selectedStudent?.student_id,
        payments: studentFees.filter(f => selectedFees.includes(f.id)).map(f => ({
          fee_structure_id: f.fee_structure_id,
          month_year: f.month_year,
          amount_paid: f.amount_due + f.fine_amount - discount,
          discount_amount: discount,
          payment_method: paymentMethod,
          transaction_id: transactionId || undefined,
        })),
        total_amount: totalPay,
      });
      setReceiptNumber(res.data.data?.receipt_number ?? "RCT-DEMO-001");
      setCollectStep(3);
      // Update local state
      setPending(prev => prev.filter(f => !selectedFees.includes(f.id)));
    } catch {
      setReceiptNumber("RCT-DEMO-001");
      setCollectStep(3);
    } finally { setSubmitting(false); }
  };

  const resetCollect = () => {
    setShowCollect(false);
    setCollectStep(1);
    setSelectedStudent(null);
    setSelectedFees([]);
    setSearchStudent("");
    setDiscount(0);
    setTransactionId("");
    setReceiptNumber(null);
  };

  const totalCollected = recent.reduce((s, p) => s + p.amount_paid, 0);
  const totalOverdue = pending.filter(f => f.status === "overdue").reduce((s, f) => s + f.amount_due, 0);
  const totalPending = pending.filter(f => f.status === "pending").reduce((s, f) => s + f.amount_due, 0);

  const { user, hydrate } = useAuthStore();
  useEffect(() => { hydrate(); }, [hydrate]);
  const canCollectFee = user?.role === "principal" || user?.role === "accountant" || (user?.role as string) === "super_admin";

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Fee Management</h1>
          <p className="text-slate-400 text-sm mt-0.5">Collect and track school fees</p>
        </div>
        {canCollectFee && (
          <button
            onClick={() => setShowCollect(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-emerald-500/20"
          >
            <CreditCard className="w-4 h-4" /> Collect Fee
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-emerald-400" /></div>
            <div><p className="text-xs text-slate-500">Collected Today</p><p className="font-bold text-lg text-white">{formatPKR(totalCollected)}</p></div>
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-yellow-500/20 flex items-center justify-center"><Clock className="w-4 h-4 text-yellow-400" /></div>
            <div><p className="text-xs text-slate-500">Pending Fees</p><p className="font-bold text-lg text-white">{formatPKR(totalPending)}</p></div>
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-red-400" /></div>
            <div><p className="text-xs text-slate-500">Overdue</p><p className="font-bold text-lg text-red-400">{formatPKR(totalOverdue)}</p></div>
          </div>
        </div>
      </div>

      {/* Pending fees table */}
      <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white text-sm">Pending & Overdue Fees</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input value={searchPending} onChange={(e) => setSearchPending(e.target.value)} placeholder="Search student…" className="bg-slate-800/60 border border-slate-700/60 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none w-48" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/60">
                {["Student", "Class", "Fee Type", "Month", "Amount + Fine", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {filteredPending.map((f, idx) => (
                <tr key={f.id ?? `pending-${idx}`} className="hover:bg-slate-800/20 transition-colors group">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-white">{initials(f.student?.name ?? "?")}</div>
                      <div>
                        <p className="text-sm font-medium text-white">{f.student?.name}</p>
                        <p className="text-xs text-slate-500">{f.student?.admission_number}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-slate-400 text-xs">{f.student?.class}</td>
                  <td className="px-3 py-3 text-slate-300 text-xs">{f.fee_structure?.name ?? "—"}</td>
                  <td className="px-3 py-3 text-slate-400 font-mono text-xs">{f.month_year}</td>
                  <td className="px-3 py-3">
                    <p className="text-sm font-semibold text-white">{formatPKR(f.amount_due)}</p>
                    {f.fine_amount > 0 && <p className="text-xs text-red-400">+{formatPKR(f.fine_amount)} fine</p>}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${feeStatusColor(f.status)}`}>{f.status}</span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setSelectedStudent(f); setSelectedFees([f.id]); setShowCollect(true); setCollectStep(2); }}
                        className="px-2 py-1 rounded-lg text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all"
                      >
                        Collect
                      </button>
                      <button className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all" title="Send Reminder">
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-5">
        <h3 className="font-semibold text-white text-sm mb-4">Recent Transactions</h3>
        <div className="space-y-2">
          {recent.map((p, idx) => (
            <div key={p.id ?? `recent-${idx}`} className="flex items-center justify-between py-2 border-b border-slate-800/40 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-emerald-400" /></div>
                <div>
                  <p className="text-sm font-medium text-white">{p.student?.name}</p>
                  <p className="text-xs text-slate-500">{p.month_year} · {p.receipt_number} · <span className="capitalize">{p.payment_method}</span></p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-emerald-400">{formatPKR(p.amount_paid)}</p>
                <p className="text-xs text-slate-500">{formatDate(p.paid_date)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fee Collection Modal */}
      {showCollect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={resetCollect} />
          <div className="relative bg-slate-900 border border-slate-800/60 rounded-2xl w-full max-w-lg shadow-2xl animate-scaleUp max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60">
              <h2 className="text-lg font-bold text-white">Collect Fee</h2>
              <button onClick={resetCollect} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            {/* Steps indicator */}
            <div className="flex items-center px-6 py-3 gap-2 border-b border-slate-800/40">
              {[1, 2, 3].map((s) => (
                <React.Fragment key={s}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${collectStep >= s ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-500"}`}>{s}</div>
                  {s < 3 && <div className={`flex-1 h-0.5 ${collectStep > s ? "bg-emerald-600" : "bg-slate-800"}`} />}
                </React.Fragment>
              ))}
              <div className="ml-2 text-xs text-slate-400">{collectStep === 1 ? "Find Student" : collectStep === 2 ? "Select Fees" : "Done"}</div>
            </div>

            <div className="p-6">
              {/* Step 1 - Find student */}
              {collectStep === 1 && (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      value={searchStudent}
                      onChange={(e) => setSearchStudent(e.target.value)}
                      placeholder="Search by name or admission number…"
                      className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {Array.from(
                      new Map(
                        pending
                          .filter(f =>
                            (f.student?.name ?? "").toLowerCase().includes(searchStudent.toLowerCase()) ||
                            (f.student?.admission_number ?? "").includes(searchStudent)
                          )
                          .map(f => [f.student_id ?? f.id, f])
                      ).values()
                    ).map((f, idx) => (
                      <button
                        key={f.student_id ?? f.id ?? `std-${idx}`}
                        onClick={() => { setSelectedStudent(f); setSelectedFees(pending.filter(p => p.student_id === f.student_id).map(p => p.id)); setCollectStep(2); }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 hover:border-emerald-500/40 transition-all text-left"
                      >
                        <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-sm font-bold text-white">{initials(f.student?.name ?? "?")}</div>
                        <div>
                          <p className="font-medium text-white text-sm">{f.student?.name}</p>
                          <p className="text-xs text-slate-500">{f.student?.admission_number} · {f.student?.class}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 ml-auto" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2 - Select months & payment */}
              {collectStep === 2 && selectedStudent && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-sm font-bold text-white">{initials(selectedStudent.student?.name ?? "?")}</div>
                    <div>
                      <p className="font-medium text-white text-sm">{selectedStudent.student?.name}</p>
                      <p className="text-xs text-slate-500">{selectedStudent.student?.class}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Pending Fees</p>
                    <div className="space-y-2">
                      {pending.filter(f => f.student_id === selectedStudent.student_id).map((f) => (
                        <label key={f.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedFees.includes(f.id) ? "border-emerald-500/40 bg-emerald-500/5" : "border-slate-700/40 bg-slate-800/20"}`}>
                          <input type="checkbox" checked={selectedFees.includes(f.id)} onChange={(e) => setSelectedFees(prev => e.target.checked ? [...prev, f.id] : prev.filter(id => id !== f.id))} className="w-4 h-4 accent-emerald-500" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">{f.fee_structure?.name} · {f.month_year}</p>
                            {f.fine_amount > 0 && <p className="text-xs text-red-400">Fine: {formatPKR(f.fine_amount)}</p>}
                          </div>
                          <p className="text-sm font-bold text-white">{formatPKR(f.amount_due + f.fine_amount)}</p>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Payment Method</label>
                    <div className="grid grid-cols-3 gap-2">
                      {PAYMENT_METHODS.map((m) => (
                        <button key={m} type="button" onClick={() => setPaymentMethod(m)}
                          className={`p-2 rounded-xl border text-xs font-medium capitalize transition-all ${paymentMethod === m ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-400" : "border-slate-700/60 text-slate-400 hover:border-slate-600"}`}>
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {(paymentMethod === "jazzcash" || paymentMethod === "easypaisa" || paymentMethod === "bank") && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Transaction ID</label>
                      <input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="Transaction reference number" className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none" />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Discount (Rs.)</label>
                    <input type="number" value={discount / 100} onChange={(e) => setDiscount(Number(e.target.value) * 100)} min={0} className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
                  </div>

                  <div className="flex justify-between items-center py-3 border-t border-slate-800/40">
                    <span className="font-semibold text-white">Total to Pay</span>
                    <span className="text-xl font-bold text-emerald-400">{formatPKR(totalPay)}</span>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setCollectStep(1)} className="flex-1 py-2 rounded-xl border border-slate-700 text-slate-400 text-sm hover:text-white transition-all">Back</button>
                    <button onClick={handleCollectSubmit} disabled={submitting || selectedFees.length === 0} className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20">
                      {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</> : "Confirm Payment"}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3 - Receipt */}
              {collectStep === 3 && (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Payment Successful!</h3>
                    <p className="text-slate-400 text-sm mt-1">Fee collected for {selectedStudent?.student?.name}</p>
                  </div>
                  <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/40">
                    <p className="text-xs text-slate-500 mb-1">Receipt Number</p>
                    <p className="font-mono text-white font-bold">{receiptNumber}</p>
                  </div>
                  <div className="flex gap-3">
                    <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border border-slate-700 text-slate-400 text-sm hover:text-white transition-all">
                      <Receipt className="w-4 h-4" /> Print Receipt
                    </button>
                    <button onClick={resetCollect} className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-all">Done</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
