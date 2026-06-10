# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in PCF Workbench, please report it responsibly:

1. **Do NOT** open a public GitHub issue
2. Use [GitHub Private Vulnerability Reporting](https://github.com/moazambadane/pcf-workbench/security/advisories/new) to submit a report
3. Include steps to reproduce, impact assessment, and any suggested fix

We will acknowledge receipt within 48 hours and provide a timeline for a fix.

## Scope

PCF Workbench is a **local development tool** — it does not connect to production Dataverse environments. However, we still take security seriously for:

- Dependencies with known vulnerabilities
- Script injection in the iframe sandbox
- Mock data handling

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest  | ✅        |
| Older   | ❌        |

## Known Transitive Dependency Advisories

The following moderate-severity advisories affect transitive dependencies that **cannot be updated without a breaking change**. They have no practical impact for a local-only dev tool but are tracked here for transparency:

| Advisory | Package | Path | Notes |
|----------|---------|------|-------|
| [GHSA-v2wj-7wpq-c8vv](https://github.com/advisories/GHSA-v2wj-7wpq-c8vv) and related | `dompurify <=3.3.3` | `monaco-editor` → `dompurify` | Fix requires Monaco Editor to ship a new release |
| [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99) | `esbuild <=0.24.2` | `vite 5` → `esbuild` | Only affects the **dev server**, not production builds. Fix requires Vite 6+ (breaking) |
