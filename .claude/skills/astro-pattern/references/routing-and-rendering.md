# Routing & Rendering (Astro v5)

---

## File-Based Routing

Files in `src/pages/` automatically become routes:

```
src/pages/
├── index.astro              → GET /
├── about.astro              → GET /about
├── contact.md               → GET /contact
├── blog/
│   ├── index.astro          → GET /blog
│   ├── [slug].astro         → GET /blog/:slug
│   └── [...path].astro      → GET /blog/* (catch-all)
├── api/
│   ├── posts.ts             → GET/POST /api/posts
│   └── posts/[id].ts        → GET/PUT/DELETE /api/posts/:id
└── 404.astro                → Custom 404 page
```

---

## Dynamic Routes (SSG)

```astro
---
// src/pages/blog/[slug].astro
import type { GetStaticPaths, InferGetStaticPropsType } from "astro";
import { getCollection, render } from "astro:content";

export const getStaticPaths = (async () => {
  const posts = await getCollection("blog");
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}) satisfies GetStaticPaths;

type Props = InferGetStaticPropsType<typeof getStaticPaths>;
const { post } = Astro.props;
const { Content } = await render(post);
---

<h1>{post.data.title}</h1>
<Content />
```

### Rest Parameters (Catch-All)

```astro
---
// src/pages/docs/[...slug].astro
// Matches: /docs/, /docs/getting-started, /docs/api/reference, etc.
const { slug } = Astro.params;
// slug === undefined | "getting-started" | "api/reference"
---
```

---

## Dynamic Routes (SSR)

```astro
---
// src/pages/blog/[slug].astro
// In SSR mode — no getStaticPaths needed
import { getEntry, render } from "astro:content";

const { slug } = Astro.params;
if (!slug) return Astro.redirect("/404");

const post = await getEntry("blog", slug);
if (!post) return Astro.redirect("/404");

const { Content } = await render(post);
---

<h1>{post.data.title}</h1>
<Content />
```

---

## Hybrid Rendering

In `output: 'hybrid'` mode, all pages are SSR by default. Opt-in to pre-rendering:

```astro
---
// This page is pre-rendered at build time
export const prerender = true;
---
```

In `output: 'server'` mode, opt individual pages in:

```astro
---
export const prerender = true; // This page is static
---
```

Or opt out in `output: 'static'` mode:

```astro
---
export const prerender = false; // This page is server-rendered
---
```

---

## API Endpoints

```typescript
// src/pages/api/posts.ts
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request, url }) => {
  const tag = url.searchParams.get("tag");

  return new Response(JSON.stringify({ posts: [] }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();

  if (!body.title) {
    return new Response(JSON.stringify({ error: "Title is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ id: crypto.randomUUID(), ...body }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};

// Handle all methods
export const ALL: APIRoute = async ({ request }) => {
  return new Response(`Method ${request.method} not supported`, {
    status: 405,
  });
};
```

### Dynamic API Route

```typescript
// src/pages/api/posts/[id].ts
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params }) => {
  const { id } = params;
  // fetch data by id...
  return new Response(JSON.stringify({ id }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const DELETE: APIRoute = async ({ params, redirect }) => {
  const { id } = params;
  // delete logic...
  return redirect("/posts", 303);
};
```

---

## Redirects

### Static Redirects (in config)

```typescript
// astro.config.mjs
export default defineConfig({
  redirects: {
    "/old-path": "/new-path",
    "/blog/[slug]": "/posts/[slug]", // Dynamic redirect
    "/old": {
      status: 301,
      destination: "/new",
    },
  },
});
```

### Server-Side Redirect

```astro
---
const user = await getUser(Astro.cookies.get("session")?.value);
if (!user) return Astro.redirect("/login", 302);
---
```

---

## Middleware

```typescript
// src/middleware.ts
import type { MiddlewareHandler } from "astro";
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, cookies, redirect } = context;

  // Auth check example
  const session = cookies.get("session");
  const isProtected = new URL(request.url).pathname.startsWith("/dashboard");

  if (isProtected && !session) {
    return redirect("/login");
  }

  // Add data to locals (available in all pages/endpoints)
  context.locals.user = session ? await getUser(session.value) : null;

  // Call next middleware / page handler
  const response = await next();

  // Optionally modify response
  response.headers.set("X-Custom-Header", "my-value");
  return response;
});
```

**Type augmentation for `Astro.locals`:**

```typescript
// src/env.d.ts
/// <reference path="../.astro/types.d.ts" />
declare namespace App {
  interface Locals {
    user: User | null;
  }
}
```

**Access in pages:**

```astro
---
const { user } = Astro.locals;
if (!user) return Astro.redirect("/login");
---

<p>Welcome, {user.name}!</p>
```

---

## Cookies

```astro
---
// Set cookie
Astro.cookies.set("session", token, {
  httpOnly: true,
  secure: import.meta.env.PROD,
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 7, // 1 week
  path: "/",
});

// Get cookie
const session = Astro.cookies.get("session");
const token = session?.value;
const data = session?.json<{ userId: string }>();

// Delete cookie
Astro.cookies.delete("session", { path: "/" });
---
```

---

## Pagination

```astro
---
// src/pages/blog/[page].astro  (or [...page] for optional)
import type { GetStaticPaths } from "astro";
import { getCollection } from "astro:content";

export const getStaticPaths = (async ({ paginate }) => {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return paginate(posts, {
    pageSize: 10,
    params: {}, // Additional route params
  });
}) satisfies GetStaticPaths;

const { page } = Astro.props;
---

<!-- page.data: current page entries --><!-- page.currentPage: 1-indexed page number --><!-- page.totalPages: total number of pages --><!-- page.url.prev: previous page URL or undefined --><!-- page.url.next: next page URL or undefined --><!-- page.url.first: first page URL --><!-- page.url.last: last page URL -->
<ul>
  {
    page.data.map((post) => (
      <li>
        <a href={`/blog/${post.id}`}>{post.data.title}</a>
      </li>
    ))
  }
</ul>

<nav>
  {page.url.prev && <a href={page.url.prev}>← Previous</a>}
  <span>Page {page.currentPage} of {page.totalPages}</span>
  {page.url.next && <a href={page.url.next}>Next →</a>}
</nav>
```

---

## Sitemap & RSS

```typescript
// astro.config.mjs
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://example.com",
  integrations: [
    sitemap({
      filter: (page) => !page.includes("/admin/"),
      changefreq: "weekly",
      priority: 0.7,
    }),
  ],
});
```

```typescript
// src/pages/rss.xml.ts
import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ site }) => {
  const posts = await getCollection("blog", ({ data }) => !data.draft);

  return rss({
    title: "My Blog",
    description: "My blog description",
    site: site!,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/blog/${post.id}/`,
    })),
  });
};
```

---

## Image Optimization

```astro
---
import { Image, Picture, getImage } from "astro:assets";
import heroImage from "../assets/hero.jpg";
---

<!-- Optimized image -->
<Image
  src={heroImage}
  alt="Hero"
  width={800}
  height={400}
  format="webp"
  quality={80}
/>

<!-- Responsive picture element -->
<Picture
  src={heroImage}
  alt="Hero"
  widths={[400, 800, 1200]}
  sizes="(max-width: 800px) 100vw, 800px"
  formats={["avif", "webp"]}
/>

<!-- Remote images -->
<Image
  src="https://example.com/image.jpg"
  alt="Remote"
  width={400}
  height={300}
/>
```

**Programmatic image generation:**

```typescript
const optimized = await getImage({
  src: heroImage,
  width: 800,
  format: "webp",
});
// optimized.src, optimized.attributes
```
