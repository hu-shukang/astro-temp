---
name: react-developer
description: Best practices, patterns, and production-grade implementation guidance for React development. Use this skill whenever building React components, hooks, forms, state management, or server data fetching — including component architecture, custom hooks, Zustand global state, TanStack Query (React Query) server state, React Hook Form + Zod validation, TypeScript typing, performance optimization, and folder structure. Trigger this skill for any task involving .tsx/.jsx files, useQuery, useMutation, QueryClient, useForm, zodResolver, zustand stores, useEffect patterns, or React-specific design decisions. Also trigger when the user asks about data fetching, server state, caching, query invalidation, optimistic updates, form validation, state management options, component composition, or React performance patterns.
---

# React Developer Skill

> **[SKILL ACTIVATED]** When this skill is loaded, immediately output the following message to the user:
> `> ⚛️ **react-developer** skill loaded — applying React production-grade best practices.`

Production-grade patterns for building React applications with TypeScript. Covers component design, hooks, server state (TanStack Query), global state (Zustand), form management (React Hook Form + Zod), and performance patterns.

> **Reference files**: For detailed examples, see `references/` directory:
>
> - `hooks-patterns.md` — Custom hooks, useEffect, data fetching patterns
> - `zustand-patterns.md` — Zustand store setup, middleware, async actions
> - `forms-patterns.md` — React Hook Form + Zod resolver, field validation
> - `tanstack-query-patterns.md` — TanStack Query v5: useQuery, useMutation, queryOptions, optimistic updates

---

## Project Structure (recommended)

```
src/
├── components/          # Reusable UI components
│   ├── ui/              # Base UI primitives (Button, Input, etc.)
│   └── features/        # Feature-specific components
├── hooks/               # Custom hooks
├── queries/             # TanStack Query: queryOptions factories + custom hooks
├── stores/              # Zustand stores (client/UI state)
├── lib/
│   └── api.ts           # API layer (pure fetch functions, no React deps)
├── types/               # Shared TypeScript types
└── schemas/             # Zod validation schemas
```

> **State ownership guide**:
>
> - **Server state** (remote data, caching, sync) → TanStack Query
> - **Global UI state** (auth user, theme, sidebar) → Zustand
> - **Form state** → React Hook Form + Zod

---

## Component Patterns

### Functional Components with TypeScript

Always type props explicitly. Prefer `interface` for component props:

```tsx
interface ButtonProps {
  label: string;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  onClick?: () => void;
}

export function Button({
  label,
  variant = "primary",
  disabled,
  onClick,
}: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant}`}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
```

### Composition over Props Drilling

Use `children` and compound components to avoid deep prop drilling:

```tsx
// ✅ Good: composition pattern
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
  <Card.Footer>Actions</Card.Footer>
