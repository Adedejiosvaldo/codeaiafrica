import { defineConfig, devices } from "@playwright/test";

// End-to-end tests against the real app: a fresh database, the built site, and a fake AI provider.
// Run: npm run build && npm run e2e   (set E2E_PYTHON to the Python that has backend/requirements.txt installed)
const python = process.env.E2E_PYTHON ?? "python3";
const db = "/tmp/akada-e2e.db";
const env = {
  DATABASE_URL: `sqlite:///${db}`, SECRET_KEY: "e2e", ADMIN_EMAIL: "admin@e2e.test", ADMIN_PASSWORD: "e2e-password-123",
  FRONTEND_DIST: `${process.cwd()}/dist`, PUBLIC_URL: "http://127.0.0.1:8100",
  AI_BASE_URL: "http://127.0.0.1:9100/v1", AI_API_KEY: "fake", AI_MODELS: "fake-model",
  EMBED_BASE_URL: "http://127.0.0.1:9100/v1", EMBED_API_KEY: "fake", EMBED_MODEL: "fake-embed",
};

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:8100",
    trace: "retain-on-failure",
    // Use a preinstalled Chromium if one is given (e.g. a sandbox); CI installs its own
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: `${python} ../backend/tests/fake_provider.py 9100`,
      port: 9100,
      reuseExistingServer: false,
    },
    {
      command: `rm -f ${db} && cd ../backend && ${python} -m app.cli migrate && ${python} -m uvicorn app.main:app --port 8100`,
      url: "http://127.0.0.1:8100/api/health",
      env,
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
