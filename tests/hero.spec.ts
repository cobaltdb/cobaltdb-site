import { expect, test, type Page } from "@playwright/test";

type PaintProbe = {
  frames: number;
  rings: number;
  operations: number;
  maxOperations: number;
  tiles: { x: number; y: number }[];
};
declare global {
  interface Window {
    heroPaint: PaintProbe;
  }
}

// Observe the browser's drawing boundary, not the scene's private particle arrays.
async function observePaint(page: Page) {
  await page.addInitScript(() => {
    window.heroPaint = {
      frames: 0,
      rings: 0,
      operations: 0,
      maxOperations: 0,
      tiles: [],
    };
    const proto = CanvasRenderingContext2D.prototype;
    const clear = proto.clearRect;
    proto.clearRect = function (...args) {
      if (this.canvas.classList.contains("hero-canvas")) {
        window.heroPaint.frames++;
        window.heroPaint.maxOperations = Math.max(
          window.heroPaint.maxOperations,
          window.heroPaint.operations,
        );
        window.heroPaint.operations = 0;
        window.heroPaint.rings = 0;
        window.heroPaint.tiles = [];
      }
      return clear.apply(this, args);
    };
    const ellipse = proto.ellipse;
    proto.ellipse = function (...args) {
      if (this.canvas.classList.contains("hero-canvas"))
        window.heroPaint.rings++;
      return ellipse.apply(this, args);
    };
    const stroke = proto.stroke;
    proto.stroke = function (path?: Path2D) {
      if (this.canvas.classList.contains("hero-canvas"))
        window.heroPaint.operations++;
      return Reflect.apply(stroke, this, path ? [path] : []);
    };
    const fillText = proto.fillText;
    proto.fillText = function (text, x, y, maxWidth) {
      if (this.canvas.classList.contains("hero-canvas"))
        window.heroPaint.tiles.push({ x, y });
      return maxWidth === undefined
        ? fillText.call(this, text, x, y)
        : fillText.call(this, text, x, y, maxWidth);
    };
  });
  await page.clock.install({ time: new Date("2026-10-18T12:00:00Z") });
  await page.goto("/");
  await expect(page.locator(".hero-stage")).toHaveAttribute(
    "data-scene-motion",
    "running",
  );
  await page.clock.pauseAt(new Date("2026-10-18T12:01:00Z"));
  await page.clock.runFor(2000);
}

async function probe(page: Page) {
  return page.evaluate(() => ({ ...window.heroPaint }));
}

async function blankPoint(page: Page) {
  return page.locator(".hero-stage").evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { x: rect.right - 50, y: rect.top + 28 };
  });
}

test("pointer influence stays local, settles after exit and returns to a lower idle paint rate", async ({
  page,
}) => {
  await observePaint(page);
  const canvas = await page.locator(".hero-canvas").boundingBox();
  if (!canvas) throw new Error("Missing hero canvas");
  const before = await probe(page);
  const viewport = page.viewportSize();
  if (!viewport) throw new Error("Missing viewport");
  const nearIndex = before.tiles.findIndex(
    (tile) =>
      tile.y + canvas.y < viewport.height - 80 && tile.x > viewport.width / 2,
  );
  expect(nearIndex).toBeGreaterThanOrEqual(0);
  const near = before.tiles[nearIndex];
  const farIndex = before.tiles.findIndex(
    (tile) => Math.hypot(tile.x - near.x, tile.y - near.y) > 400,
  );
  expect(farIndex).toBeGreaterThanOrEqual(0);
  await page.mouse.move(near.x + canvas.x + 24, near.y + canvas.y + 15);
  await page.clock.runFor(400);
  const active = await probe(page);
  const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.hypot(a.x - b.x, a.y - b.y);
  expect(distance(active.tiles[nearIndex], near)).toBeGreaterThan(3);
  expect(distance(active.tiles[farIndex], before.tiles[farIndex])).toBeLessThan(
    2,
  );
  await page.mouse.move(0, 0);
  await page.clock.runFor(1800);
  const settled = await probe(page);
  expect(distance(settled.tiles[nearIndex], near)).toBeLessThan(
    distance(active.tiles[nearIndex], near),
  );
  await page.clock.runFor(7000);
  const idle = await probe(page);
  await page.clock.runFor(1000);
  expect((await probe(page)).frames - idle.frames).toBeLessThanOrEqual(36);
  expect((await probe(page)).rings).toBe(0);
});

