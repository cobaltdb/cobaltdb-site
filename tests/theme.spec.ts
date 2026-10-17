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

test("system theme follows the OS until the visitor makes an explicit choice", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await expect(page.getByRole("combobox", { name: "Color theme" })).toHaveValue(
    "system",
  );
  expect(await brightness(page)).toBeGreaterThan(220);
  await page.emulateMedia({ colorScheme: "dark" });
  expect(await brightness(page)).toBeLessThan(60);
  await page
    .getByRole("combobox", { name: "Color theme" })
    .selectOption("light");
  expect(await brightness(page)).toBeGreaterThan(220);
  await page.reload();
  expect(await brightness(page)).toBeGreaterThan(220);
  await expect(page.getByRole("combobox", { name: "Color theme" })).toHaveValue(
    "light",
  );
});

test("dark preference persists across reloads and document navigation without hydration errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page
    .getByRole("combobox", { name: "Color theme" })
    .selectOption("dark");
  expect(await brightness(page)).toBeLessThan(60);
  await page.reload();
  expect(await brightness(page)).toBeLessThan(60);
  await page.getByRole("link", { name: "Start building", exact: true }).click();
  await expect(page).toHaveURL(/\/docs\/getting-started\//);
  await expect(page.getByRole("combobox", { name: "Color theme" })).toHaveValue(
    "dark",
  );
  expect(await brightness(page)).toBeLessThan(60);
  await page
    .getByRole("combobox", { name: "Color theme" })
    .selectOption("system");
  await expect(page.getByRole("combobox", { name: "Color theme" })).toHaveValue(
    "system",
  );
  expect(errors).toEqual([]);
});

test("theme changes sync with another open tab", async ({ context, page }) => {
  await page.goto("/");
  const other = await context.newPage();
  await other.goto("/docs/sql/");
  await page
    .getByRole("combobox", { name: "Color theme" })
    .selectOption("dark");
  await expect(
    other.getByRole("combobox", { name: "Color theme" }),
  ).toHaveValue("dark");
  expect(await brightness(other)).toBeLessThan(60);
  await other
    .getByRole("combobox", { name: "Color theme" })
    .selectOption("light");
  await expect(page.getByRole("combobox", { name: "Color theme" })).toHaveValue(
    "light",
  );
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
  const picker = page.getByRole("combobox", { name: "Color theme" });
  await picker.selectOption("dark");
  expect(await brightness(page)).toBeLessThan(60);
  await picker.selectOption("light");
  expect(await brightness(page)).toBeGreaterThan(220);
  expect(errors).toEqual([]);
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
    const picker = await page
      .getByRole("combobox", { name: "Color theme" })
      .boundingBox();
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
  await page
    .getByRole("combobox", { name: "Color theme" })
    .selectOption("dark");
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
