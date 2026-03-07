import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import eslintPluginAstro from "eslint-plugin-astro";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import pluginReact from "eslint-plugin-react";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  {
    ignores: ["dist/", ".astro/", ".claude"],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.browser },
  },
  tseslint.configs.recommended,
  {
    files: ["**/*.{jsx,tsx}"],
    ...pluginReact.configs.flat.recommended,
    settings: { react: { version: "detect" } },
  },
  ...eslintPluginAstro.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    rules: {
      // override/add rules settings here, such as:
      // "astro/no-set-html-directive": "error"
    },
  },
]);
