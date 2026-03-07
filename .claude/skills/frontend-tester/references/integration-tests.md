# Integration Tests Reference — React Components with vitest-browser-react

Component integration tests run in a **real Chromium browser** via Vitest browser mode.

---

## Key Difference from Unit Tests

|                 | Unit                              | Integration                        |
| --------------- | --------------------------------- | ---------------------------------- |
| Environment     | happy-dom / node                  | Real browser (Chromium)            |
| Assertion style | `expect(el)`                      | `await expect.element(el)`         |
| Auto-retry      | No                                | Yes (retries until timeout)        |
| Render method   | `renderHook` / `@testing-library` | `render` from vitest-browser-react |

---

## Basic Component Test

```tsx
// tests/integration/Button.test.tsx
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { Button } from "@/components/Button";

test("renders label and calls onClick", async () => {
  const handleClick = vi.fn();
  const screen = render(<Button onClick={handleClick}>Save</Button>);

  await expect
    .element(screen.getByRole("button", { name: /save/i }))
    .toBeInTheDocument();

  await screen.getByRole("button").click();

  expect(handleClick).toHaveBeenCalledOnce();
});
```

---

## Form Component Test

```tsx
// tests/integration/ContactForm.test.tsx
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { ContactForm } from "@/components/ContactForm";

test("submits form with user input", async () => {
  const handleSubmit = vi.fn();
  const screen = render(<ContactForm onSubmit={handleSubmit} />);

  await screen.getByLabelText(/name/i).fill("Alice");
  await screen.getByLabelText(/email/i).fill("alice@example.com");
  await screen.getByRole("button", { name: /send/i }).click();

  expect(handleSubmit).toHaveBeenCalledWith({
    name: "Alice",
    email: "alice@example.com",
  });
});

test("shows validation error for empty email", async () => {
  const screen = render(<ContactForm onSubmit={vi.fn()} />);

  await screen.getByRole("button", { name: /send/i }).click();

  // expect.element auto-retries — great for async validation
  await expect
    .element(screen.getByText(/email is required/i))
    .toBeInTheDocument();
});
```

---

## Component with API Calls (MSW)

```tsx
// tests/integration/UserCard.test.tsx
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../msw/server";
import { UserCard } from "@/components/UserCard";

test("displays user data from API", async () => {
  server.use(
    http.get("/api/users/1", () =>
      HttpResponse.json({ id: "1", name: "Alice", role: "admin" }),
    ),
  );

  const screen = render(<UserCard userId="1" />);

  await expect.element(screen.getByText(/loading/i)).toBeInTheDocument();
  await expect.element(screen.getByText("Alice")).toBeInTheDocument();
  await expect.element(screen.getByText("admin")).toBeInTheDocument();
});

test("shows error state on API failure", async () => {
  server.use(
    http.get("/api/users/1", () =>
      HttpResponse.json({ message: "Not found" }, { status: 404 }),
    ),
  );

  const screen = render(<UserCard userId="1" />);

  await expect.element(screen.getByText(/not found/i)).toBeInTheDocument();
});
```

---

## Testing Component State Transitions

```tsx
// tests/integration/Counter.test.tsx
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { Counter } from "@/components/Counter";

test("increments and decrements correctly", async () => {
  const screen = render(<Counter initialValue={5} />);

  await expect.element(screen.getByText("5")).toBeInTheDocument();

  await screen.getByRole("button", { name: /increment/i }).click();
  await expect.element(screen.getByText("6")).toBeInTheDocument();

  await screen.getByRole("button", { name: /decrement/i }).click();
  await screen.getByRole("button", { name: /decrement/i }).click();
  await expect.element(screen.getByText("4")).toBeInTheDocument();
});
```

---

## Testing Error Boundaries

```tsx
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error("Explosion!");
  return <div>All good</div>;
}

test("ErrorBoundary shows fallback UI on error", async () => {
  const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  const screen = render(
    <ErrorBoundary fallback={<p>Something broke</p>}>
      <Bomb shouldThrow={true} />
    </ErrorBoundary>,
  );

  await expect.element(screen.getByText("Something broke")).toBeInTheDocument();
  consoleSpy.mockRestore();
});
```

---

## Testing Accessible Components

```tsx
test("modal is accessible", async () => {
  const screen = render(
    <Modal isOpen title="Settings">
      <p>Content</p>
    </Modal>,
  );

  const dialog = screen.getByRole("dialog");
  await expect.element(dialog).toBeInTheDocument();
  await expect.element(dialog).toHaveAttribute("aria-labelledby");

  await userEvent.keyboard("{Escape}");
  await expect.element(dialog).not.toBeInTheDocument();
});
```

---

## Parent-Child Component Interaction

```tsx
test("child events bubble to parent", async () => {
  const onSelectionChange = vi.fn();
  const screen = render(
    <FilterList onSelectionChange={onSelectionChange}>
      <FilterOption value="react" label="React" />
      <FilterOption value="astro" label="Astro" />
    </FilterList>,
  );

  await screen.getByRole("checkbox", { name: /react/i }).click();

  expect(onSelectionChange).toHaveBeenCalledWith(["react"]);
});
```

---

## Query Cheatsheet

```tsx
const screen = render(<MyComponent />);

// By role (preferred)
screen.getByRole("button", { name: /submit/i });
screen.getByRole("heading", { level: 1 });
screen.getByRole("textbox", { name: /email/i });

// By label
screen.getByLabelText(/username/i);

// By text
screen.getByText("Hello World");
screen.getByText(/hello/i);

// By test ID (last resort)
screen.getByTestId("submit-btn");

// Async assertions (always await in browser mode)
await expect.element(screen.getByText("Loaded")).toBeInTheDocument();
await expect.element(screen.getByRole("button")).toBeDisabled();
await expect.element(screen.getByText("Error")).not.toBeInTheDocument();
```
