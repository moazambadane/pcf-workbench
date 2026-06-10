# Contributing to PCF Workbench

Thank you for your interest in contributing to PCF Workbench! This guide will help you get started.

## Prerequisites

- **Node.js** 18+ and npm 9+
- **Power Platform CLI** (`pac`) — for building PCF samples
- **Git**

## Repository Structure

```
pcf-workbench/
├── workbench-app/          # React workbench application
│   ├── src/
│   │   ├── components/     # React components (canvas, inspector, layout, loader, etc.)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── store/          # Zustand state stores
│   │   ├── themes/         # Theme utilities
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Manifest parser, script injector, helpers
│   ├── public/             # Static assets
│   ├── package.json
│   └── vite.config.ts
└── pcf-samples/            # 6 sample PCF controls
	├── ContactCardControl/
	├── DocumentViewer/
	├── HierarchicalTree/
	├── KPIDashboard/
	├── SmartLookup/
	└── TimelineFeed/
```

## Getting Started

### Workbench App

```bash
cd pcf-workbench/workbench-app
npm install
npm run dev          # Start dev server on port 3000
```

### Building a PCF Sample

```bash
cd pcf-workbench/pcf-samples/<ControlName>
npm install
npm run build
```

The built output (`bundle.js` + CSS) goes to `out/controls/<ControlName>/`.

### Building All Samples

```bash
for dir in ContactCardControl DocumentViewer HierarchicalTree KPIDashboard SmartLookup TimelineFeed; do
  cd pcf-workbench/pcf-samples/$dir && npm install && npm run build && cd ../../..
done
```

## Development Workflow

1. **Fork and clone** the repository
2. **Create a branch** from `develop`: `git checkout -b feature/my-feature develop`
3. **Make changes** following the coding conventions below
4. **Type-check**: `cd pcf-workbench/workbench-app && npx tsc --noEmit`
5. **Test locally**: `npm run dev` and verify in browser
6. **Commit** with a clear message
7. **Open a Pull Request** against `develop` (NOT `main`)

> ⚠️ All PRs must target the `develop` branch. PRs to `main` will be closed.

## Coding Conventions

### TypeScript
- Strict mode enabled — avoid `any`
- Use `type` imports: `import type { Foo } from "..."`
- Functional React components with hooks only (no class components)

### Styling
- Use Tailwind CSS with `wb-*` design tokens
- Use `bg-wb-bg`, `text-wb-text`, `border-wb-border` — never raw colors except the accent `#4f6ef7`
- Never use `bg-[wb-bg]` syntax — the correct form is `bg-wb-bg`

### State Management
- Use Zustand stores in `src/store/`
- `useWorkbenchStore` — UI state, persisted
- `useMockDataStore` — Mock entity data, persisted with version migration
- `useLogStore` — API call logs, not persisted

### Mock Data
- Include `_*_value` lookup fields alongside standard fields (e.g., both `regardingobjectid` and `_regardingobjectid_value`)
- When changing seed data structure, bump the `version` in `mockDataStore.ts` persist config

### File Naming
- Components: `PascalCase.tsx`
- Utilities/hooks: `camelCase.ts`
- Types: `*.types.ts`
- Stores: `*Store.ts`

## Adding a New PCF Sample

1. Create a new directory under `pcf-workbench/pcf-samples/<ControlName>/`
2. Include `package.json`, `tsconfig.json`, `eslint.config.mjs`
3. Create `<ControlName>Control/ControlManifest.Input.xml` and `index.ts`
4. Add seed data in `MockDataStore.ts` with appropriate `_*_value` lookup fields
5. Build with `npm run build`
6. Update the PCF Samples table in the README

## Reporting Issues

- Use GitHub Issues
- Include steps to reproduce, expected vs actual behavior
- If a PCF control doesn't render, check browser DevTools console for errors in the iframe

## License

By contributing, you agree that your contributions will be licensed under the project's license.
