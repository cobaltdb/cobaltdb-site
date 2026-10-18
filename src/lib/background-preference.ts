"use client";

import { useSyncExternalStore } from "react";

export const BACKGROUND_PREFERENCE_KEY = "cobaltdb-animations";
const changed = "cobaltdb:background-motion-change";
const media = "(prefers-reduced-motion: reduce)";

/** Mouse effects follow the system default until the visitor saves a choice. */
export function backgroundPreference() {
  const choice = document.documentElement.dataset.backgroundMotion;
  if (choice === "on" || choice === "off") return choice;
  return matchMedia(media).matches ? "system-off" : "system-on";
}

function subscribe(notify: () => void) {
  const query = matchMedia(media);
  function storage(event: StorageEvent) {
    if (event.key !== BACKGROUND_PREFERENCE_KEY && event.key !== null) return;
    const value = event.key === null ? null : event.newValue;
    document.documentElement.dataset.backgroundMotion =
      value === "on" || value === "off" ? value : "system";
    notify();
  }
  window.addEventListener(changed, notify);
  window.addEventListener("storage", storage);
  query.addEventListener("change", notify);
  return () => {
    window.removeEventListener(changed, notify);
    window.removeEventListener("storage", storage);
    query.removeEventListener("change", notify);
  };
}

export function setBackgroundEnabled(enabled: boolean) {
  const value = enabled ? "on" : "off";
  document.documentElement.dataset.backgroundMotion = value;
  try {
    localStorage.setItem(BACKGROUND_PREFERENCE_KEY, value);
  } catch {
    // The control still works for this visit when storage is unavailable.
  }
  window.dispatchEvent(new Event(changed));
}

export function useBackgroundPreference() {
  return useSyncExternalStore(
    subscribe,
    backgroundPreference,
    () => "system-on",
  );
}
