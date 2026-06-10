import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: [
      "HierarchicalTreeControl/generated/**",
      "**/*.d.ts",
      "node_modules/**"
    ]
  },
  {
    files: ["HierarchicalTreeControl/**/*.ts"],
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
