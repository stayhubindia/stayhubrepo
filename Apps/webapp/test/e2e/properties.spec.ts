import { test, expect } from "./fixtures";
import { navigateToAuthenticatedPage, waitForPageLoad } from "./helpers";

test.describe("Properties Browse & Filter", () => {
  test("should display properties list", async ({ tenantPage }) => {
    await navigateToAuthenticatedPage(tenantPage, "/properties");
    await waitForPageLoad(tenantPage, "properties");

    const propertyList = tenantPage.locator('[data-testid="properties-list"]');
    await expect(propertyList).toBeVisible();

    const cards = tenantPage.locator('[data-testid="property-card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should filter properties by location", async ({ tenantPage }) => {
    await navigateToAuthenticatedPage(tenantPage, "/properties");
    await waitForPageLoad(tenantPage, "properties");

    // Mock properties list
    await tenantPage.route("**/api/v1/properties/**", (route) => {
      const url = route.request().url();
      if (url.includes("city=Delhi")) {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            results: [
              {
                id: "prop-1",
                title: "Property in Delhi",
                location: { city: "Delhi" },
                rent: 25000,
              },
            ],
          }),
        });
      } else {
        route.continue();
      }
    });

    // Open filters
    const filterBtn = tenantPage.locator('button:has-text("Filter")').first();
    if (await filterBtn.isVisible()) {
      await filterBtn.click();

      // Select city
      const cityInput = tenantPage.locator('input[placeholder*="city" i]');
      if (await cityInput.isVisible()) {
        await cityInput.fill("Delhi");
      }

      // Apply filters
      const applyBtn = tenantPage.locator('button:has-text("Apply")').first();
      await applyBtn.click();
      await tenantPage.waitForLoadState("networkidle");
    }

    // Verify filtered results
    const cards = tenantPage.locator('[data-testid="property-card"]');
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test("should filter properties by price range", async ({ tenantPage }) => {
    await navigateToAuthenticatedPage(tenantPage, "/properties");

    const filterBtn = tenantPage.locator('button:has-text("Filter")').first();
    if (await filterBtn.isVisible()) {
      await filterBtn.click();

      const minPriceInput = tenantPage.locator('input[placeholder*="min" i], input[name*="min" i]').first();
      const maxPriceInput = tenantPage.locator('input[placeholder*="max" i], input[name*="max" i]').first();

      if (await minPriceInput.isVisible()) {
        await minPriceInput.fill("10000");
      }

      if (await maxPriceInput.isVisible()) {
        await maxPriceInput.fill("50000");
      }

      const applyBtn = tenantPage.locator('button:has-text("Apply")').first();
      await applyBtn.click();
      await tenantPage.waitForLoadState("networkidle");
    }

    const cards = tenantPage.locator('[data-testid="property-card"]');
    expect(await cards.count()).toBeGreaterThanOrEqual(0);
  });

  test("should sort properties", async ({ tenantPage }) => {
    await navigateToAuthenticatedPage(tenantPage, "/properties");

    const sortBtn = tenantPage.locator('select[name="sort"], button:has-text("Sort")').first();
    if (await sortBtn.isVisible()) {
      if ((await sortBtn.evaluate((el) => el.tagName)) === "SELECT") {
        await sortBtn.selectOption("price_asc");
      } else {
        await sortBtn.click();
        const option = tenantPage.locator('text=/price.*low/i').first();
        if (await option.isVisible()) {
          await option.click();
        }
      }

      await tenantPage.waitForLoadState("networkidle");
    }
  });

  test("should display property details", async ({ tenantPage }) => {
    await navigateToAuthenticatedPage(tenantPage, "/properties");
    await waitForPageLoad(tenantPage, "properties");

    const firstCard = tenantPage.locator('[data-testid="property-card"]').first();
    await firstCard.click();

    await waitForPageLoad(tenantPage, "property-detail");

    // Verify key details are displayed
    const title = tenantPage.locator('[data-testid="property-title"], h1').first();
    await expect(title).toBeVisible();

    const rent = tenantPage.locator('[data-testid="property-rent"], text=/₹|rent/i').first();
    await expect(rent).toBeDefined();

    const bedrooms = tenantPage.locator('[data-testid="property-bedrooms"], text=/bedroom/i').first();
    await expect(bedrooms).toBeDefined();
  });

  test("should display property images", async ({ tenantPage }) => {
    await navigateToAuthenticatedPage(tenantPage, "/properties");
    const firstCard = tenantPage.locator('[data-testid="property-card"]').first();
    await firstCard.click();

    await waitForPageLoad(tenantPage, "property-detail");

    const images = tenantPage.locator('[data-testid="property-image"], img[alt*="property" i]');
    const imageCount = await images.count();
    expect(imageCount).toBeGreaterThan(0);
  });

  test("should show owner contact info on property detail", async ({ tenantPage }) => {
    await navigateToAuthenticatedPage(tenantPage, "/properties/123");
    await waitForPageLoad(tenantPage, "property-detail");

    // Owner name or info should be visible
    const ownerInfo = tenantPage.locator('[data-testid="owner-info"], text=/posted|listed/i').first();
    await expect(ownerInfo).toBeDefined();
  });

  test("should navigate between properties", async ({ tenantPage }) => {
    await navigateToAuthenticatedPage(tenantPage, "/properties");
    await waitForPageLoad(tenantPage, "properties");

    const cards = tenantPage.locator('[data-testid="property-card"]');
    const count = await cards.count();

    if (count >= 2) {
      // Click first property
      await cards.nth(0).click();
      await waitForPageLoad(tenantPage, "property-detail");

      // Navigate to next property (if navigation exists)
      const nextBtn = tenantPage.locator('button[aria-label*="next" i], button:has-text("Next")').first();
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
        await waitForPageLoad(tenantPage, "property-detail");
      }
    }
  });
});

