import { expect, test } from "@playwright/test";

async function openMenuItem(page, name) {
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name, exact: true })
    .click();
}
async function visitRack(page, name) {
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await page.getByText("Jump to a display bay", { exact: true }).click();
  await page.getByRole("button", { name, exact: true }).click();
}
async function selectDesign(page, name) {
  await openMenuItem(page, "Design archive");
  await page.getByRole("dialog").getByRole("button", { name }).click();
}

test("GPU vault loads a live scene and switches between distinct real designs", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/pc");
  await expect(page).toHaveTitle(/PC Museum/, { timeout: 15_000 });
  await expect(
    page.getByRole("heading", {
      name: /Aim\. Explore\./,
    }),
  ).toBeVisible();
  await expect(page.locator(".gpu-scene")).toHaveAttribute(
    "data-scene-status",
    /ready|fallback/,
  );
  await expect(page.locator(".gpu-floor-map")).toHaveCount(0);
  await expect(page.locator(".gpu-walk-controls")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Model index 47", exact: true }),
  ).toHaveCount(0);
  await page.screenshot({ path: "test-results/pc-museum-desktop.png" });
  await openMenuItem(page, "Design archive");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /ASUS.*ROG Astral/ })
    .click();
  await expect(page.locator(".gpu-inspector h1")).toHaveText("RTX 5090");
  await expect(page.locator(".gpu-design-note")).toContainText("fourth fan");
  await expect(page.locator(".gpu-dimensions")).toContainText("357.6");
  await selectDesign(page, /Sapphire.*NITRO\+\ OC/i);
  await expect(page.locator(".gpu-inspector h1")).toHaveText("RX 9070 XT");
  await expect(page.getByRole("group", { name: "Card view" })).toHaveCount(0);
  await expect(page.locator(".gpu-photo-view")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "02 Inside", exact: true }),
  ).toHaveCount(0);
  await page
    .getByText("Specifications & card details", { exact: true })
    .click();
  await expect(page.locator(".gpu-specs")).toBeVisible();
  await page.screenshot({ path: "test-results/pc-museum-inspection.png" });
  expect(errors).toEqual([]);
});

test("model index filters generations and memory variants, then compares actual specs", async ({
  page,
}) => {
  await page.goto("/pc/");
  await openMenuItem(page, "Model index 47");
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "NVIDIA", exact: true }).click();
  await page
    .getByLabel("GPU generation", { exact: true })
    .selectOption("RTX 50");
  await expect(page.locator(".gpu-model-list article")).toHaveCount(8);
  await page.getByLabel("Search GPU models", { exact: true }).fill("5060 Ti");
  await expect(page.locator(".gpu-model-list article")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Compare RTX 5060 Ti 16GB", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Compare RTX 5060 Ti 8GB", exact: true })
    .click();
  await page
    .getByLabel("Search GPU models", { exact: true })
    .fill("no-card-matches");
  await expect(page.locator(".gpu-no-results")).toBeVisible();
  await page.getByRole("button", { name: "Close panel", exact: true }).click();
  await openMenuItem(page, "Open GPU comparison");
  await expect(page.locator(".gpu-comparison article")).toHaveCount(2);
  await expect(page.locator(".gpu-comparison")).toContainText("16GB GDDR7");
  await expect(page.locator(".gpu-comparison")).toContainText("8GB GDDR7");
  await expect(page.locator(".gpu-comparison")).toContainText("180W");
  await page.getByRole("button", { name: "Close panel", exact: true }).click();
  await openMenuItem(page, "Model index 47");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Intel", exact: true })
    .click();
  await page
    .getByLabel("GPU generation", { exact: true })
    .selectOption("Arc B");
  await expect(page.locator(".gpu-model-list article")).toHaveCount(2);
  await page.getByRole("button", { name: /Arc B570.*Battlemage/ }).click();
  await expect(page.locator(".gpu-inspector h1")).toHaveText("Arc B570");
  await expect(page.locator(".gpu-specs")).toContainText("150");
});

