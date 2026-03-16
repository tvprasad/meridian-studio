# Changelog

All notable changes to Meridian Studio will be documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

---

## [0.21.0] — 2026-03-16

### Added
- **Collapsible AI Lab section** — sidebar "AI Lab Preview" header is now a toggle button with rotating chevron; collapsed state persisted in localStorage

### Changed
- **VPL logo update** — replaced `logo.png` with `vpllogo.jfif` across sign-in screen, sidebar, landing page, favicon, and web manifest
- **Web manifest** — renamed app from "VPL Solutions — AI Products" to "Meridian Studio"

---

## [0.20.0] — 2026-03-16

### Added
- **Cognitive AI Services links on Settings** — each service is now a clickable link with description and hover chevron; added missing Document Intelligence entry

---

## [0.19.0] — 2026-03-16

### Changed
- **Ask Meridian** — subtitle now explains governance threshold and refusal behavior
- **Dashboard** — added getting-started hint card when knowledge base has 0 documents, linking to Ingestion Pipeline
- **Ingestion Pipeline** — subtitle describes the four-stage pipeline (extraction, chunking, embedding, indexing)
- **AI Operations Agent** — empty state title changed to "Your AI operations analyst" with ReAct reasoning explanation
- **Evaluation** — renamed "Query Log" to "Query Telemetry Log" with descriptive empty state explaining what gets recorded
- **Cognitive AI Services** — all 4 pages (Language, Vision, Speech, Document Intelligence) now describe the service in plain language and note independence from the RAG engine

---

## [0.18.2] — 2026-03-15

### Changed
- **Sidebar footer** — merged version, GitHub icon, and repo links into a single compact link with inline GitHub icon
- **MSAL login** — switched from popup to redirect flow (popup loaded full SPA in second window)

### Fixed
- **Cursor pointer on logout buttons** — added `cursor-pointer` to both expanded and collapsed logout buttons

---

## [0.18.1] — 2026-03-15

### Fixed
- **MSAL auth build args** — pass all 6 VITE_* env vars to Docker build so auth is enabled in production
- **MSAL redirect flow** — use `loginRedirect`/`logoutRedirect` instead of popup to avoid second-window rendering issues
- **Logout cursor** — add `cursor-pointer` to sign-out buttons in sidebar
- **Sidebar cleanup** — remove author name and LinkedIn link from sidebar footer

---

## [0.18.0] — 2026-03-14

### Added
- **Config snippet icons** — MessageSquare icon for Claude Desktop Configuration, inline SVG diamond icon for Semantic Kernel Plugin in Connection Details card

---

## [0.17.0] — 2026-03-14

### Added
- **MIT license headers** — added `// Copyright (c) 2026 VPL Solutions. All rights reserved.` header to all 39 source files (`.ts` and `.tsx`) for IP attribution
- **Hand-drawn architecture sketch on sign-in screen** — chalk-on-dark SVG overlay showing Meridian data flow (Documents -> RAG Engine -> Knowledge Base, MCP Server, AI Agents, Governance Gate) with wobbly hand-drawn paths, positioned bottom-right at 14% opacity

---

## [0.16.0] — 2026-03-14

### Added
- **Connection Details card on Settings page** — displays API and MCP endpoint URLs with copy-to-clipboard buttons, MCP reachability status indicator (green/red dot with 30s polling), copy-ready Claude Desktop `claude_desktop_config.json` snippet, and copy-ready Semantic Kernel plugin configuration snippet
- **MCP health check** — lightweight reachability probe (`GET /health` on MCP server) with 5s timeout, used by Connection Details status indicator

---

## [0.15.0] — 2026-03-13

### Added
- **Temperature Lock on Settings page** — slider control (0.0–2.0) for LLM response randomness, integrated with backend `POST /settings` operator-only endpoint; Zod-validated form field with real-time display, three-point scale labels (Precise / Balanced / Creative)
- **Temperature card on Dashboard** — 5th stat card showing current LLM temperature from `/settings`, rose-themed with Thermometer icon, 30s auto-refresh

