// ─── Currency ─────────────────────────────────────────────────────────────────

/**
 * Convert paisa to formatted PKR string.
 * e.g. 450000 → "Rs. 4,500"
 */
export function formatPKR(paisa: number): string {
  const rupees = paisa / 100;
  return `Rs. ${rupees.toLocaleString("en-PK")}`;
}

/**
 * Parse a PKR display string back to paisa.
 */
export function parsePKR(display: string): number {
  const num = parseFloat(display.replace(/[^0-9.]/g, ""));
  return Math.round(num * 100);
}

// ─── Dates ────────────────────────────────────────────────────────────────────

/**
 * Format ISO date string to DD/MM/YYYY (Pakistan display format).
 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB"); // DD/MM/YYYY
}

/**
 * Format ISO datetime to a human-readable "time ago" string.
 */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ─── Grade Colours ────────────────────────────────────────────────────────────

export function gradeColor(grade: string | null): string {
  switch (grade) {
    case "A+":
    case "A":
      return "text-emerald-400";
    case "B":
      return "text-blue-400";
    case "C":
      return "text-yellow-400";
    case "D":
      return "text-orange-400";
    case "F":
      return "text-red-400";
    default:
      return "text-slate-400";
  }
}

// ─── Status helpers ───────────────────────────────────────────────────────────

export function feeStatusColor(status: string): string {
  const map: Record<string, string> = {
    paid: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    overdue: "bg-red-500/20 text-red-400 border-red-500/30",
    partial: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    waived: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  };
  return map[status] ?? "bg-slate-500/20 text-slate-400";
}

export function schoolStatusColor(status: string): string {
  const map: Record<string, string> = {
    active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    trial: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    suspended: "bg-red-500/20 text-red-400 border-red-500/30",
    cancelled: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  };
  return map[status] ?? "bg-slate-500/20 text-slate-400";
}

export function attendanceStatusColor(status: string): string {
  const map: Record<string, string> = {
    present: "bg-emerald-500",
    absent: "bg-red-500",
    late: "bg-yellow-500",
    leave: "bg-blue-500",
  };
  return map[status] ?? "bg-slate-500";
}

// ─── Misc ─────────────────────────────────────────────────────────────────────

export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z0-9\s-]/g, "")   // keep only letters, numbers, spaces, hyphens
    .trim()
    .replace(/\s+/g, "-")            // spaces → hyphens
    .replace(/-+/g, "-")             // collapse multiple hyphens
    .substring(0, 63);
}

export function planBadgeColor(plan: string): string {
  const map: Record<string, string> = {
    premium: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    standard: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    basic: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  };
  return map[plan] ?? "bg-slate-500/20 text-slate-400";
}

export function initials(name?: string | null, fallback: string = "U"): string {
  if (!name || typeof name !== "string" || !name.trim()) return fallback;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return fallback;
  const res = parts.slice(0, 2).map((n) => n[0] ?? "").join("").toUpperCase();
  return res || fallback;
}
