import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: [
      "ContactCardControl/generated/**",
      "**/*.d.ts",
      "node_modules/**"
    ]
  },
  {
    files: ["ContactCardControl/**/*.ts"],
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
