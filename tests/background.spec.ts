import { expect, test, type Page } from "@playwright/test";

async function start(page: Page) {
  await page.clock.install({ time: new Date("2026-10-18T12:00:00Z") });
  await page.goto("/");
  await expect(page.locator(".site-background")).toHaveAttribute(
    "data-motion",
    "running",
  );
  await page.clock.pauseAt(new Date("2026-10-18T12:01:00Z"));
  await page.clock.runFor(100);
}
async function poses(page: Page) {
  return page.locator(".fabric-object").evaluateAll((elements) =>
    elements
      .filter((element) => getComputedStyle(element).display !== "none")
      .map((element) => {
        const matrix = (element as SVGGraphicsElement).getCTM();
        if (!matrix) throw new Error("SVG transform was not initialized");
        return {
          x: matrix.e,
          y: matrix.f,
          opacity: Number(element.getAttribute("opacity")),
        };
      }),
  );
}
async function pulseCount(page: Page) {
  return page.locator(".fabric-pulse[data-active]").count();
}

test("one persistent SVG covers the page, footer and client-side document navigation", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const background = page.locator("svg.site-background");
  await expect(background).toHaveCount(1);
  await expect(background).toHaveAttribute("data-motion", "running");
  await expect(page.locator("canvas.hero-canvas")).toHaveCount(0);
  await background.evaluate((element) =>
    element.setAttribute("data-continuity", "retained"),
  );
  await page.evaluate(() =>
    scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "instant",
    }),
  );
  await expect(page.locator(".hero-stage")).toHaveAttribute(
    "data-scene-motion",
    "paused",
  );
  await expect(background).toHaveAttribute("data-motion", "running");
  expect(
    await background.evaluate((element) => element.getBoundingClientRect().top),
  ).toBe(0);
  expect(
    await page
      .locator(".database-art > svg")
      .evaluate((element) => (element as SVGSVGElement).animationsPaused()),
  ).toBe(true);
  await page.getByRole("link", { name: "Quick start", exact: true }).click();
  await expect(page).toHaveURL(/\/docs\/getting-started\//);
  await expect(background).toHaveAttribute("data-continuity", "retained");
  await expect(background).toHaveAttribute("data-motion", "running");
  await page.getByRole("link", { name: "Brand assets", exact: true }).click();
  await expect(page).toHaveURL(/\/brand\//);
  await expect(background).toHaveAttribute("data-continuity", "retained");
  expect(errors).toEqual([]);
});

test("SVG stays crisp and bounded at responsive widths and follows both theme sources", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
  await page.goto("/");
  const background = page.locator(".site-background");
  for (const width of [375, 768, 1024, 1440, 1920, 2560, 3840]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect
      .poll(() =>
        background.evaluate((element) => {
          const svg = element as SVGSVGElement;
          return Math.abs(
            svg.getBoundingClientRect().width - svg.viewBox.baseVal.width,
          );
        }),
      )
      .toBeLessThan(1);
    const result = await background.evaluate((element) => {
      const box = element.getBoundingClientRect();
      const visible = [...element.querySelectorAll(".fabric-object")].filter(
        (node) => getComputedStyle(node).display !== "none",
      );
      return {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        viewportHeight: innerHeight,
        objects: visible.length,
        overflow: document.documentElement.scrollWidth - innerWidth,
        pointerEvents: getComputedStyle(element).pointerEvents,
        brokenReferences: [...element.querySelectorAll("use")].filter(
          (use) =>
            !document.getElementById(use.getAttribute("href")?.slice(1) ?? ""),
        ).length,
      };
    });
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
    expect(result.width).toBe(width);
    expect(result.height).toBe(result.viewportHeight);
    expect(result.overflow).toBeLessThanOrEqual(1);
    expect(result.objects).toBeLessThanOrEqual(width < 768 ? 18 : 40);
    expect(result.objects).toBeGreaterThan(8);
    expect(result.brokenReferences).toBe(0);
    expect(result.pointerEvents).toBe("none");
  }
  const color = () =>
    page
      .locator(".fabric-object")
      .first()
      .evaluate((element) => getComputedStyle(element).color);
  const light = await color();
  await page.emulateMedia({ colorScheme: "dark" });
  await expect.poll(color).not.toBe(light);
  await page.getByRole("button", { name: /^Color theme:/ }).click();
  await page.getByRole("radio", { name: "Light", exact: true }).check();
  await expect.poll(color).toBe(light);
});

