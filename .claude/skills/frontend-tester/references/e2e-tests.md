# E2E Tests Reference — Native @playwright/test

Full-page E2E tests for Astro pages using `@playwright/test` — a completely independent test runner from Vitest.

---

## Playwright vs Vitest Browser Mode

|                        | Vitest browser mode             | `@playwright/test`                    |
| ---------------------- | ------------------------------- | ------------------------------------- |
| Purpose                | React component unit testing    | Full-page E2E testing                 |
| `import { test }` from | `vitest`                        | `@playwright/test`                    |
| Assertions             | `await expect.element(locator)` | `await expect(locator).toBeVisible()` |
| Server startup         | Manual                          | Auto via `webServer` config           |
| Page Object Model      | Not supported                   | Native support                        |
| Reports                | Vitest UI                       | Playwright HTML Report                |
| Trace / video          | Limited                         | Full support                          |

---

## Basic Test

```typescript
// e2e/home.spec.ts
import { test, expect } from "@playwright/test";

test("home page renders correctly", async ({ page }) => {
  await page.goto("/"); // baseURL is automatically prepended

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("navigation")).toBeVisible();
  await expect(page).toHaveTitle(/My App/);
});

test("shows 404 for unknown routes", async ({ page }) => {
  await page.goto("/this-does-not-exist");

  await expect(page.getByText(/404/)).toBeVisible();
});
```

---

## Page Object Model (POM)

Extract repeated page interactions into reusable POM classes.

```typescript
// e2e/pages/top.page.ts
import type { Page, Locator } from "@playwright/test";

export class TopPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly navLinks: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { level: 1 });
    this.navLinks = page.getByRole("navigation").getByRole("link");
  }

  async goto() {
    await this.page.goto("/");
  }

  async clickNav(label: string) {
    await this.page.getByRole("link", { name: label }).click();
  }
}
```

```typescript
// e2e/pages/login.page.ts
import type { Page } from "@playwright/test";

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.page.getByLabel(/email/i).fill(email);
    await this.page.getByLabel(/password/i).fill(password);
    await this.page.getByRole("button", { name: /login/i }).click();
  }
}
```

```typescript
// e2e/home.spec.ts — using POM
import { test, expect } from "@playwright/test";
import { TopPage } from "./pages/top.page";

test("navigation works", async ({ page }) => {
  const topPage = new TopPage(page);
  await topPage.goto();

  await expect(topPage.heading).toBeVisible();

  await topPage.clickNav("About");
  await expect(page).toHaveURL(/\/about/);
});
```

---

## Custom Fixtures

Extract common setup into fixtures for clean, reusable test code.

```typescript
// e2e/fixtures/index.ts
import { test as base } from "@playwright/test";
import { TopPage } from "../pages/top.page";
import { LoginPage } from "../pages/login.page";

type MyFixtures = {
  topPage: TopPage;
  loginPage: LoginPage;
};

export const test = base.extend<MyFixtures>({
  topPage: async ({ page }, use) => {
    const topPage = new TopPage(page);
    await topPage.goto();
    await use(topPage);
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
});

export { expect } from "@playwright/test";
```

```typescript
// e2e/home.spec.ts — using fixtures
import { test, expect } from "./fixtures";

test("top page heading is visible", async ({ topPage }) => {
  await expect(topPage.heading).toBeVisible();
});
```

---

## Navigation and Routing

```typescript
// e2e/navigation.spec.ts
import { test, expect } from "@playwright/test";

test("navigates between pages", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: /about/i }).click();

  await expect(page).toHaveURL(/\/about/);
  await expect(page.getByRole("heading", { name: /about/i })).toBeVisible();
});

test("browser back navigation works", async ({ page }) => {
  await page.goto("/");
  await page.goto("/about");
  await page.goBack();

  await expect(page).toHaveURL("/");
});
```

---

## Form Submission Flow

```typescript
// e2e/contact.spec.ts
import { test, expect } from "@playwright/test";

test("submits contact form successfully", async ({ page }) => {
  await page.goto("/contact");

  await page.getByLabel(/name/i).fill("Alice Smith");
  await page.getByLabel(/email/i).fill("alice@example.com");
  await page.getByLabel(/message/i).fill("Hello from E2E test");

  await page.getByRole("button", { name: /send/i }).click();

  await expect(page.getByText(/message sent/i)).toBeVisible();
});

test("shows validation errors for empty fields", async ({ page }) => {
  await page.goto("/contact");

  await page.getByRole("button", { name: /send/i }).click();

  await expect(page.getByText(/email is required/i)).toBeVisible();
});
```

---

## Authentication Flow

