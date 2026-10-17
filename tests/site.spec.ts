import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("home renders without browser errors or failed local assets", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (
      response.url().startsWith("http://127.0.0.1:3000") &&
      response.status() >= 400
    )
      errors.push(`${response.status()} ${response.url()}`);
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Small footprint.Serious database.",
  );
  await page.getByRole("tab", { name: "Flexible JSON" }).click();
  await expect(
    page.getByRole("columnheader", { name: "region" }),
  ).toBeVisible();
  await expect(page.getByRole("cell", { name: "eu-west" })).toBeVisible();
  await page.getByRole("tab", { name: "ACID transactions" }).click();
  await expect(
    page.getByRole("columnheader", { name: "balance" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("code tabs switch examples and support arrow-key navigation", async ({
  page,
}) => {
  await page.goto("/");
  const embedded = page.getByRole("tab", { name: "Embed in Go" });
  await embedded.focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "Run as a server" }),
  ).toBeFocused();
  await expect(
    page.getByRole("tabpanel", { name: "Run as a server" }),
  ).toContainText("COBALTDB_ADMIN_PASSWORD");
  await page.keyboard.press("Home");
  await expect(embedded).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByRole("tabpanel", { name: "Embed in Go" }),
  ).toContainText("engine.Open");
});

test("documentation search filters, handles empty results and navigates", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Search documentation", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const input = page.getByRole("textbox", { name: "Search documentation" });
  await expect(input).toBeFocused();
  await input.fill("qwerty-no-such-guide");
  await expect(dialog).toContainText("No results for");
  await input.fill("security");
  await dialog.getByRole("link", { name: /Production guide/ }).click();
  await expect(page).toHaveURL(/\/docs\/production\//);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Production guide",
  );
  await expect(dialog).not.toBeVisible();
});

test("search keyboard shortcut, Escape and focus restoration work", async ({
  page,
}) => {
  await page.goto("/");
  const trigger = page.getByRole("button", {
    name: "Search documentation",
    exact: true,
  });
  await trigger.focus();
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test("install command copies to the real browser clipboard", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await page.getByRole("button", { name: "Copy install command" }).click();
  await expect(
    page.getByRole("button", { name: "Copied", exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "go get github.com/cobaltdb/cobaltdb",
  );
});

test("clipboard rejection gives actionable feedback", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async () => {
          throw new Error("Clipboard denied");
        },
      },
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Copy install command" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Select and copy" }),
  ).toBeVisible();
});

test("FAQ disclosures expand and collapse", async ({ page }) => {
  await page.goto("/");
  const question = page
    .locator("summary")
    .filter({ hasText: "Is it a drop-in replacement" });
  await question.click();
  await expect(page.locator("details[open]")).toContainText("tested subset");
  await question.click();
  await expect(page.locator("details[open]")).toHaveCount(0);
});

test("responsive navigation reaches documentation", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  if (isMobile) {
    const menu = page.getByRole("button", { name: "Open menu" });
    await menu.click();
    await expect(
      page.getByRole("navigation", { name: "Mobile navigation" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toHaveAttribute("aria-expanded", "false");
    await menu.click();
    await page
      .getByRole("navigation", { name: "Mobile navigation" })
      .getByRole("link", { name: "Documentation" })
      .click();
    await expect(
      page.getByRole("button", { name: "Open menu" }),
    ).toHaveAttribute("aria-expanded", "false");
  } else {
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Documentation" })
      .click();
  }
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Getting started",
  );
});

test("all pages fit narrow and wide viewports, and local links resolve", async ({
  page,
  request,
}) => {
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
  const links = new Set<string>();
  for (const route of routes) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await page.evaluate(() => document.fonts.ready);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow, `Overflow at ${route}`).toBeLessThanOrEqual(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    for (const href of await page
      .locator('a[href^="/"]')
      .evaluateAll((nodes) => nodes.map((n) => n.getAttribute("href") ?? "/")))
      links.add(href);
  }
  for (const href of links) {
    const response = await request.get(href.split("#")[0] || "/");
    expect(response.status(), href).toBe(200);
  }
});

