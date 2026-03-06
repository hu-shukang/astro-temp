# Mocking Reference — MSW, vi.mock, vi.fn, vi.spyOn

---

## When to Use Which Mock

| Scenario | Tool |
|---|---|
| HTTP API calls | MSW (`http.get`, `http.post`, etc.) |
| GraphQL requests | MSW (`graphql.query`, `graphql.mutation`) |
| Entire module replacement | `vi.mock('@/lib/something')` |
| Partial module override | `vi.mock` + `importOriginal` |
| Spy on existing function | `vi.spyOn(object, 'method')` |
| Standalone callback / handler | `vi.fn()` |
| Environment variables | `vi.stubEnv('KEY', 'value')` |
| Global objects | `vi.stubGlobal('fetch', mockFn)` |
| Time / dates | `vi.useFakeTimers()` |
| File system | `memfs` |

---

## MSW — HTTP Mocking

### Setup handlers

```typescript
// tests/msw/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/users', () =>
    HttpResponse.json([
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
    ])
  ),

  http.post('/api/users', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ id: '3', ...body }, { status: 201 })
  }),

  http.delete('/api/users/:id', ({ params }) => {
    return HttpResponse.json({ deleted: params.id })
  }),
]
```

### Override handlers per test

```typescript
import { server } from '../msw/server'
import { http, HttpResponse } from 'msw'

test('shows error on API failure', () => {
  server.use(
    http.get('/api/users', () =>
      HttpResponse.json({ message: 'Server error' }, { status: 500 })
    )
  )
  // handler is reset automatically after each test via afterEach
})
```

### GraphQL mocking

```typescript
import { graphql, HttpResponse } from 'msw'

export const handlers = [
  graphql.query('GetUser', ({ variables }) =>
    HttpResponse.json({
      data: { user: { id: variables.id, name: 'Alice' } },
    })
  ),

  graphql.mutation('CreateUser', ({ variables }) =>
    HttpResponse.json({
      data: { createUser: { id: '99', name: variables.name } },
    })
  ),
]
```

### WebSocket mocking

```typescript
import { ws } from 'msw'

const chat = ws.link('wss://chat.example.com')

export const handlers = [
  chat.addEventListener('connection', ({ client }) => {
    client.send(JSON.stringify({ type: 'welcome', text: 'Connected!' }))

    client.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data)
      client.send(JSON.stringify({ type: 'echo', text: msg.text }))
    })
  }),
]
```

---

## vi.mock — Module Mocking

### Mock entire module

```typescript
vi.mock('@/lib/analytics')

test('tracks page view', () => {
  const { trackPageView } = await import('@/lib/analytics')
  // all exports are auto-mocked as vi.fn()
  expect(vi.mocked(trackPageView)).not.toHaveBeenCalled()
})
```

### Mock with partial override

```typescript
vi.mock('@/lib/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth')>()
  return {
    ...actual,                         // keep real implementations
    getCurrentUser: vi.fn(),           // override only this
  }
})
```

### Mock with factory return value

```typescript
vi.mock('@/lib/config', () => ({
  config: {
    apiUrl: 'https://test.api.example.com',
    timeout: 5000,
  },
}))
```

### Module mock hoisting

`vi.mock` calls are automatically hoisted to the top of the file. To avoid confusion, declare them before imports or use `vi.doMock` for dynamic mocking:

```typescript
// vi.doMock is NOT hoisted — useful for conditional mocking
beforeEach(async () => {
  vi.doMock('@/lib/feature-flags', () => ({
    isEnabled: vi.fn().mockReturnValue(true),
  }))
})
```

---

## vi.spyOn — Spy on Existing Functions

