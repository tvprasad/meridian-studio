# Changelog

All notable changes to Meridian Studio will be documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

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

[Unreleased]: https://github.com/tvprasad/meridian-studio/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/tvprasad/meridian-studio/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/tvprasad/meridian-studio/releases/tag/v0.1.0
