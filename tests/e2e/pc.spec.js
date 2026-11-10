import { expect, test } from "@playwright/test";

// These checks validate controls and content, not animation timing.
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("PC guide loads directly and exposes every component and its types", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/pc/guide");
  await expect(page).toHaveTitle(/Inside the PC/);
  await expect(
    page.getByRole("heading", { name: "Inside the PC." }),
  ).toBeVisible();
  await expect(page.locator(".pc-three-host")).toHaveAttribute(
    "data-scene-status",
    /ready|fallback/,
  );
  for (const name of [
    "Processor",
    "Motherboard",
    "Memory",
    "Graphics card",
    "Storage",
    "Power supply",
    "Cooling",
    "Case",
  ]) {
    await page
      .getByRole("button", { name: `Explore ${name}`, exact: true })
      .first()
      .click();
    await expect(page.locator(".pc-inspector h2")).toHaveText(name);
  }
  await page
    .getByRole("button", { name: "Types & generations", exact: true })
    .click();
  await expect(page.locator(".pc-variant")).toHaveCount(4);
  await page
    .getByRole("button", { name: "Explore Graphics card", exact: true })
    .first()
    .click();
  await expect(page.locator(".pc-inspector")).toContainText(
    "Usually soldered to the motherboard",
  );
  await page.getByRole("button", { name: "Toggle exploded view" }).click();
  await expect(page.locator(".pc-scene-top")).toContainText("EXPLODED VIEW");
  await page.getByRole("button", { name: /Follow the data/ }).click();
  await expect(page.locator(".pc-flow")).toBeVisible();
  expect(errors).toEqual([]);
});

