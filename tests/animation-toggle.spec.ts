import { expect, test, type Page } from "@playwright/test";

const key = "cobaltdb-animations";
const toggle = (page: Page) => page.locator(".animation-toggle");
const scene = (page: Page) => page.locator(".site-background");

async function expectMouseOff(page: Page) {
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");
  await expect(scene(page)).toHaveAttribute("data-motion", "running");
  await expect(page.locator(".site-interaction")).toHaveAttribute(
    "data-motion",
    "disabled",
  );
}

async function expectMouseOn(page: Page) {
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
  await expect(scene(page)).toHaveAttribute("data-motion", "running");
  await expect(page.locator(".site-interaction")).toHaveAttribute(
    "data-motion",
    "running",
  );
}

declare global {
  interface Window {
    backgroundListenerCount: () => Record<string, number>;
  }
}

async function trackListeners(page: Page) {
  await page.addInitScript(() => {
    const active: { target: EventTarget; type: string; listener: unknown }[] =
      [];
    const add = EventTarget.prototype.addEventListener;
    const remove = EventTarget.prototype.removeEventListener;
    const tracked = (target: EventTarget, type: string) =>
      (target === document &&
        /^(pointermove|pointerdown|pointerup|pointercancel)$/.test(type)) ||
      (target === window && /^(scroll|resize)$/.test(type));
    EventTarget.prototype.addEventListener = function (
      type,
      listener,
      options,
    ) {
      if (
        tracked(this, type) &&
        !active.some(
          (item) =>
            item.target === this &&
            item.type === type &&
            item.listener === listener,
        )
      )
        active.push({ target: this, type, listener });
      return add.call(this, type, listener, options);
    };
    EventTarget.prototype.removeEventListener = function (
      type,
      listener,
      options,
    ) {
      const index = active.findIndex(
        (item) =>
          item.target === this &&
          item.type === type &&
          item.listener === listener,
      );
      if (index !== -1) active.splice(index, 1);
      return remove.call(this, type, listener, options);
    };
    window.backgroundListenerCount = () =>
      Object.fromEntries(
        [
          "pointermove",
          "pointerdown",
          "pointerup",
          "pointercancel",
          "scroll",
          "resize",
        ].map((type) => [
          type,
          active.filter((item) => item.type === type).length,
        ]),
      );
  });
}

async function start(page: Page) {
  await page.clock.install({ time: new Date("2026-10-18T12:00:00Z") });
  await page.goto("/");
  await expect(scene(page)).toHaveAttribute("data-motion", "running");
  await page.clock.pauseAt(new Date("2026-10-18T12:01:00Z"));
  await page.clock.runFor(100);
}

async function clickFrozenScene(page: Page, selector: string) {
  const box = await page.locator(selector).boundingBox();
  if (!box) throw new Error(`Missing click target: ${selector}`);
  // Locator stability checks need RAF; this test deliberately owns a paused clock.
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

test("disables mouse effects while ambient motion continues and restarts without leaks", async ({
  page,
}) => {
  await trackListeners(page);
  await start(page);
  await expect(toggle(page)).toHaveAccessibleName("Disable mouse effects");
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
  const active = await page.evaluate(() => window.backgroundListenerCount());
  await clickFrozenScene(page, ".hero-detail");
  await page.clock.runFor(120);
  await expect(page.locator(".fabric-pulse[data-active]")).not.toHaveCount(0);
  const heroMotion = await page
    .locator(".hero-stage")
    .getAttribute("data-scene-motion");
  await clickFrozenScene(page, ".animation-toggle");
  await expectMouseOff(page);
  await expect(toggle(page)).toHaveAccessibleName("Enable mouse effects");
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".animation-icon-off")).toBeVisible();
  await expect(page.locator(".fabric-pulse[data-active]")).toHaveCount(0);
  const disabled = await page.evaluate(() => window.backgroundListenerCount());
  for (const type of Object.keys(active))
    expect(active[type] - disabled[type], type).toBe(
      type.startsWith("pointer") ? 1 : 0,
    );
  await page.clock.runFor(100);
  const positions = () =>
    page
      .locator(".fabric-object")
      .evaluateAll((elements) =>
        elements.map((element) => element.getAttribute("transform")),
      );
  const snapshot = await positions();
  await page.mouse.move(220, 260);
  await clickFrozenScene(page, ".hero-detail");
  await page.clock.runFor(1500);
  expect(await positions()).not.toEqual(snapshot);
  await expect(page.locator(".fabric-pulse[data-active]")).toHaveCount(0);
  expect(
    await page
      .locator(".fabric-pointer,.fabric-response,.fabric-trail")
      .evaluateAll((elements) =>
        elements.every(
          (element) => Number(element.getAttribute("opacity")) === 0,
        ),
      ),
  ).toBe(true);
  // Disabling mouse effects preserves the foreground illustration as well.
  await expect(page.locator(".hero-stage")).toHaveAttribute(
    "data-scene-motion",
    heroMotion ?? "paused",
  );
  for (let index = 0; index < 3; index++) {
    await toggle(page).focus();
    await page.keyboard.press(index % 2 ? "Space" : "Enter");
    await expectMouseOn(page);
    expect(await page.evaluate(() => window.backgroundListenerCount())).toEqual(
      active,
    );
    await toggle(page).focus();
    await expect(page.locator(".animation-tooltip")).toBeVisible();
    await toggle(page).press("Enter");
    await expectMouseOff(page);
    expect(await page.evaluate(() => window.backgroundListenerCount())).toEqual(
      disabled,
    );
  }
  await toggle(page).press("Enter");
  await expectMouseOn(page);
  // A click before the restarted scene's first RAF must survive initial measurement.
  await clickFrozenScene(page, "h1");
  await page.clock.runFor(100);
  await expect(page.locator(".fabric-pulse[data-active]")).not.toHaveCount(0);
});

