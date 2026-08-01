"use client";

import React, { useState, useEffect } from "react";
import { Download, FileText, Printer, Search, Loader2, Users } from "lucide-react";
import { schoolApi } from "@/lib/api";
import type { Student } from "@/types";

export default function ReportCardsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await schoolApi.getStudents({ per_page: "100" });
        const list = res.data.data?.data ?? res.data.data ?? [];
        setStudents(list);
      } catch {
        setStudents([]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = students.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.user?.name?.toLowerCase().includes(q) ||
      s.admission_number?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-400" /> Report Cards
          </h1>
          <p className="text-sm text-slate-400">Generate, preview, and download official student report cards.</p>
        </div>

        <button
          disabled={filtered.length === 0}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold shadow-lg shadow-emerald-500/20 flex items-center gap-2 text-sm transition-all disabled:opacity-50"
        >
          <Download className="w-4 h-4" /> Bulk Download PDF
        </button>
      </div>

      <div className="relative">
        <Search className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Search student by name or admission number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500"
        />
      </div>

      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
        <h3 className="text-base font-bold text-white">Student Report Cards</h3>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No student report cards found</p>
            <p className="text-slate-600 text-sm mt-1">Admit students and enter exam grades to generate official report cards.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60 text-sm text-slate-300">
            {filtered.map((student) => (
              <div key={student.id} className="py-4 flex items-center justify-between hover:bg-slate-800/20 px-2 rounded-xl transition-colors">
                <div>
                  <p className="font-semibold text-white">{student.user?.name ?? "Student"}</p>
                  <p className="text-xs text-slate-400">
                    Admission No: <span className="font-mono text-slate-300">{student.admission_number}</span> · Class: {student.class?.name ?? "Unassigned"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 flex items-center gap-1.5 text-xs font-semibold">
                    <Printer className="w-3.5 h-3.5" /> Print
                  </button>
                  <button className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 flex items-center gap-1.5 text-xs font-semibold">
                    <Download className="w-3.5 h-3.5" /> Download PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
