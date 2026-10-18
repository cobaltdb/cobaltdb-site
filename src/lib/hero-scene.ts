/** Cobalt's data fabric: isometric query routes, records and bounded write pulses.
 * All distances are CSS pixels and all durations are seconds. No React frame state.
 */
export const HERO_SCENE = {
  compactWidth: 768,
  maxDpr: 1.75,
  maxPixels: 6_000_000,
  areaPerRoute: 65_000,
  routes: { compact: 12, min: 16, max: 40 },
  records: { compact: 10, min: 16, max: 36 },
  pointer: { radius: 190, displacement: 24, settle: 5 },
  idle: { after: 6, intensity: 0.56, fps: 30 },
  pulse: { lifetime: 2.3, radius: 240, max: 7, compactMax: 4 },
  sparks: { perPulse: 10, max: 64, compactMax: 24, lifetime: 1.7 },
  trail: { max: 14, interval: 0.075, lifetime: 0.75 },
  speed: { min: 17, range: 17 },
  tap: { distance: 9, duration: 600 },
  palettes: {
    light: {
      route: "93, 133, 201",
      packet: "35, 94, 214",
      accent: "33, 133, 157",
      tile: "246, 249, 255",
      opacity: 0.7,
    },
    dark: {
      route: "84, 126, 191",
      packet: "131, 178, 255",
      accent: "91, 207, 218",
      tile: "24, 42, 70",
      opacity: 0.88,
    },
  },
} as const;

type Point = { x: number; y: number };
type Route = {
  y: number;
  slope: number;
  phase: number;
  depth: number;
  speed: number;
};
type RecordTile = Point & { phase: number; depth: number; label: string };
type Pulse = Point & { age: number; variant: number };
type Spark = Point & { age: number; vx: number; vy: number };
type Trail = Point & { age: number };

const clamp = (value: number, min = 0, max = 1) =>
  Math.max(min, Math.min(max, value));
const smooth = (value: number) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};
const rgba = (rgb: string, alpha: number) => `rgba(${rgb},${clamp(alpha)})`;
const controls =
  "a,button,input,textarea,select,summary,[role='button'],[contenteditable='true']";

