import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end config for the contact form flow (Fase 6).
 *
 * Runs against an already-running frontend (by default the Docker Compose
 * / Nginx production build at http://localhost:5173, the same URL exposed
 * by FRONTEND_PORT), so it exercises the real reverse proxy chain
 * (frontend -> contact-service -> Kafka -> notification-service), not just
 * `vite dev`. Point it elsewhere with E2E_BASE_URL if needed.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: false,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'on',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
