/** CSS pixels / seconds. Geometry and interactions share one bounded SVG scene. */
export const BACKGROUND_SCENE = {
  compactWidth: 768,
  objects: { full: 32, compact: 14 },
  routes: { full: 12, compact: 6, samples: 16, stops: 24 },
  pointer: { radius: 185, push: 25, settle: 5, follow: 12 },
  pulse: {
    max: 6,
    compactMax: 3,
    lifetime: 2.4,
    radius: 220,
    compactRadius: 145,
    segments: 12,
    mergeDistance: 46,
    mergeInterval: 0.14,
  },
  sparks: {
    count: 10,
    compactCount: 6,
    lifetime: 1.65,
    radius: 82,
    attack: 0.1,
  },
  idle: { after: 6, opacity: 0.55, fps: 30 },
  motion: { speed: 0.11, drift: 9, parallax: 0.07, packetSpeed: 22 },
  reading: { feather: 42, opacity: 0.035 },
  tap: { distance: 9, duration: 600 },
} as const;

export function objectSeed(index: number) {
  // A fixed low-discrepancy distribution keeps SSR and hydration in agreement.
  return {
    x: (index * 0.61803398875 + 0.11) % 1,
    y: (index * 0.38196601125 + 0.08 + Math.floor(index / 5) * 0.17) % 1,
    depth: 0.4 + (index % 7) / 11,
    phase: index * 2.39996,
  };
}

export function arcPath(index: number, hex = false) {
  const angle = (index * Math.PI) / 6;
  const next = angle + Math.PI / 6;
  const point = (a: number) => {
    if (!hex) return [Math.cos(a), Math.sin(a)];
    const step = a / (Math.PI / 3);
    const start = Math.floor(step);
    const t = step - start;
    return [
      Math.cos((start * Math.PI) / 3) * (1 - t) +
        Math.cos(((start + 1) * Math.PI) / 3) * t,
      Math.sin((start * Math.PI) / 3) * (1 - t) +
        Math.sin(((start + 1) * Math.PI) / 3) * t,
    ];
  };
  const [x, y] = point(angle);
  const [nx, ny] = point(next);
  return `M${x.toFixed(5)} ${y.toFixed(5)}${hex ? "L" : "A1 1 0 0 1 "}${nx.toFixed(5)} ${ny.toFixed(5)}`;
}

type Point = { x: number; y: number };
type ReadingBox = { left: number; right: number; top: number; bottom: number };
type Pulse = Point & {
  age: number;
  variant: number;
  strength: number;
  born: number;
  element: SVGGElement;
  rings: SVGGElement[];
  arcs: SVGUseElement[][];
  sparks: SVGUseElement[];
};
const clamp = (value: number, min = 0, max = 1) =>
  Math.max(min, Math.min(max, value));
const smooth = (value: number) => {
  const n = clamp(value);
  return n * n * (3 - 2 * n);
};
const wrap = (value: number, length: number) =>
  ((value % length) + length) % length;
const attr = (element: Element, name: string, value: string | number) => {
  const text = String(value);
  if (element.getAttribute(name) !== text) element.setAttribute(name, text);
};
const readingSelector =
  ".hero-copy,.section-heading,.quick-info,.query-copy,.footer-brand,.footer-column,.docs-sidebar,h1,h2,h3,p,.eyebrow,.breadcrumb,summary,.text-link";
const controlSelector =
  "a,button,input,textarea,select,label,summary,pre,code,dialog,[role='button'],[role='link'],[role='dialog'],[role='menu'],[contenteditable]:not([contenteditable='false'])";