test("museum supports walking, turning, named racks and direct exhibit selection", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/pc");
  await expect(page.locator(".gpu-scene")).toHaveAttribute(
    "data-scene-status",
    "ready",
    { timeout: 30_000 },
  );
  await page
    .getByRole("button", { name: "Show movement controls", exact: true })
    .click();
  await expect(page.locator(".museum-entry")).toHaveCount(0);
  await page.screenshot({ path: "test-results/pc-museum-cleared.png" });
  await page
    .getByRole("button", { name: "Walk forward", exact: true })
    .click({ delay: 300 });
  await expect
    .poll(async () =>
      Number(await page.locator(".gpu-page").getAttribute("data-player-z")),
    )
    .toBeLessThan(16);
  await page.keyboard.down("w");
  await expect
    .poll(async () =>
      Number(await page.locator(".gpu-page").getAttribute("data-player-z")),
    )
    .toBeLessThan(15);
  await page.keyboard.up("w");
  await page.keyboard.down("d");
  await expect
    .poll(async () =>
      Number(await page.locator(".gpu-page").getAttribute("data-player-x")),
    )
    .toBeGreaterThan(0.5);
  await page.keyboard.up("d");
  await page.keyboard.down("ArrowRight");
  await expect
    .poll(async () => {
      return Number(
        await page.locator(".gpu-page").getAttribute("data-player-yaw"),
      );
    })
    .toBeGreaterThan(0.2);
  await page.keyboard.up("ArrowRight");
  await visitRack(page, "Visit NVIDIA RTX 50 rack");
  await expect(page.locator(".gpu-page")).toHaveAttribute(
    "data-player-x",
    "-2.60",
  );
  await expect(page.locator(".gpu-page")).toHaveAttribute(
    "data-player-z",
    "3.00",
  );
  await expect(page.locator(".museum-entry")).toHaveCount(0);
  await page.screenshot({ path: "test-results/pc-museum-nameplates.png" });
  // The card at the centre of this human-height rack view is the labelled 5060 Ti.
  await expect
    .poll(() => page.locator(".gpu-page").getAttribute("data-player-yaw"))
    .toBe("-1.57");
  await page
    .locator(".gpu-scene canvas")
    .click({ position: { x: 640, y: 355 } });
  await expect(page.locator(".gpu-inspector h1")).toHaveText(
    "RTX 5060 Ti 16GB",
  );
  await page
    .getByRole("button", { name: "Back to museum", exact: true })
    .click();
  await expect(page.locator(".gpu-page")).toHaveAttribute(
    "data-player-z",
    "3.00",
  );
  await openMenuItem(page, "GPU basics");
  await expect(page.getByRole("dialog")).toContainText("board partner");
  await expect(page.getByRole("dialog")).toContainText("2.78ms");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("mobile supports still mode, browsing and the design archive without overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/pc");
  await expect(page.locator(".gpu-floor-map")).toHaveCount(0);
  await expect(page.locator(".gpu-walk-controls")).toHaveCount(0);
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await expect(page.getByLabel("Still mode", { exact: true })).toBeChecked();
  await page.getByRole("button", { name: "Close panel", exact: true }).click();
  await page.screenshot({ path: "test-results/pc-museum-mobile.png" });
  await visitRack(page, "Visit AMD RX 9000 rack");
  await expect(page.locator(".gpu-page")).toHaveAttribute(
    "data-player-x",
    "2.60",
  );
  await openMenuItem(page, "Model index 47");
  await page
    .getByLabel("Search GPU models", { exact: true })
    .fill("RX 9070 XT");
  await page.locator(".gpu-model-pick").click();
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /Auto rotate/ }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Close panel", exact: true }).click();
  await selectDesign(page, /Sapphire.*PURE/i);
  await expect(page.locator(".gpu-inspector h1")).toHaveText("RX 9070 XT");
  await expect(page.locator(".gpu-photo-view")).toHaveCount(0);
  await page.locator(".gpu-design-name").click();
  await expect(page.locator(".gpu-design-grid>button")).toHaveCount(6);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /ASROCK.*Steel Legend/ })
    .click();
  await expect(page.locator(".gpu-inspector h1")).toHaveText("Arc B580");
  await page.screenshot({
    path: "test-results/pc-museum-mobile-inspector.png",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("catalog and model explanations remain available without WebGL", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return String(type).startsWith("webgl")
        ? null
        : original.call(this, type, ...args);
    };
  });
  await page.goto("/pc");
  await expect(page.locator(".gpu-scene")).toHaveAttribute(
    "data-scene-status",
    "fallback",
  );
  await page
    .getByRole("button", { name: "Browse GPU models", exact: true })
    .click();
  await page
    .getByLabel("Search GPU models", { exact: true })
    .fill("RX 9070 XT");
  await page.locator(".gpu-model-pick").click();
  await expect(
    page.getByRole("region", { name: "Museum guide", exact: true }),
  ).toContainText("RDNA 4");
});

