import { test as base, Page, expect } from "@playwright/test";

type AuthFixture = {
  authenticatedPage: Page;
  tenantPage: Page;
  ownerPage: Page;
};

/**
 * Authenticate with backend via API
 */
async function authenticateViaAPI(
  page: Page,
  email: string,
  password: string,
): Promise<{ access: string; refresh: string; user: object }> {
  // Set up interception for auth endpoints
  const tokenResponse = await page.evaluate(
    async ({ email, password }) => {
      // In a real scenario, we'd call the actual endpoint
      // For now, return mock tokens (these will be intercepted/mocked)
      return {
        access: `mock-access-token-${email}`,
        refresh: `mock-refresh-token-${email}`,
        user: {
          id: "user-123",
          email,
          role: "TENANT",
          first_name: "Test",
          last_name: "User",
          is_verified: true,
        },
      };
    },
    { email, password },
  );

  // Store tokens in localStorage (mimicking real auth flow)
  await page.evaluate((state) => {
    localStorage.setItem("gharbazar-auth", JSON.stringify(state));
  }, tokenResponse);

  return tokenResponse;
}

/**
 * Create authenticated page fixture
 */
async function createAuthenticatedPage(
  page: Page,
  email: string,
  role: "TENANT" | "OWNER" = "TENANT",
): Promise<Page> {
  // Mock local storage with auth state
  await page.evaluate((data) => {
    const authState = {
      state: {
        user: {
          id: `user-${Date.now()}`,
          email: data.email,
          role: data.role,
          first_name: data.role === "OWNER" ? "Owner" : "Tenant",
          last_name: "TestUser",
          phone: data.role === "OWNER" ? "9999999999" : null,
          is_verified: true,
          location: data.role === "OWNER" ? { id: "delhi", city: "Delhi" } : null,
          location_id: data.role === "OWNER" ? "delhi" : null,
          date_joined: new Date().toISOString(),
        },
        tokens: {
          access: `jwt-access-${data.email}`,
          refresh: `jwt-refresh-${data.email}`,
        },
      },
    };
    localStorage.setItem("gharbazar-auth", JSON.stringify(authState.state));
  }, { email, role });

  return page;
}

/**
 * Mock API endpoints for tests
 */
async function setupApiMocks(page: Page): Promise<void> {
  // Mock properties API
  await page.route("**/api/v1/properties/**", (route) => {
    const url = new URL(route.request().url());

    if (route.request().method() === "GET") {
      route.abort("blockedbyclient"); // Let real API through in non-mock scenarios
    } else if (route.request().method() === "POST") {
      // Mock property creation
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: `prop-${Date.now()}`,
          title: "Test Property",
          description: "A test property",
          rent: 25000,
          bedrooms: 2,
          status: "DRAFT",
          owner: "user-123",
          total_views: 0,
          total_favorites: 0,
          total_contacts: 0,
          created_at: new Date().toISOString(),
        }),
      });
    }
  });

  // Mock favorites API
  await page.route("**/api/v1/favorites/**", (route) => {
    if (route.request().method() === "POST") {
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: `fav-${Date.now()}`,
          property: "prop-123",
          tenant: "user-456",
          created_at: new Date().toISOString(),
        }),
      });
    } else if (route.request().method() === "DELETE") {
      route.fulfill({ status: 204 });
    }
  });

  // Mock contacts API
  await page.route("**/api/v1/contacts/**", (route) => {
    if (route.request().method() === "POST") {
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: `contact-${Date.now()}`,
          tenant: "user-456",
          property: "prop-123",
          owner: "user-123",
          contact_type: "CHAT",
          created_at: new Date().toISOString(),
        }),
      });
    }
  });
}

/**
 * Clear authentication state
 */
async function clearAuth(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem("gharbazar-auth");
  });
}

export const test = base.extend<AuthFixture>({
  authenticatedPage: async ({ page }, use) => {
    await setupApiMocks(page);
    const authPage = await createAuthenticatedPage(page, "tenant@test.com", "TENANT");
    await use(authPage);
    await clearAuth(authPage);
  },

  tenantPage: async ({ page }, use) => {
    await setupApiMocks(page);
    const tenantPage = await createAuthenticatedPage(page, "tenant@test.com", "TENANT");
    await use(tenantPage);
    await clearAuth(tenantPage);
  },

  ownerPage: async ({ page }, use) => {
    await setupApiMocks(page);
    const ownerPage = await createAuthenticatedPage(page, "owner@test.com", "OWNER");
    await use(ownerPage);
    await clearAuth(ownerPage);
  },
});

export { expect };