test("data fabric fills the complete hero in both palettes without exceeding its pixel budget", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
  await page.goto("/");
  for (const width of [375, 768, 1024, 1440, 1920, 2560, 3840]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect
      .poll(() =>
        page.locator(".hero-canvas").evaluate((element) => {
          const canvas = element as HTMLCanvasElement;
          const box = canvas.getBoundingClientRect();
          const dpr = Math.min(
            devicePixelRatio,
            1.75,
            Math.sqrt(6_000_000 / (box.width * box.height)),
          );
          return Math.abs(canvas.width - Math.round(box.width * dpr));
        }),
      )
      .toBe(0);
    const dimensions = await page
      .locator(".hero-canvas")
      .evaluate((element) => {
        const canvas = element as HTMLCanvasElement;
        const box = canvas.getBoundingClientRect();
        const host = canvas.parentElement?.getBoundingClientRect();
        const context = canvas.getContext("2d");
        if (!host || !context)
          throw new Error("Hero canvas did not initialize");
        const pixels = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        ).data;
        let painted = 0;
        for (let i = 3; i < pixels.length; i += 4) if (pixels[i] > 0) painted++;
        return {
          width: box.width,
          height: box.height,
          hostHeight: host.height,
          pixels: canvas.width * canvas.height,
          painted,
          ratio: canvas.width / box.width,
          overflow: document.documentElement.scrollWidth - innerWidth,
        };
      });
    expect(dimensions.width).toBe(width);
    expect(dimensions.height).toBe(dimensions.hostHeight);
    expect(dimensions.pixels).toBeLessThan(6_010_000);
    expect(dimensions.ratio).toBeLessThan(1.76);
    expect(dimensions.painted).toBeGreaterThan(1000);
    expect(dimensions.overflow).toBeLessThanOrEqual(1);
  }
  const light = await page
    .locator(".hero-canvas")
    .evaluate((element) => (element as HTMLCanvasElement).toDataURL());
  await page.emulateMedia({ colorScheme: "dark" });
  await expect
    .poll(() =>
      page
        .locator(".hero-canvas")
        .evaluate((element) => (element as HTMLCanvasElement).toDataURL()),
    )
    .not.toBe(light);
  const dark = await page
    .locator(".hero-canvas")
    .evaluate((element) => (element as HTMLCanvasElement).toDataURL());
  // An explicit theme must win over the system and redraw even with motion disabled.
  await page.getByRole("button", { name: /^Color theme:/ }).click();
  await page.getByRole("radio", { name: "Light", exact: true }).check();
  await expect
    .poll(() =>
      page
        .locator(".hero-canvas")
        .evaluate((element) => (element as HTMLCanvasElement).toDataURL()),
    )
    .not.toBe(dark);
});

test("rapid clicks stay bounded, decay completely and leave real controls usable", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-write", "clipboard-read"]);
  await observePaint(page);
  const point = await blankPoint(page);
  for (let i = 0; i < 24; i++) {
    await page.mouse.click(point.x - (i % 3) * 4, point.y);
    await page.clock.runFor(20);
  }
  const busy = await probe(page);
  expect(busy.rings).toBeGreaterThan(2);
  expect(busy.rings).toBeLessThanOrEqual(32);
  expect(busy.maxOperations).toBeLessThan(180);
  await page.mouse.move(0, 0);
  await page.clock.runFor(4000);
  expect((await probe(page)).rings).toBe(0);
  const beforeCopy = (await probe(page)).frames;
  await page.getByRole("button", { name: "Copy install command" }).click();
  await expect(
    page.getByRole("button", { name: "Copied", exact: true }),
  ).toBeVisible();
  await page.clock.runFor(100);
  expect((await probe(page)).rings).toBe(0);
  expect((await probe(page)).frames).toBeGreaterThan(beforeCopy);
  await page.getByRole("link", { name: "Start building", exact: true }).click();
  await expect(page).toHaveURL(/\/docs\/getting-started\//);
  const afterUnmount = (await probe(page)).frames;
  await page.clock.runFor(1500);
  expect((await probe(page)).frames).toBe(afterUnmount);
});

test("scene stops offscreen and in hidden tabs, resumes and honors live reduced-motion changes", async ({
  page,
}) => {
  await observePaint(page);
  const scene = page.locator(".hero-stage");
  await page.evaluate(() =>
    scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "instant",
    }),
  );
  expect(
    await scene.evaluate((element) => element.getBoundingClientRect().bottom),
  ).toBeLessThan(0);
  await expect(scene).toHaveAttribute("data-scene-motion", "paused");
  let frames = (await probe(page)).frames;
  await page.clock.runFor(3000);
  expect((await probe(page)).frames).toBe(frames);
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await expect(scene).toHaveAttribute("data-scene-motion", "running");
  await page.clock.runFor(200);
  expect((await probe(page)).frames).toBeGreaterThan(frames);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(scene).toHaveAttribute("data-scene-motion", "paused");
  frames = (await probe(page)).frames;
  await page.clock.runFor(10_000);
  expect((await probe(page)).frames).toBe(frames);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.clock.runFor(200);
  expect((await probe(page)).frames).toBeGreaterThan(frames);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(scene).toHaveAttribute("data-scene-motion", "reduced");
  frames = (await probe(page)).frames;
  const point = await blankPoint(page);
  await page.mouse.click(point.x, point.y);
  await page.clock.runFor(6000);
  expect((await probe(page)).frames).toBe(frames);
  expect((await probe(page)).rings).toBe(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.runFor(200);
  expect((await probe(page)).frames).toBeGreaterThan(frames);
});

test("touch taps emit a write pulse while swipe gestures and canceled touches do not", async ({
  page,
}) => {
  await observePaint(page);
  const scene = page.locator(".hero-stage");
  const point = await blankPoint(page);
  const event = {
    clientX: point.x,
    clientY: point.y,
    pointerType: "touch",
    pointerId: 8,
    isPrimary: true,
    button: 0,
  };
  await scene.dispatchEvent("pointerdown", event);
  await scene.dispatchEvent("pointermove", { ...event, clientY: point.y - 60 });
  await scene.dispatchEvent("pointerup", { ...event, clientY: point.y - 60 });
  await page.clock.runFor(200);
  expect((await probe(page)).rings).toBe(0);
  await scene.dispatchEvent("pointerdown", event);
  await scene.dispatchEvent("pointercancel", event);
  await scene.dispatchEvent("pointerup", event);
  await page.clock.runFor(200);
  expect((await probe(page)).rings).toBe(0);
  await scene.dispatchEvent("pointerdown", event);
  await scene.dispatchEvent("pointerup", event);
  await page.clock.runFor(200);
  expect((await probe(page)).rings).toBe(2);
  await page.clock.runFor(3500);
  expect((await probe(page)).rings).toBe(0);
});
