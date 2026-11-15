import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

// Cloud sessions ship their own Chromium; CI installs the one matching Playwright.
const localChromium = '/opt/pw-browsers/chromium';
const executablePath =
  process.env.PW_CHROMIUM_PATH ?? (!process.env.CI && existsSync(localChromium) ? localChromium : undefined);

// E2E_BASE_URL plays the same tests on a deployed preview instead of a local build.
const remote = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: 'e2e',
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: remote ?? 'http://localhost:4173',
    trace: 'off',
    launchOptions: executablePath ? { executablePath } : {},
  },
  // Every screen is checked at phone width and at laptop width.
  projects: [
    { name: 'phone', use: { viewport: { width: 400, height: 800 }, hasTouch: true } },
    { name: 'laptop', use: { viewport: { width: 1280, height: 800 } } },
  ],
  webServer: remote ? undefined : {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
});
