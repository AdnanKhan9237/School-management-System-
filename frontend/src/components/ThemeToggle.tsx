"use client";

import React from "react";
import { Sun, Moon, Laptop } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";

export function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl border border-slate-300/50 dark:border-slate-700/50 transition-colors">
      <button
        type="button"
        onClick={() => setTheme("light")}
        title="Light Mode"
        className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all duration-200 ${
          theme === "light"
            ? "bg-white dark:bg-slate-900 text-amber-500 shadow-sm"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        }`}
      >
        <Sun className="w-4 h-4" />
        {showLabel && <span>Light</span>}
      </button>

      <button
        type="button"
        onClick={() => setTheme("dark")}
        title="Dark Mode"
        className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all duration-200 ${
          theme === "dark"
            ? "bg-slate-900 text-emerald-400 shadow-sm"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        }`}
      >
        <Moon className="w-4 h-4" />
        {showLabel && <span>Dark</span>}
      </button>

      <button
        type="button"
        onClick={() => setTheme("system")}
        title="System Preference"
        className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all duration-200 ${
          theme === "system"
            ? "bg-white dark:bg-slate-900 text-emerald-500 dark:text-emerald-400 shadow-sm"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        }`}
      >
        <Laptop className="w-4 h-4" />
        {showLabel && <span>System</span>}
      </button>
    </div>
  );
}
