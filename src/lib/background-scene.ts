/** CSS pixels / seconds. Two SVG planes share one bounded scene and RAF clock. */
export const BACKGROUND_SCENE = {
  compactWidth: 768,
  objects: { full: 32, compact: 14 },
  routes: { full: 12, compact: 6, samples: 16, stops: 24 },
  pointer: {
    radius: 300,
    push: 76,
    settle: 7,
    follow: 18,
    lightRadius: 180,
    lifetime: 3,
    orbitSpeed: 1.35,
    orbitBlend: 0.75,
  },
  spring: { stiffness: 48, damping: 13, maxOffset: 105 },
  chain: {
    max: 8,
    compactMax: 5,
    hops: 2,
    neighbors: 2,
    speed: 700,
    decay: 0.56,
    lifetime: 1.1,
  },
  trail: { max: 14, lifetime: 0.7 },
  pulse: {
    max: 6,
    compactMax: 3,
    lifetime: 2.4,
    radius: 350,
    compactRadius: 190,
    push: 72,
    segments: 12,
    mergeDistance: 46,
    mergeInterval: 0.14,
  },
  sparks: {
    count: 10,
    compactCount: 6,
    lifetime: 1.65,
    radius: 145,
    attack: 0.1,
  },
  idle: { after: 6, opacity: 0.55, fps: 30 },
  motion: { speed: 0.11, drift: 9, parallax: 0.07, packetSpeed: 22 },
  reading: { feather: 96, opacity: 0.18 },
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
  arrivals: Float64Array;
  weights: Float32Array;
  hops: Uint8Array;
  states: Uint8Array;
  fromX: Float32Array;
  fromY: Float32Array;
  budget: number;
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

/** Restore a quiet static composition without leaving transient light or wave nodes behind. */
export function freezeBackgroundScene(
  svg: SVGSVGElement,
  overlay: SVGSVGElement,
  state: "disabled" | "reduced" | "static" = "disabled",
) {
  svg.dataset.motion = overlay.dataset.motion = state;
  svg.dataset.activity = "idle";
  overlay.querySelectorAll(".fabric-pulse").forEach((pulse) => {
    pulse.removeAttribute("data-active");
    pulse.removeAttribute("data-variant");
  });
  overlay
    .querySelectorAll(".fabric-pointer,.fabric-trail,.fabric-response")
    .forEach((element) => {
      element.setAttribute("opacity", "0");
    });
  const field = svg.querySelector(".fabric-field");
  field?.setAttribute("opacity", String(BACKGROUND_SCENE.idle.opacity));
  const { width, height } = svg.getBoundingClientRect();
  const viewBox = `0 0 ${width || 1600} ${height || 1000}`;
  svg.setAttribute("viewBox", viewBox);
  overlay.setAttribute("viewBox", viewBox);
  svg.querySelectorAll(".fabric-object").forEach((element, index) => {
    const seed = objectSeed(index);
    element.setAttribute(
      "transform",
      `translate(${seed.x * (width || 1600)} ${seed.y * (height || 1000)})`,
    );
    element.setAttribute("opacity", "0.55");
  });
  svg.querySelectorAll(".fabric-route,.fabric-packet").forEach((element) => {
    element.setAttribute("opacity", "0");
  });
}

export function mountBackgroundScene(
  svg: SVGSVGElement,
  overlay: SVGSVGElement,
  prefix: string,
  overrideReduced = false,
  interactive = true,
) {
  const motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
  const field = svg.querySelector<SVGGElement>(".fabric-field");
  if (!field) return;
  const objects = [...svg.querySelectorAll<SVGGElement>(".fabric-object")];
  const nodes = objects.map((element, index) => ({
    element,
    seed: objectSeed(index),
    baseX: 0,
    baseY: 0,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    orbit: 0,
    born: -Infinity,
    resonance: 0,
    charge: 0,
  }));
  const responses = [
    ...overlay.querySelectorAll<SVGGElement>(".fabric-response"),
  ];
  const lightNode = overlay.querySelector<SVGGElement>(".fabric-pointer");
  if (!lightNode) return;
  const light: SVGGElement = lightNode;
  const trails = [
    ...overlay.querySelectorAll<SVGPathElement>(".fabric-trail"),
  ].map((element) => ({ element, born: -Infinity }));
  let trailIndex = 0;
  const routes = [...svg.querySelectorAll<SVGPathElement>(".fabric-route")];
  const packets = [...svg.querySelectorAll<SVGRectElement>(".fabric-packet")];
  const gradients = [
    ...svg.querySelectorAll<SVGLinearGradientElement>(".fabric-route-gradient"),
  ];
  const stops = gradients.map((gradient) => [
    ...gradient.querySelectorAll("stop"),
  ]);
  const pulses: Pulse[] = [
    ...overlay.querySelectorAll<SVGGElement>(".fabric-pulse"),
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
    arrivals: new Float64Array(objects.length).fill(Infinity),
    weights: new Float32Array(objects.length),
    hops: new Uint8Array(objects.length),
    states: new Uint8Array(objects.length),
    fromX: new Float32Array(objects.length),
    fromY: new Float32Array(objects.length),
    budget: 0,
  }));
  let width = 1600;
  let height = 1000;
  let compact = false;
  let reduced = motionQuery.matches && !overrideReduced;
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
    movedAt: -Infinity,
  };

  function resetDynamics() {
    for (const node of nodes) {
      node.x =
        node.y =
        node.vx =
        node.vy =
        node.orbit =
        node.charge =
        node.resonance =
          0;
      node.born = -Infinity;
    }
  }

  function refreshTargets() {
    readingElements = [...document.querySelectorAll(readingSelector)].filter(
      (element) => !element.parentElement?.closest(readingSelector),
    );
    targetsDirty = false;
    readingDirty = true;
  }
  function measure() {
    if (sizeDirty) {
      const box = svg.getBoundingClientRect();
      if (box.width && box.height) {
        const resized = width !== box.width || height !== box.height;
        width = box.width;
        height = box.height;
        compact = width < BACKGROUND_SCENE.compactWidth;
        attr(svg, "viewBox", `0 0 ${width} ${height}`);
        attr(overlay, "viewBox", `0 0 ${width} ${height}`);
        for (const gradient of gradients) attr(gradient, "x2", width);
        // The observer's initial/same-size notification must not erase fresh input.
        if (resized) {
          for (const pulse of pulses) {
            pulse.age = Infinity;
            pulse.element.removeAttribute("data-active");
          }
          pointer.active = false;
          pointer.strength = 0;
          resetDynamics();
          trails.forEach((trail) => {
            trail.born = -Infinity;
          });
          press = undefined;
        }
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
      // Elliptical falloff avoids outlining a reading region as a rectangle.
      // This applies only to ambient detail, never to interactive light/waves.
      const dx =
        (x - (box.left + box.right) / 2) /
        ((box.right - box.left) / 2 + BACKGROUND_SCENE.reading.feather);
      const dy =
        (y - (box.top + box.bottom) / 2) /
        ((box.bottom - box.top) / 2 + BACKGROUND_SCENE.reading.feather);
      alpha = Math.min(
        alpha,
        BACKGROUND_SCENE.reading.opacity +
          (1 - BACKGROUND_SCENE.reading.opacity) * smooth(Math.hypot(dx, dy)),
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
    const proximity = smooth(1 - distance / BACKGROUND_SCENE.pointer.radius);
    // The outer field draws detail inward; its core repels with a soft curl.
    const force =
      proximity *
      (proximity * 1.7 - 0.7) *
      pointer.strength *
      BACKGROUND_SCENE.pointer.push *
      depth;
    let px = x + (dx / Math.max(1, distance)) * force;
    let py = y + (dy / Math.max(1, distance)) * force;
    const curl =
      Math.sin(time * 2 + distance * 0.015) *
      proximity *
      pointer.strength *
      12 *
      depth;
    px -= (dy / Math.max(1, distance)) * curl;
    py += (dx / Math.max(1, distance)) * curl;
    for (const pulse of pulses) {
      if (pulse.age >= BACKGROUND_SCENE.pulse.lifetime) continue;
      const dx = x - pulse.x,
        dy = y - pulse.y;
      const progress = pulse.age / BACKGROUND_SCENE.pulse.lifetime;
      const distance = Math.hypot(dx, dy / 0.7);
      const force =
        Math.exp(-(((distance - radius(progress)) / 65) ** 2)) *
        (1 - progress) *
        BACKGROUND_SCENE.pulse.push *
        pulse.strength *
        depth;
      const actual = Math.max(1, Math.hypot(dx, dy));
      px += (dx / actual) * force;
      py += (dy / actual) * force;
    }
    return { x: px, y: py };
  }
  function influence(x: number, y: number) {
    let strength =
      smooth(
        1 -
          Math.hypot(x - pointer.x, y - pointer.y) /
            BACKGROUND_SCENE.pointer.radius,
      ) * pointer.strength;
    for (const pulse of pulses) {
      if (pulse.age >= BACKGROUND_SCENE.pulse.lifetime) continue;
      const progress = pulse.age / BACKGROUND_SCENE.pulse.lifetime;
      const distance = Math.hypot(x - pulse.x, (y - pulse.y) / 0.7);
      strength = Math.max(
        strength,
        Math.exp(-(((distance - radius(progress)) / 90) ** 2)) *
          (1 - progress) *
          pulse.strength,
      );
    }
    return strength * edge(x, y);
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
  function updateChain(now: number, count: number) {
    // A pulse owns fixed typed arrays: at most eight arrivals and two hops.
    // No recursive waves, DOM nodes or timers are created by a reaction.
    const reach = clamp(
      Math.sqrt((width * height) / count) * 1.5,
      180,
      compact ? 220 : 480,
    );
    const limit = compact
      ? BACKGROUND_SCENE.chain.compactMax
      : BACKGROUND_SCENE.chain.max;
    for (const node of nodes) {
      const age = (now - node.born) / 1000;
      node.charge =
        age >= BACKGROUND_SCENE.chain.lifetime
          ? 0
          : node.resonance *
            smooth(age / 0.08) *
            (1 - age / BACKGROUND_SCENE.chain.lifetime) ** 2;
    }
    if (reduced) return;
    for (const pulse of pulses) {
      if (pulse.age >= BACKGROUND_SCENE.pulse.lifetime) continue;
      const progress = pulse.age / BACKGROUND_SCENE.pulse.lifetime;
      for (let i = 0; i < count; i++) {
        const node = nodes[i];
        if (
          !pulse.states[i] &&
          pulse.budget < limit &&
          edge(node.baseX, node.baseY) > 0.2 &&
          Math.hypot(node.baseX - pulse.x, (node.baseY - pulse.y) / 0.7) <=
            radius(progress) + 18
        ) {
          pulse.states[i] = 1;
          pulse.arrivals[i] = now;
          pulse.weights[i] = pulse.strength * 0.85 * (1 - progress * 0.6);
          pulse.fromX[i] = pulse.x;
          pulse.fromY[i] = pulse.y;
          pulse.budget++;
        }
        if (pulse.states[i] !== 1 || pulse.arrivals[i] > now) continue;
        pulse.states[i] = 2;
        // Wall-clock expiry also applies to delayed arrivals after throttling.
        const lateness = (now - pulse.arrivals[i]) / 1000;
        if (lateness >= BACKGROUND_SCENE.chain.lifetime) continue;
        const weight = pulse.weights[i];
        node.resonance = Math.min(1, Math.max(node.charge, weight));
        node.born = pulse.arrivals[i];
        const dx = node.baseX - pulse.fromX[i],
          dy = node.baseY - pulse.fromY[i];
        const distance = Math.max(1, Math.hypot(dx, dy));
        node.vx += (dx / distance) * weight * 95 * node.seed.depth;
        node.vy += (dy / distance) * weight * 95 * node.seed.depth;
        if (pulse.hops[i] >= BACKGROUND_SCENE.chain.hops) continue;
        for (
          let branch = 0;
          branch < BACKGROUND_SCENE.chain.neighbors && pulse.budget < limit;
          branch++
        ) {
          let nearest = -1,
            distance = reach;
          for (let j = 0; j < count; j++) {
            if (pulse.states[j] || edge(nodes[j].baseX, nodes[j].baseY) < 0.2)
              continue;
            const gap = Math.hypot(
              nodes[j].baseX - node.baseX,
              nodes[j].baseY - node.baseY,
            );
            if (gap < distance) {
              nearest = j;
              distance = gap;
            }
          }
          if (nearest < 0) break;
          pulse.states[nearest] = 1;
          pulse.arrivals[nearest] =
            now + 90 + (distance / BACKGROUND_SCENE.chain.speed) * 1000;
          pulse.weights[nearest] = weight * BACKGROUND_SCENE.chain.decay;
          pulse.hops[nearest] = pulse.hops[i] + 1;
          pulse.fromX[nearest] = node.baseX;
          pulse.fromY[nearest] = node.baseY;
          pulse.budget++;
        }
      }
    }
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
    const wake =
      pointer.active && !reduced
        ? smooth(
            (BACKGROUND_SCENE.pointer.lifetime - (now - lastInput) / 1000) /
              1.5,
          )
        : 0;
    pointer.strength += (wake - pointer.strength) * response;
    const follow = 1 - Math.exp(-BACKGROUND_SCENE.pointer.follow * dt);
    pointer.x += (pointer.targetX - pointer.x) * follow;
    pointer.y += (pointer.targetY - pointer.y) * follow;
    // All input and effect positions are viewport CSS pixels. Scrolling moves
    // only ambient parallax, never the light, trail or click origin.
    attr(
      light,
      "transform",
      `translate(${pointer.targetX} ${pointer.targetY})`,
    );
    attr(light, "opacity", reduced ? 0 : pointer.strength.toFixed(3));
    for (const trail of trails) {
      const age = (now - trail.born) / 1000;
      attr(
        trail.element,
        "opacity",
        reduced
          ? 0
          : (
              Math.max(0, 1 - age / BACKGROUND_SCENE.trail.lifetime) ** 2 *
              0.55
            ).toFixed(3),
      );
    }
    attr(field as SVGGElement, "opacity", reduced ? 0.48 : energy.toFixed(3));
    const objectCount = compact
      ? BACKGROUND_SCENE.objects.compact
      : BACKGROUND_SCENE.objects.full;
    nodes.forEach((node, index) => {
      if (index >= objectCount) return;
      const seed = node.seed;
      const y =
        wrap(
          seed.y * (height + 120) +
            60 -
            scroll * seed.depth * BACKGROUND_SCENE.motion.parallax,
          height + 120,
        ) - 60;
      node.baseX =
        seed.x * width +
        Math.sin(time * BACKGROUND_SCENE.motion.speed + seed.phase) *
          BACKGROUND_SCENE.motion.drift *
          seed.depth;
      node.baseY =
        y +
        Math.cos(time * BACKGROUND_SCENE.motion.speed * 0.8 + seed.phase) *
          BACKGROUND_SCENE.motion.drift;
    });
    updateChain(now, objectCount);
    nodes.forEach((node, index) => {
      if (index >= objectCount) return;
      const { element, seed } = node;
      const target = displace(node.baseX, node.baseY, seed.depth);
      const dx = node.baseX - pointer.x,
        dy = node.baseY - pointer.y;
      const proximity =
        smooth(1 - Math.hypot(dx, dy) / BACKGROUND_SCENE.pointer.radius) *
        pointer.strength;
      node.orbit = wrap(
        node.orbit +
          dt *
            BACKGROUND_SCENE.pointer.orbitSpeed *
            (0.8 + seed.depth * 0.4) *
            proximity,
        Math.PI * 2,
      );
      const orbit = proximity * BACKGROUND_SCENE.pointer.orbitBlend;
      const tx =
        target.x -
        node.baseX +
        ((Math.cos(node.orbit) - 1) * dx - Math.sin(node.orbit) * dy) * orbit;
      const ty =
        target.y -
        node.baseY +
        (Math.sin(node.orbit) * dx + (Math.cos(node.orbit) - 1) * dy) * orbit;
      // Substeps keep the damped spring stable at the mobile/idle frame budget.
      const steps = Math.max(1, Math.ceil(dt * 60)),
        step = dt / steps;
      for (let i = 0; i < steps; i++) {
        node.vx +=
          ((tx - node.x) * BACKGROUND_SCENE.spring.stiffness -
            node.vx * BACKGROUND_SCENE.spring.damping) *
          step;
        node.vy +=
          ((ty - node.y) * BACKGROUND_SCENE.spring.stiffness -
            node.vy * BACKGROUND_SCENE.spring.damping) *
          step;
        node.x += node.vx * step;
        node.y += node.vy * step;
      }
      const offset = Math.hypot(node.x, node.y);
      if (offset > BACKGROUND_SCENE.spring.maxOffset) {
        const scale = BACKGROUND_SCENE.spring.maxOffset / offset;
        node.x *= scale;
        node.y *= scale;
        node.vx *= 0.7;
        node.vy *= 0.7;
      }
      const point = { x: node.baseX + node.x, y: node.baseY + node.y };
      const alpha = clarity(point.x, point.y) * (0.42 + seed.depth * 0.42);
      attr(element, "opacity", alpha.toFixed(3));
      const reactive = reduced
        ? 0
        : Math.max(influence(point.x, point.y), node.charge * 0.8) * 0.65;
      attr(responses[index], "opacity", reactive.toFixed(3));
      if (alpha < 0.005) return; // No transform work for objects outside the viewport.
      const rotation =
        Math.sin(time * 0.07 + seed.phase) * 7 +
        Math.sin(node.orbit) * proximity * 18 +
        node.vx * 0.05 +
        (node.charge
          ? Math.sin(((now - node.born) / 1000) * 12) * node.charge * 12
          : 0);
      const breathe = Math.sin(node.orbit * 1.5) * proximity * 0.025;
      const transform = `translate(${point.x.toFixed(2)} ${point.y.toFixed(2)}) rotate(${rotation.toFixed(2)}) scale(${(1 + node.charge * 0.1 + breathe).toFixed(3)} ${(1 - node.charge * 0.035 - breathe * 0.4).toFixed(3)})`;
      attr(element, "transform", transform);
      if (reactive > 0.005) attr(responses[index], "transform", transform);
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
        0.95;
      pulse.rings.forEach((ring, index) => {
        const r = wave * (index ? 0.67 : 1);
        attr(
          ring,
          "transform",
          `scale(${r.toFixed(2)} ${(r * 0.7).toFixed(2)})`,
        );
        pulse.arcs[index].forEach((arc, segment) => {
          const angle = ((segment + 0.5) * Math.PI) / 6;
          attr(
            arc,
            "opacity",
            (
              alpha *
              (index ? 0.4 : 1) *
              edge(
                pulse.x + Math.cos(angle) * r,
                pulse.y + Math.sin(angle) * r * 0.7,
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
          y = Math.sin(angle) * travel * 0.7;
        attr(spark, "transform", `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
        attr(
          spark,
          "opacity",
          (
            (1 - progress) ** 2 *
            smooth(pulse.age / BACKGROUND_SCENE.sparks.attack) *
            edge(pulse.x + x, pulse.y + y) *
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
    attr(
      overlay,
      "data-motion",
      interactive ? (svg.getAttribute("data-motion") ?? "paused") : "disabled",
    );
    pointer.active = false;
    pointer.strength = 0;
    resetDynamics();
    attr(light, "opacity", 0);
    press = undefined;
    if (reduced) {
      trails.forEach((trail) => {
        trail.born = -Infinity;
      });
      for (const pulse of pulses) {
        pulse.age = Infinity;
        pulse.element.removeAttribute("data-active");
      }
    }
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
    if (sizeDirty) measure();
    if (pointer.strength < 0.02) {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    }
    const now = performance.now();
    if (
      pointer.active &&
      now - pointer.movedAt < 150 &&
      Math.hypot(
        event.clientX - pointer.targetX,
        event.clientY - pointer.targetY,
      ) > 2 &&
      Math.hypot(
        event.clientX - pointer.targetX,
        event.clientY - pointer.targetY,
      ) < BACKGROUND_SCENE.pointer.radius
    ) {
      const trail = trails[trailIndex++ % trails.length];
      trail.born = performance.now();
      attr(
        trail.element,
        "d",
        `M${pointer.targetX} ${pointer.targetY} Q${pointer.x} ${pointer.y} ${event.clientX} ${event.clientY}`,
      );
    }
    pointer.targetX = event.clientX;
    pointer.targetY = event.clientY;
    pointer.active = true;
    pointer.movedAt = now;
    lastInput = now;
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
    if (sizeDirty) measure();
    press = {
      x: event.clientX,
      y: event.clientY,
      id: event.pointerId,
      at: performance.now(),
      moved: false,
    };
  }
  function up(event: PointerEvent) {
    if (sizeDirty) measure();
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
    pulse.budget = 0;
    pulse.arrivals.fill(Infinity);
    pulse.states.fill(0);
    pulse.hops.fill(0);
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
    const next = motionQuery.matches && !overrideReduced;
    if (next !== reduced) {
      reduced = next;
      syncPlayback();
    }
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
    if (
      records.every(
        (record) =>
          svg.contains(record.target) || overlay.contains(record.target),
      )
    )
      return;
    targetsDirty = true;
    invalidate();
  });
  mutations.observe(document.body, { childList: true, subtree: true });
  if (interactive) {
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerdown", down, { passive: true });
    document.addEventListener("pointerup", up, { passive: true });
    document.addEventListener("pointercancel", leave, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    window.addEventListener("blur", leave);
  }
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
    freezeBackgroundScene(svg, overlay);
  };
}
