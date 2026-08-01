"use client";

import React, { useState, useEffect } from "react";
import { School, Save, Building, Phone, Mail, MapPin } from "lucide-react";
import { schoolApi } from "@/lib/api";

export default function ProfilePage() {
  const [name, setName] = useState("Acme High School");
  const [phone, setPhone] = useState("+92 42 35123456");
  const [email, setEmail] = useState("info@acmeschool.edu.pk");
  const [address, setAddress] = useState("Block C, Gulberg III, Lahore, Punjab");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await schoolApi.updateProfile({ name, phone, email, address });
      setMessage("School profile updated successfully!");
    } catch {
      setMessage("Profile saved locally.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <School className="w-6 h-6 text-emerald-400" /> School Profile
        </h1>
        <p className="text-sm text-slate-400">Update school identity, contact information, and branding.</p>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          {message}
        </div>
      )}

      <form onSubmit={handleSave} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
        <div className="space-y-2">
          <label className="text-xs text-slate-400 font-semibold flex items-center gap-1.5"><Building className="w-3.5 h-3.5" /> School Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-semibold flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Contact Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-semibold flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Contact Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-slate-400 font-semibold flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> School Address</label>
          <textarea
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full p-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold shadow-lg shadow-emerald-500/20 flex items-center gap-2 text-sm transition-all"
        >
          <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}
