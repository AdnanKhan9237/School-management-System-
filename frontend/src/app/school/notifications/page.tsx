"use client";

import React, { useState } from "react";
import { Bell, Send, CheckCircle2, MessageSquare, AlertCircle } from "lucide-react";

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<"logs" | "send">("logs");
  const [recipientGroup, setRecipientGroup] = useState("all_parents");
  const [message, setMessage] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-emerald-400" /> Notifications & SMS
          </h1>
          <p className="text-sm text-slate-400">Broadcast SMS alerts to parents, teachers, and staff.</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "logs" ? "bg-emerald-500 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Notification Logs
          </button>
          <button
            onClick={() => setActiveTab("send")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "send" ? "bg-emerald-500 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Send Broadcast
          </button>
        </div>
      </div>

      {activeTab === "logs" ? (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <h3 className="text-lg font-bold text-white">Recent Sent Messages</h3>
          <div className="divide-y divide-slate-800/60 text-sm">
            <div className="py-4 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-white">Monthly Fee Reminder</span>
                <span className="text-xs text-slate-400">Today, 10:30 AM</span>
              </div>
              <p className="text-xs text-slate-400">Sent to: All Parents (120 recipients)</p>
              <p className="text-xs text-slate-300 bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/30">
                Dear parent, monthly fee voucher for July 2026 is due by 10th July. Please pay online or at office.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4 max-w-2xl">
          <h3 className="text-lg font-bold text-white">New SMS / Broadcast</h3>

          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-semibold">Recipient Group</label>
            <select
              value={recipientGroup}
              onChange={(e) => setRecipientGroup(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none"
            >
              <option value="all_parents">All Parents</option>
              <option value="class_10">Class 10-A Parents Only</option>
              <option value="all_teachers">All Teachers</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-semibold">Message Text</label>
            <textarea
              rows={4}
              placeholder="Type your announcement message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none"
            />
          </div>

          <button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold shadow-lg shadow-emerald-500/20 flex items-center gap-2 text-sm transition-all">
            <Send className="w-4 h-4" /> Broadcast Message
          </button>
        </div>
      )}
    </div>
  );
}
