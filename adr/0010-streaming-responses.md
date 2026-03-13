# ADR-0010: Streaming Responses

## Status
Accepted

## Context

When a user submits a query in Ask Meridian, the current flow sends a `POST /query` request and waits for the full LLM response before rendering anything. For complex questions with lengthy answers, this creates a blank-screen wait of 5-15 seconds — the user sees only the bouncing-dot "thinking" indicator with no feedback on whether the system is working or stuck.

The backend already supports SSE streaming via `POST /query?stream=true` (Meridian backend issue #14). The streaming endpoint returns `text/event-stream` with four event types:

| Event | Payload | When |
|-------|---------|------|
| `metadata` | `{trace_id, status, confidence_score, raw_confidence, threshold, retrieval_scores, t_retrieve_ms}` | After retrieval, before generation |
| `token` | `{text: "chunk"}` | Each LLM token |
| `done` | `{trace_id, t_retrieve_ms, t_generate_ms, t_total_ms}` | After last token |
| `error` | `{trace_id, status, refusal_reason, confidence_score?}` | REFUSED or UNINITIALIZED |

Governance (retrieval, confidence gating, refusal) executes before the first token is streamed. REFUSED queries emit a single `error` event with no tokens.

## Decision

Add SSE streaming to the Ask Meridian query flow in meridian-studio. The frontend will use the browser `fetch` API with `ReadableStream` to parse SSE events and render tokens incrementally as they arrive.

### Design

1. **`queryStream()` in `src/api/meridian.ts`** — new function that calls `POST /query?stream=true` and returns an async generator yielding parsed SSE events. Uses `ReadableStream` + `TextDecoder` for chunked parsing. No dependency on `EventSource` (which only supports GET).

2. **Streaming state in `Query.tsx`** — replace `useMutation` with a `useCallback`-based streaming handler. Track streaming state (`idle`, `streaming`, `done`, `error`) and accumulate tokens into the current assistant message incrementally.

3. **UX improvements from streaming:**
   - Metadata event arrives before generation → show confidence pill and Citations panel immediately while tokens stream
   - Tokens render character-by-character → user sees the answer forming in real-time
   - ThinkingIndicator shows only during retrieval phase (before metadata event), not during generation
   - Error events (REFUSED) render the same refusal UX as today

4. **Non-streaming fallback** — if the streaming request fails (e.g., network issue with chunked transfer), fall back to the existing `POST /query` (no `?stream=true`).

### SSE Parsing

The frontend parses the `text/event-stream` format manually using `response.body.getReader()`:
- Buffer incoming chunks, split on `\n\n` (event boundaries)
- Extract `event:` and `data:` lines from each block
- Parse `data:` as JSON
- Yield typed events to the consumer

This avoids the `EventSource` API (GET-only, no POST body, no custom headers) and third-party SSE libraries.

## Alternatives Considered

### EventSource API
- Browser-native SSE client
- Only supports GET requests — our endpoint requires POST with JSON body
- No custom headers (needed for auth)
- Rejected: fundamental API limitation

### WebSocket
- Full-duplex, lower overhead for high-frequency updates
- Backend would need a separate WebSocket endpoint
- Overkill for request-response with streaming — SSE is the right tool
- Rejected: unnecessary complexity

### Third-party SSE library (eventsource-parser, sse.js)
- Handles edge cases in SSE parsing
- Adds a dependency for a straightforward parsing task
- The SSE format from our backend is simple (no multi-line data, no retry, no id)
- Rejected: not worth the dependency for our use case

## Consequences

**Positive:**
- Eliminates blank-screen wait — users see tokens as they arrive
- Confidence and retrieval metadata visible before answer completes
- Perceived latency drops significantly (first token in ~1-2s vs full answer in 5-15s)
- No new dependencies — uses browser-native fetch + ReadableStream
- Non-streaming fallback preserves compatibility with older backends

**Negative:**
- Slightly more complex state management in Query.tsx (streaming state machine vs simple mutation)
- SSE parsing code must handle chunked boundaries correctly
- localStorage persistence of messages happens after stream completes (not per-token)
