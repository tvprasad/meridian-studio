# Meridian Studio

The operator interface for [Meridian](https://github.com/tvprasad/meridian) — a governed, self-hosted RAG platform. Meridian Studio provides a browser-based UI to query your knowledge base, upload documents, and manage configuration.

[![CI](https://github.com/tvprasad/meridian-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/tvprasad/meridian-studio/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Overview

### Core

| Page | Purpose |
|---|---|
| **Dashboard** | Live snapshot of pipeline status, document count, and active providers |
| **Ask Meridian** | Multi-turn chat interface for querying the knowledge base with confidence scoring, citations, follow-up prompts, and markdown rendering |
| **AI Operations Agent** | ReAct reasoning agent with step-by-step tool execution timeline for complex operational queries |
| **Ingestion Pipeline** | Multi-stage document ingestion (Upload → Extract → Chunk → Embed → Index) with ServiceNow connector |
| **Evaluation** | Aggregate metrics dashboard (total queries, avg confidence, refusal rate, latency P50/P95) and paginated query log with sortable columns and filter dropdowns |
| **Settings** | Switch LLM and retrieval providers at runtime |

### Cognitive AI Services

| Page | Purpose |
|---|---|
| **Language Intelligence** | Sentiment analysis, entity recognition, key phrase extraction, and language detection |
| **Vision Intelligence** | Image analysis (caption, tags, objects) and OCR text extraction |
| **Speech Services** | Speech-to-text transcription and text-to-speech synthesis with voice selection |
| **Document Intelligence** | Structured data extraction from invoices, receipts, IDs, layouts, and more |

### Cross-cutting Features

- **Authentication** — Azure AD/Entra ID via MSAL.js, gated by `VITE_AUTH_ENABLED` feature flag (off by default)
- **Dark mode** — toggle via sun/moon button in sidebar, persisted in localStorage
- **Collapsible sidebar** — pin/unpin with icon-only rail, expands on hover when unpinned
- **Landing page** — dark hero section with capability cards at `/welcome`
- **Offline banner** — automatic disconnect detection when API health check fails
- **Keyboard shortcuts** — Ctrl+K to focus input or start new chat, Escape to clear

### Diagnostics & Governance

A collapsible right sidebar appears on all Cognitive AI Services pages, providing:

- **Diagnostics** — last API call status, latency, request ID, and estimated cost
- **Governance** — session totals: call count, cumulative cost estimate, and per-service usage breakdown

State is session-scoped (resets on page refresh) and tracked automatically via the `useTrackedMutation` hook. See [ADR-0002](adr/0002-diagnostics-governance-panel.md) for design rationale.

---

## Prerequisites

- **Node.js** 20+
- **Meridian API** running at `http://localhost:8000` (see [meridian](https://github.com/tvprasad/meridian))

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — set VITE_API_BASE_URL and VITE_MCP_BASE_URL

# 3. Start dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` | Meridian REST API base URL |
| `VITE_MCP_BASE_URL` | `http://localhost:8001` | Meridian MCP server base URL |
| `VITE_AUTH_ENABLED` | `false` | Enable Azure AD authentication |
| `VITE_AZURE_CLIENT_ID` | — | Azure AD app registration client ID |
| `VITE_AZURE_TENANT_ID` | — | Azure AD tenant ID |
| `VITE_AZURE_REDIRECT_URI` | `window.location.origin` | Post-login redirect URI |
| `VITE_AZURE_API_SCOPE` | — | API scope (e.g., `api://meridian-api/.default`) |

---

## Authentication Setup

Authentication is **off by default**. When `VITE_AUTH_ENABLED=true`, Studio uses MSAL.js to authenticate users via Azure AD/Entra ID. The backend must also have `AUTH_ENABLED=true` (available since Meridian API v0.13.0).

### 1. Register an Azure AD Application

1. Go to **Azure Portal** > **Microsoft Entra ID** > **App registrations** > **New registration**
2. **Name**: `meridian`
3. **Supported account types**: choose based on your needs:
   - *Single tenant* — only users in your org directory (most secure for production)
   - *Any Entra ID tenant + Personal Microsoft accounts* — allows personal accounts like `@gmail.com` (useful for dev)
4. **Redirect URI**: select **Single-page application (SPA)** and enter `http://localhost:5173`
5. Click **Register**

### 2. Configure the Manifest (required for multi-tenant + personal accounts)

If you chose multi-tenant or personal accounts:

1. Go to **Manifest** in the left sidebar
2. Find `"accessTokenAcceptedVersion"` and change it from `null` to `2`
3. Click **Save**
4. Then set the supported account type under **Authentication** > **Supported accounts**

### 3. Note Your IDs

From the app registration **Overview** page, copy:

- **Application (client) ID** — this is `VITE_AZURE_CLIENT_ID`
- **Directory (tenant) ID** — this is `VITE_AZURE_TENANT_ID`

### 4. Add Production Redirect URI

Under **Authentication** > **Redirect URI configuration**, add your production domain:

- `https://studio.vplsolutions.com` (type: SPA)

### 5. Update Environment Variables

```env
VITE_AUTH_ENABLED=true
VITE_AZURE_CLIENT_ID=<your-client-id>
VITE_AZURE_TENANT_ID=<your-tenant-id>
VITE_AZURE_REDIRECT_URI=http://localhost:5173
# VITE_AZURE_API_SCOPE=api://meridian-api/.default
```

### How It Works

- **Flag off (default)**: No MSAL code initializes. No login required. App behaves identically to pre-auth versions.
- **Flag on**: MSAL acquires tokens silently (from cache/refresh), falling back to Azure AD redirect login. All API calls include `Authorization: Bearer <token>`. Sidebar shows user profile with logout button. Protected routes redirect unauthenticated users to login. `/welcome` remains public.

See [ADR-0008](adr/0008-msal-authentication.md) for the full architectural decision.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check + production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest contract and component tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run preview` | Preview production build locally |

---

## Tech Stack

- **React 19** + **TypeScript 5.9** (strict mode)
- **Vite 7** — build tooling and dev server
- **Tailwind CSS v4** — utility-first styling
- **React Router v7** — client-side routing
- **TanStack Query v5** — server state and caching
- **React Hook Form v7** + **Zod v4** — form validation
- **MSAL.js** (`@azure/msal-browser` + `@azure/msal-react`) — Azure AD authentication
- **Vitest** + **MSW** + **Testing Library** — contract and component tests
- **Lucide React** — icons

---

## Project Structure

```
src/
├── api/              # API client, Meridian + Azure AI type definitions
│   └── __tests__/    # API contract tests (Vitest + MSW)
├── auth/             # MSAL.js authentication (provider, guard, token utility)
│   └── __tests__/    # Auth unit and integration tests
├── __fixtures__/     # Real backend response fixtures for tests
├── components/
│   └── ui/           # Shared UI components (Layout, DiagnosticsPanel, …)
├── hooks/            # Custom hooks (useDiagnostics, useTrackedMutation)
└── pages/            # Route-level page components
adr/                  # Architecture decision records (ADR-0001 through ADR-0008)
```

---

## Testing

Contract tests verify that API mapping functions correctly transform backend responses. Fixtures in `src/__fixtures__/` come from real backend output. MSW intercepts at network level so the same `fetch` code runs in tests and production.

```bash
npm test          # run all tests
npm run test:watch  # watch mode
```

See [ADR-0003](adr/0003-testing-framework.md) for the testing strategy.

---

## Related

- [meridian](https://github.com/tvprasad/meridian) — the backend RAG engine
- [meridian-infra](https://github.com/tvprasad/meridian-infra) — Terraform IaC for Azure deployment

---

## License

[MIT](LICENSE) © Prasad Thiriveedi

> Microsoft Azure, Amazon Web Services (AWS), and all other third-party product names are trademarks or registered trademarks of their respective owners. Their use here does not imply endorsement or affiliation.
