# Astro Actions (astro@4.15+)

Actions are Astro's type-safe backend function system. Compared to hand-written API endpoints, they automatically handle JSON parsing, form data, and Zod validation — drastically reducing boilerplate.

---

## Basic Structure

Actions must be defined in `src/actions/index.ts` and exported from the `server` object:

```typescript
// src/actions/index.ts
import { defineAction, ActionError } from "astro:actions";
import { z } from "astro/zod";

export const server = {
  getGreeting: defineAction({
    input: z.object({
      name: z.string(),
    }),
    handler: async (input, context) => {
      // context exposes: cookies, locals, request, etc.
      return `Hello, ${input.name}!`;
    },
  }),
};
```

---

## Calling from the Client (JSON Mode)

```typescript
// Inside a <script> tag or UI framework component
import { actions } from "astro:actions";

const { data, error } = await actions.getGreeting({ name: "Houston" });

if (error) {
  console.error(error.code, error.message);
} else {
  console.log(data); // "Hello, Houston!"
}

// Use .orThrow() to get data directly — throws on error instead of returning an error object
const greeting = await actions.getGreeting.orThrow({ name: "Houston" });
```

### Inside a React/Preact Component

```tsx
import { actions } from "astro:actions";
import { useState } from "react";

export function LikeButton({ postId }: { postId: string }) {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
      {showLogin && <a href="/signin">Log in to like a post.</a>}
      <button
        onClick={async () => {
          const { data, error } = await actions.likePost({ postId });
          if (error?.code === "UNAUTHORIZED") setShowLogin(true);
          else if (error) return;
          // update UI...
        }}
      >
        Like
      </button>
    </>
  );
}
```

---

## Error Handling

### ActionError — Standardized Errors

```typescript
import { defineAction, ActionError } from "astro:actions";

export const server = {
  likePost: defineAction({
    input: z.object({ postId: z.string() }),
    handler: async (input, context) => {
      // Auth check
      if (!context.locals.user) {
        throw new ActionError({
          code: "UNAUTHORIZED",
          message: "User must be logged in.",
        });
      }
      // Not found
      const post = await db.getPost(input.postId);
      if (!post) {
        throw new ActionError({ code: "NOT_FOUND" });
      }
      return await db.likePost(input.postId);
    },
  }),
};
```

**Common error codes:** `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `BAD_REQUEST`, `INTERNAL_SERVER_ERROR`

---

## Organizing Actions

For larger projects, split actions into feature files:

```typescript
// src/actions/user.ts
import { defineAction } from "astro:actions";
export const user = {
  getUser: defineAction(/* ... */),
  createUser: defineAction(/* ... */),
};

// src/actions/blog.ts
import { defineAction } from "astro:actions";
export const blog = {
  like: defineAction(/* ... */),
  comment: defineAction(/* ... */),
};

// src/actions/index.ts
import { user } from "./user";
import { blog } from "./blog";

export const server = { user, blog };
```

Called as: `actions.user.getUser()`, `actions.blog.like()`

> ⚠️ Actions are exposed as public endpoints (e.g. `/_actions/blog.like`). Always perform auth checks inside the handler — never rely on obscurity.

---

## Form Data Support

### `accept: 'form'` — Accept Form Submissions

```typescript
export const server = {
  newsletter: defineAction({
    accept: "form", // Accept FormData
    input: z.object({
      email: z.string().email(),
      terms: z.boolean(), // checkbox → boolean
      age: z.coerce.number(), // number input → number
      avatar: z.instanceof(File), // file input
      tags: z.array(z.string()), // multiple inputs with the same name
    }),
    handler: async ({ email, terms }) => {
      // ...
    },
  }),
};
```

**Astro's implicit type coercions:**

- `type="number"` → use `z.number()` directly
- `type="checkbox"` → `z.coerce.boolean()`
- `type="file"` → `z.instanceof(File)`
- Empty submitted values → `null` (not an empty string)

### Submitting a Form via Script

```astro
<form>
  <input required type="email" name="email" />
  <input required type="checkbox" name="terms" />
  <button>Sign up</button>
</form>

<script>
  import { actions, isInputError } from "astro:actions";
  import { navigate } from "astro:transitions/client";

  const form = document.querySelector("form");
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const { data, error } = await actions.newsletter(formData);

    if (isInputError(error)) {
      // Field-level validation errors
      if (error.fields.email) {
        console.error(error.fields.email.join(", "));
      }
    } else if (!error) {
      navigate("/confirmation");
    }
  });
</script>
```

---

## HTML Form Action (Zero-JS Submission)

Native form submission without JavaScript — ideal for progressive enhancement:

```astro
---
// src/pages/contact.astro
import { actions, isInputError } from "astro:actions";

// Read the result of the last submission on the server
const result = Astro.getActionResult(actions.newsletter);
const inputErrors = isInputError(result?.error) ? result.error.fields : {};
---

