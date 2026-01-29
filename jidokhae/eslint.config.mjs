import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [".next/**", "node_modules/**", "*.config.js", "*.config.mjs"],
  },
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // 프로덕션 console 사용 경고
      "no-console": ["warn", { allow: ["warn", "error"] }],
      // any 타입 사용 경고
      "@typescript-eslint/no-explicit-any": "warn",
      // 미사용 변수 에러
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
];
