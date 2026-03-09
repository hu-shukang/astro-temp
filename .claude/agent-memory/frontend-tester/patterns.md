# Testing Patterns — astro-temp

## Zustand Store Mocking

Pattern used for `contractStore`:

```tsx
vi.mock("../../src/store/contractStore", () => {
  let mockState = {
    /* initial state */
  };
  return {
    useContractStore: vi.fn((selector) => selector(mockState)),
    __setMockState: (patch) => {
      mockState = { ...mockState, ...patch };
    },
    __resetMockState: () => {
      mockState = {
        /* initial */
      };
    },
  };
});
```

- Export `__setMockState` / `__resetMockState` to control state between tests
- Call `__resetMockState()` in `beforeEach`
- `vi.clearAllMocks()` in `afterEach` for mock function call counts

## Recharts Mocking

Recharts uses `ResizeObserver` and SVG, which may not work reliably in test environments.
Mock all used components:

```tsx
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }) => (
    <div data-testid="recharts-container">{children}</div>
  ),
  ComposedChart: ({ children }) => (
    <div data-testid="recharts-chart">{children}</div>
  ),
  Bar: () => null,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));
```

## YoYCard Calculation Logic

The component calculates:

- `diff = currentValue - previousValue`
- `pct = previousValue > 0 ? (diff / previousValue * 100).toFixed(1) : "0.0"`
- `isIncrease = diff > 0`, `isDecrease = diff < 0`
- Display: `isIncrease ? "+" + pct + "%" : pct + "%"`

Pure logic test in `tests/unit/yoyCalc.test.ts` (no React rendering needed).
Component rendering test in `tests/integration/YoYCard.test.tsx`.

## vitest.config.ts — provider type issue

`provider: "playwright"` causes TS error without `@vitest/browser` installed.
Workaround: `provider: "playwright" as any` until packages are installed.
After installing `@vitest/browser`, the correct type is available via `@vitest/browser-playwright`.

## ElectricityView — view state in URL

- `window.location.search` is read on mount → reset with `window.history.replaceState({}, "", "/electricity")` in `beforeEach`
- `?view=daily` → daily view; anything else → monthly (fallback)
- `handleViewChange` calls `window.history.replaceState` (not pushState)

## E2E Page Object Model

`e2e/pages/electricity.page.ts` — encapsulates heading, tab buttons, nav buttons.
Key: `goto()` waits for heading visibility after React hydration.
`switchToDaily()` waits for `prevMonthButton` visibility as hydration confirmation.

## ContractSelector — External Click

Uses `document.addEventListener("mousedown", ...)` pattern.
In vitest-browser-react, clicking an element outside the component container
properly triggers the outside-click handler.
