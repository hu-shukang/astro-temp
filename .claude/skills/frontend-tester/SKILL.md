---
name: frontend-tester
description: Testing patterns and best practices for Astro + React applications using Vitest (unit + integration) and native Playwright (E2E). Use this skill whenever writing or reviewing tests for Astro/React frontends — including unit tests for utility functions and React hooks, component integration tests with vitest-browser-react, and full E2E tests with @playwright/test. Trigger this skill for any task involving vitest.config.ts, playwright.config.ts, test setup, @testing-library/react, vitest-browser-react, MSW mocking, Page Object Model, snapshot testing, or structuring test files in an Astro project. Also trigger when the user asks about testing strategy, test folder layout, CI test configuration, auth state, coverage thresholds, or how to test Astro pages/components.
---

# Frontend Tester Skill — Astro + React + Vitest + Playwright

> **[SKILL ACTIVATED]** When this skill is loaded, immediately output the following message to the user:
> `> 🧪 **frontend-tester** skill loaded — applying Vitest + Playwright testing best practices.`

Testing guide for **Astro v5 + React + TypeScript** projects.

- **Unit & Integration**: Vitest + vitest-browser-react
- **E2E**: Native `@playwright/test`

> **Reference files** (read when needed):
>
> - `references/unit-tests.md` — Unit test patterns (utils, hooks, pure logic)
> - `references/integration-tests.md` — Component integration tests with vitest-browser-react
> - `references/e2e-tests.md` — E2E tests with native @playwright/test
> - `references/mocking.md` — MSW, vi.mock, module/env mocking
> - `references/coverage.md` — Coverage setup, thresholds, and exclusion rules (Vitest + Playwright)

---

## 1. Project Structure

```
tests/
├── unit/                  # Pure logic, utils, hooks (Vitest)
│   └── *.test.ts
├── integration/           # React component tests (Vitest browser mode)
│   └── *.test.tsx
├── __mocks__/             # Auto-mock files (fs, etc.)
├── msw/                   # MSW handlers (shared between unit/integration)
│   ├── handlers.ts
│   └── server.ts
└── setup/
    ├── setup.unit.ts      # Unit test setup
    └── setup.browser.ts   # Integration test setup

e2e/                       # Playwright E2E tests (separate directory)
├── pages/                 # Page Object Models
│   └── *.page.ts
├── fixtures/              # Custom fixtures
│   └── index.ts
├── *.spec.ts              # Test files
└── global-setup.ts        # Astro server startup
```

---

## 2. Installation

```bash
# Vitest (unit + integration)
npm install -D vitest @vitest/browser-playwright vitest-browser-react
npm install -D @testing-library/jest-dom @testing-library/user-event
npm install -D msw happy-dom

# Playwright (E2E) — standalone test runner
npm install -D @playwright/test
npx playwright install chromium
```

---

## 3. Configuration Files

### vitest.config.ts (unit + integration only)

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";

export default defineConfig({
  plugins: [react()],
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.d.ts", "src/**/index.ts", "src/**/*.config.ts"],
      reporter: ["text", "html", "lcov"],
      thresholds: { lines: 80, branches: 75, functions: 80, statements: 80 },
    },
    projects: [
      // ── Unit tests (happy-dom, no real browser) ──────────────
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
      // ── Integration tests (Vitest browser mode) ──────────────
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
```

### playwright.config.ts (E2E only)

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  use: {
    baseURL: "http://localhost:4321",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  // Automatically start Astro dev server before tests
  webServer: {
    command: "npm run dev",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
    stdout: "ignore",
    stderr: "pipe",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],
});
```

---

## 4. Setup Files

**`tests/setup/setup.unit.ts`**

```typescript
import "@testing-library/jest-dom";
import { afterEach, vi } from "vitest";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
```

**`tests/setup/setup.browser.ts`** (integration tests)

```typescript
import "@testing-library/jest-dom";
import { beforeAll, afterAll, afterEach } from "vitest";
import { server } from "../msw/server";

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

**`tests/msw/server.ts`**

```typescript
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
```

---

## 5. Quick Patterns

### Unit test (pure function)

```typescript
import { describe, it, expect } from "vitest";
import { formatDate } from "@/utils/formatDate";

describe("formatDate", () => {
  it("formats date correctly", () => {
    expect(formatDate(new Date("2024-03-21"))).toBe("March 21, 2024");
  });
});
```

### Component integration test (Vitest)

```tsx
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { Button } from "@/components/Button";

test("calls onClick when clicked", async () => {
  const handleClick = vi.fn();
  const screen = render(<Button onClick={handleClick}>Submit</Button>);
  await screen.getByRole("button", { name: /submit/i }).click();
  expect(handleClick).toHaveBeenCalledOnce();
});
```

### E2E test (native Playwright)

```typescript
import { test, expect } from "@playwright/test";

test("home page renders heading", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
```

---

## 6. Test Type Decision Guide

| What to test                            | Test type         | Tool                                   |
| --------------------------------------- | ----------------- | -------------------------------------- |
| Pure functions, utils, calculations     | Unit              | Vitest + happy-dom                     |
| React hooks                             | Unit              | `renderHook` from vitest-browser-react |
| React component rendering & interaction | Integration       | Vitest + vitest-browser-react          |
| Component with API calls                | Integration + MSW | vitest-browser-react + msw             |
| Full Astro page navigation              | E2E               | `@playwright/test`                     |
| Astro SSR/SSG output                    | E2E               | `@playwright/test`                     |
| Forms, multi-step flows, auth           | E2E               | `@playwright/test`                     |
| Cross-browser testing                   | E2E               | `@playwright/test` (multiple projects) |

---

## 7. npm Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest --project unit",
    "test:integration": "vitest --project integration",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:coverage:unit": "vitest run --project unit --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:report": "playwright show-report"
  }
}
```

---

## 8. Key Rules

1. **Vitest browser mode assertions**: always use `await expect.element(...)` — it auto-retries until the element appears
2. **Playwright assertions**: use `await expect(locator).toBeVisible()` — also auto-retries
3. **MSW over vi.mock for HTTP**: use MSW for API mocking; use `vi.mock` for module mocking
4. **Astro components cannot be imported in Vitest** — only test React island components in integration tests; test Astro pages via Playwright E2E
5. **webServer in playwright.config.ts** auto-starts the Astro dev server; `reuseExistingServer: !process.env.CI` lets you reuse a running dev server locally
6. **Page Object Model**: create POM classes in `e2e/pages/` for reusable page interactions
7. **Coverage**: measure unit/integration coverage with `@vitest/coverage-v8`; see `references/coverage.md` for thresholds and exclusion rules

> For detailed patterns, read the relevant reference file in `references/`.
