import { FullConfig } from "@playwright/test";

async function globalTeardown(config: FullConfig) {
  // This runs once after all tests
  console.log("✅ E2E Test Suite Completed");
}

export default globalTeardown;
