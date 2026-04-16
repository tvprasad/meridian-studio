# ADR-0001: WCAG 2.1 AA Accessibility Conformance — Meridian Studio

**Status:** Accepted
**Date:** 2026-04-14
**Standard:** vpl-claude-kit ADR-0001 (WCAG 2.1 AA Accessibility Conformance Standard)

## Context

Meridian Studio is the operator UI for the Meridian governed RAG control plane, deployed
at studio.vplsolutions.com. It targets enterprise and federal operators. As of April 2026
the application has incidental accessibility coverage only: some ARIA attributes exist on
individual components (ModeToggle, DagTrace, SessionBadge) but no structural accessibility
is in place — no landmark elements, no live regions on streaming output, many form labels
unassociated with their inputs.

Key Studio-specific gaps beyond the cross-cutting standard:

1. **Streaming responses** — Query.tsx and AgentQuery.tsx stream AI output token-by-token
   with no `aria-live` region. Screen reader users receive no feedback that a response is
   building or that a refusal (HTTP 422) occurred.
2. **Layout.tsx has no landmark structure** — no `<header>`, `<nav>`, or `<main>`.
   Every page in the app inherits this gap.
3. **Form labels unassociated** in Ingest.tsx, LanguageIntelligence.tsx,
   DocumentIntelligence.tsx — `<label>` elements exist without `htmlFor`/`id` pairing.
4. **focus:outline-none** on query textareas without compensating focus rings.

## Decision

Meridian Studio adopts the VPL WCAG 2.1 AA standard (vpl-claude-kit ADR-0001).

**Studio-specific implementation decisions:**

**S1 — Landmark structure:** `Layout.tsx` is the single fix point. Adding `<header>`,
`<nav aria-label="Main navigation">`, and `<main id="main-content">` to Layout propagates
correct structure to every page. Skip link added as first element in Layout.

**S3 — Live regions:** The query response container in Query.tsx and AgentQuery.tsx receives
`aria-live="polite" aria-atomic="false"`. The REFUSED/422 path receives `role="alert"`.
Loading indicators receive `role="status" aria-label="Generating response"`. This is an
architectural invariant: every streaming output surface must have a live region annotation.

**S2 — Form labels:** Each unlabelled input receives a unique `id`; each `<label>` receives
the matching `htmlFor`. No visual changes. Affects: Ingest.tsx, LanguageIntelligence.tsx,
DocumentIntelligence.tsx.

**S4 — DagTrace keyboard:** DagTrace.tsx already has `role="button"` and `tabIndex` on
clickable nodes. An `onKeyDown` handler for Enter and Space is added to match click behavior.

**S8 — axe-core CI:** `@axe-core/react` added as dev dependency. Violations at `critical`
or `serious` severity fail the Vitest run. Zero tolerance from Sprint 8 forward.

## Alternatives Considered

**Fix Layout.tsx landmarks only, defer form labels** — rejected: form labels are P0 blockers
under WCAG 1.3.1. An operator who uses a screen reader cannot operate the Ingest or Settings
pages without them.

**Use aria-label on inputs instead of htmlFor** — rejected: `aria-label` is a fallback for
inputs that cannot have a visible label. All Studio inputs already have visible labels;
`htmlFor` is the correct association mechanism and is what assistive technology expects.

## Consequences

- Layout.tsx change propagates landmark structure to all pages — single commit, full coverage
- Streaming live regions are now an architectural requirement tracked by this ADR
- `/architecture-check` can detect if a new streaming output is added without a live region
- axe-core CI gate prevents accessibility regressions from merging silently
- No visual changes result from S1, S2, or S4 — purely structural/semantic
