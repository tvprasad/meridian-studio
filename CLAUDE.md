# Meridian Studio — Project Context

## What is this?
React frontend for the Meridian RAG knowledge engine. Provides a Query console, AI Operations Agent (ReAct reasoning), Ingestion Pipeline (document chunking, embedding, indexing), Cognitive AI Services (Language, Vision, Speech, Document Intelligence), and a Settings page.

## Tech Stack
- **Framework**: React 19 + TypeScript + Vite 7
- **Styling**: Tailwind CSS v4
- **State**: TanStack React Query v5
- **Routing**: React Router v7
- **Testing**: Vitest + MSW + Testing Library (ADR-0003)
- **CI**: GitHub Actions (lint → test → build)

## Architecture
- `src/api/client.ts` — shared fetch wrapper with 30s timeout (AbortController)
- `src/api/meridian.ts` — Meridian API + MCP server calls (port 8000 / 8001)
- `src/api/azure-ai.ts` — Azure Cognitive AI Services calls
- `src/hooks/` — DiagnosticsContext, DiagnosticsProvider, useDiagnostics, useTrackedMutation
- `src/pages/` — one component per route
- `src/__fixtures__/` — real backend response fixtures for contract tests
- `adr/` — architecture decision records (0001–0007)

## Backends
| Service | Default URL | Purpose |
|---------|-------------|---------|
| Meridian API | `http://localhost:8000` | RAG engine (health, settings, upload, agent) |
| MCP Server | `http://localhost:8001` | Tool calls (query_knowledge_base) |

The MCP `tools/call` endpoint expects: `{ name: "query_knowledge_base", arguments: { question } }`

## Conventions

### Commits
- Use conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, `ci:`, `test:`
- Always end with `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`
- Update CHANGELOG.md under `[Unreleased]` in every commit with code changes

### Before every commit
1. `npm run lint` — 0 errors (warnings OK)
2. `npm test` — all tests pass
3. `npm run build` — TypeScript + Vite build clean
4. CHANGELOG.md updated
5. ADR written for architectural decisions

### After every commit (mandatory)
1. Determine version bump from commit prefix: `fix:` = patch, `feat:` = minor, breaking change = major
2. Move `[Unreleased]` entries in CHANGELOG.md to new `[x.y.z] — YYYY-MM-DD` section
3. Add fresh empty `[Unreleased]` section above
4. Update CHANGELOG comparison links at bottom of file
5. Commit: `chore: release vX.Y.Z`
6. Tag: `git tag vX.Y.Z`
7. Push: `git push && git push origin vX.Y.Z`

This is enforced by a `postToolUse` hook on `git commit`. Never skip tagging.

### Code style
- Prefer "Cognitive AI Services" (not "Azure AI Services")
- No emojis in code or docs unless explicitly asked
- Keep files focused — components, hooks, and context in separate files
- API response fixtures come from real curl/backend output
- Never hardcode version strings — import `version` from `package.json` (single source of truth)

### Testing (ADR-0003)
- Every API mapping function gets a contract test
- Fixtures in `src/__fixtures__/` from real backend responses
- MSW intercepts at network level — same fetch code runs in tests and production
- Tests must pass in CI before merge

## Related repos
- `s:\Dev\meridian` — Python backend (uvicorn api.main:app)
- `s:\Dev\meridian-infra` — Terraform IaC for Azure
- `s:\Dev\meridian-mcp` — MCP server

## Azure Resources (meridian-rg)
- ACR: `meridian.azurecr.io`
- Container Apps: `meridian-studio`, `meridian-api`, `meridian-mcp`
- Cognitive Services: meridian-language, meridian-speech, meridian-vision-app, meridian-docintel-formrecognizer, meridian-openai, meridian-llm
- Azure AI Search: `meridian-search-tvp`
- Azure SQL: `meridian-db` (serverless GP_S_Gen5, westus2)