</Card>
```

---

## Hooks Quick Reference

> See `references/hooks-patterns.md` for full examples.

### Rules of Hooks

- Always call hooks at the **top level** — never inside loops, conditions, or nested functions
- Only call hooks from **React function components** or **custom hooks**
- Custom hooks must start with `use`

### Common Patterns

```tsx
// Data fetching with race condition protection
useEffect(() => {
  let ignore = false;
  async function fetchData() {
    const res = await fetch(`/api/${id}`);
    const data = await res.json();
    if (!ignore) setData(data);
  }
  fetchData();
  return () => {
    ignore = true;
  };
}, [id]);
```

```tsx
// useCallback for stable function references in custom hooks
function useRouter() {
  const navigate = useCallback((url: string) => {
    // ...
  }, []);
  return { navigate };
}
```

### React 19 APIs

- **`use(Promise)`** — Read promises and context conditionally (can be used after early returns)
- **`useOptimistic`** — Immediate UI update while async completes, auto-reverts on error
- **`useFormStatus`** — Read parent `<form>` submission state from child components

```tsx
// useOptimistic pattern
const [optimisticItems, addOptimisticItem] = useOptimistic(
  items,
  (state, newItem) => [...state, newItem],
);
```

---

## Server State — TanStack Query v5

> See `references/tanstack-query-patterns.md` for full patterns (mutations, optimistic updates, pagination).

**Install**: `npm install @tanstack/react-query`

### Setup — QueryClient + Provider

```tsx
// main.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60, // data is fresh for 1 minute
      refetchOnWindowFocus: true,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
    </QueryClientProvider>
  );
}
```

### queryOptions Factory (v5 Best Practice)

Centralizes `queryKey` + `queryFn` in one place — reusable across `useQuery`, `prefetchQuery`, and `getQueryData`:

```typescript
// queries/postQueries.ts
import { queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const postQueries = {
  list: () =>
    queryOptions({
      queryKey: ["posts"],
      queryFn: api.getPosts,
      staleTime: 1000 * 60 * 5,
    }),
  detail: (id: number) =>
    queryOptions({
      queryKey: ["posts", id],
      queryFn: () => api.getPost(id),
      enabled: id > 0, // disabled when id is invalid
    }),
};
```

### useQuery — Fetching Data

```tsx
function PostList() {
  const { data, isPending, isError, error, isFetching } = useQuery(
    postQueries.list(),
  );

  if (isPending) return <p>Loading...</p>;
  if (isError) return <p>Error: {error.message}</p>;

  return (
    <>
      {isFetching && <span>Refreshing...</span>}
      {data.map((post) => (
        <div key={post.id}>{post.title}</div>
      ))}
    </>
  );
}
```

**v5 status fields**:

| Field                | Description                                               |
| -------------------- | --------------------------------------------------------- |
| `isPending`          | No data yet (initial load) — replaces `isLoading` from v4 |
| `isFetching`         | Actively fetching (including background refetch)          |
| `isError` / `error`  | Request failed                                            |
| `isSuccess` / `data` | Request succeeded                                         |

### useMutation — Data Mutation + Cache Invalidation

```tsx
function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] }); // trigger refetch
    },
  });
}

// Usage
const { mutate, isPending } = useCreatePost();
mutate({ title: "New post", body: "..." });
```

### Optimistic Update

```tsx
function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.deletePost,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["posts"] }); // cancel in-flight requests
      const snapshot = queryClient.getQueryData<Post[]>(["posts"]); // save snapshot for rollback
      queryClient.setQueryData<Post[]>(
        ["posts"],
        (
          old, // optimistically remove item
        ) => (old ?? []).filter((p) => p.id !== id),
      );
      return { snapshot }; // passed to onError as context
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.snapshot) queryClient.setQueryData(["posts"], ctx.snapshot); // rollback on failure
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["posts"] }), // sync with server
  });
}
```

### v5 Key API Change

```typescript
// ❌ v4 — multiple positional arguments
useQuery(["todos"], fetchTodos, { staleTime: 5000 });

// ✅ v5 — single options object
useQuery({ queryKey: ["todos"], queryFn: fetchTodos, staleTime: 5000 });
```

---

## Global State — Zustand

> See `references/zustand-patterns.md` for full middleware patterns.

### Basic Store

```typescript
// stores/useCounterStore.ts
import { create } from "zustand";

interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

export const useCounterStore = create<CounterState>()((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
  decrement: () => set((s) => ({ count: s.count - 1 })),
  reset: () => set({ count: 0 }),
}));
```

### Selector Pattern (prevent unnecessary re-renders)

```tsx
// ✅ Subscribe to only what you need
const count = useCounterStore((s) => s.count);
const increment = useCounterStore((s) => s.increment);

// ❌ Avoid subscribing to entire store
const store = useCounterStore(); // re-renders on ANY state change
```

### Middleware Stack (recommended order)

```typescript
import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

