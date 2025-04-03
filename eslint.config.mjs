import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import config from "../eslint.custom.mjs";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {files: ["**/*.{js,mjs,cjs,ts}"]},
  {languageOptions: { globals: {...globals.browser, ...globals.node} }},
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
     ignores: ["eslint.config.*"]
  },
  {
    ... config
  }
  ];