```typescript
import { vi, expect, test, afterEach } from 'vitest'
import * as storage from '@/lib/storage'

afterEach(() => vi.restoreAllMocks())

test('saves data on submit', async () => {
  const saveSpy = vi.spyOn(storage, 'saveItem').mockResolvedValue(undefined)

  await submitForm({ name: 'Alice' })

  expect(saveSpy).toHaveBeenCalledWith('form-data', { name: 'Alice' })
})

test('throws when save fails', async () => {
  vi.spyOn(storage, 'saveItem').mockRejectedValue(new Error('Disk full'))

  await expect(submitForm({ name: 'Alice' })).rejects.toThrow('Disk full')
})
```

---

## vi.fn — Standalone Mock Functions

```typescript
test('calls callback with result', () => {
  const onSuccess = vi.fn()
  const onError = vi.fn()

  processData({ value: 42 }, { onSuccess, onError })

  expect(onSuccess).toHaveBeenCalledOnce()
  expect(onSuccess).toHaveBeenCalledWith({ processed: 42 })
  expect(onError).not.toHaveBeenCalled()
})

// With implementation
const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ data: 'test' }),
})
```

---

## Environment Variables

```typescript
import { vi, it, expect, afterEach } from 'vitest'
import { getConfig } from '@/config'

afterEach(() => vi.unstubAllEnvs())

it('uses PUBLIC_API_URL', () => {
  vi.stubEnv('PUBLIC_API_URL', 'https://api.test.com')
  expect(getConfig().apiUrl).toBe('https://api.test.com')
})

it('falls back when env is missing', () => {
  vi.stubEnv('PUBLIC_API_URL', '')
  expect(getConfig().apiUrl).toBe('https://api.example.com') // default
})
```

---

## Global Objects

```typescript
import { vi, it, expect, afterEach } from 'vitest'

afterEach(() => vi.unstubAllGlobals())

it('uses window.location', () => {
  vi.stubGlobal('location', { href: 'https://example.com/dashboard' })
  expect(getCurrentPath()).toBe('/dashboard')
})

it('intercepts fetch', async () => {
  const mockFetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ ok: true }))
  )
  vi.stubGlobal('fetch', mockFetch)

  await callApi('/endpoint')

  expect(mockFetch).toHaveBeenCalledWith('/endpoint', expect.any(Object))
})
```

---

## Fake Timers

```typescript
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { debounce } from '@/utils/debounce'

describe('debounce', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('delays execution', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 300)

    debounced()
    debounced()
    debounced()

    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(300)

    expect(fn).toHaveBeenCalledOnce()
  })

  it('supports setInterval', () => {
    const fn = vi.fn()
    setInterval(fn, 1000)

    vi.advanceTimersByTime(3500)

    expect(fn).toHaveBeenCalledTimes(3)
  })
})
```

---

## File System Mocking with memfs

```typescript
import { vi, it, expect } from 'vitest'
import { Volume } from 'memfs'

vi.mock('fs', async () => {
  const memfs = await import('memfs')
  const vol = new memfs.Volume()
  vol.fromJSON({
    '/data/config.json': JSON.stringify({ theme: 'dark' }),
    '/data/users.txt': 'Alice\nBob\n',
  })
  return { default: memfs.createFsFromVolume(vol) }
})

it('reads config file', async () => {
  const { readConfig } = await import('@/utils/config')
  const config = readConfig('/data/config.json')
  expect(config.theme).toBe('dark')
})
```

---

## Mock Assertion Cheatsheet

```typescript
// Call counts
expect(fn).toHaveBeenCalled()
expect(fn).toHaveBeenCalledOnce()
expect(fn).toHaveBeenCalledTimes(3)
expect(fn).not.toHaveBeenCalled()

// Call arguments
expect(fn).toHaveBeenCalledWith('arg1', 42)
expect(fn).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }))
expect(fn).toHaveBeenLastCalledWith('last', 'call')
expect(fn).toHaveBeenNthCalledWith(2, 'second', 'call')

// Return values
expect(fn).toHaveReturnedWith('value')
expect(fn).toHaveLastReturnedWith('value')

// Reset
vi.clearAllMocks()       // clear call history only
vi.resetAllMocks()       // clear + reset return values
vi.restoreAllMocks()     // clear + restore original implementations (spies)
```
