"use client";

import React, { useState, useEffect } from "react";
import { Clock, Plus, MapPin, User, Trash2, X } from "lucide-react";
import { schoolApi } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface TimetableItem {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id?: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room_number?: string;
  school_class?: { name: string; section?: string };
  subject?: { name: string };
  teacher?: { name: string };
}

export default function TimetablePage() {
  const { user, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const canManageTimetable = user?.role === "principal" || (user?.role as string) === "super_admin";

  const [selectedDay, setSelectedDay] = useState("Monday");
  const [timetables, setTimetables] = useState<TimetableItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    class_id: "",
    subject_id: "",
    teacher_id: "",
    day_of_week: "Monday",
    start_time: "08:00",
    end_time: "08:45",
    room_number: "Room 101",
  });

  const loadTimetable = async () => {
    setLoading(true);
    try {
      const res = await schoolApi.getTimetable({ day_of_week: selectedDay });
      setTimetables(res.data.data ?? []);
    } catch {
      setTimetables([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimetable();
  }, [selectedDay]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageTimetable) {
      alert("Only the School Principal can add or modify periods.");
      return;
    }
    try {
      await schoolApi.createTimetable(form);
      setShowModal(false);
      loadTimetable();
    } catch {
      alert("Error adding period entry.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!canManageTimetable) {
      alert("Only the School Principal can delete periods.");
      return;
    }
    if (!confirm("Are you sure you want to remove this timetable period?")) return;
    try {
      await schoolApi.deleteTimetable(id);
      loadTimetable();
    } catch {
      alert("Error deleting period.");
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-emerald-400" /> Class Timetable
          </h1>
          <p className="text-sm text-slate-400">
            {canManageTimetable ? "View and manage daily subject schedules and room allocations." : "View daily subject schedules and room allocations."}
          </p>
        </div>

        {canManageTimetable && (
          <button
            onClick={() => {
              setForm({ ...form, day_of_week: selectedDay });
              setShowModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold shadow-lg shadow-emerald-500/20 flex items-center gap-2 text-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Add Period
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 border-b border-slate-800 pb-3 overflow-x-auto">
        {DAYS.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              selectedDay === day
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-slate-400 hover:bg-slate-800/60"
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      ) : timetables.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <p className="text-slate-400 text-sm">
            {canManageTimetable ? "No periods scheduled for " + selectedDay + ". Click \"Add Period\" to add class schedules." : "No periods scheduled for " + selectedDay + "."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {timetables.map((item) => (
            <div key={item.id} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3 relative group">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span className="font-bold text-emerald-400">{item.start_time} - {item.end_time}</span>
                {canManageTimetable && (
                  <button onClick={() => handleDelete(item.id)} className="text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <h4 className="text-base font-bold text-white">{item.subject?.name ?? "Subject"}</h4>
              <div className="space-y-1 text-xs text-slate-400">
                <p className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {item.teacher?.name ?? "Teacher Unassigned"}</p>
                <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {item.room_number ?? "Unassigned Room"}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && canManageTimetable && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Add Schedule Period</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Day of Week</label>
                <select
                  value={form.day_of_week}
                  onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none"
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Start Time</label>
                  <input
                    type="time"
                    required
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">End Time</label>
                  <input
                    type="time"
                    required
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Room Number</label>
                <input
                  type="text"
                  value={form.room_number}
                  onChange={(e) => setForm({ ...form, room_number: e.target.value })}
                  placeholder="e.g. Room 102"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition-all"
              >
                Add Period
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
