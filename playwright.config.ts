import { defineConfig, devices } from '@playwright/test'

const port = 4178

export default defineConfig({
  testDir: 'e2e',
  timeout: 240_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [
    ['list'],
    ['json', { outputFile: '/opt/cursor/artifacts/upload/e2e-report.json' }],
  ],
  use: {
    baseURL: `http://127.0.0.1:${port}/lore/`,
  },
  webServer: {
    command: `npm run build && npx vite preview --host 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}/lore/`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], channel: 'chrome' } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
})
