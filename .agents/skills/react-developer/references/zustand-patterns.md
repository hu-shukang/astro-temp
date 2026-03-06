# Zustand Patterns Reference

## Basic Store with TypeScript

```typescript
// stores/useBearStore.ts
import { create } from 'zustand';

interface BearState {
  bears: number;
  food: string;
  feed: (food: string) => void;
  increment: () => void;
  reset: () => void;
}

export const useBearStore = create<BearState>()((set) => ({
  bears: 0,
  food: 'honey',
  feed: (food) => set({ food }),
  increment: () => set((s) => ({ bears: s.bears + 1 })),
  reset: () => set({ bears: 0 }),
}));
```

## Selector Pattern

```tsx
// ✅ Only subscribe to what you need → minimal re-renders
const bears = useBearStore((s) => s.bears);
const increment = useBearStore((s) => s.increment);

// ❌ Subscribes to everything → re-renders on any change
const { bears, increment } = useBearStore();
```

## Async Actions with Loading / Error State

```typescript
// stores/useUserStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface User { id: number; name: string; email: string; }

interface UserStore {
  users: User[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  createUser: (name: string, email: string) => Promise<void>;
  deleteUser: (id: number) => Promise<void>;
}

export const useUserStore = create<UserStore>()(
  devtools((set, get) => ({
    users: [],
    loading: false,
    error: null,

    fetchUsers: async () => {
      set({ loading: true, error: null }, false, 'users/fetchStart');
      try {
        const res = await fetch('/api/users');
        if (!res.ok) throw new Error('Failed to fetch');
        const users: User[] = await res.json();
        set({ users, loading: false }, false, 'users/fetchSuccess');
      } catch (err) {
        set({ error: (err as Error).message, loading: false }, false, 'users/fetchError');
      }
    },

    createUser: async (name, email) => {
      set({ loading: true });
      try {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email }),
        });
        const newUser: User = await res.json();
        set((s) => ({ users: [...s.users, newUser], loading: false }));
      } catch (err) {
        set({ error: (err as Error).message, loading: false });
      }
    },

    // Optimistic delete with rollback
    deleteUser: async (id) => {
      const previousUsers = get().users;
      set((s) => ({ users: s.users.filter((u) => u.id !== id) })); // optimistic
      try {
        await fetch(`/api/users/${id}`, { method: 'DELETE' });
      } catch {
        set({ users: previousUsers, error: 'Delete failed' }); // rollback
      }
    },
  }), { name: 'UserStore' })
);
```

## Persist Middleware

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      darkMode: false,
      language: 'ja',
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
    }),
    {
      name: 'settings-storage',                          // localStorage key
      storage: createJSONStorage(() => localStorage),    // default
      partialize: (state) => ({                          // only persist these fields
        darkMode: state.darkMode,
        language: state.language,
      }),
    }
  )
);
```

## Immer Middleware (for complex nested state)

```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface TreeState {
  nodes: Record<string, { name: string; children: string[] }>;
  addChild: (parentId: string, childId: string, name: string) => void;
}

export const useTreeStore = create<TreeState>()(
  immer((set) => ({
    nodes: {},
    addChild: (parentId, childId, name) =>
      set((state) => {
        // Direct mutation — Immer handles immutability
        state.nodes[childId] = { name, children: [] };
        state.nodes[parentId]?.children.push(childId);
      }),
  }))
);
```

## subscribeWithSelector — React to Specific State Changes

```typescript
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

const useStore = create(
  subscribeWithSelector((set) => ({
    darkMode: false,
    language: 'ja',
    toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
  }))
);

// Subscribe outside React (e.g., sync with CSS class)
useStore.subscribe(
  (state) => state.darkMode,
  (darkMode) => {
    document.body.classList.toggle('dark', darkMode);
  }
);
```

## Full Middleware Stack

```typescript
import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Order matters: devtools → persist → subscribeWithSelector → immer
const useAppStore = create<AppState>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set) => ({
          user: null,
          notifications: [] as Notification[],

          login: (name: string) =>
            set((state) => {
              state.user = { name, settings: { darkMode: false } };
            }),

          addNotification: (message: string) =>
            set((state) => {
              state.notifications.push({ id: Date.now().toString(), message });
            }),
        }))
      ),
      {
        name: 'app-storage',
        partialize: (state) => ({ user: state.user }),
      }
    ),
    { name: 'AppStore' }
  )
);
```

## combine Middleware (auto type inference)

```typescript
import { create } from 'zustand';
import { combine } from 'zustand/middleware';

// Types are auto-inferred — no need to define interface
const usePositionStore = create(
  combine(
    { position: { x: 0, y: 0 } },
    (set) => ({
      setPosition: (position: { x: number; y: number }) => set({ position }),
    })
  )
);
```

## Custom Middleware (Advanced)

```typescript
import { StateCreator, StoreMutatorIdentifier } from 'zustand';

type Logger = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  f: StateCreator<T, Mps, Mcs>,
  name?: string
) => StateCreator<T, Mps, Mcs>;

const logger: Logger = (f, name) => (set, get, store) => {
  const loggedSet: typeof set = (...args) => {
    set(...(args as Parameters<typeof set>));
    console.log(`[${name ?? 'store'}]`, get());
  };
  return f(loggedSet, get, store);
};
```
