"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2, XCircle, Clock, Users, ChevronRight, CheckCheck, Loader2, Save,
} from "lucide-react";
import { schoolApi } from "@/lib/api";
import type { SchoolClass } from "@/types";

type AttendanceStatus = "present" | "absent" | "late" | "leave";

interface StudentMark {
  id: string;
  name: string;
  roll: string;
  status: AttendanceStatus;
  remarks: string;
}

const STATUS_BUTTONS: { status: AttendanceStatus; label: string; active: string; inactive: string }[] = [
  { status: "present", label: "P", active: "bg-emerald-600 text-white border-emerald-500", inactive: "border-slate-700 text-slate-500 hover:border-emerald-500/50 hover:text-emerald-400" },
  { status: "absent", label: "A", active: "bg-red-600 text-white border-red-500", inactive: "border-slate-700 text-slate-500 hover:border-red-500/50 hover:text-red-400" },
  { status: "late", label: "L", active: "bg-yellow-600 text-white border-yellow-500", inactive: "border-slate-700 text-slate-500 hover:border-yellow-500/50 hover:text-yellow-400" },
  { status: "leave", label: "LV", active: "bg-blue-600 text-white border-blue-500", inactive: "border-slate-700 text-slate-500 hover:border-blue-500/50 hover:text-blue-400" },
];

export default function AttendancePage() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<SchoolClass | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [students, setStudents] = useState<StudentMark[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const loadClasses = useCallback(async () => {
    try {
      const res = await schoolApi.getClasses();
      setClasses(res.data.data?.data ?? res.data.data ?? []);
    } catch {
      setClasses([]);
    }
  }, []);

  const loadClassStudents = useCallback(async (cls: SchoolClass) => {
    setLoadingStudents(true);
    try {
      const res = await schoolApi.getClassStudents(cls.id);
      const rawStudents = res.data.data ?? [];
      setStudents(rawStudents.map((s: { id: string; user?: { name: string }; roll_number?: string }) => ({
        id: s.id, name: s.user?.name ?? "Unknown", roll: s.roll_number ?? "—", status: "present" as AttendanceStatus, remarks: "",
      })));
    } catch {
      setStudents([]);
    } finally { setLoadingStudents(false); }
  }, []);

  useEffect(() => { loadClasses(); }, [loadClasses]);

  useEffect(() => {
    if (selectedClass) loadClassStudents(selectedClass);
  }, [selectedClass, loadClassStudents]);

  const counts = {
    present: students.filter(s => s.status === "present").length,
    absent: students.filter(s => s.status === "absent").length,
    late: students.filter(s => s.status === "late").length,
    leave: students.filter(s => s.status === "leave").length,
  };

  const markAll = (status: AttendanceStatus) => {
    setStudents(prev => prev.map(s => ({ ...s, status })));
  };

  const updateStudent = (id: string, field: "status" | "remarks", value: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleSubmit = async () => {
    if (!selectedClass) return;
    setSubmitting(true);
    try {
      await schoolApi.markAttendance({
        class_id: selectedClass.id,
        date,
        attendance: students.map(s => ({ student_id: s.id, status: s.status, remarks: s.remarks || undefined })),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {} finally { setSubmitting(false); }
  };

  // Class cards view
  if (!selectedClass) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div>
          <h1 className="text-xl font-bold text-white">Attendance</h1>
          <p className="text-slate-400 text-sm mt-0.5">Select a class to mark attendance</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-slate-900/60 border border-slate-800/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <button
              key={cls.id}
              onClick={() => setSelectedClass(cls)}
              className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-5 text-left hover:border-emerald-500/40 hover:bg-slate-800/40 transition-all duration-200 group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white">{cls.name}{cls.section ? ` ${cls.section}` : ""}</h3>
                  <p className="text-sm text-slate-400 mt-1">{cls.students_count ?? 0} students</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                  <ChevronRight className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-800/40">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-slate-600" />
                  <span className="text-xs text-slate-500">Not marked yet for {new Date(date).toLocaleDateString("en-GB")}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Mark attendance view
  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-center gap-3">
        <button onClick={() => setSelectedClass(null)} className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-white transition-colors">
          <ChevronRight className="w-4 h-4 rotate-180" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">{selectedClass.name}{selectedClass.section ? ` ${selectedClass.section}` : ""}</h1>
          <p className="text-slate-400 text-sm">{date}</p>
        </div>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-slate-900/60 border border-slate-800/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
      </div>

      {/* Summary + bulk actions */}
      <div className="flex flex-wrap items-center gap-3">
        {[
          { label: "Present", count: counts.present, color: "text-emerald-400" },
          { label: "Absent", count: counts.absent, color: "text-red-400" },
          { label: "Late", count: counts.late, color: "text-yellow-400" },
          { label: "Leave", count: counts.leave, color: "text-blue-400" },
        ].map(({ label, count, color }) => (
          <div key={label} className="bg-slate-900/60 border border-slate-800/60 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
            <span className={`font-bold text-sm ${color}`}>{count}</span>
            <span className="text-slate-500 text-xs">{label}</span>
          </div>
        ))}
        <div className="flex-1" />
        <button onClick={() => markAll("present")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-sm hover:bg-emerald-500/20 transition-all">
          <CheckCheck className="w-3.5 h-3.5" /> Mark All Present
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${saved ? "bg-emerald-600 text-white" : "bg-emerald-600 hover:bg-emerald-500 text-white"} shadow-lg shadow-emerald-500/20 disabled:opacity-50`}
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? "Saved!" : submitting ? "Saving…" : "Save Attendance"}
        </button>
      </div>

      {/* Student list */}
      {loadingStudents ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
      ) : (
        <div className="space-y-2">
          {students.map((student) => (
            <div key={student.id} className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-4 flex items-center gap-4 hover:border-slate-700/60 transition-all">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 flex-shrink-0">
                {student.roll}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm">{student.name}</p>
                {(student.status === "late" || student.status === "leave") && (
                  <input
                    value={student.remarks}
                    onChange={(e) => updateStudent(student.id, "remarks", e.target.value)}
                    placeholder="Remarks (optional)"
                    className="mt-1 bg-slate-800/60 border border-slate-700/40 rounded-lg px-2 py-1 text-xs text-white placeholder-slate-600 w-full focus:outline-none"
                  />
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {STATUS_BUTTONS.map(({ status, label, active, inactive }) => (
                  <button
                    key={status}
                    onClick={() => updateStudent(student.id, "status", status)}
                    className={`w-8 h-8 rounded-lg border text-xs font-bold transition-all ${student.status === status ? active : inactive}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