test("assembly walkthrough reaches first boot and returns to the beginning", async ({
  page,
}) => {
  await page.goto("/pc/guide/");
  await page.getByRole("button", { name: /02Assemble/ }).click();
  await expect(
    page.getByRole("heading", { name: "Seat the processor", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Previous assembly step" }),
  ).toBeDisabled();
  for (let i = 0; i < 9; i++)
    await page
      .getByRole("button", { name: "Next step →", exact: true })
      .click();
  await expect(
    page.getByRole("heading", { name: "Set up and validate", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".pc-inspector h2")).toHaveText("Storage");
  await page
    .getByRole("button", { name: "Start again ↺", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Seat the processor", exact: true }),
  ).toBeVisible();
});

test("build checker catches socket, RAM, cooling and display failures independently", async ({
  page,
}) => {
  await page.goto("/pc/guide#build-check");
  await expect(
    page.getByRole("heading", { name: "A compatible starting point." }),
  ).toBeVisible();
  await page
    .getByLabel("Motherboard socket", { exact: true })
    .selectOption("AM4");
  await expect(page.locator(".pc-check-result")).toContainText(
    "CPU and socket do not match",
  );
  await expect(page.locator(".pc-check-result")).toContainText(
    "Memory generation mismatch",
  );
  await page.getByLabel("CPU platform", { exact: true }).selectOption("AM4");
  await page
    .getByLabel("Memory generation", { exact: true })
    .selectOption("DDR4");
  await expect(
    page.getByRole("heading", { name: "A compatible starting point." }),
  ).toBeVisible();
  await page
    .getByRole("switch", { name: "Dedicated graphics card", exact: true })
    .uncheck();
  await expect(page.locator(".pc-check-result")).toContainText(
    "Integrated graphics selected",
  );
  await page
    .getByRole("switch", { name: "CPU has integrated graphics", exact: true })
    .uncheck();
  await expect(page.locator(".pc-check-result")).toContainText(
    "No graphics output",
  );
  await page
    .getByRole("switch", { name: "Compatible CPU cooler", exact: true })
    .uncheck();
  await expect(page.locator(".pc-check-result")).toContainText(
    "CPU cooling is missing",
  );
  await page
    .getByRole("switch", { name: "Bootable storage", exact: true })
    .uncheck();
  await expect(page.locator(".pc-check-result")).toContainText(
    "Firmware only: no local OS drive",
  );
});

test("frame lab calculates intervals and resolutions without predicting FPS", async ({
  page,
}) => {
  await page.goto("/pc/guide#performance");
  await expect(page.locator(".pc-time-bars")).toContainText("2.78 ms");
  await expect(page.locator(".pc-time-bars")).toContainText("2.50 ms");
  await page.getByRole("button", { name: "144Hz", exact: true }).click();
  await expect(page.locator(".pc-time-bars")).toContainText("6.94 ms");
  await page.locator("#pc-fps").fill("120");
  await expect(page.locator(".pc-time-bars")).toContainText("8.33 ms");
  await expect(page.locator(".pc-frame-verdict")).toContainText(
    "display can refresh faster",
  );
  await page
    .getByLabel("Pixels per frame", { exact: true })
    .selectOption("2560×1440");
  await expect(page.locator(".pc-resolution>strong")).toContainText("3.69");
});

test("quote calculator persists only user prices and knowledge check gives feedback", async ({
  page,
}) => {
  await page.goto("/pc/guide#build-check");
  await page.locator(".pc-price-details>summary").click();
  await page
    .locator(".pc-cost-grid")
    .getByLabel("Processor", { exact: true })
    .fill("20800");
  await page
    .locator(".pc-cost-grid")
    .getByLabel("Graphics card", { exact: true })
    .fill("42500");
  await expect(page.locator(".pc-cost-total>strong")).toHaveText("₹63,300");
  await page.reload();
  await page.locator(".pc-price-details>summary").click();
  await expect(page.locator(".pc-cost-total>strong")).toHaveText("₹63,300");
  await page.getByRole("button", { name: "Clear prices", exact: true }).click();
  await expect(page.locator(".pc-cost-total>strong")).toHaveText("₹0");
  await page
    .getByLabel("Search glossary", { exact: true })
    .fill("nonexistentterm");
  await expect(page.locator(".pc-empty")).toBeVisible();
  await page.getByLabel("Search glossary", { exact: true }).fill("PCIe");
  await expect(page.locator(".pc-glossary article")).toHaveCount(1);
  await page
    .getByRole("button", {
      name: /The display can refresh up to 360 times per second/,
    })
    .click();
  await expect(page.locator(".pc-quiz-feedback")).toContainText("Exactly.");
  await expect(page.locator(".pc-quiz-score strong")).toContainText("1 / 5");
  await page.getByRole("button", { name: "Reset knowledge check ↺" }).click();
  await expect(page.locator(".pc-quiz-feedback")).toHaveCount(0);
  await page.getByRole("button", { name: "Memory kit", exact: true }).click();
  await expect(page.locator(".pc-decoder")).toContainText(
    "32GB (2×16GB) DDR5-6000 CL30",
  );
});

test("mobile workbench and reduced motion remain usable without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/pc/guide");
  await expect(page.getByLabel("Reduce motion", { exact: true })).toBeChecked();
  await expect(page.getByRole("button", { name: /Rotate/ })).toBeDisabled();
  await page
    .getByRole("button", { name: "Explore Memory", exact: true })
    .first()
    .click();
  await expect(page.locator(".pc-inspector h2")).toHaveText("Memory");
  await page
    .getByRole("button", { name: "Types & generations", exact: true })
    .click();
  await expect(page.locator(".pc-inspector")).toContainText("DDR4");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: /02Assemble/ }).click();
  await page.getByRole("button", { name: "Next step →", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Install the memory", exact: true }),
  ).toBeVisible();
});

test("guide remains navigable if WebGL is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (String(type).startsWith("webgl")) return null;
      return original.call(this, type, ...args);
    };
  });
  await page.goto("/pc/guide");
  await expect(page.locator(".pc-three-host")).toHaveAttribute(
    "data-scene-status",
    "fallback",
  );
  await expect(page.locator(".pc-fallback")).toBeVisible();
  await page
    .locator(".pc-fallback")
    .getByRole("button", { name: "Explore Storage", exact: true })
    .click();
  await expect(page.locator(".pc-inspector h2")).toHaveText("Storage");
});