test("remembers the choice across reloads and client navigation while other header controls work", async ({
  page,
}) => {
  await page.goto("/");
  await expect(scene(page)).toHaveAttribute("data-motion", "running");
  await toggle(page).click();
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(
    "off",
  );
  await page.reload();
  await expectMouseOff(page);
  await page.locator(".theme-trigger").click();
  await page.getByRole("radio", { name: "Dark", exact: true }).check();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.keyboard.press("Escape");
  await expectMouseOff(page);
  await page.locator(".search-trigger").click();
  await expect(page.locator("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("link", { name: "Quick start", exact: true }).click();
  await expect(page).toHaveURL(/\/docs\/getting-started\/$/);
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");
  await expectMouseOff(page);
  await toggle(page).click();
  await page.reload();
  await expectMouseOn(page);
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(
    "on",
  );
});

test("uses reduced motion on first visit and respects an explicit background-only override", async ({
  page,
}) => {
  await trackListeners(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(scene(page)).toHaveAttribute("data-motion", "reduced");
  await expect(toggle(page)).toHaveAccessibleName("Enable mouse effects");
  const disabled = await page.evaluate(() => window.backgroundListenerCount());
  await toggle(page).click();
  await expect(scene(page)).toHaveAttribute("data-motion", "running");
  const enabled = await page.evaluate(() => window.backgroundListenerCount());
  for (const type of [
    "pointermove",
    "pointerdown",
    "pointerup",
    "pointercancel",
  ])
    expect(enabled[type] - disabled[type], type).toBe(1);
  await expect(page.locator(".site-interaction")).toBeVisible();
  await expect(page.locator(".hero-stage")).toHaveAttribute(
    "data-scene-motion",
    "reduced",
  );
  await page.reload();
  await expect(scene(page)).toHaveAttribute("data-motion", "running");
  await toggle(page).click();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expectMouseOff(page);
  await page.reload();
  await expectMouseOff(page);
  const off = await page.evaluate(() => window.backgroundListenerCount());
  for (const type of [
    "pointermove",
    "pointerdown",
    "pointerup",
    "pointercancel",
  ])
    expect(off[type], type).toBe(disabled[type]);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(scene(page)).toHaveAttribute("data-motion", "reduced");
  await expect(toggle(page)).toHaveAccessibleName("Enable mouse effects");
});

test("follows live system changes until a choice is saved and synchronizes between tabs", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await expect(scene(page)).toHaveAttribute("data-motion", "running");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(scene(page)).toHaveAttribute("data-motion", "reduced");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(scene(page)).toHaveAttribute("data-motion", "running");
  const other = await context.newPage();
  await other.goto("/");
  await expect(scene(other)).toHaveAttribute("data-motion", "running");
  await toggle(other).click();
  await expectMouseOff(page);
  await toggle(page).click();
  await expectMouseOn(other);
  await other.evaluate((key) => localStorage.removeItem(key), key);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(scene(page)).toHaveAttribute("data-motion", "reduced");
  await other.close();
});

test("still toggles when browser storage is blocked", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = Storage.prototype.setItem = () => {
      throw new DOMException("Blocked", "SecurityError");
    };
  });
  await page.goto("/");
  await expect(scene(page)).toHaveAttribute("data-motion", "running");
  await toggle(page).click();
  await expectMouseOff(page);
  await toggle(page).click();
  await expectMouseOn(page);
});

test("keeps a visible keyboard focus and a 44px touch target without header overflow", async ({
  page,
}) => {
  await page.goto("/");
  for (const width of [320, 375, 768, 1024, 1440, 1920, 2560, 3840]) {
    await page.setViewportSize({ width, height: 1000 });
    const button = toggle(page);
    await button.focus();
    await expect(page.locator(".animation-tooltip")).toBeVisible();
    const layout = await button.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const theme = document
        .querySelector(".theme-trigger")
        ?.getBoundingClientRect();
      const brand = document
        .querySelector(".site-header .logo")
        ?.getBoundingClientRect();
      if (!theme || !brand) throw new Error("Header controls are missing");
      return {
        x: rect.x,
        right: rect.right,
        width: rect.width,
        height: rect.height,
        themeRight: theme.right,
        brandRight: brand.right,
        themeLeft: theme.x,
        outline: getComputedStyle(element).outlineStyle,
        scroll: document.documentElement.scrollWidth,
        viewport: innerWidth,
      };
    });
    expect(layout.width, `${width}px touch width`).toBeGreaterThanOrEqual(44);
    expect(layout.height).toBeGreaterThanOrEqual(44);
    expect(layout.x).toBeGreaterThanOrEqual(layout.themeRight);
    expect(layout.brandRight).toBeLessThanOrEqual(layout.themeLeft);
    expect(layout.right).toBeLessThanOrEqual(width);
    expect(layout.scroll).toBeLessThanOrEqual(layout.viewport);
    expect(layout.outline).toBe("solid");
  }
});
