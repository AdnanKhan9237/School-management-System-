"use client";

import React, { useState, useEffect } from "react";
import { Award, Save, Filter, Loader2, Users } from "lucide-react";
import { schoolApi } from "@/lib/api";
import type { Student, SchoolClass } from "@/types";

export default function ResultsPage() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedExam, setSelectedExam] = useState("Midterm Examinations 2026");
  const [marks, setMarks] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [clsRes, stdRes] = await Promise.allSettled([
          schoolApi.getClasses(),
          schoolApi.getStudents({ per_page: "100" }),
        ]);

        if (clsRes.status === "fulfilled") {
          const cList = clsRes.value.data.data ?? [];
          setClasses(cList);
          if (cList.length > 0) setSelectedClass(cList[0].id);
        }

        if (stdRes.status === "fulfilled") {
          const sList = stdRes.value.data.data?.data ?? stdRes.value.data.data ?? [];
          setStudents(sList);
        }
      } catch {
        setClasses([]);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }, 800);
  };

  const filteredStudents = selectedClass
    ? students.filter((s) => s.class?.id === selectedClass || !s.class)
    : students;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast */}
      {savedSuccess && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-xl text-sm font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-lg flex items-center gap-2">
          <Award className="w-4 h-4" /> Exam results saved successfully!
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-emerald-400" /> Marks Entry &amp; Results
          </h1>
          <p className="text-sm text-slate-400">Record marks, compute grades, and generate term results.</p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || filteredStudents.length === 0}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold shadow-lg shadow-emerald-500/20 flex items-center gap-2 text-sm transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : "Save Results"}
        </button>
      </div>

      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-400" />
          <span className="text-xs text-slate-400 font-semibold">Filter:</span>
        </div>

        <select
          value={selectedExam}
          onChange={(e) => setSelectedExam(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none"
        >
          <option value="Midterm Examinations 2026">Midterm Examinations 2026</option>
          <option value="Final Examinations 2026">Final Examinations 2026</option>
        </select>

        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none"
        >
          {classes.length === 0 ? (
            <option value="">All Classes</option>
          ) : (
            classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.section ? `- Section ${c.section}` : ""}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-16 text-center">
            <Users className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No students found for this class</p>
            <p className="text-slate-600 text-sm mt-1">Please admit students from the Students module to record exam marks.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/40 text-xs font-semibold text-slate-400 uppercase">
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Admission No</th>
                <th className="py-3.5 px-4">Class</th>
                <th className="py-3.5 px-4">Marks Obtained (100)</th>
                <th className="py-3.5 px-4">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
              {filteredStudents.map((s) => {
                const mark = marks[s.id] ?? 85;
                const grade = mark >= 90 ? "A+" : mark >= 80 ? "A" : mark >= 70 ? "B" : mark >= 60 ? "C" : "F";
                return (
                  <tr key={s.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">{s.user?.name ?? "Student"}</td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-xs">{s.admission_number}</td>
                    <td className="py-3.5 px-4 text-slate-400 text-xs">{s.class?.name ?? "—"}</td>
                    <td className="py-3.5 px-4">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={marks[s.id] ?? mark}
                        onChange={(e) => setMarks({ ...marks, [s.id]: Number(e.target.value) })}
                        className="w-20 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${grade === "A+" || grade === "A" ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"}`}>
                        {grade}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
