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
- **ESLint** - Linter with TypeScript and Astro support
- **Prettier** - Code formatter with Astro, Tailwind, and organize-imports plugins

## Architecture

- `src/pages/` - Astro file-based routes (`.astro` files become URL routes)
- `src/layouts/` - Shared page layouts (wrap page content via `<slot />`)
- `src/components/` - Reusable components (can be `.astro` or React `.tsx`)
- `src/styles/global.css` - Global styles entry point with Tailwind import

## Code Style

ESLint + Prettier enforces code style. Prettier handles formatting (via `prettier-plugin-astro`, `prettier-plugin-tailwindcss`, `prettier-plugin-organize-imports`). ESLint handles linting with TypeScript and Astro rules.

React components can be used directly in `.astro` files. Tailwind classes work in both `.astro` and React `.tsx` files.
