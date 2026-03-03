# Meridian Studio

The operator interface for [Meridian](https://github.com/tvprasad/meridian) — a governed, self-hosted RAG platform. Meridian Studio provides a browser-based UI to query your knowledge base, upload documents, and manage configuration.

[![CI](https://github.com/tvprasad/meridian-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/tvprasad/meridian-studio/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Overview

| Page | Purpose |
|---|---|
| **Dashboard** | Live snapshot of pipeline status, document count, and active providers |
| **Query** | Ask questions in plain language; returns a grounded answer with a confidence score |
| **Upload** | Ingest documents into the configured vector store |
| **Settings** | Switch LLM and retrieval providers at runtime |

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

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check + production build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build locally |

---

## Tech Stack

- **React 19** + **TypeScript 5.9** (strict mode)
- **Vite 7** — build tooling and dev server
- **Tailwind CSS v4** — utility-first styling
- **React Router v7** — client-side routing
- **TanStack Query v5** — server state and caching
- **React Hook Form v7** + **Zod v4** — form validation
- **Lucide React** — icons

---

## Project Structure

```
src/
├── api/          # API client and type definitions
├── components/
│   └── ui/       # Shared UI components (Card, Button, Layout, …)
└── pages/        # Route-level page components
```

---

## Related

- [meridian](https://github.com/tvprasad/meridian) — the backend RAG engine

---

## License

[MIT](LICENSE) © Prasad Thiriveedi

> Microsoft Azure, Amazon Web Services (AWS), and all other third-party product names are trademarks or registered trademarks of their respective owners. Their use here does not imply endorsement or affiliation.
