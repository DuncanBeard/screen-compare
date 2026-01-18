// @ts-check
const { test, expect } = require("@playwright/test");

// Clear localStorage before each test to ensure clean state
test.beforeEach(async ({ page }) => {
  // First go to the page and clear all storage
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  // Reload to apply the cleared state
  await page.reload();
  // Wait for the app to be fully loaded
  await page.waitForSelector("#add-screen");
});

test.describe("Page Load", () => {
  test("should load the page with correct title", async ({ page }) => {
    await expect(page).toHaveTitle("Screen PPI Comparison Tool");
  });

  test("should display the header", async ({ page }) => {
    await expect(page.locator("h1")).toHaveText("Screen PPI Comparison");
  });

  test("should have main control buttons visible", async ({ page }) => {
    await expect(page.locator("#add-screen")).toBeVisible();
    await expect(page.locator("#save-config")).toBeVisible();
    await expect(page.locator("#share-config")).toBeVisible();
    await expect(page.locator("#clear-all")).toBeVisible();
  });

  test("should have the preset dropdown populated", async ({ page }) => {
    const presetSelect = page.locator("#preset-select");
    await expect(presetSelect).toBeVisible();

    // Should have more than just the placeholder option
    const optionCount = await presetSelect.locator("option").count();
    expect(optionCount).toBeGreaterThan(1);
  });

  test("should have size comparison section", async ({ page }) => {
    await expect(page.locator("#size-comparison")).toBeVisible();
    await expect(page.locator("#comparison-title")).toHaveText("Physical Size Comparison");
  });
});

test.describe("Theme Toggle", () => {
  test("should toggle dark mode", async ({ page }) => {
    const html = page.locator("html");
    const themeToggle = page.locator("#theme-toggle");

    // Initially should not have dark theme (or might have it from storage)
    const initialTheme = await html.getAttribute("data-theme");

    await themeToggle.click();

    // Theme should change after click
    const newTheme = await html.getAttribute("data-theme");
    expect(newTheme).not.toBe(initialTheme);
  });
});

test.describe("Add Screen", () => {
  test("should add a new screen card when clicking Add Screen", async ({ page }) => {
    // Initially no screen cards
    const initialCards = await page.locator(".screen-card").count();

    await page.locator("#add-screen").click();

    // Should have one more card
    await expect(page.locator(".screen-card")).toHaveCount(initialCards + 1);
  });

  test("should display screen card with input fields", async ({ page }) => {
    await page.locator("#add-screen").click();

    const card = page.locator(".screen-card").first();
    await expect(card.locator(".screen-name")).toBeVisible();
    await expect(card.locator(".screen-size")).toBeVisible();
    await expect(card.locator(".screen-width")).toBeVisible();
    await expect(card.locator(".screen-height")).toBeVisible();
    await expect(card.locator(".screen-scale")).toBeVisible();
  });

  test("should calculate and display PPI for added screen", async ({ page }) => {
    await page.locator("#add-screen").click();

    const card = page.locator(".screen-card").first();
    const ppiValue = card.locator(".result-value").first();
    await expect(ppiValue).toBeVisible();

    // PPI should be a number
    const ppiText = await ppiValue.textContent();
    expect(parseFloat(ppiText || "0")).toBeGreaterThan(0);
  });

  test("should add screen to size comparison visualization", async ({ page }) => {
    const initialRects = await page.locator("#size-canvas .screen-rect").count();
    await page.locator("#add-screen").click();

    // Should have one more screen rectangle in the comparison canvas
    await expect(page.locator("#size-canvas .screen-rect")).toHaveCount(initialRects + 1);
  });
});

test.describe("Remove Screen", () => {
  test("should remove screen card when clicking remove button", async ({ page }) => {
    const initialCount = await page.locator(".screen-card").count();
    await page.locator("#add-screen").click();

    await expect(page.locator(".screen-card")).toHaveCount(initialCount + 1);

    await page.locator(".screen-card").first().locator(".btn-remove").click();

    await expect(page.locator(".screen-card")).toHaveCount(initialCount);
  });
});

