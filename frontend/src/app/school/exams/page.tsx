"use client";

import React, { useState, useEffect } from "react";
import { BookOpen, Plus, Search, Calendar, CheckCircle2, Clock, Trash2, Edit, X } from "lucide-react";
import { schoolApi } from "@/lib/api";

interface Exam {
  id: string;
  name: string;
  term: string;
  academic_year: string;
  start_date: string;
  end_date: string;
  status: "scheduled" | "published" | "completed";
}

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  const [form, setForm] = useState({
    name: "",
    term: "Term 1",
    academic_year: new Date().getFullYear().toString(),
    start_date: "",
    end_date: "",
  });

  const loadExams = async () => {
    setLoading(true);
    try {
      const res = await schoolApi.getExams();
      setExams(res.data.data?.data ?? res.data.data ?? []);
    } catch {
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const openCreateModal = () => {
    setEditingExam(null);
    setForm({ name: "", term: "Term 1", academic_year: new Date().getFullYear().toString(), start_date: "", end_date: "" });
    setShowModal(true);
  };

  const openEditModal = (exam: Exam) => {
    setEditingExam(exam);
    setForm({ name: exam.name, term: exam.term, academic_year: exam.academic_year, start_date: exam.start_date, end_date: exam.end_date });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingExam) {
        await schoolApi.updateExam(editingExam.id, form);
      } else {
        await schoolApi.createExam(form);
      }
      setShowModal(false);
      loadExams();
    } catch (err) {
      alert("Error saving exam details.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this exam?")) return;
    try {
      await schoolApi.deleteExam(id);
      loadExams();
    } catch (err) {
      alert("Error deleting exam.");
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await schoolApi.publishExam(id);
      loadExams();
    } catch (err) {
      alert("Error publishing exam.");
    }
  };

  const filteredExams = exams.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-400" /> Exam Management
          </h1>
          <p className="text-sm text-slate-400">Schedule examinations, track terms, and manage assessments.</p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold shadow-lg shadow-emerald-500/20 flex items-center gap-2 text-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Create New Exam
        </button>
      </div>

      <div className="relative">
        <Search className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Search exams..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <p className="text-slate-400 text-sm">No exam schedules found. Click "Create New Exam" to schedule an assessment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredExams.map((exam) => (
            <div key={exam.id} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">{exam.name}</h3>
                  <p className="text-xs text-slate-400">{exam.term} · {exam.academic_year}</p>
                </div>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                  exam.status === "published"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                }`}>
                  {exam.status.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800">
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-emerald-400" /> {exam.start_date} to {exam.end_date}</span>
                <div className="flex items-center gap-2">
                  {exam.status === "scheduled" && (
                    <button onClick={() => handlePublish(exam.id)} className="text-xs text-emerald-400 hover:underline font-semibold">
                      Publish
                    </button>
                  )}
                  <button onClick={() => openEditModal(exam)} className="p-1.5 text-slate-400 hover:text-white">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(exam.id)} className="p-1.5 text-rose-400 hover:text-rose-300">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">{editingExam ? "Edit Exam" : "Create New Exam"}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Exam Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Midterm Examinations 2026"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                />

              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Term</label>
                  <select
                    value={form.term}
                    onChange={(e) => setForm({ ...form, term: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none"
                  >
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Final Term">Final Term</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Academic Year</label>
                  <input
                    type="text"
                    required
                    value={form.academic_year}
                    onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Start Date</label>
                  <input
                    type="date"
                    required
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">End Date</label>
                  <input
                    type="date"
                    required
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition-all"
              >
                {editingExam ? "Save Changes" : "Create Exam"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