test("museum guide explains the selected GPU and answers contextual follow-ups", async ({
  page,
}) => {
  await page.goto("/pc");
  await openMenuItem(page, "Model index 47");
  await page
    .getByLabel("Search GPU models", { exact: true })
    .fill("RTX 5060 Ti 16GB");
  await page.locator(".gpu-model-pick").click();
  const guide = page.getByRole("region", { name: "Museum guide", exact: true });
  await expect(guide).toContainText("16GB");
  await expect(guide).toContainText("NVIDIA");
  await expect(guide).toContainText("Blackwell");
  await page
    .getByRole("button", { name: "Ask about this GPU", exact: false })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("heading", { name: "Meet RTX 5060 Ti 16GB." }),
  ).toBeVisible();
  await dialog
    .getByRole("button", { name: "Will it help my CS2 FPS? ↗", exact: true })
    .click();
  await expect(page.locator(".gpu-guide-exchange")).toContainText(
    "cannot guarantee 400 FPS",
  );
  await page
    .getByLabel("Ask the museum guide", { exact: true })
    .fill("What power supply and case fit do I need?");
  await page
    .getByRole("button", { name: "Ask guide question", exact: true })
    .click();
  await expect(page.locator(".gpu-guide-exchange")).toContainText("180W");
  await page
    .getByLabel("Ask the museum guide", { exact: true })
    .fill("How much does it cost in India?");
  await page
    .getByRole("button", { name: "Ask guide question", exact: true })
    .click();
  await expect(page.locator(".gpu-guide-exchange")).toContainText(
    "don’t have live Indian prices",
  );
  await page.getByRole("button", { name: "Close panel", exact: true }).click();
  await selectDesign(page, /ASRock.*Steel Legend/i);
  await expect(guide).toContainText("Intel");
  await expect(guide).toContainText("12GB");
  await expect(guide).toContainText("ASRock");
  await page.screenshot({ path: "test-results/pc-museum-guide.png" });
});

test("mouse look and keyboard movement follow their stated directions, with no tour UI", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/pc");
  await expect(page.locator(".gpu-scene")).toHaveAttribute(
    "data-scene-status",
    "ready",
    { timeout: 30_000 },
  );
  await expect(page.getByRole("button", { name: /Take.*tour/i })).toHaveCount(
    0,
  );
  await page
    .getByRole("button", { name: "Show movement controls", exact: true })
    .click();
  const museum = page.locator(".gpu-page");
  const canvas = page.locator(".gpu-scene canvas");
  await canvas.focus();
  await page.keyboard.down("a");
  await expect
    .poll(async () => Number(await museum.getAttribute("data-player-x")))
    .toBeLessThan(-0.4);
  await page.keyboard.up("a");
  await page.keyboard.down("d");
  await expect
    .poll(async () => Number(await museum.getAttribute("data-player-x")))
    .toBeGreaterThan(0.4);
  await page.keyboard.up("d");
  await page.mouse.move(640, 360);
  await page.mouse.down();
  await page.mouse.move(740, 360, { steps: 8 });
  await page.mouse.up();
  await expect
    .poll(async () => Number(await museum.getAttribute("data-player-yaw")))
    .toBeGreaterThan(0.5);
  await page.mouse.move(740, 360);
  await page.mouse.down();
  await page.mouse.move(540, 360, { steps: 8 });
  await page.mouse.up();
  await expect
    .poll(async () => Number(await museum.getAttribute("data-player-yaw")))
    .toBeLessThan(-0.5);
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await expect(
    page.getByRole("dialog").getByRole("button", { name: /tour/i }),
  ).toHaveCount(0);
});

