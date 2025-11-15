import { defineConfig } from "eslint/config";
import reactPlugin from "eslint-plugin-react";
import tsPlugin from "typescript-eslint";

export default defineConfig(
  tsPlugin.configs.recommended,
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat["jsx-runtime"],
  {
    files: ["**/*.{js,ts,tsx}"],
    rules: {
      "@typescript-eslint/no-floating-promises": [
        "off"
      ],
      "@typescript-eslint/no-non-null-assertion": [
        "off"
      ],
      "@typescript-eslint/no-unsafe-argument": [
        "off"
      ],
      "@typescript-eslint/no-unsafe-assignment": [
        "off"
      ],
      "@typescript-eslint/no-unsafe-enum-comparison": [
        "off"
      ],
      "@typescript-eslint/no-unused-vars": [
        "off"
      ],
      "@typescript-eslint/prefer-promise-reject-errors": [
        "off"
      ],
      "@typescript-eslint/restrict-template-expressions": [
        "off"
      ],
      "indent": [
        "error",
        2,
        {
          "SwitchCase": 1
        }
      ],
      "no-empty": [
        "error",
        {
          "allowEmptyCatch": true
        }
      ],
      "operator-linebreak": [
        "error",
        "before"
      ],
      "react/jsx-indent": [
        "error",
        2
      ],
      "semi": ["error", "always"],
    },
    languageOptions: {
      ecmaVersion: 2020,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
);


const yee = {
  "root": true,
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/strict-type-checked",
    "plugin:react/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": [
      "./tsconfig.json"
    ]
  },
  "plugins": [
    "@typescript-eslint",
    "react"
  ],
  "rules": {

  },
  "ignorePatterns": [
    "**/*.test.ts",
    "**/*.test.tsx"
  ],
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}
