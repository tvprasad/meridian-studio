# ADR-0015: Sign-In Screen as Product Positioning Surface

**Status:** Accepted
**Date:** 2026-03-28
**Author:** Prasad / Claude Sonnet 4.6

---

## Context

The Meridian Studio sign-in screen was a minimal branded page: logo, tagline, sign-in button, and a placeholder "Trusted by" section with fictional company names (Contoso, Northwind, Fabrikam, Tailspin). The placeholder section carried no value and was never intended to ship as-is.

The sign-in screen is the first thing any new user, evaluator, or enterprise stakeholder sees before authentication. It is a positioning surface — the one moment before the product is used where the product can articulate its purpose.

## Decision

Replace the placeholder "Trusted by" section with three **use case problem cards** that represent the three compliance questions blocking enterprise AI deployment:

1. **Document Intelligence** — AI fabrication risk in analyst workflows
2. **Multi-Agent Orchestration** — auditability of multi-system agent actions
3. **AI Operations** — speed vs. human control in incident response

Replace the "Trusted by" footer with:
> *Built for regulated environments. Healthcare. Federal. Financial services. Legal.*

The sign-in card is constrained to `max-w-sm` within a `max-w-2xl` outer container so the three-column card grid has room on desktop while the sign-in button remains compact.

## Rationale

- **No new dependencies or files** — change is contained to `AuthGuard.tsx`
- **No auth flow changes** — the sign-in button, MSAL logic, and animated background are untouched
- **Intent probe preserved** — shown after sign-in card as before
- **Dark aesthetic match** — cards use `bg-white/5`, `border-white/10`, `text-violet-400` consistent with existing sign-in screen palette
- **Placeholder removal** — fictional company names (Contoso etc.) were a liability if seen by real customers; removing them is mandatory before any external demo

## Consequences

- First impression communicates the three core problems Meridian solves (document AI governance, multi-agent auditability, ops automation with control)
- Industry verticals (healthcare, federal, financial, legal) are surfaced before authentication — relevant to enterprise evaluation
- The three card headings align with the three capability clusters in aiPolaris and the Meridian product brief
- Cards are static content — no backend dependency, no localization needed at this stage
