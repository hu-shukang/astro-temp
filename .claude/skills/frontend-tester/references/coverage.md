# Coverage Reference — Vitest + Playwright

---

## Overview: Coverage Responsibilities

| Test type          | Tool                           | Coverage purpose                                         |
| ------------------ | ------------------------------ | -------------------------------------------------------- |
| Unit / Integration | Vitest + `@vitest/coverage-v8` | Logic and branch coverage of source code                 |
| E2E                | Playwright (optional)          | Verify which code paths are exercised by real user flows |

**Core principle**: Coverage is primarily measured at the unit/integration level. E2E tests are for validating UI flows — not the main vehicle for coverage metrics.

---

## 1. Vitest Coverage Setup

### Installation

```bash
# V8 provider (recommended — zero config, fast)
npm install -D @vitest/coverage-v8

# Or Istanbul (more detailed branch coverage)
npm install -D @vitest/coverage-istanbul
```

### V8 vs Istanbul: When to Use Which

|                 | V8                 | Istanbul                             |
| --------------- | ------------------ | ------------------------------------ |
| Speed           | Fast               | Slightly slower                      |
| Configuration   | None required      | None required                        |
| Branch accuracy | Moderate           | High                                 |
| TypeScript      | Native via esbuild | Via esbuild/Babel transform          |
| Best for        | Most projects      | When precise branch tracking matters |

---

## 2. Coverage Configuration in vitest.config.ts

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      // Provider
      provider: "v8", // or 'istanbul'

      // Files to include (loaded during tests + explicitly listed)
      include: ["src/**/*.{ts,tsx}"],

      // Files to exclude from reporting
      exclude: [
        "src/**/*.d.ts",
        "src/**/*.config.{ts,js}",
        "src/**/types.ts",
        "src/**/index.ts", // barrel files
        "src/env.d.ts",
        "**/__mocks__/**",
        "**/*.stories.{ts,tsx}", // Storybook files
      ],

      // Report formats
      reporter: ["text", "html", "lcov"],
      // text  → terminal summary
      // html  → coverage/index.html (open in browser)
      // lcov  → for CI tools (Codecov, etc.)

      // Output directory
      reportsDirectory: "./coverage",

      // Fail the test run if thresholds are not met
      thresholds: {
        lines: 80,
        branches: 75,
        functions: 80,
        statements: 80,
      },
    },
  },
});
```

---

## 3. Threshold Guidelines

### Recommended thresholds by project maturity

```typescript
// Early-stage / startup project
thresholds: {
  lines: 60,
  branches: 55,
  functions: 60,
  statements: 60,
}

// Mature project (recommended default)
thresholds: {
  lines: 80,
  branches: 75,
  functions: 80,
  statements: 80,
}

// Critical business logic / high-reliability requirement
thresholds: {
  lines: 90,
  branches: 85,
  functions: 90,
  statements: 90,
}
```

### What each metric means

| Metric       | Meaning                                              | Priority                                     |
| ------------ | ---------------------------------------------------- | -------------------------------------------- |
| `lines`      | Percentage of executed lines                         | High                                         |
| `branches`   | Percentage of if/else, ternary, switch paths covered | **Highest** (bugs hide in untested branches) |
| `functions`  | Percentage of called functions                       | High                                         |
| `statements` | Percentage of executed statements                    | Medium (close to `lines`)                    |

**Prioritize `branches`** — uncovered branches are where bugs hide most often.

---

## 4. Excluding Files and Code Blocks

### Exclude an entire file

```typescript
// V8 provider
/* v8 ignore file -- @preserve */
export function devOnlyHelper() { ... }

// Istanbul provider
/* istanbul ignore file */
export function devOnlyHelper() { ... }
```

> **Important**: In TypeScript + esbuild environments, always add `-- @preserve` or the comment will be stripped before coverage analysis.

### Exclude specific lines or blocks

```typescript
// Next line only (V8)
/* v8 ignore next -- @preserve */
console.log("debug only");

// if block
/* v8 ignore if -- @preserve */
if (process.env.NODE_ENV === "development") {
  enableDebugMode();
}

// else block
/* v8 ignore else -- @preserve */
if (isProduction) {
  doProductionWork();
} else {
  // unreachable dev-only setup
  devSetup();
}

// switch default
switch (action.type) {
  case "INCREMENT":
    return state + 1;
  case "DECREMENT":
    return state - 1;
  /* v8 ignore next -- @preserve */
  default:
    return state;
}

// try/catch — exclude the catch block
try {
  return parse(input);
} catch (err) {
  /* v8 ignore next -- @preserve */
  throw new ParseError(err);
}
```

### Istanbul equivalents

```typescript
/* istanbul ignore if -- @preserve */
if (condition) { ... }

/* istanbul ignore else -- @preserve */
if (condition) { ... } else { ... }

/* istanbul ignore next -- @preserve */
throw new Error('unreachable')
```

---

## 5. Running Coverage Per Project

```bash
# All projects
npx vitest run --coverage

# Unit only
npx vitest run --project unit --coverage

# Integration only
npx vitest run --project integration --coverage
```

---

## 6. CI Integration

### GitHub Actions + Codecov

```yaml
# .github/workflows/test.yml
- name: Run tests with coverage
  run: npm run test:coverage

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v4
  with:
    files: ./coverage/lcov.info
    fail_ci_if_error: true
```

### Coverage badge (README.md)

```markdown
[![Coverage](https://codecov.io/gh/your-org/your-repo/branch/main/graph/badge.svg)](https://codecov.io/gh/your-org/your-repo)
```

---

## 7. Playwright Coverage (E2E, Optional)

Playwright can collect V8-style coverage data from pages. This is optional and typically only useful when you want to visualize which code paths are covered by E2E flows.

```typescript
// e2e/coverage.spec.ts
import { test } from "@playwright/test";

test("collect JS coverage during flow", async ({ page }) => {
  await page.coverage.startJSCoverage();

  await page.goto("/");
  await page.getByRole("button", { name: /submit/i }).click();

  const coverage = await page.coverage.stopJSCoverage();
  console.log(`Covered ${coverage.length} JS entries`);
  // Pass to istanbul-lib-coverage for reporting if needed
});
```

> **Practical note**: Playwright coverage collection adds significant setup complexity and CI overhead. Vitest coverage is almost always sufficient. Only consider Playwright coverage if you need to visualize which production-bundled code is touched by E2E scenarios.

---

## 8. .gitignore Additions

```
# Test coverage reports
coverage/
playwright-report/
test-results/
playwright/.auth/
```

---

## 9. What to Include vs Exclude

| File type                 | Include? | Reason                                |
| ------------------------- | -------- | ------------------------------------- |
| `src/utils/*.ts` (logic)  | Yes      | Core testable code                    |
| `src/components/*.tsx`    | Yes      | Covered by integration tests          |
| `src/hooks/*.ts`          | Yes      | Covered by unit tests                 |
| `src/types.ts` / `*.d.ts` | No       | Type definitions only, not executable |
| `src/index.ts` (barrel)   | No       | Re-exports only                       |
| `src/*.config.ts`         | No       | Config files                          |
| `src/env.d.ts`            | No       | Environment type definitions          |
| `.astro` components       | No       | Cannot be imported by Vitest          |
| Test files themselves     | No       | Excluded by Vitest automatically      |