---

## [0.14.0] — 2026-03-13

### Added
- **SSE streaming responses (ADR-0010)** — Ask Meridian now streams tokens in real-time via Server-Sent Events; confidence metadata and Citations panel appear before the answer completes; blinking cursor during generation; automatic fallback to non-streaming if SSE fails
- **ADR-0010: Streaming Responses** — documents SSE streaming architecture, event types (metadata/token/done/error), parsing strategy, and non-streaming fallback
- **ADR-0009: Release Lineage & Security Gates** — four-artifact release record (code, dependencies, auth config, bundle), security controls per pipeline stage (npm audit, secret scanning, container image scan, bundle size guard), phased rollout plan, aligned with backend ADR-0017

---

## [0.13.0] — 2026-03-12

### Changed
- **Logo links to vplsolutions.com** — clicking logo on sign-in screen, sidebar, or landing page opens vplsolutions.com in a new tab; Layout and Landing now use logo.png (was vpllogo.jfif)

### Added
- **Post-deployment verification skill** (`.claude/skills/post-deploy-verify.md`) — monitors CI pipeline and runs smoke tests against Studio, API, and MCP endpoints after each deployment

---

## [0.12.0] — 2026-03-12

### Changed
- **Sign-in screen redesign** — replaced neural network animation with geometric art (Delaunay triangular mesh, bezier curves, concentric rings), multi-agent orchestration hub (7 specialist agents in heptagon layout with animated hub-spoke pulses and cross-agent collaboration links), 18 floating capability icons (Agents, Ingestion, Cognitive AI Services), "Trusted by" customer logos row, and logo updated from vpllogo.jfif to logo.png

---

## [0.11.0] — 2026-03-12

### Added
- **MSAL.js authentication** (ADR-0008) — Azure AD/Entra ID integration behind `VITE_AUTH_ENABLED` feature flag; popup-first login with redirect fallback for Firefox; silent-first token acquisition with interactive fallback; `getAuthHeaders()` utility injects Bearer tokens into all API calls; `AuthGuard` protects routes with branded sign-in screen (aurora background, neural network animation, floating keyword pills); `UserProfile` component in sidebar with initials, display name, and logout; 401 auto-redirect for expired tokens; zero behavioral change when flag is off (default)
- **Build chunk splitting** — `manualChunks` in Vite config splits vendor dependencies into separate chunks (react, msal, query, markdown, forms, icons); main bundle reduced from 835 KB to 331 KB
- **Dynamic version display** — sidebar version now imported from `package.json` instead of hardcoded; CLAUDE.md convention added to prevent stale versions

---

## [0.10.0] — 2026-03-11

### Added
- **Evaluation human-in-the-loop feedback** — Rating column (thumbs up/down) on every query log row; analysts rate answer correctness or refusal appropriateness; persisted to `query_log.feedback` via `POST /evaluation/queries/{trace_id}/feedback`; localStorage used as optimistic cache
- **"Helpful?" label** on Ask Meridian feedback buttons — concise inline label sets user expectation before thumbs up/down icons

### Fixed
- **Citations panel width** — panel now constrained to `max-w-3xl pl-11`, matching the message bubble width; bars no longer stretch full viewport width
- **Confidential documents** — `WHITEPAPER.md` and `PRODUCT_BRIEF.md` added to `.gitignore`; never enter git history

---

## [0.9.1] — 2026-03-11

### Fixed
- **Dark mode select dropdowns** — Evaluation page filter and page size dropdowns now use `dark:bg-gray-800` instead of near-transparent `dark:bg-white/5`, fixing invisible option text on dark backgrounds
- **Feedback button visibility** — thumbs up/down icons now use `text-gray-400` / `dark:text-gray-500` (was `text-gray-300` / `dark:text-gray-600`), making them visible on both light and dark backgrounds

---

## [0.9.0] — 2026-03-11