test("nearby geometry reacts locally, settles after pointer exit and sleeps after inactivity", async ({
  page,
}) => {
  const viewport = page.viewportSize();
  if (!viewport) throw new Error("Missing viewport");
  await page.setViewportSize({
    width: viewport.width,
    height: Math.max(1000, viewport.height),
  });
  await start(page);
  const before = await poses(page);
  const index = await page.evaluate(
    (points) =>
      points.findIndex((point) => {
        if (
          point.x < innerWidth * 0.55 ||
          point.y < 110 ||
          point.y > innerHeight - 50 ||
          point.opacity < 0.15
        )
          return false;
        return !document
          .elementFromPoint(point.x + 20, point.y + 12)
          ?.closest("a,button,input,summary,pre,code");
      }),
    before,
  );
  expect(index).toBeGreaterThanOrEqual(0);
  const near = before[index];
  const far = before.findIndex(
    (point) =>
      point.opacity > 0.01 &&
      Math.hypot(point.x - near.x, point.y - near.y) > 400,
  );
  expect(far).toBeGreaterThanOrEqual(0);
  await page.mouse.move(near.x + 20, near.y + 12);
  await page.clock.runFor(400);
  const active = await poses(page);
  const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.hypot(a.x - b.x, a.y - b.y);
  expect(distance(active[index], near)).toBeGreaterThan(3);
  expect(distance(active[far], before[far])).toBeLessThan(2);
  await page.locator("html").dispatchEvent("pointerleave");
  await page.clock.runFor(1600);
  expect(distance((await poses(page))[index], near)).toBeLessThan(
    distance(active[index], near),
  );
  await page.clock.fastForward(7000);
  await expect(page.locator(".site-background")).toHaveAttribute(
    "data-activity",
    "idle",
  );
});

