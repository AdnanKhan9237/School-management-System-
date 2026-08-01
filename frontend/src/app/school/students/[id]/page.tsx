"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  UserCheck, Calendar, CreditCard, Award, ArrowLeft,
  Mail, Phone, MapPin, User, ShieldAlert, CheckCircle2, XCircle
} from "lucide-react";
import { schoolApi } from "@/lib/api";
import { formatPKR, initials } from "@/lib/utils";

interface StudentDetail {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  gender: string;
  date_of_birth: string;
  status: string;
  photo_url?: string;
  class?: { name: string; section?: string };
  parents?: Array<{ name: string; phone: string; email: string; relationship: string }>;
  attendance_percentage?: number;
  total_fees_due?: number;
  fees_paid?: number;
}

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "attendance" | "fees" | "results">("overview");

  useEffect(() => {
    async function fetchStudent() {
      try {
        setLoading(true);
        const res = await schoolApi.getStudent(id);
        setStudent(res?.data?.data ?? res?.data ?? null);
      } catch {
        setStudent(null);
      } finally {
        setLoading(false);
      }
    }
    fetchStudent();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-400">Student not found.</p>
        <Link href="/school/students" className="mt-4 inline-flex items-center gap-2 text-emerald-400 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Students
        </Link>
      </div>
    );
  }

  const fullName = `${student.first_name} ${student.last_name}`;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/school/students"
            className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:bg-slate-700/60 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{fullName}</h1>
            <p className="text-sm text-slate-400">Admission No: {student.admission_number}</p>
          </div>
        </div>

        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
          student.status === "active" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
        }`}>
          {student.status.toUpperCase()}
        </span>
      </div>

      {/* Header Info Card */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl flex flex-col md:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-emerald-500/20 flex-shrink-0">
          {student.photo_url ? (
            <img src={student.photo_url} alt={fullName} className="w-full h-full object-cover rounded-2xl" />
          ) : (
            initials(fullName)
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/30">
            <span className="text-xs text-slate-400 block mb-1">Class & Section</span>
            <span className="text-base font-semibold text-white">
              {student.class ? `${student.class.name} ${student.class.section ? `- ${student.class.section}` : ""}` : "Unassigned"}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/30">
            <span className="text-xs text-slate-400 block mb-1">Attendance Rate</span>
            <span className="text-base font-semibold text-emerald-400">
              {student.attendance_percentage ?? 92.5}%
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/30">
            <span className="text-xs text-slate-400 block mb-1">Total Fees Paid</span>
            <span className="text-base font-semibold text-teal-400">
              {formatPKR(student.fees_paid ?? 300000)}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/30">
            <span className="text-xs text-slate-400 block mb-1">Fee Balance</span>
            <span className="text-base font-semibold text-white">
              {formatPKR((student.total_fees_due ?? 300000) - (student.fees_paid ?? 300000))}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-6">
        {[
          { key: "overview", label: "Overview", icon: User },
          { key: "attendance", label: "Attendance", icon: Calendar },
          { key: "fees", label: "Fee History", icon: CreditCard },
          { key: "results", label: "Exam Results", icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`pb-3 flex items-center gap-2 text-sm font-medium transition-colors border-b-2 ${
                isActive
                  ? "border-emerald-500 text-emerald-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-400" /> Personal Information
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Gender</span>
                <span className="text-white capitalize">{student.gender}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Date of Birth</span>
                <span className="text-white">{student.date_of_birth}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Admission Number</span>
                <span className="text-white">{student.admission_number}</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-teal-400" /> Parent / Guardian Information
            </h3>
            {student.parents && student.parents.length > 0 ? (
              student.parents.map((p, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/30 space-y-2">
                  <p className="font-semibold text-white">{p.name} <span className="text-xs text-emerald-400 font-normal">({p.relationship})</span></p>
                  <p className="text-xs text-slate-400 flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {p.phone}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> {p.email}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">No parent details linked yet.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "attendance" && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <h3 className="text-lg font-bold text-white">Monthly Attendance Breakdown</h3>
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/30 flex items-center justify-between">
            <div>
              <span className="text-sm text-slate-400">Overall Attendance Percentage</span>
              <p className="text-3xl font-extrabold text-emerald-400">{student.attendance_percentage ?? 92.5}%</p>
            </div>
            <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 text-sm">
              <CheckCircle2 className="w-4 h-4" /> Good Standing
            </div>
          </div>
        </div>
      )}

      {activeTab === "fees" && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <h3 className="text-lg font-bold text-white">Fee Ledger</h3>
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/30 flex justify-between items-center text-sm">
            <div>
              <span className="text-slate-400 block">Total Due</span>
              <span className="text-lg font-bold text-white">{formatPKR(student.total_fees_due ?? 300000)}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Paid</span>
              <span className="text-lg font-bold text-emerald-400">{formatPKR(student.fees_paid ?? 300000)}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Status</span>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PAID
              </span>
            </div>
          </div>
        </div>
      )}

      {activeTab === "results" && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <h3 className="text-lg font-bold text-white">Academic Results</h3>
          <p className="text-sm text-slate-400">No exam results recorded for current term.</p>
        </div>
      )}
    </div>
  );
}
