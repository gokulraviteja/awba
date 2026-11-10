import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: process.env.CI ? 90_000 : 30_000,
  fullyParallel: false,
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "go -C ../awba-backend run ./cmd/api",
      url: "http://127.0.0.1:8080/healthz",
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      command: process.env.CI
        ? "npm run preview -- --host 127.0.0.1 --port 5173"
        : "npm run dev -- --host 127.0.0.1",
      url: "http://127.0.0.1:5173",
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
});