{result?.error && <p class="error">Submission failed. Please try again.</p>}

<form method="POST" action={actions.newsletter}>
  <label>
    E-mail
    <input required type="email" name="email" aria-describedby="email-error" />
    {
      inputErrors.email && (
        <p id="email-error">{inputErrors.email.join(", ")}</p>
      )
    }
  </label>
  <button>Sign up</button>
</form>
```

### Redirect on Success

```astro
---
import { actions } from "astro:actions";

const result = Astro.getActionResult(actions.createProduct);
if (result && !result.error) {
  return Astro.redirect(`/products/${result.data.id}`);
}
---

<form method="POST" action={actions.createProduct}>
  <!-- ... -->
</form>
```

### File Upload

```astro
<form method="POST" action={actions.upload} enctype="multipart/form-data">
  <input type="file" name="file" />
  <button>Upload</button>
</form>
```

### Preserve Input Values After Submission Error

```astro
<input transition:persist required type="email" name="email" />
```

---

## Calling Actions from Astro Components / Server Endpoints

Use `Astro.callAction()` to reuse action logic on the server side:

```astro
---
import { actions } from "astro:actions";

const searchQuery = Astro.url.searchParams.get("search");
if (searchQuery) {
  const { data, error } = await Astro.callAction(actions.findProduct, {
    query: searchQuery,
  });
  // handle result...
}
---
```

Inside an API endpoint:

```typescript
// src/pages/api/search.ts
import type { APIRoute } from "astro";
import { actions } from "astro:actions";

export const GET: APIRoute = async (context) => {
  const query = context.url.searchParams.get("q") ?? "";
  const { data, error } = await context.callAction(actions.findProduct, {
    query,
  });
  if (error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    });
  return new Response(JSON.stringify(data));
};
```

---

## Client-Side Redirect After Action

```tsx
import { actions } from "astro:actions";
import { navigate } from "astro:transitions/client";

export function LogoutButton() {
  return (
    <button
      onClick={async () => {
        const { error } = await actions.logout();
        if (!error) navigate("/");
      }}
    >
      Logout
    </button>
  );
}
```

---

## Security & Authorization

### Auth Check Inside the Handler (Recommended)

```typescript
export const server = {
  getUserSettings: defineAction({
    handler: async (_input, context) => {
      // Read user info set by middleware via locals
      if (!context.locals.user) {
        throw new ActionError({ code: "UNAUTHORIZED" });
      }
      return {
        /* ... */
      };
    },
  }),
};
```

### Gating All Actions from Middleware (astro@5.0+)

```typescript
// src/middleware.ts
import { defineMiddleware } from "astro:middleware";
import { getActionContext } from "astro:actions";

export const onRequest = defineMiddleware(async (context, next) => {
  const { action } = getActionContext(context);

  // Only intercept client-side RPC calls (not HTML form submissions)
  if (action?.calledFrom === "rpc") {
    if (!context.cookies.has("user-session")) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  return next();
});
```

---

## POST / Redirect / GET Pattern (astro@5.0+)

Eliminates the "Confirm Form Resubmission?" dialog on page refresh:

```typescript
// src/middleware.ts
import { defineMiddleware } from "astro:middleware";
import { getActionContext } from "astro:actions";

export const onRequest = defineMiddleware(async (context, next) => {
  if (context.isPrerendered) return next();

  const { action, setActionResult, serializeActionResult } =
    getActionContext(context);

  // Restore a previously stored action result from session
  const sessionId = context.cookies.get("action-session-id")?.value;
  if (sessionId) {
    const session = await getSessionFromStore(sessionId);
    if (session) {
      setActionResult(session.actionName, session.actionResult);
      await deleteSession(sessionId);
      context.cookies.delete("action-session-id");
      return next();
    }
  }

  // On HTML form submission: run handler → store result → redirect
  if (action?.calledFrom === "form") {
    const actionResult = await action.handler();
    const id = crypto.randomUUID();
    await saveToStore(id, {
      actionName: action.name,
      actionResult: serializeActionResult(actionResult),
    });
    context.cookies.set("action-session-id", id);

    // On error: redirect back to the referring page
    if (actionResult.error) {
      return context.redirect(context.request.headers.get("Referer") ?? "/");
    }
    // On success: redirect to the current path (triggers a GET)
    return context.redirect(context.originPathname);
  }

  return next();
});
```

---

## Actions vs. API Endpoints

|                     | Actions                    | API Endpoints                              |
| ------------------- | -------------------------- | ------------------------------------------ |
| Type safety         | ✅ Auto-generated          | ❌ Manual                                  |
| Zod validation      | ✅ Built-in                | ❌ Must write manually                     |
| Form data support   | ✅ `accept: 'form'`        | ❌ Manual parsing                          |
| Standardized errors | ✅ `ActionError`           | ❌ Custom handling                         |
| Best for            | Client interactions, forms | Public REST APIs, third-party integrations |
