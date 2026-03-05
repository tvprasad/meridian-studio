# ADR-0002: Diagnostics & Governance Panel

## Status

Accepted

## Context

The Cognitive AI Services pages (Language, Vision, Speech, Document Intelligence) call Azure AI endpoints. Operators need visibility into:

- **Diagnostics**: What was the last API call? What status/latency? What request ID for troubleshooting?
- **Governance**: How many calls this session? What's the estimated cost? Which services are being used?

The Streamlit-based Azure AI Studio prototype already has this pattern (left sidebar with Diagnostics and Governance sections). We need the same in Meridian Studio.

## Decision

| Aspect | Choice | Rationale |
|--------|--------|-----------|
| Placement | Right sidebar panel | Always visible on AI pages, doesn't interfere with main content |
| Visibility | AI service routes only (`/language`, `/vision`, `/speech`, `/document`) | Core pages (Dashboard, Query, Upload, Settings) don't need it |
| State management | React Context (`DiagnosticsProvider`) | Session-scoped, no persistence needed, lightweight |
| Tracking mechanism | `useTrackedMutation` hook | Wraps React Query's `useMutation` to auto-record calls without changing page logic |
| Cost estimation | Static per-service pricing constants | Rough Azure retail pricing (2026-Q1), clearly labeled as estimates |
| Collapsibility | Both Diagnostics and Governance sections are independently collapsible | Reduces visual noise when not needed |

### Architecture

```
DiagnosticsProvider (App.tsx)
  └─ useDiagnostics() — context hook for reading/writing call records
  └─ useTrackedMutation() — wraps useMutation, auto-records on success/error
  └─ DiagnosticsPanel — renders right sidebar, reads from context
```

## Alternatives Considered

- **Bottom collapsible section per page**: Less visible, requires scrolling to see
- **Dedicated Governance page**: Too much navigation friction for real-time diagnostics
- **Browser DevTools / Network tab**: Not user-friendly for operators
- **Server-side tracking**: More accurate but adds backend complexity; session-level client tracking is sufficient for now

## Consequences

- Every AI service API call is tracked in-memory for the session
- Operators get immediate feedback on call status, latency, and cost
- No backend changes required
- Session data resets on page refresh (intentional — no persistence)
- Cost estimates are approximate; a disclaimer is shown in the panel
