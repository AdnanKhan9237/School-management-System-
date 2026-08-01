import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ─── Request interceptor — attach auth token & tenant header ─────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    const tenant = localStorage.getItem("tenant");

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    if (tenant) {
      config.headers["X-Tenant"] = tenant;
    }
  }
  return config;
});

// ─── Response interceptor — handle 401 globally ───────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("tenant");
        useAuthStore.getState().logout();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ─── Super Admin API calls ────────────────────────────────────────────────────

export const superAdminApi = {
  login: (email: string, password: string) =>
    api.post("/super-admin/login", { email, password }),

  logout: () => api.post("/super-admin/logout"),

  me: () => api.get("/super-admin/me"),

  // Schools
  getSchools: (params?: Record<string, string>) =>
    api.get("/super-admin/schools", { params }),
  getSchool: (id: string) => api.get(`/super-admin/schools/${id}`),
  createSchool: (data: Record<string, unknown>) =>
    api.post("/super-admin/schools", data),
  updateSchool: (id: string, data: Record<string, unknown>) =>
    api.put(`/super-admin/schools/${id}`, data),
  deleteSchool: (id: string) => api.delete(`/super-admin/schools/${id}`),
  suspendSchool: (id: string, reason: string) =>
    api.post(`/super-admin/schools/${id}/suspend`, { reason }),
  activateSchool: (id: string) =>
    api.post(`/super-admin/schools/${id}/activate`),
  getSchoolStats: (id: string) =>
    api.get(`/super-admin/schools/${id}/stats`),
  subscribeSchool: (id: string, data: { plan_id: string; billing_cycle: "monthly" | "yearly"; auto_renew?: boolean }) =>
    api.post(`/super-admin/schools/${id}/subscribe`, data),
  resetPrincipalPassword: (id: string, data: { password: string; password_confirmation: string }) =>
    api.post(`/super-admin/schools/${id}/reset-principal-password`, data),

  // Plans
  getPlans: () => api.get("/super-admin/plans"),
  createPlan: (data: Record<string, unknown>) =>
    api.post("/super-admin/plans", data),
  updatePlan: (id: string, data: Record<string, unknown>) =>
    api.put(`/super-admin/plans/${id}`, data),

  // Invoices
  getInvoices: (params?: Record<string, string>) =>
    api.get("/super-admin/invoices", { params }),
  getInvoice: (id: string) => api.get(`/super-admin/invoices/${id}`),
  createInvoice: (data: { tenant_id: string; amount: number; due_date: string }) =>
    api.post("/super-admin/invoices", data),
  markInvoicePaid: (id: string, data?: { payment_method?: string; payment_reference?: string; paid_at?: string }) =>
    api.post(`/super-admin/invoices/${id}/mark-paid`, data ?? { payment_method: "bank" }),

  // Analytics
  getOverview: () => api.get("/super-admin/analytics/overview"),
  getRevenue: () => api.get("/super-admin/analytics/revenue"),
  getSchoolsGrowth: () => api.get("/super-admin/analytics/schools"),
};

// ─── Tenant (School) API calls ────────────────────────────────────────────────

