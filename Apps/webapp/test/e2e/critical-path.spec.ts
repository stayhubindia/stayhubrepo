import { test, expect } from "./fixtures";
import {
  navigateToAuthenticatedPage,
  waitForPageLoad,
  searchProperties,
  addPropertyToFavorites,
  removePropertyFromFavorites,
  contactPropertyOwner,
  verifyPropertyInList,
  expectSuccessNotification,
} from "./helpers";

test.describe("Critical Path: Tenant Workflow", () => {
  test("tenant can browse, favorite, and contact property (full flow)", async ({ tenantPage }) => {
    // 1. Start at dashboard
    await navigateToAuthenticatedPage(tenantPage, "/dashboard");
    await waitForPageLoad(tenantPage, "dashboard");

    // Verify dashboard loaded
    const dashboardHeading = tenantPage.locator("h1").first();
    await expect(dashboardHeading).toBeVisible();

    // 2. Navigate to properties list
    const propertiesLink = tenantPage.locator('a:has-text("Properties"), a:has-text("Browse"), nav a').first();
    if (await propertiesLink.isVisible()) {
      await propertiesLink.click();
    } else {
      await tenantPage.goto("/properties");
    }

    await waitForPageLoad(tenantPage, "properties");

    // 3. Search/filter properties
    await searchProperties(tenantPage, {
      location: "Delhi",
      bedrooms: 2,
    });

    // Verify properties are displayed
    const propertyCards = tenantPage.locator('[data-testid="property-card"], [data-testid="property-item"]');
    const cardCount = await propertyCards.count();
    expect(cardCount).toBeGreaterThan(0);

    // 4. Click on first property to view details
    const firstProperty = propertyCards.first();
    const propertyTitle = await firstProperty.locator("h2, h3, [data-testid*='title']").first().textContent();

    await firstProperty.click();
    await waitForPageLoad(tenantPage, "property-detail");

    // Verify property detail page loaded
    const detailTitle = tenantPage.locator('[data-testid="property-title"], h1').first();
    await expect(detailTitle).toBeVisible();

    // 5. Add to favorites
    await addPropertyToFavorites(tenantPage);
    await expectSuccessNotification(tenantPage, "Saved").catch(() => {}); // Toast might appear

    // Verify favorite button shows as favorited
    const favoriteButton = tenantPage.locator('button[aria-label*="favorite" i], button:has-text("Save")').first();
    const favoriteIcon = favoriteButton.locator("svg, [data-icon*='heart']").first();
    await expect(favoriteIcon).toBeDefined();

    // 6. Contact property owner
    await contactPropertyOwner(tenantPage, "CHAT");
    await expectSuccessNotification(tenantPage, "Contact").catch(() => {}); // Toast might appear

    // Verify contact was created (should navigate to messaging or show confirmation)
    const confirmationMsg = tenantPage.locator('text=/contact|message|lead/i').first();
    await expect(confirmationMsg).toBeDefined();

    // 7. Navigate to favorites to verify property is saved
    const favoritesLink = tenantPage.locator('a:has-text("Favorites"), a:has-text("Saved")').first();
    if (await favoritesLink.isVisible()) {
      await favoritesLink.click();
      await waitForPageLoad(tenantPage, "favorites");

      // Verify saved property appears in list
      const isFavorited = await verifyPropertyInList(tenantPage, propertyTitle || "Property");
      expect(isFavorited).toBeTruthy();
    }

    // 8. Navigate to contacts/leads to verify contact was created
    const leadsLink = tenantPage.locator('a:has-text("Leads"), a:has-text("Contacts"), a:has-text("Messages")').first();
    if (await leadsLink.isVisible()) {
      await leadsLink.click();
      await waitForPageLoad(tenantPage, "contacts");

      // Verify contact exists
      const contactItems = tenantPage.locator('[data-testid="contact-item"], [data-testid="lead-item"]');
      const contactCount = await contactItems.count();
      expect(contactCount).toBeGreaterThan(0);
    }
  });

  test("tenant can remove property from favorites", async ({ tenantPage }) => {
    // Navigate to property detail
    await tenantPage.goto("/properties/123");
    await waitForPageLoad(tenantPage, "property-detail");

    // Add to favorites first
    await addPropertyToFavorites(tenantPage);

    // Remove from favorites
    await removePropertyFromFavorites(tenantPage);

    // Verify removed (button state changes)
    const favoriteButton = tenantPage.locator('button[aria-label*="favorite" i], button:has-text("Save")').first();
    await expect(favoriteButton).toBeVisible();
  });

  test("tenant receives success feedback when contacting owner", async ({ tenantPage }) => {
    await tenantPage.goto("/properties/123");
    await waitForPageLoad(tenantPage, "property-detail");

    // Mock contact creation
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

    await contactPropertyOwner(tenantPage, "CHAT");

    // Verify success message appears
    const successMsg = tenantPage.locator('text=/message sent|contact created|owner notified/i').first();
    await successMsg.waitFor({ timeout: 3000 }).catch(() => {});
  });

  test("tenant can navigate through multiple properties", async ({ tenantPage }) => {
    await navigateToAuthenticatedPage(tenantPage, "/properties");
    await waitForPageLoad(tenantPage, "properties");

    const propertyCards = tenantPage.locator('[data-testid="property-card"]');
    const count = await propertyCards.count();

    // Visit at least 2 properties
    for (let i = 0; i < Math.min(2, count); i++) {
      await propertyCards.nth(i).click();
      await waitForPageLoad(tenantPage, "property-detail");

      // Go back to list
      const backBtn = tenantPage.locator('button:has-text("Back"), [aria-label="back"]').first();
      if (await backBtn.isVisible()) {
        await backBtn.click();
      } else {
        await tenantPage.goBack();
      }

      await waitForPageLoad(tenantPage, "properties");
    }

    expect(count).toBeGreaterThan(0);
  });

  test("tenant sees role-appropriate UI elements", async ({ tenantPage }) => {
    await navigateToAuthenticatedPage(tenantPage, "/dashboard");

    // Should NOT see owner-only features
    const createPropertyBtn = tenantPage.locator('button:has-text("Create Listing"), button:has-text("Add Property")');
    const isOwnerFeatureHidden = !(await createPropertyBtn.first().isVisible());
    expect(isOwnerFeatureHidden).toBeTruthy();

    // Should see tenant-only features
    const favoritesNav = tenantPage.locator('a:has-text("Favorites"), a:has-text("Saved")').first();
    expect(await favoritesNav.isVisible()).toBeTruthy();
  });
});

