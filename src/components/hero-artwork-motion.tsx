"use client";

import { type ReactNode, useEffect, useRef } from "react";

/** Foreground artwork keeps its own visibility/system policy, independent of the backdrop. */
export function HeroArtworkMotion({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const wrapper = ref.current;
    const hero = wrapper?.closest<HTMLElement>(".hero-stage");
    const art = wrapper?.querySelector("svg");
    if (!hero || !art) return;
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const sync = () => {
      const playing = visible && !document.hidden && !query.matches;
      hero.dataset.sceneMotion = query.matches
        ? "reduced"
        : playing
          ? "running"
          : "paused";
      if (playing) art.unpauseAnimations();
      else art.pauseAnimations();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(hero);
    document.addEventListener("visibilitychange", sync);
    query.addEventListener("change", sync);
    sync();
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      query.removeEventListener("change", sync);
      delete hero.dataset.sceneMotion;
      art.unpauseAnimations();
    };
  }, []);
  return (
    <div className="database-art" ref={ref}>
      {children}
    </div>
  );
}