### Added
- **Feedback buttons** — thumbs up/down on Ask Meridian and AI Operations Agent responses, persisted in localStorage per trace ID
- **Page size selector** on Evaluation query log — choose 25, 50, or 100 rows per page (replaces fixed 20-row pages)

### Changed
- **REFUSED auto-expand** — Citations panel automatically opens when a query is refused, so users immediately see per-chunk retrieval scores and why confidence fell below threshold

---

## [0.8.0] — 2026-03-11

### Changed
- **Settings page reads from `GET /settings`** — form now loads current runtime configuration from the dedicated settings endpoint instead of deriving values from `/health`; works correctly even when health is degraded
- **Settings save invalidates both `settings` and `health` query caches** — ensures Dashboard and Settings stay in sync after runtime config changes
- **Settings page loading state** — spinner shown while fetching current config from backend
- **Settings page persistence note** — inline description explaining that changes are in-memory and reset on server restart

### Added
- `getSettings()` API method (`GET /settings`) with `SettingsResponse` type
- `updateSettings()` now returns `SettingsResponse` (was `void`)
- 3 contract tests for Settings API (GET returns config, field mapping, POST sends payload and returns updated config)

---

## [0.7.0] — 2026-03-11

### Added
- **PRODUCT_BRIEF.md** — investor/sales-facing product document covering executive summary, capabilities, competitive comparison, deployment options, security, target personas, and roadmap
- **Landing page: AI Operations Agent card** — ReAct reasoning agent capability card added to Core Capabilities section
- **Landing page: Evaluation Dashboard card** — metrics and analytics capability card added to Core Capabilities section

### Changed
- Landing page Core Capabilities grid updated from 4 columns to 3 (2 rows of 3 for 6 capabilities)

### Fixed
- `package.json` version synced to `0.6.1` (was `0.5.0`)

---

## [0.6.1] — 2026-03-10

### Changed
- **Mandatory post-commit tagging** — added convention to CLAUDE.md requiring a semantic version tag after every commit, enforced by `postToolUse` hook

---

## [0.6.0] — 2026-03-10

### Added
- **AI Operations Agent** page (`/agent`) — ReAct reasoning UI that calls `POST /agent/query`, displays step-by-step tool execution timeline (tool name, input, output preview, elapsed time), and renders the final answer with markdown
- **Agent API contract tests** — 3 tests covering successful query with step mapping, response field validation, and 500 error handling
- **Dark mode toggle** — sun/moon button in sidebar, persisted in localStorage; dark: variants applied across every page and shared component
- **ServiceNow connector** (ADR-0006) — new "ServiceNow" source tab on the Ingestion Pipeline page with server-side credentials, Check Status button, optional filters (KB name, category, article limit), Sync Articles action, and result/error display
- **AI/GenAI suggested questions** — updated example questions to include generative AI policy, Azure OpenAI access, approved AI tools, and data classification topics
- **ServiceNow API contract tests** — 6 tests covering status (configured/unconfigured), ingest (filters, empty payload), and error cases (502 unreachable, 400 missing credentials)
- **Calibrated confidence support** — `raw_confidence` field from ADR-0016; ConfidencePill shows "Raw → Calibrated" when scores differ, REFUSED explanation includes both values
- Contract test for calibrated scoring (`query-ok-calibrated.json` fixture)
- **Evaluation Queries** page (`/evaluation`) — aggregate metrics dashboard (total queries, avg confidence, refusal rate, latency P50/P95) and paginated query log table with raw/calibrated confidence, chunks, latency, and source columns
- Evaluation API methods (`evaluationQueries`, `evaluationMetrics`) with TypeScript types
- 8 contract tests for evaluation endpoints (queries pagination, field mapping, raw_confidence, metrics aggregates, latency percentiles, status/source breakdowns, unconfigured state)

