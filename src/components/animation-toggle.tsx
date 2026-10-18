"use client";

import { Mouse, MouseOff } from "lucide-react";
import {
  setBackgroundEnabled,
  useBackgroundPreference,
} from "@/lib/background-preference";

export function AnimationToggle() {
  const preference = useBackgroundPreference();
  const enabled = preference === "on" || preference === "system-on";
  const label = enabled ? "Animasyonları kapat" : "Animasyonları aç";
  return (
    <button
      type="button"
      className="animation-toggle"
      lang="tr"
      aria-label={label}
      aria-pressed={enabled}
      onClick={() => setBackgroundEnabled(!enabled)}
    >
      <Mouse className="animation-icon-on" size={19} aria-hidden="true" />
      <MouseOff className="animation-icon-off" size={19} aria-hidden="true" />
      <span className="animation-tooltip" role="tooltip" aria-hidden="true">
        {label}
      </span>
    </button>
  );
}
