import { defineConfig, devices } from "@playwright/test";

const port = 3107;
const localBaseURL = `http://127.0.0.1:${port}`;
const baseURL = process.env.E2E_BASE_URL ?? localBaseURL;

export default defineConfig({
  testDir: "./tests/e2e",
  use: { baseURL, trace: "on-first-retry" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["iPhone 13"] } },
  ],
  webServer: process.env.E2E_BASE_URL ? undefined : { command: "node scripts/start-e2e.mjs", url: `${localBaseURL}/create`, reuseExistingServer: !process.env.CI, timeout: 120000 },
});
