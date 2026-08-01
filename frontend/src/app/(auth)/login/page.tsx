"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building2,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { superAdminApi, schoolApi } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import type { AuthUser } from "@/types";
import { AivoraLogo } from "@/components/AivoraLogo";
import { ThemeToggle } from "@/components/ThemeToggle";

type LoginMode = "school" | "super-admin";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, setSuperAdmin } = useAuthStore();

  const [mode, setMode] = useState<LoginMode>("school");
  const [tenant, setTenant] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "super-admin") {
        const res = await superAdminApi.login(email, password);
        const { token, data } = res.data;
        setSuperAdmin(token ?? res.data.data?.token, data?.user ?? res.data.data);
        router.push("/super-admin/dashboard");
      } else {
        if (!tenant) {
          setError("Please enter your school subdomain.");
          setLoading(false);
          return;
        }
        localStorage.setItem("tenant", tenant);
        const res = await schoolApi.login(email, password);
        const d = res.data.data;
        setAuth(d.token, d.refresh_token, d.user as AuthUser, tenant);
        router.push("/school/dashboard");
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Login failed. Please check your credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden transition-colors">
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle showLabel />
      </div>

      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/10 dark:bg-teal-500/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fadeIn z-10">
        {/* Logo & Header */}
        <div className="flex flex-col items-center justify-center mb-6 text-center">
          <AivoraLogo size="lg" showText={true} subtitle="School Management SaaS" />
        </div>

        {/* Card */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 rounded-3xl p-8 shadow-xl dark:shadow-2xl">
          {/* Mode toggle */}
          <div className="flex rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 p-1 mb-6">
            <button
              type="button"
              onClick={() => { setMode("school"); setError(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 ${
                mode === "school"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/25"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Building2 className="w-4 h-4" />
              School Login
            </button>
            <button
              type="button"
              onClick={() => { setMode("super-admin"); setError(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 ${
                mode === "super-admin"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-500/25"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Super Admin
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* School subdomain */}
            {mode === "school" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  School Subdomain
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    value={tenant}
                    onChange={(e) => setTenant(e.target.value)}
                    placeholder="e.g. cityschool"
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl pl-10 pr-16 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-xs font-medium">.localhost</span>
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@school.com"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl pl-10 pr-10 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-600 dark:text-red-400 text-sm animate-fadeIn">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all duration-200 shadow-lg ${
                mode === "super-admin"
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-purple-500/25"
                  : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/25"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/40">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Demo Credentials</p>
              <button
                type="button"
                onClick={() => {
                  if (mode === "super-admin") {
                    setEmail("admin@schoolsaas.com");
                    setPassword("Admin@123456");
                  } else {
                    setTenant("demo");
                    setEmail("principal@demo.com");
                    setPassword("Principal@123");
                  }
                }}
                className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Auto-fill
              </button>
            </div>
            {mode === "super-admin" ? (
              <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 font-mono">
                <p>Email: <span className="text-purple-600 dark:text-purple-400 font-semibold">admin@schoolsaas.com</span></p>
                <p>Password: <span className="text-purple-600 dark:text-purple-400 font-semibold">Admin@123456</span></p>
              </div>
            ) : (
              <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 font-mono">
                <p>Subdomain: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">demo</span></p>
                <p>Email: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">principal@demo.com</span></p>
                <p>Password: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Principal@123</span></p>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-slate-500 dark:text-slate-500 text-xs mt-6 font-medium">
          Powered by Aivora Technology · EduSuite SaaS
        </p>
      </div>
    </main>
  );
}