### Changed
- **Evaluation page enhancements** — sortable columns (Time, Status, Confidence, Latency, Source), filter dropdowns (status, source) with clear button, metric card descriptions, column header tooltips, collapsible "Understanding these metrics" guide explaining all 4 metrics and 7 query log columns
- **Ask Meridian input bar consistency** — header layout, New Chat button style, and Ctrl+K behavior aligned with Ops Agent page
- **Ops Agent UX improvements** — answer rendered above reasoning timeline (faster time-to-value), timeline collapsed by default, follow-up prompt chips ("Keep investigating"), New Query button with Ctrl+K shortcut
- **Centered input bar** on empty state for both Ask Meridian and Ops Agent — input moves to bottom-pinned position once conversation starts
- **Polished input bar** on both chat pages — elevated card with shadow, keyboard hint badge, circular send icon button, contextual placeholder ("Ask a follow-up..." during conversation)
- Rename "Retrieval Details" to **Citations** in collapsible panel header
- Move "Keep the conversation going" follow-up prompts below confidence pill and Citations panel
- Widen Citations panel and follow-up prompts to span full chat width (no longer constrained by message bubble width)

### Fixed
- ServiceNow connector: use `GET /ingest/servicenow/status` (actual backend endpoint) instead of non-existent `POST /ingest/servicenow/test`
- Follow-up prompts and Citations panel no longer leave empty whitespace on right side

---

## [0.5.0] — 2026-03-09

### Added
- **Retrieval Details panel** — collapsible panel under each response with per-chunk confidence trackbars, threshold markers, shield pass/fail icons, best/avg stats, and trace ID
- `retrieval_scores` field in `QueryResponse` type

### Changed
- Rebrand Cognitive AI Services sidebar section to **AI Lab — Preview** with violet badge
- Add "AI Lab — Preview" pill next to page headings on Language, Vision, Speech, and Document Intelligence pages
- Move Document Intelligence from Core to AI Lab section in sidebar
- Enable Diagnostics & Governance panel on Document Intelligence page
- Rename Document Intelligence page heading from "Document Preview" to "Document Intelligence"
- Landing page: split capabilities into Core (4 cards) and AI Lab — Preview (3 dashed-border cards)
- Shorten sidebar AI nav labels to "Language", "Vision", "Speech", "Document"
- Update AI disclaimer to co-pilot framing

---

## [0.4.0] — 2026-03-09

### Added
- **Pin/Unpin sidebar** — collapsible sidebar with icon-only mode; expands on hover when unpinned; state persisted in localStorage
- **REFUSED response UX** — confidence explanation ("Confidence was X% — minimum threshold is Y%"), suggestion chips ("Try one of these instead") on refused queries
- **Follow-up prompts** — "Keep the conversation going" chips (Tell me more, Give an example, Key takeaways, Compare to alternatives) after successful OK responses
- **Landing page** at `/welcome` — dark hero section with iridescent gradient, 7 capability cards, "Get Started" and "View Source" CTAs
- **Markdown rendering** in assistant responses via `react-markdown`
- **Copy answer button** on each assistant response (clipboard API)
- **Offline/disconnect banner** when API health check fails
- **Chat history persistence** — messages survive page refresh via localStorage
- **New Chat button** to clear conversation and localStorage
- **Keyboard shortcuts** — Ctrl+K focuses chat input, Escape clears input
- **Auto-resize chat area** — textarea grows with input, chat area uses full viewport height
- **AI disclaimer** — footer note under chat input: "it turns out the human, not the AI, made a mistake"
- **Query page component tests** — 7 tests covering empty state, OK response follow-ups, REFUSED suggestion chips, and chip interactions

### Changed
- Rename "Query Console" to "Ask Meridian" in sidebar nav and page heading

---

## [0.3.0] — 2026-03-09

