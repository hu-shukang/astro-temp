---
name: astro-pattern
description: Best practices, patterns, and implementation guidance for building Astro websites and applications. Use this skill whenever working with Astro projects — including project setup, content collections, routing, islands architecture, component authoring, SSR/SSG configuration, TypeScript integration, integrations (React, Vue, Svelte, etc.), view transitions, and deployment. Trigger this skill for any task involving .astro files, astro.config.mjs, content.config.ts, astro:content APIs, client directives, server islands, or Astro-specific build/deploy questions. Also use when comparing Astro with other frameworks or planning a migration to Astro.
---

# Astro Pattern Skill

Comprehensive guidance for building with Astro (v5+). Covers project structure, content collections, islands architecture, routing, SSR/SSG, TypeScript, integrations, and deployment.

> **Reference files**: For detailed examples, see `references/` directory:
> - `content-collections.md` — Content Collections (v5 API)
> - `islands-and-components.md` — Islands Architecture & Client Directives
> - `routing-and-rendering.md` — Routing, SSR/SSG, API Endpoints
> - `actions.md` — Astro Actions (type-safe server functions)

---

## Project Structure

```
my-astro-project/
├── src/
│   ├── pages/           # File-based routing (.astro, .md, .mdx, .ts)
│   ├── content/         # Content files (Markdown, MDX, JSON, YAML)
│   ├── components/      # Reusable components (.astro, .tsx, .svelte, etc.)
│   ├── layouts/         # Layout components
│   ├── assets/          # Processed assets (images, fonts)
│   └── content.config.ts # Content collection definitions
├── public/              # Static assets (served as-is)
├── astro.config.mjs     # Astro configuration
├── tsconfig.json        # TypeScript configuration
└── package.json
```

---

## Configuration (`astro.config.mjs`)

```typescript
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://example.com',
  output: 'static',        // 'static' | 'server' | 'hybrid'
  integrations: [react(), mdx(), sitemap()],
  vite: {
    plugins: [],           // Custom Vite plugins
  },
});
```

**Output modes:**
- `static` (default) — Full SSG, pre-render all pages at build time
- `server` — Full SSR, render all pages on demand (requires adapter)
- `hybrid` — Mix: SSR by default, opt-in to pre-rendering with `export const prerender = true`

**Common adapters for SSR:**
```bash
npx astro add netlify   # Netlify adapter
npx astro add vercel    # Vercel adapter
npx astro add node      # Node.js adapter (self-hosted)
```

---

## Astro Components (`.astro` files)

Components have two parts: a **frontmatter script** (server-only) and an **HTML template**.

```astro
---
// Frontmatter: runs on the server only (or at build time)
import MyComponent from '../components/MyComponent.astro';
import { getCollection } from 'astro:content';

interface Props {
  title: string;
  description?: string;
}

const { title, description = 'Default description' } = Astro.props;
const posts = await getCollection('blog');
---

<!-- Template: HTML with embedded expressions -->
<html lang="ja">
  <head>
    <title>{title}</title>
    <meta name="description" content={description} />
  </head>
  <body>
    <MyComponent />
    <ul>
      {posts.map(post => (
        <li><a href={`/blog/${post.id}`}>{post.data.title}</a></li>
      ))}
    </ul>
  </body>
</html>

<style>
  /* Scoped CSS — only applies to this component */
  h1 { color: oklch(50% 0.2 240); }
</style>
```

**Key `Astro` global object:**

| Property | Description |
|---|---|
| `Astro.props` | Component props |
| `Astro.params` | Dynamic route parameters |
| `Astro.request` | Request object (SSR) |
| `Astro.cookies` | Cookie API |
| `Astro.url` | Current page URL |
| `Astro.redirect(url)` | Server-side redirect |
| `Astro.rewrite(url)` | Server-side rewrite |

---

## TypeScript Configuration

**`tsconfig.json`** — use Astro's base template:

```json
{
  "extends": "astro/tsconfigs/base",
  "compilerOptions": {
    "paths": {
      "@components/*": ["./src/components/*"],
      "@layouts/*":    ["./src/layouts/*"],
      "@assets/*":     ["./src/assets/*"]
    }
  }
}
```

Strictness options: `"astro/tsconfigs/base"`, `"astro/tsconfigs/strict"`, `"astro/tsconfigs/strictest"`

---

## Content Collections (v5)

> See `references/content-collections.md` for detailed patterns.

**Quick reference:**

```typescript
// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
```

```typescript
// In page component
import { getCollection, getEntry, render } from 'astro:content';

// Get all (filter drafts)
const posts = await getCollection('blog', ({ data }) => !data.draft);

// Get single entry
const post = await getEntry('blog', 'my-post-id');
const { Content, headings } = await render(post);
```

> ⚠️ **v5 Breaking Change**: Use `post.id` not `post.slug` for routing.

---

## Islands Architecture & Client Directives

> See `references/islands-and-components.md` for detailed patterns.

Astro renders everything as static HTML by default. Add interactivity with `client:*` directives:

