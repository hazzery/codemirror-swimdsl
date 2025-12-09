import js from "@eslint/js";
import { defineConfig, type Config } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";
import tsdoc from "eslint-plugin-tsdoc";

export default defineConfig([
  {
    ignores: ["dist", "dist-node", ".rollup.cache"],
  },
  {
    files: ["**/*.ts"],
    extends: [
      js.configs.recommended,
      ...(tseslint.configs.strictTypeChecked as Config[]),
      ...(tseslint.configs.stylisticTypeChecked as Config[]),
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      tsdoc,
    },
    rules: {
      "tsdoc/syntax": "error",
    },
  },
]);