test("logo downloads are portable SVG and missing pages return 404", async ({
  page,
  request,
}) => {
  await page.goto("/brand/");
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("link", { name: "SVG" }).first().click();
  expect((await downloadEvent).suggestedFilename()).toBe("cobaltdb-logo.svg");
  const logo = await request.get("/logo.svg");
  const svg = await logo.text();
  expect(svg).toContain("<path");
  expect(svg).not.toContain("<text");
  const missing = await page.goto("/this-page-does-not-exist/");
  expect(missing?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "in the database",
  );
});

test("home fits phone, tablet and large desktop widths", async ({ page }) => {
  for (const width of [
    320, 360, 375, 680, 768, 1024, 1440, 1920, 2560, 3440, 3840,
  ]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
      `${width}px viewport`,
    ).toBeLessThanOrEqual(1);
  }
});

test("shared layout stays aligned and bounded at the requested viewports", async ({
  page,
}) => {
  test.setTimeout(90_000);
  for (const width of [375, 768, 1024, 1440, 1920, 2560]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of [
      "/",
      "/docs/",
      "/docs/getting-started/",
      "/docs/sql/",
      "/docs/architecture/",
      "/docs/server/",
      "/docs/production/",
      "/brand/",
    ]) {
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      const layout = await page.evaluate(() => {
        const header = document.querySelector(".header-inner");
        if (!header) throw new Error("Header is missing");
        const bounds = header.getBoundingClientRect();
        return {
          overflow: document.documentElement.scrollWidth - innerWidth,
          width: bounds.width,
          left: bounds.left,
          right: innerWidth - bounds.right,
          rootFont: parseFloat(
            getComputedStyle(document.documentElement).fontSize,
          ),
          containers: [...document.querySelectorAll(".container")].map((el) => {
            const rect = el.getBoundingClientRect();
            return {
              name: el.className,
              left: rect.left,
              right: rect.right,
              width: rect.width,
            };
          }),
        };
      });
      expect(layout.overflow, `${width}px ${route}`).toBeLessThanOrEqual(1);
      expect(Math.abs(layout.left - layout.right)).toBeLessThanOrEqual(1);
      expect(layout.rootFont).toBe(16);
      if (width >= 1920) {
        expect(layout.width).toBeGreaterThanOrEqual(1680);
        expect(layout.width).toBeLessThanOrEqual(1750);
      }
      if (width === 1440) expect(layout.width).toBeGreaterThanOrEqual(1300);
      for (const box of layout.containers) {
        expect(
          Math.abs(box.left - layout.left),
          `${width}px ${route}: ${box.name} left`,
        ).toBeLessThanOrEqual(1);
        expect(
          Math.abs(box.right - (width - layout.right)),
          `${width}px ${route}: ${box.name} right`,
        ).toBeLessThanOrEqual(1);
        expect(box.width).toBeLessThanOrEqual(width);
      }
    }
  }
});

test("wide compositions use columns while keeping prose readable", async ({
  page,
}) => {
  for (const width of [1440, 1920, 2560, 3840]) {
    await page.setViewportSize({ width, height: 1080 });
    await page.goto("/");
    const layout = await page.evaluate(() => {
      const bounds = (selector: string) => {
        const el = document.querySelector(selector);
        if (!el) throw new Error(`${selector} is missing`);
        const rect = el.getBoundingClientRect();
        return {
          x: rect.x,
          y: rect.y,
          right: rect.right,
          width: rect.width,
          font: parseFloat(getComputedStyle(el).fontSize),
        };
      };
      return {
        hero: bounds(".hero"),
        heading: bounds(".hero h1"),
        art: bounds(".database-art"),
        copy: bounds(".hero-detail"),
        feature: bounds(".feature-architecture"),
        card: bounds(".feature-card"),
        editor: bounds(".query-editor"),
        results: bounds(".query-results"),
        projects: getComputedStyle(
          document.querySelector(".studio-projects") as Element,
        ).gridTemplateColumns.split(" ").length,
      };
    });
    expect(layout.hero.width).toBeLessThanOrEqual(1750);
    expect(layout.heading.font).toBeLessThanOrEqual(88);
    expect(layout.heading.right).toBeLessThanOrEqual(layout.art.x + 1);
    expect(layout.copy.width).toBeLessThanOrEqual(620);
    expect(layout.copy.font).toBeGreaterThanOrEqual(15);
    expect(Math.abs(layout.feature.y - layout.card.y)).toBeLessThanOrEqual(1);
    expect(layout.projects).toBe(2);
    if (width >= 1920) {
      expect(Math.abs(layout.editor.y - layout.results.y)).toBeLessThanOrEqual(
        1,
      );
      expect(layout.results.x).toBeGreaterThan(layout.editor.x);
    }
    await page.goto("/docs/sql/");
    const prose = await page.locator(".docs-section p").evaluateAll((els) =>
      els.map((el) => ({
        width: el.getBoundingClientRect().width,
        font: parseFloat(getComputedStyle(el).fontSize),
      })),
    );
    expect(prose.length).toBeGreaterThan(0);
    for (const paragraph of prose)
      expect(paragraph.width / paragraph.font).toBeLessThanOrEqual(40);
    const article = await page.locator(".docs-article").boundingBox();
    expect(article?.width).toBeGreaterThan(900);
    await page.goto("/docs/");
    const cards = await page
      .getByRole("navigation", { name: "Documentation guides" })
      .getByRole("link")
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().y));
    expect(cards).toHaveLength(5);
    expect(Math.max(...cards) - Math.min(...cards)).toBeLessThanOrEqual(1);
  }
});

