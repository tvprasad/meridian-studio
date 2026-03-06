# Changelog

All notable changes to Meridian Studio will be documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Added
- **Ingestion Pipeline** page replacing Document Upload — pipeline stage visualization (Upload → Chunk → Embed → Index), multi-file support, 120s timeout for large documents
- `meridianApi.ingest` API function with `IngestResponse` type
- Vitest + MSW + Testing Library test framework (ADR-0003)
- API contract tests for `meridianApi.query` (payload shape, REFUSED/OK response mapping)
- API contract test for `meridianApi.health`
- MCP response fixtures from real backend responses
- `npm test` and `npm run test:watch` scripts

### Changed
- Deploy workflow: switch from Azure Static Web Apps to Azure Container Apps (Docker/ACR)
- Remove PR-trigger and close-staging job (Container Apps doesn't support SWA preview environments)

### Fixed
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

[Unreleased]: https://github.com/tvprasad/meridian-studio/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/tvprasad/meridian-studio/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/tvprasad/meridian-studio/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/tvprasad/meridian-studio/releases/tag/v0.1.0