test("click waves and sparks have a fixed budget and expire without blocking real controls", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await start(page);
  const background = page.locator(".site-background");
  const count = await background.locator("*").count();
  const point = await page.evaluate(() => ({ x: innerWidth - 40, y: 120 }));
  for (let i = 0; i < 24; i++) {
    await page.mouse.click(point.x - (i % 3) * 5, point.y + (i % 4) * 10);
    await page.clock.runFor(20);
  }
  expect(await pulseCount(page)).toBeGreaterThan(0);
  expect(await pulseCount(page)).toBeLessThanOrEqual(6);
  expect(await background.locator("*").count()).toBe(count);
  const sparks = await background
    .locator(".fabric-pulse[data-active] .fabric-spark")
    .evaluateAll(
      (elements) =>
        elements.filter(
          (element) => getComputedStyle(element).display !== "none",
        ).length,
    );
  expect(sparks).toBeLessThanOrEqual(60);
  await page.clock.fastForward(3000);
  expect(await pulseCount(page)).toBe(0);
  await page
    .getByRole("button", { name: "Copy install command", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Copied", exact: true }),
  ).toBeVisible();
  expect(await pulseCount(page)).toBe(0);
  await page.getByRole("link", { name: "Start building", exact: true }).click();
  await expect(page).toHaveURL(/\/docs\/getting-started\//);
  expect(await pulseCount(page)).toBe(0);
  await expect(background).toHaveAttribute("data-motion", "running");
});

test("hidden and reduced-motion scenes freeze, then resume without a large time jump", async ({
  page,
}) => {
  await start(page);
  const background = page.locator(".site-background");
  const ambient = await poses(page);
  const click = await page.evaluate(() => ({
    clientX: innerWidth - 25,
    clientY: 120,
    pointerType: "touch",
    pointerId: 9,
    isPrimary: true,
    button: 0,
  }));
  await page.locator("#main").dispatchEvent("pointerdown", click);
  await page.locator("#main").dispatchEvent("pointerup", click);
  expect(await pulseCount(page)).toBe(1);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(background).toHaveAttribute("data-motion", "paused");
  let frozen = await poses(page);
  await page.clock.fastForward(60_000);
  expect(await poses(page)).toEqual(frozen);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(background).toHaveAttribute("data-motion", "running");
  await page.clock.runFor(100);
  const resumed = await poses(page);
  expect(await pulseCount(page)).toBe(0);
  expect(resumed).not.toEqual(frozen);
  expect(
    Math.max(
      ...resumed.map((point, index) =>
        Math.hypot(point.x - ambient[index].x, point.y - ambient[index].y),
      ),
    ),
  ).toBeLessThan(5);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(background).toHaveAttribute("data-motion", "reduced");
  await page.clock.runFor(50);
  frozen = await poses(page);
  await page.mouse.click(200, 150);
  await page.clock.fastForward(3000);
  expect(await poses(page)).toEqual(frozen);
  expect(await pulseCount(page)).toBe(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(background).toHaveAttribute("data-motion", "running");
  await page.clock.runFor(150);
  expect(await poses(page)).not.toEqual(frozen);
  await background.evaluate((element) => {
    (element as SVGSVGElement).style.display = "none";
  });
  await expect(background).toHaveAttribute("data-motion", "paused");
  const hidden = await page
    .locator(".fabric-object")
    .evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("transform")),
    );
  await page.clock.runFor(1000);
  expect(
    await page
      .locator(".fabric-object")
      .evaluateAll((elements) =>
        elements.map((element) => element.getAttribute("transform")),
      ),
  ).toEqual(hidden);
  await background.evaluate((element) => {
    (element as SVGSVGElement).style.removeProperty("display");
  });
  await expect(background).toHaveAttribute("data-motion", "running");
});

test("touch taps work while swipes, canceled gestures and text selection do not emit effects", async ({
  page,
}) => {
  await start(page);
  const main = page.locator("#main");
  const event = {
    clientX: 160,
    clientY: 180,
    pointerType: "touch",
    pointerId: 7,
    isPrimary: true,
    button: 0,
  };
  await main.dispatchEvent("pointerdown", event);
  await main.dispatchEvent("pointermove", { ...event, clientY: 120 });
  await main.dispatchEvent("pointerup", { ...event, clientY: 120 });
  expect(await pulseCount(page)).toBe(0);
  await main.dispatchEvent("pointerdown", event);
  await main.dispatchEvent("pointercancel", event);
  await main.dispatchEvent("pointerup", event);
  expect(await pulseCount(page)).toBe(0);
  await page.locator(".hero-detail").evaluate((element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    getSelection()?.addRange(range);
  });
  await main.dispatchEvent("pointerdown", event);
  await main.dispatchEvent("pointerup", event);
  expect(await pulseCount(page)).toBe(0);
  await page.evaluate(() => getSelection()?.removeAllRanges());
  await main.dispatchEvent("pointerdown", event);
  await main.dispatchEvent("pointerup", event);
  expect(await pulseCount(page)).toBe(1);
  await page.clock.fastForward(3000);
  expect(await pulseCount(page)).toBe(0);
  await page.evaluate(() => scrollTo({ top: 400, behavior: "instant" }));
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(300);
});

test("a static native SVG remains available without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    reducedMotion: "reduce",
    colorScheme: "dark",
  });
  try {
    const page = await context.newPage();
    await page.goto(baseURL ?? "http://127.0.0.1:3000");
    await expect(page.locator("svg.site-background")).toHaveAttribute(
      "data-motion",
      "static",
    );
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Small footprint.Serious database.",
    );
    expect(await page.locator(".fabric-object").count()).toBeGreaterThan(0);
  } finally {
    await context.close();
  }
});
