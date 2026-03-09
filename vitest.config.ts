import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.d.ts",
        "src/**/index.ts",
        "src/**/*.config.ts",
        "src/pages/**",
        "src/layouts/**",
        "src/env.d.ts",
      ],
      reporter: ["text", "html", "lcov"],
      thresholds: {
        lines: 80,
        branches: 75,
        functions: 80,
        statements: 80,
      },
    },
    projects: [
      // ── Unit tests (happy-dom, no real browser) ──────────────────────────
      {
        plugins: [react()],
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.ts?(x)"],
          environment: "happy-dom",
          setupFiles: ["tests/setup/setup.unit.ts"],
          globals: true,
        },
      },
      // ── Integration tests (Vitest browser mode via Playwright) ────────────
      {
        plugins: [react()],
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.tsx"],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: "chromium" }],
          },
          setupFiles: ["tests/setup/setup.browser.ts"],
          globals: true,
        },
      },
    ],
  },
});
