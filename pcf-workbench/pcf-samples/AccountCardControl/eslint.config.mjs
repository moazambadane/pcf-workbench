import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: [
      "AccountCardControl/generated/**",
      "**/*.d.ts",
      "node_modules/**"
    ]
  },
  {
    files: ["AccountCardControl/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module"
      }
    },
    rules: {}
  }
];
