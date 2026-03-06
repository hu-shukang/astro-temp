# Islands Architecture & Components (Astro v5)

Astro renders everything to static HTML by default. Use `client:*` directives to add interactivity only where needed.

---

## Client Directives Reference

| Directive | Hydrates When | Priority | Best For |
|---|---|---|---|
| `client:load` | Page load immediately | High | Critical interactive UI |
| `client:idle` | After `requestIdleCallback` | Medium | Lower-priority UI |
| `client:visible` | Enters viewport | Low | Below-fold heavy components |
| `client:media="(q)"` | CSS media query matches | — | Responsive-only components |
| `client:only="fw"` | Immediately, no SSR | High | Browser-only (charts, maps) |
| `server:defer` | Server island deferred render | — | Personalized server content |

---

## client:load

```astro
---
import BuyButton from '../components/BuyButton.tsx';
---
<!-- Loads and hydrates immediately on page load -->
<BuyButton client:load />
```

## client:idle

```astro
---
import NewsletterForm from '../components/NewsletterForm.tsx';
---
<!-- Hydrates after page is idle — with optional timeout -->
<NewsletterForm client:idle />
<NewsletterForm client:idle={{ timeout: 500 }} />
```

## client:visible

```astro
---
import HeavyChart from '../components/HeavyChart.tsx';
---
<!-- Hydrates when component enters viewport -->
<HeavyChart client:visible />
<!-- With root margin for early hydration -->
<HeavyChart client:visible={{ rootMargin: "200px" }} />
```

## client:media

```astro
---
import MobileMenu from '../components/MobileMenu.tsx';
---
<!-- Only hydrates on mobile screens -->
<MobileMenu client:media="(max-width: 768px)" />
```

## client:only

```astro
---
import MapComponent from '../components/MapComponent.tsx';    // React
import CalendarWidget from '../components/Calendar.svelte';   // Svelte
---
<!-- Skip SSR — render only on client -->
<MapComponent client:only="react" />
<CalendarWidget client:only="svelte" />

<!-- With loading fallback -->
<MapComponent client:only="react">
  <div slot="fallback">Loading map...</div>
</MapComponent>
```

Supported framework values: `"react"`, `"preact"`, `"vue"`, `"svelte"`, `"solid-js"`

---

## server:defer (Server Islands)

Server islands allow parts of your page to be deferred and rendered independently on the server — useful for personalized or dynamic content without blocking the full page render.

```astro
---
// src/components/Avatar.astro
import { getUserAvatar } from '../sessions';
const userSession = Astro.cookies.get('session');
const avatarURL = await getUserAvatar(userSession);
---
<img alt="User avatar" src={avatarURL} />
```

```astro
---
// In a page
import Avatar from '../components/Avatar.astro';
---
<!-- Avatar renders deferred, independently from page -->
<Avatar server:defer>
  <svg slot="fallback" class="generic-avatar"><!-- placeholder --></svg>
</Avatar>
```

---

## Framework Components

### React (`.tsx`, `.jsx`)

```tsx
// src/components/Counter.tsx
import { useState } from 'react';

interface Props {
  initialCount?: number;
}

export default function Counter({ initialCount = 0 }: Props) {
  const [count, setCount] = useState(initialCount);
  return (
    <div>
      <button onClick={() => setCount(c => c - 1)}>-</button>
      <span>{count}</span>
      <button onClick={() => setCount(c => c + 1)}>+</button>
    </div>
  );
}
```

```astro
---
import Counter from '../components/Counter.tsx';
---
<Counter initialCount={5} client:load />
```

### Passing Data to Client Components

In v5, you cannot use `astro:content` APIs directly on the client. Pass data via props:

```astro
---
import { getCollection } from 'astro:content';
import PostList from '../components/PostList.tsx';  // React component

const posts = await getCollection('blog');
const postsData = posts.map(p => ({
  id: p.id,
  title: p.data.title,
  pubDate: p.data.pubDate.toISOString(),
}));
---
<PostList posts={postsData} client:load />
```

---

## View Transitions

Enable smooth page transitions with the `ClientRouter` (renamed from `ViewTransitions` in v5):

```astro
---
// src/layouts/BaseLayout.astro
import { ClientRouter } from 'astro:transitions';
---
<html>
  <head>
    <ClientRouter />
  </head>
  <body>
    <slot />
  </body>
</html>
```

### Named Transitions

```astro
<!-- Blog list page -->
<img src={post.data.cover} transition:name={`cover-${post.id}`} />
<h2 transition:name={`title-${post.id}`}>{post.data.title}</h2>

<!-- Blog detail page (same transition:name = morphs between pages) -->
<img src={post.data.cover} transition:name={`cover-${post.id}`} />
<h1 transition:name={`title-${post.id}`}>{post.data.title}</h1>
```

### Persist Interactive Islands Across Navigation

```astro
<!-- Counter persists state across page navigations -->
<Counter client:load transition:persist />

<!-- Persist island but update its props -->
<Counter client:load transition:persist initialCount={5} />

<!-- Persist island AND keep old props (don't update) -->
<Counter client:load transition:persist transition:persist-props initialCount={5} />
```

### Programmatic Navigation

```typescript
import { navigate } from 'astro:transitions/client';

// Navigate programmatically
await navigate('/new-page');
await navigate('/new-page', { history: 'replace' });
```

---

## Slots

```astro
---
// src/components/Card.astro
---
<div class="card">
  <div class="card-header">
    <slot name="header">Default Header</slot>  <!-- named slot with fallback -->
  </div>
  <div class="card-body">
    <slot />                                    <!-- default slot -->
  </div>
  <div class="card-footer">
    <slot name="footer" />
  </div>
</div>
```

```astro
---
import Card from '../components/Card.astro';
---
<Card>
  <h2 slot="header">My Card Title</h2>
  <p>Card body content</p>
  <button slot="footer">Action</button>
</Card>
```

---

## Scoped Styles & Global Styles

```astro
<style>
  /* Scoped to this component only */
  h1 { color: blue; }
</style>

<style is:global>
  /* Global CSS */
  :root { --primary: oklch(50% 0.2 240); }
</style>
```

---

## define:vars — Pass Server Variables to Client

```astro
---
const theme = 'dark';
const accentColor = '#3b82f6';
---

<style define:vars={{ theme, accentColor }}>
  .button {
    background: var(--accentColor);
  }
</style>

<script define:vars={{ theme }}>
  // Runs on client with server values baked in
  document.body.dataset.theme = theme;
  // Note: define:vars implies is:inline on scripts
</script>
```

---

## Multiple JSX Frameworks

When using more than one JSX framework in the same project:

```typescript
// astro.config.mjs
import react from '@astrojs/react';
import preact from '@astrojs/preact';
import solid from '@astrojs/solid-js';

export default defineConfig({
  integrations: [
    react({ include: ['**/react/**'] }),
    preact({ include: ['**/preact/**'] }),
    solid({ include: ['**/solid/**'] }),
  ],
});
```

Organize components by framework:
```
src/components/
├── react/       ← React components
├── preact/      ← Preact components  
└── solid/       ← SolidJS components
```
