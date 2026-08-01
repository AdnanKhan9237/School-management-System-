"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus, Search, Upload, Download, Eye,
  CheckCircle2, Clock, AlertTriangle, Loader2, X, Users,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { schoolApi } from "@/lib/api";
import { feeStatusColor, initials } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import type { Student, SchoolClass } from "@/types";

const FEE_ICONS: Record<string, React.ReactNode> = {
  paid: <CheckCircle2 className="w-3 h-3" />,
  pending: <Clock className="w-3 h-3" />,
  overdue: <AlertTriangle className="w-3 h-3" />,
  partial: <Clock className="w-3 h-3" />,
};

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  gender: "male",
  date_of_birth: "",
  address: "",
  class_id: "",
  roll_number: "",
  admission_date: "",
  father_name: "",
  mother_name: "",
  guardian_name: "",
  guardian_relation: "father",
  emergency_contact: "",
  blood_group: "",
};

export default function StudentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [filterFee, setFilterFee] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const { data: studentsData, isLoading: loadingStudents } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const res = await schoolApi.getStudents();
      return (res.data.data?.data ?? res.data.data ?? []) as Student[];
    },
  });

  const { data: classesData } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const res = await schoolApi.getClasses();
      return (res.data.data ?? []) as SchoolClass[];
    },
    staleTime: 20 * 60 * 1000,
  });

  const students = studentsData ?? [];
  const classes = classesData ?? [];
  const loading = loadingStudents;

  const filtered = students.filter((s) => {
    const studentName = s.user?.name ?? (s as unknown as { name?: string }).name ?? "";
    const admNo = s.admission_number ?? "";
    const matchSearch =
      studentName.toLowerCase().includes(search.toLowerCase()) ||
      admNo.toLowerCase().includes(search.toLowerCase());
    const matchClass = filterClass === "all" || s.class?.id === filterClass;
    const matchFee = filterFee === "all" || s.fee_status === filterFee;
    return matchSearch && matchClass && matchFee;
  });

  const handleExport = async () => {
    try {
      const res = await schoolApi.exportStudents();
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a"); a.href = url; a.download = "students.xlsx"; a.click();
    } catch { }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      await schoolApi.admitStudent({
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        gender: form.gender,
        date_of_birth: form.date_of_birth || undefined,
        address: form.address || undefined,
        class_id: form.class_id,
        roll_number: form.roll_number || undefined,
        admission_date: form.admission_date || undefined,
        father_name: form.father_name,
        mother_name: form.mother_name,
        guardian_name: form.guardian_name,
        guardian_relation: form.guardian_relation,
        emergency_contact: form.emergency_contact,
        blood_group: form.blood_group || undefined,
      });
      setShowAddModal(false);
      setForm(EMPTY_FORM);
      queryClient.invalidateQueries({ queryKey: ["students"] });
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
      if (errData?.errors) {
        setFormError(Object.values(errData.errors).flat().join(" | "));
      } else {
        setFormError(errData?.message ?? "Failed to admit student.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const { user, hydrate } = useAuthStore();
  useEffect(() => { hydrate(); }, [hydrate]);
  const canManageStudents = user?.role === "principal" || (user?.role as string) === "super_admin";

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Students</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{students.length} students enrolled</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700/60 shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          {canManageStudents && (
            <>
              <label className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700/60 shadow-sm transition-all cursor-pointer">
                <Upload className="w-3.5 h-3.5" /> Import
                <input type="file" accept=".xlsx,.csv" className="hidden" />
              </label>
              <button
                onClick={() => { setForm(EMPTY_FORM); setFormError(""); setShowAddModal(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-emerald-500/20"
              >
                <Plus className="w-4 h-4" /> Add Student
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or admission no…"
            className="w-full bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/60 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 shadow-sm"
          />
        </div>
        <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/60 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none shadow-sm">
          <option value="all">All Classes</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name} {c.section ?? ""}</option>)}
        </select>
        <select value={filterFee} onChange={(e) => setFilterFee(e.target.value)} className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/60 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none shadow-sm">
          <option value="all">All Fee Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
          <option value="partial">Partial</option>
        </select>
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/60 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/40">
                {["Student", "Adm. No.", "Class", "Phone", "Attendance", "Fee Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="skeleton w-9 h-9 rounded-xl" />
                        <div className="space-y-1.5">
                          <div className="skeleton h-3 w-28" />
                          <div className="skeleton h-2.5 w-16" />
                        </div>
                      </div>
                    </td>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-5 py-3.5"><div className="skeleton h-3 w-20" /></td>
                    ))}
                    <td className="px-5 py-3.5"><div className="skeleton h-3 w-12" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400 dark:text-slate-500 font-medium">No students found. Click &quot;Add Student&quot; to admit the first student.</td></tr>
              ) : (
                filtered.map((student) => {
                  const sName = student.user?.name ?? (student as unknown as { name?: string }).name ?? "Student";
                  const sGender = student.user?.gender ?? "—";
                  const sPhone = student.user?.phone ?? "—";
                  return (
                    <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm">
                            {initials(sName)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{sName}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{sGender} · {student.blood_group ?? "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300 font-mono text-xs font-medium">{student.admission_number ?? "—"}</td>
                      <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300 font-medium">{student.class ? `${student.class.name}${student.class.section ? ` ${student.class.section}` : ""}` : "—"}</td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-xs">{sPhone}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 w-16 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${(student.attendance_percentage ?? 0) >= 75 ? "bg-emerald-500" : "bg-red-500"}`}
                              style={{ width: `${student.attendance_percentage ?? 0}%` }}
                            />
                          </div>
                          <span className={`text-xs font-bold ${(student.attendance_percentage ?? 0) >= 75 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                            {student.attendance_percentage ?? 0}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-[11px] font-semibold border ${feeStatusColor(student.fee_status ?? "pending")}`}>
                          {FEE_ICONS[student.fee_status ?? "pending"]}
                          <span className="capitalize">{student.fee_status ?? "—"}</span>
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/school/students/${student.id}`} className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-all">
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800/40 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/20">
          <p className="text-xs text-slate-500 dark:text-slate-400">Showing {filtered.length} of {students.length} students</p>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Admit New Student
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Personal Info */}
              <div>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3">Personal Information</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Full Name *</label>
                    <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ali Hassan" className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email *</label>
                    <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="ali@school.com" className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Phone</label>
                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+92 300 1234567" className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Gender</label>
                    <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none">
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Date of Birth</label>
                    <input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Blood Group</label>
                    <select value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none">
                      <option value="">—</option>
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Academic Info */}
              <div>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3">Academic Information</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Class *</label>
                    <select required value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500">
                      <option value="">Select Class</option>
                      {classes.map((c) => <option key={c.id} value={c.id}>{c.name} {c.section ? `(${c.section})` : ""}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Roll Number</label>
                    <input value={form.roll_number} onChange={(e) => setForm({ ...form, roll_number: e.target.value })} placeholder="101" className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Admission Date</label>
                    <input type="date" value={form.admission_date} onChange={(e) => setForm({ ...form, admission_date: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none" />
                  </div>
                </div>
              </div>

              {/* Guardian Info */}
              <div>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3">Guardian Information</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Father Name *</label>
                    <input required value={form.father_name} onChange={(e) => setForm({ ...form, father_name: e.target.value })} placeholder="Hassan Tariq" className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Mother Name *</label>
                    <input required value={form.mother_name} onChange={(e) => setForm({ ...form, mother_name: e.target.value })} placeholder="Fatima Hassan" className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Guardian Name *</label>
                    <input required value={form.guardian_name} onChange={(e) => setForm({ ...form, guardian_name: e.target.value })} placeholder="Hassan Tariq" className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Guardian Relation *</label>
                    <select required value={form.guardian_relation} onChange={(e) => setForm({ ...form, guardian_relation: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none">
                      <option value="father">Father</option>
                      <option value="mother">Mother</option>
                      <option value="guardian">Guardian</option>
                    </select>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Emergency Contact *</label>
                    <input required value={form.emergency_contact} onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })} placeholder="+92 300 1234567" className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500" />
                  </div>
                </div>
              </div>

              {formError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-600 dark:text-red-400 text-xs">
                  {formError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-emerald-500/20">
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Admitting…</> : "Admit Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
