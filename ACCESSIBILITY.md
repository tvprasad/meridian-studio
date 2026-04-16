# Accessibility — Meridian Studio

## Target Standard
WCAG 2.1 Level AA · Section 508 (adopts WCAG 2.1 AA as baseline)

## Conformance Status
Partial conformance. Structured remediation in progress through Sprint S6.

| Sprint | Scope | Status |
|--------|-------|--------|
| S1 | Landmark structure, skip navigation, sidebar nav labels | Complete |
| S2 | Form label association — Ingest, Language Intelligence, Document Intelligence | Complete |
| S3 | Live regions — RAG streaming, Agent streaming, REFUSED state | Complete |
| S4 | Keyboard operability — DAG trace nodes, textarea aria-labels | Complete |
| S5 | Contrast audit (DagTrace metadata), reduced-motion CSS block | Complete |
| S6 | Focus management — no modal dialogs in Studio scope | N/A |
| S8 | AT manual verification (VoiceOver / NVDA) | Pending |

Full conformance claim will be made after S8 manual verification is complete.

## Known Limitations
- Conformance badges deferred until AT manual verification (S8) is complete.
- Studio is an authenticated operator tool; public access is not provided.
- DAG Trace panel contains complex SVG-based visualizations; full screen-reader equivalents are provided via text labels on each node.

## Scope
This statement covers the Meridian Studio operator interface at studio.vplsolutions.com.
It does not cover the Meridian API backend or MCP server.

## How to Report an Issue
If you encounter an accessibility barrier in Meridian Studio, contact us at:

**studio@vplsolutions.com**

We aim to respond to accessibility issues within 5 business days.

## Technical Approach
- React 19 + TypeScript, Tailwind CSS v4, no component library
- ARIA implemented directly — no abstraction layer
- Streaming AI output wrapped in `aria-live="polite" aria-atomic="false"` regions
- Animations suppressed via `prefers-reduced-motion` CSS block
- Policy ADR: vpl-claude-kit `docs/adr/ADR-0001-wcag-accessibility-standard.md`
- Implementation ADR: `docs/adr/ADR-0001-wcag-accessibility-conformance.md`
