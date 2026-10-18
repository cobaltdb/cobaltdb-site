import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function brightness(page: Page) {
  return page.evaluate(() => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is unavailable");
    ctx.fillStyle = getComputedStyle(document.body).backgroundColor;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return (r + g + b) / 3;
  });
}

function themeTrigger(page: Page) {
  return page.getByRole("button", { name: /^Color theme:/ });
}

async function chooseTheme(page: Page, value: "light" | "dark" | "system") {
  await themeTrigger(page).click();
  const label = value[0].toUpperCase() + value.slice(1);
  await page.getByRole("radio", { name: label, exact: true }).check();
  await themeTrigger(page).click();
}

test("system theme follows the OS until the visitor makes an explicit choice", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await expect(themeTrigger(page)).toHaveAccessibleName("Color theme: System");
  expect(await brightness(page)).toBeGreaterThan(220);
  await page.emulateMedia({ colorScheme: "dark" });
  expect(await brightness(page)).toBeLessThan(60);
  await chooseTheme(page, "light");
  expect(await brightness(page)).toBeGreaterThan(220);
  await page.reload();
  expect(await brightness(page)).toBeGreaterThan(220);
  await expect(themeTrigger(page)).toHaveAccessibleName("Color theme: Light");
});

test("dark preference persists across reloads and document navigation without hydration errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await chooseTheme(page, "dark");
  expect(await brightness(page)).toBeLessThan(60);
  await page.reload();
  expect(await brightness(page)).toBeLessThan(60);
  await page.getByRole("link", { name: "Start building", exact: true }).click();
  await expect(page).toHaveURL(/\/docs\/getting-started\//);
  await expect(themeTrigger(page)).toHaveAccessibleName("Color theme: Dark");
  expect(await brightness(page)).toBeLessThan(60);
  await chooseTheme(page, "system");
  await expect(themeTrigger(page)).toHaveAccessibleName("Color theme: System");
  expect(errors).toEqual([]);
});

test("theme changes sync with another open tab", async ({ context, page }) => {
  await page.goto("/");
  const other = await context.newPage();
  await other.goto("/docs/sql/");
  await chooseTheme(page, "dark");
  await expect(themeTrigger(other)).toHaveAccessibleName("Color theme: Dark");
  expect(await brightness(other)).toBeLessThan(60);
  await chooseTheme(other, "light");
  await expect(themeTrigger(page)).toHaveAccessibleName("Color theme: Light");
  expect(await brightness(page)).toBeGreaterThan(220);
});

test("theme switching works when storage is blocked", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error("Storage blocked");
    };
    Storage.prototype.setItem = () => {
      throw new Error("Storage blocked");
    };
  });
  await page.goto("/");
  await chooseTheme(page, "dark");
  expect(await brightness(page)).toBeLessThan(60);
  await chooseTheme(page, "light");
  expect(await brightness(page)).toBeGreaterThan(220);
  expect(errors).toEqual([]);
});

