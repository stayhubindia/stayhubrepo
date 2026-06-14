import { Page } from "@playwright/test";

/**
 * Helper to navigate and wait for auth guard
 */
export async function navigateToAuthenticatedPage(page: Page, path: string): Promise<void> {
  // Ensure auth state is set before navigation
  const hasAuth = await page.evaluate(() => {
    const stored = localStorage.getItem("gharbazar-auth");
    return stored ? true : false;
  });

  if (!hasAuth) {
    throw new Error("Page requires authentication but auth state not found");
  }

  await page.goto(path);
}

/**
 * Wait for specific page to load (check for key elements)
 */
export async function waitForPageLoad(page: Page, pageType: string): Promise<void> {
  switch (pageType) {
    case "dashboard":
      await page.waitForSelector('[data-testid="dashboard-header"]', { timeout: 5000 }).catch(() => {
        // Fallback if selector not found
      });
      break;
    case "properties":
      await page.waitForSelector('[data-testid="properties-list"]', { timeout: 5000 }).catch(() => {});
      break;
    case "property-detail":
      await page.waitForSelector('[data-testid="property-title"]', { timeout: 5000 }).catch(() => {});
      break;
    case "auth":
      await page.waitForSelector('[data-testid="auth-form"]', { timeout: 5000 }).catch(() => {});
      break;
    default:
      await page.waitForLoadState("networkidle");
  }
}

/**
 * Search for properties by filters
 */
export async function searchProperties(
  page: Page,
  filters: {
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
  },
): Promise<void> {
  // Open filter panel
  const filterButton = page.locator('button:has-text("Filter")').first();
  if (await filterButton.isVisible()) {
    await filterButton.click();
  }

  // Fill in filters
  if (filters.location) {
    await page.locator('input[placeholder*="location" i]').fill(filters.location);
  }

  if (filters.minPrice) {
    await page.locator('input[placeholder*="min price" i]').fill(String(filters.minPrice));
  }

  if (filters.maxPrice) {
    await page.locator('input[placeholder*="max price" i]').fill(String(filters.maxPrice));
  }

  if (filters.bedrooms) {
    await page.locator(`select[name="bedrooms"]`).selectOption(String(filters.bedrooms));
  }

  // Apply filters
  const applyButton = page.locator('button:has-text("Apply")').first();
  if (await applyButton.isVisible()) {
    await applyButton.click();
  }

  await page.waitForLoadState("networkidle");
}

/**
 * Add property to favorites
 */
export async function addPropertyToFavorites(page: Page): Promise<void> {
  const favoriteButton = page.locator('button[aria-label*="favorite" i], button:has-text("Save")').first();

  if (await favoriteButton.isVisible()) {
    await favoriteButton.click();
    // Wait for API response
    await page.waitForLoadState("networkidle");
  } else {
    throw new Error("Favorite button not found on page");
  }
}

/**
 * Remove property from favorites
 */
export async function removePropertyFromFavorites(page: Page): Promise<void> {
  const unfavoriteButton = page
    .locator('button[aria-label*="remove" i], button:has-text("Remove")') 
    .first();

  if (await unfavoriteButton.isVisible()) {
    await unfavoriteButton.click();
    await page.waitForLoadState("networkidle");
  }
}

/**
 * Contact property owner (create lead)
 */
export async function contactPropertyOwner(page: Page, contactType: "CHAT" | "PHONE" | "WHATSAPP" = "CHAT"): Promise<void> {
  // Find and click contact button
  const contactButton = page.locator('button:has-text("Contact Owner"), button:has-text("Message")').first();

  if (await contactButton.isVisible()) {
    await contactButton.click();
    await page.waitForLoadState("networkidle");

    // Select contact type if modal appears
    if (contactType !== "CHAT") {
      const typeSelector = page.locator(`label:has-text("${contactType}")`);
      if (await typeSelector.isVisible()) {
        await typeSelector.click();
      }
    }

    // Submit contact
    const submitButton = page.locator('button:has-text("Send"), button:has-text("Contact")').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForLoadState("networkidle");
    }
  } else {
    throw new Error("Contact button not found on page");
  }
}

/**
 * Verify toast/notification message
 */
export async function expectSuccessNotification(page: Page, message: string): Promise<void> {
  const toast = page.locator(`text="${message}"`);
  await toast.waitFor({ timeout: 5000 });
}

/**
 * Get user role from localStorage
 */
export async function getUserRole(page: Page): Promise<"TENANT" | "OWNER"> {
  const role = await page.evaluate(() => {
    const stored = localStorage.getItem("gharbazar-auth");
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored);
      return parsed.user?.role || null;
    } catch {
      return null;
    }
  });

  return role as "TENANT" | "OWNER";
}

/**
 * Verify property card is visible in list
 */
export async function verifyPropertyInList(page: Page, propertyTitle: string): Promise<boolean> {
  const card = page.locator(`text="${propertyTitle}"`);
  return card.isVisible();
}

/**
 * Intercept API call and return mock data
 */
export async function mockApiResponse(
  page: Page,
  method: string,
  urlPattern: string,
  responseData: object,
): Promise<void> {
  await page.route(urlPattern, (route) => {
    if (route.request().method() === method) {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(responseData),
      });
    } else {
      route.continue();
    }
  });
}
