<div align="center">

# ⚡ PCF Workbench

**A local development emulator for Power Apps Component Framework (PCF) controls**

Develop, test, and debug PCF controls in your browser — no Dataverse deployment required.

[![Build](https://github.com/moazambadane/pcf-workbench/actions/workflows/ci.yml/badge.svg)](https://github.com/moazambadane/pcf-workbench/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vite.dev/)

---

[Getting Started](#-getting-started) · [Features](#-features) · [PCF Samples](#-pcf-samples) · [Architecture](#-architecture) · [Configuration](#-configuration) · [Contributing](#-contributing)

</div>

---

## 🎯 The Problem

Developing PCF controls with the official tooling means:

- **30–60 second deployment cycles** with `pac pcf push` for every change
- A **connected Dataverse environment** required at all times
- **Limited visibility** into what API calls your control is making
- **No easy way** to test with different data scenarios

## ✅ The Solution

PCF Workbench emulates the full `ComponentFramework` runtime locally:

- **Instant feedback** — load your `bundle.js` and see it render immediately
- **Complete Xrm mock** — WebApi, Navigation, Device, Utility, Formatting, and more
- **Live property editor** — tweak input parameters and watch `updateView()` fire in real time
- **API call logger** — every `retrieveRecord`, `createRecord`, `execute` call captured with timing
- **Pre-seeded mock data** — realistic Dataverse records for 10+ entity types
- **Light & Dark themes** — match your preferred development environment

---

## 📸 Screenshots

<details>
<summary><strong>Click to expand screenshots</strong></summary>

> _Screenshots coming soon — run `npm run dev` to see the workbench in action!_

</details>

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 18+ |
| npm | 9+ |
| Browser | Chrome / Edge (recommended) |

### Quick Start

```bash
# Clone the repo
git clone https://github.com/moazambadane/pcf-workbench.git
cd pcf-workbench

# Start the workbench
cd pcf-workbench/workbench-app
npm install
npm run dev
```

Open **http://localhost:3000** in your browser.

### Load a PCF Control

1. Build one of the included samples (see [PCF Samples](#-pcf-samples))
2. In the workbench, click **Load Control** in the sidebar (or press `Ctrl+L`)
3. Drag-and-drop the control's output folder onto the drop zone
4. The control renders instantly in the canvas

### Production Build

```bash
cd pcf-workbench/workbench-app
npm run build     # Type-check + Vite build
npm run preview   # Preview production build
```

---

## ✨ Features

### 🖥️ Collapsible Three-Panel Layout

| Panel | Content | Collapsible |
|-------|---------|-------------|
| **Left** | Load Control, Mock Config, Settings | ✅ Chevron toggle |
| **Center** | PCF Canvas (iframe sandbox) + Bottom Panel | — |
| **Right** | Properties, Inspector, Manifest viewer | ✅ Chevron toggle |
| **Bottom** | API Log, Console, Performance | ✅ Chevron toggle |

All panels are resizable via drag handles and collapsible via chevron buttons.

### 🔌 Full PCF Context Mock

Every API surface available to a real PCF control is mocked:

| API | Methods | Status |
|-----|---------|--------|
| `context.webAPI` | `retrieveRecord`, `retrieveMultipleRecords`, `createRecord`, `updateRecord`, `deleteRecord`, `execute` | ✅ Full |
| `context.navigation` | `openForm`, `openUrl`, `openAlertDialog`, `openConfirmDialog`, `openErrorDialog`, `navigateTo` | ✅ Full |
| `context.device` | `pickFile` (real file picker with base64), `captureImage`, `getCurrentPosition` | ✅ Full |
| `context.utils` | `getEntityMetadata`, `lookupObjects`, `hasEntityPrivilege` | ✅ Full |
| `context.formatting` | `formatCurrency`, `formatDecimal`, `formatInteger`, `formatDateAsFilterStringInUTC` | ✅ Full |
| `context.resources` | `getString`, `getResource` | ✅ Stub |
| `context.mode` | `isControlDisabled`, `isVisible`, `trackContainerResize` | ✅ Full |
| `context.parameters` | All property types from manifest | ✅ Full |
| `window.Xrm` | `WebApi`, `Navigation`, `Utility`, `Device`, `Encoding`, `Page` | ✅ Full |

### 📊 Developer Tools

- **API Log** — Real-time table of every WebApi call with method, entity, OData options, status, duration, and response size. Click any row to expand full request/response JSON. Filterable by method and searchable.
- **Console** — Captures `console.log/warn/error` from the iframe
- **Performance** — Render timing and API call statistics
- **Property Inspector** — Edit control parameters live; changes trigger `updateView()`
- **Manifest Viewer** — Parsed view of `ControlManifest.Input.xml`

### 🎨 Theming

- **Light** (default) and **Dark** themes
- Powered by CSS variables + Tailwind `wb-*` design tokens
- Toggle via Settings panel or sidebar

### 🗄️ Mock Data Engine

- **Pre-seeded records** for 10+ Dataverse entities (contact, account, task, annotation, opportunity, etc.)
- **OData filter support**: `field eq 'value'`, `contains(field,'value')`, `$top`, `$orderby`
- **Lookup value fields**: Full `_regardingobjectid_value` / `_objectid_value` support
- **Custom action mocking**: Register mock responses for any Dataverse action
- **Configurable latency & error rate**: Simulate slow or unreliable connections
- **Import/Export**: Save and load mock configurations as JSON
- **Persisted state**: Mock data survives page refresh (localStorage with version migration)

---

## 🧩 PCF Samples

Six production-quality sample controls are included, each exercising different PCF APIs:

| # | Control | Entity | Key APIs |
|---|---------|--------|----------|
| 1 | **ContactCardControl** | `contact` | `retrieveRecord`, `retrieveMultipleRecords`, `execute`, `getEntityMetadata`, `navigation.openForm`, `notifyOutputChanged` |
| 2 | **DocumentViewer** | `annotation` | `device.pickFile`, `createRecord` (base64 payload), `deleteRecord`, base64 image/PDF/text preview |
| 3 | **TimelineFeed** | `task`, `phonecall`, `email`, `annotation` | Multi-entity parallel fetch, `createRecord`, `updateRecord`, `deleteRecord`, filtering tabs, add task dialog |
| 4 | **HierarchicalTree** | `account` | Recursive parent-child tree, lazy-load children on expand, context menu, `createRecord`, `deleteRecord` |
| 5 | **KPIDashboard** | `opportunity` | 4 parallel `execute` calls, `<canvas>` sparkline charts, skeleton loading, `navigation.navigateTo` |
| 6 | **SmartLookup** | `contact`, `account` | Debounced search, `$filter`/`$select`, entity type switching, keyboard navigation, `notifyOutputChanged` |

### Building a Sample

```bash
cd pcf-workbench/pcf-samples/DocumentViewer   # or any sample folder
npm install
npm run build
```

Output: `out/controls/<ControlName>/bundle.js` + CSS

### Building All Samples

```powershell
$samples = @("ContactCardControl","DocumentViewer","HierarchicalTree","KPIDashboard","SmartLookup","TimelineFeed")
foreach ($s in $samples) {
	Push-Location "pcf-workbench/pcf-samples/$s"
	npm install; npm run build
	Pop-Location
}
```

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    PCF Workbench (React 18 + Vite)               │
│                                                                  │
│  ┌──────────┐  ┌──────────────────────────┐  ┌──────────────┐   │
│  │ Sidebar  │  │      Center Canvas       │  │  Right Panel │   │
│  │          │  │  ┌────────────────────┐   │  │              │   │
│  │ • Load   │  │  │  PCF Control       │   │  │ • Properties │   │
│  │ • Mock   │  │  │  (iframe sandbox)  │   │  │ • Inspector  │   │
│  │   Config │  │  │                    │   │  │ • Manifest   │   │
│  │ • Props  │  │  │  window.Xrm ──────┼───┼──┼─► postMessage│   │
│  │ • API Log│  │  │  _buildContext()   │   │  │              │   │
│  │ • Console│  │  └────────────────────┘   │  └──────────────┘   │
│  │ • Perf   │  │           ↕ postMessage   │                     │
│  │ • Settings│ │  ┌────────────────────┐   │                     │
│  └──────────┘  │  │   Bottom Panel     │   │                     │
│                │  │ API Log │ Console  │   │                     │
│                │  │ Performance        │   │                     │
│                │  └────────────────────┘   │                     │
│                └──────────────────────────┘                      │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Mock Engine                                             │    │
│  │  XrmMock.ts → WebApiMock.ts → MockDataStore.ts (Zustand) │    │
│  │  scriptInjector.ts builds srcdoc with full PCF context    │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

### How It Works

1. **Load** — User drops `ControlManifest.Input.xml` + `bundle.js` onto the workbench
2. **Parse** — `manifestParser.ts` extracts control metadata, properties, and resources
3. **Inject** — `scriptInjector.ts` builds a `srcdoc` HTML document containing:
   - Serialized `window.Xrm` mock (WebApi, Navigation, Device, etc.)
   - A `_buildContext()` function that constructs the full PCF `context` object
   - The control's `bundle.js` and CSS
4. **Bootstrap** — `initControl()` instantiates the control, calls `init()` then `updateView()`
5. **Proxy** — All `webAPI` calls inside the iframe are forwarded via `postMessage` to the parent
6. **Mock** — Parent routes calls through `WebApiMock.ts` → `MockDataStore.ts` (Zustand) and returns data
7. **Log** — Every call is captured in `logStore.ts` and displayed in the API Log panel

### Project Structure

```
pcf-workbench/
├── workbench-app/                 # React workbench application
│   └── src/
│       ├── components/
│       │   ├── canvas/            # PCFCanvas — iframe host + postMessage handler
│       │   ├── inspector/         # ApiCallLog, ConsolePanel, PerformancePanel, PropertyInspector
│       │   ├── layout/            # MainLayout, Sidebar, TopBar, StatusBar
│       │   ├── loader/            # PCFLoader — drag-drop file loader
│       │   ├── mock-config/       # EntityDataGrid, MockConfigPanel
│       │   ├── mock-engine/       # WebApiMock, XrmMock, ContextMock, MockDataStore
│       │   ├── settings/          # SettingsPanel
│       │   └── shared/            # Reusable UI components
│       ├── hooks/                 # Custom React hooks
│       ├── store/                 # Zustand stores (workbenchStore, mockDataStore, logStore)
│       ├── themes/                # Theme utilities
│       ├── types/                 # TypeScript type definitions
│       └── utils/                 # manifestParser, scriptInjector, helpers
└── pcf-samples/                   # 6 sample PCF controls
	├── ContactCardControl/
	├── DocumentViewer/
	├── HierarchicalTree/
	├── KPIDashboard/
	├── SmartLookup/
	└── TimelineFeed/
```

---

## ⚙️ Configuration

### Mock Settings

Configure via the **Settings** panel in the sidebar:

| Setting | Description | Default |
|---------|-------------|---------|
| Default Delay | Simulated API latency (ms) | `100` |
| Error Rate | Random API failure rate (0–100%) | `0%` |
| Organization Name | `getGlobalContext().getClientUrl()` | `Mock Dynamics Org` |
| User Name | `getUserName()` | `Developer User` |
| User ID | `getUserId()` | `{000...001}` |
| Language ID | Formatting locale | `1033` (en-US) |

### Pre-Seeded Entity Data

| Entity | Records | Key Fields |
|--------|---------|------------|
| `contact` | 20 | `fullname`, `emailaddress1`, `telephone1`, `jobtitle` |
| `account` | 15 | `name`, `accountnumber`, `_parentaccountid_value` (hierarchical) |
| `systemuser` | 10 | `fullname`, `internalemailaddress`, `businessunitid` |
| `task` | 10 | `subject`, `_regardingobjectid_value`, `statecode`, `scheduledend` |
| `incident` | 10 | `title`, `ticketnumber`, `prioritycode`, `statecode` |
| `opportunity` | 8 | `name`, `estimatedvalue`, `closeprobability`, `statecode` |
| `lead` | 8 | `fullname`, `emailaddress1`, `companyname`, `leadqualitycode` |
| `annotation` | 15 | `subject`, `_objectid_value`, `documentbody`, `mimetype`, `filename` |
| `email` | 10 | `subject`, `_regardingobjectid_value`, `directioncode` |
| `phonecall` | 8 | `subject`, `_regardingobjectid_value`, `directioncode` |

### Mock Config JSON Import

```json
{
  "entities": {
	"contact": [
	  {
		"contactid": "00000000-0000-0000-0001-000000000001",
		"fullname": "Sarah Connor",
		"emailaddress1": "sarah@example.com"
	  }
	]
  },
  "customActions": [
	{
	  "actionName": "new_MyCustomAction",
	  "mockResponse": { "result": "success", "data": 42 },
	  "delay": 150
	}
  ]
}
```

### Custom Action Mocking

```json
{
  "customActions": [
	{
	  "actionName": "new_GetEnrichmentData",
	  "mockResponse": { "score": 95, "enrichedField": "value" },
	  "delay": 200
	},
	{
	  "actionName": "new_FailingAction",
	  "errorCode": 403,
	  "errorMessage": "You do not have permission."
	}
  ]
}
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+L` | Open Load Control panel |
| `Ctrl+R` | Refresh canvas (reload control) |

---

## 🔄 Known Limitations

| Feature | PCF Workbench | Real Dataverse |
|---------|--------------|----------------|
| OData filters | `eq`, `contains`, `$top`, `$orderby` | Full OData v4 |
| `$expand` | ❌ Not supported | ✅ Supported |
| FetchXML | ❌ Not supported | ✅ Supported |
| Authentication | N/A (local mock) | Azure AD / MFA |
| Virtual controls | ⚠️ Not tested | ✅ Supported |
| Web resources | ❌ Not loaded | ✅ Loaded from server |
| Offline sync | Simulated (`isAvailableOffline`) | Full offline sync |
| Form context | Mock only | Full form bindings |
| Lookup resolution | MockDataStore | Full metadata service |

---

## 🗺️ Roadmap

- [ ] Full OData `$expand` support
- [ ] FetchXML query parser
- [ ] Virtual PCF control support (`ReactControl<TInputs, TOutputs>`)
- [ ] Canvas App PCF emulation mode
- [ ] Screenshot / export canvas as image
- [ ] Property bag diff viewer
- [ ] Multiple controls on canvas simultaneously
- [ ] Import data from connected Dataverse environment
- [ ] VS Code extension integration
- [ ] Hot-reload on file change (watch mode)
- [ ] Playwright test harness for automated PCF testing

---

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](.github/CONTRIBUTING.md) for guidelines.

1. Fork the repo
2. Create a feature branch from `develop`: `git checkout -b feature/my-feature develop`
3. Make changes following the [coding conventions](.github/copilot-instructions.md#coding-conventions)
4. Type-check: `npx tsc --noEmit`
5. Open a Pull Request against `develop`

---

## 📜 License

MIT — see [LICENSE](LICENSE) for details.

---

## 🛠️ Tech Stack

<p>
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Zustand-4-433E38?logo=data:image/png;base64," />
  <img src="https://img.shields.io/badge/Monaco_Editor-latest-1E1E1E?logo=visualstudiocode&logoColor=white" />
  <img src="https://img.shields.io/badge/Framer_Motion-11-E800FF?logo=framer&logoColor=white" />
</p>

---

<div align="center">

**Built with ❤️ for the Power Platform developer community**

⭐ Star this repo if you find it useful!

</div>