export function mountBackgroundScene(svg: SVGSVGElement, prefix: string) {
  const motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
  const field = svg.querySelector<SVGGElement>(".fabric-field");
  if (!field) return;
  const objects = [...svg.querySelectorAll<SVGGElement>(".fabric-object")];
  const routes = [...svg.querySelectorAll<SVGPathElement>(".fabric-route")];
  const packets = [...svg.querySelectorAll<SVGRectElement>(".fabric-packet")];
  const gradients = [
    ...svg.querySelectorAll<SVGLinearGradientElement>(".fabric-route-gradient"),
  ];
  const stops = gradients.map((gradient) => [
    ...gradient.querySelectorAll("stop"),
  ]);
  const pulses: Pulse[] = [
    ...svg.querySelectorAll<SVGGElement>(".fabric-pulse"),
  ].map((element) => ({
    x: 0,
    y: 0,
    age: Infinity,
    variant: 0,
    strength: 1,
    born: 0,
    element,
    rings: [...element.querySelectorAll<SVGGElement>(".fabric-ring")],
    arcs: [...element.querySelectorAll<SVGGElement>(".fabric-ring")].map(
      (ring) => [...ring.querySelectorAll<SVGUseElement>("use")],
    ),
    sparks: [...element.querySelectorAll<SVGUseElement>(".fabric-spark")],
  }));
  let width = 1600;
  let height = 1000;
  let compact = false;
  let reduced = motionQuery.matches;
  let visible = false;
  let disposed = false;
  let raf = 0;
  let previous = 0;
  let time = 0;
  let lastInput = performance.now() - BACKGROUND_SCENE.idle.after * 1000;
  let energy: number = BACKGROUND_SCENE.idle.opacity;
  let scroll = window.scrollY;
  let sizeDirty = true;
  let targetsDirty = true;
  let readingDirty = true;
  let readingElements: Element[] = [];
  let reading: ReadingBox[] = [];
  let serial = 0;
  let press: (Point & { id: number; at: number; moved: boolean }) | undefined;
  const pointer = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    strength: 0,
    active: false,
  };
  let hero: HTMLElement | null = null;
  let heroArt: SVGSVGElement | null = null;
  let heroVisible = false;

  function syncHero() {
    if (!hero) return;
    const playing = heroVisible && visible && !document.hidden && !reduced;
    attr(
      hero,
      "data-scene-motion",
      reduced ? "reduced" : playing ? "running" : "paused",
    );
    if (playing) heroArt?.unpauseAnimations();
    else heroArt?.pauseAnimations();
  }
  const heroObserver = new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting;
    syncHero();
  });

  function refreshTargets() {
    readingElements = [...document.querySelectorAll(readingSelector)].filter(
      (element) => !element.parentElement?.closest(readingSelector),
    );
    const next = document.querySelector<HTMLElement>(".hero-stage");
    if (next !== hero) {
      if (hero) heroObserver.unobserve(hero);
      hero = next;
      heroArt =
        hero?.querySelector<SVGSVGElement>(".database-art > svg") ?? null;
      heroVisible = false;
      if (hero) heroObserver.observe(hero);
      syncHero();
    }
    targetsDirty = false;
    readingDirty = true;
  }
  function measure() {
    if (sizeDirty) {
      const box = svg.getBoundingClientRect();
      if (box.width && box.height) {
        width = box.width;
        height = box.height;
        compact = width < BACKGROUND_SCENE.compactWidth;
        attr(svg, "viewBox", `0 0 ${width} ${height}`);
        for (const gradient of gradients) attr(gradient, "x2", width);
        for (const pulse of pulses) {
          pulse.age = Infinity;
          pulse.element.removeAttribute("data-active");
        }
        pointer.active = false;
        pointer.strength = 0;
        press = undefined;
      }
      sizeDirty = false;
      readingDirty = true;
    }
    if (targetsDirty) refreshTargets();
    if (readingDirty) {
      reading = readingElements.flatMap((element) => {
        const box = element.getBoundingClientRect();
        return box.width &&
          box.height &&
          box.bottom > -60 &&
          box.top < height + 60
          ? [
              {
                left: box.left,
                right: box.right,
                top: box.top,
                bottom: box.bottom,
              },
            ]
          : [];
      });
      readingDirty = false;
      return true;
    }
    return false;
  }
  function edge(x: number, y: number) {
    return smooth(Math.min(x, width - x, y, height - y) / (compact ? 32 : 72));
  }
  function clarity(x: number, y: number) {
    let alpha = 1;
    for (const box of reading) {
      const dx = Math.max(box.left - x, 0, x - box.right);
      const dy = Math.max(box.top - y, 0, y - box.bottom);
      if (
        dx > BACKGROUND_SCENE.reading.feather ||
        dy > BACKGROUND_SCENE.reading.feather
      )
        continue;
      alpha = Math.min(
        alpha,
        BACKGROUND_SCENE.reading.opacity +
          (1 - BACKGROUND_SCENE.reading.opacity) *
            smooth(Math.hypot(dx, dy) / BACKGROUND_SCENE.reading.feather),
      );
      if (alpha <= BACKGROUND_SCENE.reading.opacity) break;
    }
    return alpha * edge(x, y);
  }
  function radius(progress: number) {
    return (
      (compact
        ? BACKGROUND_SCENE.pulse.compactRadius
        : BACKGROUND_SCENE.pulse.radius) *
      (1 - (1 - progress) ** 2)
    );
  }
  function displace(x: number, y: number, depth: number) {
    const dx = x - pointer.x,
      dy = y - pointer.y;
    const distance = Math.hypot(dx, dy);
    const force =
      smooth(1 - distance / BACKGROUND_SCENE.pointer.radius) *
      pointer.strength *
      BACKGROUND_SCENE.pointer.push *
      depth;
    let px = x + (dx / Math.max(1, distance)) * force;
    let py = y + (dy / Math.max(1, distance)) * force;
    for (const pulse of pulses) {
      if (pulse.age >= BACKGROUND_SCENE.pulse.lifetime) continue;
      const dx = x - pulse.x,
        dy = y - pulse.y;
      const progress = pulse.age / BACKGROUND_SCENE.pulse.lifetime;
      const distance = Math.hypot(dx, dy / 0.56);
      const force =
        Math.exp(-(((distance - radius(progress)) / 35) ** 2)) *
        (1 - progress) *
        16 *
        depth;
      const actual = Math.max(1, Math.hypot(dx, dy));
      px += (dx / actual) * force;
      py += (dy / actual) * force;
    }
    return { x: px, y: py };
  }
  function routePoint(index: number, fraction: number, displaced = true) {
    const count = compact
      ? BACKGROUND_SCENE.routes.compact
      : BACKGROUND_SCENE.routes.full;
    const span = height + width * 0.64;
    const base =
      wrap((index / (count - 1)) * span - scroll * 0.025, span) - width * 0.32;
    const x = width * fraction;
    const slope = index % 2 ? 0.3 : -0.3;
    const y =
      base +
      x * slope +
      Math.sin(time * 0.1 + index) * 4 -
      clamp((fraction - 0.42) / 0.12) * 32 * slope;
    return displaced ? displace(x, y, 0.55) : { x, y };
  }
  function render(dt: number, updateGradients: boolean) {
    // Transients expire in real time; only ambient geometry uses capped deltas.
    // Returning from a hidden/throttled tab must not resurrect an old click.
    const now = performance.now();
    for (const pulse of pulses) {
      if (pulse.age >= BACKGROUND_SCENE.pulse.lifetime) continue;
      pulse.age = Math.max(0, (now - pulse.born) / 1000);
      if (pulse.age >= BACKGROUND_SCENE.pulse.lifetime)
        pulse.element.removeAttribute("data-active");
    }
    const response = 1 - Math.exp(-BACKGROUND_SCENE.pointer.settle * dt);
    pointer.strength +=
      ((pointer.active && !reduced ? 1 : 0) - pointer.strength) * response;
    const follow = 1 - Math.exp(-BACKGROUND_SCENE.pointer.follow * dt);
    pointer.x += (pointer.targetX - pointer.x) * follow;
    pointer.y += (pointer.targetY - pointer.y) * follow;
    attr(field as SVGGElement, "opacity", reduced ? 0.48 : energy.toFixed(3));
    const objectCount = compact
      ? BACKGROUND_SCENE.objects.compact
      : BACKGROUND_SCENE.objects.full;
    objects.forEach((element, index) => {
      if (index >= objectCount) return;
      const seed = objectSeed(index);
      const y =
        wrap(
          seed.y * (height + 120) +
            60 -
            scroll * seed.depth * BACKGROUND_SCENE.motion.parallax,
          height + 120,
        ) - 60;
      const point = displace(
        seed.x * width +
          Math.sin(time * BACKGROUND_SCENE.motion.speed + seed.phase) *
            BACKGROUND_SCENE.motion.drift *
            seed.depth,
        y +
          Math.cos(time * BACKGROUND_SCENE.motion.speed * 0.8 + seed.phase) *
            BACKGROUND_SCENE.motion.drift,
        seed.depth,
      );
      const alpha = clarity(point.x, point.y) * (0.42 + seed.depth * 0.42);
      attr(element, "opacity", alpha.toFixed(3));
      if (alpha < 0.005) return; // No transform work for objects outside the viewport.
      attr(
        element,
        "transform",
        `translate(${point.x.toFixed(2)} ${point.y.toFixed(2)}) rotate(${(Math.sin(time * 0.07 + seed.phase) * 7).toFixed(2)})`,
      );
    });
    const routeCount = compact
      ? BACKGROUND_SCENE.routes.compact
      : BACKGROUND_SCENE.routes.full;
    routes.forEach((element, index) => {
      if (index >= routeCount) return;
      const first = routePoint(index, 0, false);
      const last = routePoint(index, 1, false);
      const inView =
        Math.max(first.y, last.y) > -30 &&
        Math.min(first.y, last.y) < height + 30;
      attr(element, "opacity", inView ? 1 : 0);
      if (!inView) {
        attr(packets[index], "opacity", 0);
        return;
      }
      let path = "";
      for (let step = 0; step <= BACKGROUND_SCENE.routes.samples; step++) {
        const p = routePoint(index, step / BACKGROUND_SCENE.routes.samples);
        path += `${step ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      }
      attr(element, "d", path);
      if (updateGradients)
        stops[index].forEach((stop, step) => {
          const p = routePoint(
            index,
            step / (BACKGROUND_SCENE.routes.stops - 1),
            false,
          );
          attr(stop, "stop-opacity", (clarity(p.x, p.y) * 0.35).toFixed(2));
        });
      const packet = routePoint(
        index,
        (index * 0.173 +
          (time *
            BACKGROUND_SCENE.motion.packetSpeed *
            (0.6 + (index % 3) * 0.2)) /
            width) %
          1,
      );
      attr(
        packets[index],
        "opacity",
        (clarity(packet.x, packet.y) * 0.8).toFixed(3),
      );
      attr(
        packets[index],
        "transform",
        `translate(${packet.x.toFixed(2)} ${packet.y.toFixed(2)}) rotate(${index % 2 ? 17 : -17})`,
      );
    });
    for (const pulse of pulses) {
      if (pulse.age >= BACKGROUND_SCENE.pulse.lifetime) continue;
      const progress = pulse.age / BACKGROUND_SCENE.pulse.lifetime;
      const wave = Math.max(1, radius(progress));
      const alpha =
        Math.sin(Math.PI * smooth(progress)) *
        (1 - progress) *
        pulse.strength *
        0.78;
      pulse.rings.forEach((ring, index) => {
        const r = wave * (index ? 0.67 : 1);
        attr(
          ring,
          "transform",
          `scale(${r.toFixed(2)} ${(r * 0.56).toFixed(2)})`,
        );
        pulse.arcs[index].forEach((arc, segment) => {
          const angle = ((segment + 0.5) * Math.PI) / 6;
          attr(
            arc,
            "opacity",
            (
              alpha *
              (index ? 0.4 : 1) *
              clarity(
                pulse.x + Math.cos(angle) * r,
                pulse.y + Math.sin(angle) * r * 0.56,
              )
            ).toFixed(3),
          );
        });
      });
      pulse.sparks.forEach((spark, index) => {
        if (compact && index >= BACKGROUND_SCENE.sparks.compactCount) return;
        const progress = pulse.age / BACKGROUND_SCENE.sparks.lifetime;
        if (progress >= 1) {
          attr(spark, "opacity", 0);
          return;
        }
        const count = compact
          ? BACKGROUND_SCENE.sparks.compactCount
          : BACKGROUND_SCENE.sparks.count;
        const angle = (index / count) * Math.PI * 2 + pulse.variant * 0.25;
        const travel =
          (1 - Math.exp(-pulse.age * 2.5)) * BACKGROUND_SCENE.sparks.radius;
        const x = Math.cos(angle) * travel,
          y = Math.sin(angle) * travel * 0.56;
        attr(spark, "transform", `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
        attr(
          spark,
          "opacity",
          (
            (1 - progress) ** 2 *
            smooth(pulse.age / BACKGROUND_SCENE.sparks.attack) *
            clarity(pulse.x + x, pulse.y + y) *
            0.85
          ).toFixed(3),
        );
      });
    }
  }
  function requestRender() {
    if (!raf && !disposed && visible && !document.hidden)
      raf = requestAnimationFrame(frame);
  }
  function frame(stamp: number) {
    raf = 0;
    if (disposed || !visible || document.hidden) return;
    const idle = stamp - lastInput > BACKGROUND_SCENE.idle.after * 1000;
    const interval = 1000 / (compact || idle ? BACKGROUND_SCENE.idle.fps : 60);
    if (
      sizeDirty ||
      targetsDirty ||
      readingDirty ||
      !previous ||
      stamp - previous >= interval - 1
    ) {
      const dt =
        reduced || !previous ? 0 : Math.min((stamp - previous) / 1000, 0.05);
      previous = stamp;
      time += dt;
      const before = scroll;
      if (!reduced)
        scroll += (window.scrollY - scroll) * (1 - Math.exp(-dt * 5));
      const changed = measure();
      energy +=
        ((idle ? BACKGROUND_SCENE.idle.opacity : 1) - energy) *
        (1 - Math.exp(-dt * 2));
      attr(svg, "data-activity", idle ? "idle" : "active");
      render(dt, changed || Math.abs(scroll - before) > 0.1);
    }
    if (!reduced) requestRender();
  }
  function syncPlayback() {
    cancelAnimationFrame(raf);
    raf = 0;
    previous = 0;
    attr(
      svg,
      "data-motion",
      reduced ? "reduced" : visible && !document.hidden ? "running" : "paused",
    );
    pointer.active = false;
    press = undefined;
    if (reduced) {
      pointer.strength = 0;
      for (const pulse of pulses) {
        pulse.age = Infinity;
        pulse.element.removeAttribute("data-active");
      }
    }
    syncHero();
    requestRender();
  }
  function invalidate() {
    readingDirty = true;
    requestRender();
  }
  function resize() {
    sizeDirty = true;
    invalidate();
  }
  function scrolled() {
    pointer.active = false;
    press = undefined;
    lastInput = performance.now();
    invalidate();
  }
  function leave() {
    pointer.active = false;
    press = undefined;
  }
  function control(target: EventTarget | null) {
    return target instanceof Element && !!target.closest(controlSelector);
  }
  function move(event: PointerEvent) {
    if (
      press &&
      Math.hypot(event.clientX - press.x, event.clientY - press.y) >
        BACKGROUND_SCENE.tap.distance
    )
      press.moved = true;
    if (reduced || !visible || document.hidden || event.pointerType === "touch")
      return;
    if (pointer.strength < 0.02) {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    }
    pointer.targetX = event.clientX;
    pointer.targetY = event.clientY;
    pointer.active = !control(event.target);
    lastInput = performance.now();
  }
  function down(event: PointerEvent) {
    if (
      reduced ||
      !visible ||
      document.hidden ||
      !event.isPrimary ||
      event.button !== 0 ||
      control(event.target)
    )
      return;
    press = {
      x: event.clientX,
      y: event.clientY,
      id: event.pointerId,
      at: performance.now(),
      moved: false,
    };
  }
  function up(event: PointerEvent) {
    const start = press;
    press = undefined;
    if (
      !start ||
      event.pointerId !== start.id ||
      start.moved ||
      performance.now() - start.at > BACKGROUND_SCENE.tap.duration ||
      control(event.target) ||
      window.getSelection()?.toString() ||
      Math.hypot(event.clientX - start.x, event.clientY - start.y) >
        BACKGROUND_SCENE.tap.distance
    )
      return;
    const now = performance.now();
    lastInput = now;
    const available = pulses.slice(
      0,
      compact ? BACKGROUND_SCENE.pulse.compactMax : BACKGROUND_SCENE.pulse.max,
    );
    const merged = available.find(
      (pulse) =>
        pulse.age < BACKGROUND_SCENE.pulse.lifetime &&
        (now - pulse.born) / 1000 < BACKGROUND_SCENE.pulse.mergeInterval &&
        Math.hypot(pulse.x - event.clientX, pulse.y - event.clientY) <
          BACKGROUND_SCENE.pulse.mergeDistance,
    );
    if (merged) {
      merged.strength = Math.min(1.25, merged.strength + 0.08);
      return;
    }
    const pulse =
      available.find((pulse) => pulse.age >= BACKGROUND_SCENE.pulse.lifetime) ??
      available.reduce((oldest, next) =>
        oldest.age > next.age ? oldest : next,
      );
    pulse.x = event.clientX;
    pulse.y = event.clientY;
    pulse.age = 0;
    pulse.born = now;
    pulse.strength = 1;
    pulse.variant = (serial++ + Math.floor((pulse.x / width) * 3)) % 3;
    attr(pulse.element, "data-active", "true");
    attr(pulse.element, "data-variant", pulse.variant);
    attr(pulse.element, "transform", `translate(${pulse.x} ${pulse.y})`);
    pulse.arcs.forEach((ring) => {
      ring.forEach((arc, index) => {
        attr(
          arc,
          "href",
          `#${prefix}-${pulse.variant === 1 ? "hex" : "arc"}-${index}`,
        );
      });
    });
    render(0, false);
  }
  function motionChanged() {
    reduced = motionQuery.matches;
    syncPlayback();
  }
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    syncPlayback();
  });
  observer.observe(svg);
  const resizeObserver = new ResizeObserver((entries) => {
    if (entries.some((entry) => entry.target === svg)) resize();
    else invalidate();
  });
  resizeObserver.observe(svg);
  resizeObserver.observe(document.body);
  const mutations = new MutationObserver((records) => {
    if (records.every((record) => svg.contains(record.target))) return;
    targetsDirty = true;
    invalidate();
  });
  mutations.observe(document.body, { childList: true, subtree: true });
  document.addEventListener("pointermove", move, { passive: true });
  document.addEventListener("pointerdown", down, { passive: true });
  document.addEventListener("pointerup", up, { passive: true });
  document.addEventListener("pointercancel", leave, { passive: true });
  document.documentElement.addEventListener("pointerleave", leave);
  window.addEventListener("blur", leave);
  window.addEventListener("scroll", scrolled, { passive: true });
  window.addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", syncPlayback);
  motionQuery.addEventListener("change", motionChanged);
  void document.fonts.ready.then(() => {
    if (!disposed) invalidate();
  });
  return () => {
    disposed = true;
    cancelAnimationFrame(raf);
    observer.disconnect();
    heroObserver.disconnect();
    resizeObserver.disconnect();
    mutations.disconnect();
    document.removeEventListener("pointermove", move);
    document.removeEventListener("pointerdown", down);
    document.removeEventListener("pointerup", up);
    document.removeEventListener("pointercancel", leave);
    document.documentElement.removeEventListener("pointerleave", leave);
    window.removeEventListener("blur", leave);
    window.removeEventListener("scroll", scrolled);
    window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", syncPlayback);
    motionQuery.removeEventListener("change", motionChanged);
    hero?.removeAttribute("data-scene-motion");
    heroArt?.unpauseAnimations();
  };
}
