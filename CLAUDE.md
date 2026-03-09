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

**Always plan before implementing.** Planning is divided into 3 sequential steps. Each step must be confirmed by the user before proceeding to the next. Steps cannot run in parallel.

#### Step 1: Business Plan

- Use `/plan` mode to create the business plan
- Save to `plans/business/` — feature specs, user stories, acceptance criteria
- **Wait for explicit user confirmation** (e.g., "OK", "confirmed", "proceed") before moving to Step 2

#### Step 2: UI/UX Plan

- Only start after Step 1 is confirmed
- Use `/plan` mode to create the UI/UX plan
- Save to `plans/uiux/` — page structure, interaction design, component design
- **Wait for explicit user confirmation** before moving to Step 3

#### Step 3: Technical Plan

- Only start after Step 2 is confirmed
- Use `/plan` mode to create the technical plan
- Save to `plans/technical/` — architecture, data structures, API design
- **Wait for explicit user confirmation** before starting any implementation

#### After All Plans Are Confirmed

4. **Implement** — Begin coding only after all 3 plans are confirmed
5. **Update plan status** — Mark completed items with `[x]` checkboxes or `✅` markers in the plan files

### Plan File Format

Plan files use Markdown format with `kebab-case` filenames, for example:

- `plans/business/electricity-usage-feature.md`
- `plans/uiux/dashboard-redesign.md`
- `plans/technical/auth-flow.md`

## Code Style

ESLint + Prettier enforces code style. Prettier handles formatting (via `prettier-plugin-astro`, `prettier-plugin-tailwindcss`, `prettier-plugin-organize-imports`). ESLint handles linting with TypeScript and Astro rules.

React components can be used directly in `.astro` files. Tailwind classes work in both `.astro` and React `.tsx` files.
