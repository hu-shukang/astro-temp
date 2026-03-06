# TanStack Query v5 Patterns Reference

## Installation & Setup

```bash
npm install @tanstack/react-query
npm install @tanstack/react-query-devtools  # recommended for development
```

## QueryClient Initialization

```tsx
// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,                      // retry once on failure
      staleTime: 1000 * 60,          // data stays fresh for 1 minute
      refetchOnWindowFocus: true,    // refetch when tab regains focus
    },
  },
});
```

```tsx
// main.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/queryClient';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
      <ReactQueryDevtools initialIsOpen={false} /> {/* dev-only debugging tool */}
    </QueryClientProvider>
  );
}
```

---

## API Layer (pure functions, decoupled from React Query)

```typescript
// lib/api.ts
const API_BASE = '/api';

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, init);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}

export const api = {
  getPosts: () => fetchJson<Post[]>('/posts'),
  getPost: (id: number) => fetchJson<Post>(`/posts/${id}`),
  createPost: (body: CreatePostInput) =>
    fetchJson<Post>('/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  deletePost: (id: number) => fetchJson<void>(`/posts/${id}`, { method: 'DELETE' }),
  updatePost: (id: number, body: Partial<Post>) =>
    fetchJson<Post>(`/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
};
```

---

## queryOptions Factory (v5 Best Practice)

```typescript
// queries/postQueries.ts
import { queryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const postQueries = {
  // list query
  list: () =>
    queryOptions({
      queryKey: ['posts'],
      queryFn: api.getPosts,
      staleTime: 1000 * 60 * 5,      // fresh for 5 minutes
    }),

  // detail query (disabled when id is invalid)
  detail: (id: number) =>
    queryOptions({
      queryKey: ['posts', id],
      queryFn: () => api.getPost(id),
      enabled: id > 0,
      staleTime: 1000 * 60 * 2,
    }),

  // query with filter params
  filtered: (filter: { userId?: number; limit?: number }) =>
    queryOptions({
      queryKey: ['posts', 'filtered', filter],
      queryFn: () => api.getFilteredPosts(filter),
    }),
};

// reuse for prefetch (in route loaders or SSR)
await queryClient.prefetchQuery(postQueries.list());

// reuse to read directly from cache
const posts = queryClient.getQueryData(postQueries.list().queryKey);
```

---

## useQuery — Full Options Reference

```typescript
const {
  data,           // resolved data on success
  error,          // error object on failure
  isPending,      // no data yet (initial load) — replaces isLoading from v4
  isFetching,     // actively fetching (including background refetch)
  isError,        // true when request failed
  isSuccess,      // true when request succeeded
  isStale,        // true when data is past staleTime
  refetch,        // manually trigger a refetch
  status,         // 'pending' | 'error' | 'success'
  fetchStatus,    // 'fetching' | 'paused' | 'idle'
} = useQuery({
  queryKey: ['posts', id],
  queryFn: () => api.getPost(id),

  // === common options ===
  enabled: id > 0,              // skip the request when false (Dependent Query)
  staleTime: 1000 * 60,         // how long data stays fresh (ms); 0 = stale immediately
  gcTime: 1000 * 60 * 5,        // how long unused cache is kept; default 5 minutes
  refetchInterval: 30000,       // polling interval (ms); false = no polling
  refetchOnWindowFocus: true,   // refetch when the window regains focus
  retry: 3,                     // number of retry attempts on failure
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000), // exponential backoff

  // select — transform or filter data to reduce re-renders
  select: (data) => data.filter(p => p.active),

  // placeholderData — show previous data while new data loads
  placeholderData: (previousData) => previousData, // keeps old data visible during param changes
});
```

---

## Dependent Queries

```typescript
function UserPosts({ userId }: { userId: number | undefined }) {
  // first query
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => api.getUser(userId!),
    enabled: !!userId,
  });

  // second query depends on the first result
  const { data: posts } = useQuery({
    queryKey: ['posts', 'by-user', user?.id],
    queryFn: () => api.getPostsByUser(user!.id),
    enabled: !!user,   // does not run until user is available
  });
}
```

---

## useMutation — Full Reference

```typescript
const {
  mutate,         // fire-and-forget trigger
  mutateAsync,    // returns a Promise — can be awaited
  isPending,      // true while mutation is running
  isSuccess,      // true after successful completion
  isError,        // true after failure
  error,          // error object on failure
  data,           // return value on success
  reset,          // reset mutation state back to idle
} = useMutation({
  mutationFn: api.createPost,

  onMutate: async (variables) => {
    // called before mutationFn (use for optimistic updates)
    // return value is passed to onError / onSettled as context
  },
  onSuccess: (data, variables, context) => {
    // called after successful mutation
  },
  onError: (error, variables, context) => {
    // called on failure (use for rollback)
  },
  onSettled: (data, error, variables, context) => {
    // called regardless of success or failure (use for invalidation)
  },
  retry: 0,       // mutations do not retry by default
});