test("narrow phones have comfortable controls, readable copy and working navigation", async ({
  page,
}) => {
  for (const width of [320, 375, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    const search = page.getByRole("button", {
      name: "Search documentation",
      exact: true,
    });
    const menu = page.getByRole("button", { name: "Open menu" });
    for (const control of [
      search,
      menu,
      page.getByRole("button", { name: "Copy install command" }),
    ]) {
      const box = await control.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
    expect(
      await page
        .locator(".hero-detail")
        .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
    ).toBeGreaterThanOrEqual(13);
    if (width >= 375) {
      const buttonTops = await page
        .locator(".hero-buttons .button")
        .evaluateAll((buttons) =>
          buttons.map((button) => button.getBoundingClientRect().top),
        );
      expect(
        Math.max(...buttonTops) - Math.min(...buttonTops),
        `${width}px hero actions`,
      ).toBeLessThanOrEqual(1);
    }
    await menu.click();
    await page
      .getByRole("navigation", { name: "Mobile navigation" })
      .getByRole("link", { name: "Documentation" })
      .click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Getting started",
    );
  }
});

test("studio logo draws on first view and remains complete on return", async ({
  page,
}) => {
  await page.goto("/");
  const logo = page.locator(".studio-symbol");
  expect(
    await logo.evaluate((el) => el.getAnimations({ subtree: true }).length),
  ).toBe(0);
  await logo.scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      logo.evaluate((el) =>
        el
          .getAnimations({ subtree: true })
          .some((animation) => animation.playState === "running"),
      ),
    )
    .toBe(true);
  await logo.evaluate((el) => {
    for (const animation of el.getAnimations({ subtree: true }))
      animation.finish();
  });
  const offsets = () =>
    logo
      .locator("path")
      .evaluateAll((paths) =>
        paths.map((path) => getComputedStyle(path).strokeDashoffset),
      );
  expect(await offsets()).toEqual(["0px", "0px", "0px", "0px"]);
  await page
    .getByRole("heading", { name: /Small footprint/ })
    .scrollIntoViewIfNeeded();
  await logo.scrollIntoViewIfNeeded();
  expect(
    await logo.evaluate((el) =>
      el
        .getAnimations({ subtree: true })
        .every((animation) => animation.playState === "finished"),
    ),
  ).toBe(true);
  expect(await offsets()).toEqual(["0px", "0px", "0px", "0px"]);
});

test("reduced motion disables decorative animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(
    await page
      .locator(".art-core")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  expect(
    await page
      .locator(".art-packets")
      .evaluate((el) => getComputedStyle(el).display),
  ).toBe("none");
  const logo = page.locator(".studio-symbol");
  await logo.scrollIntoViewIfNeeded();
  expect(
    await logo.evaluate((el) => el.getAnimations({ subtree: true }).length),
  ).toBe(0);
  expect(
    await logo
      .locator("path")
      .evaluateAll((paths) =>
        paths.map((path) => getComputedStyle(path).strokeDashoffset),
      ),
  ).toEqual(["0px", "0px", "0px", "0px"]);
});

test("home, docs, brand and search pass WCAG AA automated checks", async ({
  page,
}) => {
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
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      results.violations,
      `Accessibility at ${route}: ${JSON.stringify(results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })))}`,
    ).toEqual([]);
  }
  await page
    .getByRole("button", { name: "Search documentation", exact: true })
    .click();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});
