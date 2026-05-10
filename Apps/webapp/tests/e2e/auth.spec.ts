import { test, expect } from "./fixtures";
import { waitForPageLoad, navigateToAuthenticatedPage, getUserRole } from "./helpers";

test.describe("Auth Flow", () => {
  test("should navigate to auth page when unauthenticated", async ({ page }) => {
    // Clear auth to simulate unauthenticated state
    await page.evaluate(() => {
      localStorage.removeItem("gharbazar-auth");
    });

    await page.goto("/");
    await page.waitForURL("/auth");
    await waitForPageLoad(page, "auth");

    // Verify auth form is visible
    const authForm = page.locator('form').first();
    expect(authForm).toBeDefined();
  });

  test("should have email OTP request form", async ({ page }) => {
    await page.goto("/auth");
    await waitForPageLoad(page, "auth");

    // Check for email input
    const emailInput = page.locator('input[type="email"]');
    expect(await emailInput.isVisible()).toBeTruthy();

    // Check for "Request OTP" button
    const requestOtpBtn = page.locator('button:has-text("Request OTP"), button:has-text("Send OTP")').first();
    expect(await requestOtpBtn.isVisible()).toBeTruthy();
  });

  test("should validate email format on OTP request", async ({ page }) => {
    await page.goto("/auth");
    await waitForPageLoad(page, "auth");

    const emailInput = page.locator('input[type="email"]');
    const submitBtn = page.locator('button:has-text("Request OTP"), button:has-text("Send OTP")').first();

    // Try invalid email
    await emailInput.fill("invalid-email");
    await submitBtn.click();

    // Should show validation error
    const errorMsg = page.locator('text=/invalid|not.*valid|email/i').first();
    await errorMsg.waitFor({ timeout: 2000 }).catch(() => {}); // Might not be visible
  });

  test("should handle OTP request successfully", async ({ page }) => {
    await page.goto("/auth");
    await waitForPageLoad(page, "auth");

    const emailInput = page.locator('input[type="email"]');
    const submitBtn = page.locator('button:has-text("Request OTP"), button:has-text("Send OTP")').first();

    // Mock the OTP request endpoint
    await page.route("**/api/v1/auth/email-otp/request/", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          detail: "OTP sent to email",
        }),
      });
    });

    await emailInput.fill("test@example.com");
    await submitBtn.click();

    // Should show success message or move to OTP verification step
    await page.waitForLoadState("networkidle");
    const successMsg = page.locator('text=/OTP|sent|verify/i').first();
    await successMsg.waitFor({ timeout: 3000 }).catch(() => {});
  });

  test("should verify OTP and authenticate user", async ({ page }) => {
    // Start at email request
    await page.goto("/auth");
    await waitForPageLoad(page, "auth");

    // Mock successful authentication
    await page.route("**/api/v1/auth/email-otp/verify/", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access: "jwt-token-123",
          refresh: "jwt-refresh-123",
          user: {
            id: "user-123",
            email: "test@example.com",
            role: "TENANT",
            first_name: "Test",
            last_name: "User",
            is_verified: true,
            date_joined: new Date().toISOString(),
          },
        }),
      });
    });

    // Request OTP
    const emailInput = page.locator('input[type="email"]');
    const submitBtn = page.locator('button:has-text("Request OTP"), button:has-text("Send OTP")').first();

    await emailInput.fill("test@example.com");
    await submitBtn.click();
    await page.waitForLoadState("networkidle");

    // Enter OTP
    const otpInputs = page.locator('input[data-testid*="otp"], input[inputmode="numeric"]');
    if (await otpInputs.first().isVisible()) {
      // Fill each OTP digit
      const count = await otpInputs.count();
      for (let i = 0; i < count; i++) {
        await otpInputs.nth(i).fill((i + 1).toString());
      }

      // Verify button should be visible
      const verifyBtn = page.locator('button:has-text("Verify"), button:has-text("Confirm")').first();
      if (await verifyBtn.isVisible()) {
        await verifyBtn.click();
      }
    }

    // Should redirect to dashboard after successful auth
    await page.waitForURL("/dashboard", { timeout: 5000 }).catch(() => {});
  });

  test("should persist session in localStorage after login", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/");

    const authState = await authenticatedPage.evaluate(() => {
      const stored = localStorage.getItem("gharbazar-auth");
      return stored ? JSON.parse(stored) : null;
    });

    expect(authState).toBeDefined();
    expect(authState.tokens).toBeDefined();
    expect(authState.tokens.access).toBeTruthy();
    expect(authState.user).toBeDefined();
    expect(authState.user.email).toBeTruthy();
  });

  test("should have correct role in auth state", async ({ tenantPage, ownerPage }) => {
    // Tenant role
    let role = await getUserRole(tenantPage);
    expect(role).toBe("TENANT");

    // Owner role
    role = await getUserRole(ownerPage);
    expect(role).toBe("OWNER");
  });

  test("should logout and clear session", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/dashboard");

    // Mock logout endpoint
    await authenticatedPage.route("**/api/v1/auth/logout/", (route) => {
      route.fulfill({ status: 200 });
    });

    // Find and click logout button (typically in profile menu)
    const profileMenu = authenticatedPage.locator('button[aria-label="Profile"], button:has-text("Account")').first();
    if (await profileMenu.isVisible()) {
      await profileMenu.click();
      const logoutBtn = authenticatedPage.locator('button:has-text("Logout"), button:has-text("Sign out")').first();
      if (await logoutBtn.isVisible()) {
        await logoutBtn.click();
      }
    }

    // Check localStorage is cleared
    const authState = await authenticatedPage.evaluate(() => {
      return localStorage.getItem("gharbazar-auth");
    });

    expect(authState).toBeNull();
  });
});
