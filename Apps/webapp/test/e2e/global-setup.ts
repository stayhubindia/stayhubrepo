import { chromium, FullConfig } from "@playwright/test";

async function globalSetup(config: FullConfig<any, any>) {
  // This runs once before all tests
  console.log("🚀 E2E Test Suite Starting...");
  console.log(`   Workers: ${config.workers}`);
}

export default globalSetup;
