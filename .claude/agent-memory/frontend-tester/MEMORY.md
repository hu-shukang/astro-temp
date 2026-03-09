# Frontend Tester — Agent Memory

## Test Infrastructure Status

- `vitest.config.ts` rewritten to support `projects` (unit + integration)
- `playwright.config.ts` created at project root
- `package.json` scripts updated with `test:unit`, `test:integration`, `test:coverage`, `test:e2e`, etc.

## Required Dependencies (NOT yet installed)

```
npm install -D @vitejs/plugin-react @vitest/browser vitest-browser-react happy-dom
npm install -D @playwright/test
npx playwright install chromium
```

See `patterns.md` for details.

## Test Directory Structure

```
tests/
  unit/          — Pure logic tests (Vitest + happy-dom)
  integration/   — React component tests (vitest-browser-react, browser mode)
  setup/
    setup.unit.ts
    setup.browser.ts
e2e/
  pages/         — Page Object Models
  *.spec.ts
```

## Key Patterns

- See `patterns.md` for Zustand mock, Recharts mock, YoYCard calc logic details