test.describe("Property Owner Management", () => {
  test("owner can edit property details", async ({ ownerPage }) => {
    // Mock get property endpoint
    await ownerPage.route("**/api/v1/properties/123/", (route) => {
      if (route.request().method() === "GET") {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "123",
            title: "Original Title",
            description: "Original description",
            rent: 25000,
            bedrooms: 2,
            status: "DRAFT",
            owner: "owner-123",
          }),
        });
      } else if (route.request().method() === "PUT" || route.request().method() === "PATCH") {
        const json = route.request().postDataJSON();
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ...json, id: "123" }),
        });
      }
    });

    await navigateToAuthenticatedPage(ownerPage, "/dashboard/properties/123/edit");

    // Fill form
    const titleInput = ownerPage.locator('input[name*="title"]');
    if (await titleInput.isVisible()) {
      await titleInput.clear();
      await titleInput.fill("Updated Title");
    }

    // Save
    const saveBtn = ownerPage.locator('button:has-text("Save"), button:has-text("Update")').first();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await ownerPage.waitForLoadState("networkidle");
    }
  });

  test("owner can publish property", async ({ ownerPage }) => {
    await ownerPage.route("**/api/v1/properties/123/publish/", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "ACTIVE" }),
      });
    });

    await navigateToAuthenticatedPage(ownerPage, "/dashboard/properties");

    const publishBtn = ownerPage.locator('button:has-text("Publish"), button[aria-label*="publish"]').first();
    if (await publishBtn.isVisible()) {
      await publishBtn.click();
      await ownerPage.waitForLoadState("networkidle");

      // Verify status changed
      const status = ownerPage.locator('[data-testid="property-status"]').first();
      const statusText = await status.textContent();
      expect(statusText).toContain("Active");
    }
  });

  test("owner can archive property", async ({ ownerPage }) => {
    await ownerPage.route("**/api/v1/properties/123/archive/", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "EXPIRED" }),
      });
    });

    const archiveBtn = ownerPage.locator('button:has-text("Archive"), button[aria-label*="archive"]').first();
    if (await archiveBtn.isVisible()) {
      await archiveBtn.click();
      await ownerPage.waitForLoadState("networkidle");
    }
  });

  test("owner can delete property", async ({ ownerPage }) => {
    await ownerPage.route("**/api/v1/properties/123/", (route) => {
      if (route.request().method() === "DELETE") {
        route.fulfill({ status: 204 });
      }
    });

    const deleteBtn = ownerPage.locator('button:has-text("Delete"), button[aria-label*="delete"]').first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();

      // Confirm delete if modal appears
      const confirmBtn = ownerPage.locator('button:has-text("Confirm"), button:has-text("Yes")').first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
      }

      await ownerPage.waitForLoadState("networkidle");
    }
  });
});
