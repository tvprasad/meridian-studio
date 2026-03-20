# ADR-0012: Sign-In Intent Probe

## Status

Accepted

## Context

Meridian behaves materially differently depending on deployment topology and usage intent:

- An evaluator testing retrieval confidence needs different default expectations than a team building a production pipeline.
- An on-prem deployment has no managed guardrails; retrieval validation and execution control carry more weight.
- A cloud deployment may rely on Azure managed services that change what "configured" means.

Today, users land on the sign-in screen with no context. The system has no signal about what they are trying to accomplish. This leads to friction: users hit unexpected behavior (confidence thresholds, retrieval refusals, temperature defaults) without knowing why.

The intent probe solves this without adding a wizard, a chatbot, or a multi-step setup flow. It is two optional questions shown once, before sign-in, that capture enough signal to surface a short contextual note.

## Decision

Add a lightweight intent probe to the sign-in screen. It consists of two questions, is fully skippable, does not block sign-in, and is shown only once per browser profile.

### What it is not

- Not a chatbot.
- Not a setup wizard.
- Not a product tour.
- Not required to proceed.

### Question 1 — Usage intent

Displayed immediately on the sign-in screen below the sign-in card.

**"How are you planning to use Meridian?"**

| Option | Key |
|--------|-----|
| Evaluate retrieval behavior | `evaluate` |
| Build a production system | `build` |
| Test locally (on-prem / private) | `test-local` |
| Explore capabilities | `explore` |

Single-select. Selecting an option advances to Question 2.

### Question 2 — Deployment topology

**"Where will this run?"**

| Option | Key |
|--------|-----|
| Cloud | `cloud` |
| Hybrid | `hybrid` |
| On-prem | `on-prem` |

Single-select. Selecting an option renders the contextual response and a "Sign in" button.

### Contextual response

Two to three lines, plain language. Shown after both answers are collected. Keyed on the `(intent, topology)` pair. Representative examples:

| Intent | Topology | Response |
|--------|----------|----------|
| `evaluate` | `on-prem` | Meridian behaves differently depending on how it's deployed. In on-prem environments, execution control and retrieval validation become more important since there are no managed guardrails. |
| `build` | `cloud` | Cloud deployments rely on Azure managed services for guardrails and scaling. Retrieval thresholds and audit trails are still configured in Meridian — the platform does not manage them automatically. |
| `test-local` | `on-prem` | Local and on-prem deployments control their own retrieval stack. Confidence thresholds and refusal behavior should be tuned before connecting any production data. |
| `explore` | `*` | Confidence scores, refusal behavior, and retrieval thresholds are all visible in the Query console. The Evaluation page logs every decision for review. |

Fallback: if no response is defined for a combination, a generic two-line note is shown.

### Skip path

A "Skip" link is present at all times. Clicking it proceeds directly to sign-in. No selection is stored.

### Persistence

Selections are stored in `localStorage` under the key `meridian-intent-probe`. Structure:

```json
{
  "intent": "build",
  "topology": "cloud",
  "completedAt": "2026-03-20T00:00:00.000Z"
}
```

If `meridian-intent-probe` exists in `localStorage`, the probe is not shown again. The sign-in screen renders normally.

### Component placement

The probe renders below the sign-in card inside `AuthGuard`, only when:
- Auth is enabled
- The user is not authenticated
- `localStorage` does not contain a completed probe record

It does not replace the sign-in card. Both are visible. Sign-in can be triggered at any point.

### File structure

```
src/
  components/
    ui/
      IntentProbe.tsx     — probe UI (questions + contextual response)
  data/
    intentResponses.ts    — response copy keyed by (intent, topology)
```

`IntentProbe` is a pure presentational component. It receives an `onComplete(intent, topology)` callback and an `onSkip` callback. Persistence and sign-in triggering are handled by the caller (`AuthGuard`).

## Consequences

- First-time users receive a short, relevant note that explains system constraints before they encounter them.
- The probe adds no latency — it is static, no API calls.
- Returning users see no change — probe is suppressed after first completion or skip.
- Probe data stays in `localStorage`; it is not sent to the backend. Future work could surface it in the sidebar or pass it to the API as a session hint.
- The two-question limit is a hard constraint. Any future request to add a third question should be treated as scope creep and rejected.
- If MSAL auth is disabled (`VITE_AUTH_ENABLED=false`), the probe is not shown — there is no sign-in screen.
