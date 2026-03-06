# Content Collections (Astro v5)

Content Collections is the recommended way to manage structured content (Markdown, MDX, JSON, YAML) in Astro v5.

---

## Setup: `src/content.config.ts`

```typescript
import { defineCollection, reference, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

// Blog: Markdown/MDX files
const blog = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/blog' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    cover: image().optional(),                  // Image with metadata
    coverAlt: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    author: reference('authors'),               // Reference another collection
    relatedPosts: z.array(reference('blog')).default([]),
  }),
});

// Authors: JSON files
const authors = defineCollection({
  loader: glob({ pattern: '**/[^_]*.json', base: './src/content/authors' }),
  schema: z.object({
    name: z.string(),
    bio: z.string().optional(),
    avatar: z.string().url().optional(),
    portfolio: z.string().url().optional(),
  }),
});

// Single file collection (e.g., navigation config)
const navigation = defineCollection({
  loader: file('./src/content/navigation.json'),
  schema: z.object({
    label: z.string(),
    href: z.string(),
    external: z.boolean().default(false),
  }),
});

export const collections = { blog, authors, navigation };
```

---

## Querying Collections

### Get All Entries

```typescript
import { getCollection } from 'astro:content';

// All published posts, sorted by date
const posts = await getCollection('blog', ({ data }) => !data.draft);
posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
```

### Get Single Entry

```typescript
import { getEntry } from 'astro:content';

const post = await getEntry('blog', 'my-post-slug');
if (!post) return Astro.redirect('/404');
```

### Render Content

```typescript
import { render } from 'astro:content';

const { Content, headings, remarkPluginFrontmatter } = await render(post);
// headings: { depth, slug, text }[]
// remarkPluginFrontmatter: any frontmatter modified by remark plugins
```

### Resolve References

```typescript
import { getEntry } from 'astro:content';

const post = await getEntry('blog', 'my-post');
// post.data.author is a reference — resolve it:
const author = await getEntry(post.data.author);
```

---

## Static Routes (SSG)

```astro
---
// src/pages/blog/[slug].astro
import type { GetStaticPaths } from 'astro';
import { getCollection, render } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.map(post => ({
    params: { slug: post.id },   // v5: use post.id, not post.slug
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content, headings } = await render(post);
---

<BaseLayout title={post.data.title}>
  <h1>{post.data.title}</h1>
  <time>{post.data.pubDate.toLocaleDateString('ja-JP')}</time>
  <Content />
</BaseLayout>
```

### Dynamic Tag Pages

```astro
---
// src/pages/tags/[tag].astro
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const allPosts = await getCollection('blog');
  const uniqueTags = [...new Set(allPosts.flatMap(p => p.data.tags))];

  return uniqueTags.map(tag => ({
    params: { tag },
    props: { posts: allPosts.filter(p => p.data.tags.includes(tag)) },
  }));
}

const { tag } = Astro.params;
const { posts } = Astro.props;
---
<h1>Tag: {tag}</h1>
<ul>
  {posts.map(post => (
    <li><a href={`/blog/${post.id}`}>{post.data.title}</a></li>
  ))}
</ul>
```

---

## SSR Dynamic Routes

```astro
---
// src/pages/blog/[slug].astro
import { getEntry, render } from 'astro:content';

// In SSR mode, no getStaticPaths needed
const { slug } = Astro.params;
if (!slug) return Astro.redirect('/404');

const post = await getEntry('blog', slug);
if (!post) return Astro.redirect('/404');

const { Content } = await render(post);
---
<h1>{post.data.title}</h1>
<Content />
```

---

## TypeScript Typing

```typescript
import type { CollectionEntry } from 'astro:content';

// Type a component prop
interface Props {
  post: CollectionEntry<'blog'>;
}

const { post } = Astro.props;
// post.id, post.data.title, etc. are fully typed
```

---

## MDX Custom Components

```astro
---
import { getEntry, render } from 'astro:content';
import CustomHeading from '../../components/CustomHeading.astro';
import CodeBlock from '../../components/CodeBlock.astro';

const entry = await getEntry('blog', 'my-post');
const { Content } = await render(entry);
---
<Content components={{
  h1: CustomHeading,
  pre: CodeBlock,
}} />
```

---

## Pagination

```astro
---
// src/pages/blog/[page].astro
import type { GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';

export const getStaticPaths: GetStaticPaths = async ({ paginate }) => {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
  return paginate(posts, { pageSize: 10 });
};

const { page } = Astro.props;
// page.data: entries for current page
// page.currentPage, page.totalPages
// page.url.prev, page.url.next
---
{page.data.map(post => <article>{post.data.title}</article>)}
<a href={page.url.prev}>← Previous</a>
<a href={page.url.next}>Next →</a>
```

---

## i18n Patterns

```typescript
// src/content.config.ts
const blog = defineCollection({
  // Supports nested structure: content/blog/en/post.md, content/blog/ja/post.md
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({ title: z.string(), lang: z.enum(['en', 'ja']) }),
});
```

```astro
---
// src/pages/[lang]/blog/[...slug].astro
export async function getStaticPaths() {
  const pages = await getCollection('blog');
  return pages.map(page => {
    const [lang, ...slug] = page.id.split('/');
    return { params: { lang, slug: slug.join('/') }, props: page };
  });
}
---
```

---

## Live Collections (Experimental, v5.x)

For data that changes frequently (CMS, APIs):

```typescript
// src/content.config.ts
import { defineLiveCollection } from 'astro:content';
import { storeLoader } from '@mystore/astro-loader';

const products = defineLiveCollection({
  loader: storeLoader({ apiKey: import.meta.env.STORE_API_KEY }),
});

export const collections = { products };
```

```astro
---
export const prerender = false; // Required for live collections

import { getLiveCollection, getLiveEntry } from 'astro:content';

const { entries: products, error } = await getLiveCollection('products');
if (error) console.error(error.message);

// Single entry
const { entry: product } = await getLiveEntry('products', Astro.params.id);
if (!product) return Astro.rewrite('/404');
---
```
