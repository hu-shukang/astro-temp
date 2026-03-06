# Hooks Patterns Reference

## Custom Hook: Data Fetching

```typescript
// hooks/useData.ts
import { useState, useEffect } from 'react';

function useData<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!url) return;
    let ignore = false;

    setLoading(true);
    setError(null);

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<T>;
      })
      .then((json) => {
        if (!ignore) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err);
          setLoading(false);
        }
      });

    return () => { ignore = true; };
  }, [url]);

  return { data, loading, error };
}
```

## Custom Hook: External Store (useSyncExternalStore)

Prefer `useSyncExternalStore` over `useEffect + useState` for subscribing to external stores:

```typescript
import { useSyncExternalStore, useDebugValue } from 'react';

function subscribe(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

export function useOnlineStatus() {
  const isOnline = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,  // client snapshot
    () => true               // server snapshot (SSR)
  );
  useDebugValue(isOnline ? 'Online' : 'Offline');
  return isOnline;
}
```

## Custom Hook: Interval

Use `useEffectEvent` (experimental) or wrap callback in ref to avoid resetting intervals:

```typescript
import { useEffect, useRef, useCallback } from 'react';

export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  // Always keep the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}
```

## Custom Hook: Intersection Observer

```typescript
import { useState, useEffect, RefObject } from 'react';

export function useIntersectionObserver(
  ref: RefObject<Element>,
  options?: IntersectionObserverInit
) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, { threshold: 1.0, ...options });

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return isIntersecting;
}
```

## Custom Hook: Debounce

```typescript
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
```

## Custom Hook: Previous Value

```typescript
import { useRef, useEffect } from 'react';

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => { ref.current = value; }, [value]);
  return ref.current;
}
```

## useEffect Anti-patterns

```tsx
// ❌ No ignore flag — race condition risk
useEffect(() => {
  fetch('/api/data').then(res => res.json()).then(setData);
}, [id]);

// ✅ With ignore flag
useEffect(() => {
  let ignore = false;
  fetch('/api/data').then(res => res.json()).then(data => {
    if (!ignore) setData(data);
  });
  return () => { ignore = true; };
}, [id]);

// ❌ Hook inside useMemo (violates Rules of Hooks)
const style = useMemo(() => {
  const theme = useContext(ThemeContext); // 🔴 Error!
  return createStyle(theme);
});

// ✅ Correct
const theme = useContext(ThemeContext);
const style = useMemo(() => createStyle(theme), [theme]);
```

## React 19: use() Hook

```tsx
import { use } from 'react';

// Can be called AFTER early returns (unlike useContext)
function Heading({ children }: { children?: React.ReactNode }) {
  if (!children) return null;

  // This works even after the early return above
  const theme = use(ThemeContext);
  return <h1 style={{ color: theme.color }}>{children}</h1>;
}

// Also works with Promises (inside Suspense)
function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise); // Suspends until resolved
  return <div>{user.name}</div>;
}
```

## React 19: useOptimistic

```tsx
import { useOptimistic } from 'react';

function TodoList({ todos }: { todos: Todo[] }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state: Todo[], newTodo: Todo) => [...state, newTodo]
  );

  async function addTodo(text: string) {
    const tempTodo = { id: Date.now(), text, pending: true };
    addOptimisticTodo(tempTodo);        // immediate UI update
    await api.createTodo(text);         // actual server call
    // on success: real data from server replaces optimistic state
    // on error: optimistic state automatically reverts
  }

  return (
    <ul>
      {optimisticTodos.map(todo => (
        <li key={todo.id} style={{ opacity: todo.pending ? 0.5 : 1 }}>
          {todo.text}
        </li>
      ))}
    </ul>
  );
}
```
