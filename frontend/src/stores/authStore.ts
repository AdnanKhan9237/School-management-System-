import { create } from "zustand";
import type { AuthUser } from "@/types";

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  tenant: string | null;
  isSuperAdmin: boolean;

  // Actions
  setAuth: (token: string, refreshToken: string, user: AuthUser, tenant?: string) => void;
  setSuperAdmin: (token: string, user: AuthUser) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  refreshToken: null,
  user: null,
  tenant: null,
  isSuperAdmin: false,

  setAuth: (token, refreshToken, user, tenant) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
      localStorage.setItem("refresh_token", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));
      if (tenant) localStorage.setItem("tenant", tenant);
    }
    set({ token, refreshToken, user, tenant: tenant ?? null, isSuperAdmin: false });
  },

  setSuperAdmin: (token, user) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
      localStorage.setItem("is_super_admin", "true");
      localStorage.setItem("user", JSON.stringify(user));
    }
    set({ token, user, isSuperAdmin: true, tenant: null });
  },

  setUser: (user) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(user));
    }
    set({ user });
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("tenant");
      localStorage.removeItem("is_super_admin");
      localStorage.removeItem("user");
    }
    set({ token: null, refreshToken: null, user: null, tenant: null, isSuperAdmin: false });
  },

  hydrate: () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    const refreshToken = localStorage.getItem("refresh_token");
    const tenant = localStorage.getItem("tenant");
    const isSuperAdmin = localStorage.getItem("is_super_admin") === "true";
    const userStr = localStorage.getItem("user");
    let user: AuthUser | null = null;
    if (userStr) {
      try { user = JSON.parse(userStr); } catch {}
    }
    if (token) {
      set({ token, refreshToken, tenant, isSuperAdmin, user });
    }
  },
}));
