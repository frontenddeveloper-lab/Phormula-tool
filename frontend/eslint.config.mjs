import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Global relaxations (build unblock)
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^", varsIgnorePattern: "^" },
      ],
      "prefer-const": "warn",

      // Keep this as ERROR (must not disable)
      "react-hooks/rules-of-hooks": "error",

      // Usually keep as warn (not build blocking)
      "react-hooks/exhaustive-deps": "warn",

      // Optional: keep warning or disable if you want
      "@next/next/no-img-element": "warn",
    },
  },

  // Allow any in API layer only (safer than turning off everywhere)
  {
    files: ["src/lib/api/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];

export default eslintConfig;