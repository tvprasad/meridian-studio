# ADR-0013: Ops Copilot UI Integration

## Status

Accepted

## Context

Meridian backend (ADRs 0026-0031) implements a governed Ops Copilot: Jira-triggered investigations with a 12-state workflow, five agent roles, approval-gated execution, Tool Gateway enforcement, and full audit trace continuity. Meridian Studio currently has a single-agent "AI Operations Agent" page (ADR-0007) that runs ReAct queries in isolation. It does not represent investigations, workflow state, approvals, or audit traces.

Studio must evolve to surface the Ops Copilot as a first-class feature. This ADR defines the UI model, component mapping, API dependencies, and governance constraints.

## Decision

### 1. Investigation list page (`/investigations`)

A paginated list of all investigations with:

| Column | Source |
|--------|--------|
| Jira Key | `jira_key` (links to Jira) |
| Status | `status` (color-coded badge) |
| Type | `investigation_type` |
| Created | `created_at` |
| Updated | `updated_at` |
| Steps | `step_log.length` |

Filters:
- Status group: Active / Awaiting Approval / Terminal
- Individual status dropdown
- Search by Jira key or trace_id

Status badge colors:
- Research phases (INTAKE, RESEARCH, DATA_ANALYSIS, POLICY_EVALUATE): blue
- Approval gate (AWAITING_APPROVAL): amber, pulsing
- Approved/Executing: violet
- Completed: green
- No Action Required: gray
- Refused/Expired/Failed/Insufficient Data: red

### 2. Investigation detail view (`/investigations/:traceId`)

Three sections:

**Header** — Jira key, status badge, trace_id, timestamps, investigation type

**Workflow timeline** — Horizontal state machine visualization showing all 12 states. Current state is highlighted. Completed states show checkmarks. Future states are dimmed. The research-to-execution boundary is visually marked with a governance divider labeled "Approval Gate".

**Agent output panels** — Collapsible sections for each agent's output, shown only when populated:

| Section | Data | When visible |
|---------|------|-------------|
| Investigation Plan | scope, data sources, questions, priority | After INTAKE |
| Evidence | findings list with source citations | After RESEARCH |
| Analysis | summary, root cause, confidence, severity | After DATA_ANALYSIS |
| Policy Decision | rationale, risk score, execution plan | After POLICY_EVALUATE |
| Approval | approval_ref, timestamp | After APPROVED |
| Execution Result | step output, verification, rollback | After EXECUTING |

### 3. Approval UX

When an investigation is in `AWAITING_APPROVAL`:

- Prominent amber banner at top of detail view
- Shows: execution plan summary, blast radius, reversibility, steps with rollback commands
- Two actions: **Approve** (green) and **Reject** (red, requires reason)
- Approve calls `POST /ops/approve` with `trace_id` + `approval_ref`
- Reject calls `POST /ops/reject` with `trace_id` + `reason`
- Both require confirmation dialog before submission
- Plan hash is displayed but not editable — integrity verification is backend-enforced
- Approval actions respect MSAL auth — Bearer token required

A dedicated "Pending Approvals" badge on the sidebar shows the count of `AWAITING_APPROVAL` investigations.

### 4. Audit trace visualization

Chronological timeline of all `StepRecord` entries for an investigation:

| Field | Display |
|-------|---------|
| `step_number` | Numbered marker |
| `agent_role` | Color-coded label (one color per agent) |
| `action` | Description text |
| `status_before` / `status_after` | State transition badge |
| `tool_name` | Tool chip (if present) |
| `elapsed_ms` | Duration |
| `timestamp` | Relative time |

Tool input/output hashes are displayed (not raw data — no sensitive data exposure). Approval refs and plan IDs are shown on execution steps.

Agent role colors:
- Intake: sky
- Research: blue
- Analysis: violet
- Policy: amber
- Execution: red
- Machine (transitions): gray

### 5. Governance clarity

Visual elements that communicate system governance:

- **Research/Execution boundary**: A horizontal divider in the workflow timeline between POLICY_EVALUATE and AWAITING_APPROVAL, labeled "No execution without approval"
- **Audit badge**: "All actions audited" indicator on investigation header
- **Tool Gateway indicator**: Steps that went through the Tool Gateway show a shield icon
- **Capability badges**: Each agent section shows its allowed tools (from manifest)

### 6. System boundaries (ADR-0027, ADR-0031)

Studio constraints:
- All API calls go through `meridian-api` — Studio never contacts the Tool Gateway directly
- No database queries from Studio — all data via API endpoints
- Approval actions are API calls — Studio does not modify investigation state directly
- Studio displays tool names and hashes, never raw tool inputs/outputs (no sensitive data)

### 7. Required API endpoints

The backend currently has POST endpoints only. Studio needs these GET endpoints added to the backend (out of scope for this ADR, but documented as dependencies):

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/ops/investigations` | Paginated list with status filter |
| `GET` | `/ops/investigations/:trace_id` | Full investigation state + step_log |
| `GET` | `/ops/investigations/pending` | Count of AWAITING_APPROVAL |

These endpoints must be added to `ops_copilot/jira/router.py` on the backend. They read from the investigation store and return serialized state. No new write operations.

### 8. Component mapping

| Ops Copilot Concept | UI Component | Location |
|---------------------|-------------|----------|
| Investigation list | `InvestigationList` | `src/pages/Investigations.tsx` |
| Investigation detail | `InvestigationDetail` | `src/pages/InvestigationDetail.tsx` |
| Workflow state machine | `WorkflowTimeline` | `src/components/ops/WorkflowTimeline.tsx` |
| Approval action panel | `ApprovalPanel` | `src/components/ops/ApprovalPanel.tsx` |
| Audit trace timeline | `AuditTrace` | `src/components/ops/AuditTrace.tsx` |
| Pending approval badge | `PendingBadge` | `src/components/ops/PendingBadge.tsx` |
| Investigation status badge | `InvestigationBadge` | `src/components/ops/InvestigationBadge.tsx` |
| Agent output section | `AgentOutputPanel` | `src/components/ops/AgentOutputPanel.tsx` |

### 9. File structure

```
src/
  pages/
    Investigations.tsx           -- list view
    InvestigationDetail.tsx      -- detail view with all panels
  components/
    ops/
      WorkflowTimeline.tsx       -- 12-state horizontal timeline
      ApprovalPanel.tsx          -- approve/reject with plan display
      AuditTrace.tsx             -- chronological step timeline
      PendingBadge.tsx           -- sidebar approval count
      InvestigationBadge.tsx     -- status badge with colors
      AgentOutputPanel.tsx       -- collapsible agent output
  data/
    investigationStates.ts       -- status enum, colors, labels, groupings
  types/
    investigation.ts             -- TypeScript types mirroring backend state.py
```

### 10. Navigation

- Sidebar: "Investigations" item between "Ops Agent" and "Evaluation"
- Sidebar badge: pending approval count (amber dot)
- Route: `/investigations` (list), `/investigations/:traceId` (detail)

## Consequences

- Studio gains full visibility into the Ops Copilot workflow lifecycle
- Operators can approve/reject execution plans without leaving Studio
- Audit trace is reconstructable from the UI for any investigation
- Governance boundaries are visually reinforced at every decision point
- Backend must add 3 GET endpoints before the frontend is functional — this is a hard dependency
- The existing "Ops Agent" page (ADR-0007) remains for ad-hoc ReAct queries; Investigations is the governed workflow counterpart
- No Studio code touches the Tool Gateway or database directly — all through meridian-api
- Future: real-time investigation updates via WebSocket (not in scope for v1)