export function mountHeroScene(canvas: HTMLCanvasElement, host: HTMLElement) {
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;
  const context = ctx;
  const motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
  const colorQuery = matchMedia("(prefers-color-scheme: dark)");
  const copy = host.querySelector<HTMLElement>(".hero-copy");
  const illustration = host.querySelector<SVGSVGElement>(".database-art > svg");
  let width = 0;
  let height = 0;
  let dpr = 1;
  let compact = false;
  let visible = false;
  let disposed = false;
  let reduced = motionQuery.matches;
  let raf = 0;
  let lastFrame = 0;
  let time = 0;
  let lastInput = -HERO_SCENE.idle.after;
  let lastTrail = 0;
  let energy = HERO_SCENE.idle.intensity as number;
  let palette = HERO_SCENE.palettes
    .light as (typeof HERO_SCENE.palettes)[keyof typeof HERO_SCENE.palettes];
  let routes: Route[] = [];
  let records: RecordTile[] = [];
  const pulses: Pulse[] = [];
  const sparks: Spark[] = [];
  const trails: Trail[] = [];
  let protectedArea = { x: 0, y: 0, w: 0, h: 0 };
  const pointer = { x: 0, y: 0, strength: 0, active: false };
  let press:
    | { x: number; y: number; at: number; id: number; moved: boolean }
    | undefined;

  function readPalette() {
    const preference = document.documentElement.dataset.theme;
    const dark =
      preference === "dark" || (preference !== "light" && colorQuery.matches);
    palette = HERO_SCENE.palettes[dark ? "dark" : "light"];
    if (!raf) draw(0);
  }

  function resize() {
    if (disposed) return;
    const box = host.getBoundingClientRect();
    if (!box.width || !box.height) return;
    width = box.width;
    height = box.height;
    compact = width < HERO_SCENE.compactWidth;
    dpr = Math.min(
      window.devicePixelRatio || 1,
      HERO_SCENE.maxDpr,
      Math.sqrt(HERO_SCENE.maxPixels / (width * height)),
    );
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (copy) {
      const text = copy.getBoundingClientRect();
      protectedArea = {
        x: text.left - box.left,
        y: text.top - box.top,
        w: text.width,
        h: text.height,
      };
    }
    // Seeded, stratified placement covers ultrawide edges without an unbounded object count.
    let seed = 731;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const count = compact
      ? HERO_SCENE.routes.compact
      : Math.round(
          clamp(
            (width * height) / HERO_SCENE.areaPerRoute,
            HERO_SCENE.routes.min,
            HERO_SCENE.routes.max,
          ),
        );
    routes = Array.from({ length: count }, (_, index) => ({
      y: (index / (count - 1)) * (height + width * 0.62) - width * 0.31,
      slope: index % 2 ? 0.31 : -0.31,
      phase: random(),
      depth: 0.35 + random() * 0.65,
      speed: HERO_SCENE.speed.min + random() * HERO_SCENE.speed.range,
    }));
    const tileCount = compact
      ? HERO_SCENE.records.compact
      : Math.round(
          clamp(count * 0.9, HERO_SCENE.records.min, HERO_SCENE.records.max),
        );
    const columns = Math.ceil(Math.sqrt((tileCount * width) / height));
    const rows = Math.ceil(tileCount / columns);
    const labels = ["SQL", "{ }", "WAL", "01", "Go", "COMMIT"];
    records = Array.from({ length: tileCount }, (_, index) => ({
      x: (((index % columns) + 0.3 + random() * 0.4) / columns) * width,
      y: ((Math.floor(index / columns) + 0.3 + random() * 0.4) / rows) * height,
      phase: random() * Math.PI * 2,
      depth: 0.4 + random() * 0.6,
      label: labels[index % labels.length],
    }));
    // Old coordinates should not survive orientation/viewport changes.
    pulses.length = sparks.length = trails.length = 0;
    pointer.active = false;
    pointer.strength = 0;
    press = undefined;
    draw(0);
  }

  function edge(x: number, y: number) {
    return smooth(Math.min(x, width - x, y, height - y) / (compact ? 35 : 90));
  }

  function displace(x: number, y: number, depth: number): Point {
    let dx = x - pointer.x;
    let dy = y - pointer.y;
    const distance = Math.hypot(dx, dy);
    const falloff = smooth(1 - distance / HERO_SCENE.pointer.radius);
    const push =
      pointer.strength * falloff * HERO_SCENE.pointer.displacement * depth;
    let px = x + (dx / Math.max(distance, 1)) * push;
    let py = y + (dy / Math.max(distance, 1)) * push;
    for (const pulse of pulses) {
      dx = x - pulse.x;
      dy = y - pulse.y;
      const length = Math.hypot(dx, dy);
      const progress = pulse.age / HERO_SCENE.pulse.lifetime;
      const radius = (compact ? 0.65 : 1) * HERO_SCENE.pulse.radius;
      const wave =
        Math.exp(-(((length - progress * radius) / 42) ** 2)) *
        (1 - progress) *
        18 *
        depth;
      px += (dx / Math.max(length, 1)) * wave;
      py += (dy / Math.max(length, 1)) * wave;
    }
    return { x: px, y: py };
  }

  function routePoint(route: Route, progress: number): Point {
    const x = -100 + (width + 200) * progress;
    const drift =
      Math.sin(time * 0.22 + route.phase * 6 + progress * 4) * 5 * route.depth;
    // A short horizontal bus in each diagonal is a PCB/query-plan junction.
    const bend = clamp((progress - 0.42) / 0.12) * 50;
    return displace(
      x,
      route.y + x * route.slope - bend * route.slope + drift,
      route.depth,
    );
  }

  function ring(
    x: number,
    y: number,
    radius: number,
    alpha: number,
    variant: number,
  ) {
    context.strokeStyle = rgba(
      variant === 2 ? palette.accent : palette.packet,
      alpha * edge(x, y),
    );
    context.lineWidth = 1.1;
    context.beginPath();
    if (variant === 1) {
      for (let i = 0; i <= 6; i++) {
        const angle = (i * Math.PI) / 3;
        const px = x + Math.cos(angle) * radius;
        const py = y + Math.sin(angle) * radius * 0.55;
        if (i === 0) context.moveTo(px, py);
        else context.lineTo(px, py);
      }
    } else context.ellipse(x, y, radius, radius * 0.56, 0, 0, Math.PI * 2);
    context.stroke();
  }

  function draw(dt: number) {
    context.clearRect(0, 0, width, height);
    if (!width || !height) return;
    const entrance = reduced ? 1 : smooth(time / 1.8);
    const intensity = palette.opacity * entrance * energy;
    pointer.strength +=
      ((pointer.active && !reduced ? 1 : 0) - pointer.strength) *
      (1 - Math.exp(-HERO_SCENE.pointer.settle * dt));

    for (const route of routes) {
      context.beginPath();
      for (let step = 0; step <= 24; step++) {
        const p = routePoint(route, step / 24);
        if (!step) context.moveTo(p.x, p.y);
        else context.lineTo(p.x, p.y);
      }
      context.lineWidth = 0.65 + route.depth * 0.35;
      context.strokeStyle = rgba(
        palette.route,
        (0.12 + route.depth * 0.16) * intensity,
      );
      context.stroke();
      const progress = (route.phase + (time * route.speed) / (width + 200)) % 1;
      const p = routePoint(route, progress);
      const previous = routePoint(
        route,
        Math.max(0, progress - 18 / (width + 200)),
      );
      const opacity = edge(p.x, p.y) * intensity;
      context.strokeStyle = rgba(palette.packet, opacity * 0.7);
      context.lineWidth = 1.8;
      context.beginPath();
      context.moveTo(previous.x, previous.y);
      context.lineTo(p.x, p.y);
      context.stroke();
      context.fillStyle = rgba(palette.packet, opacity);
      context.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
    }

    for (const record of records) {
      const p = displace(
        record.x + Math.sin(time * 0.18 + record.phase) * 8 * record.depth,
        record.y + Math.cos(time * 0.24 + record.phase) * 7,
        record.depth,
      );
      const alpha = edge(p.x, p.y) * intensity;
      const w = record.label === "COMMIT" ? 58 : 38;
      context.fillStyle = rgba(palette.tile, alpha * 0.85);
      context.strokeStyle = rgba(palette.route, alpha * 0.45);
      context.lineWidth = 0.8;
      context.beginPath();
      context.roundRect(p.x - w / 2, p.y - 11, w, 22, 5);
      context.fill();
      context.stroke();
      context.font = "10px ui-monospace, SFMono-Regular, Consolas, monospace";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillStyle = rgba(palette.packet, alpha * 0.68);
      context.fillText(record.label, p.x, p.y + 0.5);
      if (pointer.strength > 0.01) {
        const proximity = smooth(
          1 -
            Math.hypot(p.x - pointer.x, p.y - pointer.y) /
              HERO_SCENE.pointer.radius,
        );
        context.strokeStyle = rgba(
          palette.accent,
          proximity * pointer.strength * alpha * 0.5,
        );
        context.beginPath();
        context.moveTo(p.x, p.y + 11);
        context.lineTo(pointer.x, pointer.y);
        context.stroke();
      }
    }

    for (let i = trails.length - 1; i >= 0; i--) {
      const trail = trails[i];
      trail.age += dt;
      const progress = trail.age / HERO_SCENE.trail.lifetime;
      if (progress >= 1) {
        trails.splice(i, 1);
        continue;
      }
      ring(
        trail.x,
        trail.y,
        5 + progress * 30,
        (1 - progress) ** 2 * 0.2 * entrance,
        0,
      );
    }
    for (let i = pulses.length - 1; i >= 0; i--) {
      const pulse = pulses[i];
      pulse.age += dt;
      const progress = pulse.age / HERO_SCENE.pulse.lifetime;
      if (progress >= 1) {
        pulses.splice(i, 1);
        continue;
      }
      const radius =
        (compact ? 0.65 : 1) *
        HERO_SCENE.pulse.radius *
        (1 - (1 - progress) ** 2);
      const alpha = Math.sin(Math.PI * smooth(progress)) * (1 - progress) * 0.8;
      ring(pulse.x, pulse.y, Math.max(1, radius), alpha, pulse.variant);
      ring(
        pulse.x,
        pulse.y,
        Math.max(1, radius * 0.68),
        alpha * 0.42,
        pulse.variant,
      );
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const spark = sparks[i];
      spark.age += dt;
      const progress = spark.age / HERO_SCENE.sparks.lifetime;
      if (progress >= 1) {
        sparks.splice(i, 1);
        continue;
      }
      const travel = (1 - Math.exp(-spark.age * 2.3)) / 2.3;
      const x = spark.x + spark.vx * travel;
      const y = spark.y + spark.vy * travel;
      context.fillStyle = rgba(
        palette.accent,
        edge(x, y) * (1 - progress) ** 2 * 0.8,
      );
      context.fillRect(x - 1.5, y - 1.5, 3, 3);
    }

    // An elliptical clearing protects the complete text/CTA region in both themes.
    // It follows the actual responsive content bounds rather than a viewport guess.
    context.globalCompositeOperation = "destination-out";
    context.save();
    context.translate(
      protectedArea.x + protectedArea.w / 2,
      protectedArea.y + protectedArea.h / 2,
    );
    context.scale(protectedArea.w / 2 + 55, protectedArea.h / 2 + 60);
    const clearing = context.createRadialGradient(0, 0, 0, 0, 0, 1.3);
    clearing.addColorStop(0, "rgba(0,0,0,.99)");
    clearing.addColorStop(0.55, "rgba(0,0,0,.96)");
    clearing.addColorStop(0.8, "rgba(0,0,0,.7)");
    clearing.addColorStop(1, "rgba(0,0,0,0)");
    context.fillStyle = clearing;
    context.fillRect(-1.3, -1.3, 2.6, 2.6);
    context.restore();
    // Soften the complete canvas boundary, including continuous route strokes.
    for (const horizontal of [true, false]) {
      const length = horizontal ? width : height;
      const fade = Math.min(compact ? 30 : 70, length * 0.12) / length;
      const gradient = context.createLinearGradient(
        0,
        0,
        horizontal ? width : 0,
        horizontal ? 0 : height,
      );
      gradient.addColorStop(0, "#000");
      gradient.addColorStop(fade, "transparent");
      gradient.addColorStop(1 - fade, "transparent");
      gradient.addColorStop(1, "#000");
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);
    }
    context.globalCompositeOperation = "source-over";
  }

  function frame(stamp: number) {
    raf = 0;
    if (disposed || !visible || document.hidden || reduced) return;
    const idle = time - lastInput > HERO_SCENE.idle.after;
    const fps = compact || idle ? HERO_SCENE.idle.fps : 60;
    if (!lastFrame || stamp - lastFrame >= 1000 / fps - 1) {
      const dt = lastFrame ? Math.min((stamp - lastFrame) / 1000, 0.05) : 0;
      lastFrame = stamp;
      time += dt;
      energy +=
        ((idle ? HERO_SCENE.idle.intensity : 1) - energy) *
        (1 - Math.exp(-dt * 2));
      draw(dt);
    }
    raf = requestAnimationFrame(frame);
  }

  function syncPlayback() {
    cancelAnimationFrame(raf);
    raf = 0;
    lastFrame = 0;
    const running = visible && !document.hidden && !reduced;
    host.dataset.sceneMotion = reduced
      ? "reduced"
      : running
        ? "running"
        : "paused";
    if (running) {
      illustration?.unpauseAnimations();
      raf = requestAnimationFrame(frame);
    } else {
      illustration?.pauseAnimations();
      pointer.active = false;
      press = undefined;
      if (reduced) {
        pulses.length = sparks.length = trails.length = 0;
        pointer.strength = 0;
        draw(0);
      }
    }
  }

  function position(event: PointerEvent): Point {
    const box = host.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  }
  function isControl(target: EventTarget | null) {
    return target instanceof Element && !!target.closest(controls);
  }
  function wake() {
    lastInput = time;
  }
  function move(event: PointerEvent) {
    const p = position(event);
    if (
      press &&
      Math.hypot(p.x - press.x, p.y - press.y) > HERO_SCENE.tap.distance
    )
      press.moved = true;
    if (reduced || !visible || event.pointerType === "touch") return;
    pointer.x = p.x;
    pointer.y = p.y;
    pointer.active = !isControl(event.target);
    wake();
    if (pointer.active && time - lastTrail > HERO_SCENE.trail.interval) {
      trails.push({ ...p, age: 0 });
      if (trails.length > HERO_SCENE.trail.max) trails.shift();
      lastTrail = time;
    }
  }
  function down(event: PointerEvent) {
    if (
      reduced ||
      !visible ||
      !event.isPrimary ||
      event.button !== 0 ||
      isControl(event.target)
    )
      return;
    press = {
      ...position(event),
      at: performance.now(),
      id: event.pointerId,
      moved: false,
    };
  }
  function up(event: PointerEvent) {
    const start = press;
    press = undefined;
    if (
      !start ||
      start.id !== event.pointerId ||
      start.moved ||
      performance.now() - start.at > HERO_SCENE.tap.duration ||
      isControl(event.target) ||
      window.getSelection()?.toString()
    )
      return;
    const p = position(event);
    if (Math.hypot(start.x - p.x, start.y - p.y) > HERO_SCENE.tap.distance)
      return;
    wake();
    const variant =
      (Math.floor((p.x / Math.max(width, 1)) * 3) + pulses.length) % 3;
    // Replace the oldest impulse at capacity. No timers or unlimited particle emitters.
    if (
      pulses.length >=
      (compact ? HERO_SCENE.pulse.compactMax : HERO_SCENE.pulse.max)
    )
      pulses.shift();
    pulses.push({ ...p, age: 0, variant });
    const count = compact ? 6 : HERO_SCENE.sparks.perPulse;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + variant * 0.3;
      sparks.push({
        ...p,
        age: 0,
        vx: Math.cos(angle) * (90 + (i % 3) * 30),
        vy: Math.sin(angle) * 80,
      });
    }
    const max = compact ? HERO_SCENE.sparks.compactMax : HERO_SCENE.sparks.max;
    if (sparks.length > max) sparks.splice(0, sparks.length - max);
  }
  function leave() {
    pointer.active = false;
    press = undefined;
  }
  function motionChanged() {
    reduced = motionQuery.matches;
    syncPlayback();
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  if (copy) resizeObserver.observe(copy);
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    syncPlayback();
  });
  intersection.observe(host);
  const themeObserver = new MutationObserver(readPalette);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  host.addEventListener("pointermove", move, { passive: true });
  host.addEventListener("pointerdown", down, { passive: true });
  host.addEventListener("pointerup", up, { passive: true });
  host.addEventListener("pointerleave", leave);
  host.addEventListener("pointercancel", leave);
  document.addEventListener("visibilitychange", syncPlayback);
  window.addEventListener("resize", resize, { passive: true });
  motionQuery.addEventListener("change", motionChanged);
  colorQuery.addEventListener("change", readPalette);
  readPalette();
  resize();
  void document.fonts.ready.then(() => {
    if (!disposed) resize();
  });

  return () => {
    disposed = true;
    cancelAnimationFrame(raf);
    resizeObserver.disconnect();
    intersection.disconnect();
    themeObserver.disconnect();
    host.removeEventListener("pointermove", move);
    host.removeEventListener("pointerdown", down);
    host.removeEventListener("pointerup", up);
    host.removeEventListener("pointerleave", leave);
    host.removeEventListener("pointercancel", leave);
    document.removeEventListener("visibilitychange", syncPlayback);
    window.removeEventListener("resize", resize);
    motionQuery.removeEventListener("change", motionChanged);
    colorQuery.removeEventListener("change", readPalette);
    delete host.dataset.sceneMotion;
  };
}