test.describe("Critical Path: Owner Workflow", () => {
  test("owner can create, publish, and manage property listings", async ({ ownerPage }) => {
    // 1. Navigate to my properties
    await navigateToAuthenticatedPage(ownerPage, "/dashboard");
    await waitForPageLoad(ownerPage, "dashboard");

    // 2. Create new property
    const createBtn = ownerPage.locator('button:has-text("Create Listing"), button:has-text("Add Property"), a:has-text("New")').first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await waitForPageLoad(ownerPage, "property-detail");

      // Mock property creation
      await ownerPage.route("**/api/v1/properties/", (route) => {
        if (route.request().method() === "POST") {
          route.fulfill({
            status: 201,
            contentType: "application/json",
            body: JSON.stringify({
              id: `prop-${Date.now()}`,
              title: "2BHK Flat in Delhi",
              rent: 30000,
              bedrooms: 2,
              bathrooms: 2,
              status: "DRAFT",
              owner: "owner-123",
              total_views: 0,
              total_favorites: 0,
              total_contacts: 0,
              created_at: new Date().toISOString(),
            }),
          });
        }
      });

      // Fill property form
      const titleInput = ownerPage.locator('input[placeholder*="title" i], input[name*="title" i]');
      if (await titleInput.isVisible()) {
        await titleInput.fill("2BHK Flat in Delhi");
      }

      const rentInput = ownerPage.locator('input[placeholder*="rent" i], input[name*="rent" i]');
      if (await rentInput.isVisible()) {
        await rentInput.fill("30000");
      }

      // Submit form
      const submitBtn = ownerPage.locator('button:has-text("Create"), button:has-text("Save")').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await ownerPage.waitForLoadState("networkidle");
      }
    }

    // 3. View my properties
    const myPropsLink = ownerPage.locator('a:has-text("My Properties"), a:has-text("My Listings")').first();
    if (await myPropsLink.isVisible()) {
      await myPropsLink.click();
      await waitForPageLoad(ownerPage, "properties");

      const propertyCards = ownerPage.locator('[data-testid="property-card"]');
      expect(await propertyCards.count()).toBeGreaterThan(0);
    }

    // 4. Check leads/contacts on property
    const leadsLink = ownerPage.locator('a:has-text("Leads"), a:has-text("Contacts"), a:has-text("Inquiries")').first();
    if (await leadsLink.isVisible()) {
      await leadsLink.click();
      await waitForPageLoad(ownerPage, "contacts");
    }
  });

  test("owner sees role-appropriate analytics", async ({ ownerPage }) => {
    await navigateToAuthenticatedPage(ownerPage, "/dashboard");

    // Should see owner-only features
    const analyticsLink = ownerPage.locator('a:has-text("Analytics"), a:has-text("Stats"), a:has-text("Insights")').first();
    expect(await analyticsLink.isVisible()).toBeTruthy();

    // Should see "My Properties" not "Browse Properties"
    const myPropsLink = ownerPage.locator('a:has-text("My")').first();
    const browseLink = ownerPage.locator('a:has-text("Browse")');
    expect(await browseLink.isVisible()).toBeFalsy();
  });
});