test("first-person mode aims from the crosshair, inspects with E and releases mouse for panels", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/pc");
  await expect(page.locator(".gpu-scene")).toHaveAttribute(
    "data-scene-status",
    "ready",
    { timeout: 30_000 },
  );
  await page.getByRole("button", { name: "Enter museum", exact: true }).click();
  await expect(page.locator(".gpu-page")).toHaveAttribute(
    "data-first-person",
    "true",
  );
  await expect(page.locator(".museum-crosshair")).toBeVisible();
  await expect
    .poll(async () => {
      const museum = page.locator(".gpu-page");
      return (
        (await museum.getAttribute("data-pointer-locked")) === "true" ||
        (await museum.getAttribute("data-capture-unavailable")) === "true"
      );
    })
    .toBe(true);
  const captured =
    (await page.locator(".gpu-page").getAttribute("data-pointer-locked")) ===
    "true";
  if (captured) {
    await page.mouse.move(700, 360);
    await expect
      .poll(async () =>
        Number(await page.locator(".gpu-page").getAttribute("data-player-yaw")),
      )
      .not.toBe(0);
    await page.keyboard.press("Escape");
    await expect(page.locator(".gpu-page")).toHaveAttribute(
      "data-pointer-locked",
      "false",
    );
  } else {
    await expect(page.locator(".gpu-quiet-hint")).toContainText("Drag to look");
  }
  await visitRack(page, "Visit NVIDIA RTX 50 rack");
  await expect(page.locator(".gpu-page")).toHaveAttribute(
    "data-player-yaw",
    "-1.57",
  );
  await expect(page.locator(".gpu-exhibit-hint strong")).toHaveText(
    "RTX 5060 Ti 16GB",
  );
  await page.locator(".gpu-scene canvas").focus();
  await page.keyboard.press("e");
  await expect(page.locator(".gpu-inspector h1")).toHaveText(
    "RTX 5060 Ti 16GB",
  );
  await expect(page.locator(".gpu-page")).toHaveAttribute(
    "data-pointer-locked",
    "false",
  );
  await expect(page.locator(".museum-crosshair")).toHaveCount(0);
  await page.screenshot({
    path: "test-results/pc-museum-first-person-inspect.png",
  });
  await page
    .getByRole("button", { name: "Back to museum", exact: true })
    .click();
  await expect(page.locator(".gpu-exhibit-hint strong")).toHaveText(
    "RTX 5060 Ti 16GB",
  );
  const canvas = page.locator(".gpu-scene canvas");
  await canvas.click({ position: { x: 640, y: 360 } });
  if (captured) {
    await expect(page.locator(".gpu-page")).toHaveAttribute(
      "data-pointer-locked",
      "true",
    );
    await page.mouse.click(640, 360);
  }
  await expect(page.locator(".gpu-inspector h1")).toHaveText(
    "RTX 5060 Ti 16GB",
  );
  await expect(page.locator(".gpu-page")).toHaveAttribute(
    "data-pointer-locked",
    "false",
  );
});

test("look sensitivity changes actual mouse movement, persists and resets", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/pc");
  await expect(page.locator(".gpu-scene")).toHaveAttribute(
    "data-scene-status",
    "ready",
    { timeout: 30_000 },
  );
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  const slider = page.getByRole("slider", {
    name: "Look sensitivity",
    exact: true,
  });
  await expect(slider).toHaveValue("1");
  await slider.press("Home");
  for (let i = 0; i < 5; i++) await slider.press("ArrowRight");
  await expect(slider).toHaveValue("0.5");
  await page.getByRole("button", { name: "Close panel", exact: true }).click();
  await page.mouse.move(640, 360);
  await page.mouse.down();
  await page.mouse.move(740, 360, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator(".gpu-page")).toHaveAttribute(
    "data-player-yaw",
    "0.30",
  );
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await slider.press("End");
  await expect(slider).toHaveValue("2");
  await page.getByRole("button", { name: "Close panel", exact: true }).click();
  await page.mouse.move(640, 360);
  await page.mouse.down();
  await page.mouse.move(740, 360, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator(".gpu-page")).toHaveAttribute(
    "data-player-yaw",
    "1.50",
  );
  await page.reload();
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await expect(slider).toHaveValue("2");
  await page
    .getByRole("button", { name: "Reset look sensitivity", exact: true })
    .click();
  await expect(slider).toHaveValue("1");
  await page.screenshot({ path: "test-results/pc-museum-sensitivity.png" });
});
