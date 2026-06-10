# PCF Workbench - Workbench App and PCF Samples

> For the full project documentation, see the [root README](../README.md).

This directory contains the two main areas of the project:

- **workbench-app/** - The React workbench application (Vite + React 18 + TypeScript + Tailwind + Zustand)
- **pcf-samples/** - 6 sample PCF controls for testing

---

## Quick Start

### Workbench App

```bash
cd workbench-app
npm install
npm run dev
```

### Build a PCF Sample

```bash
cd pcf-samples/<ControlName>
npm install
npm run build
```

Then load the output folder in the workbench via **Load Control** (Ctrl+L).

---

For full architecture details, see the [root README](../README.md#-architecture).
