# Unit Tests Reference — Vitest

Unit tests run in `happy-dom` (or `node`) — no real browser, fast execution.

---

## When to Use Unit Tests

- Pure utility functions
- Data transformation and formatting
- Custom React hooks (stateful logic)
- Validation schemas (Zod, etc.)
- Class methods and helper modules

---

## Basic Patterns

### Testing a utility function

```typescript
// tests/unit/utils/formatPrice.test.ts
import { describe, it, expect } from "vitest";
import { formatPrice } from "@/utils/formatPrice";

describe("formatPrice", () => {
  it("formats USD correctly", () => {
    expect(formatPrice(1500, "USD")).toBe("$1,500.00");
  });

  it("handles zero", () => {
    expect(formatPrice(0, "USD")).toBe("$0.00");
  });

  it("handles negative values", () => {
    expect(formatPrice(-500, "USD")).toBe("-$500.00");
  });
});
```

### Testing async functions

```typescript
import { describe, it, expect, vi } from "vitest";
import { fetchUserProfile } from "@/lib/api";

vi.mock("@/lib/fetch", () => ({
  get: vi.fn(),
}));

describe("fetchUserProfile", () => {
  it("returns user data on success", async () => {
    const { get } = await import("@/lib/fetch");
    vi.mocked(get).mockResolvedValue({ id: "1", name: "Alice" });

    const result = await fetchUserProfile("1");
    expect(result.name).toBe("Alice");
  });

  it("throws on 404", async () => {
    const { get } = await import("@/lib/fetch");
    vi.mocked(get).mockRejectedValue(new Error("Not Found"));

    await expect(fetchUserProfile("99")).rejects.toThrow("Not Found");
  });
});
```

---

## React Hook Testing

Use `renderHook` from `vitest-browser-react`:

```typescript
// tests/unit/hooks/useCounter.test.ts
import { renderHook, act } from "vitest-browser-react";
import { describe, it, expect } from "vitest";
import { useCounter } from "@/hooks/useCounter";

describe("useCounter", () => {
  it("initializes with default value", () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it("increments count", () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => result.current.increment());

    expect(result.current.count).toBe(6);
  });

  it("resets to initial value", () => {
    const { result } = renderHook(() => useCounter(10));

    act(() => {
      result.current.increment();
      result.current.reset();
    });

    expect(result.current.count).toBe(10);
  });
});
```

---

## Mocking Environment Variables

```typescript
import { it, expect, vi } from "vitest";
import { getApiUrl } from "@/config";

it("uses PUBLIC_API_URL env var", () => {
  vi.stubEnv("PUBLIC_API_URL", "https://api.example.com");
  expect(getApiUrl()).toBe("https://api.example.com");
});
```

---

## Mocking Time

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isBusinessHours } from "@/utils/time";

describe("isBusinessHours", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("returns true during business hours", () => {
    vi.setSystemTime(new Date("2024-03-21T10:00:00"));
    expect(isBusinessHours()).toBe(true);
  });

  it("returns false outside business hours", () => {
    vi.setSystemTime(new Date("2024-03-21T22:00:00"));
    expect(isBusinessHours()).toBe(false);
  });
});
```

---

## Snapshot Testing

```typescript
import { it, expect } from "vitest";
import { buildNavItems } from "@/utils/nav";

it("builds nav items correctly", () => {
  const items = buildNavItems([
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
  ]);
  expect(items).toMatchSnapshot();
});
```

---

## Mocking Modules

```typescript
// Mock entire module
vi.mock("@/lib/analytics");

// Mock with partial implementation
vi.mock("@/lib/storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/storage")>();
  return {
    ...actual,
    saveItem: vi.fn(),
  };
});
```

---

## Testing Zod Schemas

```typescript
import { describe, it, expect } from "vitest";
import { ContactSchema } from "@/schemas/contact";

describe("ContactSchema", () => {
  it("validates a correct contact", () => {
    const result = ContactSchema.safeParse({
      name: "Alice",
      email: "alice@example.com",
      message: "Hello",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing email", () => {
    const result = ContactSchema.safeParse({ name: "Alice" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toContain("email");
  });
});
```
