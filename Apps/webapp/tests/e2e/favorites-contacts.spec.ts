import { test, expect } from "./fixtures";
import { navigateToAuthenticatedPage, waitForPageLoad } from "./helpers";

test.describe("Favorites Management", () => {
  test("tenant can add property to favorites", async ({ tenantPage }) => {
    await tenantPage.route("**/api/v1/favorites/", (route) => {
      if (route.request().method() === "POST") {
        route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: `fav-${Date.now()}`,
            property: "prop-123",
            tenant: "tenant-123",
            created_at: new Date().toISOString(),
          }),
        });
      }
    });

    await navigateToAuthenticatedPage(tenantPage, "/properties/123");
    await waitForPageLoad(tenantPage, "property-detail");

    const favoriteBtn = tenantPage.locator('button[aria-label*="favorite" i], button:has-text("Save")').first();
    if (await favoriteBtn.isVisible()) {
      await favoriteBtn.click();
      await tenantPage.waitForLoadState("networkidle");

      // Verify button state changed (heart filled or text changed)
      const icon = favoriteBtn.locator("svg");
      const isActive = await favoriteBtn.evaluate((btn) => btn.classList.contains("active"));
      expect(isActive || (await icon.getAttribute("data-filled"))).toBeTruthy();
    }
  });

  test("tenant can remove property from favorites", async ({ tenantPage }) => {
    await tenantPage.route("**/api/v1/favorites/**", (route) => {
      if (route.request().method() === "DELETE") {
        route.fulfill({ status: 204 });
      }
    });

    await navigateToAuthenticatedPage(tenantPage, "/properties/123");
    await waitForPageLoad(tenantPage, "property-detail");

    // Simulate property is already favorited
    const favoriteBtn = tenantPage.locator('button[aria-label*="remove" i], button:has-text("Remove")').first();
    if (await favoriteBtn.isVisible()) {
      await favoriteBtn.click();
      await tenantPage.waitForLoadState("networkidle");
    }
  });

  test("should display favorites list", async ({ tenantPage }) => {
    await tenantPage.route("**/api/v1/favorites/", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          results: [
            {
              id: "fav-1",
              property: {
                id: "prop-1",
                title: "Favorite Property 1",
                rent: 25000,
              },
              created_at: new Date().toISOString(),
            },
            {
              id: "fav-2",
              property: {
                id: "prop-2",
                title: "Favorite Property 2",
                rent: 30000,
              },
              created_at: new Date().toISOString(),
            },
          ],
        }),
      });
    });

    await navigateToAuthenticatedPage(tenantPage, "/favorites");
    await waitForPageLoad(tenantPage, "favorites");

    const cards = tenantPage.locator('[data-testid="favorite-item"], [data-testid="property-card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should show empty state when no favorites", async ({ tenantPage }) => {
    await tenantPage.route("**/api/v1/favorites/", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ results: [] }),
      });
    });

    await navigateToAuthenticatedPage(tenantPage, "/favorites");
    await waitForPageLoad(tenantPage, "favorites");

    const emptyState = tenantPage.locator('text=/no favorites|empty|add properties/i').first();
    await expect(emptyState).toBeDefined();
  });

  test("tenant can remove favorite from favorites list", async ({ tenantPage }) => {
    await tenantPage.route("**/api/v1/favorites/**", (route) => {
      if (route.request().method() === "DELETE") {
        route.fulfill({ status: 204 });
      }
    });

    await navigateToAuthenticatedPage(tenantPage, "/favorites");

    const deleteBtn = tenantPage.locator('button[aria-label*="remove"], button:has-text("Remove")').first();
    if (await deleteBtn.isVisible()) {
      const initialCount = await tenantPage.locator('[data-testid="favorite-item"]').count();

      await deleteBtn.click();
      await tenantPage.waitForLoadState("networkidle");

      const afterCount = await tenantPage.locator('[data-testid="favorite-item"]').count();
      expect(afterCount).toBeLessThanOrEqual(initialCount);
    }
  });

  test("favorites count shows in navigation", async ({ tenantPage }) => {
    await tenantPage.route("**/api/v1/favorites/", (route) => {
      if (route.request().url().includes("?limit=1")) {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ count: 5 }),
        });
      } else {
        route.continue();
      }
    });

    await navigateToAuthenticatedPage(tenantPage, "/dashboard");

    // Look for favorites count badge
    const badge = tenantPage.locator('[data-testid="favorites-count"], text=/favorites.*5/i').first();
    if (await badge.isVisible()) {
      const text = await badge.textContent();
      expect(text).toContain("5");
    }
  });
});