| Directive | When it hydrates | Use case |
|---|---|---|
| `client:load` | Immediately on page load | High-priority interactive UI |
| `client:idle` | After `requestIdleCallback` | Lower-priority UI |
| `client:visible` | When entering viewport | Below-the-fold content |
| `client:media="(query)"` | When CSS media query matches | Responsive components |
| `client:only="framework"` | Immediately, skip SSR | Browser-only components |
| `server:defer` | Server island (deferred SSR) | Personalized server content |

```astro
---
import Counter from '../components/Counter.tsx';
import HeavyChart from '../components/HeavyChart.tsx';
import Avatar from '../components/Avatar.astro';
---
<Counter client:load />
<HeavyChart client:visible />
<Avatar server:defer>
  <div slot="fallback">Loading...</div>
</Avatar>
```

---

## Routing

> See `references/routing-and-rendering.md` for detailed patterns.

File-based routing in `src/pages/`:

```
src/pages/
├── index.astro          → /
├── about.astro          → /about
├── blog/
│   ├── index.astro      → /blog
│   └── [slug].astro     → /blog/:slug  (dynamic)
├── docs/
│   └── [...slug].astro  → /docs/*      (catch-all)
└── api/
    └── posts.ts         → /api/posts   (API endpoint)
```

---

## Common Patterns

### Page with Layout

```astro
---
// src/pages/index.astro
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="Home">
  <h1>Welcome</h1>
  <slot />  <!-- content goes here in layout -->
</BaseLayout>
```

### Image Optimization

```astro
---
import { Image } from 'astro:assets';
import heroImage from '../assets/hero.jpg';
---
<Image src={heroImage} alt="Hero" width={800} height={400} format="webp" />
```

### Environment Variables

```typescript
// Access in frontmatter (server-side only)
const apiKey = import.meta.env.API_KEY;

// Client-safe variables must be prefixed with PUBLIC_
const publicKey = import.meta.env.PUBLIC_ANALYTICS_ID;
```

### View Transitions (v5)

```astro
---
import { ClientRouter } from 'astro:transitions';  // v5: renamed from ViewTransitions
---
<head>
  <ClientRouter />
</head>
```

```astro
<!-- Named transition elements -->
<img src={cover} transition:name={`cover-${post.id}`} />
<h1 transition:name={`title-${post.id}`}>{title}</h1>
```

---

## Astro Actions (astro@4.15+)

> See `references/actions.md` for detailed patterns.

Type-safe backend functions that replace boilerplate API endpoints — Zod validation, JSON/form parsing, and error standardization built in.

```typescript
// src/actions/index.ts
import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro/zod';

export const server = {
  likePost: defineAction({
    input: z.object({ postId: z.string() }),
    handler: async (input, context) => {
      if (!context.locals.user) {
        throw new ActionError({ code: 'UNAUTHORIZED' });
      }
      return await db.likePost(input.postId);
    },
  }),
};
```

**Calling from the client:**

```typescript
import { actions } from 'astro:actions';

const { data, error } = await actions.likePost({ postId: '123' });
if (error?.code === 'UNAUTHORIZED') { /* handle */ }
```

**Quick reference:**

| Feature | Syntax |
|---|---|
| JSON input validation | `input: z.object({...})` |
| Accept form data | `accept: 'form'` |
| Throw error | `throw new ActionError({ code: 'NOT_FOUND' })` |
| Skip error wrapper | `await actions.foo.orThrow(input)` |
| HTML form submission | `<form method="POST" action={actions.foo}>` |
| Read form result | `Astro.getActionResult(actions.foo)` |
| Call from server | `Astro.callAction(actions.foo, input)` |
| Middleware gating | `getActionContext(context)` |
| Field-level errors | `isInputError(error)` → `error.fields` |

---

## Adding Integrations

```bash
# Auto-install with astro add
npx astro add react        # React support
npx astro add vue          # Vue support  
npx astro add tailwind     # Tailwind CSS
npx astro add mdx          # MDX support
npx astro add sitemap      # Sitemap generation
npx astro add db           # Astro DB (SQLite)
```

Multiple JSX frameworks require `include` scoping:
```typescript
integrations: [
  react({ include: ['**/react/*'] }),
  preact({ include: ['**/preact/*'] }),
  solid({ include: ['**/solid/*'] }),
]
```

---

## Deployment Checklist

1. Set `site` in `astro.config.mjs` to your production URL
2. Choose `output` mode (`static`, `server`, or `hybrid`)
3. Install adapter if using SSR: `npx astro add <adapter>`
4. Set environment variables in your host's dashboard
5. Build command: `npm run build` → outputs to `./dist/`
6. For static: serve `./dist/` directory
7. For SSR: follow adapter-specific instructions

---

## Key v5 Migration Notes

| v4 | v5 |
|---|---|
| `post.slug` | `post.id` |
| `type: 'content'` in `defineCollection` | Use `loader:` instead |
| `ViewTransitions` from `astro:transitions` | `ClientRouter` |
| `src/content/config.ts` | `src/content.config.ts` |
| `import.meta.glob()` for content | `getCollection()` with loader |