// Usage
mutate(variables);                          // fire-and-forget
await mutateAsync(variables);               // await the result
mutate(variables, { onSuccess: () => {} }); // per-call callback override
```

---

## Optimistic Update — Full Pattern

```typescript
// hooks/useDeletePost.ts
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.deletePost,

    onMutate: async (deletedId: number) => {
      // 1. cancel any in-flight refetches to avoid overwriting optimistic state
      await queryClient.cancelQueries({ queryKey: ['posts'] });

      // 2. snapshot current cache for rollback
      const snapshot = queryClient.getQueryData<Post[]>(['posts']);

      // 3. optimistically update the cache
      queryClient.setQueryData<Post[]>(['posts'], (old = []) =>
        old.filter(p => p.id !== deletedId)
      );

      // 4. return snapshot so onError can roll back
      return { snapshot };
    },

    onError: (_err, _deletedId, context) => {
      // roll back to the snapshot on failure
      if (context?.snapshot) {
        queryClient.setQueryData(['posts'], context.snapshot);
      }
    },

    onSettled: () => {
      // always invalidate after settle to ensure consistency with the server
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
```

---

## Direct Cache Manipulation

```typescript
const queryClient = useQueryClient();

// read from cache
const posts = queryClient.getQueryData<Post[]>(['posts']);

// write to cache (no network request)
queryClient.setQueryData<Post[]>(['posts'], (old = []) => [...old, newPost]);

// invalidate cache (triggers a refetch)
queryClient.invalidateQueries({ queryKey: ['posts'] });

// invalidate a single entry by ID
queryClient.invalidateQueries({ queryKey: ['posts', postId] });

// invalidate all queries matching a key prefix
queryClient.invalidateQueries({ queryKey: ['posts'], exact: false });

// prefetch before the user navigates to the page
await queryClient.prefetchQuery(postQueries.detail(id));

// cancel in-flight requests
await queryClient.cancelQueries({ queryKey: ['posts'] });
```

---

## mutationOptions Factory (reusable mutation configs)

```typescript
// queries/postMutations.ts
import { mutationOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const postMutations = {
  create: (queryClient: QueryClient) =>
    mutationOptions({
      mutationKey: ['posts', 'create'],
      mutationFn: api.createPost,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
    }),

  delete: (queryClient: QueryClient) =>
    mutationOptions({
      mutationKey: ['posts', 'delete'],
      mutationFn: api.deletePost,
      onSettled: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
    }),
};

// Usage
function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation(postMutations.create(queryClient));
}
```

---

## select — Data Transformation and Performance

```typescript
// subscribe only to what you need — other field changes won't cause a re-render
const { data: titles } = useQuery({
  ...postQueries.list(),
  select: (posts) => posts.map(p => p.title),
});

// convert array to Map for O(1) lookups
const { data: postsById } = useQuery({
  ...postQueries.list(),
  select: (posts) => new Map(posts.map(p => [p.id, p])),
});
```

---

## Integration with TanStack Router (prefetch on hover/load)

```typescript
// prefetch in a route loader
export const Route = createFileRoute('/posts/$id')({
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(postQueries.detail(Number(params.id))),
  component: PostDetail,
});

// prefetch on Link hover
<Link
  to="/posts/$id"
  params={{ id: post.id }}
  onMouseEnter={() => queryClient.prefetchQuery(postQueries.detail(post.id))}
>
  {post.title}
</Link>
```

---

## Integration with React Hook Form

```tsx
function EditPostForm({ postId }: { postId: number }) {
  const queryClient = useQueryClient();

  // use query data as form default values
  const { data: post } = useQuery(postQueries.detail(postId));

  const { register, handleSubmit } = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    values: post,          // auto-populates the form once data loads
  });

  const { mutateAsync } = useMutation({
    mutationFn: (data: PostFormValues) => api.updatePost(postId, data),
    onSuccess: (updated) => {
      // write directly to cache to avoid an extra network request
      queryClient.setQueryData(postQueries.detail(postId).queryKey, updated);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  return (
    <form onSubmit={handleSubmit(data => mutateAsync(data))}>
      {/* fields */}
    </form>
  );
}
```

---

## v5 Breaking Changes Summary

| v4 | v5 |
|---|---|
| `useQuery(key, fn, opts)` | `useQuery({ queryKey, queryFn, ...opts })` |
| `useMutation(fn, opts)` | `useMutation({ mutationFn, ...opts })` |
| `isLoading` | `isPending` (no data yet on initial load) |
| `context` prop for isolation | pass a custom `queryClient` instance directly |
| — | `queryOptions()` factory (new) |
| — | `mutationOptions()` factory (new) |
