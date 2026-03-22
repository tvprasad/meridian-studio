# ADR-0014: Runtime Provisioning UI

## Status

Accepted

## Context

Meridian backend (ADR-0035) implements governed runtime provisioning — a platform-admin workflow for creating, monitoring, and cancelling cloud runtime environments. The backend exposes admin-only APIs at `/admin/runtimes/*`. Meridian Studio needs a UI to interact with these APIs.

Key constraints:
- Studio must NEVER call AWS/Azure/GCP directly
- Studio must ONLY call backend admin APIs
- Tool Gateway is NOT involved in provisioning (separate domain)
- Ops Copilot UI must remain separate from provisioning UI
- All endpoints require platform-admin role

## Decision

Add a **Platform Admin** section to Meridian Studio with three pages for governed runtime provisioning. This section is role-gated, visually separated from the Ops Copilot workflow, and uses only backend HTTP APIs.

### Pages

| Page | Route | Backend Endpoint |
|------|-------|-----------------|
| Runtime Environments | `/admin/runtimes` | `GET /admin/runtimes` |
| Provision Runtime | `/admin/provision` | `POST /admin/runtimes` |
| Runtime Detail | `/admin/runtimes/:id` | `GET /admin/runtimes/:id` |

### Actions

| Action | Trigger | Backend Endpoint |
|--------|---------|-----------------|
| Create runtime | Form submit | `POST /admin/runtimes` |
| Start provisioning | Button on detail | `POST /admin/runtimes/:id/provision` |
| Cancel provisioning | Button + confirm | `POST /admin/runtimes/:id/cancel` |

### Polling

Active runtimes (non-terminal status) poll `GET /admin/runtimes/:id` every 3 seconds. Polling stops when status is `READY`, `FAILED`, or `CANCELLED`.

### Access Control

`AdminGuard` component wraps all admin pages. Checks for `operator`, `admin`, or `platform-admin` role in MSAL token claims. When auth is disabled, all users pass.

### Navigation

"Platform Admin" collapsible section in sidebar, below AI Lab. Contains:
- Runtimes (list)
- Provision (create form)

Collapsed by default. Separate from Ops Copilot's "Investigations" nav item.

### Component Structure

```
src/
  api/runtimes.ts                    -- types + API client
  data/provisioningStates.ts         -- status metadata, timeline phases
  components/admin/
    AdminGuard.tsx                   -- role-based access guard
    ProvisioningBadge.tsx            -- status badge with pulse
    ProvisioningTimeline.tsx         -- 6-phase horizontal timeline
  pages/
    Runtimes.tsx                    -- list page with KPI cards
    ProvisionRuntime.tsx            -- create form (name, cloud, region, config)
    RuntimeDetail.tsx               -- detail with polling, progress log, cancel
```

## Consequences

- Platform admins can provision and monitor runtime environments through Studio
- No cloud credentials are exposed to the frontend — all infrastructure work is backend-managed
- Provisioning UI is completely separate from Ops Copilot UI (different routes, different nav section, different API prefix)
- ADR-0026 trust boundaries are unchanged — provisioning does not involve the Tool Gateway
- ADR-0029 state machine is unchanged — provisioning has its own 8-state lifecycle
- Future: runtime logs streaming via WebSocket, multi-cluster dashboard
