/** @type {import("eslint").Linter.Config} */
const config = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended-type-checked",
    "plugin:@typescript-eslint/stylistic-type-checked",
  ],
  rules: {
    "@typescript-eslint/array-type": "off",
    "@typescript-eslint/consistent-type-definitions": "off",
    "@typescript-eslint/consistent-type-imports": [
      "warn",
      {
        prefer: "type-imports",
        fixStyle: "inline-type-imports",
      },
    ],
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        argsIgnorePattern: "^_",
      },
    ],
    "@typescript-eslint/require-await": "off",
    "@typescript-eslint/no-misused-promises": [
      "error",
      {
        checksVoidReturn: {
          attributes: false,
        },
      },
    ],
    "react/no-unescaped-entities": "off",
    // Suppress the need for descriptions after @ts-expect-error
    "@typescript-eslint/ban-ts-comment": "off",

    // Allow unsafe assignments
    "@typescript-eslint/no-unsafe-assignment": "off",

    // Allow unused variables that match a specific pattern

    // Allow the warning about ref value changes
    "react-hooks/exhaustive-deps": "off",
    // Allow unused variables

    // Allow inferrable types
    "@typescript-eslint/no-inferrable-types": "off",

    // Allow explicit 'any' type
    "@typescript-eslint/no-explicit-any": "off",

    // Allow logical OR instead of nullish coalescing
    "@typescript-eslint/prefer-nullish-coalescing": "off",

    // Ignore unnecessary type assertions
    "@typescript-eslint/no-unnecessary-type-assertion": "off",

    // Ignore unsafe calls and member access for specific files
    "no-unsafe-call": "off", // Add this line
    "no-unsafe-member-access": "off", // Add this line
    "no-unsafe-argument": "off", // Add this line

    // Disable unsafe call errors
    "@typescript-eslint/no-unsafe-call": "off",
    // Disable unsafe member access errors
    "@typescript-eslint/no-unsafe-member-access": "off",
    // Disable unsafe argument errors
    "@typescript-eslint/no-unsafe-argument": "off",
  },
};
module.exports = config;