export const schoolApi = {
  // Auth
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
  refresh: (refreshToken: string) =>
    api.post("/auth/refresh", { refresh_token: refreshToken }),

  // Students
  getStudents: (params?: Record<string, string>) =>
    api.get("/students", { params }),
  getStudent: (id: string) => api.get(`/students/${id}`),
  admitStudent: (data: Record<string, unknown>) =>
    api.post("/students", data),
  createStudent: (data: FormData) =>
    api.post("/students", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateStudent: (id: string, data: Record<string, unknown>) =>
    api.put(`/students/${id}`, data),
  deleteStudent: (id: string) => api.delete(`/students/${id}`),
  exportStudents: () =>
    api.get("/students/export", { responseType: "blob" }),
  getStudentAttendanceSummary: (id: string) =>
    api.get(`/students/${id}/attendance-summary`),
  getStudentFeeHistory: (id: string) =>
    api.get(`/students/${id}/fee-history`),
  getStudentResults: (id: string) =>
    api.get(`/students/${id}/results`),

  // Classes
  getClasses: () => api.get("/classes"),
  getClass: (id: string) => api.get(`/classes/${id}`),
  createClass: (data: Record<string, unknown>) => api.post("/classes", data),
  getClassStudents: (id: string) => api.get(`/classes/${id}/students`),


  // Attendance
  getAttendanceSummary: () => api.get("/attendance/summary"),
  getTodayAttendance: () => api.get("/attendance/today"),
  getClassAttendance: (classId: string, date: string) =>
    api.get(`/attendance/class/${classId}`, { params: { date } }),
  markAttendance: (data: Record<string, unknown>) =>
    api.post("/attendance/mark", data),
  getMonthlyReport: (params?: Record<string, string>) =>
    api.get("/attendance/report/monthly", { params }),
  getLowAttendance: (params?: Record<string, string>) =>
    api.get("/attendance/report/low", { params }),

  // Fees
  getFeeStructures: () => api.get("/fees/structures"),
  createFeeStructure: (data: Record<string, unknown>) =>
    api.post("/fees/structures", data),
  getPendingFees: (params?: Record<string, string>) =>
    api.get("/fees/pending", { params }),
  getStudentFees: (studentId: string) =>
    api.get(`/fees/student/${studentId}`),
  collectFee: (data: Record<string, unknown>) =>
    api.post("/fees/collect", data),
  bulkGenerateFees: () => api.post("/fees/bulk-generate"),
  getFeeReceipt: (id: string) => api.get(`/fees/receipts/${id}`),
  getFeeReportSummary: (params?: Record<string, string>) =>
    api.get("/fees/report/summary", { params }),
  getFeeDefaulters: () => api.get("/fees/report/defaulters"),

  // Exams & Results
  getExams: () => api.get("/exams"),
  getExam: (id: string) => api.get(`/exams/${id}`),
  createExam: (data: Record<string, unknown>) => api.post("/exams", data),
  updateExam: (id: string, data: Record<string, unknown>) => api.put(`/exams/${id}`, data),
  deleteExam: (id: string) => api.delete(`/exams/${id}`),
  getExamResults: (examId: string) => api.get(`/exams/${examId}/results`),
  publishExam: (id: string) => api.post(`/exams/${id}/publish`),

  // Notifications
  getNotifications: () => api.get("/notifications"),
  getMyNotifications: () => api.get("/notifications/my"),
  markNotificationRead: (id: string) =>
    api.put(`/notifications/${id}/read`),
  sendNotification: (data: Record<string, unknown>) =>
    api.post("/notifications/send", data),

  // School Profile & Settings
  getProfile: () => api.get("/school/profile"),
  updateProfile: (data: Record<string, unknown>) => api.put("/school/profile", data),
  getSettings: () => api.get("/school/settings"),
  updateSettings: (data: Record<string, unknown>) => api.put("/school/settings", data),

  // Timetable
  getTimetable: (params?: Record<string, string>) => api.get("/timetable", { params }),
  createTimetable: (data: Record<string, unknown>) => api.post("/timetable", data),
  updateTimetable: (id: string, data: Record<string, unknown>) => api.put(`/timetable/${id}`, data),
  deleteTimetable: (id: string) => api.delete(`/timetable/${id}`),

  // Expenses
  getExpenses: (params?: Record<string, string>) => api.get("/expenses", { params }),
  createExpense: (data: Record<string, unknown>) => api.post("/expenses", data),
  updateExpense: (id: string, data: Record<string, unknown>) => api.put(`/expenses/${id}`, data),
  deleteExpense: (id: string) => api.delete(`/expenses/${id}`),

  // Staff Salaries
  getSalaries: (params?: Record<string, string>) => api.get("/salaries", { params }),
  createSalary: (data: Record<string, unknown>) => api.post("/salaries", data),
  updateSalary: (id: string, data: Record<string, unknown>) => api.put(`/salaries/${id}`, data),
  deleteSalary: (id: string) => api.delete(`/salaries/${id}`),
};

// ─── Users (Staff: teachers, accountants) API ────────────────────────────────

export const userApi = {
  getUsers: (params?: Record<string, string>) => api.get("/users", { params }),
  getUser: (id: string) => api.get(`/users/${id}`),
  createUser: (data: Record<string, unknown>) => api.post("/users", data),
  updateUser: (id: string, data: Record<string, unknown>) => api.put(`/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/users/${id}`),
  resetPassword: (id: string, data: { password: string; password_confirmation: string }) =>
    api.post(`/users/${id}/reset-password`, data),
};

