# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (http://localhost:4321)
npm run build     # Build for production (output to dist/)
npm run preview   # Preview production build
npm run lint      # Run Biome linter/formatter with auto-fix
```

## Tech Stack

- **Astro 5** - Static site generator with file-based routing (`src/pages/`)
- **React 19** - UI component library via `@astrojs/react` integration
- **Tailwind CSS v4** - Styling via `@tailwindcss/vite` Vite plugin (imported in `src/styles/global.css`)
- **Biome** - Linter and formatter (replaces ESLint + Prettier)

## Architecture

- `src/pages/` - Astro file-based routes (`.astro` files become URL routes)
- `src/layouts/` - Shared page layouts (wrap page content via `<slot />`)
- `src/components/` - Reusable components (can be `.astro` or React `.tsx`)
- `src/styles/global.css` - Global styles entry point with Tailwind import

## Code Style

Biome enforces: 2-space indentation, double quotes for JS/TS strings, auto-organized imports. For `.astro`, `.svelte`, `.vue` files, `useConst`, `useImportType`, `noUnusedVariables`, and `noUnusedImports` rules are disabled.

React components can be used directly in `.astro` files. Tailwind classes work in both `.astro` and React `.tsx` files.
