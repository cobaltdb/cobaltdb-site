"use client";

import { useEffect, useRef } from "react";
import { mountHeroScene } from "@/lib/hero-scene";

/** The content and illustration stay server rendered; only the backdrop hydrates. */
export function HeroBackground() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const element = canvas.current;
    const host = element?.parentElement;
    if (!element || !host) return;
    return mountHeroScene(element, host);
  }, []);

  return (
    <canvas
      ref={canvas}
      className="hero-canvas"
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}
