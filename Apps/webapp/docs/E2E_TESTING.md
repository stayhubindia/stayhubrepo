# E2E Testing Guide

## Overview

This project uses **Playwright** for end-to-end (E2E) testing. The test suite covers critical user workflows:

- **Auth Flow**: Email OTP signup/login
- **Property Browse**: Searching, filtering, viewing details
- **Favorites**: Adding/removing properties
- **Contacts**: Tenant messaging and owner lead management
- **Role-Based UX**: Owner vs Tenant UI differences

## Quick Start

### 1. Install Dependencies

Already done with `npm install`, but if needed:

```bash
npm install -D @playwright/test dotenv
```

### 2. Setup Environment

Copy `.env.e2e.example` to `.env.local`:

```bash
cp .env.e2e.example .env.local
```

Ensure your app is running:

```bash
npm run dev
```

### 3. Run Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (browser visible)
npm run test:e2e:headed

# Debug a single test
npm run test:e2e:debug tests/e2e/critical-path.spec.ts

# Run specific test file
npx playwright test tests/e2e/auth.spec.ts

# Run tests with specific tag
npx playwright test --grep @smoke
```

## Test Structure

```
tests/e2e/
├── global-setup.ts          # Runs before all tests
├── global-teardown.ts       # Runs after all tests
├── fixtures.ts              # Custom test fixtures & helpers
├── helpers.ts               # Utility functions
├── auth.spec.ts             # Authentication flows
├── critical-path.spec.ts    # Full user workflows
├── properties.spec.ts       # Property browse & management
└── favorites-contacts.spec.ts # Favorites & leads
```

## Test Files

### `auth.spec.ts`
Tests authentication workflows:
- Unauthenticated user redirect
- Email OTP request validation
- OTP verification and login
- Session persistence in localStorage
- Role assignment (TENANT/OWNER)
- Logout and session clearing

**Key Tests:**
- `should validate email format on OTP request`
- `should verify OTP and authenticate user`
- `should persist session in localStorage after login`

### `critical-path.spec.ts`
Complete user journeys:
- **Tenant**: Browse → Filter → Favorite → Contact → Verify
- **Owner**: Create → Publish → Manage → View Leads

**Key Tests:**
- `tenant can browse, favorite, and contact property (full flow)`
- `tenant can remove property from favorites`
- `owner can create, publish, and manage property listings`

### `properties.spec.ts`
Property search and management:
- Display property list
- Filter by location, price, bedrooms
- Sort properties
- View property details and images
- Owner edit/publish/archive/delete

**Key Tests:**
- `should filter properties by location`
- `should filter properties by price range`
- `owner can edit property details`

### `favorites-contacts.spec.ts`
Favorites and lead management:
- Add/remove favorites
- View favorites list
- Create contacts (leads)
- Owner manages contacts
- Filter and update contact status
- Throttle error handling

**Key Tests:**
- `tenant can add property to favorites`
- `owner can view list of contacts/leads`
- `contact throttling error should be handled gracefully`

## Fixtures

### Custom Fixtures (`fixtures.ts`)

```typescript
// Authenticated tenant page with mocked APIs
await use(authenticatedPage)

// Tenant-specific page with localStorage auth
const tenantPage = await createAuthenticatedPage(page, "tenant@test.com", "TENANT")

// Owner-specific page with complete profile
const ownerPage = await createAuthenticatedPage(page, "owner@test.com", "OWNER")
```

**Fixture Features:**
- Auto-mocks API responses
- Sets localStorage auth state
- Cleans up after each test
- Two browsers: Chromium + Firefox

## Helper Functions (`helpers.ts`)

```typescript
// Navigate to authenticated page (checks auth state)
await navigateToAuthenticatedPage(page, "/properties")

// Wait for page type to load
await waitForPageLoad(page, "property-detail")

// Search with filters
await searchProperties(page, {
  location: "Delhi",
  minPrice: 10000,
  maxPrice: 50000,
  bedrooms: 2
})

// Favorite actions
await addPropertyToFavorites(page)
await removePropertyFromFavorites(page)

// Contact owner
await contactPropertyOwner(page, "CHAT")

// Verification
await verifyPropertyInList(page, propertyTitle)
await expectSuccessNotification(page, "message text")

// Get user role
const role = await getUserRole(page)
```

## API Mocking

Tests intercept and mock backend API calls:

```typescript
// Mock property creation
await page.route("**/api/v1/properties/", (route) => {
  if (route.request().method() === "POST") {
    route.fulfill({
      status: 201,
      body: JSON.stringify({ id: "prop-123", title: "New Property" }),
    });
  }
});

// Mock GET endpoint
await page.route("**/api/v1/properties/**", (route) => {
  route.fulfill({
    status: 200,
    body: JSON.stringify({ results: [...] }),
  });
});
```

## Test Data Attributes

For easier element selection, components should have `data-testid`:

```tsx
// Property card
<div data-testid="property-card">
  <h2 data-testid="property-title">Title</h2>
  <span data-testid="property-rent">₹25,000</span>
  <span data-testid="property-bedrooms">2 BHK</span>
