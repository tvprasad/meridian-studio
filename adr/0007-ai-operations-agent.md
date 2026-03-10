# ADR-0007: AI Operations Agent

## Status

Accepted

## Context

Meridian's "Ask Meridian" query console is a RAG-based Q&A tool grounded in uploaded documents. It works well for knowledge retrieval, but operational questions ("Why are login requests failing?") require multi-step investigation across incidents, metrics, and logs — not just document search.

We needed a way for operators to ask complex operational questions and see the agent's reasoning process as it works through the problem.

## Decision

Add an **AI Operations Agent** page at `/agent` as a new core route (not under AI Lab). The agent calls `POST /agent/query` on the Meridian API, which executes a ReAct (Reason + Act) loop: the backend autonomously selects and calls tools (search_incidents, query_metrics, get_logs, etc.), then synthesizes a final answer.

### Frontend changes

- **New page**: `src/pages/AgentQuery.tsx` with its own chat-style interface
- **Reasoning timeline**: Collapsible panel showing each step — tool name, input JSON, output preview, elapsed time — rendered as a vertical timeline with expand/collapse per step
- **Final answer**: Markdown-rendered response with copy button, trace ID, total elapsed time, and step count
- **Navigation**: "Ops Agent" item with Bot icon in core nav (between Ask Meridian and Ingest)
- **Types**: `AgentStep`, `AgentQueryResponse` in `src/api/types.ts`
- **API method**: `meridianApi.agentQuery()` — `POST /agent/query` with 120s timeout

### Backend contract

| Endpoint | Method | Body | Response |
|----------|--------|------|----------|
| `/agent/query` | POST | `{ question }` | `{ trace_id, status, answer, steps[], steps_taken, elapsed_ms }` |

Each step in `steps[]`:

```json
{
  "step": 1,
  "tool": "search_incidents",
  "input": {"query": "login failures us-east"},
  "output_preview": "INC-4021: auth-gateway TLS cert expired...",
  "elapsed_ms": 460
}
```

### Why a separate page, not a tab on Ask Meridian

- Ask Meridian is RAG (document grounded, multi-turn conversation history, confidence scoring)
- The agent is ReAct (tool-calling, step-by-step reasoning, no conversation history in v1)
- Different UX — the reasoning timeline is central to the agent experience
- Separate pages allow independent evolution without coupling

### Why violet theming

- Ask Meridian uses the primary (blue) palette
- The agent uses violet to visually distinguish the two experiences
- Consistent with the "AI Lab" preview badge styling

## Consequences

- Backend must implement `POST /agent/query` with the specified response shape
- Future enhancements: streaming steps (SSE), conversation memory, tool configuration
- Contract tests (3 tests) ensure the frontend stays aligned with the backend response shape
- The reasoning timeline pattern is reusable for any future agent-style features
