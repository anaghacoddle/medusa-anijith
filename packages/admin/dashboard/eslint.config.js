import { defineConfig } from "eslint/config";
import tsParser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks"; // ✅ Add this

export default defineConfig([
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json",
        EXPERIMENTAL_useProjectService: true,
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "react-hooks": reactHooks, // ✅ Add plugin here
    },
    rules: {
      "prefer-const": "warn",
      "no-constant-binary-expression": "error",
      "react-hooks/rules-of-hooks": "error", // ✅ Required by react-hooks
      "react-hooks/exhaustive-deps": "warn", // ✅ Fixes your missing rule errors
    },
  },
  {
    // ❗ Exclude backend, node scripts, and config files like .cjs
    ignores: [
      "**/*.cjs",

      "**/dist/**", // Build output
      "**/node_modules/**", // Dependencies
      "**/build/**", // Build artifacts
      "**/public/**", // Static assets
      "**/*.d.ts", // TypeScript declaration files
      "!src/vite-env.d.ts", // ✅ Explicitly allow vite-env.d.ts file
      "**/.*", // Dotfiles (like .env)
      "**/*.config.js", // Config files (often need special formatting)
      "!eslint.config.js", // ✅ Don't ignore your ESLint config file
      "**/*.json", // JSON files
      "**/__mocks__/**", // Jest mocks
      "**/__tests__/**", // Test files (might have different linting rules)

      // If using Next.js in the admin:
      ".next/**", // Next.js build output
      "out/**",
    ],
  },
]);