</div>

// Favorite button
<button 
  aria-label="favorite property"
  data-testid="favorite-button"
>
  Save
</button>

// Contact button
<button data-testid="contact-button">Contact Owner</button>

// Notification badge
<span data-testid="notification-badge">5</span>
```

## Configuration (`playwright.config.ts`)

Key settings:

```typescript
fullyParallel: false        // Run tests serially for stable auth state
retries: 2                  // Retry failed tests in CI
workers: 1                  // Single worker prevents race conditions
trace: on-first-retry       # Capture traces for debugging failures
screenshot: only-on-failure # Save screenshots on failure
video: retain-on-failure    # Record videos of failures
timeout: 30000              # Global timeout for each test
navigationTimeout: 30000    # Timeout for page navigation
actionTimeout: 10000        # Timeout for user actions
```

## Debugging

### View Test Report

After running tests:

```bash
npx playwright show-report
```

Opens HTML report with:
- Test results
- Screenshots
- Videos
- Traces (if captured)

### Debug Mode

```bash
npm run test:e2e:debug tests/e2e/auth.spec.ts

# Inspector pauses at each action
# Step through, check DOM, modify locators in real-time
```

### Headed Mode

See browser as tests run:

```bash
npm run test:e2e:headed
```

### Print Debugging

```typescript
test("example", async ({ page }) => {
  console.log("Current URL:", page.url());
  console.log("Page title:", await page.title());
  
  // Print element state
  const btn = page.locator("button").first();
  console.log("Button visible:", await btn.isVisible());
  console.log("Button text:", await btn.textContent());
});
```

### Trace Inspector

Traces are automatically captured on first retry. Inspect with:

```bash
npx playwright show-trace ./test-results/trace.zip
```

## Common Issues

### **Issue**: Tests timeout at `page.goto()`

**Solution**: Ensure `npm run dev` is running on `http://localhost:3000`

```bash
npm run dev
```

### **Issue**: LocalStorage not persisting

**Solution**: Check `setupApiMocks()` runs before navigation:

```typescript
test("example", async ({ page }) => {
  await setupApiMocks(page);
  await page.goto("/dashboard");
});
```

### **Issue**: Element not found with `data-testid`

**Solution**: 
1. Verify component has `data-testid` attribute
2. Use fallback selectors in helpers:
   ```typescript
   const elem = page.locator('button:has-text("Send")').first();
   ```

### **Issue**: Race condition in concurrent tests

**Solution**: Tests run serially (`workers: 1`). To run in parallel safely:
```typescript
test.describe.serial("sequence of tests", () => {
  // Tests run one after another
});
```

## Writing New Tests

### Template

```typescript
import { test, expect } from "./fixtures";
import { navigateToAuthenticatedPage, waitForPageLoad } from "./helpers";

test.describe("Feature Name", () => {
  test("should do something", async ({ tenantPage }) => {
    // Setup
    await navigateToAuthenticatedPage(tenantPage, "/path");
    
    // Action
    const btn = tenantPage.locator("button").first();
    await btn.click();
    
    // Assert
    const result = tenantPage.locator('[data-testid="result"]');
    await expect(result).toBeVisible();
  });
});
```

### Best Practices

1. **Use data-testid**: More reliable than class names
   ```typescript
   // Good
   page.locator('[data-testid="submit-btn"]')
   
   // Avoid (brittle)
   page.locator('.form-button.primary')
   ```

2. **Wait for network**: After actions that trigger API calls
   ```typescript
   await btn.click();
   await page.waitForLoadState("networkidle");
   ```

3. **Use fixtures**: Pre-authenticated pages reduce setup
   ```typescript
   test("example", async ({ tenantPage, ownerPage }) => {
     // Both pages already authenticated with correct roles
   });
   ```

4. **Mock APIs**: Tests should not depend on backend
   ```typescript
   await page.route("**/api/**", (route) => {
     route.fulfill({ status: 200, body: mockData });
   });
   ```

5. **Test user behavior**: Not implementation details
   ```typescript
   // Good: Tests visible behavior
   await page.click('button:has-text("Save")');
   
   // Avoid: Tests internals
   await page.evaluate(() => MyStore.save());
   ```

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Run E2E tests
  run: npm run test:e2e

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-results
    path: playwright-report/
    retention-days: 30
```

## Performance Considerations

- **Serial execution** (`workers: 1`): Prevents race conditions with auth state
- **Reuse server** (`reuseExistingServer: true`): Don't restart dev server per test
- **Reduced retries locally** (`retries: 0`): Fail fast during development
- **Video on failure only**: Reduces disk usage

## Resources

- [Playwright Docs](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-test)
- [Debugging Guide](https://playwright.dev/docs/debug)

## Next Steps

1. Add `data-testid` attributes to all interactive components
2. Run E2E suite in CI pipeline
3. Expand coverage for edge cases (error states, network failures)
4. Add visual regression tests for critical UI
5. Set up performance benchmarks
