import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("body and technical text use the semantic font families", async ({
  page,
}) => {
  await page.goto("/docs/getting-started/");
  await page.evaluate(() => document.fonts.ready);
  const fonts = await page.evaluate(() => {
    const style = (selector: string) => {
      const element = document.querySelector(selector);
      if (!element) throw new Error(`Missing ${selector}`);
      return getComputedStyle(element);
    };
    return {
      body: style("body").fontFamily,
      heading: style("h1").fontFamily,
      mono: style("pre").fontFamily,
      inline: parseFloat(style(".docs-section p code").fontSize),
      paragraph: parseFloat(style(".docs-section p").fontSize),
    };
  });
  expect(fonts.body).toBe(fonts.heading);
  expect(fonts.mono).not.toBe(fonts.body);
  expect(fonts.inline / fonts.paragraph).toBeGreaterThanOrEqual(0.85);
});

test("appearance panel fits short screens and remains scrollable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 280 });
  await page.goto("/");
  await page.getByRole("button", { name: /Color theme:/ }).click();
  const panel = page.getByRole("dialog", { name: "Appearance" });
  await expect(panel).toBeVisible();
  await expect
    .poll(async () => {
      const box = await panel.boundingBox();
      return box ? box.y + box.height : 1000;
    })
    .toBeLessThanOrEqual(268);
  await panel.getByRole("radio", { name: "Dark", exact: true }).check();
  await expect(
    panel.getByRole("radio", { name: "Dark", exact: true }),
  ).toBeChecked();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Color theme: Dark" }),
  ).toBeFocused();
});

test("selected text retains AA contrast in both themes", async ({ page }) => {
  await page.goto("/");
  for (const theme of ["light", "dark"]) {
    await page.evaluate((value) => {
      document.documentElement.dataset.theme = value;
    }, theme);
    const contrast = await page.evaluate(() => {
      const style = getComputedStyle(document.body, "::selection");
      const context = document.createElement("canvas").getContext("2d");
      if (!context) throw new Error("Canvas unavailable");
      const luminance = (color: string) => {
        context.fillStyle = color;
        context.fillRect(0, 0, 1, 1);
        const rgb = [...context.getImageData(0, 0, 1, 1).data]
          .slice(0, 3)
          .map((v) => {
            const s = v / 255;
            return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
          });
        return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
      };
      const a = luminance(style.color),
        b = luminance(style.backgroundColor);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    });
    expect(contrast, `${theme} selection`).toBeGreaterThanOrEqual(4.5);
  }
});

test("all routes reflow across themes and breakpoint boundaries", async ({
  page,
}) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const routes = [
    "/",
    "/docs/",
    "/docs/getting-started/",
    "/docs/sql/",
    "/docs/architecture/",
    "/docs/server/",
    "/docs/production/",
    "/brand/",
  ];
  await page.goto("/");
  for (const theme of ["light", "dark"]) {
    await page.getByRole("button", { name: /Color theme:/ }).click();
    await page
      .getByRole("radio", {
        name: theme === "light" ? "Light" : "Dark",
        exact: true,
      })
      .check();
    await page.keyboard.press("Escape");
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await page.evaluate(() => document.fonts.ready);
      for (const width of [
        320, 375, 390, 679, 680, 681, 768, 849, 850, 851, 1024, 1100, 1101,
        1280, 1439, 1440, 1441, 1920, 2560,
      ]) {
        await page.setViewportSize({ width, height: 900 });
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth - innerWidth,
          ),
          `${theme} ${route} ${width}px`,
        ).toBeLessThanOrEqual(1);
        if (width === 320 || width === 1440) {
          const axe = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
            .analyze();
          expect(axe.violations, `${theme} ${route} ${width}px`).toEqual([]);
        }
      }
      const axe = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(axe.violations, `${theme} ${route}`).toEqual([]);
    }
  }
  expect(errors).toEqual([]);
});

test("content survives script failure and enlarged text", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const route of ["/", "/docs/", "/docs/getting-started/", "/brand/"]) {
    await page.setViewportSize({ width: 640, height: 480 });
    await page.goto(route);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(
      await page
        .locator("body")
        .evaluate(() => document.documentElement.scrollWidth - innerWidth),
      route,
    ).toBeLessThanOrEqual(1);
    for (const section of await page.locator("main section").all()) {
      await expect(section).toHaveCSS("opacity", "1");
    }
  }
  await context.close();
});

test("install command reflows without losing its copy action", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/");
  const code = page.locator(".install-command code");
  expect(
    await code.evaluate((el) => el.scrollWidth - el.clientWidth),
  ).toBeLessThanOrEqual(1);
  const copy = await page
    .getByRole("button", { name: "Copy install command" })
    .boundingBox();
  expect(copy?.width).toBeGreaterThanOrEqual(44);
  expect(copy?.height).toBeGreaterThanOrEqual(44);
});

test("guide anchors clear the sticky header without doubling the gap", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [390, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/docs/architecture/");
    await page
      .getByRole("link", { name: "From SQL to rows", exact: true })
      .click();
    const gap = await page.locator("#query").evaluate((el) => {
      const header = document.querySelector("header");
      if (!header) throw new Error("Missing header");
      return (
        el.getBoundingClientRect().top - header.getBoundingClientRect().bottom
      );
    });
    expect(gap).toBeGreaterThanOrEqual(0);
    expect(gap).toBeLessThanOrEqual(32);
  }
});

test("short search keeps footer and long empty-query feedback inside the dialog", async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 280 });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Search documentation", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Search documentation" })
    .fill("x".repeat(160));
  const dialog = page.getByRole("dialog");
  expect(
    await dialog.evaluate((el) => el.scrollWidth - el.clientWidth),
  ).toBeLessThanOrEqual(1);
  expect(
    await page
      .locator(".empty-search")
      .evaluate((el) => el.scrollWidth - el.clientWidth),
  ).toBeLessThanOrEqual(1);
  const bounds = await dialog.boundingBox();
  const footer = await page.locator(".search-bottom").boundingBox();
  expect(bounds).toBeTruthy();
  expect(footer).toBeTruthy();
  expect((footer?.y ?? 0) + (footer?.height ?? 0)).toBeLessThanOrEqual(
    (bounds?.y ?? 0) + (bounds?.height ?? 0),
  );
  await page.getByRole("button", { name: "Close search", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Search documentation", exact: true }),
  ).toBeFocused();
});
