# ADR-0003: Testing Strategy

## Status

Accepted

## Context

Multiple bugs have reached `main` because there are no automated tests in meridian-studio:

- Query page sent wrong MCP payload shape (`{ question }` instead of `{ name, arguments }`)
- Response field names mismatched between MCP (`confidence`, `reason`) and frontend types (`confidence_score`, `refusal_reason`)
- TanStack Query v5 callback signature changes broke the build
- Unsafe type casts passed `tsc` but masked runtime shape mismatches

These are all preventable with API contract tests. The frontend talks to two backends (Meridian API on port 8000, MCP server on port 8001) with distinct response shapes, making mapping correctness critical.

## Decision

| Aspect | Choice | Rationale |
|--------|--------|-----------|
| Test runner | Vitest | Native Vite integration, same transform pipeline, fast HMR-aware watch mode |
| DOM testing | `@testing-library/react` + `jsdom` | Standard React testing library, tests user-facing behavior |
| API mocking | Mock Service Worker (MSW) | Intercepts at the network level, same fetch code runs in tests as production |
| Contract fixtures | `src/__fixtures__/` directory | Real response snapshots from curl/backend, single source of truth for response shapes |
| CI integration | `npm test` in existing CI workflow | Fails the build on any test failure, prevents regressions from merging |

### Test layers

```
Layer 1 — API mapping tests (highest priority)
  Assert that meridianApi.query() sends the correct payload
  Assert that MCP/backend response fixtures map to correct frontend types
  No DOM rendering needed — pure function tests

Layer 2 — Component integration tests
  Render pages with MSW intercepting network calls
  Verify that components display data correctly from mocked responses
  Catches rendering bugs and data flow issues

Layer 3 — E2E tests (future, not in this ADR)
  Playwright against running frontend + backend
  Deferred until backend is stable and deployed
```

### File conventions

```
src/
  api/
    __tests__/
      meridian.test.ts       # API mapping tests
      azure-ai.test.ts       # Azure AI API mapping tests
  __fixtures__/
    mcp-query-refused.json   # Real MCP response fixtures
    mcp-query-ok.json
    health.json
  pages/
    __tests__/
      Query.test.tsx          # Component integration tests
```

## Alternatives Considered

- **Jest**: Requires separate transform config for ESM/Vite; Vitest is zero-config with Vite
- **Cypress for E2E**: Heavier, better suited for later when backend is deployed; Playwright is lighter and faster
- **No mocking (live backend in CI)**: Fragile, slow, requires backend infra in CI; MSW gives deterministic tests
- **Type-only validation (Zod schemas)**: Catches shape issues at runtime but doesn't verify payload correctness; tests cover both

## Consequences

- Every API mapping function gets a contract test before merge
- CI blocks PRs that break API contracts
- Fixture files must be updated when backend response shapes change (intentional — forces conscious acknowledgment)
- Adds ~3 dev dependencies (`vitest`, `@testing-library/react`, `msw`)
- Test suite runs in <5s for Layer 1+2, no impact on developer workflow
