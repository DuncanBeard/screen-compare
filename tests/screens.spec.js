// @ts-check
const { test, expect } = require("@playwright/test");

// Clear localStorage before each test to ensure clean state
test.beforeEach(async ({ page }) => {
  // First go to the screen-ppi tool page and clear all storage
  await page.goto("/utilities/screen-ppi/");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  // Reload to apply the cleared state
  await page.reload();
  // Wait for the app to be fully loaded
  await page.waitForSelector("#add-screen");
});

test.describe("Screen Card Inputs", () => {
  test("should update screen name", async ({ page }) => {
    await page.locator("#add-screen").click();
    const card = page.locator(".screen-card").first();
    const nameInput = card.locator(".screen-name");

    await nameInput.fill("My Test Monitor");
    await nameInput.blur();

    await expect(nameInput).toHaveValue("My Test Monitor");
  });

  test("should update PPI when changing screen size", async ({ page }) => {
    await page.locator("#add-screen").click();
    const card = page.locator(".screen-card").first();
    const sizeInput = card.locator(".screen-size");
    const ppiValue = card.locator(".result-value").first();

    const initialPPI = await ppiValue.textContent();

    await sizeInput.fill("32");
    await sizeInput.blur();

    const newPPI = await ppiValue.textContent();
    expect(newPPI).not.toBe(initialPPI);
  });

  test("should update PPI when changing resolution", async ({ page }) => {
    await page.locator("#add-screen").click();
    const card = page.locator(".screen-card").first();
    const widthInput = card.locator(".screen-width");
    const heightInput = card.locator(".screen-height");
    const ppiValue = card.locator(".result-value").first();

    const initialPPI = await ppiValue.textContent();

    // Change both width and height significantly to ensure PPI changes
    await widthInput.fill("1920");
    await heightInput.fill("1080");
    await heightInput.blur();

    const newPPI = await ppiValue.textContent();
    expect(newPPI).not.toBe(initialPPI);
  });

  test("should update effective resolution when changing scale", async ({ page }) => {
    await page.locator("#add-screen").click();
    const card = page.locator(".screen-card").first();
    const scaleSelect = card.locator(".screen-scale");

    // Find effective resolution result - get the resolution value (second one with dimensions)
    const effectiveResValue = card
      .locator(".result-item")
      .filter({ hasText: "Effective" })
      .locator(".result-value")
      .last();
    const initialValue = await effectiveResValue.textContent();

    await scaleSelect.selectOption("200");

    const newValue = await effectiveResValue.textContent();
    expect(newValue).not.toBe(initialValue);
  });
});

test.describe("Multiple Screens", () => {
  test("should handle multiple screen cards", async ({ page }) => {
    const initialCount = await page.locator(".screen-card").count();
    const initialRects = await page.locator("#size-canvas .screen-rect").count();

    await page.locator("#add-screen").click();
    await page.locator("#add-screen").click();
    await page.locator("#add-screen").click();

    await expect(page.locator(".screen-card")).toHaveCount(initialCount + 3);
    await expect(page.locator("#size-canvas .screen-rect")).toHaveCount(initialRects + 3);
  });

  test("should show legend for multiple screens", async ({ page }) => {
    const initialLegend = await page.locator("#size-legend .legend-item").count();

    await page.locator("#add-screen").click();
    await page.locator("#add-screen").click();

    const legendItems = page.locator("#size-legend .legend-item");
    await expect(legendItems).toHaveCount(initialLegend + 2);
  });

  test("should independently remove individual screens", async ({ page }) => {
    // Clear any existing screens first
    const existingCount = await page.locator(".screen-card").count();
    for (let i = 0; i < existingCount; i++) {
      await page.locator(".screen-card").first().locator(".btn-card-action-delete").click();
    }

    await page.locator("#add-screen").click();
    await page.locator("#add-screen").click();

    await expect(page.locator(".screen-card")).toHaveCount(2);

    // Rename first screen for identification
    const firstCard = page.locator(".screen-card").first();
    await firstCard.locator(".screen-name").fill("First Screen");

    // Remove the first screen
    await firstCard.locator(".btn-card-action-delete").click();

    await expect(page.locator(".screen-card")).toHaveCount(1);

    // The remaining card should not be "First Screen"
    const remainingName = await page.locator(".screen-card").first().locator(".screen-name").inputValue();
    expect(remainingName).not.toBe("First Screen");
  });
});

test.describe("Size Comparison Visualization", () => {
  test("should display screen rect with correct label", async ({ page }) => {
    await page.locator("#add-screen").click();

    // Update the name on the first (and only) card
    const card = page.locator(".screen-card").first();
    await card.locator(".screen-name").fill("Test Monitor");
    await card.locator(".screen-name").blur();

    // Wait for the size comparison to update
    await page.waitForTimeout(100);

    const label = page.locator("#size-canvas .screen-rect-label").first();
    await expect(label).toHaveText("Test Monitor");
  });

  test("should update size comparison when zoom changes", async ({ page }) => {
    await page.locator("#add-screen").click();

    const zoomSlider = page.locator("#size-zoom");
    const zoomLabel = page.locator("#zoom-label");

    // Change zoom using evaluate to properly trigger input event
    await zoomSlider.evaluate((el) => {
      el.value = "20";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });

    await expect(zoomLabel).toHaveText("20 px/inch");
  });
});

test.describe("Inline Label Editing", () => {
  test("should allow editing screen name by clicking label in layout", async ({ page }) => {
    await page.locator("#add-screen").click();

    const label = page.locator("#size-canvas .screen-rect-label").first();
    await label.click();

    // Should show input field
    const input = page.locator("#size-canvas .screen-rect-label-input");
    await expect(input).toBeVisible();
  });

  test("should save new name when pressing Enter", async ({ page }) => {
    await page.locator("#add-screen").click();

    const label = page.locator("#size-canvas .screen-rect-label").first();
    await label.click();

    const input = page.locator("#size-canvas .screen-rect-label-input");
    await input.fill("Renamed Monitor");
    await input.press("Enter");

    // Check that the card's name input was updated
    await expect(page.locator(".screen-card").first().locator(".screen-name")).toHaveValue("Renamed Monitor");
  });
});
