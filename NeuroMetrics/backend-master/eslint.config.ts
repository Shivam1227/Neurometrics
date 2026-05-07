import js from "@eslint/js";
import prettier from "eslint-config-prettier";

export default [
  js.configs.recommended,
  prettier, // disables rules that conflict with prettier
  {
    files: ["src/**/*.ts"],
    languageOptions: { sourceType: "module" },
  },
];