test("appearance panel supports preview, keyboard navigation and dismissal", async ({
  page,
}) => {
  await page.goto("/");
  const trigger = themeTrigger(page);
  await trigger.focus();
  await page.keyboard.press("Enter");
  const panel = page.getByRole("dialog", { name: "Appearance" });
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByRole("radio", { name: "System", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(
    page.getByRole("radio", { name: "Dark", exact: true }),
  ).toBeChecked();
  await expect(trigger).toHaveAccessibleName("Color theme: Dark");
  expect(await brightness(page)).toBeLessThan(60);
  await expect(panel).toBeVisible();
  await page.keyboard.press("ArrowLeft");
  await expect(
    page.getByRole("radio", { name: "Light", exact: true }),
  ).toBeChecked();
  expect(await brightness(page)).toBeGreaterThan(220);
  await page.keyboard.press("Escape");
  await expect(panel).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await expect(
    page.getByRole("radio", { name: "Light", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(panel).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Animasyonları kapat", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Search documentation", exact: true }),
  ).toBeFocused();
  await trigger.click();
  // Use the page edge: the panel intentionally overlaps the hero on small phones.
  await page.getByRole("main").click({ position: { x: 4, y: 4 } });
  await expect(panel).not.toBeVisible();
});

test("appearance panel fits the viewport and passes accessibility checks in both themes", async ({
  page,
}) => {
  for (const width of [320, 390, 768, 1024, 1440, 3840]) {
    await page.setViewportSize({ width, height: width === 3840 ? 2160 : 844 });
    await page.goto("/");
    await themeTrigger(page).click();
    const panel = page.getByRole("dialog", { name: "Appearance" });
    const bounds = await panel.boundingBox();
    expect(bounds).not.toBeNull();
    if (!bounds) throw new Error("Appearance panel is not visible");
    expect(bounds.x, `${width}px left edge`).toBeGreaterThanOrEqual(8);
    expect(
      bounds.x + bounds.width,
      `${width}px right edge`,
    ).toBeLessThanOrEqual(width - 8);
    expect(bounds.y).toBeGreaterThan(44);
    expect(bounds.y + bounds.height).toBeLessThan(width === 3840 ? 2160 : 844);
    for (const label of ["Light", "Dark", "System"]) {
      const target = await panel
        .locator("label")
        .filter({ hasText: label })
        .boundingBox();
      expect(target?.width).toBeGreaterThanOrEqual(44);
      expect(target?.height).toBeGreaterThanOrEqual(44);
    }
  }
  for (const theme of ["Light", "Dark"]) {
    await page.getByRole("radio", { name: theme, exact: true }).check();
    // Audit the settled palette rather than a frame midway through color transitions.
    await page.evaluate(() =>
      Promise.allSettled(
        document
          .getAnimations()
          .filter((animation) => animation instanceof CSSTransition)
          .map((animation) => animation.finished),
      ),
    );
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.failureSummary),
      })),
    ).toEqual([]);
  }
});

test("OS dark styling is readable before JavaScript runs", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    colorScheme: "dark",
  });
  const page = await context.newPage();
  try {
    await page.goto(baseURL ?? "http://127.0.0.1:3000");
    expect(await brightness(page)).toBeLessThan(60);
    await expect(
      page.getByRole("heading", { name: /oxog\s*net\s*\./ }),
    ).toBeVisible();
    const logo = page.locator(".studio-symbol");
    await expect(logo).toBeVisible();
    expect(
      await logo
        .locator("path")
        .evaluateAll((paths) =>
          paths.map((path) => getComputedStyle(path).strokeDashoffset),
        ),
    ).toEqual(["0px", "0px", "0px", "0px"]);
  } finally {
    await context.close();
  }
});

test("OXOGNET studio card and theme selector fit small phones and 4K", async ({
  page,
}) => {
  for (const width of [320, 390, 768, 1440, 3840]) {
    await page.setViewportSize({ width, height: width === 3840 ? 2160 : 1000 });
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /oxog\s*net\s*\./ }),
    ).toBeVisible();
    const projects = page.getByRole("navigation", {
      name: "More from OXOGNET",
    });
    await expect(projects.getByRole("link")).toHaveCount(4);
    await expect(
      projects.getByRole("link", { name: /NineDeploy/ }),
    ).toHaveAttribute("href", "https://oxog.net/projects/ninedeploy");
    const picker = await themeTrigger(page).boundingBox();
    expect(picker?.width).toBeGreaterThanOrEqual(44);
    expect(picker?.height).toBeGreaterThanOrEqual(44);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
      `${width}px layout`,
    ).toBeLessThanOrEqual(1);
  }
});

test("dark pages and search pass automated WCAG AA checks", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.goto("/");
  await chooseTheme(page, "dark");
  for (const route of [
    "/",
    "/docs/getting-started/",
    "/docs/sql/",
    "/docs/architecture/",
    "/docs/server/",
    "/docs/production/",
    "/brand/",
  ]) {
    await page.goto(route);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
      route,
    ).toEqual([]);
  }
  await page
    .getByRole("button", { name: "Search documentation", exact: true })
    .click();
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    result.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
      })),
    })),
  ).toEqual([]);
});
