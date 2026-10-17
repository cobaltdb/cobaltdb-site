"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Check, ChevronDown, Monitor, Moon, Sun } from "lucide-react";

export const THEME_KEY = "cobaltdb-theme";
type Theme = "system" | "light" | "dark";
const choices = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;
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
  const [open, setOpen] = useState(false);
  const picker = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const theme = useSyncExternalStore(
    subscribe,
    snapshot,
    () => "system" as const,
  );
  const current =
    choices.find((choice) => choice.value === theme) ?? choices[2];
  const Icon = current.icon;
  useEffect(() => {
    if (!open) return;
    picker.current?.querySelector<HTMLInputElement>("input:checked")?.focus();
    function dismiss(event: PointerEvent | FocusEvent) {
      if (
        event.target instanceof Node &&
        !picker.current?.contains(event.target)
      )
        setOpen(false);
    }
    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      trigger.current?.focus();
    }
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("focusin", dismiss);
    document.addEventListener("keydown", dismissOnEscape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("focusin", dismiss);
      document.removeEventListener("keydown", dismissOnEscape);
    };
  }, [open]);
  function change(next: Theme) {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* The selection still works when storage is unavailable. */
    }
    window.dispatchEvent(new Event("cobaltdb:theme-change"));
  }
  return (
    <div className="theme-picker" ref={picker}>
      <button
        type="button"
        className="theme-trigger"
        ref={trigger}
        aria-label={`Color theme: ${current.label}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        <Icon aria-hidden="true" />
        <span>{current.label}</span>
        <ChevronDown className="theme-chevron" aria-hidden="true" />
      </button>
      {open && (
        <div
          className="theme-panel"
          id={id}
          role="dialog"
          aria-label="Appearance"
        >
          <div className="theme-panel-heading">
            <span>Appearance</span>
            <span className="theme-panel-hint">Your space, your style.</span>
          </div>
          <fieldset className="theme-options">
            <legend className="sr-only">Color theme</legend>
            {choices.map(({ value, label, icon: ChoiceIcon }) => (
              <label className="theme-option" key={value}>
                <input
                  type="radio"
                  name={`${id}-theme`}
                  value={value}
                  checked={theme === value}
                  onChange={() => change(value)}
                />
                <span
                  className={`theme-preview theme-preview-${value}`}
                  aria-hidden="true"
                >
                  <span className="theme-preview-window">
                    <span className="theme-preview-sidebar" />
                    <span className="theme-preview-content">
                      <i />
                      <i />
                      <i />
                    </span>
                  </span>
                  <span className="theme-choice-icon">
                    <ChoiceIcon />
                  </span>
                  <span className="theme-choice-check">
                    <Check />
                  </span>
                </span>
                <span className="theme-option-label">{label}</span>
              </label>
            ))}
          </fieldset>
          <p className="theme-panel-status" aria-live="polite">
            <Icon aria-hidden="true" />
            {theme === "system"
              ? "Matches your device’s appearance."
              : `${current.label} mode, just how you like it.`}
          </p>
        </div>
      )}
    </div>
  );
}
