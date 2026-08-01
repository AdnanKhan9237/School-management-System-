"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  GraduationCap,
  Edit3,
  Trash2,
  KeyRound,
  Loader2,
  X,
  Mail,
  Phone,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { userApi } from "@/lib/api";
import { initials } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";

// ─── Types ────────────────────────────────────────────────────────────────────

type StaffRole = "teacher" | "accountant";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: StaffRole | "principal";
  gender: "male" | "female" | "other" | null;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  principal:  "bg-purple-500/15 text-purple-400 border-purple-500/30",
  teacher:    "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  accountant: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

const ROLE_LABELS: Record<string, string> = {
  principal:  "Principal",
  teacher:    "Teacher",
  accountant: "Accountant",
};

const AVATAR_GRADIENTS: Record<string, string> = {
  principal:  "from-purple-600 to-indigo-700",
  teacher:    "from-emerald-600 to-teal-700",
  accountant: "from-blue-600 to-cyan-700",
};

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  role: "teacher" as StaffRole,
  gender: "male",
  password: "",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TeachersPage() {
  const [staff, setStaff]         = useState<StaffMember[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [lastPage, setLastPage]   = useState(1);
  const [search, setSearch]       = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [loading, setLoading]     = useState(false);

  // Modals
  const [showAdd, setShowAdd]           = useState(false);
  const [showEdit, setShowEdit]         = useState<StaffMember | null>(null);
  const [showReset, setShowReset]       = useState<StaffMember | null>(null);
  const [showDelete, setShowDelete]     = useState<StaffMember | null>(null);

  // Form state
  const [addForm, setAddForm]     = useState(EMPTY_FORM);
  const [editForm, setEditForm]   = useState<Partial<StaffMember>>({});
  const [resetPwd, setResetPwd]   = useState({ password: "", password_confirmation: "" });

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState("");

  // ── Load ──────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), per_page: "12" };
      if (search)     params.search = search;
      if (roleFilter !== "all") params.role = roleFilter;

      const res = await userApi.getUsers(params);
      const body = res.data;
      setStaff(body.data ?? []);
      setTotal(body.meta?.total ?? 0);
      setLastPage(body.meta?.last_page ?? 1);
    } catch {
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => { load(); }, [load]);

  // ── Search debounce ───────────────────────────────────────────────────────

  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ── Add ───────────────────────────────────────────────────────────────────

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(""); setSubmitting(true);
    try {
      await userApi.createUser({
        name:     addForm.name,
        email:    addForm.email,
        phone:    addForm.phone || undefined,
        role:     addForm.role,
        gender:   addForm.gender,
        password: addForm.password,
      });
      setShowAdd(false);
      setAddForm(EMPTY_FORM);
      load();
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
      if (errData?.errors) {
        setFormError(Object.values(errData.errors).flat().join(" | "));
      } else {
        setFormError(errData?.message ?? "Failed to create staff member.");
      }
    } finally { setSubmitting(false); }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────

  const openEdit = (member: StaffMember) => {
    setEditForm({
      name:      member.name,
      email:     member.email,
      phone:     member.phone ?? "",
      role:      member.role,
      is_active: member.is_active,
    });
    setFormError("");
    setShowEdit(member);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEdit) return;
    setFormError(""); setSubmitting(true);
    try {
      await userApi.updateUser(showEdit.id, editForm);
      setShowEdit(null);
      load();
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
      setFormError(errData?.errors ? Object.values(errData.errors).flat().join(" | ") : (errData?.message ?? "Update failed."));
    } finally { setSubmitting(false); }
  };

  // ── Toggle Active ─────────────────────────────────────────────────────────

  const toggleActive = async (member: StaffMember) => {
    try {
      await userApi.updateUser(member.id, { is_active: !member.is_active });
      load();
    } catch {}
  };

  // ── Reset Password ────────────────────────────────────────────────────────

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showReset) return;
    if (resetPwd.password !== resetPwd.password_confirmation) {
      setFormError("Passwords do not match."); return;
    }
    setFormError(""); setSubmitting(true);
    try {
      await userApi.resetPassword(showReset.id, resetPwd);
      setShowReset(null);
      setResetPwd({ password: "", password_confirmation: "" });
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setFormError(errData?.message ?? "Password reset failed.");
    } finally { setSubmitting(false); }
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!showDelete) return;
    setSubmitting(true);
    try {
      await userApi.deleteUser(showDelete.id);
      setShowDelete(null);
      load();
    } catch {} finally { setSubmitting(false); }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const ROLE_TABS = [
    { key: "all",       label: "All Staff" },
    { key: "teacher",   label: "Teachers" },
    { key: "accountant",label: "Accountants" },
  ];

  const { user, hydrate } = useAuthStore();
  useEffect(() => { hydrate(); }, [hydrate]);
  const canManageStaff = user?.role === "principal" || (user?.role as string) === "super_admin";

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-400" /> Teachers &amp; Staff
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">{total} staff member{total !== 1 ? "s" : ""}</p>
        </div>
        {canManageStaff && (
          <button
            id="add-staff-btn"
            onClick={() => { setAddForm(EMPTY_FORM); setFormError(""); setShowAdd(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" /> Add Staff
          </button>
        )}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Role tabs */}
        <div className="flex bg-slate-900/60 border border-slate-800/60 rounded-xl overflow-hidden p-1 gap-1">
          {ROLE_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setRoleFilter(tab.key); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                roleFilter === tab.key
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, email or phone…"
            className="w-full bg-slate-900/60 border border-slate-800/60 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>
      </div>

      {/* Staff Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
        </div>
      ) : staff.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-16 text-center">
          <GraduationCap className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No staff members found</p>
          <p className="text-slate-600 text-sm mt-1">Click &quot;Add Staff&quot; to create the first teacher.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((member) => (
            <div
              key={member.id}
              className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-5 hover:border-slate-700/60 transition-all group"
            >
              {/* Card top */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl bg-gradient-to-br ${AVATAR_GRADIENTS[member.role] ?? AVATAR_GRADIENTS.teacher} flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-lg`}
                  >
                    {initials(member.name)}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm leading-tight">{member.name}</p>
                    <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium border ${ROLE_COLORS[member.role] ?? ROLE_COLORS.teacher}`}>
                      {ROLE_LABELS[member.role] ?? member.role}
                    </span>
                  </div>
                </div>

                {/* Active toggle */}
                <button
                  onClick={() => toggleActive(member)}
                  title={member.is_active ? "Deactivate" : "Activate"}
                  className="text-slate-500 hover:text-emerald-400 transition-colors"
                >
                  {member.is_active
                    ? <ToggleRight className="w-5 h-5 text-emerald-400" />
                    : <ToggleLeft className="w-5 h-5" />}
                </button>
              </div>

              {/* Contact info */}
              <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0 text-slate-600" />
                  <span className="truncate">{member.email}</span>
                </div>
                {member.phone && (
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0 text-slate-600" />
                    <span>{member.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                  {member.is_active
                    ? <UserCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    : <UserX className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />}
                  <span>{member.is_active ? "Active" : "Inactive"} · Last login: {timeAgo(member.last_login_at)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 pt-3 border-t border-slate-800/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  id={`edit-staff-${member.id}`}
                  onClick={() => openEdit(member)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  id={`reset-pwd-${member.id}`}
                  onClick={() => { setResetPwd({ password: "", password_confirmation: "" }); setFormError(""); setShowReset(member); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                >
                  <KeyRound className="w-3.5 h-3.5" /> Reset Pwd
                </button>
                {member.role !== "principal" && (
                  <button
                    id={`delete-staff-${member.id}`}
                    onClick={() => setShowDelete(member)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-500">
            Page {page} of {lastPage} · {total} total
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-2 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= lastPage}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Add Staff Modal ─────────────────────────────────────────────── */}
      {showAdd && (
        <Modal title="Add Staff Member" icon={<Plus className="w-4 h-4 text-emerald-400" />} onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd} className="space-y-4">
            <Section label="Personal Details">
              <Grid2>
                <Field label="Full Name *">
                  <input required value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    placeholder="Dr. Sarah Khan" className={INPUT} />
                </Field>
                <Field label="Email *">
                  <input required type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    placeholder="sarah@school.com" className={INPUT} />
                </Field>
                <Field label="Phone">
                  <input value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    placeholder="+92 300 1234567" className={INPUT} />
                </Field>
                <Field label="Gender">
                  <select value={addForm.gender} onChange={(e) => setAddForm({ ...addForm, gender: e.target.value })} className={INPUT}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </Field>
              </Grid2>
            </Section>

            <Section label="Role & Access">
              <Grid2>
                <Field label="Role *">
                  <select value={addForm.role} onChange={(e) => setAddForm({ ...addForm, role: e.target.value as StaffRole })} className={INPUT}>
                    <option value="teacher">Teacher</option>
                    <option value="accountant">Accountant</option>
                  </select>
                </Field>
                <Field label="Temporary Password *">
                  <input required type="password" value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    placeholder="Min 8 characters" className={INPUT} minLength={8} />
                </Field>
              </Grid2>
            </Section>

            {formError && <ErrorBanner message={formError} />}
            <ModalActions onCancel={() => setShowAdd(false)} submitting={submitting} label="Create Staff Member" />
          </form>
        </Modal>
      )}

      {/* ── Edit Staff Modal ────────────────────────────────────────────── */}
      {showEdit && (
        <Modal title={`Edit — ${showEdit.name}`} icon={<Edit3 className="w-4 h-4 text-blue-400" />} onClose={() => setShowEdit(null)}>
          <form onSubmit={handleEdit} className="space-y-4">
            <Grid2>
              <Field label="Full Name">
                <input value={editForm.name ?? ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={INPUT} />
              </Field>
              <Field label="Email">
                <input type="email" value={editForm.email ?? ""} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className={INPUT} />
              </Field>
              <Field label="Phone">
                <input value={(editForm.phone as string) ?? ""} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className={INPUT} />
              </Field>
              {showEdit.role !== "principal" && (
                <Field label="Role">
                  <select value={(editForm.role as string) ?? ""} onChange={(e) => setEditForm({ ...editForm, role: e.target.value as StaffRole })} className={INPUT}>
                    <option value="teacher">Teacher</option>
                    <option value="accountant">Accountant</option>
                  </select>
                </Field>
              )}
            </Grid2>

            <div className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl">
              <button
                type="button"
                onClick={() => setEditForm({ ...editForm, is_active: !editForm.is_active })}
                className="text-slate-400"
              >
                {editForm.is_active
                  ? <ToggleRight className="w-6 h-6 text-emerald-400" />
                  : <ToggleLeft className="w-6 h-6" />}
              </button>
              <span className="text-sm text-slate-300">
                Account is <span className={editForm.is_active ? "text-emerald-400 font-semibold" : "text-slate-500 font-semibold"}>
                  {editForm.is_active ? "Active" : "Inactive"}
                </span>
              </span>
            </div>

            {formError && <ErrorBanner message={formError} />}
            <ModalActions onCancel={() => setShowEdit(null)} submitting={submitting} label="Save Changes" />
          </form>
        </Modal>
      )}

      {/* ── Reset Password Modal ────────────────────────────────────────── */}
      {showReset && (
        <Modal title="Reset Password" icon={<KeyRound className="w-4 h-4 text-blue-400" />} onClose={() => setShowReset(null)}>
          <p className="text-sm text-slate-400 mb-4">
            Set a new password for <span className="text-white font-semibold">{showReset.name}</span>. They will need to use this to log in next time.
          </p>
          <form onSubmit={handleReset} className="space-y-4">
            <Field label="New Password">
              <input required type="password" value={resetPwd.password}
                onChange={(e) => setResetPwd({ ...resetPwd, password: e.target.value })}
                placeholder="Min 8 characters" className={INPUT} minLength={8} />
            </Field>
            <Field label="Confirm Password">
              <input required type="password" value={resetPwd.password_confirmation}
                onChange={(e) => setResetPwd({ ...resetPwd, password_confirmation: e.target.value })}
                placeholder="Repeat password" className={INPUT} minLength={8} />
            </Field>
            {formError && <ErrorBanner message={formError} />}
            <ModalActions onCancel={() => setShowReset(null)} submitting={submitting} label="Reset Password" />
          </form>
        </Modal>
      )}

      {/* ── Delete Confirm Modal ─────────────────────────────────────────── */}
      {showDelete && (
        <Modal title="Remove Staff Member" icon={<Trash2 className="w-4 h-4 text-red-400" />} onClose={() => setShowDelete(null)}>
          <p className="text-sm text-slate-400 mb-6">
            Are you sure you want to remove <span className="text-white font-semibold">{showDelete.name}</span>? This action soft-deletes the account and can be recovered.
          </p>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowDelete(null)} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-sm hover:border-slate-600 hover:text-white transition-all">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Removing…</> : "Yes, Remove"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Shared UI primitives ─────────────────────────────────────────────────────

const INPUT = "w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors placeholder-slate-500";

function Modal({ title, icon, onClose, children }: { title: string; icon: React.ReactNode; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            {icon} {title}
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">{label}</p>
      {children}
    </div>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-slate-400">{label}</label>
      {children}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
      {message}
    </div>
  );
}

function ModalActions({ onCancel, submitting, label }: { onCancel: () => void; submitting: boolean; label: string }) {
  return (
    <div className="flex gap-3 pt-2">
      <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-sm hover:border-slate-600 hover:text-white transition-all">
        Cancel
      </button>
      <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50">
        {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</> : label}
      </button>
    </div>
  );
}