const useAppStore = create<AppState>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          // state + actions
        })),
      ),
      {
        name: "app-storage",
        partialize: (state) => ({ user: state.user }), // only persist what's needed
      },
    ),
    { name: "AppStore" },
  ),
);
```

| Middleware              | Purpose                                         |
| ----------------------- | ----------------------------------------------- |
| `devtools`              | Redux DevTools integration                      |
| `persist`               | Persist to localStorage/sessionStorage          |
| `immer`                 | Direct state mutation (auto-immutable)          |
| `subscribeWithSelector` | Subscribe to specific state slices              |
| `combine`               | Auto-infer types from separated state + actions |

---

## Forms — React Hook Form + Zod

> See `references/forms-patterns.md` for advanced patterns.

### Standard Setup

```typescript
// schemas/userSchema.ts
import { z } from "zod";

export const userSchema = z.object({
  username: z.string().min(3, "At least 3 characters"),
  email: z.string().email("Invalid email"),
  age: z
    .number({ invalid_type_error: "Must be a number" })
    .min(18, "Must be 18+"),
});

// TypeScript type auto-inferred from schema
export type UserFormValues = z.infer<typeof userSchema>;
```

```tsx
// components/UserForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userSchema, type UserFormValues } from "@/schemas/userSchema";

export function UserForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty, isValid },
    reset,
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    mode: "onBlur",
    defaultValues: { username: "", email: "", age: 18 },
  });

  const onSubmit = async (data: UserFormValues) => {
    await saveUser(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("username")} />
      {errors.username && <p>{errors.username.message}</p>}

      <input type="email" {...register("email")} />
      {errors.email && <p>{errors.email.message}</p>}

      <input type="number" {...register("age", { valueAsNumber: true })} />
      {errors.age && <p>{errors.age.message}</p>}

      <button type="submit" disabled={isSubmitting || !isDirty}>
        {isSubmitting ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
```

### Validation Modes

| Mode                 | When validation runs      |
| -------------------- | ------------------------- |
| `onSubmit` (default) | Only on form submit       |
| `onBlur`             | When field loses focus    |
| `onChange`           | On every keystroke        |
| `onTouched`          | First blur, then onChange |
| `all`                | Both blur and change      |

### `useFormState` for Isolated Re-renders

```tsx
// Subscribe to specific form state in a child component
import { useFormState } from "react-hook-form";

function SubmitButton({ control }) {
  const { isSubmitting, isValid } = useFormState({ control });
  return <button disabled={isSubmitting || !isValid}>Submit</button>;
}
```

---

## TypeScript Tips

### Generic Component Pattern

```tsx
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

export function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map((item) => (
        <li key={keyExtractor(item)}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}
```

### Event Handler Types

```tsx
// Input change
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {};

// Button click
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {};

// Form submit
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {};
```

---

## Performance Patterns

### Memoization

```tsx
// useMemo — expensive computations
const filtered = useMemo(() => items.filter((item) => item.active), [items]);

// useCallback — stable function reference
const handleSave = useCallback(async (id: string) => {
  await api.save(id);
}, []); // Only recreated if deps change

// React.memo — skip re-render if props unchanged
export const ExpensiveComponent = React.memo(({ data }: Props) => {
  return <div>{/* render */}</div>;
});
```

### When NOT to Memoize

- Simple computations — memoization overhead > computation cost
- Components that always re-render due to parent changes
- When props include new object/array references every render

---

## Key Design Principles

1. **Own your state clearly** — Server state → TanStack Query; Global UI state → Zustand; Form state → React Hook Form
2. **Decouple the API layer** — Pure fetch functions with no React dependencies; easy to test in isolation
3. **Use queryOptions factories** — Centralize queryKey + queryFn; avoid magic strings scattered across files
4. **Schema-first forms** — Define the Zod schema before building the form component
5. **Selector pattern** — Always use selectors with Zustand to avoid unnecessary re-renders
6. **Race condition protection** — Always use an `ignore` flag in async `useEffect` data fetching
7. **Type inference** — Use `z.infer<typeof schema>` instead of manually defining form data types
8. **Avoid prop drilling** — Use Context, Zustand, or composition patterns