```typescript
// e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test("unauthenticated users are redirected to login", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login/);
});

test("redirects to dashboard after login", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel(/email/i).fill("user@example.com");
  await page.getByLabel(/password/i).fill("password123");
  await page.getByRole("button", { name: /login/i }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText(/welcome/i)).toBeVisible();
});
```

### Reusing Auth State with storageState (recommended for CI)

```typescript
// e2e/auth.setup.ts
import { test as setup, expect } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, "../playwright/.auth/user.json");

setup("save authenticated state", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill("user@example.com");
  await page.getByLabel(/password/i).fill("password123");
  await page.getByRole("button", { name: /login/i }).click();
  await expect(page).toHaveURL("/dashboard");

  // Save cookies and localStorage to a file
  await page.context().storageState({ path: authFile });
});
```

```typescript
// playwright.config.ts — use setup as a dependency
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  projects: [
    { name: "setup", testMatch: /.*\.setup\.ts/ },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/user.json", // reuse auth state
      },
      dependencies: ["setup"],
    },
  ],
});
```

---

## API Mocking with page.route

```typescript
test("shows error UI on API failure", async ({ page }) => {
  await page.route("/api/users", (route) => {
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ error: "Internal Server Error" }),
    });
  });

  await page.goto("/users");
  await expect(page.getByText(/something went wrong/i)).toBeVisible();
});

test("shows loading state during slow API", async ({ page }) => {
  await page.route("/api/users", async (route) => {
    await new Promise((r) => setTimeout(r, 2000));
    await route.continue();
  });

  await page.goto("/users");
  await expect(page.getByText(/loading/i)).toBeVisible();
});
```

---

## Testing Astro Islands (React Components)

```typescript
// e2e/counter-island.spec.ts
import { test, expect } from "@playwright/test";

test("React island hydrates and works", async ({ page }) => {
  await page.goto("/");

  // Wait for React hydration
  const counter = page.getByTestId("counter");
  await expect(counter).toBeVisible();

  await page.getByRole("button", { name: /\+/i }).click();
  await expect(page.getByText("Count: 1")).toBeVisible();
});
```

---

## Responsive and Device Testing

```typescript
// playwright.config.ts — add mobile project
projects: [
  { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  { name: "mobile", use: { ...devices["iPhone 14"] } },
];
```

```typescript
// e2e/responsive.spec.ts
import { test, expect } from "@playwright/test";

// This test runs against both Desktop and Mobile projects
test("navigation adapts to screen size", async ({ page, isMobile }) => {
  await page.goto("/");

  if (isMobile) {
    await expect(page.getByRole("button", { name: /menu/i })).toBeVisible();
    await page.getByRole("button", { name: /menu/i }).click();
  }

  await expect(page.getByRole("navigation")).toBeVisible();
});
```

---

## Screenshot / Visual Regression

```typescript
test("home page visual regression", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveScreenshot("home.png", {
    fullPage: true,
    maxDiffPixelRatio: 0.02,
  });
});

test("hero section screenshot", async ({ page }) => {
  await page.goto("/");

  const hero = page.getByTestId("hero-section");
  await expect(hero).toHaveScreenshot("hero.png");
});
```

---

## Assertion Cheatsheet

```typescript
// URL
await expect(page).toHaveURL("/about");
await expect(page).toHaveURL(/\/dashboard/);

// Title
await expect(page).toHaveTitle("My App");

// Visibility
await expect(locator).toBeVisible();
await expect(locator).toBeHidden();
await expect(locator).toBeAttached(); // exists in DOM, even if hidden

// Text content
await expect(locator).toHaveText("Hello");
await expect(locator).toContainText(/hello/i);

// Attributes and state
await expect(locator).toHaveAttribute("aria-label", "Close");
await expect(locator).toBeEnabled();
await expect(locator).toBeDisabled();
await expect(locator).toBeChecked();

// Count
await expect(locator).toHaveCount(3);

// Form value
await expect(locator).toHaveValue("input value");
```

---

## CI (GitHub Actions)

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run build
      - run: npm run test:e2e
        env:
          CI: true
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Tips

- **`webServer.reuseExistingServer: !process.env.CI`** — reuse a locally running dev server; always start fresh on CI
- **`trace: 'on-first-retry'`** — captures a trace on failure; view with `npx playwright show-report`
- **`retries: process.env.CI ? 2 : 0`** — auto-retry flaky tests in CI only
- **Locator priority**: `getByRole` → `getByLabel` → `getByText` → `getByTestId` (prefer semantics over implementation details)
- **`page.route()`** is great for simple API mocking; consider `playwright-msw` for complex multi-handler scenarios