test.describe("Load Preset", () => {
  test("should load a preset and create screen card", async ({ page }) => {
    const initialCount = await page.locator(".screen-card").count();
    const presetSelect = page.locator("#preset-select");

    // Get the first actual preset (not the placeholder)
    const options = presetSelect.locator("option");
    const optionCount = await options.count();

    if (optionCount > 1) {
      // Select the second option (first real preset)
      const firstPresetValue = await options.nth(1).getAttribute("value");
      await presetSelect.selectOption(firstPresetValue || "");

      // Should have at least one more screen card than initially
      const newCount = await page.locator(".screen-card").count();
      expect(newCount).toBeGreaterThan(initialCount);
    }
  });
});

test.describe("Clear All", () => {
  test("should remove all screens when clicking Clear All", async ({ page }) => {
    // Add multiple screens
    await page.locator("#add-screen").click();
    await page.locator("#add-screen").click();
    
    const countAfterAdding = await page.locator(".screen-card").count();
    expect(countAfterAdding).toBeGreaterThanOrEqual(2);

    // Handle the confirmation dialog
    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });

    // Click clear all
    await page.locator("#clear-all").click();

    // All screens should be removed
    await expect(page.locator(".screen-card")).toHaveCount(0);
  });
});

test.describe("Save Modal", () => {
  test("should open save modal when clicking Save", async ({ page }) => {
    await page.locator("#add-screen").click();

    await page.locator("#save-config").click();

    await expect(page.locator("#save-modal")).toHaveClass(/active/);
    await expect(page.locator("#config-name")).toBeVisible();
  });

  test("should close save modal when clicking Cancel", async ({ page }) => {
    await page.locator("#add-screen").click();
    await page.locator("#save-config").click();

    await expect(page.locator("#save-modal")).toHaveClass(/active/);

    await page.locator("#save-cancel").click();

    await expect(page.locator("#save-modal")).not.toHaveClass(/active/);
  });
});

test.describe("Share Modal", () => {
  test("should open share modal when clicking Share Link", async ({ page }) => {
    await page.locator("#add-screen").click();

    await page.locator("#share-config").click();

    await expect(page.locator("#share-modal")).toHaveClass(/active/);
    await expect(page.locator("#share-url")).toBeVisible();
  });

  test("should generate a share URL with screen data", async ({ page }) => {
    await page.locator("#add-screen").click();

    await page.locator("#share-config").click();

    const shareUrl = await page.locator("#share-url").inputValue();
    expect(shareUrl).toContain("?screens=");
  });
});

test.describe("Size Comparison Controls", () => {
  test("should have arrangement dropdown with options", async ({ page }) => {
    const arrangementSelect = page.locator("#arrangement-select");
    await expect(arrangementSelect).toBeVisible();

    const options = await arrangementSelect.locator("option").allTextContents();
    expect(options).toContain("Free Arrange");
    expect(options).toContain("Side by Side");
  });

  test("should have zoom slider", async ({ page }) => {
    await expect(page.locator("#size-zoom")).toBeVisible();
    await expect(page.locator("#zoom-label")).toBeVisible();
  });

  test("should toggle between Physical Size and Effective Resolution modes", async ({ page }) => {
    const physicalBtn = page.locator("#mode-physical");
    const digitalBtn = page.locator("#mode-digital");

    await expect(physicalBtn).toHaveClass(/active/);
    await expect(digitalBtn).not.toHaveClass(/active/);

    await digitalBtn.click();

    await expect(digitalBtn).toHaveClass(/active/);
    await expect(physicalBtn).not.toHaveClass(/active/);
    await expect(page.locator("#comparison-title")).toHaveText("Effective Resolution Comparison");
  });
});
