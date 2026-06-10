# PCF Samples

A collection of **6 sample PCF (PowerApps Component Framework) controls** designed to exercise every major Dataverse / PCF API surface inside [PCF Workbench](../workbench-app).

---

## Controls

| # | Folder | Constructor | APIs Exercised |
|---|--------|-------------|----------------|
| 1 | `ContactCardControl/` | `PCFSamples.ContactCardControl` | `retrieveRecord`, `retrieveMultipleRecords`, `execute`, `getEntityMetadata`, `navigation.openForm`, `notifyOutputChanged` |
| 2 | `SmartLookup/` | `PCFSamples.SmartLookupControl` | `retrieveMultipleRecords` with `$filter`/`$select`, chained preview API call, debounced input, keyboard navigation, `notifyOutputChanged` |
| 3 | `TimelineFeed/` | `PCFSamples.TimelineFeedControl` | Multi-entity `retrieveMultipleRecords` (task, phonecall, email, annotation), `createRecord`, `updateRecord`, `deleteRecord`, complex `$filter` with lookup fields |
| 4 | `DocumentViewer/` | `PCFSamples.DocumentViewerControl` | `retrieveMultipleRecords` (annotation), `createRecord` with base64 payload, `deleteRecord`, `device.pickFile`, `getEntityMetadata`, base64 image/PDF/text preview |
| 5 | `KPIDashboard/` | `PCFSamples.KPIDashboardControl` | `webAPI.execute` (4 custom actions in parallel), `navigation.navigateTo`, `navigation.openForm`, `<canvas>` sparkline (no external libs), skeleton loading |
| 6 | `HierarchicalTree/` | `PCFSamples.HierarchicalTreeControl` | Recursive `retrieveMultipleRecords` with parent lookup `$filter`, lazy-load on expand, `navigation.openForm`, `createRecord`, `deleteRecord`, context menu, tree state |

---

## Getting Started

Each control is a standalone pcf-scripts project. To build any control:

```bash
cd <ControlFolder>      # e.g. cd SmartLookup
npm install
npm run build
```

The build output goes to `out/controls/<ControlName>/` and contains:
- `bundle.js` — compiled control
- `ControlManifest.xml` — manifest
- `css/` — stylesheets

### Loading in PCF Workbench

1. Start PCF Workbench: `cd ../workbench-app && npm run dev`
2. Open http://localhost:3000
3. In the **Load Control** panel, select the entire `out/controls/<ControlName>/` folder
4. The control loads in the canvas with mock data

### Microsoft Test Harness

```bash
cd <ControlFolder>
npm start
```

Opens the built-in Microsoft PCF test harness at `http://localhost:8183`.

---

## Control Details

### 1. ContactCardControl
Fetches a contact record by ID, displays a rich card with photo, details, related cases, and tasks. Supports theme switching and drill-down navigation.

### 2. Smart Lookup with Preview Card
A search-as-you-type lookup replacement. Debounced input fires `retrieveMultipleRecords` with `$filter` containing `contains()`. Hovering a result triggers a second API call to show a rich preview card. Keyboard navigation (↑↓ Enter Esc) supported. Outputs selected entity reference.

### 3. Timeline & Activity Feed
Chronological feed of tasks, phone calls, emails, and annotations related to a record. Fetches 4 entity types in parallel. Supports:
- **Add Task** dialog → `createRecord`
- **Mark Complete** → `updateRecord` (statecode/statuscode)
- **Delete** → `deleteRecord`
- Filter tabs (All / Tasks / Calls / Emails / Notes)

### 4. Document Viewer with Annotations
Split-pane UI: file list on the left, preview on the right. Fetches annotation records with attachments, renders base64 previews for images and PDFs. Upload new files via `device.pickFile` → `createRecord` with `documentbody`. Uses `getEntityMetadata` for entity display names.

### 5. KPI Dashboard Tile
Executes 4 custom Dataverse actions in parallel (`new_GetCaseSLAStats`, `new_GetOpenOpportunities`, `new_GetRevenueThisMonth`, `new_GetAgentPerformance`). Renders metric cards with sparkline charts drawn on `<canvas>` — zero external dependencies. Drill-down via `navigation.navigateTo` and `navigation.openForm`.

### 6. Hierarchical Record Tree
Builds an expandable tree starting from a root record. Lazy-loads children on expand via `retrieveMultipleRecords` filtered on a parent lookup field. Right-click context menu offers:
- **Open Record** → `navigation.openForm`
- **Create Child** → `createRecord` with parent binding
- **Delete** → `deleteRecord`

Loading skeleton shown per node during fetch.

---

## Project Structure

```
pcf-samples/
├── ContactCardControl/      # Existing sample (moved from sample-pcf-control/)
│   ├── ContactCardControl/
│   │   ├── ControlManifest.Input.xml
│   │   ├── index.ts
│   │   └── css/ContactCard.css
│   ├── package.json
│   ├── tsconfig.json
│   └── eslint.config.mjs
├── SmartLookup/
├── TimelineFeed/
├── DocumentViewer/
├── KPIDashboard/
├── HierarchicalTree/
└── README.md               ← you are here
```

Each subfolder follows the same structure.
