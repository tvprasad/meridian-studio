# ADR-0001: Tech Stack

## Status

Accepted

## Context

Meridian Studio is the frontend console for Meridian. It needs to:

- Call Meridian APIs (governed RAG, MCP)
- Call Azure AI APIs (via Meridian)
- Display results with proper state management
- Look production-grade

## Decision

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | React + TypeScript | Industry standard, type safety |
| Build | Vite | Fast, modern |
| Styling | Tailwind CSS | Utility-first, no context switching |
| State | React Query | Server state management, caching |
| Routing | React Router | Standard, simple |
| Forms | React Hook Form + Zod | Validation, performance |
| Icons | Lucide React | Clean, consistent |

## Alternatives Considered

- Next.js: Overkill for admin console, adds SSR complexity
- Redux: Too heavy for this use case
- CSS Modules: Slower iteration than Tailwind

## Consequences

- Fast development with hot reload
- Type safety across API layer
- Consistent UI with Tailwind
- Easy to add new pages/features
