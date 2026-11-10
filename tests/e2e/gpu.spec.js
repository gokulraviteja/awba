import { expect, test } from "@playwright/test";

test("GPU vault loads a live scene and switches between distinct real designs", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/pc");
  await expect(page).toHaveTitle(/PC Museum/, { timeout: 15_000 });
  await expect(
    page.getByRole("heading", { name: "Come in. Look around." }),
  ).toBeVisible();
  await expect(page.locator(".gpu-scene")).toHaveAttribute(
    "data-scene-status",
    /ready|fallback/,
  );
  await page.screenshot({ path: "test-results/pc-museum-desktop.png" });
  await page
    .getByRole("button", { name: "Design archive", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /ASUS.*ROG Astral/ })
    .click();
  await expect(page.locator(".gpu-inspector h1")).toHaveText("RTX 5090");
  await expect(page.locator(".gpu-design-note")).toContainText("fourth fan");
  await expect(page.locator(".gpu-dimensions")).toContainText("357.6");
  await page
    .getByRole("button", { name: "Inspect Sapphire NITRO+ OC", exact: true })
    .click();
  await expect(page.locator(".gpu-inspector h1")).toHaveText("RX 9070 XT");
  await page
    .getByRole("button", { name: "03 Real photos", exact: true })
    .click();
  const photo = page.locator(".gpu-photo-view>img");
  await expect(photo).toBeVisible();
  await expect(photo).toHaveAttribute("src", "/gpu/nitro-front.jpg");
  await expect
    .poll(() => photo.evaluate((img) => img.complete && img.naturalWidth > 0))
    .toBe(true);
  await page
    .getByRole("button", { name: "Next product photo", exact: true })
    .click();
  await expect(photo).toHaveAttribute("src", "/gpu/nitro-back.jpg");
  await page.getByRole("button", { name: "02 Inside", exact: true }).click();
  await page.getByRole("button", { name: "Explore VRAM", exact: true }).click();
  await expect(page.locator(".gpu-anatomy-copy h2")).toHaveText("VRAM");
  await expect(page.locator(".gpu-anatomy-copy")).toContainText(
    "16GB does not automatically",
  );
  expect(errors).toEqual([]);
});

test("model index filters generations and memory variants, then compares actual specs", async ({
  page,
}) => {
  await page.goto("/pc/");
  await page
    .getByRole("button", { name: "Model index 47", exact: true })
    .click();
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
  await page
    .getByRole("button", { name: "Open GPU comparison", exact: true })
    .click();
  await expect(page.locator(".gpu-comparison article")).toHaveCount(2);
  await expect(page.locator(".gpu-comparison")).toContainText("16GB GDDR7");
  await expect(page.locator(".gpu-comparison")).toContainText("8GB GDDR7");
  await expect(page.locator(".gpu-comparison")).toContainText("180W");
  await page.getByRole("button", { name: "Close panel", exact: true }).click();
  await page
    .getByRole("button", { name: "Model index 47", exact: true })
    .click();
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
  );
  await page
    .getByRole("button", { name: "Start walking", exact: true })
    .click();
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
  await page
    .getByRole("button", { name: "Visit NVIDIA RTX 50 rack", exact: true })
    .click();
  await expect(page.locator(".gpu-page")).toHaveAttribute(
    "data-player-x",
    "-2.60",
  );
  await expect(page.locator(".gpu-page")).toHaveAttribute(
    "data-player-z",
    "3.00",
  );
  await expect(page.locator(".gpu-museum-title h1")).toHaveText(
    "NVIDIA / RTX 50",
  );
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
  await page.getByRole("button", { name: "GPU basics", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("board partner");
  await expect(page.getByRole("dialog")).toContainText("2.78ms");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("mobile supports still mode, browsing, photos and the design archive without overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/pc");
  await expect(page.getByLabel("Still mode", { exact: true })).toBeChecked();
  await page.screenshot({ path: "test-results/pc-museum-mobile.png" });
  await page
    .getByRole("button", { name: "Visit AMD RX 9000 rack", exact: true })
    .click();
  await expect(page.locator(".gpu-page")).toHaveAttribute(
    "data-player-x",
    "2.60",
  );
  await page
    .getByRole("button", { name: "Model index 47", exact: true })
    .click();
  await page
    .getByLabel("Search GPU models", { exact: true })
    .fill("RX 9070 XT");
  await page.locator(".gpu-model-pick").click();
  await expect(
    page.getByRole("button", { name: /Auto rotate/ }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Inspect Sapphire PURE", exact: true })
    .click();
  await expect(page.locator(".gpu-inspector h1")).toHaveText("RX 9070 XT");
  await page
    .getByRole("button", { name: "03 Real photos", exact: true })
    .click();
  await expect(page.locator(".gpu-photo-view>img")).toHaveAttribute(
    "src",
    "/gpu/pure-front.jpg",
  );
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

test("catalog and official photos remain available when WebGL is unavailable", async ({
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
    .getByRole("button", { name: "Explore product photos", exact: true })
    .click();
  await expect(page.locator(".gpu-photo-view>img")).toHaveAttribute(
    "src",
    "/gpu/fe-front.jpg",
  );
  await page
    .getByRole("button", { name: "Model index 47", exact: true })
    .click();
  await page.getByLabel("Search GPU models", { exact: true }).fill("RX 9070");
  await expect(page.locator(".gpu-model-list article")).toHaveCount(2);
});

test("museum guide explains the selected GPU and answers contextual follow-ups", async ({
  page,
}) => {
  await page.goto("/pc");
  await page
    .getByRole("button", { name: "Model index 47", exact: true })
    .click();
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
  await page
    .getByRole("button", {
      name: "Inspect ASRock Steel Legend OC",
      exact: true,
    })
    .click();
  await expect(guide).toContainText("Intel");
  await expect(guide).toContainText("12GB");
  await expect(guide).toContainText("ASRock");
  await page.screenshot({ path: "test-results/pc-museum-guide.png" });
});
