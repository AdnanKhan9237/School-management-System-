// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginCredentials {
  email: string;
  password: string;
  tenant?: string; // X-Tenant header value
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "principal" | "teacher" | "student" | "parent" | "accountant";
  avatar: string | null;
  permissions: string[];
  school?: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  };
}

export interface AuthResponse {
  token: string;
  refresh_token: string;
  expires_at: string;
  user: AuthUser;
}

// ─── Super Admin ─────────────────────────────────────────────────────────────

export type SchoolStatus = "active" | "suspended" | "trial" | "cancelled";
export type SubscriptionPlan = "basic" | "standard" | "premium";

export interface School {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  plan: SubscriptionPlan;
  status: SchoolStatus;
  trial_ends_at: string | null;
  max_students: number;
  max_teachers: number;
  onboarded_at: string | null;
  suspended_at: string | null;
  suspension_reason: string | null;
  created_at: string;
  students_count?: number;
  teachers_count?: number;
}

export interface SubscriptionPlanModel {
  id: string;
  name: string;
  slug: string;
  price_monthly: number; // paisa
  price_yearly: number;  // paisa
  max_students: number;
  max_teachers: number;
  features: string[];
  is_active: boolean;
}

export interface Invoice {
  id: string;
  tenant_id: string;
  invoice_number: string;
  amount: number;       // paisa
  tax_amount: number;
  total_amount: number;
  status: "pending" | "paid" | "overdue" | "cancelled";
  due_date: string;
  paid_at: string | null;
  payment_method: string | null;
  school?: { name: string; slug: string };
  created_at: string;
}

export interface AnalyticsOverview {
  total_schools: number;
  active_subscriptions: number;
  monthly_revenue: number; // paisa
  total_students: number;
  growth: {
    schools: number;
    revenue: number;
    students: number;
  };
}

// ─── Tenant — Students ────────────────────────────────────────────────────────

export type StudentStatus = "active" | "alumni" | "transferred" | "expelled";
export type FeeStatus = "pending" | "partial" | "paid" | "overdue" | "waived";

export interface SchoolClass {
  id: string;
  name: string;
  section: string | null;
  academic_year: string;
  class_teacher_id: string | null;
  max_students: number;
  students_count?: number;
}

export interface Student {
  id: string;
  admission_number: string;
  roll_number: string | null;
  admission_date: string;
  father_name: string;
  mother_name: string;
  guardian_name: string | null;
  blood_group: string | null;
  status: StudentStatus;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar: string | null;
    gender: "male" | "female" | "other";
    date_of_birth: string | null;
    address: string | null;
  };
  class: SchoolClass | null;
  attendance_percentage?: number;
  fee_status?: FeeStatus;
}

export interface Parent {
  id: string;
  name: string;
  email: string;
  phone: string;
  children?: Student[];
}

// ─── Tenant — Attendance ─────────────────────────────────────────────────────

export type AttendanceStatus = "present" | "absent" | "late" | "leave";

export interface AttendanceRecord {
  id: string;
  student_id: string;
  class_id: string;
  date: string;
  status: AttendanceStatus;
  remarks: string | null;
  student?: { name: string; admission_number: string; avatar: string | null };
}

export interface AttendanceSummary {
  date: string;
  total_students: number;
  present: number;
  absent: number;
  late: number;
  leave: number;
  percentage: number;
  by_class: Array<{
    class_id: string;
    class_name: string;
    present: number;
    total: number;
    percentage: number;
  }>;
}

// ─── Tenant — Fees ───────────────────────────────────────────────────────────

export type PaymentMethod = "cash" | "jazzcash" | "easypaisa" | "bank" | "cheque";

export interface FeeStructure {
  id: string;
  name: string;
  class_id: string | null;
  amount: number; // paisa
  frequency: "monthly" | "quarterly" | "yearly" | "one_time";
  due_day: number | null;
  late_fine_per_day: number;
  academic_year: string;
  is_active: boolean;
}

export interface FeePayment {
  id: string;
  student_id: string;
  fee_structure_id: string;
  amount_due: number;
  amount_paid: number;
  discount_amount: number;
  fine_amount: number;
  month_year: string;
  due_date: string;
  paid_date: string | null;
  status: FeeStatus;
  payment_method: PaymentMethod | null;
  receipt_number: string | null;
  remarks?: string | null;
  student?: { name: string; admission_number: string };
  fee_structure?: { name: string };
}

// ─── Tenant — Exams & Results ────────────────────────────────────────────────

export interface Exam {
  id: string;
  name: string;
  class_id: string;
  academic_year: string;
  start_date: string;
  end_date: string;
  result_date: string | null;
  status: "upcoming" | "ongoing" | "completed" | "published";
}

export interface Result {
  id: string;
  exam_id: string;
  student_id: string;
  subject_id: string;
  total_marks: number;
  obtained_marks: number;
  grade: string | null;
  remarks: string | null;
  subject?: { name: string; code: string };
  student?: { name: string; admission_number: string };
}

// ─── API Response wrapper ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}