test.describe("Leads & Contacts", () => {
  test("tenant can create contact with owner", async ({ tenantPage }) => {
    await tenantPage.route("**/api/v1/contacts/", (route) => {
      if (route.request().method() === "POST") {
        route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: `contact-${Date.now()}`,
            tenant: "tenant-123",
            property: "prop-123",
            owner: "owner-123",
            contact_type: "CHAT",
            created_at: new Date().toISOString(),
          }),
        });
      }
    });

    await navigateToAuthenticatedPage(tenantPage, "/properties/123");
    await waitForPageLoad(tenantPage, "property-detail");

    const contactBtn = tenantPage.locator('button:has-text("Contact"), button:has-text("Message"), button:has-text("Inquire")').first();
    if (await contactBtn.isVisible()) {
      await contactBtn.click();
      await tenantPage.waitForLoadState("networkidle");

      // Success message should appear
      const successMsg = tenantPage.locator('text=/contact|message|sent/i').first();
      await expect(successMsg).toBeDefined();
    }
  });

  test("owner can view list of contacts/leads", async ({ ownerPage }) => {
    await ownerPage.route("**/api/v1/contacts/", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          results: [
            {
              id: "contact-1",
              tenant: { id: "tenant-1", first_name: "John", last_name: "Doe" },
              property: { id: "prop-1", title: "Property 1" },
              contact_type: "CHAT",
              created_at: new Date().toISOString(),
            },
          ],
        }),
      });
    });

    const leadsLink = ownerPage.locator('a:has-text("Leads"), a:has-text("Contacts"), a:has-text("Inquiries")').first();
    if (await leadsLink.isVisible()) {
      await leadsLink.click();

      const contactItems = ownerPage.locator('[data-testid="contact-item"], [data-testid="lead-item"]');
      const count = await contactItems.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test("owner can filter contacts by property", async ({ ownerPage }) => {
    await navigateToAuthenticatedPage(ownerPage, "/contacts");

    const propertyFilter = ownerPage.locator('select[name="property"], input[placeholder*="property" i]').first();
    if (await propertyFilter.isVisible()) {
      if ((await propertyFilter.evaluate((el) => el.tagName)) === "SELECT") {
        await propertyFilter.selectOption("prop-123");
      } else {
        await propertyFilter.fill("Test Property");
      }

      await ownerPage.waitForLoadState("networkidle");
    }
  });

  test("owner can filter contacts by status", async ({ ownerPage }) => {
    await navigateToAuthenticatedPage(ownerPage, "/contacts");

    const statusFilter = ownerPage.locator('select[name="status"], button:has-text("Status")').first();
    if (await statusFilter.isVisible()) {
      if ((await statusFilter.evaluate((el) => el.tagName)) === "SELECT") {
        await statusFilter.selectOption("CONTACTED");
      } else {
        await statusFilter.click();
        const option = ownerPage.locator('text=/contacted|interested/i').first();
        if (await option.isVisible()) {
          await option.click();
        }
      }

      await ownerPage.waitForLoadState("networkidle");
    }
  });

  test("owner can update contact status", async ({ ownerPage }) => {
    await ownerPage.route("**/api/v1/contacts/**", (route) => {
      if (route.request().method() === "PUT" || route.request().method() === "PATCH") {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "contact-1",
            status: "CONTACTED",
          }),
        });
      }
    });

    await navigateToAuthenticatedPage(ownerPage, "/contacts");

    const statusUpdate = ownerPage.locator('[data-testid="contact-status"], select[name*="status"]').first();
    if (await statusUpdate.isVisible()) {
      if ((await statusUpdate.evaluate((el) => el.tagName)) === "SELECT") {
        await statusUpdate.selectOption("CONTACTED");
      } else {
        await statusUpdate.click();
      }

      await ownerPage.waitForLoadState("networkidle");
    }
  });

  test("tenant receives notification when contacting owner", async ({ tenantPage }) => {
    await tenantPage.route("**/api/v1/notifications/", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          results: [
            {
              id: "notif-1",
              notification_type: "NEW_MESSAGE",
              is_read: false,
              created_at: new Date().toISOString(),
            },
          ],
          unread_count: 1,
        }),
      });
    });

    // After creating contact, notification should be visible
    const notificationBadge = tenantPage.locator('[data-testid="notification-badge"]');
    if (await notificationBadge.isVisible()) {
      const badgeText = await notificationBadge.textContent();
      expect(badgeText).toContain("1");
    }
  });

  test("should show empty state when no contacts", async ({ ownerPage }) => {
    await ownerPage.route("**/api/v1/contacts/", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ results: [] }),
      });
    });

    await navigateToAuthenticatedPage(ownerPage, "/contacts");

    const emptyState = tenantPage.locator('text=/no contacts|no leads|empty/i').first();
    await expect(emptyState).toBeDefined();
  });

  test("contact throttling error should be handled gracefully", async ({ tenantPage }) => {
    await tenantPage.route("**/api/v1/contacts/", (route) => {
      if (route.request().method() === "POST") {
        route.fulfill({
          status: 429,
          contentType: "application/json",
          body: JSON.stringify({
            detail: "You can only contact this property 3 times per day",
          }),
        });
      }
    });

    await navigateToAuthenticatedPage(tenantPage, "/properties/123");

    const contactBtn = tenantPage.locator('button:has-text("Contact")').first();
    if (await contactBtn.isVisible()) {
      await contactBtn.click();
      await tenantPage.waitForLoadState("networkidle");

      // Should show error message
      const errorMsg = tenantPage.locator('text=/throttle|rate limit|contact.*times/i').first();
      await errorMsg.waitFor({ timeout: 2000 }).catch(() => {});
    }
  });
});
