import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: [
      "SmartLookupControl/generated/**",
      "**/*.d.ts",
      "node_modules/**"
    ]
  },
  {
    files: ["SmartLookupControl/**/*.ts"],
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
