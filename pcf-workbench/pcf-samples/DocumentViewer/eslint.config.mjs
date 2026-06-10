import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: [
      "DocumentViewerControl/generated/**",
      "**/*.d.ts",
      "node_modules/**"
    ]
  },
  {
    files: ["DocumentViewerControl/**/*.ts"],
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
