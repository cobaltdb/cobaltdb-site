"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

export const THEME_KEY = "cobaltdb-theme";
type Theme = "system" | "light" | "dark";
function subscribe(callback: () => void) {
  const storage = (event: StorageEvent) => {
    if (event.key !== THEME_KEY && event.key !== null) return;
    const value = event.newValue;
    document.documentElement.dataset.theme =
      value === "light" || value === "dark" ? value : "system";
    callback();
  };
  window.addEventListener("cobaltdb:theme-change", callback);
  window.addEventListener("storage", storage);
  return () => {
    window.removeEventListener("cobaltdb:theme-change", callback);
    window.removeEventListener("storage", storage);
  };
}
function snapshot(): Theme {
  const theme = document.documentElement.dataset.theme;
  return theme === "light" || theme === "dark" ? theme : "system";
}
export function ThemePicker() {
  const theme = useSyncExternalStore(
    subscribe,
    snapshot,
    () => "system" as const,
  );
  function change(value: string) {
    const next: Theme =
      value === "dark" || value === "light" ? value : "system";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* The selection still works when storage is unavailable. */
    }
    window.dispatchEvent(new Event("cobaltdb:theme-change"));
  }
  return (
    <div className="theme-picker" title={`Color theme: ${theme}`}>
      <Sun className="theme-icon-light" size={18} />
      <Moon className="theme-icon-dark" size={18} />
      <select
        aria-label="Color theme"
        value={theme}
        onChange={(event) => change(event.target.value)}
      >
        <option value="system">System theme</option>
        <option value="light">Light theme</option>
        <option value="dark">Dark theme</option>
      </select>
    </div>
  );
}
