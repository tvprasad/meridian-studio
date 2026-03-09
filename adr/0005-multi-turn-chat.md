# ADR-0005: Multi-Turn Chat in Query Console

## Status

Accepted

## Context

The Query Console currently operates as a single-shot Q&A interface — the user asks one question, gets one answer, and every subsequent question starts from scratch. This means follow-up questions like "What is so great about #1?" fail because the LLM has no memory of the previous exchange.

Real-world knowledge base exploration is conversational. Users ask an initial question, then drill down, rephrase, or ask follow-ups that reference prior answers. Without conversation history, each query is isolated and the user must repeat context manually.

The backend's `POST /query` endpoint currently accepts `{ question: string }`. The LLM provider builds a fresh 2-message array (system + user) for every call. No conversation context is preserved.

## Decision

Add multi-turn conversation support across the full stack:

### Frontend (meridian-studio)

- Transform the Query Console from a single-response card into a **chat thread UI** with scrolling message history
- Maintain a `messages[]` array in component state tracking user questions and assistant responses
- Send the conversation history with each query so the backend can pass it to the LLM
- The conversation resets on page navigation or explicit "New conversation" action

### Backend (meridian)

- Extend `POST /query` to accept an optional `conversation_history` field — an array of `{ role, content }` message objects
- Update `LLMProvider.generate()` to accept an optional `messages` parameter alongside the existing `prompt`
- The Azure OpenAI provider passes conversation history as prior turns in the `messages` array to `chat.completions.create()`
- The Ollama provider concatenates history into a single prompt string (Ollama's `/api/generate` endpoint does not support a messages array)
- Retrieval continues to use only the **latest user question** for vector search — prior turns provide LLM context, not retrieval context
- Governance (confidence threshold gating) remains unchanged — the conversation history does not bypass the retrieval confidence check

### Message format

```json
{
  "question": "What is so great about #1?",
  "conversation_history": [
    { "role": "user", "content": "What topics are in the knowledge base?" },
    { "role": "assistant", "content": "The knowledge base covers deployment, rollback procedures, and..." }
  ]
}
```

The `conversation_history` field is optional. When omitted, behavior is identical to the current single-shot mode — full backward compatibility.

### What does NOT change

- Retrieval uses only the latest question (not the full conversation)
- Governance threshold gating is unchanged
- The MCP `query_knowledge_base` tool keeps its current single-question interface (MCP clients manage their own conversation state)
- Telemetry logging structure is unchanged

## Alternatives Considered

- **Client-side prompt concatenation**: Concatenate all prior Q&A into a single mega-question on the frontend. Simpler but produces poor retrieval results (vector search on a concatenated blob) and wastes tokens.
- **Server-side session storage**: Store conversation state on the backend keyed by session ID. Adds statefulness, session management, and cleanup complexity. The frontend already has the history in memory — passing it is simpler.
- **Send history through MCP**: Extend the MCP tool schema with a `messages` field. Unnecessary complexity — the frontend now calls `/query` directly.

## Consequences

- The Query Console becomes conversational — follow-up questions work naturally
- Backend API gains an optional field (`conversation_history`) with no breaking changes
- LLM provider interface gains an optional `messages` parameter — existing implementations continue to work
- Token usage increases with conversation length (each turn re-sends the full history)
- No server-side session state — the frontend owns the conversation lifecycle
- Ollama provider gets a best-effort implementation (flattened history in prompt) since it lacks native chat API support
