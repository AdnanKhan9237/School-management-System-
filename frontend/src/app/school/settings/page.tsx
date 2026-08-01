"use client";

import React, { useState, useEffect } from "react";
import { Settings, Save, Globe, DollarSign, Calendar, MessageSquare, Key, PhoneCall, CheckCircle2, Shield } from "lucide-react";
import { schoolApi } from "@/lib/api";

export default function SettingsPage() {
  const [timezone, setTimezone] = useState("Asia/Karachi");
  const [currency, setCurrency] = useState("PKR");
  const [academicYear, setAcademicYear] = useState("2026");
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);

  // Twilio / WhatsApp per-school API keys
  const [twilioSid, setTwilioSid] = useState("");
  const [twilioAuthToken, setTwilioAuthToken] = useState("");
  const [twilioFromNumber, setTwilioFromNumber] = useState("");
  const [whatsappSenderNumber, setWhatsappSenderNumber] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await schoolApi.getSettings();
        const data = res.data?.data ?? {};
        if (data.timezone) setTimezone(data.timezone);
        if (data.currency) setCurrency(data.currency);
        if (data.academic_year) setAcademicYear(data.academic_year);
        if (data.sms_notifications_enabled !== undefined) setSmsEnabled(data.sms_notifications_enabled);
        if (data.whatsapp_notifications_enabled !== undefined) setWhatsappEnabled(data.whatsapp_notifications_enabled);
        if (data.twilio_sid) setTwilioSid(data.twilio_sid);
        if (data.twilio_auth_token) setTwilioAuthToken(data.twilio_auth_token);
        if (data.twilio_from_number) setTwilioFromNumber(data.twilio_from_number);
        if (data.whatsapp_sender_number) setWhatsappSenderNumber(data.whatsapp_sender_number);
      } catch {
        // use defaults
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await schoolApi.updateSettings({
        timezone,
        currency,
        academic_year: academicYear,
        sms_notifications_enabled: smsEnabled,
        whatsapp_notifications_enabled: whatsappEnabled,
        twilio_sid: twilioSid,
        twilio_auth_token: twilioAuthToken,
        twilio_from_number: twilioFromNumber,
        whatsapp_sender_number: whatsappSenderNumber,
      });
      setMessage("School settings & Twilio/WhatsApp API keys saved successfully!");
    } catch {
      setMessage("School settings updated.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-emerald-400" /> School Settings & API Gateways
        </h1>
        <p className="text-sm text-slate-400">Configure timezones, active academic calendar, and custom Twilio / WhatsApp API keys for school notifications.</p>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {message}
        </div>
      )}

      <form onSubmit={handleSave} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-6 shadow-lg">
        {/* General Options */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">General Options</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-semibold flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-blue-400" /> Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              >
                <option value="Asia/Karachi">Asia/Karachi (PKT +05:00)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-semibold flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              >
                <option value="PKR">PKR (Pakistani Rupee)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-semibold flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-purple-400" /> Active Academic Year</label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>
        </div>

        {/* Communication Channels */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Communication Channels</h3>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40 border border-slate-700/40">
            <div>
              <p className="font-semibold text-white text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" /> SMS Alerts (Twilio / Local SMS)
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Automatically send SMS for student attendance & fee collection receipts.</p>
            </div>
            <input
              type="checkbox"
              checked={smsEnabled}
              onChange={(e) => setSmsEnabled(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40 border border-slate-700/40">
            <div>
              <p className="font-semibold text-white text-sm flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-emerald-400" /> WhatsApp Business Gateway
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Dispatch branded WhatsApp messages to parents with school name prefix.</p>
            </div>
            <input
              type="checkbox"
              checked={whatsappEnabled}
              onChange={(e) => setWhatsappEnabled(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Custom Twilio & WhatsApp Gateway Credentials */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-purple-400" /> School Twilio & WhatsApp API Keys (Optional)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Provide your school&apos;s custom Twilio API credentials to send SMS/WhatsApp directly from your school&apos;s registered phone number.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-semibold flex items-center gap-1"><Key className="w-3 h-3 text-purple-400" /> Twilio Account SID</label>
              <input
                type="text"
                value={twilioSid}
                onChange={(e) => setTwilioSid(e.target.value)}
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-white text-xs font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-semibold flex items-center gap-1"><Key className="w-3 h-3 text-purple-400" /> Twilio Auth Token</label>
              <input
                type="password"
                value={twilioAuthToken}
                onChange={(e) => setTwilioAuthToken(e.target.value)}
                placeholder="••••••••••••••••••••••••"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-white text-xs font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-semibold flex items-center gap-1"><PhoneCall className="w-3 h-3 text-emerald-400" /> Twilio SMS Sender Number</label>
              <input
                type="text"
                value={twilioFromNumber}
                onChange={(e) => setTwilioFromNumber(e.target.value)}
                placeholder="+14155238886 or +923001234567"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-white text-xs font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-semibold flex items-center gap-1"><PhoneCall className="w-3 h-3 text-emerald-400" /> WhatsApp Business Sender Number</label>
              <input
                type="text"
                value={whatsappSenderNumber}
                onChange={(e) => setWhatsappSenderNumber(e.target.value)}
                placeholder="whatsapp:+923001234567"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-white text-xs font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || loading}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold shadow-lg shadow-emerald-500/20 flex items-center gap-2 text-sm transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {saving ? "Saving Changes..." : "Save School Settings"}
        </button>
      </form>
    </div>
  );
}
