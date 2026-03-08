# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (http://localhost:4321)
npm run build     # Build for production (output to dist/)
npm run preview   # Preview production build
npm run lint      # Run ESLint with auto-fix
npm run format    # Run Prettier formatter
```

## Tech Stack

- **Astro 5** - Static site generator with file-based routing (`src/pages/`)
- **React 19** - UI component library via `@astrojs/react` integration
- **Tailwind CSS v4** - Styling via `@tailwindcss/vite` Vite plugin (imported in `src/styles/global.css`)
- **Zustand** - Global state management
- **Recharts** - Chart components
- **react-hook-form** - Form handling
- **date-fns** - Date utility library
- **clsx** - Conditional class name utility
- **Vitest** - Unit testing framework with coverage via `@vitest/coverage-v8`
- **ESLint** - Linter with TypeScript and Astro support
- **Prettier** - Code formatter with Astro, Tailwind, and organize-imports plugins

## Architecture

- `src/pages/` - Astro file-based routes (`.astro` files become URL routes)
- `src/layouts/` - Shared page layouts (wrap page content via `<slot />`)
- `src/components/` - Reusable components (can be `.astro` or React `.tsx`)
- `src/styles/global.css` - Global styles entry point with Tailwind import

## Workflow

### Planning Before Implementation

**Always plan before implementing.** Before starting any feature implementation, a plan must be created and confirmed by the user.

1. **Use `/plan` mode to create a plan** — Save plan results to the `plans/` folder, categorized by type:
   - `plans/business/` — Business requirement plans (feature specs, user stories, acceptance criteria)
   - `plans/uiux/` — UI/UX plans (page structure, interaction design, component design)
   - `plans/technical/` — Technical implementation plans (architecture, data structures, API design)

2. **Wait for user confirmation** — After the plan is complete, wait for explicit user confirmation (e.g., "OK", "start implementing") before writing any code.

3. **Update plan status after implementation** — Once a feature is implemented, mark the relevant items in the plan file as completed (using `[x]` checkboxes or `✅` status markers).

### Plan File Format

Plan files use Markdown format with `kebab-case` filenames, for example:

- `plans/business/electricity-usage-feature.md`
- `plans/uiux/dashboard-redesign.md`
- `plans/technical/auth-flow.md`

## Code Style

ESLint + Prettier enforces code style. Prettier handles formatting (via `prettier-plugin-astro`, `prettier-plugin-tailwindcss`, `prettier-plugin-organize-imports`). ESLint handles linting with TypeScript and Astro rules.

React components can be used directly in `.astro` files. Tailwind classes work in both `.astro` and React `.tsx` files.
