# PCF Workbench — Copilot Instructions

## Project Overview

**PCF Workbench** is a local development emulator for Power Apps Component Framework (PCF) controls. It allows developers to load, test, and debug PCF controls in an isolated browser environment without deploying to Dataverse.

The monorepo contains two main areas:
- `pcf-workbench/workbench-app/` — The React workbench application
- `pcf-workbench/pcf-samples/` — 6 sample PCF controls for testing

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | React 18 + TypeScript (strict) |
| Build | Vite 5 (port 3000) |
| Styling | Tailwind CSS v3 with CSS variable theming (`wb-*` tokens) |
| State | Zustand v4 (persisted stores: `workbenchStore`, `mockDataStore`) |
| Panels | `react-resizable-panels` with collapsible left/right/bottom panels |
| Editor | Monaco Editor (`@monaco-editor/react`) |
| Icons | `lucide-react` |
| Animation | `framer-motion` |
| PCF Build | `pcf-scripts 1.51.1` (official Microsoft PCF CLI tooling) |

---

## Architecture

### Iframe Sandbox Model
PCF controls run inside an **iframe** using `srcdoc`. The workbench injects:
1. `window.Xrm` mock (via `serializeXrmForIframe()` from `XrmMock.ts`)
2. A `_buildContext()` function that creates the full PCF context object with `webAPI`, `navigation`, `device`, `utils`, `resources`, `formatting`, etc.
3. The control's `bundle.js` + CSS
4. An `initControl()` bootstrap that calls `init()` → `updateView()`

Communication between iframe ↔ parent uses `postMessage`:
- iframe sends `api_request` messages
- Parent (`PCFCanvas.tsx`) handles them via `WebApiMock.ts` and responds with `api_response`

### Key Subsystems

| Subsystem | Files | Purpose |
|-----------|-------|---------|
| Mock Engine | `MockDataStore.ts`, `WebApiMock.ts`, `XrmMock.ts`, `ContextMock.ts` | Seed entity data, WebAPI proxy with OData filter support, Xrm mock serialization |
| Script Injection | `scriptInjector.ts` | Builds `srcdoc` HTML for PCF iframe with full context |
| State Stores | `workbenchStore.ts`, `mockDataStore.ts`, `logStore.ts` | UI state, mock entity data (persisted), API call logging |
| Theme System | CSS variables in `index.css` (`:root`, `.light`, `.dark`), Tailwind `wb-*` tokens in `tailwind.config.js` | Light (default) / dark theme |
| Layout | `MainLayout.tsx`, `Sidebar.tsx`, `TopBar.tsx`, `StatusBar.tsx` | Collapsible 3-panel layout with sidebar navigation |

---

## Coding Conventions

### General
- **TypeScript strict mode** — no `any` unless unavoidable
- **Functional React components** with hooks only (no class components)
- **No comments** unless they match existing comment style or explain complex logic
- Use existing libraries — do not add new dependencies without justification
- Prefer `type` imports: `import type { ... } from "..."`

### File Organization
```
src/
  components/
	canvas/        — PCF iframe canvas
	inspector/     — API log, console, performance, property inspector
	layout/        — MainLayout, Sidebar, TopBar, StatusBar
	loader/        — PCF control file loader
	mock-config/   — Entity data grid, mock settings
	mock-engine/   — WebAPI mock, Xrm mock, context mock, data store
	settings/      — Workbench settings panel
	shared/        — Reusable UI components
  hooks/           — Custom React hooks
  store/           — Zustand stores
  themes/          — Theme utilities
  types/           — TypeScript type definitions
  utils/           — Manifest parser, script injector, helpers
```

### Naming
- Components: `PascalCase.tsx`
- Utilities/hooks: `camelCase.ts`
- Types: `*.types.ts`
- Stores: `*Store.ts`
- CSS classes use Tailwind with `wb-*` design tokens (e.g., `bg-wb-bg`, `text-wb-text`, `border-wb-border`)

### State Management (Zustand)
- `useWorkbenchStore` — UI state, loaded control, property bag, canvas settings, theme (persisted)
- `useMockDataStore` — Mock entity records, custom actions, metadata (persisted with version migration)
- `useLogStore` — API call log, console messages (not persisted)

### Mock Data Patterns
- Entity records use Dataverse-style field names including lookup values: `_regardingobjectid_value`, `_objectid_value`, `_parentaccountid_value`
- The default regarding/root ID is `00000000-0000-0000-0001-000000000001` (contacts) or `00000000-0000-0000-0002-000000000001` (accounts)
- OData filters supported: `field eq 'value'`, `contains(field,'value')`, `$top`, `$orderby`
- When creating records via `createRecord`, always include `_*_value` lookup fields so subsequent `retrieveMultiple` filters work

### Theme Tokens
Always use Tailwind `wb-*` tokens, never raw colors:
```
bg-wb-bg       — Main background
bg-wb-panel    — Panel background
bg-wb-elevated — Elevated surfaces
text-wb-text   — Primary text
text-wb-text2  — Secondary text
text-wb-muted  — Muted/disabled text
border-wb-border — Borders
```
Accent color: `#4f6ef7` (used directly as `text-[#4f6ef7]`, `border-[#4f6ef7]`, `bg-[#4f6ef7]`)

---

## PCF Samples

Each sample lives in `pcf-workbench/pcf-samples/<Name>/` with its own `package.json`, `tsconfig.json`, and `eslint.config.mjs`. Build with `npm run build` (uses `pcf-scripts`).

| Control | Entity | Key Features |
|---------|--------|-------------|
| ContactCardControl | contact | Basic CRUD, avatar, detail fields |
| DocumentViewer | annotation | File upload via `device.pickFile`, base64 preview, annotations list |
| TimelineFeed | task, phonecall, email, annotation | Multi-entity activity feed, add task dialog, filtering tabs |
| HierarchicalTree | account | Recursive parent-child tree, context menu, expand/collapse |
| KPIDashboard | opportunity | Aggregate metrics, charts, summary cards |
| SmartLookup | contact, account | Lookup search, entity type switching, recent items |

### Building PCF Samples
```bash
cd pcf-workbench/pcf-samples/<ControlName>
npm install
npm run build
```
Output: `out/controls/<ControlName>/bundle.js` + CSS

---

## Common Pitfalls

1. **Iframe vs parent context**: PCF controls inside iframe use `_buildContext` from `scriptInjector.ts`. The `ContextMock.ts` is for non-iframe usage only.
2. **Lookup value fields**: Dataverse lookup fields like `regardingobjectid` have a corresponding `_regardingobjectid_value` field. The OData filter uses the `_value` variant. Always set both when creating mock data.
3. **Persisted store migration**: When changing seed data structure in `MockDataStore.ts`, bump the `version` in `mockDataStore.ts` persist config to force migration.
4. **Tailwind class syntax**: Use `bg-wb-bg` not `bg-[wb-bg]`. The `wb-*` tokens are defined in `tailwind.config.js` referencing CSS variables.
5. **PCF manifest**: `ControlManifest.Input.xml` `default-value` attributes set initial parameter values in the workbench property bag.
