# ADR-0011: Graph Pipeline UX Support

## Status
Accepted — implementation deferred until backend v1.2 ships ADR-0023

## Context

Meridian backend ADR-0023 introduces an opt-in LangGraph pipeline
(`PIPELINE_MODE=graph`) as an alternative to the current linear pipeline.
The graph pipeline adds three new behaviors visible to users:

1. **Retry loop** — up to 3 retrieval-validation-refinement cycles before
   answering or refusing. Users will see longer response times (2-7x) but
   higher retrieval precision.

2. **Validation reasoning** — an LLM-as-judge step produces a sufficiency
   assessment and reasoning string on every query. This is new diagnostic
   data not present in linear mode.

3. **Per-retry telemetry** — each retry iteration is logged with its own
   confidence score, refined query, and validation reason. The evaluation
   table schema grows.

Studio must surface these behaviors without breaking the linear-mode UX
that remains the default.

### Alignment with backend roadmap

```
Backend v1.0  — linear pipeline (current Studio support)
Backend v1.2  — graph pipeline opt-in (this ADR)
Studio v0.25+ — graph pipeline UX (this ADR, after backend ships)
```

## Decision

**Add graph pipeline awareness to Studio, gated on backend response fields.**

Studio will not add a pipeline mode toggle. The backend operator sets
`PIPELINE_MODE` via environment variable. Studio detects graph-mode
responses by the presence of new fields in the `QueryResponse`.

### Detection strategy

The backend `POST /query` response gains optional fields when
`PIPELINE_MODE=graph`:

```typescript
interface QueryResponse {
  // existing fields unchanged
  status: 'OK' | 'REFUSED';
  answer?: string;
  confidence: number;
  // new graph-mode fields (absent in linear mode)
  retry_count?: number;
  validation_reason?: string;
  refined_queries?: string[];
}
```

Studio checks `retry_count !== undefined` to determine graph mode.
No feature flag needed in Studio — the backend response drives the UX.

### UX changes

| Area | Linear (unchanged) | Graph (new) |
|------|-------------------|-------------|
| Ask Meridian | Single response | Show retry indicator if `retry_count > 0`: "Refined query 2 of 3" |
| Confidence pill | `62.1% confidence` | `62.1% confidence (after 2 retries)` |
| Citations panel | Source chunks | Add validation reasoning section: why context was deemed sufficient/insufficient |
| Evaluation table | Existing columns | New columns: Retries, Validation Reason |
| Evaluation metrics | Current 4 cards | Add "Avg Retries" metric card |
| Settings | No pipeline config | Show current pipeline mode (read-only, from `/health`) |

### What Studio does NOT do

- **No pipeline toggle in UI** — this is an operator decision, not a user
  preference. Changing pipeline mode affects cost and latency for all users.
- **No graph visualization** — the retry loop is an implementation detail.
  Users see the outcome (answer quality), not the graph topology.
- **No streaming changes in v0.25** — graph-mode streaming is a backend
  follow-up (v1.2.1 or v1.3 per ADR-0023).

## Consequences

### Positive

- Studio adapts automatically to graph-mode responses without configuration.
- Users see richer diagnostics (retry count, validation reasoning) that
  explain why graph mode produces better answers.
- Evaluation table captures per-retry data for retrieval quality analysis.
- Zero impact on linear-mode UX — all new UI elements are conditional.

### Negative

- New `QueryResponse` fields must be added to `src/api/types.ts` and
  tested with fixtures from the graph pipeline.
- Evaluation table grows wider — may need horizontal scroll or column
  toggle on smaller viewports.

### Neutral

- Implementation is blocked until backend v1.2 ships and the response
  schema is finalized. Studio work begins after backend integration tests
  confirm the new fields.