### Added
- **Multi-turn chat** in Query Console — conversation history is sent with each query so follow-up questions ("What is so great about #1?") work naturally (ADR-0005)
- **Dynamic example questions** — Query Console loads suggested questions from backend `/health` endpoint, falls back to `public/example-questions.json`, then hardcoded defaults
- **Query Console** redesigned as a chat interface — persistent message history, user/assistant bubbles, typing indicator, example question chips, auto-scroll, Enter to send, confidence pill and trace ID shown inline per response
- **Ingestion Pipeline** page replacing Document Upload — pipeline stage visualization (Upload → Chunk → Embed → Index), multi-file support, 120s timeout for large documents
- Collapsible "What should I ingest?" guidance on Ingestion Pipeline page
- Icons and inline descriptions for all Settings fields (LLM Provider, Retrieval Provider, Retrieval Threshold)
- Icons for all Cognitive AI Services entries on Settings page
- `meridianApi.ingest` API function with `IngestResponse` type
- Vitest + MSW + Testing Library test framework (ADR-0003)
- API contract tests for `meridianApi.query` (payload shape, REFUSED/OK response mapping)
- API contract test for `meridianApi.health`
- MCP response fixtures from real backend responses
- `npm test` and `npm run test:watch` scripts

### Changed
- Deploy workflow: switch from Azure Static Web Apps to Azure Container Apps (Docker/ACR)
- Remove PR-trigger and close-staging job (Container Apps doesn't support SWA preview environments)
- Settings: rename "Azure AI Services" to "Cognitive AI Services", mark all 4 services as active
- Settings: updated page subtitle with descriptive text
- Document Intelligence icon unified to `FileSearch` across sidebar nav and Settings page
- Document Intelligence page repurposed as "Document Preview" — pipeline extraction debugging tool
- Document Preview moved from Cognitive AI Services to core nav (next to Ingest)
- Cognitive AI Services reduced to 3 services: Language, Vision, Speech
- Settings: removed Document Intelligence from Cognitive AI Services list
- Ingestion Pipeline: added Extract stage between Upload and Chunk

### Fixed
- Query: handle HTTP 422 (REFUSED) as valid QueryResponse instead of throwing — governance refusals now display correctly
- Query: switch from MCP `/tools/call` to direct `/query` endpoint on Meridian API
- Ingest: fix missing `FileSearch` import (pre-existing bug)
- Sidebar: increase inactive nav link opacity (white/40 → white/65) for legibility on MacBook displays
- Settings: Retrieval Threshold description moved below label row (was incorrectly inside flex justify-between)
- Query page MCP integration: send correct `query_knowledge_base` tool call payload and map response fields (`confidence` -> `confidence_score`, `reason` -> `refusal_reason`)
- ESLint `no-unused-vars` error: remove unused `SpeechSynthesisResult` import
- ESLint `react-refresh/only-export-components` error: split diagnostics into separate context, provider, and hook files
- TypeScript build errors: update `useTrackedMutation` to TanStack Query v5 4-arg callback signatures
- TypeScript build errors: fix unsafe type cast in Speech Services transcript display

---

## [0.2.1] — 2026-03-05

### Added
- **Diagnostics & Governance** right sidebar panel on all Cognitive AI Services pages
- `DiagnosticsProvider` React Context for session-level API call tracking
- `useTrackedMutation` hook — wraps React Query's `useMutation` to auto-record service calls
- `DiagnosticsPanel` component with collapsible Diagnostics and Governance sections
- Azure AI pricing estimates (per-service, clearly labeled as approximate)
- ADR-0002: Diagnostics & Governance Panel architecture decision
- Auto-reset diagnostics on AI service page navigation

### Fixed
- Document Intelligence crash when accessing `data.data.model_id` on flat API response
- Speech TTS "not valid JSON" error — switched to `postForBlob` for binary WAV audio
- Null safety for undefined nested response fields across AI service pages

---

## [0.2.0] — 2026-03-04

### Added
- **Language Intelligence** page — sentiment analysis, entity recognition, key phrase extraction, and language detection powered by Azure AI Language
- **Vision Intelligence** page — image analysis (caption, tags, objects) and OCR text extraction powered by Azure AI Vision
- **Speech Services** page — speech-to-text transcription with word-level timings, and text-to-speech synthesis with voice selection powered by Azure AI Speech
- **Document Intelligence** page — structured data extraction from documents (invoices, receipts, IDs, layouts) powered by Azure AI Document Intelligence
- "Cognitive AI Services" nav section in sidebar grouping the four new Azure AI feature pages
- `SpeechTranscriptResult`, `SpeechSynthesisResult`, `DocumentAnalysisResult`, `OcrResult` types in `api/types.ts`
- `transcribe`, `textToSpeech`, `analyzeDocument` methods in `azureAiApi`; `ocr` return type strengthened to `OcrResult`
- Iridescent animated gradient on "Meridian Studio" title and sidebar footer links
- Animated gradient on nav links (hover/focus only — natural white at rest)
- Icon micro-animations on Dashboard stat cards (hover)
- Concise page descriptions and provider config hints on Dashboard, Query, and Upload
- Trademark disclaimer footer on all pages
- Dashboard: live provider config hint with link to Settings

### Changed
- Sidebar nav refactored into reusable `NavItem` component with scrollable `overflow-y-auto` region
- Sidebar background reverted to solid black
- Dashboard title updated to `h1` with descriptive subtitle

---

## [0.1.0] — 2025-01-01

### Added
- Initial scaffold: Vite + React 19 + TypeScript 5.9 + Tailwind CSS v4
- Dashboard page with health/status cards (Status, Documents, LLM Provider, Threshold)
- Query Console with confidence gauge and answer display
- Upload page with drag-and-drop document ingestion
- Settings page with LLM and retrieval provider switching (React Hook Form + Zod)
- React Query v5 integration for API state management
- Settings form seeded from React Query cache (no flash on remount)
- StatusBadge component with luminescent glow dots
- Sidebar layout with iridescent top accent strip
- VPL logo in sidebar header
- GitHub and LinkedIn social links in sidebar footer

[Unreleased]: https://github.com/tvprasad/meridian-studio/compare/v0.21.0...HEAD
[0.21.0]: https://github.com/tvprasad/meridian-studio/compare/v0.20.0...v0.21.0
[0.20.0]: https://github.com/tvprasad/meridian-studio/compare/v0.19.0...v0.20.0
[0.19.0]: https://github.com/tvprasad/meridian-studio/compare/v0.18.2...v0.19.0
[0.18.2]: https://github.com/tvprasad/meridian-studio/compare/v0.18.1...v0.18.2
[0.18.1]: https://github.com/tvprasad/meridian-studio/compare/v0.18.0...v0.18.1
[0.18.0]: https://github.com/tvprasad/meridian-studio/compare/v0.17.0...v0.18.0
[0.17.0]: https://github.com/tvprasad/meridian-studio/compare/v0.16.0...v0.17.0
[0.16.0]: https://github.com/tvprasad/meridian-studio/compare/v0.15.0...v0.16.0
[0.15.0]: https://github.com/tvprasad/meridian-studio/compare/v0.14.0...v0.15.0
[0.14.0]: https://github.com/tvprasad/meridian-studio/compare/v0.13.0...v0.14.0
[0.13.0]: https://github.com/tvprasad/meridian-studio/compare/v0.12.0...v0.13.0
[0.12.0]: https://github.com/tvprasad/meridian-studio/compare/v0.11.0...v0.12.0
[0.11.0]: https://github.com/tvprasad/meridian-studio/compare/v0.10.0...v0.11.0
[0.10.0]: https://github.com/tvprasad/meridian-studio/compare/v0.9.1...v0.10.0
[0.9.1]: https://github.com/tvprasad/meridian-studio/compare/v0.9.0...v0.9.1
[0.9.0]: https://github.com/tvprasad/meridian-studio/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/tvprasad/meridian-studio/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/tvprasad/meridian-studio/compare/v0.6.1...v0.7.0
[0.6.1]: https://github.com/tvprasad/meridian-studio/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/tvprasad/meridian-studio/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/tvprasad/meridian-studio/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/tvprasad/meridian-studio/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/tvprasad/meridian-studio/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/tvprasad/meridian-studio/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/tvprasad/meridian-studio/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/tvprasad/meridian-studio/releases/tag/v0.1.0
